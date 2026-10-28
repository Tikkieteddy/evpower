# Changelog (Evidence-backed)

This is reconstructed from Git commit subjects; it is not a claim of semantic releases.

| Commit | Change |
| --- | --- |
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

## Unreleased (branch `docs/claude-takeover`, not committed)

- 2026-10-28 Claude Code takeover: verified the Codex handover against source; corrected the `postcss.config.mjs` / `public/` boundary; documented the public default credential, the storage overwrite path and the week-key timezone shift; added `docs:build` / `docs:validate` scripts; dashboard is now generated from `docs/handover/data/project-status.json`; added `INITIAL_TAKEOVER_REPORT.md`. No application behavior changed.
