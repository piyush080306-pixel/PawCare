# PawCare frontend

PawCare is a React 19 + TypeScript SaaS workspace for animal shelter operations. It is a
client of the existing Scala 3 + SQLite application: every write, validation rule, and
statistic remains in the Scala service layer.

## Run locally

1. Start the Scala web service from `PawCare/project`:

   ```bash
   sbt -batch -no-colors "runMain pawcare.web.WebMain 8080"
   ```

2. Install packages and start Vite from `PawCare/frontend`:

   ```bash
   npm install
   npm run dev
   ```

3. Open `http://localhost:5173`. The dev proxy forwards `/api` to `http://localhost:8080`.

Set `VITE_API_BASE_URL` in `.env.local` if the API is hosted elsewhere. A copyable template is
provided in `.env.example`.

## Scripts

- `npm run dev` — Vite development server
- `npm run typecheck` — strict TypeScript check
- `npm run build` — TypeScript check plus optimized production build
- `npm run preview` — serve the built SPA locally

## Pages

| Route | Purpose |
| --- | --- |
| `/dashboard` | Executive overview with live service-level statistics |
| `/animals` | Searchable, filterable animal directory with grid/table views |
| `/animals/:id` | Animal profile, medical history, and adoption history |
| `/adoptions` | Application workspace with approve/reject workflows |
| `/adoptions/:id` | Application detail and server-side decision dialogs |
| `/adoption-records` | Historical approved adoptions and CSV export |
| `/staff` | Staff roster, role-specific details, and veterinary caseloads |
| `/health` | Medical records and vaccination monitor |
| `/analytics` | Reports, charts, and supported CSV exports |
| `/settings` | Theme, display preferences, integration details, and help |

## Backend contract

See `PawCare/docs/BACKEND_INTEGRATION.md` for the audited endpoint list, validation rules,
and data-flow notes. The frontend never fabricates records or dashboard figures, never
changes an animal's adoption flag directly, and only exposes operations supported by the
Scala services.

The production build can be copied into the Scala web root; the JDK HTTP server returns
`index.html` for extensionless client routes.
