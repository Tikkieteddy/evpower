# Database and Storage Documentation

## Database Status

EV database: **NOT FOUND**. Migrations: **NOT FOUND**. ORM/schema framework: **NOT FOUND**.

The active app stores JSON in browser storage.

## Local Storage Keys

### `ev-charge-daily-log-v1`

Array of trips:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | generated UUID; primary identity in UI |
| `date` | `YYYY-MM-DD` string | used for week/month grouping |
| `routeName` | string | copied value; no foreign key |
| `distanceKm` | number | non-negative form constraint |
| `hasCharge` | boolean | controls charge fields |
| `chargerName` | string | predefined or custom |
| `chargeCost` | number | zero when not charging |
| `kwh` | number | charged energy, currently used in consumption metrics |
| `idleMinutes` | number | estimate input |
| `idleKwhPerHour` | number | auto/manual rate |
| `idleRateMode` | `auto` or `manual` | legacy records default to auto |
| `note` | string | free text |

### `tikkieteddielab-evpower-route-presets-v1`

Array of `{id, routeName, distanceKm}`. Selecting a preset copies route name and distance into a trip; later preset edits/deletion would not update historical trips.

### `tikkieteddielab-evpower-users-v1`

Array of `{username, password, role, createdAt}` (schema unchanged). Password is plaintext. Since 2026-10-28 a session whose user still has the seeded admin password gets `mustChangePassword: true` (computed on read, not stored), and no user can be given the seeded password again. This is a security risk and must never be migrated as plaintext to production storage.

## Session Storage Key

### `tikkieteddielab-evpower-session-v1`

Object `{user, role, credit, signedInAt}`. On read, the user is re-matched against Local Storage. Session ends when the browser session closes or the user logs out.

## Relationships

- Session -> User: logical username match, not enforced.
- Trip -> Route preset: no key relationship; only copied text/distance.
- Trip -> Charger: free-text label; no charger entity.
- All keys are independent and have no transaction boundary.

## Validation and Migration

- JSON parse failures fall back to sample/default data for trips/users/routes.
- **Data-loss path - FIXED 2026-10-28 (stage 1 of the Export/Backup plan):** `src/utils/tripStorage.js` now copies an unreadable value (invalid JSON or non-array such as `null`) to a backup key *before* the app saves anything, shows a warning banner with a raw download, and blocks saving entirely if the copy fails. Previously the sample data silently overwrote it and `null` broke rendering.
- Sample reset now stores a copy of the current trips first and cancels if the copy fails.
- Failed saves (quota/disabled storage) show a banner instead of throwing.

### Backup keys (added 2026-10-28, Local Storage)

| Key pattern | Written when | Content |
| --- | --- | --- |
| `ev-charge-daily-log-v1:corrupt-<hash>` | main key unreadable on load | raw original string (hash of content, so one key per distinct value) |
| `ev-charge-daily-log-v1:before-sample-<ISO timestamp>` | before "load sample data" | `Trip[]` JSON |

These keys are never read back automatically yet; restore/import arrives in stage 3. Existing keys and schemas are unchanged.
- `authStorageKey` and `legacyAuthStorageKey` in `auth.js` are the same string; the `localStorage.removeItem` calls only clean up a pre-Session-Storage copy.
- No schema validator, migration, backup, revision, or conflict resolution exists.
- Existing storage version suffix is embedded in key names, but migration code is absent.

Proposed fix and export/import design: [`plans/EXPORT_BACKUP_PLAN.md`](plans/EXPORT_BACKUP_PLAN.md).

## Data Protection

No encryption at rest, password hashing, server access control, export, retention policy, or cross-device recovery is implemented.

