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
`app/` (layout, page, global CSS) · `components/` (`AdminApp` session state, `Dashboard`, `AddCustomerForm`,
`CustomersTable`, `GoogleSignIn`) · `lib/` (`api.ts`, `types.ts`, `messages.ts`).

## Config and commands
- `.env.local` (gitignored): `NEXT_PUBLIC_API_URL` (default `http://localhost:8081`) and `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
  `NEXT_PUBLIC_` values are public by design: never put a secret in one.
- `npm run dev` (port 3001; the customer app uses 3000) needs the API running. `npm run lint`, `npm run build`.
  Never run `npm run build` while `npm run dev` runs in the same folder.
- `http://localhost:3001` must be listed under the Google OAuth client's Authorized JavaScript origins.
- Not built yet: change a customer's plan/level, remove a customer.

## Before pushing
Scan the commits for real secret values and business details. Do not push without being asked.
