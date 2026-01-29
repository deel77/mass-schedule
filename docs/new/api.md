# REST API

Base URL: `/api`

## Authentication
- UI uses Auth.js session cookies.
- External access uses Bearer tokens created in Settings.

Token scopes supported:
- `read:weeks`
- `read:days`
- `read:locations`

## Setup

### POST /api/setup
Create the first superadmin user (one-time).

Request body:
```json
{
  "secret": "<SETUP_SECRET>",
  "name": "Admin",
  "email": "admin@example.com",
  "password": "strong-password"
}
```

## Schedule (Read)

### GET /api/weeks
Return a week view (Monday-Sunday) for a date.

Query params:
- `date=YYYY-MM-DD`
- `parish=<slug|id>`

Response:
```json
{
  "parish": { "id": "...", "name": "...", "slug": "..." },
  "week": { "start_date": "2025-09-22", "end_date": "2025-09-28", "label": "..." },
  "schedule": [
    {
      "day": "Pondelok",
      "date": "2025-09-22",
      "info": "...",
      "locations": [
        {
          "id": "...",
          "name": "Cana",
          "slug": "cana",
          "events": [
            { "type": "holy-mass", "time": "18:00", "intention": "...", "info": "..." }
          ]
        }
      ]
    }
  ]
}
```

### GET /api/days
Return a single day view.

Query params:
- `date=YYYY-MM-DD`
- `parish=<slug|id>`

### GET /api/location-schedules/{slug}
Return a week view filtered to one location.

Query params:
- `date=YYYY-MM-DD`
- `parish=<slug|id>`

## Schedule (Write)

### POST /api/schedules
Import a full week schedule (requires signed-in user).

Request body (legacy-compatible schedule payload):
```json
{
  "parish": "cana",
  "season": "3. tyzden v obdobi Cez rok",
  "schedule": [
    {
      "day": "Pondelok",
      "date": "26.1.2026",
      "info": "Sv. Timoteja a Tita",
      "locations": [
        {
          "name": "Cana",
          "events": [
            { "type": "holy-mass", "time": "7:00", "intention": "...", "info": null }
          ]
        }
      ]
    }
  ]
}
```

Notes:
- `date` accepts `YYYY-MM-DD` or `D.M.YYYY` (both are normalized).
- Locations can be resolved by `locationId`, `locationSlug`, or `locationName`/`name`.
- `info` and `intention` may be `null` in legacy JSON; they are normalized to omitted values.

Alternative normalized payload (used internally by the editor) is also accepted:
```json
{
  "parish": "cana",
  "weekLabel": "25. tyzden cez rok",
  "days": [
    {
      "date": "2025-09-22",
      "dayName": "Pondelok",
      "info": "Sv. Emerama",
      "locations": [
        {
          "locationId": "<convex-id>",
          "events": [
            { "type": "holy-mass", "time": "18:00", "intention": "...", "info": "..." }
          ]
        }
      ]
    }
  ]
}
```

## Admin APIs (Superadmin only)

- `GET /api/parishes`
- `POST /api/parishes`
- `PATCH /api/parishes/{id}`
- `DELETE /api/parishes/{id}`

- `GET /api/locations?parishId=...`
- `POST /api/locations`
- `PATCH /api/locations/{id}`
- `DELETE /api/locations/{id}`

- `GET /api/users`
- `POST /api/users`
- `PATCH /api/users/{id}`

- `GET /api/tokens`
- `POST /api/tokens`
- `PATCH /api/tokens/{id}`
