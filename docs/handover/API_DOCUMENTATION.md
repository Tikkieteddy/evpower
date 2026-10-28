# API Documentation

## EV Application API Inventory

API endpoints found in the active EV Vite import graph: **0**.

The EV application makes no `fetch`, Axios, WebSocket, server action, or external-provider request. Charger names are static labels only.

## Authentication Interface (In-process, Not HTTP)

| Function | File | Input | Result |
| --- | --- | --- | --- |
| `createAuthSession` | `src/utils/auth.js` | username, password | `{ok, session}` or error message |
| `readAuthSession` | `src/utils/auth.js` | none | session or null |
| `addUser` | `src/utils/auth.js` | username, password, role | updated browser-local user array |
| `updateUserPassword` | `src/utils/auth.js` | username, password | updated browser-local user array |
| `deleteUser` | `src/utils/auth.js` | username | updated browser-local user array |

These are client functions and provide no secure API boundary.

## Unrelated Tracked Endpoints

Routes under `src/app/api/**` belong to a separate Next.js profile workflow. They are excluded from EV lint, absent from the Vite import graph, and not deployed by the verified Vite `vercel.json`. They are intentionally not documented as EV APIs.

Their ownership and intended removal are **UNKNOWN**. Their external integration behavior was not runtime-tested as part of EV handover.

## Future API Requirements

If multi-user/cloud use is required, introduce a separately documented API with server-side sessions, authorization on every user-owned resource, validation, rate limiting, audit logging, and versioned schema migrations. This is a recommendation, not current implementation.

