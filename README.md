# PawCare

**A shelter operations management system for animal, staff, adoption, and health records.**

PawCare combines a **Scala 3** service layer and SQLite database with a **React and TypeScript** web workspace. It also includes a Scala console interface. Both interfaces use the same backend business rules and persistent data.

## Features

- **Animal records** — manage dogs, cats, and birds; search and filter the shelter directory; view adoption and health history.
- **Staff management** — maintain manager, veterinarian, and caretaker records.
- **Adoption workflows** — submit applications, review pending requests, approve or reject applications, and browse adoption history.
- **Health tracking** — record medical care, track vaccination status and due dates, and assign veterinarians.
- **Dashboard and reports** — view live shelter metrics, category and staff summaries, adoption trends, and upcoming reminders.
- **Data exports** — download supported adoption and analytics reports as CSV.
- **Console and web interfaces** — use the Scala console application or the React browser experience.

## Technology

| Area | Technologies |
| --- | --- |
| Web frontend | React 19, TypeScript, Vite, Tailwind CSS, Recharts |
| Frontend data | TanStack Query, Axios, Zustand |
| Backend | Scala 3.3.1, sbt 1.9.8, JDK HTTP server |
| Persistence | SQLite via sqlite-jdbc |
| Testing | ScalaTest; TypeScript type checking and production build |

## Architecture

```text
React + TypeScript web app ─┐
                            ├─> Scala HTTP API ─> Services ─> Repositories ─> SQLite
Scala console app ──────────┘
```

The Scala services own validation and business operations. The frontend calls the HTTP API and does not write to the database directly. In particular, approving an adoption updates the application and animal status together in a backend transaction.

## Project layout

```text
PawCare/
├── docs/
│   └── BACKEND_INTEGRATION.md   # API endpoints, validation, and data flow
├── frontend/
│   ├── src/                     # React application
│   ├── .env.example             # API URL configuration example
│   └── package.json
└── project/
    ├── build.sbt
    └── src/
        ├── main/scala/pawcare/  # Console app, API, services, repositories, models
        └── test/scala/pawcare/  # Scala service tests
```

## Prerequisites

- JDK 17
- sbt 1.9.8
- Node.js and npm

## Run locally

### 1. Start the Scala API

From the repository root, open a terminal and run:

```bash
cd project
sbt -batch -no-colors "runMain pawcare.web.WebMain"
```

The API starts at `http://localhost:8080`. To use another port, pass it to the entry point, for example:

```bash
sbt -batch -no-colors "runMain pawcare.web.WebMain 9090"
```

### 2. Start the web frontend

In a second terminal, from the repository root:

```bash
cd frontend
npm ci
npm run dev
```

Open the Vite URL printed in the terminal (by default, `http://localhost:5173`). The frontend's default API URL is `http://localhost:8080/api`.

To connect to an API running at a different address, set `VITE_API_BASE_URL` to the full API base URL, including `/api`. The [`frontend/.env.example`](frontend/.env.example) file shows the expected format; local `.env.local` files are ignored by Git.

### Serve the built frontend through Scala

To build the React app and have the Scala server serve it:

```bash
cd frontend
npm ci
npm run build
cd ../project
sbt -batch -no-colors "runMain pawcare.web.WebMain"
```

Then open `http://localhost:8080`. The server serves the built app from `frontend/dist` when it is available.

### Run the console application

From the repository root:

```bash
cd project
sbt -batch -no-colors run
```

## Application pages

| Route | Description |
| --- | --- |
| `/dashboard` | Shelter overview and live metrics |
| `/animals` | Animal directory |
| `/animals/:id` | Animal profile and history |
| `/adoptions` | Adoption application workspace |
| `/adoptions/:id` | Adoption application details |
| `/adoption-records` | Approved adoption history |
| `/staff` | Staff directory |
| `/health` | Medical records and vaccination tracking |
| `/analytics` | Shelter reports and charts |
| `/settings` | Display preferences and application settings |

## API overview

The HTTP API is served from `http://localhost:8080/api`. Its main resource groups are:

- `/animals`
- `/staff`
- `/adoptions`
- `/health`
- `/dashboard`
- `/reports`

For endpoint methods, request details, validation behavior, and error responses, see [`docs/BACKEND_INTEGRATION.md`](docs/BACKEND_INTEGRATION.md).

## Checks and tests

Run the Scala test suite:

```bash
cd project
sbt -batch -no-colors test
```

Type-check and build the frontend:

```bash
cd frontend
npm run typecheck
npm run build
```

## Data and demo behavior

The SQLite database is created automatically at `project/data/pawcare.db` when the backend starts. If the database is empty, PawCare inserts sample animals, staff, and health records. Existing database records are not overwritten by this seeding step.

The application currently has no authentication layer. Run it in a trusted development environment and do not expose the API to untrusted networks without adding appropriate access controls.

## License

No license file is currently included. Reuse and redistribution terms have not been specified.
