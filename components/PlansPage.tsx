"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { describeError } from "@/lib/messages";
import type { PlanTree } from "@/lib/types";
import { useAdminSession } from "./AdminSession";
import Chip from "./ui/Chip";
import { ArrowIcon } from "./ui/icons";
import PageHeader from "./ui/PageHeader";

/** Every plan with its levels; opening a level shows its ordered workouts. */
export default function PlansPage() {
  const { onSessionLost } = useAdminSession();
  const [plans, setPlans] = useState<PlanTree[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .planTree()
      .then((data) => {
        if (!cancelled) setPlans(data);
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
  }, [onSessionLost]);

  return (
    <>
      <PageHeader
        title="תוכניות ואימונים"
        description="בוחרים תוכנית ורמה, ושם מוסיפים ומסדרים את האימונים לפי הסדר שבו הלקוחות יעברו אותם."
      />

      {error && (
        <p role="alert" className="text-body-md text-ember">
          {error}
        </p>
      )}
      {!plans && !error && <p className="text-body-md text-text-muted">טוען...</p>}

      {plans && (
        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((plan) => (
            <section key={plan.slug} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
              <h2 className="font-heading text-headline-md font-bold">{plan.nameHe ?? plan.slug}</h2>
              <ul className="flex flex-col gap-2">
                {plan.levels.map((level) => (
                  <li key={level.id}>
                    <Link
                      href={`/plans/${level.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-well px-4 py-3 transition hover:border-border-emphasis focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
                    >
                      <span className="text-body-lg font-semibold">
                        {level.nameHe ?? `רמה ${level.levelNumber}`}
                      </span>
                      <span className="flex flex-wrap items-center gap-1.5">
                        <Chip>{level.workoutCount} אימונים</Chip>
                        <Chip tone={level.publishedCount > 0 ? "volt" : "neutral"}>
                          {level.publishedCount} מפורסמים
                        </Chip>
                        {!level.hasChallenge && <Chip tone="ember">חסר אתגר</Chip>}
                        <ArrowIcon className="text-text-muted" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
