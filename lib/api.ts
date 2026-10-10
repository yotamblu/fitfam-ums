import type {
  Customer,
  CurrentUser,
  Exercise,
  ExerciseInput,
  LevelWorkouts,
  Plan,
  PlanTree,
  Steps,
  WaitlistPage,
  Workout,
  WorkoutInput,
} from "./types";

// Same-origin by default: app/backend/[...path]/route.ts forwards /backend/* to the API (see API_ORIGIN there).
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/backend";

/** An error response from the API: `{"error": "<code>"}` with an HTTP status. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    /** Short technical hint from the API, e.g. the path of an invalid workout field. */
    public readonly detail?: string,
  ) {
    super(code);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  // credentials: "include" sends the HttpOnly session cookie; the token itself is never visible to this code.
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init.headers },
  });

  if (!response.ok) {
    let code = "unknown";
    let detail: string | undefined;
    try {
      const body = (await response.json()) as { error?: string; detail?: string };
      code = body.error ?? code;
      detail = body.detail;
    } catch {
      // body was not JSON; keep "unknown"
    }
    throw new ApiError(response.status, code, detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export const api = {
  me: () => request<CurrentUser>("/auth/me"),
  loginWithGoogle: (credential: string) =>
    request<CurrentUser>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential }),
    }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  listPlans: () => request<Plan[]>("/admin/plans"),
  listUsers: () => request<Customer[]>("/admin/users"),
  listWaitlist: (params: {
    page: number;
    size: number;
    q?: string;
    status?: "all" | "waiting";
    sport?: string;
  }) => {
    const query = new URLSearchParams({ page: String(params.page), size: String(params.size) });
    if (params.q) query.set("q", params.q);
    if (params.status === "waiting") query.set("status", "waiting");
    if (params.sport) query.set("sport", params.sport);
    return request<WaitlistPage>(`/admin/waitlist?${query.toString()}`);
  },
  addUser: (email: string, planSlugs: string[]) =>
    request<Customer>("/admin/users", {
      method: "POST",
      body: JSON.stringify({ email, planSlugs }),
    }),

  // ---- exercise bank ----
  listExercises: (params: { sport?: string; q?: string; archived?: boolean } = {}) => {
    const query = new URLSearchParams();
    if (params.sport) query.set("sport", params.sport);
    if (params.q) query.set("q", params.q);
    if (params.archived) query.set("archived", "true");
    return request<Exercise[]>(`/admin/exercises?${query.toString()}`);
  },
  createExercise: (input: ExerciseInput) =>
    request<Exercise>("/admin/exercises", { method: "POST", body: JSON.stringify(input) }),
  updateExercise: (id: string, input: ExerciseInput) =>
    request<Exercise>(`/admin/exercises/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  archiveExercise: (id: string) => request<Exercise>(`/admin/exercises/${id}/archive`, { method: "POST" }),
  restoreExercise: (id: string) => request<Exercise>(`/admin/exercises/${id}/restore`, { method: "POST" }),

  // ---- plans, levels and workouts ----
  planTree: () => request<PlanTree[]>("/admin/training/plans"),
  levelWorkouts: (levelId: string) => request<LevelWorkouts>(`/admin/levels/${levelId}/workouts`),
  reorderWorkouts: (levelId: string, ids: string[]) =>
    request<LevelWorkouts>(`/admin/levels/${levelId}/workouts/order`, {
      method: "PUT",
      body: JSON.stringify({ ids }),
    }),
  createWorkout: (levelId: string, input: WorkoutInput) =>
    request<Workout>(`/admin/levels/${levelId}/workouts`, { method: "POST", body: JSON.stringify(input) }),
  getWorkout: (id: string) => request<Workout>(`/admin/workouts/${id}`),
  updateWorkout: (id: string, input: WorkoutInput) =>
    request<Workout>(`/admin/workouts/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  deleteWorkout: (id: string) => request<void>(`/admin/workouts/${id}`, { method: "DELETE" }),
  publishWorkout: (id: string) => request<Workout>(`/admin/workouts/${id}/publish`, { method: "POST" }),
  unpublishWorkout: (id: string) => request<Workout>(`/admin/workouts/${id}/unpublish`, { method: "POST" }),
  archiveWorkout: (id: string) => request<Workout>(`/admin/workouts/${id}/archive`, { method: "POST" }),
  restoreWorkout: (id: string) => request<Workout>(`/admin/workouts/${id}/restore`, { method: "POST" }),
  duplicateWorkout: (id: string, levelId?: string) =>
    request<Workout>(`/admin/workouts/${id}/duplicate`, {
      method: "POST",
      body: JSON.stringify(levelId ? { levelId } : {}),
    }),
  workoutSteps: (id: string) => request<Steps>(`/admin/workouts/${id}/steps`),
};
