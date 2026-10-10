"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { ApiError, api } from "@/lib/api";
import { describeError } from "@/lib/messages";
import { MEASURE_HINTS, MEASURE_LABELS, MEASURES, SPORT_LABELS, SPORTS } from "@/lib/training";
import type { Exercise, ExerciseInput, Measure, Sport } from "@/lib/types";
import { useAdminSession } from "./AdminSession";
import Button from "./ui/Button";
import Chip from "./ui/Chip";
import { Field, Select, TextArea, TextInput } from "./ui/Field";
import { PlusIcon } from "./ui/icons";
import PageHeader from "./ui/PageHeader";
import SearchInput from "./ui/SearchInput";
import SegmentedControl from "./ui/SegmentedControl";

type SportFilter = "all" | Sport;

const EMPTY: ExerciseInput = {
  nameHe: "",
  sport: "gym",
  measure: "reps",
  equipment: [],
  muscleGroups: [],
  descriptionHe: "",
  cuesHe: "",
  videoUrl: "",
};

function toInput(exercise: Exercise): ExerciseInput {
  return {
    nameHe: exercise.nameHe,
    sport: exercise.sport,
    measure: exercise.measure,
    equipment: exercise.equipment,
    muscleGroups: exercise.muscleGroups,
    descriptionHe: exercise.descriptionHe ?? "",
    cuesHe: exercise.cuesHe ?? "",
    videoUrl: exercise.videoUrl ?? "",
  };
}

