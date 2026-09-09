"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ListBusinessPopup() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 3000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="list-business-popup" role="dialog" aria-label="List your business">
      <button type="button" className="lbp-close" onClick={() => setVisible(false)} aria-label="Dismiss">×</button>
      <p className="lbp-title">Own a shop in Bhadrak?</p>
      <p className="lbp-body">List it on haat and let more customers find you.</p>
      <Link href="/signup" className="admin-btn primary lbp-cta">List your business</Link>
    </div>
  );
}
