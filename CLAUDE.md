# Claude Code Project Guide

## Project Overview

EV Charge Daily Calculator (`1.0.0`) is a Thai-first, browser-only React application for recording EV trips and charging sessions, analyzing weekly/monthly/route/charger metrics, and forecasting next-month use. The deployed application is a Vite SPA. It has no EV backend, API, or database.

Start with [HANDOVER.md](HANDOVER.md) and [DOCUMENT_INDEX.md](DOCUMENT_INDEX.md). Detailed evidence is under [`docs/handover/`](docs/handover/); the latest audit is [INITIAL_TAKEOVER_REPORT.md](docs/handover/INITIAL_TAKEOVER_REPORT.md).

## Verified Architecture

- Entry point: `index.html` -> `src/main.jsx` -> `src/App.jsx`
- UI: React 19, Tailwind CSS 4 (compiled via `postcss.config.mjs`), Lucide React, Recharts
- Persistence: browser `localStorage`; login session: `sessionStorage`
- Hosting config: Vercel static Vite output (`dist/`); everything in `public/` is copied to `dist/`
- EV APIs/database/file storage: none
- Authentication: client-side gate only; passwords are stored in plaintext in browser storage
- GitHub repository is **public**

See [SYSTEM_ARCHITECTURE.md](docs/handover/SYSTEM_ARCHITECTURE.md) and [DATABASE_DOCUMENTATION.md](docs/handover/DATABASE_DOCUMENTATION.md).

## Important Repository Boundary

The active EV app is the import graph rooted at `src/main.jsx`, plus `postcss.config.mjs` (Tailwind pipeline, required by the EV build). The tracked `src/app/**`, `src/lib/**`, `next.config.ts`, `next-env.d.ts`, `tsconfig.json`, `public/TNN_A.jpg` (copied to `dist` but unused), and `.env.example` belong to an unrelated/legacy Next.js profile workflow. Do not treat those endpoints, data stores, or environment variables as EV functionality. Do not delete them without explicit owner approval.

## Coding Conventions

- Functional React components and hooks.
- Shared analytics stay in `src/utils/calculations.js`.
- Browser persistence helpers stay in `src/utils/`; trips go through `tripStorage.js` (never write `ev-charge-daily-log-v1` directly).
- Reuse `MetricCard`, `DataTable`, and CSS variables in `src/index.css`.
- Numeric inputs use `step="0.01"`; calculation output uses `formatNumber`/`formatBaht`.
- Keep Thai user-facing copy and existing English tab labels consistent.
- Preserve `tikkieteddielab` copyright/footer requirements unless the owner explicitly changes licensing.
- Add tests for calculation or persistence changes before widening the feature surface.
- Tests live next to the code as `src/**/*.test.js` (Vitest, Node environment, in-memory Web Storage stub). Known bugs are pinned with `it.fails` - remove `.fails` when fixing them. Never assert or print the default credential in tests.

## Commands

```bash
npm install
npm run dev            # http://127.0.0.1:5173
npm run lint
npm run build
npm test               # Vitest unit tests (src/**/*.test.js, TZ=Asia/Bangkok)
npm run test:watch     # Vitest watch mode
npm run docs:build     # regenerate docs/handover/HANDOVER_DASHBOARD.html
npm run docs:validate  # links, referenced files, storage keys, secrets, dashboard freshness
```

Verified 2026-10-28 (Claude): test PASS (54 + 1 expected fail), lint PASS, build PASS (652 kB chunk warning), docs:validate PASS, mobile 375 px runtime PASS.

## Documentation System

- Single data source for the owner dashboard: [`docs/handover/data/project-status.json`](docs/handover/data/project-status.json). Edit it, then run `npm run docs:build` and `npm run docs:validate`. Never hand-edit `HANDOVER_DASHBOARD.html`.
- Generator and validator: `scripts/docs/` (`build-dashboard.mjs`, `validate-docs.mjs`, `dashboard.css`, `dashboard.client.js`).
- `HANDOVER_SUMMARY.pdf` is a dated snapshot (Codex, baseline `5360d94`). Regenerate only at a milestone/formal handover or on owner request, keeping the old version.
- After each change, review: features -> `FEATURE_INVENTORY.md` + JSON; screens/UI -> `wireframes/WIREFRAMES.md` + sitemap; storage -> `DATABASE_DOCUMENTATION.md`; architecture -> `SYSTEM_ARCHITECTURE.md` + `DECISIONS.md`; bugs -> `CHANGELOG.md` + JSON issues; workflow/deploy -> this file + `SETUP_GUIDE.md`; end of session -> `NEXT_STEPS.md`.

## Deployment

Vercel project name is `evpower`; public URL reported by the owner is `https://evpower-beta.vercel.app`. `vercel.json` runs `npm run build` and publishes `dist`. Vercel dashboard/env/logs are not accessible from this machine.

## Permanent Operating Rules

1. **Source code first** — verify the implementation before trusting documents.
2. **One repository** — source and docs live together; no duplicate copies (the handover ZIP stays out of Git).
3. **CLAUDE.md first** — every session starts here.
4. **Interactive HTML for the owner** — keep the generated dashboard current.
5. **PDF for formal records** — milestone snapshots only, with version history.
6. **Protect user data** — never clear/overwrite browser storage; schema/key changes need a migration and backup plan.
7. **No unauthorized deployment** — no commit, push, merge, remote change or deploy without explicit owner approval.
8. **Continuous documentation** — update affected docs and rebuild the dashboard with every change.
9. **No fabricated progress** — report only what was verified; mark the rest NOT VERIFIED.
10. **Preserve context** — leave enough in the repo (NEXT_STEPS, CHANGELOG, validation log) for the next session.

## Security Rules

- Never place passwords, tokens, service-account JSON, or Vercel/GitHub credentials in source or handover files.
- Do not describe the current login gate as secure authentication.
- Never copy the hard-coded default credential into documentation, dashboard, PDF or chat (`docs:validate` checks this).
- Treat browser storage as user-controlled and readable.
- Never use the unrelated Next.js `.env.example` as EV setup guidance.

## Files Requiring Explicit Approval Before Modification

- `src/utils/licenseGuard.js`
- `src/data/brandAudit.js`
- `src/index.css` brand tokens
- `src/utils/auth.js` default credential / storage keys, and any storage key or schema
- repository contamination listed above (until ownership is resolved)
- Vercel project linkage and deployment configuration

## Current Priorities

1. Owner decision: rotate/remove the public default credential (README, `auth.js`, deployed bundle).
2. Owner decision: offline personal tool vs. secure multi-user product.
3. Owner decision: fate of unrelated Next.js files.
4. Export/Backup plan ([EXPORT_BACKUP_PLAN.md](docs/handover/plans/EXPORT_BACKUP_PLAN.md)): stage 1 done; stages 2-3 await answers to section 6.
5. Component/E2E tests (unit baseline done 2026-10-28).
6. Fix energy-accounting semantics (charged vs consumed kWh).
7. Code-split Recharts/dashboard views.

## How To Continue

1. Read [NEXT_STEPS.md](docs/handover/NEXT_STEPS.md).
2. Run `git status`, `npm run lint`, `npm run build`, `npm run docs:validate`.
3. Confirm the requested change belongs to the Vite import graph.
4. Write/adjust tests before changing formulas or persistence.
5. Update affected docs + `project-status.json`, rebuild the dashboard, append to `HANDOVER_VALIDATION.md`.
