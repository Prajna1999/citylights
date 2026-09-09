import fs from "node:fs";
import path from "node:path";
import type { Db } from "mongodb";
import { CATEGORIES } from "@/lib/categories";
import { DB_NAME, REPORTS_COLLECTION, SHOPS_COLLECTION, USERS_COLLECTION, ensureIndexes, mongo } from "@/lib/mongo";
import { daysSince, formatDate, type ReportItem, type Shop, type ShopStatus, type User } from "@/lib/types";

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
    return await run(db);
  } catch (error) {
    if (!warnedFallback) {
      warnedFallback = true;
      console.warn(`[haat] MongoDB unavailable (${error instanceof Error ? error.message : error}) — falling back to local JSON.`);
    }
    return fallback();
  }
}

/** Accounts require a real database — there is no local-JSON fallback for auth. */
async function requireDb(): Promise<Db> {
  const clientPromise = mongo();
  if (!clientPromise) throw new Error("MONGODB_URI is not set — accounts require a database.");
  const client = await clientPromise;
  await ensureIndexes(client);
  return client.db(DB_NAME);
}

type ShopDoc = Omit<Shop, never> & { _id?: unknown };
type ReportDoc = ReportItem & { _id?: unknown };
type UserDoc = User & { _id?: unknown };

function stripId<T extends { _id?: unknown }>(doc: T): T {
  const clone = { ...doc };
  delete clone._id;
  return clone;
}

async function readLocalShops(): Promise<Shop[]> {
  const shops = readJson<Shop[]>(SHOPS_FILE, []);
  if (!fs.existsSync(SHOPS_FILE)) writeJson(SHOPS_FILE, shops);
  return shops;
}

async function readLocalReports(): Promise<ReportItem[]> {
  return readJson<ReportItem[]>(REPORTS_FILE, []);
}

const jsonShops = async (): Promise<Shop[]> => readLocalShops();

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
    readLocalReports,
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

/** A listing counts as verified enough once it's been checked within this many days. */
export const STALE_AFTER_DAYS = 90;

/** Whether a queue entry still needs a look — unverified, or verified more than STALE_AFTER_DAYS ago. */
export function needsVerification(entry: Pick<QueueEntry, "lastVerifiedAt" | "staleDays">): boolean {
  return !entry.lastVerifiedAt || (entry.staleDays !== null && entry.staleDays > STALE_AFTER_DAYS);
}

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

/** Shops shown on the public site — excludes listings still awaiting super admin approval. */
export async function visibleShops(): Promise<Shop[]> {
  return (await allShops()).filter((shop) => shop.approvalStatus !== "pending");
}

export async function shopsByOwner(ownerId: string): Promise<Shop[]> {
  return (await allShops()).filter((shop) => shop.ownerId === ownerId);
}

export async function pendingShops(): Promise<Shop[]> {
  return (await allShops()).filter((shop) => shop.approvalStatus === "pending");
}

export async function approveShop(slug: string) {
  const shop = await getShop(slug);
  if (!shop) throw new Error(`Unknown shop: ${slug}`);
  const now = new Date().toISOString();
  await saveShop({ ...shop, approvalStatus: "approved", lastVerifiedAt: now, verified: formatDate(now) });
}

export async function createUser(user: User): Promise<void> {
  const db = await requireDb();
  await db.collection<UserDoc>(USERS_COLLECTION).insertOne(user);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = await requireDb();
  const doc = await db.collection<UserDoc>(USERS_COLLECTION).findOne({ email: email.toLowerCase() });
  return doc ? stripId(doc) : undefined;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const db = await requireDb();
  const doc = await db.collection<UserDoc>(USERS_COLLECTION).findOne({ id });
  return doc ? stripId(doc) : undefined;
}
