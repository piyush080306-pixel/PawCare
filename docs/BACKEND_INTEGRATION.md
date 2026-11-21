# PawCare Backend Integration Contract

This document records the **actual** capabilities of the existing Scala 3 backend.
The React frontend is a client only — all validation, transactions and statistics
remain in the Scala service layer.

## Source of truth

| Layer | Files |
| --- | --- |
| HTTP adapter | `project/src/main/scala/pawcare/web/WebServer.scala` |
| JSON codec | `project/src/main/scala/pawcare/web/Json.scala` |
| Services | `project/src/main/scala/pawcare/services/*.scala` |
| Repositories | `project/src/main/scala/pawcare/repositories/*.scala` |
| Models | `project/src/main/scala/pawcare/models/*.scala` |
| Schema / seed | `project/src/main/scala/pawcare/database/DatabaseManager.scala`, `DataSeeder.scala` |

## Available REST endpoints

Base URL: `http://localhost:8080` (environment variable `VITE_API_BASE_URL` in the frontend).
CORS and `OPTIONS` preflight are enabled for local development.

### Animals

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/animals` | Supports `?category=DOG`, `?status=available|adopted`, `?q=name` |
| GET | `/api/animals/available` | Available animals |
| GET | `/api/animals/adopted` | Adopted animals |
| GET | `/api/animals/:id` | Single animal |
| POST | `/api/animals` | Dispatches to `Dog`/`Cat`/`Bird` constructor by `category` |
| PUT | `/api/animals/:id` | Updates name, age, gender, health status only |
| DELETE | `/api/animals/:id` | Service-level guard rejects linked records |

**Create payload**: `category` (`DOG`/`CAT`/`BIRD`), `name`, `age`, `gender`,
`healthStatus`, plus type-specific fields (`breed`/`size`/`isTrained`,
`breed`/`furColor`/`isIndoorFriendly`, `species`/`wingspan`/`canFly`).

### Staff

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/staff` | Supports `?role=MANAGER|VETERINARIAN|CARETAKER` |
| GET | `/api/staff/:id` | Single staff member |
| POST | `/api/staff` | Dispatches by `role` |
| PUT | `/api/staff/:id` | Name, contact, age, salary (role immutable) |
| DELETE | `/api/staff/:id` | Service-level guard applies |

### Adoptions

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/adoptions` | Supports `?status=PENDING|APPROVED|REJECTED` |
| GET | `/api/adoptions/pending` | Pending applications |
| GET | `/api/adoptions/history` | Approved applications |
| GET | `/api/adoptions/:id` | Single application |
| POST | `/api/adoptions` | `animalId`, `adopterName`, `adopterAge`, `adopterContact` |
| POST | `/api/adoptions/:id/approve` | Transactional: status + animal flag |
| POST | `/api/adoptions/:id/reject` | Status only; animal unchanged |

**Critical rule:** the frontend never marks an animal adopted itself. Only
`AdoptionService.approve` performs that write, inside one SQLite transaction.

### Health

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/health` | All medical records |
| GET | `/api/health/animal/:animalId` | History for one animal |
| GET | `/api/health/:id` | Single record |
| POST | `/api/health` | New record; vet must have role `VETERINARIAN` |
| POST | `/api/health/:id/vaccination` | `status`, `nextVaccinationDate` |

There is no full-record `PUT` in `HealthService`; only vaccination status and
date and vet assignment can be changed. The UI exposes exactly those operations.

### Reports

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/dashboard` | `stats`, `adoptionRate`, `successRate`, `categories`, `roles`, `upcoming` |
| GET | `/api/reports` | Adds `monthly`, `available`, `adopted` |

All figures come from `ReportService` (live queries), never from frontend state.

## Validation rules mirrored in the UI

- Animal name is required; age defaults to 1 when blank.
- Adopter must be 18+, name and contact non-empty; animal must exist and be available.
- Approve/reject only applies to `PENDING` applications.
- Health record requires condition and treatment; vaccination status must be
  `VACCINATED`, `PARTIAL` or `UNVACCINATED`; assigned vet must be a veterinarian.
- Staff name/contact required; role cannot be changed after creation.

## Error responses

Failures are returned as `{ "error": "<message>" }`. The HTTP adapter maps domain
exceptions to meaningful statuses:

| Status | Cause |
| --- | --- |
| `400` | Invalid JSON/arguments or a violated business rule (for example, an underage adopter) |
| `404` | Animal, staff member, adoption application or health record does not exist |
| `500` | Unexpected server failure |

The axios interceptor surfaces the `error` message directly in the UI toast.

## Frontend data flow

```
React component
  -> TanStack Query hook (services/api/queries.ts)
  -> axios client (services/api/apiClient.ts)
  -> Scala HTTP adapter
  -> existing service -> repository -> SQLite
```

Mutations invalidate the related query keys so dashboards and tables stay consistent.
The optional in-browser mock dataset is a **development fallback only** and is
never used to fabricate report figures when the API is reachable.
