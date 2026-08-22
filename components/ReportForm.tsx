"use client";

import { useActionState } from "react";
import { submitReport, type FormState } from "@/lib/actions";

const INITIAL: FormState = { ok: false, message: "" };

export default function ReportForm({ shopName }: { shopName: string }) {
  const [state, action, pending] = useActionState(submitReport, INITIAL);

  if (state.ok) {
    return (
      <div className="report-box report-thanks">
        <strong>✓ Report received</strong>
        <p>{state.message}</p>
      </div>
    );
  }

  return (
    <div className="report-box">
      <strong>Something look wrong?</strong>
      <p>Help us keep Bhadrak&apos;s directory useful.</p>
      <form action={action} className="report-form">
        <input type="hidden" name="shopName" value={shopName} />
        <textarea name="body" rows={3} required minLength={5} placeholder="What has changed? e.g. closed down, moved, wrong number" aria-label={`Report a problem with ${shopName}`} />
        <input name="phone" inputMode="tel" placeholder="Your number (optional)" aria-label="Your phone number, optional" />
        {state.message && !state.ok ? <p className="report-error" role="alert">{state.message}</p> : null}
        <button type="submit" className="admin-btn primary report-submit" disabled={pending}>
          {pending ? "Sending…" : "Send report"}
        </button>
      </form>
    </div>
  );
}
