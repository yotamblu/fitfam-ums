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

export type WaitlistPage = {
  total: number;
  page: number;
  size: number;
  items: WaitlistEntry[];
};
