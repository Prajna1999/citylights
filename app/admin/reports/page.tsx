import Link from "next/link";
import { setReportStatus } from "@/lib/actions";
import { allReports } from "@/lib/db";
import { daysSince, formatDate } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const activeTab = tab === "resolved" ? "resolved" : "open";

  const reports = await allReports();
  const open = reports.filter((report) => report.status === "open");
  const visible = activeTab === "open" ? open : reports.filter((report) => report.status === "resolved");

  return (
    <div>
      <div className="admin-head">
        <h1>Problem reports</h1>
        <p>Your only crowd-sourced signal in v1. It shows what is stale.</p>
      </div>

      <div className="filter-tabs" role="tablist" aria-label="Filter reports">
        <Link role="tab" aria-selected={activeTab === "open"} className={activeTab === "open" ? "active" : ""} href="/admin/reports">Open ({open.length})</Link>
        <Link role="tab" aria-selected={activeTab === "resolved"} className={activeTab === "resolved" ? "active" : ""} href="/admin/reports?tab=resolved">Resolved ({reports.length - open.length})</Link>
      </div>

      {visible.length === 0 ? (
        <div className="admin-empty">Nothing here. Good news.</div>
      ) : (
        <div className="queue-list">
          {visible.map((report) => (
            <article className="queue-item" key={report.id}>
              <div className="queue-item-head">
                <h3>{report.shopName}</h3>
                <span className={report.status === "open" ? "badge open" : "badge resolved"}>{report.status === "open" ? "Open" : "Resolved"}</span>
              </div>
              <div className="queue-item-body">{report.body}</div>
              <div className="queue-meta">
                <span>{formatDate(report.createdAt)} · {daysSince(report.createdAt) <= 0 ? "today" : `${daysSince(report.createdAt)}d ago`}</span>
                <span>Reporter {report.phone}</span>
              </div>
              <div className="queue-item-actions">
                <form action={setReportStatus}>
                  <input type="hidden" name="id" value={report.id} />
                  <input type="hidden" name="next" value={report.status === "open" ? "resolved" : "open"} />
                  <button className="admin-btn secondary" type="submit">
                    {report.status === "open" ? "✓ Mark resolved" : "Reopen"}
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="save-note">Tip: fix the listing from the <Link href="/admin/shops">registry</Link>, then mark the report resolved.</p>
    </div>
  );
}
