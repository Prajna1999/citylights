import Link from "next/link";
import { shops } from "@/lib/shops";
import { reportQueue, verificationQueue } from "@/lib/admin";

const stats = [
  { label: "Shops in registry", value: String(shops.length), note: "from OpenStreetMap + curated", trend: "+204 this week" },
  { label: "Coverage estimate", value: "78%", note: "of ~105 shops mapped", trend: "+4% since May" },
  { label: "Awaiting verification", value: String(verificationQueue.length), note: "oldest from 2 days ago", trend: "keep the queue clean" },
  { label: "Open reports", value: String(reportQueue.filter((r) => r.status === "open").length), note: "crowd-sourced signals", trend: "1 resolved today" },
];

const quick = [
  { href: "/admin/add", icon: "+", title: "Add a shop", note: "Name → category → phone → photo → pin → timings. Under 90 seconds." },
  { href: "/admin/verify", icon: "✓", title: "Verify listings", note: "Work through the queue, oldest first." },
  { href: "/admin/reports", icon: "◌", title: "Review reports", note: "Townsfolk flag what has changed." },
];

export default function AdminDashboard() {
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
            <small className="stat-trend">{stat.trend}</small>
          </div>
        ))}
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
        {verificationQueue.slice(0, 3).map((item) => (
          <div className="qp-item" key={item.id}>
            <span><strong>{item.shopName}</strong><br /><span>{item.area} · {item.category}</span></span>
            <span className="badge warn">{item.needs}</span>
          </div>
        ))}
      </div>
      <Link href="/admin/verify" className="admin-btn secondary section-link">Open full queue →</Link>
    </div>
  );
}
