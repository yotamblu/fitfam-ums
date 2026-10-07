"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ApiError, api } from "@/lib/api";
import { describeError } from "@/lib/messages";
import type { Customer, Plan } from "@/lib/types";
import { useAdminSession } from "./AdminSession";
import Button, { buttonClasses } from "./ui/Button";
import Chip from "./ui/Chip";
import { CheckIcon } from "./ui/icons";
import PageHeader from "./ui/PageHeader";

export default function AddUserPage() {
  const { onSessionLost } = useAdminSession();
  // Arriving from the waitlist ("הוספה כלקוח") pre-fills the email.
  const fromWaitlist = useSearchParams().get("email")?.trim() ?? "";

  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [email, setEmail] = useState(fromWaitlist);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Customer | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .listPlans()
      .then((data) => {
        if (!cancelled) setPlans(data);
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          onSessionLost();
          return;
        }
        setPlansError(describeError(e));
      });
    return () => {
      cancelled = true;
    };
  }, [onSessionLost]);

  const toggle = (slug: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const reset = () => {
    setCreated(null);
    setEmail("");
    setSelected(new Set());
    setError(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

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
      setCreated(await api.addUser(trimmed, [...selected]));
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

  if (created) {
    return (
      <>
        <PageHeader title="הוספת לקוח" />
        <section
          role="status"
          aria-live="polite"
          className="flex max-w-xl flex-col gap-5 rounded-2xl border border-volt/40 bg-surface p-6 shadow-glow-volt"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-volt text-canvas">
              <CheckIcon />
            </span>
            <div className="flex flex-col">
              <h2 className="font-heading text-headline-sm font-bold">הלקוח נוסף</h2>
              <span dir="ltr" className="text-start text-body-md text-text-secondary">
                {created.email}
              </span>
            </div>
          </div>
          <p className="text-body-md text-text-secondary">
            מרגע זה אפשר להתחבר ל-FitFam עם חשבון ה-Google הזה.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {created.enrollments.map((enrollment) => (
              <Chip key={enrollment.planSlug} tone="info">
                {enrollment.planNameHe ?? enrollment.planSlug}
                <span className="text-text-secondary">· רמה {enrollment.levelNumber}</span>
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={reset}>
              הוספת לקוח נוסף
            </Button>
            <Link href="/" className={buttonClasses({ variant: "secondary", size: "lg" })}>
              לרשימת המשתמשים
            </Link>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="הוספת לקוח"
        description="מוסיפים את המייל של הלקוח ואת התוכניות שרכש. אחר כך הוא יכול להתחבר עם Google."
      />

      <form
        onSubmit={submit}
        noValidate
        className="flex max-w-xl flex-col gap-6 rounded-2xl border border-border bg-surface p-6"
      >
        {fromWaitlist && (
          <p className="rounded-xl border border-info/40 bg-info/10 px-4 py-3 text-body-md text-info">
            הכתובת הגיעה מרשימת ההמתנה. נשאר לבחור תוכניות.
          </p>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="customer-email" className="text-body-md font-semibold">
            מייל (חשבון ה-Google של הלקוח)
          </label>
          <input
            id="customer-email"
            type="email"
            dir="ltr"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@gmail.com"
            className="h-12 rounded-xl border border-border-emphasis bg-well px-4 text-start text-body-lg text-text-primary placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
          />
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-body-md font-semibold">תוכניות שנרכשו</legend>
          {plansError && (
            <p role="alert" className="text-body-md text-ember">
              {plansError}
            </p>
          )}
          {!plans && !plansError && <p className="text-body-md text-text-muted">טוען תוכניות...</p>}
          {plans && (
            <div className="grid gap-2 sm:grid-cols-2">
              {plans.map((plan) => {
                const checked = selected.has(plan.slug);
                return (
                  <label
                    key={plan.slug}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-body-lg font-semibold transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ember ${
                      checked
                        ? "border-ember bg-surface-raised shadow-glow-ember"
                        : "border-border bg-well hover:border-border-emphasis"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(plan.slug)}
                      className="sr-only"
                    />
                    <span>{plan.nameHe ?? plan.slug}</span>
                    <span
                      aria-hidden="true"
                      className={`flex size-6 items-center justify-center rounded-full border transition ${
                        checked
                          ? "border-ember bg-ember text-canvas"
                          : "border-border-emphasis text-transparent"
                      }`}
                    >
                      <CheckIcon className="size-3.5" />
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          <p className="text-body-sm text-text-muted">כל תוכנית מתחילה ברמה הראשונה.</p>
        </fieldset>

        {error && (
          <p role="alert" className="rounded-xl border border-ember/40 bg-ember/10 px-4 py-3 text-body-md text-ember">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" fullWidth disabled={busy || !plans}>
          {busy ? "מוסיף..." : "הוספת לקוח"}
        </Button>
      </form>
    </>
  );
}
