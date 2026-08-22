import fs from "node:fs";
import path from "node:path";
import type { Db } from "mongodb";
import { CATEGORIES } from "@/lib/categories";
import { DB_NAME, REPORTS_COLLECTION, SHOPS_COLLECTION, ensureIndexes, mongo } from "@/lib/mongo";
import { daysSince, formatDate, type ReportItem, type Shop, type ShopStatus } from "@/lib/types";

export { CATEGORIES };

const DATA_DIR = path.join(process.cwd(), "data", "app");
const SHOPS_FILE = path.join(DATA_DIR, "establishments.app.json");
const REPORTS_FILE = path.join(DATA_DIR, "reports.json");

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function writeJson(file: string, value: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tmp, file);
}

let warnedFallback = false;
let seeded = false;

/** Runs a query against MongoDB. Falls back to the local JSON files when the DB is unreachable or unconfigured. */
async function withMongo<T>(run: (db: Db) => Promise<T>, fallback: () => T | Promise<T>): Promise<T> {
  const clientPromise = mongo();
  if (!clientPromise) {
    if (!warnedFallback) {
      warnedFallback = true;
      console.warn("[haat] MONGODB_URI not set — using local JSON files.");
    }
    return fallback();
  }
  try {
    const client = await clientPromise;
    await ensureIndexes(client);
    const db = client.db(DB_NAME);
    if (!seeded) {
      seeded = true;
      await seedIfEmpty(db);
    }
    return await run(db);
  } catch (error) {
    if (!warnedFallback) {
      warnedFallback = true;
      console.warn(`[haat] MongoDB unavailable (${error instanceof Error ? error.message : error}) — falling back to local JSON.`);
    }
    return fallback();
  }
}

type ShopDoc = Omit<Shop, never> & { _id?: unknown };
type ReportDoc = ReportItem & { _id?: unknown };

function stripId<T extends { _id?: unknown }>(doc: T): T {
  const clone = { ...doc };
  delete clone._id;
  return clone;
}

async function seedShops(): Promise<Shop[]> {
  const shops = readJson<Shop[]>(SHOPS_FILE, []);
  if (!fs.existsSync(SHOPS_FILE)) writeJson(SHOPS_FILE, shops);
  return shops;
}

async function seedReports(): Promise<ReportItem[]> {
  return readJson<ReportItem[]>(REPORTS_FILE, []);
}

async function seedIfEmpty(db: Db) {
  const shopsCol = db.collection(SHOPS_COLLECTION);
  if ((await shopsCol.countDocuments()) === 0) {
    const seed = await seedShops();
    if (seed.length) await shopsCol.insertMany(seed.map((shop) => ({ ...shop })));
  }
  const reportsCol = db.collection(REPORTS_COLLECTION);
  if ((await reportsCol.countDocuments()) === 0) {
    const seed = await seedReports();
    if (seed.length) await reportsCol.insertMany(seed.map((report) => ({ ...report })));
  }
}

const jsonShops = async (): Promise<Shop[]> => seedShops();

export async function allShops(): Promise<Shop[]> {
  const docs = await withMongo(
    async (db) => {
      const rows = await db
        .collection<ShopDoc>(SHOPS_COLLECTION)
        .find({})
        .sort({ name: 1 })
        .toArray();
      return rows.map(stripId);
    },
    jsonShops,
  );
  return docs;
}

export async function getShop(slug: string): Promise<Shop | undefined> {
  return withMongo(
    async (db) => {
      const doc = await db.collection<ShopDoc>(SHOPS_COLLECTION).findOne({ slug });
      return doc ? stripId(doc) : undefined;
    },
    async () => (await jsonShops()).find((shop) => shop.slug === slug),
  );
}

export async function saveShop(updated: Shop): Promise<void> {
  await withMongo(
    async (db) => {
      await db.collection<ShopDoc>(SHOPS_COLLECTION).replaceOne({ slug: updated.slug }, updated, { upsert: true });
      return null;
    },
    async () => {
      const shops = await jsonShops();
      const index = shops.findIndex((shop) => shop.slug === updated.slug);
      if (index === -1) throw new Error(`Unknown shop: ${updated.slug}`);
      shops[index] = updated;
      writeJson(SHOPS_FILE, shops);
      return null;
    },
  );
}

export async function appendShop(shop: Shop): Promise<void> {
  await withMongo(
    async (db) => {
      await db.collection<ShopDoc>(SHOPS_COLLECTION).insertOne(shop);
      return null;
    },
    async () => {
      const shops = await jsonShops();
      shops.push(shop);
      writeJson(SHOPS_FILE, shops);
      return null;
    },
  );
}

export async function uniqueSlug(name: string): Promise<string> {
  const taken = new Set((await allShops()).map((shop) => shop.slug));
  let slug = name;
  for (let i = 2; taken.has(slug); i += 1) slug = `${name}-${i}`;
  return slug;
}

export async function allReports(): Promise<ReportItem[]> {
  return withMongo(
    async (db) => {
      const rows = await db.collection<ReportDoc>(REPORTS_COLLECTION).find({}).sort({ createdAt: -1 }).toArray();
      return rows.map(stripId);
    },
    seedReports,
  );
}

export async function saveReports(reports: ReportItem[]): Promise<void> {
  await withMongo(
    async (db) => {
      const col = db.collection<ReportDoc>(REPORTS_COLLECTION);
      await col.deleteMany({});
      if (reports.length) await col.insertMany(reports.map((report) => ({ ...report })));
      return null;
    },
    () => {
      writeJson(REPORTS_FILE, reports);
      return Promise.resolve(null);
    },
  );
}

export type QueueEntry = {
  shop: Shop;
  lastVerifiedAt: string | null;
  needs: "New listing" | "Re-verify";
  staleDays: number | null;
};

export async function verificationQueue(): Promise<QueueEntry[]> {
  return (await allShops())
    .filter((shop) => (shop.status ?? "active") !== "permanently_closed")
    .map((shop) => {
      const lastVerifiedAt = shop.lastVerifiedAt ?? null;
      return {
        shop,
        lastVerifiedAt,
        needs: lastVerifiedAt ? ("Re-verify" as const) : ("New listing" as const),
        staleDays: lastVerifiedAt ? daysSince(lastVerifiedAt) : null,
      };
    })
    .sort((a, b) => {
      if (!a.lastVerifiedAt && !b.lastVerifiedAt) return a.shop.name.localeCompare(b.shop.name);
      if (!a.lastVerifiedAt) return -1;
      if (!b.lastVerifiedAt) return 1;
      return a.lastVerifiedAt.localeCompare(b.lastVerifiedAt);
    });
}

export async function verifyShopBySlug(slug: string) {
  const shop = await getShop(slug);
  if (!shop) throw new Error(`Unknown shop: ${slug}`);
  const now = new Date().toISOString();
  await saveShop({ ...shop, status: shop.status ?? "active", statusNote: undefined, lastVerifiedAt: now, verified: formatDate(now) });
}

export async function setShopStatusBySlug(slug: string, status: ShopStatus) {
  const shop = await getShop(slug);
  if (!shop) throw new Error(`Unknown shop: ${slug}`);
  await saveShop({ ...shop, status });
}
