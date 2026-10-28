# Next Steps for Claude Code

_Updated 2026-10-28 after the Claude takeover audit. Codex checklist items 1, 2 and 7 are done (see `HANDOVER_VALIDATION.md`)._

## Waiting on the Owner

1. Approve commit/push of branch `docs/claude-takeover` (handover docs + docs scripts + CLAUDE.md).
2. Decide on the public default credential (remove from README / force change / redesign auth).
3. Choose offline-personal vs. secure multi-user architecture.
4. Decide the fate of the unrelated Next.js files (`src/app/**`, `src/lib/**`, Next config, `.env.example`, `public/TNN_A.jpg`).

## Ready to Start (no owner decision needed)

1. Add Vitest; unit-test `calculations.js` (division by zero, grouping, `getWeekKey` in UTC+7, forecast) and storage helpers.
2. Make `npm test` run the tests instead of only the build.
3. Design export/import (versioned JSON) and a non-destructive fallback for corrupted storage - present the plan before implementing.
4. Update `README.md`: Session Storage wording, project structure list.

## Every Session

- [ ] `git status`, `npm run lint`, `npm run build`, `npm run docs:validate`
- [ ] Change stays inside the Vite import graph
- [ ] Tests added for behavioral changes
- [ ] `project-status.json` + affected Markdown updated, `npm run docs:build` run
- [ ] `HANDOVER_VALIDATION.md` and `CHANGELOG.md` appended
