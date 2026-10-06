"use client";

import { useState, type FormEvent } from "react";
import { ApiError, api } from "@/lib/api";
import { describeError } from "@/lib/messages";
import type { Plan } from "@/lib/types";

export default function AddCustomerForm({
  plans,
  onAdded,
  onSessionLost,
}: {
  plans: Plan[];
  onAdded: () => Promise<void>;
  onSessionLost: () => void;
}) {
  const [email, setEmail] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const toggle = (slug: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
    setSuccess(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setError("יש להזין כתובת מייל.");
      return;
    }
    if (selected.size === 0) {
      setError("יש לבחור לפחות תוכנית אחת.");
      return;
    }

    setBusy(true);
    try {
      const created = await api.addUser(trimmed, [...selected]);
      setEmail("");
      setSelected(new Set());
      setSuccess(`${created.email} נוסף/ה. אפשר להתחבר מעכשיו עם Google.`);
      await onAdded();
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        onSessionLost();
        return;
      }
      setError(describeError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      noValidate
      className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5"
    >
      <h2 className="font-heading text-headline-sm font-bold">הוספת לקוח</h2>

      <div className="flex flex-col gap-2">
        <label htmlFor="customer-email" className="text-body-md text-text-secondary">
          כתובת מייל (חשבון ה-Google של הלקוח)
        </label>
        <input
          id="customer-email"
          type="email"
          dir="ltr"
          autoComplete="off"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setSuccess(null);
          }}
          placeholder="name@gmail.com"
          className="h-11 rounded-xl border border-border-emphasis bg-well px-4 text-body-lg text-text-primary placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
        />
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-body-md text-text-secondary">
          תוכניות שנרכשו (כל תוכנית מתחילה ברמה 1 - רגיל)
        </legend>
        {plans.length === 0 ? (
          <p className="text-body-md text-text-muted">אין תוכניות להצגה.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {plans.map((plan) => {
              const checked = selected.has(plan.slug);
              return (
                <label
                  key={plan.slug}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-body-lg transition ${
                    checked
                      ? "border-ember bg-surface-raised"
                      : "border-border bg-well hover:border-border-emphasis"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(plan.slug)}
                    className="size-4 accent-ember"
                  />
                  <span>{plan.nameHe ?? plan.slug}</span>
                </label>
              );
            })}
          </div>
        )}
      </fieldset>

      {error && (
        <p role="alert" className="text-body-md text-danger">
          {error}
        </p>
      )}
      {success && (
        <p role="status" aria-live="polite" className="text-body-md text-volt">
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="h-12 rounded-full bg-ember font-heading text-body-lg font-bold text-canvas shadow-glow-ember transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
      >
        {busy ? "מוסיף..." : "הוספה"}
      </button>
    </form>
  );
}
