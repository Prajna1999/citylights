import Link from "next/link";
import { verifyShopAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { needsVerification, verificationQueue } from "@/lib/db";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function VerifyPage() {
  await requireRole("superadmin");
  const due = (await verificationQueue()).filter(needsVerification);
  const visible = due.slice(0, PAGE_SIZE);

  return (
    <div>
      <div className="admin-head">
        <h1>Verification queue</h1>
        <p>{due.length} listings to keep honest · sorted by last verified, oldest first.</p>
      </div>

      {visible.length === 0 ? (
        <div className="admin-empty">Queue is clear. Every listing is verified — nice work.</div>
      ) : (
        <>
          <div className="queue-list">
            {visible.map(({ shop, lastVerifiedAt, needs, staleDays }) => (
              <article className="queue-item" key={shop.slug}>
                <div className="queue-item-head">
                  <div>
                    <h3>{shop.name}</h3>
                    {shop.local ? <p className="local-name">{shop.local}</p> : null}
                  </div>
                  <span className={needs === "New listing" ? "badge open" : "badge warn"}>{needs}</span>
                </div>
                <div className="queue-meta">
                  <span>{shop.category}</span>
                  <span>{shop.area || "area unknown"}</span>
                  <span>{lastVerifiedAt ? `Last verified ${staleDays}d ago` : "Never verified"}</span>
                  {shop.phone ? null : <span className="meta-warn">No phone on record</span>}
                </div>
                <div className="queue-item-actions">
                  <form action={verifyShopAction}>
                    <input type="hidden" name="slug" value={shop.slug} />
                    <button className="admin-btn success" type="submit">✓ Verify now</button>
                  </form>
                  <Link className="admin-btn ghost" href={`/admin/shops/${shop.slug}`}>Check &amp; edit</Link>
                </div>
              </article>
            ))}
          </div>
          {due.length > visible.length && (
            <p className="save-note">Showing the {visible.length} most urgent of {due.length}. The rest follow once these are done.</p>
          )}
        </>
      )}
    </div>
  );
}
