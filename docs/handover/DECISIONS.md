# Architectural Decisions

Only decisions supported by repository evidence are listed.

## ADR-001 - Static Vite SPA

**Status:** Accepted in current implementation.

**Evidence:** `src/main.jsx`, `vite.config.js`, and `vercel.json` build a React SPA to `dist`.

**Consequence:** simple deployment; no trusted server boundary.

## ADR-002 - Browser-local Persistence

**Status:** Accepted in current implementation.

**Evidence:** `App.jsx`, `auth.js`, and `routePresets.js` access Web Storage directly.

**Consequence:** offline/simple use, but no sync, backup, central access control, or durable identity.

## ADR-003 - Single App Route with Tab State

**Status:** Accepted.

**Evidence:** `activeTab` in `App.jsx`; no React Router dependency.

**Consequence:** direct links/back-button history do not address individual dashboards.

## ADR-004 - Central Calculation Utility

**Status:** Accepted.

**Evidence:** dashboards import functions from `src/utils/calculations.js`.

**Consequence:** formulas are centralized and testable, but currently lack tests.

## ADR-005 - Client Integrity Guard

**Status:** Accepted but not a security control.

**Evidence:** `verifyTikkieTeddieLicense` checks hard-coded credit/footer/version and palette collisions.

**Consequence:** detects accidental source changes in an unmodified build; cannot prevent deliberate rebuilding.

## ADR-006 - Generated Owner Dashboard

**Status:** Accepted 2026-10-28 (Claude takeover).

**Evidence:** `scripts/docs/build-dashboard.mjs` renders `HANDOVER_DASHBOARD.html` from `docs/handover/data/project-status.json`; `validate-docs.mjs` checks links, files, storage keys and secrets.

**Consequence:** dashboard data has one editable source and can be rebuilt offline with Node only; narrative Markdown remains hand-maintained.

## Open Decisions

- Rotation/removal of the public default credential

- Offline personal tool versus secure multi-user product
- Correct source of consumed-energy data
- Ownership/removal of unrelated Next.js files
- Export format and schema migration policy
- Test and CI toolchain

