"use client";

import { useState } from "react";
import { verificationQueue, type VerificationItem } from "@/lib/admin";

export default function VerifyPage() {
  const [queue, setQueue] = useState<VerificationItem[]>(verificationQueue);
  const [done, setDone] = useState<string[]>([]);

  const verify = (id: string) => setDone((d) => [...d, id]);
  const skip = (id: string) => setQueue((q) => q.filter((item) => item.id !== id));

  const pending = queue.filter((item) => !done.includes(item.id));

  return (
    <div>
      <div className="admin-head">
        <h1>Verification queue</h1>
        <p>{pending.length} to check · sorted by last verified, oldest first.</p>
      </div>

      {pending.length === 0 ? (
        <div className="admin-empty">Queue is clear. Every listing is verified — nice work.</div>
      ) : (
        <div className="queue-list">
          {pending.map((item) => (
            <article className="queue-item" key={item.id}>
              <div className="queue-item-head">
                <div>
                  <h3>{item.shopName}</h3>
                  <p className="local-name">{item.local}</p>
                </div>
                <span className={item.needs === "New listing" ? "badge open" : "badge warn"}>{item.needs}</span>
              </div>
              <div className="queue-meta">
                <span>{item.category}</span>
                <span>{item.area}</span>
                <span>Last verified {item.lastVerified}</span>
              </div>
              <div className="queue-item-actions">
                <button className="admin-btn success" onClick={() => verify(item.id)}>✓ Verify now</button>
                <button className="admin-btn ghost" onClick={() => skip(item.id)}>Skip</button>
              </div>
              <p className="submitted">Submitted {item.submitted}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
