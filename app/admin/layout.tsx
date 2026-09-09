import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import { requireUser } from "@/lib/auth";
import { logout } from "@/lib/auth-actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <Link href="/admin" className="brand"><span className="brand-mark">ହ</span><span>haat<span className="brand-dot">.</span></span></Link>
        <span className="admin-role">{user.role === "superadmin" ? "Super admin" : user.businessName}</span>
        <span className="admin-topbar-actions">
          <Link href="/" className="admin-site-link">View site ↗</Link>
          <form action={logout} className="topbar-logout-mobile">
            <button type="submit" className="admin-site-link admin-logout-btn">Log out</button>
          </form>
        </span>
      </header>
      <div className="admin-body">
        <AdminNav role={user.role} logout={logout} />
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
