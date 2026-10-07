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
page in `AdminShell`, so the login survives navigation; pages are `/` users, `/add` add a customer, `/waitlist`) ·
`components/` (`AdminShell` login + header + nav, `AdminSession` context with `useAdminSession`, `UsersPage`,
`AddUserPage`, `WaitlistPage`, `GoogleSignIn`, and `ui/` primitives: `Button`, `Chip`, `StatCard`, `SegmentedControl`,
`SearchInput`, `PageHeader`, `Avatar`, `Backdrop`, `icons`) · `lib/` (`api.ts`, `types.ts`, `messages.ts`, `sports.ts`) ·
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
- `.env.local` (gitignored): `NEXT_PUBLIC_API_URL` (default `http://localhost:8081`) and `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
  `NEXT_PUBLIC_` values are public by design: never put a secret in one.
- `npm run dev` (port 3001; the customer app uses 3000) needs the API running. `npm run lint`, `npm run build`.
  Never run `npm run build` while `npm run dev` runs in the same folder.
- `http://localhost:3001` must be listed under the Google OAuth client's Authorized JavaScript origins.
- The waitlist page shows signups from the public waitlist site via the API's `GET /admin/waitlist` (read-only; supports
  `page`, `size`, `q` search, `status=waiting` and `sport` filters, and returns a `summary` with whole-list totals).
  `lib/sports.ts` maps the waitlist's sport ids to Hebrew labels (the same labels that public site shows).
- Not built yet: change a customer's plan/level, remove a customer. (Waitlist -> customer works as a link to `/add` with
  the email pre-filled; the waitlist row flips to "כבר משתמש" once the customer exists.)

## Before pushing
Scan the commits for real secret values and business details. Do not push without being asked.
