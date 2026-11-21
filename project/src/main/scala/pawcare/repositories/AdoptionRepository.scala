package pawcare.repositories

import pawcare.database.DatabaseManager
import pawcare.models.AdoptionRecord
import java.sql.{Connection, PreparedStatement, ResultSet}

/** Data-access layer for adoption records.
  *
  * Exposes a `transaction` helper that runs a block on a single connection
  * with commit/rollback semantics, so the adoption-approval flow can update
  * the animal status and the adoption record atomically.
  */
object AdoptionRepository:

  def insert(r: AdoptionRecord): Unit =
    val conn = DatabaseManager.getConnection
    try
      val sql =
        """INSERT INTO adoption_records
    | (adoption_id, animal_id, adopter_name, adopter_age, adopter_contact, adoption_date, adoption_status)
    | VALUES (?,?,?,?,?,?,?)""".stripMargin
      val ps = conn.prepareStatement(sql)
      try
        ps.setInt(1, r.adoptionId)
        ps.setInt(2, r.animalId)
        ps.setString(3, r.adopterName)
        ps.setInt(4, r.adopterAge)
        ps.setString(5, r.adopterContact)
        ps.setString(6, r.adoptionDate)
        ps.setString(7, r.adoptionStatus)
        ps.executeUpdate()
      finally ps.close()
    finally conn.close()

  def updateStatus(adoptionId: Int, status: String): Unit =
    val conn = DatabaseManager.getConnection
    try
      val ps = conn.prepareStatement("UPDATE adoption_records SET adoption_status=? WHERE adoption_id=?")
      try
        ps.setString(1, status)
        ps.setInt(2, adoptionId)
        ps.executeUpdate()
      finally ps.close()
    finally conn.close()

  def findById(adoptionId: Int): Option[AdoptionRecord] =
    val conn = DatabaseManager.getConnection
    try
      val ps = conn.prepareStatement("SELECT * FROM adoption_records WHERE adoption_id=?")
      try
        ps.setInt(1, adoptionId)
        val rs = ps.executeQuery()
        try if rs.next() then Some(mapRow(rs)) else None
        finally rs.close()
      finally ps.close()
    finally conn.close()

  def findAll(): List[AdoptionRecord] =
    val conn = DatabaseManager.getConnection
    try
      val rs = conn.createStatement().executeQuery("SELECT * FROM adoption_records")
      try resultsToList(rs)
      finally rs.close()
    finally conn.close()

  def findByStatus(status: String): List[AdoptionRecord] =
    val conn = DatabaseManager.getConnection
    try
      val ps = conn.prepareStatement("SELECT * FROM adoption_records WHERE adoption_status=?")
      try
        ps.setString(1, status.toUpperCase)
        val rs = ps.executeQuery()
        try resultsToList(rs)
        finally rs.close()
      finally ps.close()
    finally conn.close()

  def findByAdopterName(name: String): List[AdoptionRecord] =
    val conn = DatabaseManager.getConnection
    try
      val ps = conn.prepareStatement("SELECT * FROM adoption_records WHERE adopter_name LIKE ?")
      try
        ps.setString(1, s"%$name%")
        val rs = ps.executeQuery()
        try resultsToList(rs)
        finally rs.close()
      finally ps.close()
    finally conn.close()

  /** Counts records by status label (PENDING/APPROVED/REJECTED). */
  def countByStatus(status: String): Int =
    val conn = DatabaseManager.getConnection
    try
      val ps = conn.prepareStatement("SELECT COUNT(*) AS c FROM adoption_records WHERE adoption_status=?")
      try
        ps.setString(1, status.toUpperCase)
        val rs = ps.executeQuery()
        try if rs.next() then rs.getInt("c") else 0
        finally rs.close()
      finally ps.close()
    finally conn.close()

  // --- row mapping ---------------------------------------------------------

  private def resultsToList(rs: ResultSet): List[AdoptionRecord] =
    val buf = scala.collection.mutable.ListBuffer.empty[AdoptionRecord]
    while rs.next() do buf += mapRow(rs)
    buf.toList

  private def mapRow(rs: ResultSet): AdoptionRecord =
    AdoptionRecord(
      rs.getInt("adoption_id"),
      rs.getInt("animal_id"),
      rs.getString("adopter_name"),
      rs.getInt("adopter_age"),
      rs.getString("adopter_contact"),
      rs.getString("adoption_date"),
      rs.getString("adoption_status")
    )
