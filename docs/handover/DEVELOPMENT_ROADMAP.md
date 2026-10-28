# Development Roadmap

_Updated 2026-10-28 by Claude Code after takeover audit._

## P0 - Rotate / Remove the Public Default Credential

**Goal:** stop the hard-coded default admin credential from granting access.

**Related files:** `src/utils/auth.js`, `README.md`, deployed bundle.

**Dependencies:** owner decision (the value is in a public repo, in Git history and in the deployed JS).

**Implementation notes:** short term - remove it from README, force a password change on first login, never seed a known password. Long term - superseded by the security-model decision below. Changing it must not wipe existing users in browsers already in use.

**Acceptance criteria:** no usable credential in source/README/bundle; existing local users preserved.

**Verification:** `npm run docs:validate` warning cleared; bundle grep; manual login test.

## P0 - Decide Product Security Model

**Goal:** Choose personal offline-only mode or secure multi-user cloud mode.

**Related files:** `auth.js`, `App.jsx`, `UserManagement.jsx`, storage documentation.

**Dependencies:** owner decision, identity provider/database selection for cloud mode.

**Implementation notes:** Offline mode should explicitly remove security claims. Cloud mode requires server-side auth, hashed/provider-managed credentials, per-user data, secure session cookies, and authorization checks.

**Acceptance criteria:** Threat model documented; no plaintext production credentials; users cannot access another user's data; logout/session expiry verified.

**Verification:** unit/integration auth tests, browser E2E, storage inspection, security review.

## P0 - Resolve Repository Contamination

**Goal:** Separate EV source from unrelated Next.js profile workflow.

**Related files:** `src/app/**`, `src/lib/**`, Next config, `.env.example`, image asset.

**Dependencies:** explicit owner confirmation and history review.

**Acceptance criteria:** each file has an owner/destination; EV build/lint/docs remain valid; no unrelated secret/config guidance remains.

**Verification:** clean clone, install, lint, build, Git diff review.

## P1 - Correct Energy Accounting Model

**Goal:** Separate charged energy from consumed energy and make attribution explicit.

**Related files:** `DailyLog.jsx`, `calculations.js`, dashboards, route/charger analysis, sample data.

**Dependencies:** product decision on data users can obtain (vehicle efficiency, SOC delta, charger receipt).

**Acceptance criteria:** labels/formulas distinguish charged vs consumed; route efficiency is not inferred from unrelated charging days; migration preserves old records.

**Verification:** calculation fixtures and reconciliation examples.

## P1 - Add Automated Test Baseline

**Goal:** protect business formulas, persistence, and core flows.

**Related files:** all `src/utils`, forms, `package.json`.

**Dependencies:** select Vitest + React Testing Library + Playwright (or equivalent).

**Acceptance criteria:** meaningful unit coverage for all formulas; CRUD/auth/forecast integration tests; one desktop and one mobile E2E path; `npm test` runs tests rather than only build.

**Verification:** CI run and mutation/boundary review.

## P1 - Backup, Export, Import, and Migration

**Goal:** prevent silent loss of browser-local records.

**Related files:** new storage service, App state, user UI.

**Acceptance criteria:** versioned JSON export/import with validation and preview; non-destructive migration; corrupted storage is backed up (not overwritten by sample data); recovery documentation.

**Verification:** corrupted/old/new schema fixtures and round-trip test.

## P2 - Performance and UX Hardening

**Goal:** reduce initial bundle and validate responsive/accessibility behavior.

**Related files:** `App.jsx`, chart views, Vite config, CSS.

**Acceptance criteria:** route/tab lazy loading; main chunk below agreed budget; keyboard/focus labels validated; 360/768/1440 px screenshots reviewed.

**Verification:** build-size report, Lighthouse/axe, visual regression.

