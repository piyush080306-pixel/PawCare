# PawCare – Animal Shelter Management System

A complete, modular **Animal Shelter Management System** built in **Scala 3**, demonstrating Object-Oriented Programming (OOP), Functional Programming (FP), inheritance, polymorphism, pattern matching, custom exceptions, and persistent storage with SQLite.

---

## Project Introduction

PawCare is an animal shelter management application with a Scala console interface and a React browser workspace. It allows staff to register animals, manage staff records, process adoptions, track animal health, and view live shelter analytics — all persisted in a SQLite database.

---

## Project Objectives

- Demonstrate core Scala 3 concepts in a real, working application.
- Apply OOP principles: abstraction, inheritance, encapsulation, polymorphism.
- Apply FP principles: immutable data, higher-order functions, `Option`, `Either`.
- Implement a clean layered architecture (models → repositories → services → UI).
- Provide persistent storage with proper transactions and referential integrity.
- Ship automated unit tests covering every core module.

---

## Features

- **Animal Management** – register, search, update, delete, filter, and view available/adopted animals (Dogs, Cats, Birds).
- **Staff Management** – add, search, update, remove staff (Managers, Veterinarians, Caretakers) and assign caretakers to animals.
- **Adoption Management** – submit applications, approve/reject with manager authorization, maintain history, prevent double adoptions.
- **Animal Health Management** – add medical records, view history, update vaccination status, see upcoming reminders, assign veterinarians.
- **Search & Filter** – by ID, name, type, age, gender, adoption status; sort alphabetically or by age; search adoption records by adopter name.
- **Shelter Dashboard** – live statistics computed from stored records.
- **Reports** – category distribution, monthly adoptions, success rate, staff distribution, vaccination reminders.

---

## Technology Stack

| Component       | Choice              |
|-----------------|---------------------|
| Language        | Scala 3.3.1         |
| Build Tool      | sbt 1.9.8           |
| JDK             | Java 17             |
| Interfaces      | Scala console; React + TypeScript web application |
| Web build       | Vite; Tailwind CSS; Recharts |
| Database        | SQLite              |
| DB Access       | JDBC (sqlite-jdbc)  |
| Testing         | ScalaTest           |

---

## Scala Concepts Demonstrated

- **Abstract classes & inheritance** – `Animal`, `Staff` hierarchies.
- **Polymorphism & method overriding** – `describe`, `category`, `withAdopted`.
- **Case classes** – `AdoptionRecord`, `HealthRecord`.
- **Pattern matching** – row mapping in repositories, service dispatch.
- **Custom exceptions** – 8 domain-specific exception classes in `exceptions/`.
- **Immutable collections** – `List`, `Map`, `Set` throughout services.
- **Higher-order functions** – `map`, `filter`, `foreach`, `flatMap`, `find`, `exists`, `groupBy`, `sortBy`, `foldLeft`, `groupMapReduce`.
- **Option** – repository lookups return `Option[...]`.
- **Either / Try** – validation and date parsing use `scala.util.Try`.
- **Encapsulation** – private fields with accessors; mutable DB state isolated in repositories.

---

## Project Architecture

```
PawCare/
├── build.sbt
├── README.md
├── .gitignore
├── project/
│   └── build.properties
├── data/
│   └── pawcare.db                 # auto-created on first run
└── src/
    ├── main/scala/pawcare/
    │   ├── Main.scala              # entry point
    │   ├── DataSeeder.scala        # optional sample data
    │   ├── models/                 # Animal, Dog, Cat, Bird, Staff, Manager, ...
    │   ├── services/               # AnimalService, AdoptionService, ...
    │   ├── repositories/           # AnimalRepository, ... (JDBC)
    │   ├── exceptions/             # ShelterExceptions.scala
    │   ├── database/               # DatabaseManager.scala
    │   └── ui/                     # ConsoleMenu, AnimalMenu, ...
    └── test/scala/pawcare/
        ├── TestBase.scala
        ├── AnimalServiceTest.scala
        ├── StaffServiceTest.scala
        ├── AdoptionServiceTest.scala
        └── HealthServiceTest.scala
```

