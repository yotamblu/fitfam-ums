"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { describeError } from "@/lib/messages";
import { SPORT_LABELS, STATUS_LABELS } from "@/lib/training";
import type { LevelWorkouts, WorkoutSummary } from "@/lib/types";
import { useAdminSession } from "./AdminSession";
import Button, { buttonClasses } from "./ui/Button";
import Chip from "./ui/Chip";
import { PlusIcon } from "./ui/icons";
import PageHeader from "./ui/PageHeader";

/** The ordered workouts of one plan level: reorder, publish, duplicate, archive. The challenge is always last. */
export default function LevelWorkoutsPage() {
  const { onSessionLost } = useAdminSession();
  const levelId = String(useParams<{ levelId: string }>().levelId);

  const [data, setData] = useState<LevelWorkouts | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleError = useCallback(
    (e: unknown) => {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        onSessionLost();
        return;
      }
      setError(describeError(e));
    },
    [onSessionLost],
  );

  const reload = useCallback(() => {
    api
      .levelWorkouts(levelId)
      .then((result) => {
        setData(result);
      })
      .catch(handleError);
  }, [levelId, handleError]);

  useEffect(() => {
    let cancelled = false;
    api
      .levelWorkouts(levelId)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((e) => {
        if (!cancelled) handleError(e);
      });
    return () => {
      cancelled = true;
    };
  }, [levelId, handleError]);

  const live = (data?.workouts ?? []).filter((w) => w.status !== "archived");
  const archived = (data?.workouts ?? []).filter((w) => w.status === "archived");
  const regular = live.filter((w) => w.type !== "challenge");
  const challenge = live.find((w) => w.type === "challenge") ?? null;

  /** Runs an action, then reloads the list. Errors are shown above the list. */
  const act = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      reload();
    } catch (e) {
      handleError(e);
      reload();
    } finally {
      setBusy(false);
    }
  };

  /** Moves a regular workout to a new position (0-based) among the regular workouts. */
  const moveTo = async (id: string, newIndex: number) => {
    const from = regular.findIndex((w) => w.id === id);
    const target = Math.max(0, Math.min(regular.length - 1, newIndex));
    if (from < 0 || from === target) return;
    const next = [...regular];
    const [moved] = next.splice(from, 1);
    next.splice(target, 0, moved);
    const ids = [...next, ...(challenge ? [challenge] : [])].map((w) => w.id);

    setBusy(true);
    setError(null);
    // show the new order right away; the server's answer replaces it
    setData((current) =>
      current
        ? {
            ...current,
            workouts: [...next, ...(challenge ? [challenge] : []), ...archived].map((w, i) => ({
              ...w,
              sortOrder: i + 1,
            })),
          }
        : current,
    );
    try {
      setData(await api.reorderWorkouts(levelId, ids));
    } catch (e) {
      handleError(e);
      reload();
    } finally {
      setBusy(false);
    }
  };

  const title = data
    ? `${data.planNameHe ?? data.planSlug} · ${data.levelNameHe ?? `רמה ${data.levelNumber}`}`
    : "טוען...";

  return (
    <>
      <PageHeader
        title={title}
        description="האימונים לפי הסדר שבו הלקוחות יעברו אותם. גוררים כדי לסדר מחדש, או כותבים מספר מקום."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link href="/plans" className={buttonClasses({ variant: "ghost", size: "lg" })}>
              חזרה לתוכניות
            </Link>
            {data && !challenge && (
              <Link
                href={`/workouts/new?levelId=${levelId}&type=challenge`}
                className={buttonClasses({ variant: "secondary", size: "lg" })}
              >
                <PlusIcon />
                אתגר מעבר רמה
              </Link>
            )}
            {data && (
              <Link href={`/workouts/new?levelId=${levelId}`} className={buttonClasses({ size: "lg" })}>
                <PlusIcon />
                אימון חדש
              </Link>
            )}
          </div>
        }
      />

      {error && (
        <p role="alert" className="text-body-md text-ember">
          {error}
        </p>
      )}

      {data && !challenge && (
        <p className="rounded-xl border border-ember/40 bg-ember/10 px-4 py-3 text-body-md text-ember">
          לרמה הזו עדיין אין אתגר מעבר. בלי אתגר מפורסם אי אפשר להתקדם ממנה לרמה הבאה, או לדלג אליה.
        </p>
      )}

      {data && live.length === 0 && (
        <p className="rounded-2xl border border-border bg-surface p-6 text-body-lg text-text-secondary">
          עוד אין אימונים ברמה הזו. הוסיפו את הראשון.
        </p>
      )}

      {live.length > 0 && (
        <ol className="flex flex-col gap-2">
          {regular.map((workout, index) => (
            <li
              key={workout.id}
              draggable={!busy}
              onDragStart={() => setDraggingId(workout.id)}
              onDragEnd={() => setDraggingId(null)}
              onDragOver={(e) => {
                if (draggingId) e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (draggingId) void moveTo(draggingId, index);
                setDraggingId(null);
              }}
              className={`cursor-grab ${draggingId === workout.id ? "opacity-50" : ""}`}
            >
              <WorkoutRow
                workout={workout}
                position={index + 1}
                total={regular.length}
                busy={busy}
                confirmingDelete={confirmDeleteId === workout.id}
                onMove={(newIndex) => moveTo(workout.id, newIndex)}
                onAction={act}
                onAskDelete={() => setConfirmDeleteId(workout.id)}
                onCancelDelete={() => setConfirmDeleteId(null)}
              />
            </li>
          ))}
          {challenge && (
            <li>
              <WorkoutRow
                workout={challenge}
                position={regular.length + 1}
                total={regular.length + 1}
                busy={busy}
                pinned
                confirmingDelete={confirmDeleteId === challenge.id}
                onMove={() => {}}
                onAction={act}
                onAskDelete={() => setConfirmDeleteId(challenge.id)}
                onCancelDelete={() => setConfirmDeleteId(null)}
              />
            </li>
          )}
        </ol>
      )}

      {archived.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-headline-sm font-bold text-text-secondary">בארכיון</h2>
          <ul className="flex flex-col gap-2">
            {archived.map((workout) => (
              <li
                key={workout.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 opacity-70"
              >
                <span className="text-body-lg">{workout.titleHe ?? "ללא שם"}</span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={busy}
                  onClick={() => act(() => api.restoreWorkout(workout.id))}
                >
                  שחזור לטיוטה
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function WorkoutRow({
  workout,
  position,
  total,
  busy,
  pinned = false,
  confirmingDelete,
  onMove,
  onAction,
  onAskDelete,
  onCancelDelete,
}: {
  workout: WorkoutSummary;
  position: number;
  total: number;
  busy: boolean;
  pinned?: boolean;
  confirmingDelete: boolean;
  onMove: (newIndex: number) => void;
  onAction: (action: () => Promise<unknown>) => Promise<void>;
  onAskDelete: () => void;
  onCancelDelete: () => void;
}) {
  const isChallenge = workout.type === "challenge";
  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border px-4 py-3 ${
        isChallenge ? "border-ember/50 bg-surface-raised" : "border-border bg-surface"
      }`}
    >
      {pinned ? (
        <span className="w-14 text-center text-label-md font-semibold text-ember">אחרון</span>
      ) : (
        <input
          key={`${workout.id}-${position}`}
          type="number"
          dir="ltr"
          min={1}
          max={total}
          defaultValue={position}
          aria-label={`מקום של ${workout.titleHe ?? "האימון"} ברשימה`}
          disabled={busy}
          onKeyDown={(e) => {
            if (e.key === "Enter") onMove(Number(e.currentTarget.value) - 1);
          }}
          onBlur={(e) => {
            const wanted = Number(e.currentTarget.value);
            if (wanted !== position) onMove(wanted - 1);
          }}
          className="h-9 w-14 rounded-lg border border-border-emphasis bg-well text-center text-body-md tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Link
          href={`/workouts/${workout.id}`}
          className="truncate font-heading text-headline-sm font-bold hover:text-ember focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
        >
          {workout.titleHe ?? "ללא שם"}
        </Link>
        <div className="flex flex-wrap gap-1.5">
          {isChallenge && <Chip tone="ember">אתגר מעבר רמה</Chip>}
          <Chip tone="info">{SPORT_LABELS[workout.sport]}</Chip>
          <Chip tone={workout.status === "published" ? "volt" : "neutral"}>{STATUS_LABELS[workout.status]}</Chip>
          {workout.estMinutes !== null && <Chip>{workout.estMinutes} דק׳</Chip>}
          <Chip>{workout.lineCount} תרגילים</Chip>
        </div>
      </div>

      {confirmingDelete ? (
        <div className="flex items-center gap-2">
          <span className="text-body-md text-ember">למחוק את הטיוטה?</span>
          <Button
            size="sm"
            disabled={busy}
            onClick={() =>
              onAction(async () => {
                await api.deleteWorkout(workout.id);
                onCancelDelete();
              })
            }
          >
            כן, למחוק
          </Button>
          <Button variant="ghost" size="sm" onClick={onCancelDelete}>
            ביטול
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {!pinned && (
            <>
              <Button
                variant="ghost"
                size="sm"
                aria-label="הזזה למעלה"
                disabled={busy || position === 1}
                onClick={() => onMove(position - 2)}
              >
                ↑
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="הזזה למטה"
                disabled={busy || position === total}
                onClick={() => onMove(position)}
              >
                ↓
              </Button>
            </>
          )}
          <Link href={`/workouts/${workout.id}`} className={buttonClasses({ variant: "secondary", size: "sm" })}>
            עריכה
          </Link>
          {workout.status === "published" ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => onAction(() => api.unpublishWorkout(workout.id))}
            >
              הסרה מפרסום
            </Button>
          ) : (
            <Button size="sm" disabled={busy} onClick={() => onAction(() => api.publishWorkout(workout.id))}>
              פרסום
            </Button>
          )}
          {!isChallenge && (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => onAction(() => api.duplicateWorkout(workout.id))}
            >
              שכפול
            </Button>
          )}
          {workout.status === "draft" ? (
            <Button variant="ghost" size="sm" disabled={busy} onClick={onAskDelete}>
              מחיקה
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => onAction(() => api.archiveWorkout(workout.id))}
            >
              ארכיון
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
