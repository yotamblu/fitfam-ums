// Hand-written to match fitfam-api responses. To be replaced by types generated from the API's OpenAPI spec.

export type CurrentUser = {
  id: string;
  email: string;
  role: "admin" | "customer";
  displayName: string | null;
  avatarUrl: string | null;
};

export type Level = {
  levelNumber: number;
  slug: string;
  nameHe: string | null;
};

export type Plan = {
  slug: string;
  nameHe: string | null;
  levels: Level[];
};

export type Enrollment = {
  planSlug: string;
  planNameHe: string | null;
  levelNumber: number;
  levelSlug: string;
  levelNameHe: string | null;
  status: string;
};

export type Customer = {
  id: string;
  email: string;
  role: "admin" | "customer";
  status: "invited" | "active";
  displayName: string | null;
  firstLoginAt: string | null;
  enrollments: Enrollment[];
};

export type WaitlistEntry = {
  id: string;
  email: string;
  favoriteSport: string | null;
  createdAt: string;
  /** This email already has a user (an account added by an admin). */
  alreadyUser: boolean;
};

export type WaitlistSummary = {
  /** Everyone on the waitlist, whatever the current search/filter is. */
  total: number;
  alreadyUsers: number;
  /** Counts per sport id; "none" = no favorite sport chosen. */
  bySport: Record<string, number>;
};

export type WaitlistPage = {
  /** Rows matching the current search/filter (for paging). */
  total: number;
  page: number;
  size: number;
  items: WaitlistEntry[];
  summary: WaitlistSummary;
};

// ---- training content (exercise bank and workouts) ----

export type Sport = "running" | "swimming" | "gym" | "calisthenics";
export type Measure = "reps" | "hold_time" | "distance" | "duration" | "calories" | "max_effort";
export type BlockStyle = "straight" | "circuit" | "amrap" | "emom" | "for_time" | "endurance";
export type WorkoutStatus = "draft" | "published" | "archived";
export type WorkoutType = "regular" | "challenge";

export type Exercise = {
  id: string;
  nameHe: string;
  sport: Sport;
  measure: Measure;
  equipment: string[];
  muscleGroups: string[];
  descriptionHe: string | null;
  cuesHe: string | null;
  youtubeId: string | null;
  videoUrl: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ExerciseInput = {
  nameHe: string;
  sport: Sport;
  measure: Measure;
  equipment: string[];
  muscleGroups: string[];
  descriptionHe: string;
  cuesHe: string;
  /** Optional YouTube link; empty means no video. */
  videoUrl: string;
};

export type LevelSummary = {
  id: string;
  levelNumber: number;
  slug: string;
  nameHe: string | null;
  workoutCount: number;
  publishedCount: number;
  hasChallenge: boolean;
};

export type PlanTree = {
  slug: string;
  nameHe: string | null;
  levels: LevelSummary[];
};

export type WorkoutSummary = {
  id: string;
  sortOrder: number;
  type: WorkoutType;
  sport: Sport;
  status: WorkoutStatus;
  titleHe: string | null;
  estMinutes: number | null;
  lineCount: number;
  updatedAt: string;
};

export type LevelWorkouts = {
  levelId: string;
  planSlug: string;
  planNameHe: string | null;
  levelNumber: number;
  levelNameHe: string | null;
  workouts: WorkoutSummary[];
};

/** The workout content tree as stored by the API (integers only; every time is in seconds). */
export type ContentLine = { id?: string; exerciseId?: string; [field: string]: string | number | undefined };
export type ContentBlock = {
  id?: string;
  style: BlockStyle;
  notes?: string;
  lines: ContentLine[];
  [field: string]: string | number | ContentLine[] | undefined;
};
export type ContentSection = { id?: string; title?: string; blocks: ContentBlock[] };
export type WorkoutContent = { sections: ContentSection[] };

export type Workout = {
  id: string;
  levelId: string;
  sortOrder: number;
  type: WorkoutType;
  sport: Sport;
  status: WorkoutStatus;
  titleHe: string | null;
  descriptionHe: string | null;
  goalHe: string | null;
  estMinutes: number | null;
  content: WorkoutContent;
  updatedAt: string;
};

export type WorkoutInput = {
  sport: Sport;
  type?: WorkoutType;
  titleHe: string;
  descriptionHe: string;
  goalHe: string;
  estMinutes: number | null;
  content: WorkoutContent;
};

export type StepTarget = {
  exercise: { id: string; nameHe: string; measure: Measure; youtubeId: string | null } | null;
  reps: number | null;
  repsMax: number | null;
  durationSec: number | null;
  distanceM: number | null;
  calories: number | null;
  capSec: number | null;
  zone: number | null;
  rpe: number | null;
  loadHe: string | null;
  notesHe: string | null;
};

export type Step = {
  index: number;
  type: "work" | "rest" | "timed_block";
  sectionTitle: string | null;
  blockStyle: BlockStyle;
  setNumber: number | null;
  setCount: number | null;
  roundNumber: number | null;
  roundCount: number | null;
  durationSec: number | null;
  intervalSec: number | null;
  capSec: number | null;
  target: StepTarget | null;
  targets: StepTarget[] | null;
};

export type Steps = { workoutId: string; resumeStep: number; steps: Step[] };
