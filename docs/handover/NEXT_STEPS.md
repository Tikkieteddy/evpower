# Next Steps for Claude Code

_Updated 2026-10-28 after PR #1 and PR #2 were merged to `master` (`520c3d8`) and deployed. Codex checklist items 1, 2 and 7 are done (see `HANDOVER_VALIDATION.md`)._

## Waiting on the Owner

1. Review/merge the PR for `fix/force-default-password-change` (forced change of the default password, README cleanup).
2. Choose offline-personal vs. secure multi-user architecture.
3. Decide the fate of the unrelated Next.js files (`src/app/**`, `src/lib/**`, Next config, `.env.example`, `public/TNN_A.jpg`).
4. Export/Backup stages 2-3: answer the questions in section 6 of [`plans/EXPORT_BACKUP_PLAN.md`](plans/EXPORT_BACKUP_PLAN.md) (stage 1 done).

## Done 2026-10-28

- Handover docs + docs tooling merged (PR #1).
- Vitest unit tests (55) and `npm test` now runs them (PR #2).
- Export/Backup plan written; stage 1 (unreadable-data protection, safe sample reset, save-failure warning) implemented and tested (PR #2), deployed to production 2026-10-28.

## Ready to Start (no owner decision needed)

1. Fix `getWeekKey` and the Daily Log default date to use local dates (tests already pin the week-key bug).
2. Run `npm audit fix` (non-force) for the pre-existing Vite/PostCSS/esbuild advisories, then re-test.
3. Add a GitHub Actions workflow running lint/test/build (needs approval to add CI).
4. Update `README.md` project structure list (Session Storage wording fixed).

## Every Session

- [ ] `git status`, `npm run lint`, `npm run build`, `npm run docs:validate`
- [ ] Change stays inside the Vite import graph
- [ ] Tests added for behavioral changes
- [ ] `project-status.json` + affected Markdown updated, `npm run docs:build` run
- [ ] `HANDOVER_VALIDATION.md` and `CHANGELOG.md` appended
