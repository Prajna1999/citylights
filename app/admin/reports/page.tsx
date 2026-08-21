"use client";

import { useState } from "react";
import { reportQueue, type ReportItem } from "@/lib/admin";

export default function ReportsPage() {
  const [items, setItems] = useState<ReportItem[]>(reportQueue);
  const [tab, setTab] = useState<"open" | "resolved">("open");

  const visible = items.filter((report) => (tab === "open" ? report.status === "open" : report.status === "resolved"));
  const toggle = (id: string) =>
    setItems((list) => list.map((report) => report.id === id ? { ...report, status: report.status === "open" ? "resolved" : "open" } : report));

  return (
    <div>
      <div className="admin-head">
        <h1>Problem reports</h1>
        <p>Your only crowd-sourced signal in v1. It shows what is stale.</p>
      </div>

      <div className="filter-tabs" role="tablist" aria-label="Filter reports">
        <button className={tab === "open" ? "active" : ""} onClick={() => setTab("open")}>Open ({items.filter((r) => r.status === "open").length})</button>
        <button className={tab === "resolved" ? "active" : ""} onClick={() => setTab("resolved")}>Resolved</button>
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
                <span>{report.createdAt}</span>
                <span>Reporter {report.phone}</span>
              </div>
              <div className="queue-item-actions">
                <button className="admin-btn secondary" onClick={() => toggle(report.id)}>
                  {report.status === "open" ? "✓ Mark resolved" : "Reopen"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
