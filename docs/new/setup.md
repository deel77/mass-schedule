# Setup

## Install dependencies
```bash
npm install
```

## Configure environment
Copy `.env.example` to `.env.local` and fill:
- `CONVEX_URL` (from `npx convex dev`)
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (e.g. http://localhost:3000)
- `SETUP_SECRET` (one-time admin bootstrap)

## Start Convex
```bash
npx convex dev
```

## Start Next.js
```bash
npm run dev
```

## Bootstrap the first superadmin
```bash
curl -X POST http://localhost:3000/api/setup \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "<SETUP_SECRET>",
    "name": "Admin",
    "email": "admin@example.com",
    "password": "strong-password"
  }'
```

Then sign in at `/login`, open `/settings`, and create parishes, locations, users, and tokens.
