# Document Index

Last updated: 2026-10-28 (Asia/Bangkok) by Claude Code · Docs version `V.1.7` · App version `1.0.0`

Status legend: **Verified** = checked against source by Claude · **Updated** = corrected/extended by Claude · **New** = created by Claude · **Generated** = produced by a script, do not hand-edit · **Snapshot** = dated formal record.

| Document | Purpose | Category | Path | Version / Date | Related | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Claude Guide | AI entry point, permanent rules, commands | AI handover | [`CLAUDE.md`](CLAUDE.md) | 2026-10-28 | all | Updated |
| Start Here | Takeover instruction (Thai) | AI handover | [`START_HERE_CLAUDE.md`](START_HERE_CLAUDE.md) | Codex 2026-10-28 | CLAUDE.md | Verified |
| Handover | Current verified state and risks | Summary | [`HANDOVER.md`](HANDOVER.md) | 2026-10-28 | Takeover report | Updated |
| Document Index | This map | Index | [`DOCUMENT_INDEX.md`](DOCUMENT_INDEX.md) | 2026-10-28 | dashboard §12 | Updated |
| Initial Takeover Report | Claude audit, findings, priorities (Thai) | Report | [`docs/handover/INITIAL_TAKEOVER_REPORT.md`](docs/handover/INITIAL_TAKEOVER_REPORT.md) | 2026-10-28 | Validation, Roadmap | New |
| Export/Backup Plan | Proposal for export/import/backup and safe storage fallback (Thai) | Plan | [`docs/handover/plans/EXPORT_BACKUP_PLAN.md`](docs/handover/plans/EXPORT_BACKUP_PLAN.md) | 2026-10-28 | Roadmap P1, Data Documentation | Stage 1 live; 2-3 built (PR pending) |
| Interactive Dashboard | Owner control center (12 sections) | Interactive | [`docs/handover/HANDOVER_DASHBOARD.html`](docs/handover/HANDOVER_DASHBOARD.html) | V.1.1 | project-status.json | Generated |
| Dashboard Data | Single source for dashboard content | Data | [`docs/handover/data/project-status.json`](docs/handover/data/project-status.json) | 2026-10-28 | scripts/docs | New |
| Docs Scripts | Dashboard generator + validator | Tooling | [`scripts/docs/`](scripts/docs/build-dashboard.mjs) | 2026-10-28 | package.json `docs:*` | New |
| Formal PDF | A4 handover report | Report | [`docs/handover/HANDOVER_SUMMARY.pdf`](docs/handover/HANDOVER_SUMMARY.pdf) | Codex V.1, baseline `5360d94` | generate_handover_pdf.py | Snapshot (postcss/public statements superseded) |
| PDF Generator | ReportLab source of the PDF | Tooling | [`docs/handover/generate_handover_pdf.py`](docs/handover/generate_handover_pdf.py) | Codex 2026-10-28 | PDF | Verified exists (not re-run) |
| Project Overview | Product, users, stack, status | Analysis | [`docs/handover/PROJECT_OVERVIEW.md`](docs/handover/PROJECT_OVERVIEW.md) | Codex 2026-10-28 | Feature Inventory | Verified |
| System Architecture | Components, data flow, sitemap, build pipeline | Architecture | [`docs/handover/SYSTEM_ARCHITECTURE.md`](docs/handover/SYSTEM_ARCHITECTURE.md) | 2026-10-28 | diagrams/*.mmd | Updated |
| Project Structure | Active vs. inactive file boundary | Architecture | [`docs/handover/PROJECT_STRUCTURE.md`](docs/handover/PROJECT_STRUCTURE.md) | 2026-10-28 | CLAUDE.md | Updated |
| Feature Inventory | Feature matrix and status | Delivery | [`docs/handover/FEATURE_INVENTORY.md`](docs/handover/FEATURE_INVENTORY.md) | Codex 2026-10-28 | project-status.json | Verified |
| Setup Guide | Clone, install, run, build, docs commands | Developer | [`docs/handover/SETUP_GUIDE.md`](docs/handover/SETUP_GUIDE.md) | 2026-10-28 | CLAUDE.md | Updated |
| API Documentation | EV API inventory (none) | Technical | [`docs/handover/API_DOCUMENTATION.md`](docs/handover/API_DOCUMENTATION.md) | Codex 2026-10-28 | Architecture | Verified |
| Data Documentation | Browser storage schemas and risks | Technical | [`docs/handover/DATABASE_DOCUMENTATION.md`](docs/handover/DATABASE_DOCUMENTATION.md) | 2026-10-28 | storage-model.mmd | Updated |
| Roadmap | Prioritized future work | Planning | [`docs/handover/DEVELOPMENT_ROADMAP.md`](docs/handover/DEVELOPMENT_ROADMAP.md) | 2026-10-28 | Next Steps | Updated |
| Next Steps | Next session checklist | Planning | [`docs/handover/NEXT_STEPS.md`](docs/handover/NEXT_STEPS.md) | 2026-10-28 | Roadmap | Updated |
| Decisions | Architecture decisions (ADR-001…006) | Architecture | [`docs/handover/DECISIONS.md`](docs/handover/DECISIONS.md) | 2026-10-28 | Architecture | Updated |
| Changelog | Git-evidenced history + unreleased | History | [`docs/handover/CHANGELOG.md`](docs/handover/CHANGELOG.md) | 2026-10-28 | Git log | Updated |
| Validation | Pass/fail/not-verified log | QA | [`docs/handover/HANDOVER_VALIDATION.md`](docs/handover/HANDOVER_VALIDATION.md) | 2026-10-28 | Takeover report | Updated |
| Wireframes | Desktop/mobile wireframes (all CURRENT) | UX | [`docs/handover/wireframes/WIREFRAMES.md`](docs/handover/wireframes/WIREFRAMES.md) | Codex 2026-10-28 | dashboard §5 | Verified |
| Diagrams | Mermaid: architecture, data flow, sitemap, storage | Architecture | [`docs/handover/diagrams/`](docs/handover/diagrams/system-architecture.mmd) | Codex 2026-10-28 | Architecture | Verified |
| Package README | How to use the Codex ZIP | Packaging | [`docs/handover/PACKAGE_README.md`](docs/handover/PACKAGE_README.md) | Codex 2026-10-28 | ZIP | Historical |

## Not in Git

- `PROJECT_HANDOVER_TO_CLAUDE_CODE.zip` (repo root, 131 kB) — Codex package; its contents duplicate files above and are now partly outdated. Ignored via `.gitignore`; attach to a GitHub Release if a portable copy is needed.
- Browser Local/Session Storage data, credentials, Vercel/GitHub sessions — live only on the user's machines.
