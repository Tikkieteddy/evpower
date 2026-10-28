# Setup Guide

## Prerequisites

- Node.js version compatible with Vite 7 (use a current supported LTS)
- npm
- Git

Exact Node/npm versions used by earlier development are NOT VERIFIED; no `.nvmrc` or `engines` field was found.

## Clone and Install

```bash
git clone https://github.com/Tikkieteddy/evpower.git
cd evpower
npm install
```

## Environment

The active EV Vite app requires no environment variables. The tracked `.env.example` belongs to inactive/unrelated Next.js files and must not be populated for EV local development.

## Development

```bash
npm run dev
```

Default verified URL from the script is `http://127.0.0.1:5173/`. If occupied:

```bash
npm run dev -- --host 0.0.0.0 --port 5175
```

## Quality Checks

```bash
npm run lint
npm run build
npm test
```

`npm test` runs the Vitest unit tests (`src/**/*.test.js`) in the Asia/Bangkok timezone; `npm run test:watch` re-runs on change. Build is separate (`npm run build`).

## Documentation Commands

```bash
npm run docs:build     # regenerate HANDOVER_DASHBOARD.html from docs/handover/data/project-status.json
npm run docs:validate  # broken links, referenced files, storage keys, secret leakage, dashboard freshness
```

Verified toolchain on 2026-10-28: Node `v24.14.1`, npm `11.11.0`.

## Production Build

```bash
npm run build
npm run preview
```

Output is generated in `dist/`.

## Browser Data

Data is isolated per origin and browser profile. Changing between localhost ports creates a different storage origin. Clearing site data deletes users, trips, presets, and/or the session.

## Vercel Deployment

Verified settings in `vercel.json`:

- Framework: Vite
- Install: `npm install`
- Build: `npm run build`
- Output: `dist`

Do not deploy automatically. Confirm target team/project and current Git status first. Production database setup is not applicable because no EV database exists.

## Troubleshooting

- Connection refused: ensure the dev process remains running and the selected port is free.
- Login reset: clear only the app's users/session storage keys; preserve trip and route keys if data matters.
- Empty app after storage corruption: inspect JSON values before clearing; there is no backup.
- Build warning: the current large Recharts bundle warning does not fail the build.

