# Changelog (Evidence-backed)

This is reconstructed from Git commit subjects; it is not a claim of semantic releases.

| Commit | Change |
| --- | --- |
| `520c3d8` | Merge PR #2: Vitest unit tests + trip data overwrite protection |
| `d8db83c` | Merge PR #1: project handover docs and docs tooling |
| `5360d94` | Require session login gate |
| `da5a2ba` | Improve forecast input flow |
| `04a1800` | Add route presets for daily logs |
| `4a8c988` | Add daily EV energy report metrics |
| `f594b1b` | Support two decimal numeric inputs |
| `74e58f2` | Add local user management |
| `8976298` | Add login gate |
| `b409fe4` | Add brand integrity guard |
| `9ce277e` | Brand EV dashboard for TikkieTeddie Lab |
| `61603b5` | Build EV charging dashboard |

Earlier commit `33982cd` is titled `Build user profile queue app` and explains the unrelated Next.js files still tracked in the repository.

Tags/releases: NOT FOUND in the local Git repository.

## 2026-10-28 - PR #1 `docs/claude-takeover` (merged `d8db83c`, commit `55d76ec`)

- 2026-10-28 Claude Code takeover: verified the Codex handover against source; corrected the `postcss.config.mjs` / `public/` boundary; documented the public default credential, the storage overwrite path and the week-key timezone shift; added `docs:build` / `docs:validate` scripts; dashboard is now generated from `docs/handover/data/project-status.json`; added `INITIAL_TAKEOVER_REPORT.md`. No application behavior changed.

## 2026-10-28 - PR #2 `test/vitest-baseline` (merged `520c3d8`, commit `00722ab`, deployed)

- 2026-10-28 Added Vitest 4 unit tests for `calculations.js`, `routePresets.js` and `auth.js` (42 tests, 55 with stage 1); `npm test` now runs them (was a build alias). Added `docs/handover/plans/EXPORT_BACKUP_PLAN.md` (proposal). No application behavior changed.
- 2026-10-28 Export/Backup stage 1: `src/utils/tripStorage.js` + `StorageNotice.jsx` - unreadable trip data is copied to `ev-charge-daily-log-v1:corrupt-<hash>` before fallback (saving pauses if the copy fails), `null` no longer breaks rendering, sample reset keeps a `:before-sample-<timestamp>` copy, failed saves show a warning. 13 new tests. Existing storage keys/schemas unchanged.

## Unreleased - branch `fix/force-default-password-change`

- 2026-10-28 Signing in with the seeded admin password now requires setting a new one (min 8 chars) before the dashboard opens (`ChangePasswordScreen.jsx`, `changeOwnPassword`). The seeded password can no longer be assigned to any user. README no longer prints it and now says the session is in Session Storage. Risk reassessed from Critical to Medium. No storage key/schema change; existing users and trips are kept. 9 new tests.
