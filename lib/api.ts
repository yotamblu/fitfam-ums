import type { Customer, CurrentUser, Plan } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/** An error response from the API: `{"error": "<code>"}` with an HTTP status. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
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
    try {
      const body = (await response.json()) as { error?: string };
      code = body.error ?? code;
    } catch {
      // body was not JSON; keep "unknown"
    }
    throw new ApiError(response.status, code);
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
  addUser: (email: string, planSlugs: string[]) =>
    request<Customer>("/admin/users", {
      method: "POST",
      body: JSON.stringify({ email, planSlugs }),
    }),
};
