"use client";

import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { describeError } from "@/lib/messages";
import { sportLabel } from "@/lib/sports";
import type { WaitlistPage as WaitlistData } from "@/lib/types";
import { useAdminSession } from "./AdminSession";

const PAGE_SIZE = 50;

type Result = { page: number; data?: WaitlistData; error?: string };

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
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .listWaitlist(page, PAGE_SIZE)
      .then((data) => {
        if (!cancelled) setResult({ page, data });
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          onSessionLost();
          return;
        }
        setResult({ page, error: describeError(e) });
      });
    return () => {
      cancelled = true;
    };
  }, [page, reloadKey, onSessionLost]);

  // Anything not yet loaded for the page being shown counts as loading.
  const current = result && result.page === page ? result : null;
  const data = current?.data;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1;

  return (
    <section aria-labelledby="waitlist-title" className="flex flex-col gap-3">
      <h2 id="waitlist-title" className="font-heading text-headline-sm font-bold">
        רשימת המתנה{data ? ` (${data.total})` : ""}
      </h2>
      <p className="text-body-md text-text-secondary">
        אנשים שנרשמו באתר ההמתנה. הכי חדשים למעלה.
      </p>

      {current?.error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 text-body-md text-danger"
        >
          <span>{current.error}</span>
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setReloadKey((key) => key + 1);
            }}
            className="rounded-full border border-border-emphasis px-4 py-1.5 text-text-primary hover:bg-surface-raised"
          >
            נסו שוב
          </button>
        </div>
      )}

      {!current && <p className="text-body-md text-text-muted">טוען...</p>}

      {data && data.items.length === 0 && (
        <p className="rounded-2xl border border-border bg-surface p-5 text-body-md text-text-muted">
          אין עדיין נרשמים ברשימת ההמתנה.
        </p>
      )}

      {data && data.items.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[560px] border-collapse text-start text-body-md">
            <thead className="bg-surface-raised text-text-secondary">
              <tr>
                <th scope="col" className="px-4 py-3 text-start font-semibold">
                  מייל
                </th>
                <th scope="col" className="px-4 py-3 text-start font-semibold">
                  ענף מועדף
                </th>
                <th scope="col" className="px-4 py-3 text-start font-semibold">
                  נרשם/ה
                </th>
                <th scope="col" className="px-4 py-3 text-start font-semibold">
                  מצב
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((entry) => (
                <tr key={entry.id} className="border-t border-border align-top">
                  <td className="px-4 py-3">
                    <span dir="ltr" className="inline-block">
                      {entry.email}
                    </span>
                  </td>
                  <td className="px-4 py-3">{sportLabel(entry.favoriteSport)}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    <span dir="ltr" className="inline-block">
                      {formatDateTime(entry.createdAt)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {entry.alreadyUser ? (
                      <span className="rounded-full border border-volt/40 px-2 py-0.5 text-label-md text-volt">
                        כבר משתמש
                      </span>
                    ) : (
                      <span className="text-text-muted">ממתין</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && totalPages > 1 && (
        <nav aria-label="עמודים" className="flex items-center justify-between gap-3 text-body-md">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-full border border-border-emphasis px-4 py-1.5 transition hover:bg-surface-raised disabled:opacity-40"
          >
            הקודם
          </button>
          <span className="text-text-secondary">
            עמוד <span dir="ltr">{page + 1}</span> מתוך <span dir="ltr">{totalPages}</span>
          </span>
          <button
            type="button"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full border border-border-emphasis px-4 py-1.5 transition hover:bg-surface-raised disabled:opacity-40"
          >
            הבא
          </button>
        </nav>
      )}
    </section>
  );
}
