import Link from "next/link";
import { approveShopAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { getUserById, pendingShops } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  await requireRole("superadmin");
  const pending = await pendingShops();
  const owners = await Promise.all(pending.map((shop) => (shop.ownerId ? getUserById(shop.ownerId) : undefined)));

  return (
    <div>
      <div className="admin-head">
        <h1>Approvals</h1>
        <p>{pending.length} business{pending.length === 1 ? "" : "es"} waiting for review.</p>
      </div>

      {pending.length === 0 ? (
        <div className="admin-empty">Nothing waiting. New submissions from business owners will show up here.</div>
      ) : (
        <div className="queue-list">
          {pending.map((shop, index) => {
            const owner = owners[index];
            return (
              <article className="queue-item" key={shop.slug}>
                <div className="queue-item-head">
                  <div>
                    <h3><Link href={`/admin/shops/${shop.slug}`}>{shop.name}</Link></h3>
                    {shop.local ? <p className="local-name">{shop.local}</p> : null}
                  </div>
                  <span className="badge open">Pending</span>
                </div>
                <div className="queue-meta">
                  <span>{shop.category}</span>
                  <span>{shop.area || "area unknown"}</span>
                  {owner ? <span>Submitted by {owner.businessName} ({owner.email})</span> : null}
                </div>
                <div className="queue-item-actions">
                  <form action={approveShopAction}>
                    <input type="hidden" name="slug" value={shop.slug} />
                    <button className="admin-btn success" type="submit">✓ Verify</button>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
