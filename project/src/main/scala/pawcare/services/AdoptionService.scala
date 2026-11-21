package pawcare.services

import pawcare.exceptions.*
import pawcare.models.AdoptionRecord
import pawcare.repositories.{AdoptionRepository, AnimalRepository}
import pawcare.database.DatabaseManager
import java.sql.{Connection, SQLException}
import java.time.LocalDate
import java.time.format.DateTimeFormatter

/** Business logic for adoption management.
  *
  * The approval flow uses a database transaction so that updating the animal's
  * adoption flag and the adoption record's status are atomic: if either fails
  * the whole operation is rolled back, leaving no partial state.
  */
class AdoptionService:
  private val dateFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")

  /** Validates adopter details and creates a PENDING application.
    *
    * Rules enforced:
    *   - adopter name, contact non-empty
    *   - adopter age >= 18
    *   - the referenced animal must exist
    *   - the referenced animal must not already be adopted
    *   - no duplicate adoption id
    */
  def submitApplication(
    adoptionId: Int,
    animalId: Int,
    adopterName: String,
    adopterAge: Int,
    adopterContact: String
  ): AdoptionRecord =
    validateAdopter(adopterName, adopterAge, adopterContact)
    if AdoptionRepository.findById(adoptionId).isDefined then
      throw InvalidAdoptionStatusException(s"Adoption application with ID $adoptionId already exists.")
    val animal = AnimalRepository.findById(animalId)
      .getOrElse(throw AnimalNotFoundException(animalId))
    if animal.isAdopted then throw AnimalAlreadyAdoptedException(animalId)

    val today = LocalDate.now().format(dateFormatter)
    val record = AdoptionRecord(
      adoptionId, animalId, adopterName.trim, adopterAge, adopterContact.trim,
      today, "PENDING"
    )
    AdoptionRepository.insert(record)
    record

  /** Approves a pending application and marks the animal as adopted.
    *
    * The two writes run in a single transaction. If either fails the
    * connection is rolled back, so a failed approval can never leave the
    * animal marked adopted while the application stays pending.
    */
  def approve(adoptionId: Int, approver: StaffService): AdoptionRecord =
    val record = AdoptionRepository.findById(adoptionId)
      .getOrElse(throw AdoptionNotFoundException(adoptionId))
    if record.adoptionStatus != "PENDING" then
      throw InvalidAdoptionStatusException(
        s"Application $adoptionId is already ${record.adoptionStatus} and cannot be approved.")

    val animal = AnimalRepository.findById(record.animalId)
      .getOrElse(throw AnimalNotFoundException(record.animalId))
    if animal.isAdopted then
      throw AnimalAlreadyAdoptedException(record.animalId)

    // Atomic: update both tables on one connection, rollback on any failure.
    val conn = DatabaseManager.getConnection
    var ok = false
    try
      conn.setAutoCommit(false)
      executeUpdate(conn,
        "UPDATE adoption_records SET adoption_status='APPROVED' WHERE adoption_id=?", adoptionId)
      executeUpdate(conn,
        "UPDATE animals SET is_adopted=1 WHERE animal_id=?", record.animalId)
      conn.commit()
      ok = true
    catch
      case e: Throwable =>
        try conn.rollback() catch case _: Throwable => ()
        throw e
    finally
      if ok then try conn.setAutoCommit(true) catch case _: Throwable => ()
      try conn.close() catch case _: Throwable => ()

    record.copy(adoptionStatus = "APPROVED")

  /** Rejects a pending application. Does not change the animal's status. */
  def reject(adoptionId: Int): AdoptionRecord =
    val record = AdoptionRepository.findById(adoptionId)
      .getOrElse(throw AdoptionNotFoundException(adoptionId))
    if record.adoptionStatus != "PENDING" then
      throw InvalidAdoptionStatusException(
        s"Application $adoptionId is already ${record.adoptionStatus} and cannot be rejected.")
    AdoptionRepository.updateStatus(adoptionId, "REJECTED")
    record.copy(adoptionStatus = "REJECTED")

  /** Returns all applications. */
  def all: List[AdoptionRecord] = AdoptionRepository.findAll()

  /** Pending applications only. */
  def pending: List[AdoptionRecord] = AdoptionRepository.findByStatus("PENDING")

  /** Approved applications only (adoption history). */
  def history: List[AdoptionRecord] = AdoptionRepository.findByStatus("APPROVED")

  /** Search applications by adopter name fragment. */
  def searchByAdopter(name: String): List[AdoptionRecord] =
    AdoptionRepository.findByAdopterName(name)

  def findById(adoptionId: Int): Option[AdoptionRecord] =
    AdoptionRepository.findById(adoptionId)

  // --- functional analytics ------------------------------------------------

  /** Success rate = approved / total applications * 100. */
  def successRate: Double =
    val allRecs = all
    if allRecs.isEmpty then 0.0
    else allRecs.count(_.adoptionStatus == "APPROVED").toDouble / allRecs.size * 100.0

  /** Applications grouped by status. */
  def groupByStatus: Map[String, List[AdoptionRecord]] =
    all.groupBy(_.adoptionStatus)

  /** Monthly adoption counts derived from approved records' dates. */
  def monthlyAdoptions: Map[String, Int] =
    history.groupMapReduce(r => r.adoptionDate.take(7))(_ => 1)(_ + _)

  // --- helpers -------------------------------------------------------------

  private def validateAdopter(name: String, age: Int, contact: String): Unit =
    if name == null || name.trim.isEmpty then
      throw InvalidAdopterException("Adopter name cannot be empty.")
    if age < 18 then
      throw InvalidAdopterException(s"Adopter must be at least 18 years old (got $age).")
    if contact == null || contact.trim.isEmpty then
      throw InvalidAdopterException("Adopter contact cannot be empty.")

  private def executeUpdate(conn: Connection, sql: String, id: Int): Unit =
    val ps = conn.prepareStatement(sql)
    try
      ps.setInt(1, id)
      ps.executeUpdate()
    finally ps.close()
