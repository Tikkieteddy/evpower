# Project Structure

## Active EV Runtime Tree

```text
evpower-work/
|-- index.html                 # Vite HTML shell
|-- package.json               # Vite scripts and EV dependencies
|-- vite.config.js             # React plugin
|-- vercel.json                # Static deployment
|-- eslint.config.mjs          # Ignores unrelated Next.js areas
|-- postcss.config.mjs         # Tailwind CSS 4 pipeline (@tailwindcss/postcss) - REQUIRED by EV build
|-- src/
|   |-- main.jsx               # Active entry point
|   |-- App.jsx                # Auth gate, tabs, trip state
|   |-- index.css              # Tailwind import and theme tokens
|   |-- components/
|   |   |-- DailyLog.jsx
|   |   |-- WeeklyDashboard.jsx
|   |   |-- MonthlyDashboard.jsx
|   |   |-- RouteAnalysis.jsx
|   |   |-- ChargingAnalysis.jsx
|   |   |-- Forecast.jsx
|   |   |-- UserManagement.jsx
|   |   |-- LoginScreen.jsx
|   |   |-- LicenseLock.jsx
|   |   |-- RoutePresetManager.jsx
|   |   |-- Charts.jsx
|   |   |-- DashboardCards.jsx
|   |   |-- MetricCard.jsx
|   |   `-- DataTable.jsx
|   |-- data/
|   |   |-- sampleData.js      # Seven starter trips
|   |   `-- brandAudit.js      # Palette reference list
|   `-- utils/
|       |-- calculations.js    # Analytics and forecast formulas
|       |-- auth.js            # Client-side users/session
|       |-- routePresets.js    # Preset persistence
|       `-- licenseGuard.js    # Integrity check
|-- docs/handover/             # Handover documentation (data/project-status.json = dashboard source)
`-- scripts/docs/              # Dashboard generator + documentation validator
```

## Tracked but Outside Active EV Import Graph

```text
src/app/**
src/lib/**
next.config.ts
next-env.d.ts
tsconfig.json
public/TNN_A.jpg   # unused by EV, but Vite copies public/ into dist/ so it IS deployed
.env.example
```

These files describe a Next.js user-profile/approval workflow with Google/GitHub/SMTP integrations. Vite's active EV entry does not import them. ESLint explicitly ignores `src/app/**` and `src/lib/**`. Vercel is configured as Vite and publishes `dist`.

> Correction 2026-10-28 (Claude): Codex listed `postcss.config.mjs` here. It is actually used by the EV build - Vite auto-loads it and `src/index.css` relies on it for `@import "tailwindcss"`. Removing it would break all styling.

The unrelated code also contains real Google Sheet/Drive IDs (`.env.example`, `src/lib/config.ts`) and a hard-coded fallback approval secret (`src/lib/approval.ts`) in a public repository. Relevant only if that Next.js app is deployed anywhere.

Status: repository contamination / ownership UNKNOWN. Do not delete or document these as EV features without explicit owner confirmation.

## Generated / Local-only Paths

- `node_modules/`: installed dependencies, ignored
- `dist/`: Vite output, ignored
- `.vercel/`: local Vercel linkage, ignored
- `.git/`: repository metadata

## Dependency Direction

`main.jsx` -> `App.jsx` -> screen/shared components -> `utils`/`data`. Components do not call a backend. `App.jsx` is the only owner of trip state and saves it after state changes.

