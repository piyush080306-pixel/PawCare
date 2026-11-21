package pawcare.database

import java.sql.{Connection, DriverManager, ResultSet, SQLException, Statement}
import java.io.File

/** Central SQLite connection manager.
  *
  * Initialises the schema on first use and hands out connections to the
  * repository layer. Foreign keys are enabled on every connection so that
  * referential integrity is enforced by SQLite itself.
  */
object DatabaseManager:
  private val DbDir: String = "data"
  private val DbPath: String = s"$DbDir/pawcare.db"
  private val Url: String = s"jdbc:sqlite:$DbPath"

  Class.forName("org.sqlite.JDBC")
  private var schemaReady = false

  /** Opens a new connection. Each repository call borrows and closes its own
    * connection so there is no shared mutable state across threads. */
  def getConnection: Connection =
    ensureSchema()
    val conn = DriverManager.getConnection(Url)
    val stmt = conn.createStatement()
    stmt.execute("PRAGMA foreign_keys = ON")
    stmt.close()
    conn

  /** Returns true when the database file already exists on disk. */
  def databaseExists: Boolean = new File(DbPath).exists()

  /** Drops and recreates all tables. Test-only: clears all data so each suite
    * starts from a clean schema. */
  def resetForTesting(): Unit =
    new File(DbDir).mkdirs()
    val conn = DriverManager.getConnection(Url)
    try
      val stmt = conn.createStatement()
      try
        stmt.execute("PRAGMA foreign_keys = OFF")
        stmt.execute("DROP TABLE IF EXISTS caretaker_assignments")
        stmt.execute("DROP TABLE IF EXISTS health_records")
        stmt.execute("DROP TABLE IF EXISTS adoption_records")
        stmt.execute("DROP TABLE IF EXISTS animals")
        stmt.execute("DROP TABLE IF EXISTS staff")
        stmt.execute("PRAGMA foreign_keys = ON")
      finally stmt.close()
    finally conn.close()
    schemaReady = false
    ensureSchema()

  /** Returns true when all core tables are empty (used to seed sample data). */
  def isDatabaseEmpty: Boolean =
    val conn = getConnection
    try
      val tables = List("animals", "staff", "adoption_records", "health_records")
      tables.forall { t =>
        val rs = conn.createStatement().executeQuery(s"SELECT COUNT(*) AS c FROM $t")
        val count = if rs.next() then rs.getInt("c") else 0
        rs.close()
        count == 0
      }
    finally conn.close()

  private def ensureSchema(): Unit =
    if schemaReady then return
    new File(DbDir).mkdirs()
    val conn = DriverManager.getConnection(Url)
    try
      val stmt = conn.createStatement()
      try
        stmt.execute(AnimalsTable)
        stmt.execute(StaffTable)
        stmt.execute(AdoptionRecordsTable)
        stmt.execute(HealthRecordsTable)
        stmt.execute(CaretakerAssignmentsTable)
      finally stmt.close()
    finally conn.close()
    schemaReady = true

  // --- DDL -----------------------------------------------------------------

  private def AnimalsTable: String =
    """CREATE TABLE IF NOT EXISTS animals (
    |  animal_id      INTEGER PRIMARY KEY,
    |  category       TEXT    NOT NULL,
    |  name           TEXT    NOT NULL,
    |  age            INTEGER NOT NULL,
    |  gender         TEXT    NOT NULL,
    |  health_status  TEXT    NOT NULL,
    |  is_adopted     INTEGER NOT NULL DEFAULT 0,
    |  breed          TEXT,
    |  size           TEXT,
    |  is_trained     INTEGER,
    |  fur_color      TEXT,
    |  is_indoor      INTEGER,
    |  species        TEXT,
    |  wingspan       REAL,
    |  can_fly        INTEGER
    |)""".stripMargin

  private def StaffTable: String =
    """CREATE TABLE IF NOT EXISTS staff (
    |  staff_id        INTEGER PRIMARY KEY,
    |  role            TEXT    NOT NULL,
    |  name            TEXT    NOT NULL,
    |  contact_number  TEXT    NOT NULL,
    |  age             INTEGER NOT NULL,
    |  salary          REAL    NOT NULL,
    |  department      TEXT,
    |  specialization  TEXT,
    |  license_number  TEXT,
    |  shift           TEXT,
    |  assigned_area   TEXT
    |)""".stripMargin

  private def AdoptionRecordsTable: String =
    """CREATE TABLE IF NOT EXISTS adoption_records (
    |  adoption_id     INTEGER PRIMARY KEY,
    |  animal_id       INTEGER NOT NULL,
    |  adopter_name    TEXT    NOT NULL,
    |  adopter_age     INTEGER NOT NULL,
    |  adopter_contact TEXT    NOT NULL,
    |  adoption_date   TEXT    NOT NULL,
    |  adoption_status TEXT    NOT NULL,
    |  FOREIGN KEY (animal_id) REFERENCES animals(animal_id)
    |)""".stripMargin

  private def HealthRecordsTable: String =
    """CREATE TABLE IF NOT EXISTS health_records (
    |  record_id            INTEGER PRIMARY KEY,
    |  animal_id            INTEGER NOT NULL,
    |  medical_condition    TEXT    NOT NULL,
    |  vaccination_status   TEXT    NOT NULL,
    |  treatment_details    TEXT    NOT NULL,
    |  last_checkup_date    TEXT    NOT NULL,
    |  next_vaccination_date TEXT   NOT NULL,
    |  assigned_vet_id      INTEGER,
    |  FOREIGN KEY (animal_id) REFERENCES animals(animal_id),
    |  FOREIGN KEY (assigned_vet_id) REFERENCES staff(staff_id)
    |)""".stripMargin

  private def CaretakerAssignmentsTable: String =
    """CREATE TABLE IF NOT EXISTS caretaker_assignments (
    |  assignment_id  INTEGER PRIMARY KEY AUTOINCREMENT,
    |  caretaker_id   INTEGER NOT NULL,
    |  animal_id      INTEGER NOT NULL,
    |  FOREIGN KEY (caretaker_id) REFERENCES staff(staff_id),
    |  FOREIGN KEY (animal_id) REFERENCES animals(animal_id)
    |)""".stripMargin
