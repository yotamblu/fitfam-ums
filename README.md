# FitFam User Management System (UMS)

The **internal admin website** for the FitFam team. It is not for customers.

> **Status: early development.** Admin login with Google and a form to add customers (with their plans) work against the
> FitFam API. The rest is planned. This site never talks to the database directly; it only calls the API.

**Audience:** the FitFam team only.

---

## Table of contents

1. [Where this fits](#where-this-fits)
2. [Features](#features)
3. [Tech stack](#tech-stack)
4. [Prerequisites](#prerequisites)
5. [Quick start](#quick-start)
6. [Available scripts](#available-scripts)
7. [Project structure](#project-structure)
8. [Configuration and secrets](#configuration-and-secrets)
9. [Access control](#access-control)
10. [Open decisions](#open-decisions)
11. [Roadmap](#roadmap)
12. [Git workflow](#git-workflow)
13. [Related repositories](#related-repositories)

---

## Where this fits

| Repo | Role |
|------|------|
| [fitfam-web](https://github.com/yotamblu/fitfam-web) | The customer app (Next.js PWA). |
| [fitfam-api](https://github.com/yotamblu/fitfam-api) | Spring Boot backend; the only component planned to talk to the database. |
| **fitfam-ums** (this repo) | Internal admin site. |

## Features

The app has three clearly separate areas, shown in the top navigation:

- **Users** (`/`): everyone who has access, with a summary (total, active, invited, admins), a status filter, search by
  email or name, and each person's plans and level. A "הוספת לקוח" button leads to the add page.
- **Add a customer** (`/add`): its own page for adding someone: their Google email and the plans they purchased (plans
  come from the API). A success screen confirms it and offers "add another". The email can be pre-filled from the waitlist.
- **Waitlist** (`/waitlist`): signups from the public waitlist site, read-only, with totals (signed up, already users,
  still waiting), search, a "waiting only" filter, a favorite-sport filter and paging. Each person who is not yet a user
  has a "הוספה כלקוח" button that opens the add page with their email filled in.
- **Admin login**: "Sign in with Google". Only accounts the API recognises as admins get in.

The look follows the customer app's design system: dark canvas with ember and volt accents, hairline borders, pill
buttons, Heebo and Assistant fonts, Hebrew RTL, and the FitFam logo in the header and login screen.

Planned: changing a customer's plan or level, removing customers, and viewing an audit trail of manual changes.

## Tech stack

| Area | Choice |
|------|--------|
| Framework | Next.js 16.3.8 (App Router) |
| UI | React 19.2.8, Tailwind CSS 4 |
| Language | TypeScript 5 |
| Lint | ESLint 9 (`eslint-config-next`) |
| Package manager | npm |
| Runtime | Node.js 20 or newer (Node 22 used in development) |
| Fonts | Heebo and Assistant (Hebrew support) via `next/font` |

## Prerequisites

- Node.js 20+ and npm.

## Quick start

```bash
git clone https://github.com/yotamblu/fitfam-ums.git
cd fitfam-ums
npm install
npm run dev
```

The dev server starts on **http://localhost:3001** (the scripts pin this port because the customer app, `fitfam-web`,
uses 3000). You also need:

1. The FitFam API running (default `http://localhost:8081`, see the API README).
2. A `.env.local` file (see [Configuration and secrets](#configuration-and-secrets)).
3. Your admin account registered as an admin in the API's database, and `http://localhost:3001` listed under
   **Authorized JavaScript origins** for the Google OAuth client.

## Available scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Development server on port 3001 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build on port 3001 |
| `npm run lint` | Run ESLint |

No test command exists yet.

> Do not run `npm run build` while `npm run dev` is running in the same folder: both use `.next`, and the dev server will
> break. Stop dev first, or delete `.next` and restart dev.

## Project structure

```
fitfam-ums/
├── app/                  Root layout (RTL, fonts), theme tokens (globals.css), tab icon, and the `(admin)` route
│                         group whose layout wraps every page in the shell: `/` users, `/add`, `/waitlist`
├── components/
│   ├── AdminShell.tsx        Login + header (logo, navigation, account) shared by all admin pages
│   ├── AdminSession.tsx      Context giving pages the logged-in admin
│   ├── GoogleSignIn.tsx      Google's sign-in button
│   ├── UsersPage.tsx         Users summary, filter, search and list
│   ├── AddUserPage.tsx       The add-a-customer form and success screen
│   ├── WaitlistPage.tsx      Waitlist summary, filters, search, list and paging
│   └── ui/                   Shared building blocks: Button, Chip, StatCard, SegmentedControl, SearchInput,
│                             PageHeader, Avatar, Backdrop (ambient background), icons
├── lib/
│   ├── api.ts            Typed client for the API (cookies via credentials: "include")
│   ├── types.ts          Response types (to be generated from the API's OpenAPI spec later)
│   ├── messages.ts       Hebrew error messages
│   └── sports.ts         Hebrew labels for the waitlist's sport ids
├── public/               FitFam logo
├── next.config.ts, eslint.config.mjs, postcss.config.mjs, tsconfig.json, package.json
├── AGENTS.md / CLAUDE.md   Instructions for AI coding assistants
└── .gitignore            Ignores node_modules, .next, env files, key files and more
```

## Configuration and secrets

Create `.env.local` in the project root (gitignored):

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<Google OAuth client ID>
```

In development nothing else is needed: the app reaches the API through its own forwarding route, which defaults to
`http://localhost:8081`. To point it elsewhere set `API_ORIGIN` (server-side only; see below).

| Variable | Where | Meaning |
|----------|-------|---------|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | build time, public | Google OAuth client ID. Public by design (no client secret exists). If you change it, rebuild/redeploy |
| `API_ORIGIN` | server-side only | Address of the API, e.g. `https://fitfam-api.onrender.com`. **Required in production**: without it the forwarding route answers 503 `api_not_configured` |
| `NEXT_PUBLIC_API_URL` | optional | Only to bypass the forwarding route and call an API directly from the browser. Leave unset; a direct call from another domain cannot keep the login cookie |

- **Never put a secret in a `NEXT_PUBLIC_` variable**: those are compiled into the browser bundle.
- The login session is an `HttpOnly` cookie set by the API; the page's JavaScript never sees or stores the token.
- Restart the dev server after changing `.env.local`. Production values live only in the host's environment settings.

## Deploying to Vercel

Import this GitHub repo as a Vercel project (framework: Next.js, defaults are fine) and set two environment variables:
`API_ORIGIN` (the API's https address) and `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. Choose the function region closest to the API
and the database (Settings -> Functions). Then add the site's https address to the Google OAuth client's **Authorized
JavaScript origins**. The browser only ever talks to this site; `app/backend/[...path]/route.ts` forwards `/backend/*`
to `API_ORIGIN` from the server, so the login cookie belongs to this site wherever the API is hosted.

## Access control and security

Anyone can load the login page, but nobody gets in or sees data without being an admin. The enforcement lives in the
API, never only in this front end:

- **Who is an admin:** only accounts with the admin role in the API's database. Google proves who someone is; the API
  then checks the role on every single request, so removing or demoting an admin locks them out immediately.
- **Every admin endpoint** requires that role. Forged, tampered, unsigned and expired logins are rejected (covered by
  tests and by live attack checks).
- **Short admin sessions:** an admin login lasts 12 hours (customers: 7 days), and the session cookie is `HttpOnly`,
  so scripts on the page can never read it.
- **One small server-side piece:** the forwarding route `app/backend/[...path]/route.ts`. It is a plain pass-through
  that only reaches the fixed `API_ORIGIN`, only the `auth/*` and `admin/*` areas, rejects any request whose `Origin`
  is not this site, rejects path tricks (`..`, slashes, null bytes), and forwards only the content type, accept and
  cookie headers. It holds no secrets, and the API still checks the admin role on every request. There are no other
  server routes or server actions, and the only `NEXT_PUBLIC_` value is Google's public client ID.
- **Browser protections** (`next.config.ts`): the site cannot be embedded in a frame (clickjacking), base-tag and form
  hijacking are blocked, MIME sniffing is off, referrers are trimmed, camera/microphone/location are disabled, HSTS is
  sent, the framework banner is hidden, and crawlers are told to stay away (`robots.txt` + `noindex`).
- **No dangerous patterns:** no `dangerouslySetInnerHTML`, `eval` or browser storage of tokens; React escapes all data.
- **Deployment:** host it on its own subdomain, and ideally also behind an extra access gate (for example the hosting
  provider's deployment protection or a zero-trust proxy) so strangers cannot even load the login page.

## Open decisions

Not decided; do not assume:

- Hosting for the admin site.
- Whether to keep an audit log view in the UI (the API already records changes).

## Roadmap

- [x] Next.js scaffold
- [x] Admin authentication (via the API)
- [x] Add customers with their plans
- [x] Users list
- [x] Redesign in the customer app's visual style, with the add page separate from the waitlist
- [ ] Change a customer's plan or level
- [ ] Remove customers
- [ ] Deployment

## Git workflow

- Default branch: `main`.
- Commit and branch in this repo only; each FitFam repo is independent.
- Never commit secrets.

## Related repositories

- [fitfam-web](https://github.com/yotamblu/fitfam-web): the customer-facing Next.js PWA.
- [fitfam-api](https://github.com/yotamblu/fitfam-api): the Spring Boot backend.
