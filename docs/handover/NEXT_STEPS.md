# Next Steps for Claude Code

_Updated 2026-10-28 after the Claude takeover audit. Codex checklist items 1, 2 and 7 are done (see `HANDOVER_VALIDATION.md`)._

## Waiting on the Owner

1. Approve commit/push of branch `docs/claude-takeover` (handover docs + docs scripts + CLAUDE.md).
2. Decide on the public default credential (remove from README / force change / redesign auth).
3. Choose offline-personal vs. secure multi-user architecture.
4. Decide the fate of the unrelated Next.js files (`src/app/**`, `src/lib/**`, Next config, `.env.example`, `public/TNN_A.jpg`).

5. Export/Backup stages 2-3: answer the questions in section 6 of [`plans/EXPORT_BACKUP_PLAN.md`](plans/EXPORT_BACKUP_PLAN.md) (stage 1 done).
6. Approve commit/push of branch `test/vitest-baseline` (tests + stage 1, not committed yet).

## Done 2026-10-28

- Vitest unit tests (42) and `npm test` now runs them - branch `test/vitest-baseline`.
- Export/Backup plan written; stage 1 (unreadable-data protection, safe sample reset, save-failure warning) implemented and tested.

## Ready to Start (no owner decision needed)

1. Fix `getWeekKey` and the Daily Log default date to use local dates (tests already pin the week-key bug).
2. Run `npm audit fix` (non-force) for the pre-existing Vite/PostCSS/esbuild advisories, then re-test.
3. Add a GitHub Actions workflow running lint/test/build (needs approval to add CI).
4. Update `README.md`: Session Storage wording, project structure list.

## Every Session

- [ ] `git status`, `npm run lint`, `npm run build`, `npm run docs:validate`
- [ ] Change stays inside the Vite import graph
- [ ] Tests added for behavioral changes
- [ ] `project-status.json` + affected Markdown updated, `npm run docs:build` run
- [ ] `HANDOVER_VALIDATION.md` and `CHANGELOG.md` appended
