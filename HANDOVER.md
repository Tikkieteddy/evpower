# Project Handover

## Identity

- Project: EV Charge Daily Calculator
- Package version: `1.0.0`
- UI footer version: `V.1.0.0`
- Repository: `https://github.com/Tikkieteddy/evpower` (**public**)
- Branch: `master` (== `origin/master` @ `6ce2634`, deployed to production 2026-10-28)
- Codex audit baseline: `5360d94` (`Require session login gate`)
- Claude changes: PR #1 (docs), PR #2 (tests + data protection), PR #3 (forced default-password change), all merged
- Handover: OpenAI Codex -> Claude Code, 2026-10-28 (Asia/Bangkok)
- Production URL supplied by owner: `https://evpower-beta.vercel.app`

## Current State

The Vite application builds and lints successfully and renders eight user-visible states: Login, Daily Log, Weekly Dashboard, Monthly Dashboard, Route Analysis, Charging Analysis, Forecast, and admin-only Users. A ninth exceptional state, License Lock, is implemented when integrity checks fail. All EV data remains in the current browser profile.

There is no EV backend, API, relational database, cloud user store, file upload, or synchronization. The current login is a UI gate, not a security boundary.

## Verified Commands (Claude, 2026-10-28)

| Command | Result | Evidence |
| --- | --- | --- |
| `npm run lint` | PASS | ESLint exit 0 |
| `npm run build` | PASS with warning | JS chunk 651.83 kB, gzip 194.17 kB |
| `npm test` | PASS | Vitest: 63 passed + 1 expected fail (known week-key bug) |
| `npm run docs:validate` | PASS | links, files, storage keys, secrets |
| Desktop runtime | PASS | Codex, local Vite |
| Mobile runtime 375 px | PASS | Claude, all 7 tabs, no horizontal overflow |

## Handover Risks

- Medium (reassessed 2026-10-28; was rated Critical): the seeded admin password is public (source, Git history, bundle), but data is per-browser, so it only exposes data on a device someone else can use. Mitigated by a forced password change on first login and removal from README (PR #3, live since 2026-10-28).
- High: passwords and users are plaintext Local Storage data; authorization is client-controlled.
- High: data is device/browser-specific and can be lost when site data is cleared (no export yet). Corrupted trip data is now copied before fallback (fixed 2026-10-28).
- High: charged energy and trip consumption are conflated in analytics.
- High: unrelated Next.js application files are tracked in the same repository (with real Google resource IDs and a fallback secret).
- Medium: unit tests only (no component/E2E tests); no data schema migrations.
- Medium: one large production JS chunk.
- Medium: license guard is client code and can be bypassed by rebuilding source.
- Low: week-key start/end dates are one day early in UTC+7 (labels correct).

## Documentation

Use [DOCUMENT_INDEX.md](DOCUMENT_INDEX.md) as the canonical map. The interactive center is [`docs/handover/HANDOVER_DASHBOARD.html`](docs/handover/HANDOVER_DASHBOARD.html) (generated from `docs/handover/data/project-status.json`), the formal report is [`docs/handover/HANDOVER_SUMMARY.pdf`](docs/handover/HANDOVER_SUMMARY.pdf), and the takeover audit is [`docs/handover/INITIAL_TAKEOVER_REPORT.md`](docs/handover/INITIAL_TAKEOVER_REPORT.md).

## Change Control

PR #1 added documentation, docs tooling and a `.gitignore` entry (no app change). PR #2 added unit tests and the stage-1 data protection (`tripStorage.js`, `StorageNotice.jsx`, `App.jsx`) without changing existing storage keys or schemas. PR #3 added the forced change of the seeded admin password (`auth.js`, `ChangePasswordScreen.jsx`) and cleaned the README, again without storage key/schema changes. All three were merged with explicit owner approval; Vercel deployed `6ce2634`. Future commits, pushes, merges and deploys still need explicit owner approval.
