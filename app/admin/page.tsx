import Link from "next/link";
import { BarChart, DonutChart } from "@/components/DashboardCharts";
import { requireUser } from "@/lib/auth";
import { allReports, allShops, needsVerification, pendingShops, shopsByOwner, verificationQueue } from "@/lib/db";
import { daysSince } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const user = await requireUser();
  return user.role === "superadmin" ? <SuperadminDashboard /> : <OwnerDashboard ownerId={user.id} businessName={user.businessName} />;
}

async function OwnerDashboard({ ownerId, businessName }: { ownerId: string; businessName: string }) {
  const businesses = await shopsByOwner(ownerId);
  const pending = businesses.filter((shop) => shop.approvalStatus === "pending").length;
  const approved = businesses.length - pending;

  return (
    <div>
      <div className="admin-head inline">
        <h1>Namaste, {businessName}</h1>
        <p>Manage the businesses you&apos;ve listed on haat.</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card"><strong>{businesses.length}</strong><span>Your businesses</span><small>{approved} live · {pending} pending review</small></div>
        <div className="stat-card"><strong>{pending}</strong><span>Awaiting approval</span><small>A super admin reviews new listings</small></div>
      </div>

      <div className="quick-grid">
        <Link className="quick-card" href="/admin/add">
          <span className="qc-icon">+</span>
          <span><h3>Add a business</h3><p>Submit a new listing for approval.</p></span>
          <span className="qc-arrow">→</span>
        </Link>
        <Link className="quick-card" href="/admin/my-businesses">
          <span className="qc-icon">▦</span>
          <span><h3>My businesses</h3><p>{businesses.length ? `View and edit all ${businesses.length}.` : "Nothing listed yet."}</p></span>
          <span className="qc-arrow">→</span>
        </Link>
      </div>

      {businesses.length > 0 && (
        <>
          <h2 className="section-title">Your businesses</h2>
          <div className="queue-preview">
            {businesses.slice(0, 5).map((shop) => (
              <Link className="qp-item" href={`/admin/shops/${shop.slug}`} key={shop.slug}>
                <span><strong>{shop.name}</strong><br /><span>{shop.category}{shop.area ? ` · ${shop.area}` : ""}</span></span>
                <span className={shop.approvalStatus === "pending" ? "badge open" : "badge resolved"}>{shop.approvalStatus === "pending" ? "Pending review" : "Live"}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

async function SuperadminDashboard() {
  const all = await allShops();
  const queue = await verificationQueue();
  const reports = await allReports();
  const pending = await pendingShops();

  const active = all.filter((shop) => (shop.status ?? "active") === "active").length;
  const tempClosed = all.filter((shop) => shop.status === "temporarily_closed").length;
  const permClosed = all.filter((shop) => shop.status === "permanently_closed").length;
  const dueForVerification = queue.filter(needsVerification);
  const stale = dueForVerification.filter((entry) => entry.lastVerifiedAt).length;
  const neverVerified = dueForVerification.length - stale;
  const fresh = queue.length - dueForVerification.length;
  const openReports = reports.filter((report) => report.status === "open");
  const oldest = queue[0];

  const categoryCounts = new Map<string, number>();
  for (const shop of all) categoryCounts.set(shop.category, (categoryCounts.get(shop.category) ?? 0) + 1);
  const topCategories = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value]) => ({ label, value }));

  const stats = [
    { label: "Pending approval", value: String(pending.length), note: "owner-submitted listings waiting on you" },
    { label: "Shops in registry", value: String(all.length), note: `${active} active · ${tempClosed} temporarily closed · ${permClosed} permanently closed` },
    { label: "Never verified", value: String(neverVerified), note: "listings with no check on record" },
    { label: "Open reports", value: String(openReports.length), note: "crowd-sourced signals waiting" },
  ];

  const quick = [
    { href: "/admin/approvals", icon: "✓", title: "Approve businesses", note: pending.length ? `${pending.length} waiting on your review.` : "Nothing waiting right now." },
    { href: "/admin/add", icon: "+", title: "Add a shop", note: "Name → category → phone → photo → pin → timings. Under 90 seconds." },
    { href: "/admin/shops", icon: "▦", title: "Browse the registry", note: `Search and edit all ${all.length} records.` },
    { href: "/admin/verify", icon: "◍", title: "Verify listings", note: "Work through the queue, oldest first." },
    { href: "/admin/reports", icon: "◌", title: "Review reports", note: "Townsfolk flag what has changed." },
  ];

  return (
    <div>
      <div className="admin-head inline">
        <h1>Namaste, curator</h1>
        <p>Here is how Bhadrak&apos;s directory is doing today.</p>
      </div>

      <div className="dashboard-layout">
        <div className="dashboard-main">
          <div className="stat-grid">
            {stats.map((stat) => (
              <div className="stat-card" key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
                <small>{stat.note}</small>
              </div>
            ))}
          </div>

          <div className="chart-grid">
            <DonutChart
              title="Shop status"
              note={`${all.length} total`}
              segments={[
                { label: "Active", value: active, color: "#52a76f" },
                { label: "Temporarily closed", value: tempClosed, color: "#e0a23c" },
                { label: "Permanently closed", value: permClosed, color: "#c3564a" },
              ]}
            />
            <BarChart title="Top categories" note="by number of shops" rows={topCategories} />
          </div>

          <div className="quick-grid">
            {quick.map((item) => (
              <Link className="quick-card" href={item.href} key={item.href}>
                <span className="qc-icon">{item.icon}</span>
                <span><h3>{item.title}</h3><p>{item.note}</p></span>
                <span className="qc-arrow">→</span>
              </Link>
            ))}
            <div className="quick-grid-note">
              <span>Verification queue · oldest first</span>
              <Link href="/admin/verify">Open full queue →</Link>
            </div>
          </div>

          <div className="queue-preview">
            {dueForVerification.length === 0 ? (
              <div className="admin-empty">Nothing due — every listing has been checked recently.</div>
            ) : (
              dueForVerification.slice(0, 5).map((entry) => (
                <Link className="qp-item" href={`/admin/shops/${entry.shop.slug}`} key={entry.shop.slug}>
                  <span><strong>{entry.shop.name}</strong><br /><span>{entry.shop.area || "Area unknown"} · {entry.shop.category}</span></span>
                  <span className="badge warn">{entry.needs}{entry.staleDays !== null ? ` · ${entry.staleDays}d` : ""}</span>
                </Link>
              ))
            )}
          </div>

          {openReports.length > 0 && (
            <>
              <h2 className="section-title">Latest problem reports</h2>
              <div className="queue-preview">
                {openReports.slice(0, 3).map((report) => (
                  <Link className="qp-item" href="/admin/reports" key={report.id}>
                    <span><strong>{report.shopName}</strong><br /><span>{report.body.slice(0, 64)}{report.body.length > 64 ? "…" : ""}</span></span>
                    <span className="badge open">{daysSince(report.createdAt) <= 0 ? "Today" : `${daysSince(report.createdAt)}d ago`}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        <aside className="dashboard-aside">
          <div className="health-card vertical">
            <div className="health-head">
              <span>Verification health</span>
              <strong>{all.length ? Math.round(((fresh + stale) / all.length) * 100) : 0}% checked at least once</strong>
            </div>
            <div className="health-bar" role="img" aria-label={`${fresh} fresh, ${stale} stale, ${neverVerified} never verified`}>
              <i className="h-fresh" style={{ flexGrow: fresh }} />
              <i className="h-stale" style={{ flexGrow: stale }} />
              <i className="h-none" style={{ flexGrow: neverVerified }} />
            </div>
            <div className="health-legend"><span><i className="dot fresh" /> Fresh · ≤90 days ({fresh})</span><span><i className="dot stale" /> Stale &gt;90 days ({stale})</span><span><i className="dot none" /> Never verified ({neverVerified})</span></div>
            {oldest?.lastVerifiedAt ? (
              <small>Oldest check on record: {oldest.shop.name} · {oldest.staleDays} days ago</small>
            ) : (
              <small>No listing has been verified yet — start with Add shop or the queue below.</small>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
