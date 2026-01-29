# Legacy System Overview (Laravel 5.2)

This document summarizes the behavior discovered in `program-omsi/_upload` (Laravel 5.2).

## Purpose
- Manage weekly liturgy schedules for Roman Catholic parishes.
- Import schedules via JSON API and expose day/week/location data via API.
- Provide a web UI for viewing and editing schedules.

## Core Concepts
- Parish: top-level entity with a unique slug.
- Location: a parish sub-location (filialka) with a display order.
- Week: a Monday-Sunday container (start/end dates + optional season label).
- WeekDay: one calendar day within a week.
- ScheduleEvent: a single event (holy mass, confession, other) at a location.
- User: can be superadmin or regular user; users can belong to multiple parishes.

## Roles and Permissions
- Auth is session-based for UI; registration via UI is disabled.
- Superadmin can manage parishes, locations, users, and tokens.
- Regular users can manage schedules for assigned parishes.
- API access supports Bearer token or `api_token` query parameter.

## UI Features
- Dashboard:
  - Week selector by date, previous/next week navigation.
  - Schedule view grouped by day and location.
  - Editor panel for building a week schedule and JSON import/export.
- Settings:
  - API token regeneration.
  - Parish + location management (superadmin).
  - User management with parish assignment (superadmin).

## Import Behavior
- JSON import replaces all events for the week.
- Locations referenced in JSON must already exist for the selected parish.
- Day names are validated against Slovak names (Pondelok..Nedela).
- Event types are limited to: `holy-mass`, `confession`, `other`.

## Supported Date Formats
- `j.n.Y` / `j. n. Y` (e.g., `22.9.2025`)
- `Y-m-d` (ISO)

## API Highlights
- `POST /api/schedules` imports a week via JSON.
- `GET /api/schedules` fetches a week by `start_date` or `date`.
- `GET /api/days/{date}` fetches one day.
- `GET /api/locations/{slug}` fetches a single location schedule.

For the detailed payloads and response shapes, see `docs/legacy/legacy-api.md`.
