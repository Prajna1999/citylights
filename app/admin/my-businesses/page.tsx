import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { shopsByOwner } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function MyBusinessesPage() {
  const user = await requireUser();
  const businesses = await shopsByOwner(user.id);

  return (
    <div>
      <div className="admin-head">
        <h1>My businesses</h1>
        <p>{businesses.length} listed under your account.</p>
      </div>

      {businesses.length === 0 ? (
        <div className="admin-empty">
          You haven&apos;t added a business yet. <Link href="/admin/add">Add one now →</Link>
        </div>
      ) : (
        <div className="registry-list">
          {businesses.map((shop) => (
            <Link className="registry-row" href={`/admin/shops/${shop.slug}`} key={shop.slug}>
              <div className="rr-main">
                <strong>{shop.name}</strong>
                {shop.local ? <em className="rr-local">{shop.local}</em> : null}
                <span>{shop.category}{shop.area ? ` · ${shop.area}` : ""}</span>
              </div>
              <div className="rr-badges">
                <span className={shop.approvalStatus === "pending" ? "badge open" : "badge resolved"}>
                  {shop.approvalStatus === "pending" ? "Pending review" : "Live"}
                </span>
              </div>
              <span className="rr-arrow">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
