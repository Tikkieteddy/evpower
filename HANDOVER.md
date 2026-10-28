# Project Handover

## Identity

- Project: EV Charge Daily Calculator
- Package version: `1.0.0`
- UI footer version: `V.1.0.0`
- Repository: `https://github.com/Tikkieteddy/evpower` (**public**)
- Branch audited: `master` (== `origin/master`); docs work on `docs/claude-takeover`
- Last application commit: `5360d94` (`Require session login gate`)
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
| `npm test` | Build alias only | No test files exist |
| `npm run docs:validate` | PASS | links, files, storage keys, secrets |
| Desktop runtime | PASS | Codex, local Vite |
| Mobile runtime 375 px | PASS | Claude, all 7 tabs, no horizontal overflow |

## Handover Risks

- Critical: the hard-coded default admin credential is in `src/utils/auth.js`, printed in `README.md`, and shipped in the deployed bundle of a **public** repository.
- Critical: passwords and users are plaintext Local Storage data; authorization is client-controlled.
- High: data is device/browser-specific and can be lost when site data is cleared; corrupted trip JSON is silently overwritten with sample data.
- High: charged energy and trip consumption are conflated in analytics.
- High: unrelated Next.js application files are tracked in the same repository (with real Google resource IDs and a fallback secret).
- Medium: no automated tests or data schema migrations.
- Medium: one large production JS chunk.
- Medium: license guard is client code and can be bypassed by rebuilding source.
- Low: week-key start/end dates are one day early in UTC+7 (labels correct).
- Low: README says session is Local Storage although code uses Session Storage.

## Documentation

Use [DOCUMENT_INDEX.md](DOCUMENT_INDEX.md) as the canonical map. The interactive center is [`docs/handover/HANDOVER_DASHBOARD.html`](docs/handover/HANDOVER_DASHBOARD.html) (generated from `docs/handover/data/project-status.json`), the formal report is [`docs/handover/HANDOVER_SUMMARY.pdf`](docs/handover/HANDOVER_SUMMARY.pdf), and the takeover audit is [`docs/handover/INITIAL_TAKEOVER_REPORT.md`](docs/handover/INITIAL_TAKEOVER_REPORT.md).

## Change Control

The handover (Codex + Claude) added documentation, docs tooling (`scripts/docs/`, `docs:*` npm scripts) and a `.gitignore` entry only. It does not modify EV application behavior, commit, push, deploy, or alter production data.
