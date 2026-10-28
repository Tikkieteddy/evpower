# Feature Inventory

Status values are `Implemented`, `Partial`, `Planned`, `Deprecated`, or `Unknown`.

| Feature | Module | Route / File | Status | Dependencies | Issues | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| Login gate | Authentication | `/`, `auth.js`, `LoginScreen.jsx` | Partial | Session Storage | plaintext client credentials; bypassable | P0 |
| Forced change of default password | Authentication | `auth.js`, `ChangePasswordScreen.jsx` | Implemented | Local Storage users | per browser; client-side only | P1 |
| Local user management | Authentication | `/` Users tab | Partial | Local Storage | device-only; client role checks | P0 |
| License/brand integrity state | Integrity | `licenseGuard.js`, `LicenseLock.jsx` | Partial | `brandAudit.js` | bypassable at source/build level | P2 |
| Daily trip create | Daily Log | `DailyLog.jsx` | Implemented | React state | browser validation only | P1 |
| Daily trip edit | Daily Log | `DailyLog.jsx` | Implemented | trip ID | no audit trail | P2 |
| Daily trip delete | Daily Log | `App.jsx` | Implemented | browser confirm | no undo | P2 |
| Route presets/autofill | Daily Log | `RoutePresetManager.jsx` | Implemented | Local Storage | no preset edit; deletion no confirm | P2 |
| Charge session fields | Daily Log | `DailyLog.jsx` | Implemented | charger list | custom names not normalized | P2 |
| Idle energy estimate | Daily Log/analytics | `calculations.js` | Implemented | historic weighted rate | estimate not telemetry | P1 |
| Seven-day starter data | Bootstrap | `sampleData.js` | Implemented | first empty storage read | sample can be mistaken for real data | P2 |
| Local trip persistence | Storage | `App.jsx` | Implemented | Local Storage | no migration/backup/sync | P0 |
| Weekly dashboard | Reporting | `WeeklyDashboard.jsx` | Implemented | calculations/charts | week timezone logic not tested | P1 |
| Monthly dashboard | Reporting | `MonthlyDashboard.jsx` | Implemented | calculations/charts | energy semantics misleading | P1 |
| Daily charts | Visualization | `Charts.jsx` | Implemented | Recharts | contributes to large bundle | P2 |
| Route analysis | Analytics | `RouteAnalysis.jsx` | Implemented | route name grouping | cost/kWh charged-day attribution | P1 |
| Charger analysis | Analytics | `ChargingAnalysis.jsx` | Implemented | charging records | distance association may mislead | P1 |
| Forecast | Planning | `Forecast.jsx` | Implemented | route history | no confidence interval; sparse data risk | P1 |
| Responsive shell/navigation | UX | `App.jsx`, `index.css` | Implemented | Tailwind breakpoints | mobile visual audit not completed | P2 |
| Sample reset | Data management | `App.jsx` | Implemented | confirm dialog, `backupTrips` | copy kept in Local Storage; no restore UI yet | P2 |
| Unreadable-data protection | Data management | `tripStorage.js`, `StorageNotice.jsx` | Implemented | Local Storage | restore needs stage 3 import | P1 |
| Save-failure warning | Data management | `App.jsx`, `StorageNotice.jsx` | Implemented | Local Storage | - | P2 |

## Totals

- Implemented: 19 (3 added 2026-10-28)
- Partial: 3
- Planned: 0 found in source
- Deprecated: 0 found
- Unknown features: 0 (repository ownership remains an architecture uncertainty, not a feature)

## Tests

Added 2026-10-28 (Vitest 4): `src/utils/calculations.test.js` (27) and `src/utils/storage.test.js` (15) and `src/utils/tripStorage.test.js` (13) cover every exported calculation helper, route presets and local auth/session. One test is an expected failure that pins the week-key timezone bug.

## Missing Tests

- `App.jsx` / `StorageNotice.jsx` component behavior (logic covered by `tripStorage.test.js`; UI verified manually)
- Form validation and CRUD component tests
- Responsive and accessibility checks
- E2E login-to-report flow

## Recommended Improvements

Recommendations are not implemented features. See `DEVELOPMENT_ROADMAP.md` for acceptance criteria.

