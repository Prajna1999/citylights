import Link from "next/link";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/admin");

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link href="/" className="brand"><span className="brand-mark">ହ</span><span>haat<span className="brand-dot">.</span></span></Link>
        <h1>Log in</h1>
        <p>For business owners and administrators.</p>
        <LoginForm />
        <p className="auth-switch">New here? <Link href="/signup">Register your business</Link></p>
      </div>
    </main>
  );
}