function splitList(text: string): string[] {
  return text
    .split(/[,،\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** The exercise bank: coaches add exercises once, then use them in workouts. */
export default function ExercisesPage() {
  const { onSessionLost } = useAdminSession();
  const [exercises, setExercises] = useState<Exercise[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sport, setSport] = useState<SportFilter>("all");
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  // null = form closed, "new" = adding, otherwise the exercise being edited
  const [editing, setEditing] = useState<Exercise | "new" | null>(null);

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
      .listExercises({ archived: showArchived })
      .then((data) => {
        setExercises(data);
        setError(null);
      })
      .catch(handleError);
  }, [handleError, showArchived]);

  useEffect(() => {
    let cancelled = false;
    api
      .listExercises({ archived: showArchived })
      .then((data) => {
        if (!cancelled) setExercises(data);
      })
      .catch((e) => {
        if (!cancelled) handleError(e);
      });
    return () => {
      cancelled = true;
    };
  }, [handleError, showArchived]);

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: exercises?.length ?? 0 };
    for (const exercise of exercises ?? []) result[exercise.sport] = (result[exercise.sport] ?? 0) + 1;
    return result;
  }, [exercises]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (exercises ?? []).filter(
      (exercise) =>
        (sport === "all" || exercise.sport === sport) &&
        (needle === "" || exercise.nameHe.toLowerCase().includes(needle)),
    );
  }, [exercises, sport, query]);

  const toggleArchived = async (exercise: Exercise) => {
    try {
      await (exercise.archived ? api.restoreExercise(exercise.id) : api.archiveExercise(exercise.id));
      reload();
    } catch (e) {
      handleError(e);
    }
  };

  return (
    <>
      <PageHeader
        title="בנק תרגילים"
        description="התרגילים שמהם בונים אימונים. מוסיפים תרגיל פעם אחת ומשתמשים בו בכל אימון."
        actions={
          <Button size="lg" onClick={() => setEditing("new")}>
            <PlusIcon />
            תרגיל חדש
          </Button>
        }
      />

      {editing && (
        <ExerciseForm
          key={editing === "new" ? "new" : editing.id}
          exercise={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
          onSessionLost={onSessionLost}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl<SportFilter>
          ariaLabel="סינון לפי ענף"
          value={sport}
          onChange={setSport}
          options={[
            { value: "all", label: "הכול", count: counts.all },
            ...SPORTS.map((value) => ({ value, label: SPORT_LABELS[value], count: counts[value] ?? 0 })),
          ]}
        />
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-body-md text-text-secondary">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="size-4 accent-ember"
            />
            הצגת תרגילים בארכיון
          </label>
          <SearchInput value={query} onChange={setQuery} placeholder="חיפוש תרגיל" label="חיפוש תרגיל" />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-body-md text-ember">
          {error}
        </p>
      )}
      {!exercises && !error && <p className="text-body-md text-text-muted">טוען...</p>}
      {exercises && visible.length === 0 && (
        <p className="rounded-2xl border border-border bg-surface p-6 text-body-lg text-text-secondary">
          {exercises.length === 0 ? "עוד אין תרגילים. הוסיפו את הראשון." : "לא נמצאו תרגילים."}
        </p>
      )}

      {visible.length > 0 && (
        <ul className="grid gap-3 md:grid-cols-2">
          {visible.map((exercise) => (
            <li
              key={exercise.id}
              className={`flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 ${
                exercise.archived ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <h2 className="font-heading text-headline-sm font-bold">{exercise.nameHe}</h2>
                  <div className="flex flex-wrap gap-1.5">
                    <Chip tone="info">{SPORT_LABELS[exercise.sport]}</Chip>
                    <Chip>{MEASURE_LABELS[exercise.measure]}</Chip>
                    {exercise.youtubeId && <Chip tone="volt">יש סרטון</Chip>}
                    {exercise.archived && <Chip tone="ember">בארכיון</Chip>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setEditing(exercise)}>
                    עריכה
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleArchived(exercise)}>
                    {exercise.archived ? "שחזור" : "ארכיון"}
                  </Button>
                </div>
              </div>
              {(exercise.equipment.length > 0 || exercise.muscleGroups.length > 0) && (
                <p className="text-body-md text-text-secondary">
                  {[...exercise.equipment, ...exercise.muscleGroups].join(" · ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function ExerciseForm({
  exercise,
  onCancel,
  onSaved,
  onSessionLost,
}: {
  exercise: Exercise | null;
  onCancel: () => void;
  onSaved: () => void;
  onSessionLost: () => void;
}) {
  const [form, setForm] = useState<ExerciseInput>(exercise ? toInput(exercise) : EMPTY);
  const [equipmentText, setEquipmentText] = useState(form.equipment.join(", "));
  const [musclesText, setMusclesText] = useState(form.muscleGroups.join(", "));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof ExerciseInput>(key: K, value: ExerciseInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!form.nameHe.trim()) {
      setError("יש להזין שם לתרגיל.");
      return;
    }
    const input: ExerciseInput = {
      ...form,
      nameHe: form.nameHe.trim(),
      equipment: splitList(equipmentText),
      muscleGroups: splitList(musclesText),
      videoUrl: form.videoUrl.trim(),
    };
    setBusy(true);
    try {
      await (exercise ? api.updateExercise(exercise.id, input) : api.createExercise(input));
      onSaved();
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
      className="animate-rise flex flex-col gap-5 rounded-2xl border border-ember/40 bg-surface p-6"
    >
      <h2 className="font-heading text-headline-md font-bold">{exercise ? "עריכת תרגיל" : "תרגיל חדש"}</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="שם התרגיל" htmlFor="ex-name">
          <TextInput
            id="ex-name"
            value={form.nameHe}
            onChange={(e) => set("nameHe", e.target.value)}
            placeholder="למשל: שכיבות סמיכה"
            maxLength={100}
          />
        </Field>
        <Field label="ענף" htmlFor="ex-sport">
          <Select id="ex-sport" value={form.sport} onChange={(e) => set("sport", e.target.value as Sport)}>
            {SPORTS.map((value) => (
              <option key={value} value={value}>
                {SPORT_LABELS[value]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="איך מודדים את התרגיל" htmlFor="ex-measure" hint={MEASURE_HINTS[form.measure]}>
          <Select
            id="ex-measure"
            value={form.measure}
            onChange={(e) => set("measure", e.target.value as Measure)}
          >
            {MEASURES.map((value) => (
              <option key={value} value={value}>
                {MEASURE_LABELS[value]}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="קישור לסרטון YouTube (לא חובה)"
          htmlFor="ex-video"
          hint="אפשר להשאיר ריק ולהוסיף אחר כך."
        >
          <TextInput
            id="ex-video"
            dir="ltr"
            className="text-start"
            value={form.videoUrl}
            onChange={(e) => set("videoUrl", e.target.value)}
            placeholder="https://youtu.be/..."
            maxLength={300}
          />
        </Field>
        <Field label="ציוד (מופרד בפסיקים)" htmlFor="ex-equipment">
          <TextInput
            id="ex-equipment"
            value={equipmentText}
            onChange={(e) => setEquipmentText(e.target.value)}
            placeholder="מוט מתח, גומיות"
          />
        </Field>
        <Field label="שרירים עיקריים (מופרד בפסיקים)" htmlFor="ex-muscles">
          <TextInput
            id="ex-muscles"
            value={musclesText}
            onChange={(e) => setMusclesText(e.target.value)}
            placeholder="חזה, כתפיים"
          />
        </Field>
        <Field label="תיאור (לא חובה)" htmlFor="ex-desc" className="md:col-span-2">
          <TextArea
            id="ex-desc"
            value={form.descriptionHe}
            onChange={(e) => set("descriptionHe", e.target.value)}
            maxLength={2000}
          />
        </Field>
        <Field label="דגשים לביצוע (לא חובה)" htmlFor="ex-cues" className="md:col-span-2">
          <TextArea
            id="ex-cues"
            value={form.cuesHe}
            onChange={(e) => set("cuesHe", e.target.value)}
            maxLength={2000}
          />
        </Field>
      </div>

      {error && (
        <p role="alert" className="text-body-md text-ember">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? "שומר..." : "שמירה"}
        </Button>
        <Button variant="secondary" size="lg" onClick={onCancel} disabled={busy}>
          ביטול
        </Button>
      </div>
    </form>
  );
}
