@AGENTS.md

# fitfam-ums (FitFam User Management System)

Internal admin site for the FitFam team (never for customers). Next.js 16.3.8 (App Router), React 19, Tailwind 4,
TypeScript, npm. Hebrew RTL UI.

This repo is PUBLIC. Never commit secrets, and keep code, README and commit messages free of business details (real
plan names, level names, pricing, strategy, customer data). Plan and level names come from the API at runtime; do not
hardcode them. Business context may exist in a private `../CLAUDE.md` outside this repo; never copy it here.

## Rules
- This site only calls the FitFam API (`lib/api.ts`, `fetch` with `credentials: "include"`). It never touches the
  database and never sees the session token (HttpOnly cookie set by the API). Authorisation is enforced by the API;
  the UI hiding things is never the only protection.
- Login is Google only (Google's own button in `components/GoogleSignIn.tsx`); the API decides who is an admin.
- API response types are hand-written in `lib/types.ts` and must be kept in sync with the API until they are generated
  from an OpenAPI spec.
- Hebrew RTL (`dir="rtl"`); emails, numbers and dates are wrapped `dir="ltr"`. Use the theme tokens in
  `app/globals.css` (copied from the customer app's design tokens); do not hardcode hex values, sizes or radii.
- Show Hebrew, user-facing error messages (`lib/messages.ts`) and never raw error codes.
- ESLint (React hooks rules) rejects calling a loader that sets state directly from an effect: set state inside the
  promise callbacks, or call the loader from event handlers.

## Structure
`app/` (root layout, theme tokens in `globals.css`, tab icon, and the `(admin)` route group: its `layout.tsx` wraps every
page in `AdminShell`, so the login survives navigation; pages are `/` users, `/add` add a customer, `/waitlist`, `/plans` and `/plans/[levelId]` (ordered workouts of a plan level), `/workouts/[id]` (editor; `new` with `?levelId=&type=`), `/exercises` (exercise bank)) ·
`components/` (`AdminShell` login + header + nav, `AdminSession` context with `useAdminSession`, `UsersPage`,
`AddUserPage`, `WaitlistPage`, `GoogleSignIn`, and `ui/` primitives: `Button`, `Chip`, `StatCard`, `SegmentedControl`,
`SearchInput`, `PageHeader`, `Avatar`, `Backdrop`, `Field`, `icons`; training pages: `PlansPage`, `LevelWorkoutsPage`, `WorkoutEditorPage`, `ExercisesPage`) · `lib/` (`api.ts`, `types.ts`, `messages.ts`, `sports.ts`, `training.ts`: labels, per-exercise-type field lists that mirror the API validator, form <-> API content conversion, Hebrew step descriptions) ·
`public/` (logo).
To add an admin page: create `app/(admin)/<name>/page.tsx`, add it to `NAV_ITEMS` in `AdminShell`, and get the
session/`onSessionLost` from `useAdminSession()`.

## Design
Same system as the customer app (`../fitfam-web/docs/design-system/`, "Legacy" palette): tokens are copied into
`app/globals.css` (canvas/surface/ember/volt/info, Heebo + Assistant, radii, glows, `animate-rise`). Reuse the `ui/`
primitives instead of styling from scratch; never hardcode hex values or sizes. Layout is desktop-first (max-w-6xl),
mobile-friendly. Adding a customer lives on its own page (`/add`) on purpose, separate from the waitlist list; the
waitlist's "הוספה כלקוח" button links there with `?email=` (read via `useSearchParams`, which needs a Suspense boundary).

## Config and commands
- `.env.local` (gitignored): `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. The app calls the API only through its own forwarding route
  (`app/backend/[...path]/route.ts`, `/backend/*`), which uses the server-side `API_ORIGIN` (defaults to
  `http://localhost:8081` in development; REQUIRED in production, else it answers 503 `api_not_configured`).
  `NEXT_PUBLIC_API_URL` must stay unset in production (a direct browser call from another domain loses the cookie).
  `NEXT_PUBLIC_` values are public by design: never put a secret in one.
- `npm run dev` (port 3001; the customer app uses 3000) needs the API running. `npm run lint`, `npm run build`.
  Never run `npm run build` while `npm run dev` runs in the same folder.
- `http://localhost:3001` must be listed under the Google OAuth client's Authorized JavaScript origins.
- The waitlist page shows signups from the public waitlist site via the API's `GET /admin/waitlist` (read-only; supports
  `page`, `size`, `q` search, `status=waiting` and `sport` filters, and returns a `summary` with whole-list totals).
  `lib/sports.ts` maps the waitlist's sport ids to Hebrew labels (the same labels that public site shows).
- The training pages call `/admin/exercises`, `/admin/training/plans`, `/admin/levels/**` and `/admin/workouts/**` (all under the proxy's `admin/` allowlist). Times are stored in seconds; the editor shows minutes for some fields (`unit: "min"` in `lib/training.ts`). API `invalid_content` errors carry a `detail` path that `describeContentError` turns into Hebrew. A new workout is created on first save and the address is swapped with `history.replaceState` (a router navigation would remount the page and lose the notice and preview).
- Not built yet: change a customer's plan/level, remove a customer, copy a workout to another level (the API supports it). (Waitlist -> customer works as a link to `/add` with
  the email pre-filled; the waitlist row flips to "כבר משתמש" once the customer exists.)

## Security rules (audited 2026-10-07)
- Authorisation is the API's job (admin role checked on every request). Never rely on hiding UI, and never add
  pages that show data without the shell's admin check.
- The only server-side code is the forwarding route `app/backend/[...path]/route.ts` (fixed `API_ORIGIN`, allowlist
  `auth/` + `admin/`, same-site `Origin` check, rejects `..`/slashes/null bytes in path segments, forwards only
  content-type/accept/cookie, `maxDuration` 60). Do not widen it or add other route handlers, server actions or
  secrets without a security review. Never use `dangerouslySetInnerHTML`/`eval`, never store tokens in browser
  storage, never put a secret in a `NEXT_PUBLIC_` variable.
- Keep the headers in `next.config.ts` (frame-ancestors/X-Frame-Options DENY, nosniff, referrer, permissions, HSTS)
  and `app/robots.ts`. A nonce-based `script-src` CSP is a possible later step (Next injects inline scripts).
- Do NOT set `Cross-Origin-Opener-Policy: same-origin`: it breaks Google's sign-in popup.

## Deployment (Vercel)
Import the repo as a Vercel project; set `API_ORIGIN` (the API's https address) and `NEXT_PUBLIC_GOOGLE_CLIENT_ID`;
pick the function region next to the API/database; add the site's https address to the Google OAuth client's
Authorized JavaScript origins. See README.

## Before pushing
Scan the commits for real secret values and business details. Do not push without being asked.
