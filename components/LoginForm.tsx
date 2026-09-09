"use client";

import { useActionState } from "react";
import { login, type AuthFormState } from "@/lib/auth-actions";

const INITIAL_STATE: AuthFormState = { ok: true, message: "" };

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, INITIAL_STATE);

  return (
    <form action={action} className="auth-form">
      <div className="field">
        <label htmlFor="li-email">Email</label>
        <input id="li-email" name="email" type="email" placeholder="you@business.com" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="li-password">Password</label>
        <input id="li-password" name="password" type="password" placeholder="Your password" autoComplete="current-password" required />
      </div>
      {!state.ok && state.message && <p className="flash error" role="alert">{state.message}</p>}
      <button className="admin-btn primary" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Log in"}
      </button>
    </form>
  );
}
