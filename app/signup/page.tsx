import Link from "next/link";
import { redirect } from "next/navigation";
import SignupForm from "@/components/SignupForm";
import { getCurrentUser } from "@/lib/auth";

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/admin");

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link href="/" className="brand"><span className="brand-mark">ହ</span><span>haat<span className="brand-dot">.</span></span></Link>
        <h1>Register your business</h1>
        <p>List your shop in Bhadrak&apos;s directory. A super admin reviews new listings before they go live.</p>
        <SignupForm />
        <p className="auth-switch">Already have an account? <Link href="/login">Log in</Link></p>
      </div>
    </main>
  );
}
