"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { describeError } from "@/lib/messages";
import type { CurrentUser } from "@/lib/types";
import { AdminSessionContext } from "./AdminSession";
import GoogleSignIn from "./GoogleSignIn";
import Avatar from "./ui/Avatar";
import Backdrop from "./ui/Backdrop";
import Button from "./ui/Button";
import { LogoutIcon } from "./ui/icons";

type View =
  | { kind: "loading" }
  | { kind: "signed-out"; notice?: string }
  | { kind: "no-access"; email: string }
  | { kind: "ready"; user: CurrentUser }
  | { kind: "error"; message: string };

const NAV_ITEMS = [
  { href: "/", label: "משתמשים", also: [] as string[] },
  { href: "/add", label: "הוספת לקוח", also: [] as string[] },
  { href: "/waitlist", label: "רשימת המתנה", also: [] as string[] },
  { href: "/plans", label: "תוכניות ואימונים", also: ["/workouts"] },
  { href: "/exercises", label: "בנק תרגילים", also: [] as string[] },
];

/** The page itself, or (for plans) any page below it, like a level or a workout being edited. */
function isActive(item: (typeof NAV_ITEMS)[number], pathname: string): boolean {
  if (pathname === item.href) return true;
  return item.href !== "/" && [item.href, ...item.also].some((base) => pathname.startsWith(`${base}/`));
}

function Logo({ className }: { className: string }) {
  return (
    <Image
      src="/logo-transparent.png"
      alt="FitFam"
      width={640}
      height={573}
      priority
      className={className}
    />
  );
}

/** Full-screen card used for login, loading, errors and "no access". */
function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <Backdrop>
      <main className="flex flex-1 items-center justify-center px-gutter py-12">
        <div className="animate-rise flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl border border-border bg-surface/90 p-8 text-center shadow-header backdrop-blur-md">
          {children}
        </div>
      </main>
    </Backdrop>
  );
}

function Header({ user, onLogout }: { user: CurrentUser; onLogout: () => void }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/80 shadow-header backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-gutter py-3">
        <div className="flex items-center gap-3">
          <Logo className="h-9 w-auto" />
          <span className="rounded-md border border-border-emphasis px-2 py-0.5 text-label-md font-semibold text-text-secondary">
            ניהול
          </span>
        </div>

        <nav
          aria-label="ניווט ראשי"
          className="order-last flex w-full gap-1 overflow-x-auto rounded-full border border-border bg-well p-1 md:order-none md:w-auto"
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(item, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex-1 whitespace-nowrap rounded-full px-5 py-1.5 text-center text-body-md font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember md:flex-none ${
                  active
                    ? "bg-surface-high text-text-primary shadow-header"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Avatar name={user.displayName ?? user.email} />
            <span dir="ltr" className="hidden text-body-md text-text-secondary sm:inline">
              {user.email}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout} aria-label="התנתקות">
            <LogoutIcon />
            <span className="hidden sm:inline">התנתקות</span>
          </Button>
        </div>
      </div>
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
          <Logo className="h-14 w-auto" />
          <p role="status" className="text-body-md text-text-muted">
            טוען...
          </p>
        </CenteredCard>
      );

    case "error":
      return (
        <CenteredCard>
          <Logo className="h-14 w-auto" />
          <p role="alert" className="text-body-md text-ember">
            {view.message}
          </p>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            נסו שוב
          </Button>
        </CenteredCard>
      );

    case "signed-out":
      return (
        <CenteredCard>
          <Logo className="h-16 w-auto" />
          <div className="flex flex-col gap-2">
            <h1 className="font-heading text-headline-md font-extrabold">ניהול FitFam</h1>
            <p className="text-body-md text-text-secondary">
              כלי פנימי לצוות. התחברו עם חשבון ה-Google של המנהל.
            </p>
          </div>
          <GoogleSignIn onCredential={handleCredential} />
          {view.notice && (
            <p role="alert" className="text-body-md text-ember">
              {view.notice}
            </p>
          )}
        </CenteredCard>
      );

    case "no-access":
      return (
        <CenteredCard>
          <Logo className="h-14 w-auto" />
          <div className="flex flex-col gap-2">
            <h1 className="font-heading text-headline-md font-extrabold">אין גישה</h1>
            <p className="text-body-md text-text-secondary">
              החשבון <span dir="ltr">{view.email}</span> אינו מנהל.
            </p>
          </div>
          <Button variant="secondary" onClick={() => void handleLogout()}>
            התנתקות
          </Button>
        </CenteredCard>
      );

    case "ready":
      return (
        <AdminSessionContext.Provider value={session}>
          <Backdrop>
            <Header user={view.user} onLogout={() => void handleLogout()} />
            <main className="animate-rise mx-auto flex w-full max-w-6xl flex-col gap-6 px-gutter py-8">
              {children}
            </main>
          </Backdrop>
        </AdminSessionContext.Provider>
      );
  }
}