**Layering:** UI → Services (business logic + validation) → Repositories (JDBC CRUD) → DatabaseManager (connection + schema).

---

## Database Schema

```sql
animals(animal_id PK, category, name, age, gender, health_status, is_adopted,
        breed, size, is_trained, fur_color, is_indoor, species, wingspan, can_fly)

staff(staff_id PK, role, name, contact_number, age, salary,
      department, specialization, license_number, shift, assigned_area)

adoption_records(adoption_id PK, animal_id FK -> animals,
                 adopter_name, adopter_age, adopter_contact,
                 adoption_date, adoption_status)

health_records(record_id PK, animal_id FK -> animals,
               medical_condition, vaccination_status, treatment_details,
               last_checkup_date, next_vaccination_date, assigned_vet_id FK -> staff)

caretaker_assignments(assignment_id PK, caretaker_id FK -> staff, animal_id FK -> animals)
```

Foreign keys are enabled on every connection. Adoption approval uses a transaction so the animal's adoption flag and the adoption record's status update atomically.

---

## Installation

### Prerequisites

- JDK 17 (or compatible)
- sbt 1.9.x

### Steps

1. Clone or copy the project directory.
2. From the project root, run any sbt command (see below). The SQLite database file is created automatically under `data/pawcare.db` on first run.

---

## Execution Commands

```bash
sbt compile   # compile all sources
sbt test      # run the ScalaTest suite
sbt run       # launch the console application
```

On first launch with an empty database, sample data (5 animals, 4 staff, 2 health records) is inserted automatically.

---

## Web Interface (browser demo)

The React workspace is in the sibling `frontend` directory. Build it before
starting the Scala web service to have the service host the compiled frontend:

```bash
cd ../frontend
npm install
npm run build
cd ../project
sbt "runMain pawcare.web.WebMain"        # http://localhost:8080
sbt "runMain pawcare.web.WebMain 9090"   # custom port
```

Open **http://localhost:8080** in a browser. The JDK HTTP server serves
`frontend/dist` when it is present and retains the bundled web UI as a fallback.
During frontend development, run the Scala service and `npm run dev` in separate
terminals; Vite proxies `/api` requests to port 8080. Every write still goes
through the existing services, so validation and transactional adoption
approval remain owned by Scala. See [`../frontend/README.md`](../frontend/README.md)
for the API contract and current endpoint limitations.

---

## Sample Application Workflow

1. Run `sbt run`.
2. Choose **6. Shelter Dashboard** to see the seeded statistics.
3. Choose **3. Adoption Management → 1. Submit Adoption Application**.
4. Enter an adoption ID (e.g. `1`), animal ID `1` (Bruno), and adopter details.
5. Choose **3. Approve Application**, enter adoption ID `1` and manager staff ID `1` (Rahul).
6. Return to the dashboard — Bruno is now adopted and the adoption rate has increased.

---

## Testing Instructions

```bash
sbt test
```

The test suite resets the database schema before each test so suites are independent. Covered:

- **Animal**: registration, duplicate prevention, search, missing IDs, filtering, grouping, sorting.
- **Staff**: registration, search, missing IDs, role filtering, update, removal, caretaker assignment.
- **Adoption**: submit, approve, reject, double-adoption prevention, nonexistent animal, pending/rejected status invariants, non-pending approval rejection, adopter validation, history, search.
- **Health**: add records, history retrieval, vaccination update, vet assignment, non-vet rejection, upcoming reminders, missing animal.

---

## Future Enhancements

- Authentication and per-user roles for the console UI.
- Export reports to CSV/PDF.
- Email/SMS notifications for upcoming vaccinations.
- Web or REST API layer on top of the existing services.
- Multi-shelter support with tenant isolation.
