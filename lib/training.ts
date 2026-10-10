// Labels, field definitions and form <-> API conversion for the exercise bank and the workout editor.
// The field lists mirror WorkoutContentValidator in fitfam-api: which fields a line may carry depends on how its
// exercise is measured. The API re-checks everything; this only decides which inputs to show.

import type {
  BlockStyle,
  ContentBlock,
  ContentLine,
  Exercise,
  Measure,
  Sport,
  Step,
  StepTarget,
  WorkoutContent,
  WorkoutStatus,
} from "./types";

export const SPORTS: Sport[] = ["running", "swimming", "gym", "calisthenics"];

export const SPORT_LABELS: Record<Sport, string> = {
  running: "ריצה",
  swimming: "שחייה",
  gym: "חדר כושר",
  calisthenics: "קליסטניקס",
};

export const MEASURES: Measure[] = ["reps", "hold_time", "distance", "duration", "calories", "max_effort"];

export const MEASURE_LABELS: Record<Measure, string> = {
  reps: "חזרות",
  hold_time: "החזקה (זמן)",
  distance: "מרחק",
  duration: "משך זמן",
  calories: "קלוריות",
  max_effort: "מקסימום (עד כשל)",
};

export const MEASURE_HINTS: Record<Measure, string> = {
  reps: "למשל שכיבות סמיכה, סקוואט: סטים × חזרות",
  hold_time: "למשל פלאנק, תלייה: סטים × שניות",
  distance: "למשל ריצה או שחייה: מרחק, אזור ו-RPE",
  duration: "למשל ריצה קלה 20 דקות: משך, אזור ו-RPE",
  calories: "למשל חתירה, סקי-ארג: קלוריות",
  max_effort: "למשל מתח עד כשל: סטים ומנוחה",
};

export const STYLES: BlockStyle[] = ["straight", "circuit", "amrap", "emom", "for_time"];

export const STYLE_LABELS: Record<BlockStyle, string> = {
  straight: "רגיל (סטים)",
  circuit: "סבב (מעגל)",
  amrap: "AMRAP (כמה שיותר בזמן)",
  emom: "EMOM (כל דקה/מרווח)",
  for_time: "על זמן",
};

export const STATUS_LABELS: Record<WorkoutStatus, string> = {
  draft: "טיוטה",
  published: "מפורסם",
  archived: "בארכיון",
};

// ---- field definitions ----

export type FieldSpec = {
  key: string;
  label: string;
  min: number;
  max: number;
  /** "min": shown in minutes, stored in seconds. */
  unit?: "min";
  required?: boolean;
};

const REST: FieldSpec = { key: "restSec", label: "מנוחה אחרי (שניות)", min: 0, max: 3600 };
const RPE: FieldSpec = { key: "rpe", label: "RPE (1-10)", min: 1, max: 10 };
const ZONE: FieldSpec = { key: "zone", label: "אזור (1-5)", min: 1, max: 5 };
const SETS: FieldSpec = { key: "sets", label: "סטים", min: 1, max: 20 };

export const LINE_FIELDS: Record<Measure, FieldSpec[]> = {
  reps: [
    SETS,
    { key: "reps", label: "חזרות", min: 1, max: 1000, required: true },
    { key: "repsMax", label: "עד (לטווח, לא חובה)", min: 1, max: 1000 },
    RPE,
    REST,
  ],
  hold_time: [SETS, { key: "durationSec", label: "משך (שניות)", min: 1, max: 7200, required: true }, RPE, REST],
  distance: [
    { key: "reps", label: "חזרות על המקטע", min: 1, max: 100 },
    { key: "distanceM", label: "מרחק (מטרים)", min: 1, max: 100000, required: true },
    ZONE,
    RPE,
    REST,
  ],
  duration: [
    { key: "reps", label: "חזרות", min: 1, max: 100 },
    { key: "durationSec", label: "משך (דקות)", min: 1, max: 7200, unit: "min", required: true },
    ZONE,
    RPE,
    REST,
  ],
  calories: [{ key: "calories", label: "קלוריות", min: 1, max: 2000, required: true }, ZONE, RPE, REST],
  max_effort: [SETS, { key: "capSec", label: "תקרת זמן (שניות, לא חובה)", min: 1, max: 7200 }, RPE, REST],
};

