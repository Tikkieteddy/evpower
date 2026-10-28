# Implementation Wireframes and UX Flow

Baseline: source at commit `5360d94` and local runtime audit on 2026-10-28. All screens use route `/`; labels below show UI state, not URL routes.

## Shared Desktop Shell

```text
+--------------------------------------------------------------------------------+
| [EV icon] EV Charge Daily Calculator                                           |
| subtitle                                                                       |
| [Daily][Weekly][Monthly][Route][Charging][Forecast][Users*][Logout]            |
+--------------------------------------------------------------------------------+
| Overview band: title + 3 counters                                              |
+--------------------------------------------------------------------------------+
| Active tab content                                                             |
+--------------------------------------------------------------------------------+
| © 2026 TikkieTeddie Lab | V.1.0.0                                             |
+--------------------------------------------------------------------------------+
* Users is visible only to admin.
```

## Shared Mobile Shell

```text
+----------------------------+
| [EV] App title              |
| subtitle wraps              |
| [Daily] [Weekly]            |
| [Monthly] [Route]           |
| [Charging] [Forecast]       |
| [Users*] [Logout]           |
+----------------------------+
| Overview                    |
| [counter][counter][counter] |
+----------------------------+
| Active content stacks       |
| wide tables scroll ->       |
+----------------------------+
| footer                     |
+----------------------------+
```

## 1. Login - `/` unauthenticated

Desktop: centered max-width card with icon, title, username, password, error area, Log in button, footer. Mobile: same card fills available width inside 16 px page padding. Error state appears inline above the button. Loading state: NOT FOUND. Password recovery: NOT FOUND.

## Storage Notice (CURRENT, added 2026-10-28) - top of `<main>`, any tab

```text
[! Unreadable trip data (reason) - copy saved at <key> ... ] [Download original] [Close]
[! Could not copy - saving paused ...]                       [Download original] [Downloaded, continue]
[! Saving to the browser failed (storage full/disabled)]
```

Red alert panel (`role="alert"`); buttons wrap under the text on mobile (verified at 375 px, no horizontal overflow). Hidden when there is nothing to report.

## 2. Daily Log - `/` tab `daily`

```text
[6 summary cards]
[3 charts: cost bar | distance line | route-cost pie]
[Route presets: name + km + Add; removable chips]
[Daily form]
  Date | preset + editable route | km | has charge
  cost | charger/custom | kWh | idle minutes | auto/manual idle rate | note
  [Add/Save] [Cancel while editing] [Load sample]
[Scrollable history table] [Edit icon] [Delete icon]
```

Mobile: cards and charts stack; form becomes one column; table is horizontally scrollable. Confirm dialogs exist for delete and sample reset. Empty table state is implemented by `DataTable`.

## 3. Weekly Dashboard - `/` tab `weekly`

Desktop: heading and week selector; six metric cards; four secondary cards; three charts. Mobile: selector and all cards/charts stack. Empty week selector options are possible only with empty trip state; dedicated explanatory empty state is NOT FOUND.

## 4. Monthly Dashboard - `/` tab `monthly`

Desktop: heading/month input; six metrics; three highlight cards; three charts. Mobile: month input moves below heading; cards/charts stack. The implemented third highlight is idle impact, not the originally requested most-efficient route highlight.

## 5. Route Analysis - `/` tab `routes`

Desktop: heading and 11-column table with efficiency badge. Mobile: same table in horizontal scroll container. Empty state text: `ยังไม่มีข้อมูล`.

## 6. Charging Analysis - `/` tab `charging`

Desktop: heading; three cards (overall tariff, most used, cheapest); 9-column table. Mobile: cards stack; table scrolls. Empty state text: `ยังไม่มีรายการชาร์จ`.

## 7. Forecast - `/` tab `forecast`

Desktop: expected-day denominator; one or more route rows (route, days, trips/day, total, delete); Add route; five metric cards; result table. Mobile: route controls and metric cards stack; table scrolls. There is no validation message for planned days exceeding expected days.

## 8. Users - `/` tab `users`, admin only

Desktop: add-user form (username/password/role/Add), feedback message, user table with per-row new password, Save and Delete. Mobile: form stacks; table scrolls. Default admin delete is disabled. Non-admin direct tab access is not routed, but authorization remains client-side.

## 9. License Lock - `/` integrity failure

Centered card with alert icon, failure title, explanatory text, and four diagnostic rows. No navigation or recovery action. Mobile uses the same single-column card.

## User Journey

```text
Open app -> license check -> login -> Daily Log
  -> add/edit/delete trip -> browser storage updates -> cards/charts recalculate
  -> switch weekly/monthly/analysis tabs -> inspect derived data
  -> Forecast -> enter planned usage -> inspect projection
  -> Users (admin) -> manage browser-local accounts
  -> Logout -> session key removed -> Login
```

## Proposed UX Improvements (Not Implemented)

- Visible backup/export before destructive reset
- Clear distinction between charged energy and consumed energy
- Mobile bottom navigation or horizontally scrollable compact tabs after testing
- Validation/error summary and non-blocking toast feedback
- Empty states with next action
- Password recovery only after a secure backend exists

