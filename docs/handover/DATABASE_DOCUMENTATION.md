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

Array of `{username, password, role, createdAt}`. Password is plaintext. This is a security risk and must never be migrated as plaintext to production storage.

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
- **Data-loss path (verified 2026-10-28):** if `ev-charge-daily-log-v1` contains invalid JSON, `loadTrips()` returns sample trips and the `useEffect` in `App.jsx` immediately writes them back, overwriting the corrupted (possibly recoverable) original. Valid JSON that is not an array (e.g. `null`) is not guarded and would break rendering.
- `authStorageKey` and `legacyAuthStorageKey` in `auth.js` are the same string; the `localStorage.removeItem` calls only clean up a pre-Session-Storage copy.
- No schema validator, migration, backup, revision, or conflict resolution exists.
- Existing storage version suffix is embedded in key names, but migration code is absent.

## Data Protection

No encryption at rest, password hashing, server access control, export, retention policy, or cross-device recovery is implemented.