export const BLOCK_FIELDS: Record<BlockStyle, FieldSpec[]> = {
  straight: [],
  circuit: [
    { key: "rounds", label: "סבבים", min: 1, max: 20 },
    { key: "restBetweenLinesSec", label: "מנוחה בין תרגילים (שניות)", min: 0, max: 3600 },
    { key: "restBetweenRoundsSec", label: "מנוחה בין סבבים (שניות)", min: 0, max: 3600 },
  ],
  amrap: [{ key: "durationSec", label: "משך (דקות)", min: 1, max: 7200, unit: "min", required: true }],
  emom: [
    { key: "durationSec", label: "משך כולל (דקות)", min: 1, max: 7200, unit: "min", required: true },
    { key: "intervalSec", label: "כל כמה שניות (ברירת מחדל 60)", min: 10, max: 600 },
  ],
  for_time: [
    { key: "rounds", label: "סבבים", min: 1, max: 20 },
    { key: "capSec", label: "תקרת זמן (דקות, לא חובה)", min: 1, max: 7200, unit: "min" },
  ],
};

// ---- form model: every number is kept as the text the coach typed ----

export type FormLine = {
  id?: string;
  exerciseId: string;
  values: Record<string, string>;
  loadHe: string;
  notesHe: string;
};
export type FormBlock = {
  id?: string;
  style: BlockStyle;
  values: Record<string, string>;
  notes: string;
  lines: FormLine[];
};
export type FormSection = { id?: string; title: string; blocks: FormBlock[] };

export function emptyLine(): FormLine {
  return { exerciseId: "", values: {}, loadHe: "", notesHe: "" };
}

export function emptyBlock(style: BlockStyle = "straight"): FormBlock {
  return { style, values: {}, notes: "", lines: [emptyLine()] };
}

export function emptySection(): FormSection {
  return { title: "", blocks: [emptyBlock()] };
}

function toText(value: unknown, unit?: "min"): string {
  if (typeof value !== "number") return "";
  return unit === "min" ? String(Math.round((value / 60) * 100) / 100) : String(value);
}

function toNumber(text: string | undefined, unit?: "min"): number | undefined {
  if (text === undefined || text.trim() === "") return undefined;
  const parsed = Number(text);
  if (!Number.isFinite(parsed)) return undefined;
  return unit === "min" ? Math.round(parsed * 60) : Math.round(parsed);
}

export function contentToForm(content: WorkoutContent, exercises: Map<string, Exercise>): FormSection[] {
  return (content.sections ?? []).map((section) => ({
    id: section.id,
    title: section.title ?? "",
    blocks: (section.blocks ?? []).map((block) => {
      const blockValues: Record<string, string> = {};
      for (const spec of BLOCK_FIELDS[block.style] ?? []) {
        blockValues[spec.key] = toText(block[spec.key], spec.unit);
      }
      return {
        id: block.id,
        style: block.style,
        notes: block.notes ?? "",
        values: blockValues,
        lines: (block.lines ?? []).map((line) => {
          const measure = exercises.get(line.exerciseId)?.measure;
          const values: Record<string, string> = {};
          for (const spec of measure ? LINE_FIELDS[measure] : []) {
            values[spec.key] = toText(line[spec.key], spec.unit);
          }
          return {
            id: line.id,
            exerciseId: line.exerciseId,
            values,
            loadHe: typeof line.loadHe === "string" ? line.loadHe : "",
            notesHe: typeof line.notesHe === "string" ? line.notesHe : "",
          };
        }),
      };
    }),
  }));
}

/** Turns the form into the API's content tree, sending only the fields each exercise type allows. */
export function formToContent(sections: FormSection[], exercises: Map<string, Exercise>): WorkoutContent {
  return {
    sections: sections.map((section) => {
      const out: WorkoutContent["sections"][number] = {
        blocks: section.blocks.map((block) => {
          const outBlock: ContentBlock = { style: block.style, lines: [] };
          if (block.id) outBlock.id = block.id;
          if (block.notes.trim()) outBlock.notes = block.notes.trim();
          for (const spec of BLOCK_FIELDS[block.style]) {
            const value = toNumber(block.values[spec.key], spec.unit);
            if (value !== undefined) outBlock[spec.key] = value;
          }
          outBlock.lines = block.lines
            .filter((line) => line.exerciseId)
            .map((line) => {
              const measure = exercises.get(line.exerciseId)?.measure;
              const outLine: ContentLine = { exerciseId: line.exerciseId };
              if (line.id) outLine.id = line.id;
              if (measure) {
                for (const spec of LINE_FIELDS[measure]) {
                  const value = toNumber(line.values[spec.key], spec.unit);
                  if (value !== undefined) outLine[spec.key] = value;
                }
                if (measure === "reps" && line.loadHe.trim()) outLine.loadHe = line.loadHe.trim();
              }
              if (line.notesHe.trim()) outLine.notesHe = line.notesHe.trim();
              return outLine;
            });
          return outBlock;
        }),
      };
      if (section.id) out.id = section.id;
      if (section.title.trim()) out.title = section.title.trim();
      return out;
    }),
  };
}

