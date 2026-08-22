import Link from "next/link";
import { allReports, verificationQueue } from "@/lib/db";
import { shops } from "@/lib/shops";
import { daysSince } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function AdminDashboard() {
  const all = shops();
  const queue = verificationQueue();
  const reports = allReports();

  const active = all.filter((shop) => (shop.status ?? "active") === "active").length;
  const tempClosed = all.filter((shop) => shop.status === "temporarily_closed").length;
  const permClosed = all.filter((shop) => shop.status === "permanently_closed").length;
  const fresh = queue.filter((entry) => entry.lastVerifiedAt && entry.staleDays !== null && entry.staleDays <= 90).length;
  const stale = queue.filter((entry) => entry.staleDays !== null && entry.staleDays > 90).length;
  const neverVerified = queue.length - fresh - stale;
  const openReports = reports.filter((report) => report.status === "open");
  const oldest = queue[0];

  const stats = [
    { label: "Shops in registry", value: String(all.length), note: `${active} active · ${tempClosed} temporarily closed · ${permClosed} permanently closed` },
    { label: "Never verified", value: String(neverVerified), note: "listings with no check on record" },
    { label: "Stale · over 90 days", value: String(stale), note: "verified once, but a while ago" },
    { label: "Open reports", value: String(openReports.length), note: "crowd-sourced signals waiting" },
  ];

  const quick = [
    { href: "/admin/add", icon: "+", title: "Add a shop", note: "Name → category → phone → photo → pin → timings. Under 90 seconds." },
    { href: "/admin/shops", icon: "▦", title: "Browse the registry", note: `Search and edit all ${all.length} records.` },
    { href: "/admin/verify", icon: "✓", title: "Verify listings", note: "Work through the queue, oldest first." },
    { href: "/admin/reports", icon: "◌", title: "Review reports", note: "Townsfolk flag what has changed." },
  ];

  return (
    <div>
      <div className="admin-head">
        <h1>Namaste, curator</h1>
        <p>Here is how Bhadrak&apos;s directory is doing today.</p>
      </div>

      <div className="stat-grid">
        {stats.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
            <small>{stat.note}</small>
          </div>
        ))}
      </div>

      <div className="health-card">
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

      <h2 className="section-title">Start here</h2>
      <div className="quick-grid">
        {quick.map((item) => (
          <Link className="quick-card" href={item.href} key={item.href}>
            <span className="qc-icon">{item.icon}</span>
            <span><h3>{item.title}</h3><p>{item.note}</p></span>
            <span className="qc-arrow">→</span>
          </Link>
        ))}
      </div>

      <h2 className="section-title">Verification queue · oldest first</h2>
      <div className="queue-preview">
        {queue.slice(0, 5).map((entry) => (
          <Link className="qp-item" href={`/admin/shops/${entry.shop.slug}`} key={entry.shop.slug}>
            <span><strong>{entry.shop.name}</strong><br /><span>{entry.shop.area || "Area unknown"} · {entry.shop.category}</span></span>
            <span className="badge warn">{entry.needs}{entry.staleDays !== null ? ` · ${entry.staleDays}d` : ""}</span>
          </Link>
        ))}
      </div>
      <Link href="/admin/verify" className="admin-btn secondary section-link">Open full queue →</Link>

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
  );
}
