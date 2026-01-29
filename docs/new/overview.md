# New System Overview (Convex + Next.js)

This project reimplements the legacy Laravel system using Convex, Next.js (App Router), Tailwind, and Auth.js.

## Goals
- Keep the core scheduling workflow and API access.
- Store days and events as primary data, with optional week labels for grouping.
- Provide a modern UI for weekly schedule management and JSON import/export.
- Support role-based access (superadmin vs. user).
- Offer external read-only API access via configurable tokens.

## Highlights
- **Auth.js (Credentials)**: users sign in with email + password stored in Convex.
- **Convex data model**: parishes, locations, days, events, week labels, users, tokens.
- **Modern REST API**: `/api/weeks`, `/api/days`, `/api/location-schedules`.
- **Admin console**: create/update parishes, locations, users, and external tokens.
- **Multilanguage UI**: simple EN/SK toggle stored in localStorage.

## Files of Interest
- `convex/schema.ts`: database schema definition.
- `convex/schedules.ts`: import + week/day/location views.
- `src/app/api/*`: REST routes.
- `src/components/DashboardClient.tsx`: schedule UI + editor.
- `src/components/SettingsClient.tsx`: admin UI.

## Quick Start
See `docs/new/setup.md` for configuration and initial superadmin setup.
