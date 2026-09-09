"use client";

import { useActionState } from "react";
import { signup, type AuthFormState } from "@/lib/auth-actions";

const INITIAL_STATE: AuthFormState = { ok: true, message: "" };

export default function SignupForm() {
  const [state, action, pending] = useActionState(signup, INITIAL_STATE);

  return (
    <form action={action} className="auth-form">
      <div className="field">
        <label htmlFor="su-business">Business name</label>
        <input id="su-business" name="businessName" placeholder="e.g. Samrat Stationery" autoComplete="organization" required />
      </div>
      <div className="field">
        <label htmlFor="su-email">Email</label>
        <input id="su-email" name="email" type="email" placeholder="you@business.com" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="su-password">Password</label>
        <input id="su-password" name="password" type="password" placeholder="At least 8 characters" autoComplete="new-password" required minLength={8} />
      </div>
      <div className="field">
        <label htmlFor="su-confirm">Confirm password</label>
        <input id="su-confirm" name="confirmPassword" type="password" placeholder="Re-enter your password" autoComplete="new-password" required minLength={8} />
      </div>
      {!state.ok && state.message && <p className="flash error" role="alert">{state.message}</p>}
      <button className="admin-btn primary" type="submit" disabled={pending}>
        {pending ? "Creating account…" : "Register your business"}
      </button>
    </form>
  );
}
