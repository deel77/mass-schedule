# AGENTS.md

## Project summary
- **Name**: Program OMSI (Convex + Next.js)
- **Purpose**: Parish schedule manager. Days/events are primary data; week labels exist only for grouping views.
- **Stack**: Next.js (App Router) + Tailwind + Auth.js (credentials) + Convex backend.

## Key architecture decisions
- Days are stored as `days` + `events` in Convex. No `weeks` table for primary data.
- `weekLabels` stores optional weekly label + start/end dates for display grouping.
- External read-only access is via **Bearer tokens** with scopes and parish restrictions.
- Admin (superadmin) manages parishes, locations, users, and tokens.
- UI includes JSON import/export for weekly schedules using legacy-style payloads (`season` + `schedule`).

## Repository layout
- `convex/` — Convex schema + server functions (queries/mutations).
- `src/app/api/` — REST API routes (Next.js).
- `src/components/` — UI components (Dashboard, Settings, Login).
- `docs/legacy/` — Legacy Laravel behavior reference.
- `docs/new/` — New system docs (API, data model, setup).

## Convex deployment (dev)
- Team: `dominik-lakatos`
- Project: `mass-schedule`
- Dev deployment: `famous-otter-253`
- URL: `https://famous-otter-253.convex.cloud`

## Auth
- Auth.js credentials provider.
- Users stored in Convex (`users` table) with `passwordHash` (bcryptjs).
- First superadmin is created via `/api/setup` (one-time).

## Environment variables
Create `.env.local` from `.env.example`.
Required:
- `CONVEX_URL` and `NEXT_PUBLIC_CONVEX_URL` — Convex deployment URL.
- `NEXTAUTH_URL` — frontend URL (http://localhost:3000 in dev).
- `NEXTAUTH_SECRET` — generated secret.
- `SETUP_SECRET` — secret for `/api/setup` bootstrap.

## Local dev commands
```bash
npm install
npx convex dev
npm run dev
```

## Build
```bash
npm run build
```

## Next.js route handler note
- For dynamic route handlers under `src/app/api/**/[param]/route.ts`, Next.js expects:
  - `request: NextRequest`
  - `context: { params: Promise<{ param: string }> }`
  - avoid naming collisions with any local `context` variable.

## Localization
- UI translations live in `src/lib/i18n.ts` (UTF-8, includes SK diacritics).
- Locale selection is stored in `localStorage` (`sk` or `en`).

## Bootstrap first superadmin
POST `/api/setup` with JSON body:
```json
{
  "secret": "<SETUP_SECRET>",
  "name": "Admin",
  "email": "admin@example.com",
  "password": "strong-password"
}
```

## Main UI routes
- `/login` — sign in
- `/` — dashboard (weekly schedule + editor)
- `/settings` — admin management

## REST API overview
- `GET /api/weeks?date=YYYY-MM-DD&parish=<slug|id>`
- `GET /api/days?date=YYYY-MM-DD&parish=<slug|id>`
- `GET /api/location-schedules/{slug}?date=YYYY-MM-DD&parish=<slug|id>`
- `POST /api/schedules` — import weekly schedule (accepts legacy `schedule` payload or normalized `days`)
- Admin:
  - `/api/parishes`, `/api/locations`, `/api/users`, `/api/tokens`

## Convex functions
- `convex/schema.ts` — tables + indexes
- `convex/schedules.ts` — import + week/day/location views
- `convex/users.ts` — user CRUD
- `convex/parishes.ts` — parish CRUD
- `convex/locations.ts` — location CRUD
- `convex/tokens.ts` — external token CRUD
- `convex/setup.ts` — bootstrap admin

## Important files
- `src/components/DashboardClient.tsx` — schedule view + editor
- `src/components/SettingsClient.tsx` — admin console (accordion-style sections to reduce clutter)
- `src/lib/apiAuth.ts` — token auth + scope checks
- `src/lib/convexClient.ts` — Convex HTTP client for API routes
- `src/lib/i18n.ts` — UI translations
- `docs/new/api.md` — canonical API doc

## Git
- Default branch: `main`
- Remote: `git@github.com:deel77/mass-schedule.git`
- SSH push currently fails unless GitHub key is configured.

## Known caveats
- Convex CLI required to deploy to dev.
- Convex uses generated types in `convex/_generated/` (committed).
- Token-based API access is read-only (write requires signed-in user).

## Suggested agent workflow
1) Read `docs/new/overview.md` and `docs/new/api.md`.
2) Validate `.env.local` values.
3) Ensure Convex dev deployment is configured and running.
4) Use `/api/setup` once to create the initial superadmin.
5) Manage system data via `/settings`.
