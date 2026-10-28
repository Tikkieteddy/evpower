# Project Overview

## Executive Summary

EV Charge Daily Calculator is a responsive Thai-first dashboard that helps an individual EV driver log trips and charging sessions, estimate idle/air-conditioning energy, compare route and charger costs, and project next-month usage. Version is `1.0.0` in `package.json` and `V.1.0.0` in the UI footer.

## Users and Roles

| Role | Implemented access | Limitation |
| --- | --- | --- |
| `user` | All dashboard tabs except Users | Role is read from client-controlled Local Storage |
| `admin` | Dashboard plus local Users tab | No server authorization; cannot manage users on another browser/device |
| unauthenticated | Login screen only | Gate can be bypassed by modifying client code/storage |

## Implemented Product Capabilities

- Daily trip and charging CRUD, route presets, charger selection/custom value, notes
- Idle energy estimate using weighted historic rate or manual override
- Weekly and monthly selection, metrics, charts, and highlights
- Route and charging-provider analysis
- Next-month forecast based on historical per-route averages
- Browser-local users, session gate, license-integrity state, responsive layout
- Seven sample records loaded when no trip data exists

## Technology Stack

- React `19.2.4`
- Vite `7.3.3` resolved during build (`package.json` range `^7.2.0`)
- Tailwind CSS `4.1.18`
- Recharts `3.5.0`
- Lucide React `0.555.0`
- Browser Local Storage and Session Storage
- Vercel static hosting configuration

## Architecture Summary

The browser downloads a static SPA. React reads/writes three Local Storage datasets (trips, users, route presets) and one Session Storage login record. Calculation helpers derive dashboard summaries entirely in memory. Recharts renders derived arrays. No network request exists in the active EV import graph.

## Development Status

| Classification | Status |
| --- | --- |
| Implemented | Core log, dashboards, analysis, forecast, local storage, responsive shell |
| Partial | Authentication/authorization, license enforcement, energy attribution semantics |
| Planned | No source-backed planned features found; recommendations are in the roadmap |
| Deprecated | NOT FOUND |
| Unknown | Ownership/disposition of tracked unrelated Next.js files |

## External Integrations

- Vercel hosting: config verified; live project supplied by owner, deployment internals not reconfigured
- GitHub remote: `https://github.com/Tikkieteddy/evpower.git`
- Recharts/Lucide/Tailwind are build dependencies, not runtime data services
- EV charging providers appear only as user-selectable labels; there are no provider APIs

## Known Issues and Debt

1. Client-side plaintext credentials and user records.
2. Device-local data with no backup/sync.
3. Charged kWh is used as if it were consumed kWh; route attribution may mislead.
4. Repository contains unrelated Next.js application and configuration.
5. No unit, integration, accessibility, or E2E tests.
6. Single JS chunk exceeds Vite's 500 kB warning threshold.
7. README session-storage statement is outdated.
8. Mobile layout is source-reviewed but not visually emulated in this audit.

## Recommended Next Steps

Use `DEVELOPMENT_ROADMAP.md`. The first milestone is a security/data-ownership decision: either keep a clearly personal offline tool or introduce a backend with server-side authentication and per-user persistence.

