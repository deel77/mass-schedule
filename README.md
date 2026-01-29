# Program OMSI (Convex + Next.js)

Modern schedule manager for parishes, rebuilt on Convex and Next.js with a Tailwind UI.

## Docs
- `docs/legacy/legacy-overview.md`
- `docs/legacy/legacy-api.md`
- `docs/new/overview.md`
- `docs/new/data-model.md`
- `docs/new/api.md`
- `docs/new/setup.md`

## Quick start
```bash
npm install
npx convex dev
npm run dev
```

## Build
```bash
npm run build
```

Then visit `http://localhost:3000`.

## Notes
- First-time setup requires `/api/setup` with `SETUP_SECRET`.
- The UI lives in `src/components/DashboardClient.tsx` and `src/components/SettingsClient.tsx`.
- Convex functions are in `convex/`.