// ---- Hebrew descriptions (the "what will the customer be walked through" preview) ----

export function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds} שניות`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest === 0 ? `${minutes} דק׳` : `${minutes}:${String(rest).padStart(2, "0")} דק׳`;
}

export function formatDistance(meters: number): string {
  return meters >= 1000 && meters % 100 === 0 ? `${meters / 1000} ק״מ` : `${meters} מ׳`;
}

export function describeTarget(target: StepTarget): string {
  const parts: string[] = [target.exercise?.nameHe ?? "תרגיל לא ידוע"];
  if (target.reps !== null) {
    parts.push(target.repsMax !== null ? `${target.reps}-${target.repsMax} חזרות` : `${target.reps} חזרות`);
  }
  if (target.durationSec !== null) parts.push(formatSeconds(target.durationSec));
  if (target.distanceM !== null) parts.push(formatDistance(target.distanceM));
  if (target.calories !== null) parts.push(`${target.calories} קלוריות`);
  if (target.capSec !== null) parts.push(`עד ${formatSeconds(target.capSec)}`);
  if (target.zone !== null) parts.push(`אזור ${target.zone}`);
  if (target.rpe !== null) parts.push(`RPE ${target.rpe}`);
  if (target.loadHe) parts.push(target.loadHe);
  return parts.join(" · ");
}

export function describeStep(step: Step): string {
  if (step.type === "rest") return `מנוחה · ${formatSeconds(step.durationSec ?? 0)}`;
  if (step.type === "timed_block") {
    const head: string[] = [STYLE_LABELS[step.blockStyle]];
    if (step.durationSec !== null) head.push(formatSeconds(step.durationSec));
    if (step.roundCount !== null) head.push(`${step.roundCount} סבבים`);
    if (step.capSec !== null) head.push(`תקרה ${formatSeconds(step.capSec)}`);
    return `${head.join(" · ")}: ${(step.targets ?? []).map(describeTarget).join(" | ")}`;
  }
  const prefix: string[] = [];
  if (step.roundNumber !== null && step.roundCount !== null) prefix.push(`סבב ${step.roundNumber}/${step.roundCount}`);
  if (step.setNumber !== null && step.setCount !== null && step.setCount > 1) {
    prefix.push(`סט ${step.setNumber}/${step.setCount}`);
  }
  const target = step.target ? describeTarget(step.target) : "";
  return prefix.length ? `${prefix.join(" · ")} · ${target}` : target;
}

// ---- turning the API's content error detail into something a coach can act on ----

const REASON_LABELS: Record<string, string> = {
  required: "שדה חובה חסר",
  out_of_range: "הערך מחוץ לטווח המותר",
  integer_expected: "צריך להזין מספר שלם",
  not_allowed: "השדה לא מתאים לסוג התרגיל או הבלוק",
  archived: "התרגיל בארכיון",
  not_found: "התרגיל לא קיים בבנק",
  below_reps: "הערך של ״עד״ קטן ממספר החזרות",
  duplicate: "מזהה כפול",
  invalid: "הערך אינו תקין",
  empty: "צריך לפחות תרגיל אחד באימון",
};

const FIELD_LABELS: Record<string, string> = (() => {
  const labels: Record<string, string> = { exerciseId: "תרגיל", style: "סוג הבלוק", lines: "התרגילים" };
  for (const specs of [...Object.values(LINE_FIELDS), ...Object.values(BLOCK_FIELDS)]) {
    for (const spec of specs) labels[spec.key] = spec.label;
  }
  return labels;
})();

/** "sections[0].blocks[1].lines[2].reps:required" -> "מקטע 1, בלוק 2, תרגיל 3: חזרות — שדה חובה חסר". */
export function describeContentError(detail: string | undefined): string | null {
  if (!detail) return null;
  const [path, reason] = detail.split(":");
  const place: string[] = [];
  const section = /sections\[(\d+)\]/.exec(path);
  const block = /blocks\[(\d+)\]/.exec(path);
  const line = /lines\[(\d+)\]/.exec(path);
  if (section) place.push(`מקטע ${Number(section[1]) + 1}`);
  if (block) place.push(`בלוק ${Number(block[1]) + 1}`);
  if (line) place.push(`תרגיל ${Number(line[1]) + 1}`);
  const field = path.split(".").pop()?.replace(/\[\d+\]$/, "") ?? "";
  const fieldLabel = FIELD_LABELS[field];
  const reasonLabel = REASON_LABELS[reason] ?? reason;
  const where = place.length ? `${place.join(", ")}: ` : "";
  return `${where}${fieldLabel ? `${fieldLabel} — ` : ""}${reasonLabel}`;
}
