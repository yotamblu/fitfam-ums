"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { describeError } from "@/lib/messages";
import type { CurrentUser } from "@/lib/types";
import { AdminSessionContext } from "./AdminSession";
import GoogleSignIn from "./GoogleSignIn";

type View =
  | { kind: "loading" }
  | { kind: "signed-out"; notice?: string }
  | { kind: "no-access"; email: string }
  | { kind: "ready"; user: CurrentUser }
  | { kind: "error"; message: string };

const NAV_ITEMS = [
  { href: "/", label: "משתמשים" },
  { href: "/waitlist", label: "רשימת המתנה" },
];

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl border border-border bg-surface p-8 text-center">
        {children}
      </div>
    </main>
  );
}

function Header({ user, onLogout }: { user: CurrentUser; onLogout: () => void }) {
  const pathname = usePathname();
  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-headline-md font-extrabold">FitFam · ניהול</h1>
        <div className="flex items-center gap-3 text-body-md text-text-secondary">
          <span dir="ltr">{user.email}</span>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-full border border-border-emphasis px-4 py-1.5 text-text-primary transition hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
          >
            התנתקות
          </button>
        </div>
      </div>
      <nav aria-label="ניווט ראשי" className="flex gap-2 border-b border-border pb-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-full px-4 py-1.5 text-body-md font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember ${
                active
                  ? "bg-surface-raised text-text-primary"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

/**
 * Login and layout shared by every admin page: decides what to show (login, no access, or the page itself with the
 * header and navigation), and gives pages the logged-in admin through `useAdminSession`.
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<View>({ kind: "loading" });

  const applyUser = useCallback((user: CurrentUser) => {
    setView(
      user.role === "admin"
        ? { kind: "ready", user }
        : { kind: "no-access", email: user.email },
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then((user) => {
        if (!cancelled) applyUser(user);
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 401) {
          setView({ kind: "signed-out" });
        } else {
          setView({ kind: "error", message: describeError(e) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [applyUser]);

  const handleCredential = useCallback(
    async (credential: string) => {
      try {
        applyUser(await api.loginWithGoogle(credential));
      } catch (e) {
        setView({ kind: "signed-out", notice: describeError(e) });
      }
    },
    [applyUser],
  );

  const handleLogout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setView({ kind: "signed-out" });
    }
  }, []);

  const handleSessionLost = useCallback(() => {
    setView({ kind: "signed-out", notice: "החיבור פג או שאין הרשאה. התחברו שוב." });
  }, []);

  const session = useMemo(
    () => (view.kind === "ready" ? { user: view.user, onSessionLost: handleSessionLost } : null),
    [view, handleSessionLost],
  );

  switch (view.kind) {
    case "loading":
      return (
        <CenteredCard>
          <p className="text-body-md text-text-muted">טוען...</p>
        </CenteredCard>
      );

    case "error":
      return (
        <CenteredCard>
          <p role="alert" className="text-body-md text-danger">
            {view.message}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full border border-border-emphasis px-5 py-2 text-body-md hover:bg-surface-raised"
          >
            נסו שוב
          </button>
        </CenteredCard>
      );

    case "signed-out":
      return (
        <CenteredCard>
          <h1 className="font-heading text-headline-md font-extrabold">
            FitFam · ניהול משתמשים
          </h1>
          <p className="text-body-md text-text-secondary">
            כלי פנימי. התחברו עם חשבון ה-Google של המנהל.
          </p>
          <GoogleSignIn onCredential={handleCredential} />
          {view.notice && (
            <p role="alert" className="text-body-md text-danger">
              {view.notice}
            </p>
          )}
        </CenteredCard>
      );

    case "no-access":
      return (
        <CenteredCard>
          <h1 className="font-heading text-headline-md font-extrabold">אין גישה</h1>
          <p className="text-body-md text-text-secondary">
            החשבון <span dir="ltr">{view.email}</span> אינו מנהל.
          </p>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="rounded-full border border-border-emphasis px-5 py-2 text-body-md hover:bg-surface-raised"
          >
            התנתקות
          </button>
        </CenteredCard>
      );

    case "ready":
      return (
        <AdminSessionContext.Provider value={session}>
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8">
            <Header user={view.user} onLogout={() => void handleLogout()} />
            {children}
          </div>
        </AdminSessionContext.Provider>
      );
  }
}
