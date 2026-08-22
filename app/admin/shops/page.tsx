import Link from "next/link";
import { CATEGORIES } from "@/lib/db";
import { shops } from "@/lib/shops";
import type { Shop } from "@/lib/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

const STATUS_FILTERS = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "temporarily_closed", label: "Temporarily closed" },
  { value: "permanently_closed", label: "Permanently closed" },
];

const VERIFY_FILTERS = [
  { value: "", label: "Any verification" },
  { value: "never", label: "Never verified" },
  { value: "stale", label: "Stale · >90 days" },
  { value: "fresh", label: "Fresh · ≤90 days" },
];

function verifyBucket(shop: Shop) {
  if (!shop.lastVerifiedAt) return "never";
  return Math.floor((Date.now() - new Date(shop.lastVerifiedAt).getTime()) / 86_400_000) <= 90 ? "fresh" : "stale";
}

function statusBadge(shop: Shop) {
  switch (shop.status ?? "active") {
    case "temporarily_closed":
      return <span className="badge warn">Temp closed</span>;
    case "permanently_closed":
      return <span className="badge danger">Permanently closed</span>;
    default:
      return <span className="badge neutral">Active</span>;
  }
}

function verifyBadge(shop: Shop) {
  const bucket = verifyBucket(shop);
  if (bucket === "never") return <span className="badge open">Never verified</span>;
  if (bucket === "stale") return <span className="badge warn">Stale</span>;
  return <span className="badge resolved">✓ Verified</span>;
}

function buildQuery(params: Record<string, string>, overrides: Record<string, string>) {
  const merged = { ...params, ...overrides };
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) if (value) query.set(key, value);
  const asString = query.toString();
  return `/admin/shops${asString ? `?${asString}` : ""}`;
}

export default async function AdminShopsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolved = await searchParams;
  const params = {
    q: typeof resolved.q === "string" ? resolved.q : "",
    category: typeof resolved.category === "string" ? resolved.category : "",
    status: typeof resolved.status === "string" ? resolved.status : "",
    verified: typeof resolved.verified === "string" ? resolved.verified : "",
    page: typeof resolved.page === "string" ? resolved.page : "1",
  };

  const normalized = params.q.toLowerCase();
  const filtered = shops().filter((shop) => {
    if (params.category && shop.categoryId !== params.category) return false;
    if (params.status && (shop.status ?? "active") !== params.status) return false;
    if (params.verified && verifyBucket(shop) !== params.verified) return false;
    if (!normalized) return true;
    return `${shop.name} ${shop.local} ${shop.category} ${shop.area} ${shop.owner ?? ""}`.toLowerCase().includes(normalized);
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(Math.max(Number.parseInt(params.page, 10) || 1, 1), pageCount);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="admin-head">
        <h1>Registry</h1>
        <p>{filtered.length} of {shops().length} listings{filtered.length !== shops().length ? " match your filters" : ""}.</p>
      </div>

      <form className="admin-toolbar" method="get" action="/admin/shops">
        <input type="search" name="q" defaultValue={params.q} placeholder="Search name, area, owner…" aria-label="Search shops" />
        <select name="category" defaultValue={params.category} aria-label="Filter by category">
          <option value="">All categories</option>
          {CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <select name="status" defaultValue={params.status} aria-label="Filter by status">
          {STATUS_FILTERS.map((filter) => <option key={filter.value} value={filter.value}>{filter.label}</option>)}
        </select>
        <select name="verified" defaultValue={params.verified} aria-label="Filter by verification">
          {VERIFY_FILTERS.map((filter) => <option key={filter.value} value={filter.value}>{filter.label}</option>)}
        </select>
        <button className="admin-btn secondary" type="submit">Apply</button>
        <Link className="admin-btn ghost" href="/admin/shops">Reset</Link>
      </form>

      {visible.length === 0 ? (
        <div className="admin-empty">No listings match. Try fewer filters.</div>
      ) : (
        <div className="registry-list">
          {visible.map((shop) => (
            <Link className="registry-row" href={`/admin/shops/${shop.slug}`} key={shop.slug}>
              <div className="rr-main">
                <strong>{shop.name}</strong>
                {shop.local ? <em className="rr-local">{shop.local}</em> : null}
                <span>{shop.category}{shop.area ? ` · ${shop.area}` : ""}{shop.phone ? "" : " · no phone"}</span>
              </div>
              <div className="rr-badges">
                {statusBadge(shop)}
                {verifyBadge(shop)}
              </div>
              <span className="rr-arrow">→</span>
            </Link>
          ))}
        </div>
      )}

      {pageCount > 1 && (
        <nav className="pager" aria-label="Pages">
          {page > 1 ? <Link className="admin-btn secondary" href={buildQuery(params, { page: String(page - 1) })}>← Previous</Link> : <span />}
          <small>Page {page} of {pageCount}</small>
          {page < pageCount ? <Link className="admin-btn secondary" href={buildQuery(params, { page: String(page + 1) })}>Next →</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
