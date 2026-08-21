"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/admin", label: "Dashboard", icon: "▦" },
  { href: "/admin/add", label: "Add shop", icon: "+" },
  { href: "/admin/verify", label: "Verify", icon: "✓" },
  { href: "/admin/reports", label: "Reports", icon: "◌" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <Link href="/admin" className="brand"><span className="brand-mark">H</span><span>haat<span className="brand-dot">.</span></span></Link>
        <span className="admin-role">Curator · Bhadrak</span>
        <Link href="/" className="admin-site-link">View site ↗</Link>
      </header>
      <nav className="admin-nav" aria-label="Admin">
        {nav.map((item) => {
          const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={active ? "admin-nav-item active" : "admin-nav-item"} aria-current={active ? "page" : undefined}>
              <span className="an-icon">{item.icon}</span><span className="an-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <main className="admin-main">{children}</main>
    </div>
  );
}
