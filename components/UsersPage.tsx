"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { describeError } from "@/lib/messages";
import type { Customer } from "@/lib/types";
import { useAdminSession } from "./AdminSession";
import Avatar from "./ui/Avatar";
import Button, { buttonClasses } from "./ui/Button";
import Chip from "./ui/Chip";
import { PlusIcon } from "./ui/icons";
import PageHeader from "./ui/PageHeader";
import SearchInput from "./ui/SearchInput";
import SegmentedControl from "./ui/SegmentedControl";
import StatCard from "./ui/StatCard";

type StatusFilter = "all" | "active" | "invited";

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("he-IL") : "—";
}

function UserRow({ customer }: { customer: Customer }) {
  const active = customer.status === "active";
  return (
    <li className="grid items-center gap-x-4 gap-y-3 rounded-xl border border-border bg-surface px-4 py-3 transition hover:border-border-emphasis md:grid-cols-[minmax(0,2fr)_7rem_minmax(0,2.4fr)_7rem]">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={customer.displayName ?? customer.email} />
        <div className="flex min-w-0 flex-col">
          <span dir="ltr" className="truncate text-start text-body-lg font-semibold">
            {customer.email}
          </span>
          {customer.displayName && (
            <span className="truncate text-body-sm text-text-muted">{customer.displayName}</span>
          )}
        </div>
        {customer.role === "admin" && <Chip tone="ember">מנהל</Chip>}
      </div>

      <div>
        <Chip tone={active ? "volt" : "neutral"}>
          <span className={`size-1.5 rounded-full ${active ? "bg-volt" : "bg-text-muted"}`} />
          {active ? "פעיל" : "הוזמן"}
        </Chip>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {customer.enrollments.length === 0 ? (
          <span className="text-body-md text-text-muted">אין תוכניות</span>
        ) : (
          customer.enrollments.map((enrollment) => (
            <Chip key={enrollment.planSlug} tone="info">
              {enrollment.planNameHe ?? enrollment.planSlug}
              <span className="text-text-secondary">
                · רמה {enrollment.levelNumber}
                {enrollment.levelNameHe ? ` ${enrollment.levelNameHe}` : ""}
              </span>
            </Chip>
          ))
        )}
      </div>

      <div className="flex items-center justify-between gap-2 text-body-sm text-text-muted md:flex-col md:items-start md:justify-center md:gap-0">
        <span>התחברות ראשונה</span>
        <span dir="ltr" className="text-body-md text-text-secondary">
          {formatDate(customer.firstLoginAt)}
        </span>
      </div>
    </li>
  );
}

export default function UsersPage() {
  const { onSessionLost } = useAdminSession();
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    let cancelled = false;
    api
      .listUsers()
      .then((data) => {
        if (cancelled) return;
        setCustomers(data);
        setError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          onSessionLost();
          return;
        }
        setError(describeError(e));
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey, onSessionLost]);

  const stats = useMemo(() => {
    const all = customers ?? [];
    return {
      total: all.length,
      active: all.filter((c) => c.status === "active").length,
      invited: all.filter((c) => c.status === "invited").length,
      admins: all.filter((c) => c.role === "admin").length,
    };
  }, [customers]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (customers ?? []).filter(
      (c) =>
        (filter === "all" || c.status === filter) &&
        (!needle ||
          c.email.toLowerCase().includes(needle) ||
          (c.displayName ?? "").toLowerCase().includes(needle)),
    );
  }, [customers, filter, query]);

  return (
    <>
      <PageHeader
        title="משתמשים"
        description="כל מי שיש לו גישה ל-FitFam, עם הסטטוס והתוכניות שלו."
        actions={
          <Link href="/add" className={buttonClasses({ size: "lg" })}>
            <PlusIcon />
            הוספת לקוח
          </Link>
        }
      />

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ember/40 bg-ember/10 p-4 text-body-md text-ember"
        >
          <span>{error}</span>
          <Button variant="secondary" size="sm" onClick={() => setReloadKey((k) => k + 1)}>
            נסו שוב
          </Button>
        </div>
      )}

      {!customers && !error && <p className="text-body-md text-text-muted">טוען...</p>}

      {customers && (
        <>
          <section aria-label="סיכום" className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="סה״כ משתמשים" value={stats.total} />
            <StatCard label="פעילים" value={stats.active} tone="volt" caption="התחברו לפחות פעם אחת" />
            <StatCard label="הוזמנו" value={stats.invited} tone="ember" caption="עוד לא התחברו" />
            <StatCard label="מנהלים" value={stats.admins} tone="info" />
          </section>

          <section aria-label="רשימת משתמשים" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SegmentedControl<StatusFilter>
                ariaLabel="סינון לפי סטטוס"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: "all", label: "הכל", count: stats.total },
                  { value: "active", label: "פעילים", count: stats.active },
                  { value: "invited", label: "הוזמנו", count: stats.invited },
                ]}
              />
              <SearchInput
                label="חיפוש משתמשים"
                placeholder="חיפוש לפי מייל או שם"
                value={query}
                onChange={setQuery}
              />
            </div>

            {visible.length === 0 ? (
              <p className="rounded-xl border border-border bg-surface p-6 text-center text-body-md text-text-muted">
                {customers.length === 0
                  ? "עדיין אין משתמשים במערכת."
                  : "לא נמצאו משתמשים שמתאימים לחיפוש."}
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {visible.map((customer) => (
                  <UserRow key={customer.id} customer={customer} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  );
}
