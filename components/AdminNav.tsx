"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/types";

const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", icon: "▦" },
  { href: "/admin/my-businesses", label: "My businesses", icon: "☰" },
  { href: "/admin/add", label: "Add business", icon: "+" },
];

const SUPERADMIN_NAV = [
  { href: "/admin", label: "Dashboard", icon: "▦" },
  { href: "/admin/approvals", label: "Approvals", icon: "✓" },
  { href: "/admin/shops", label: "All businesses", icon: "☰" },
  { href: "/admin/verify", label: "Verify", icon: "◍" },
  { href: "/admin/reports", label: "Reports", icon: "◌" },
];

export default function AdminNav({ role, logout }: { role: UserRole; logout: () => void }) {
  const pathname = usePathname();
  const nav = role === "superadmin" ? SUPERADMIN_NAV : ADMIN_NAV;

  return (
    <nav className="admin-nav" aria-label="Admin">
      <div className="admin-nav-items">
        {nav.map((item) => {
          const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={active ? "admin-nav-item active" : "admin-nav-item"} aria-current={active ? "page" : undefined}>
              <span className="an-icon">{item.icon}</span><span className="an-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
      <form action={logout} className="admin-nav-logout">
        <button type="submit" className="admin-nav-item admin-nav-logout-btn">
          <span className="an-icon">⇥</span><span className="an-label">Log out</span>
        </button>
      </form>
    </nav>
  );
}
