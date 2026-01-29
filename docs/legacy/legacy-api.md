# Legacy API Reference

All endpoints live under `/api` and accept/return JSON encoded in UTF-8.

## Authentication
- Bearer token: `Authorization: Bearer <token>`
- Or query param: `?api_token=<token>`

## POST /api/schedules
Create or replace a week schedule. The importer calculates the week start date
(Monday) from the provided dates. Re-sending the same week replaces all events.

### Request body
```json
{
  "season": "25. tyzden cez rok",
  "schedule": [
    {
      "day": "Pondelok",
      "date": "22.9.2025",
      "info": "Sv. Emerama, biskupa",
      "locations": [
        {
          "name": "Cana",
          "events": [
            {
              "type": "holy-mass",
              "time": "18:00",
              "intention": "Za rodinu Novakovu",
              "info": "Hudobna sluzba mladistvi"
            }
          ]
        }
      ]
    }
  ]
}
```

### Response (201)
```json
{
  "id": 123,
  "season": "25. tyzden cez rok",
  "parish": {
    "id": 10,
    "name": "Farnost Cana",
    "slug": "cana"
  },
  "week": {
    "start_date": "2025-09-22",
    "end_date": "2025-09-28"
  },
  "schedule": [
    {
      "day": "Pondelok",
      "date": "22.9.2025",
      "info": "Sv. Emerama, biskupa",
      "locations": [
        {
          "id": 1,
          "name": "Cana",
          "slug": "cana",
          "events": [
            {
              "type": "holy-mass",
              "time": "18:00",
              "intention": "Za rodinu Novakovu",
              "info": "Hudobna sluzba mladistvi"
            }
          ]
        }
      ]
    }
  ]
}
```

### Errors
- 422: validation error `{ "message": "..." }`
- 403: parish not accessible
- 401: unauthorized

## GET /api/schedules
Fetch a week schedule using query params.

### Queries
- `?start_date=2025-09-22&parish=cana`
- `?date=2025-09-24&parish=cana`

### Response (200)
Same shape as `POST /api/schedules` response.

### Errors
- 404: week not found `{ "message": "Tyzden sa nenasiel." }`

## GET /api/schedules/{identifier}
Fetch a week by numeric id or week start date (YYYY-MM-DD).

## GET /api/days/{date}
Fetch a single day, where `{date}` is `22.9.2025` or `2025-09-22`.

### Response (200)
```json
{
  "week_id": 123,
  "day": "Utorok",
  "date": "23.9.2025",
  "info": null,
  "locations": [
    {
      "id": 1,
      "name": "Cana",
      "slug": "cana",
      "events": [
        {
          "type": "holy-mass",
          "time": "18:00",
          "intention": null,
          "info": null
        }
      ]
    }
  ]
}
```

## GET /api/locations/{slugOrName}
Fetch schedule for a single location. Matches by slug first, then by name
(case-insensitive). Supports `?date=` or `?start_date=`.

### Response (200)
Same as week response, plus `location` metadata:
```json
{
  "id": 123,
  "season": "25. tyzden cez rok",
  "parish": { "id": 10, "name": "Farnost Cana", "slug": "cana" },
  "week": { "start_date": "2025-09-22", "end_date": "2025-09-28" },
  "schedule": [ ... ],
  "location": {
    "id": 1,
    "name": "Cana",
    "slug": "cana",
    "description": null
  }
}
```
