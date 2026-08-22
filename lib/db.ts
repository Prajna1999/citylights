import fs from "node:fs";
import path from "node:path";
import { CATEGORIES } from "@/lib/categories";
import { daysSince, formatDate, type ReportItem, type Shop, type ShopStatus } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data", "app");
const SHOPS_FILE = path.join(DATA_DIR, "establishments.app.json");
const REPORTS_FILE = path.join(DATA_DIR, "reports.json");
export { CATEGORIES };

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

export function allShops(): Shop[] {
  return readJson<Shop[]>(SHOPS_FILE, []);
}

export function getShop(slug: string): Shop | undefined {
  return allShops().find((shop) => shop.slug === slug);
}

export function saveShop(updated: Shop) {
  const shops = allShops();
  const index = shops.findIndex((shop) => shop.slug === updated.slug);
  if (index === -1) throw new Error(`Unknown shop: ${updated.slug}`);
  shops[index] = updated;
  writeJson(SHOPS_FILE, shops);
}

export function appendShop(shop: Shop) {
  const shops = allShops();
  shops.push(shop);
  writeJson(SHOPS_FILE, shops);
}

export function uniqueSlug(name: string) {
  const taken = new Set(allShops().map((shop) => shop.slug));
  let slug = name;
  for (let i = 2; taken.has(slug); i += 1) slug = `${name}-${i}`;
  return slug;
}

export function allReports(): ReportItem[] {
  return readJson<ReportItem[]>(REPORTS_FILE, []);
}

export function saveReports(reports: ReportItem[]) {
  writeJson(REPORTS_FILE, reports);
}

export type QueueEntry = {
  shop: Shop;
  lastVerifiedAt: string | null;
  needs: "New listing" | "Re-verify";
  staleDays: number | null;
};

export function verificationQueue(): QueueEntry[] {
  return allShops()
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

export function verifyShopBySlug(slug: string) {
  const shop = getShop(slug);
  if (!shop) throw new Error(`Unknown shop: ${slug}`);
  const now = new Date().toISOString();
  saveShop({ ...shop, status: shop.status ?? "active", statusNote: undefined, lastVerifiedAt: now, verified: formatDate(now) });
}

export function setShopStatusBySlug(slug: string, status: ShopStatus) {
  const shop = getShop(slug);
  if (!shop) throw new Error(`Unknown shop: ${slug}`);
  saveShop({ ...shop, status });
}
