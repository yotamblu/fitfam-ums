"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { describeError } from "@/lib/messages";
import {
  BLOCK_FIELDS,
  LINE_FIELDS,
  MEASURE_LABELS,
  SPORT_LABELS,
  SPORTS,
  STATUS_LABELS,
  STYLE_LABELS,
  STYLES,
  contentToForm,
  describeContentError,
  describeStep,
  emptyBlock,
  emptyLine,
  emptySection,
  formToContent,
  type FormBlock,
  type FormLine,
  type FormSection,
} from "@/lib/training";
import type { Exercise, Sport, Step, Workout, WorkoutStatus, WorkoutType } from "@/lib/types";
import { useAdminSession } from "./AdminSession";
import Button, { buttonClasses } from "./ui/Button";
import Chip from "./ui/Chip";
import { Field, NumberInput, Select, TextArea, TextInput } from "./ui/Field";
import { PlusIcon } from "./ui/icons";
import PageHeader from "./ui/PageHeader";

/** Moves an item one place up or down; returns the same array when it cannot move. */
function moved<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

type Notice = { tone: "ok" | "error"; text: string; detail?: string };

/** Create or edit one workout: details, then sections > blocks > exercise lines. */
export default function WorkoutEditorPage() {
  const { onSessionLost } = useAdminSession();
  const router = useRouter();
  const routeId = String(useParams<{ id: string }>().id);
  const search = useSearchParams();
  const isNew = routeId === "new";
  const newLevelId = search.get("levelId") ?? "";
  const newType: WorkoutType = search.get("type") === "challenge" ? "challenge" : "regular";

  const [exercises, setExercises] = useState<Exercise[] | null>(null);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [titleHe, setTitleHe] = useState("");
  const [sport, setSport] = useState<Sport>("gym");
  const [estMinutes, setEstMinutes] = useState("");
  const [descriptionHe, setDescriptionHe] = useState("");
  const [goalHe, setGoalHe] = useState("");
  const [sections, setSections] = useState<FormSection[]>([emptySection()]);

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const type: WorkoutType = workout?.type ?? newType;
  const status: WorkoutStatus = workout?.status ?? "draft";
  const levelId = workout?.levelId ?? newLevelId;

  const exerciseMap = useMemo(() => new Map((exercises ?? []).map((e) => [e.id, e])), [exercises]);

  const handleError = useCallback(
    (e: unknown): Notice | null => {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        onSessionLost();
        return null;
      }
      const detail = e instanceof ApiError ? describeContentError(e.detail) : null;
      return { tone: "error", text: describeError(e), detail: detail ?? undefined };
    },
    [onSessionLost],
  );

  /** Copies a workout from the API into the form fields. */
  const applyWorkout = useCallback((loaded: Workout, bank: Map<string, Exercise>) => {
    setWorkout(loaded);
    setTitleHe(loaded.titleHe ?? "");
    setSport(loaded.sport);
    setEstMinutes(loaded.estMinutes === null ? "" : String(loaded.estMinutes));
    setDescriptionHe(loaded.descriptionHe ?? "");
    setGoalHe(loaded.goalHe ?? "");
    const form = contentToForm(loaded.content, bank);
    setSections(form.length > 0 ? form : [emptySection()]);
  }, []);

  // Load the exercise bank (including archived ones, so old lines still show their name) and the workout.
  useEffect(() => {
    let cancelled = false;
    Promise.all([api.listExercises({ archived: true }), isNew ? Promise.resolve(null) : api.getWorkout(routeId)])
      .then(([bank, loaded]) => {
        if (cancelled) return;
        setExercises(bank);
        if (loaded) applyWorkout(loaded, new Map(bank.map((e) => [e.id, e])));
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          onSessionLost();
          return;
        }
        setLoadError(describeError(e));
      });
    return () => {
      cancelled = true;
    };
  }, [isNew, routeId, applyWorkout, onSessionLost]);

  const buildInput = () => {
    const minutes = estMinutes.trim() === "" ? null : Math.round(Number(estMinutes));
    return {
      sport,
      titleHe: titleHe.trim(),
      descriptionHe: descriptionHe.trim(),
      goalHe: goalHe.trim(),
      estMinutes: minutes !== null && Number.isFinite(minutes) ? minutes : null,
      content: formToContent(sections, exerciseMap),
    };
  };

  /** Saves (creating the workout the first time). Returns the saved workout, or null if it failed. */
  const save = async (): Promise<Workout | null> => {
    setNotice(null);
    try {
      let saved: Workout;
      if (workout) {
        saved = await api.updateWorkout(workout.id, buildInput());
      } else {
        if (!newLevelId) {
          setNotice({ tone: "error", text: "חסרה רמה. חזרו לרשימת האימונים של הרמה ופתחו אימון חדש משם." });
          return null;
        }
        saved = await api.createWorkout(newLevelId, { ...buildInput(), type: newType });
        // update the address without remounting the page, so the notice and the step preview survive the first save
        window.history.replaceState(null, "", `/workouts/${saved.id}`);
      }
      applyWorkout(saved, exerciseMap);
      return saved;
    } catch (e) {
      setNotice(handleError(e));
      return null;
    }
  };

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };

  const onSave = () =>
    run(async () => {
      if (await save()) setNotice({ tone: "ok", text: "האימון נשמר." });
    });

  const onSaveAndPublish = () =>
    run(async () => {
      const saved = await save();
      if (!saved) return;
      try {
        applyWorkout(await api.publishWorkout(saved.id), exerciseMap);
        setNotice({ tone: "ok", text: "האימון פורסם ונראה ללקוחות." });
      } catch (e) {
        setNotice(handleError(e));
      }
    });

  const onUnpublish = () =>
    run(async () => {
      if (!workout) return;
      try {
        applyWorkout(await api.unpublishWorkout(workout.id), exerciseMap);
        setNotice({ tone: "ok", text: "האימון הוסר מפרסום וחזר להיות טיוטה." });
      } catch (e) {
        setNotice(handleError(e));
      }
    });

  const onPreview = () =>
    run(async () => {
      const saved = await save();
      if (!saved) return;
      try {
        setSteps((await api.workoutSteps(saved.id)).steps);
      } catch (e) {
        setNotice(handleError(e));
      }
    });

  const onDelete = () =>
    run(async () => {
      if (!workout) return;
      try {
        await api.deleteWorkout(workout.id);
        router.replace(`/plans/${workout.levelId}`);
      } catch (e) {
        setNotice(handleError(e));
        setConfirmDelete(false);
      }
    });

  // ---- structure edits ----

  const patchSection = (si: number, patch: Partial<FormSection>) =>
    setSections((prev) => prev.map((s, i) => (i === si ? { ...s, ...patch } : s)));

  const patchBlock = (si: number, bi: number, patch: Partial<FormBlock>) =>
    setSections((prev) =>
      prev.map((s, i) =>
        i === si ? { ...s, blocks: s.blocks.map((b, j) => (j === bi ? { ...b, ...patch } : b)) } : s,
      ),
    );

  const patchLine = (si: number, bi: number, li: number, patch: Partial<FormLine>) =>
    setSections((prev) =>
      prev.map((s, i) =>
        i === si
          ? {
              ...s,
              blocks: s.blocks.map((b, j) =>
                j === bi ? { ...b, lines: b.lines.map((l, k) => (k === li ? { ...l, ...patch } : l)) } : b,
              ),
            }
          : s,
      ),
    );

  const backHref = levelId ? `/plans/${levelId}` : "/plans";

  if (loadError) {
    return (
      <>
        <PageHeader title="עריכת אימון" />
        <p role="alert" className="text-body-md text-ember">
          {loadError}
        </p>
        <Link href="/plans" className={buttonClasses({ variant: "secondary" })}>
          חזרה לתוכניות
        </Link>
      </>
    );
  }
  if (!exercises || (!isNew && !workout)) {
    return <p className="text-body-md text-text-muted">טוען...</p>;
  }

  const activeExercises = exercises.filter((e) => !e.archived);

  return (
    <>
      <PageHeader
        title={workout ? (workout.titleHe ?? "אימון ללא שם") : type === "challenge" ? "אתגר מעבר רמה חדש" : "אימון חדש"}
        description={
          type === "challenge"
            ? "האתגר הוא האימון האחרון ברמה. הלקוח מדווח בלחיצה אם עבר, ואם כן הוא עובר לרמה הבאה."
            : "בונים את האימון ממקטעים, בלוקים ותרגילים מהבנק. שומרים כטיוטה ומפרסמים כשהוא מוכן."
        }
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {type === "challenge" && <Chip tone="ember">אתגר מעבר רמה</Chip>}
            <Chip tone={status === "published" ? "volt" : "neutral"}>{STATUS_LABELS[status]}</Chip>
            <Link href={backHref} className={buttonClasses({ variant: "ghost", size: "md" })}>
              חזרה לרשימה
            </Link>
          </div>
        }
      />

      {/* details */}
      <section className="grid gap-4 rounded-2xl border border-border bg-surface p-6 md:grid-cols-2">
        <Field label="שם האימון" htmlFor="w-title" hint="חובה כדי לפרסם.">
          <TextInput
            id="w-title"
            value={titleHe}
            onChange={(e) => setTitleHe(e.target.value)}
            maxLength={150}
            placeholder="למשל: אימון 3 - סבולת"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="ענף" htmlFor="w-sport">
            <Select id="w-sport" value={sport} onChange={(e) => setSport(e.target.value as Sport)}>
              {SPORTS.map((value) => (
                <option key={value} value={value}>
                  {SPORT_LABELS[value]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="משך משוער (דקות)" htmlFor="w-minutes">
            <NumberInput
              id="w-minutes"
              min={1}
              max={600}
              value={estMinutes}
              onChange={(e) => setEstMinutes(e.target.value)}
            />
          </Field>
        </div>
        <Field label="תיאור קצר (לא חובה)" htmlFor="w-desc" className={type === "challenge" ? "" : "md:col-span-2"}>
          <TextArea
            id="w-desc"
            value={descriptionHe}
            onChange={(e) => setDescriptionHe(e.target.value)}
            maxLength={2000}
          />
        </Field>
        {type === "challenge" && (
          <Field
            label="מטרת האתגר (מה צריך לעשות כדי לעבור)"
            htmlFor="w-goal"
            hint="הלקוח רואה את זה ולוחץ ״עברתי״ או ״לא עברתי״. חובה כדי לפרסם."
          >
            <TextArea id="w-goal" value={goalHe} onChange={(e) => setGoalHe(e.target.value)} maxLength={1000} />
          </Field>
        )}
      </section>

      {/* content */}
      {sections.map((section, si) => (
        <section key={si} className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <Field label={`מקטע ${si + 1}`} htmlFor={`s-${si}-title`} className="min-w-52 flex-1">
              <TextInput
                id={`s-${si}-title`}
                value={section.title}
                onChange={(e) => patchSection(si, { title: e.target.value })}
                placeholder="למשל: חימום, עיקרי, קירור (לא חובה)"
                maxLength={100}
              />
            </Field>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                aria-label="הזזת המקטע למעלה"
                disabled={si === 0}
                onClick={() => setSections((prev) => moved(prev, si, -1))}
              >
                ↑
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="הזזת המקטע למטה"
                disabled={si === sections.length - 1}
                onClick={() => setSections((prev) => moved(prev, si, 1))}
              >
                ↓
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={sections.length === 1}
                onClick={() => setSections((prev) => prev.filter((_, i) => i !== si))}
              >
                מחיקת המקטע
              </Button>
            </div>
          </div>

          {section.blocks.map((block, bi) => (
            <BlockEditor
              key={bi}
              si={si}
              bi={bi}
              block={block}
              blockCount={section.blocks.length}
              exercises={activeExercises}
              exerciseMap={exerciseMap}
              onPatchBlock={(patch) => patchBlock(si, bi, patch)}
              onPatchLine={(li, patch) => patchLine(si, bi, li, patch)}
              onMoveBlock={(direction) => patchSection(si, { blocks: moved(section.blocks, bi, direction) })}
              onDeleteBlock={() => patchSection(si, { blocks: section.blocks.filter((_, i) => i !== bi) })}
            />
          ))}

          <div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => patchSection(si, { blocks: [...section.blocks, emptyBlock()] })}
            >
              <PlusIcon />
              בלוק חדש
            </Button>
          </div>
        </section>
      ))}

      <div>
        <Button variant="secondary" onClick={() => setSections((prev) => [...prev, emptySection()])}>
          <PlusIcon />
          מקטע חדש
        </Button>
      </div>

      {/* actions */}
      <div className="sticky bottom-0 z-10 -mx-gutter flex flex-col gap-3 border-t border-border bg-canvas/95 px-gutter py-4 backdrop-blur-md">
        {notice && (
          <div role={notice.tone === "error" ? "alert" : "status"} className="flex flex-col gap-1">
            <p className={`text-body-md ${notice.tone === "error" ? "text-ember" : "text-volt"}`}>{notice.text}</p>
            {notice.detail && <p className="text-body-md text-text-secondary">{notice.detail}</p>}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg" onClick={onSave} disabled={busy}>
            {busy ? "שומר..." : "שמירה"}
          </Button>
          {status !== "published" ? (
            <Button variant="secondary" size="lg" onClick={onSaveAndPublish} disabled={busy}>
              שמירה ופרסום
            </Button>
          ) : (
            <Button variant="secondary" size="lg" onClick={onUnpublish} disabled={busy}>
              הסרה מפרסום
            </Button>
          )}
          <Button variant="secondary" size="lg" onClick={onPreview} disabled={busy}>
            שמירה ותצוגת שלבים
          </Button>
          {workout && status === "draft" && (
            <>
              {confirmDelete ? (
                <span className="flex items-center gap-2">
                  <span className="text-body-md text-ember">למחוק את הטיוטה?</span>
                  <Button size="sm" onClick={onDelete} disabled={busy}>
                    כן, למחוק
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                    ביטול
                  </Button>
                </span>
              ) : (
                <Button variant="ghost" size="lg" onClick={() => setConfirmDelete(true)} disabled={busy}>
                  מחיקת הטיוטה
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {steps && (
        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-heading text-headline-md font-bold">כך הלקוח יעבור את האימון בליווי האפליקציה</h2>
          {steps.length === 0 ? (
            <p className="text-body-md text-text-secondary">עוד אין שלבים. הוסיפו תרגילים לאימון.</p>
          ) : (
            <ol className="flex flex-col gap-1.5">
              {steps.map((step) => (
                <li
                  key={step.index}
                  className={`flex gap-3 rounded-lg px-3 py-2 text-body-md ${
                    step.type === "rest" ? "bg-well text-text-secondary" : "bg-surface-raised"
                  }`}
                >
                  <span dir="ltr" className="w-7 shrink-0 text-start text-text-muted tabular-nums">
                    {step.index + 1}
                  </span>
                  <span>{describeStep(step)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </>
  );
}

function BlockEditor({
  si,
  bi,
  block,
  blockCount,
  exercises,
  exerciseMap,
  onPatchBlock,
  onPatchLine,
  onMoveBlock,
  onDeleteBlock,
}: {
  si: number;
  bi: number;
  block: FormBlock;
  blockCount: number;
  exercises: Exercise[];
  exerciseMap: Map<string, Exercise>;
  onPatchBlock: (patch: Partial<FormBlock>) => void;
  onPatchLine: (li: number, patch: Partial<FormLine>) => void;
  onMoveBlock: (direction: -1 | 1) => void;
  onDeleteBlock: () => void;
}) {
  const specs = BLOCK_FIELDS[block.style];
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-well p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <Field label={`בלוק ${bi + 1}`} htmlFor={`b-${si}-${bi}-style`}>
            <Select
              id={`b-${si}-${bi}-style`}
              value={block.style}
              onChange={(e) => onPatchBlock({ style: e.target.value as FormBlock["style"], values: {} })}
            >
              {STYLES.map((value) => (
                <option key={value} value={value}>
                  {STYLE_LABELS[value]}
                </option>
              ))}
            </Select>
          </Field>
          {specs.map((spec) => (
            <Field key={spec.key} label={spec.label} htmlFor={`b-${si}-${bi}-${spec.key}`}>
              <NumberInput
                id={`b-${si}-${bi}-${spec.key}`}
                className="w-40"
                min={spec.unit === "min" ? 0 : spec.min}
                step={spec.unit === "min" ? "any" : 1}
                value={block.values[spec.key] ?? ""}
                onChange={(e) => onPatchBlock({ values: { ...block.values, [spec.key]: e.target.value } })}
              />
            </Field>
          ))}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            aria-label="הזזת הבלוק למעלה"
            disabled={bi === 0}
            onClick={() => onMoveBlock(-1)}
          >
            ↑
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="הזזת הבלוק למטה"
            disabled={bi === blockCount - 1}
            onClick={() => onMoveBlock(1)}
          >
            ↓
          </Button>
          <Button variant="ghost" size="sm" disabled={blockCount === 1} onClick={onDeleteBlock}>
            מחיקת הבלוק
          </Button>
        </div>
      </div>

      <Field label="הערה לבלוק (לא חובה)" htmlFor={`b-${si}-${bi}-notes`}>
        <TextInput
          id={`b-${si}-${bi}-notes`}
          value={block.notes}
          onChange={(e) => onPatchBlock({ notes: e.target.value })}
          maxLength={500}
        />
      </Field>

      {block.lines.map((line, li) => (
        <LineEditor
          key={li}
          id={`l-${si}-${bi}-${li}`}
          index={li}
          line={line}
          lineCount={block.lines.length}
          exercises={exercises}
          exerciseMap={exerciseMap}
          onPatch={(patch) => onPatchLine(li, patch)}
          onMove={(direction) => onPatchBlock({ lines: moved(block.lines, li, direction) })}
          onDelete={() => onPatchBlock({ lines: block.lines.filter((_, i) => i !== li) })}
        />
      ))}

      <div>
        <Button variant="secondary" size="sm" onClick={() => onPatchBlock({ lines: [...block.lines, emptyLine()] })}>
          <PlusIcon />
          תרגיל
        </Button>
      </div>
    </div>
  );
}

function LineEditor({
  id,
  index,
  line,
  lineCount,
  exercises,
  exerciseMap,
  onPatch,
  onMove,
  onDelete,
}: {
  id: string;
  index: number;
  line: FormLine;
  lineCount: number;
  exercises: Exercise[];
  exerciseMap: Map<string, Exercise>;
  onPatch: (patch: Partial<FormLine>) => void;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
}) {
  const selected = line.exerciseId ? exerciseMap.get(line.exerciseId) : undefined;
  const specs = selected ? LINE_FIELDS[selected.measure] : [];

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Field label={`תרגיל ${index + 1}`} htmlFor={`${id}-ex`} className="min-w-60 flex-1">
          <Select
            id={`${id}-ex`}
            value={line.exerciseId}
            onChange={(e) => onPatch({ exerciseId: e.target.value, values: {}, loadHe: "" })}
          >
            <option value="">בחירת תרגיל מהבנק...</option>
            {selected?.archived && <option value={selected.id}>{selected.nameHe} (בארכיון)</option>}
            {SPORTS.map((sport) => {
              const group = exercises.filter((e) => e.sport === sport);
              if (group.length === 0) return null;
              return (
                <optgroup key={sport} label={SPORT_LABELS[sport]}>
                  {group.map((exercise) => (
                    <option key={exercise.id} value={exercise.id}>
                      {exercise.nameHe}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </Select>
        </Field>
        <div className="flex items-center gap-1">
          {selected && <Chip>{MEASURE_LABELS[selected.measure]}</Chip>}
          <Button variant="ghost" size="sm" aria-label="הזזת התרגיל למעלה" disabled={index === 0} onClick={() => onMove(-1)}>
            ↑
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="הזזת התרגיל למטה"
            disabled={index === lineCount - 1}
            onClick={() => onMove(1)}
          >
            ↓
          </Button>
          <Button variant="ghost" size="sm" disabled={lineCount === 1} onClick={onDelete}>
            הסרה
          </Button>
        </div>
      </div>

      {selected && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {specs.map((spec) => (
            <Field key={spec.key} label={spec.label + (spec.required ? " *" : "")} htmlFor={`${id}-${spec.key}`}>
              <NumberInput
                id={`${id}-${spec.key}`}
                min={spec.unit === "min" ? 0 : spec.min}
                max={spec.unit === "min" ? undefined : spec.max}
                step={spec.unit === "min" ? "any" : 1}
                value={line.values[spec.key] ?? ""}
                onChange={(e) => onPatch({ values: { ...line.values, [spec.key]: e.target.value } })}
              />
            </Field>
          ))}
          {selected.measure === "reps" && (
            <Field
              label="עומס / משקל (טקסט חופשי)"
              htmlFor={`${id}-load`}
              className="col-span-2 sm:col-span-3 lg:col-span-2"
            >
              <TextInput
                id={`${id}-load`}
                value={line.loadHe}
                onChange={(e) => onPatch({ loadHe: e.target.value })}
                maxLength={100}
                placeholder="למשל: בינוני, 70% מהמקסימום"
              />
            </Field>
          )}
          <Field label="הערה לתרגיל" htmlFor={`${id}-notes`} className="col-span-2 sm:col-span-3 lg:col-span-5">
            <TextInput
              id={`${id}-notes`}
              value={line.notesHe}
              onChange={(e) => onPatch({ notesHe: e.target.value })}
              maxLength={500}
            />
          </Field>
        </div>
      )}
    </div>
  );
}
