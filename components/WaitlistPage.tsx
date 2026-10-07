"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { describeError } from "@/lib/messages";
import { sportFilterLabel, sportLabel } from "@/lib/sports";
import type { WaitlistPage as WaitlistData } from "@/lib/types";
import { useAdminSession } from "./AdminSession";
import Button, { buttonClasses } from "./ui/Button";
import Chip from "./ui/Chip";
import { ArrowIcon, ChevronIcon } from "./ui/icons";
import PageHeader from "./ui/PageHeader";
import SearchInput from "./ui/SearchInput";
import SegmentedControl from "./ui/SegmentedControl";
import StatCard from "./ui/StatCard";

const PAGE_SIZE = 25;
const SEARCH_DELAY_MS = 300;

type StatusFilter = "all" | "waiting";
type Result = { key: string; data?: WaitlistData; error?: string };

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString("he-IL")} ${date.toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export default function WaitlistPage() {
  const { onSessionLost } = useAdminSession();
  const [page, setPage] = useState(0);
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sport, setSport] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  // Search as you type, but only ask the API once typing pauses.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(queryInput.trim());
      setPage(0);
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [queryInput]);

  const key = `${page}|${query}|${status}|${sport}|${reloadKey}`;

  useEffect(() => {
    let cancelled = false;
    api
      .listWaitlist({ page, size: PAGE_SIZE, q: query, status, sport })
      .then((data) => {
        if (!cancelled) setResult({ key, data });
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          onSessionLost();
          return;
        }
        setResult({ key, error: describeError(e) });
      });
    return () => {
      cancelled = true;
    };
  }, [key, page, query, status, sport, onSessionLost]);

  const current = result && result.key === key ? result : null;
  const loading = !current;
  // While a new search is loading, keep showing the previous rows (dimmed) instead of flashing empty.
  const data = current?.data ?? result?.data;
  const summary = data?.summary;
  const waiting = summary ? summary.total - summary.alreadyUsers : 0;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1;
  const filtering = query !== "" || status !== "all" || sport !== "";

  return (
    <>
      <PageHeader
        title="רשימת המתנה"
        description="מי נרשם באתר ההמתנה ומי כבר קיבל גישה. כשמוכנים, מוסיפים אותם כלקוחות."
      />

      {current?.error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ember/40 bg-ember/10 p-4 text-body-md text-ember"
        >
          <span>{current.error}</span>
          <Button variant="secondary" size="sm" onClick={() => setReloadKey((k) => k + 1)}>
            נסו שוב
          </Button>
        </div>
      )}

      {!summary && !current?.error && <p className="text-body-md text-text-muted">טוען...</p>}

      {summary && data && (
        <>
          <section aria-label="סיכום" className="grid grid-cols-3 gap-3">
            <StatCard label="נרשמו" value={summary.total} />
            <StatCard label="כבר משתמשים" value={summary.alreadyUsers} tone="volt" />
            <StatCard label="ממתינים לגישה" value={waiting} tone="ember" />
          </section>

          <section aria-label="סינון" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SegmentedControl<StatusFilter>
                ariaLabel="סינון לפי מצב"
                value={status}
                onChange={(value) => {
                  setStatus(value);
                  setPage(0);
                }}
                options={[
                  { value: "all", label: "כולם", count: summary.total },
                  { value: "waiting", label: "ממתינים בלבד", count: waiting },
                ]}
              />
              <SearchInput
                label="חיפוש ברשימת ההמתנה"
                placeholder="חיפוש לפי מייל"
                value={queryInput}
                onChange={setQueryInput}
              />
            </div>
            <SegmentedControl<string>
              ariaLabel="סינון לפי ענף מועדף"
              value={sport}
              onChange={(value) => {
                setSport(value);
                setPage(0);
              }}
              options={[
                { value: "", label: "כל הענפים", count: summary.total },
                ...Object.entries(summary.bySport).map(([id, count]) => ({
                  value: id,
                  label: sportFilterLabel(id),
                  count,
                })),
              ]}
            />
          </section>

          <section
            aria-label="נרשמים"
            aria-busy={loading}
            className={`flex flex-col gap-4 transition-opacity ${loading ? "opacity-60" : ""}`}
          >
            {data.items.length === 0 ? (
              <p className="rounded-xl border border-border bg-surface p-6 text-center text-body-md text-text-muted">
                {filtering ? "לא נמצאו נרשמים שמתאימים לחיפוש." : "אין עדיין נרשמים ברשימת ההמתנה."}
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {data.items.map((entry) => (
                  <li
                    key={entry.id}
                    className="grid items-center gap-x-4 gap-y-3 rounded-xl border border-border bg-surface px-4 py-3 transition hover:border-border-emphasis md:grid-cols-[minmax(0,2.2fr)_8rem_9rem_11rem]"
                  >
                    <span dir="ltr" className="truncate text-start text-body-lg font-semibold">
                      {entry.email}
                    </span>
                    <div>
                      {entry.favoriteSport ? (
                        <Chip>{sportLabel(entry.favoriteSport)}</Chip>
                      ) : (
                        <span className="text-body-md text-text-muted">ללא העדפה</span>
                      )}
                    </div>
                    <span dir="ltr" className="text-start text-body-md text-text-secondary">
                      {formatDateTime(entry.createdAt)}
                    </span>
                    <div className="md:flex md:justify-end">
                      {entry.alreadyUser ? (
                        <Chip tone="volt">כבר משתמש</Chip>
                      ) : (
                        <Link
                          href={`/add?email=${encodeURIComponent(entry.email)}`}
                          className={buttonClasses({ variant: "secondary", size: "sm" })}
                        >
                          הוספה כלקוח
                          <ArrowIcon className="size-4" />
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {totalPages > 1 && (
              <nav aria-label="עמודים" className="flex items-center justify-between gap-3 text-body-md">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronIcon direction="forward" className="size-4" />
                  הקודם
                </Button>
                <span className="text-text-secondary">
                  עמוד <span dir="ltr">{page + 1}</span> מתוך <span dir="ltr">{totalPages}</span>
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  הבא
                  <ChevronIcon direction="back" className="size-4" />
                </Button>
              </nav>
            )}
          </section>
        </>
      )}
    </>
  );
}
