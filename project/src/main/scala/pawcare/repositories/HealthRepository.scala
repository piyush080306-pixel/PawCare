package pawcare.repositories

import pawcare.database.DatabaseManager
import pawcare.models.HealthRecord
import java.sql.{Connection, PreparedStatement, ResultSet}

/** Data-access layer for animal health records. */
object HealthRepository:

  def insert(r: HealthRecord): Unit =
    val conn = DatabaseManager.getConnection
    try
      val sql =
        """INSERT INTO health_records
    | (record_id, animal_id, medical_condition, vaccination_status, treatment_details,
    |  last_checkup_date, next_vaccination_date, assigned_vet_id)
    | VALUES (?,?,?,?,?,?,?,?)""".stripMargin
      val ps = conn.prepareStatement(sql)
      try
        ps.setInt(1, r.recordId)
        ps.setInt(2, r.animalId)
        ps.setString(3, r.medicalCondition)
        ps.setString(4, r.vaccinationStatus)
        ps.setString(5, r.treatmentDetails)
        ps.setString(6, r.lastCheckupDate)
        ps.setString(7, r.nextVaccinationDate)
        r.assignedVetId match
          case Some(vetId) => ps.setInt(8, vetId)
          case None        => ps.setNull(8, java.sql.Types.INTEGER)
        ps.executeUpdate()
      finally ps.close()
    finally conn.close()

  def updateVaccination(recordId: Int, status: String, nextVaccinationDate: String): Unit =
    val conn = DatabaseManager.getConnection
    try
      val ps = conn.prepareStatement(
        "UPDATE health_records SET vaccination_status=?, next_vaccination_date=? WHERE record_id=?")
      try
        ps.setString(1, status)
        ps.setString(2, nextVaccinationDate)
        ps.setInt(3, recordId)
        ps.executeUpdate()
      finally ps.close()
    finally conn.close()

  def assignVet(recordId: Int, vetId: Int): Unit =
    val conn = DatabaseManager.getConnection
    try
      val ps = conn.prepareStatement("UPDATE health_records SET assigned_vet_id=? WHERE record_id=?")
      try
        ps.setInt(1, vetId)
        ps.setInt(2, recordId)
        ps.executeUpdate()
      finally ps.close()
    finally conn.close()

  def findById(recordId: Int): Option[HealthRecord] =
    val conn = DatabaseManager.getConnection
    try
      val ps = conn.prepareStatement("SELECT * FROM health_records WHERE record_id=?")
      try
        ps.setInt(1, recordId)
        val rs = ps.executeQuery()
        try if rs.next() then Some(mapRow(rs)) else None
        finally rs.close()
      finally ps.close()
    finally conn.close()

  def findByAnimal(animalId: Int): List[HealthRecord] =
    val conn = DatabaseManager.getConnection
    try
      val ps = conn.prepareStatement("SELECT * FROM health_records WHERE animal_id=?")
      try
        ps.setInt(1, animalId)
        val rs = ps.executeQuery()
        try resultsToList(rs)
        finally rs.close()
      finally ps.close()
    finally conn.close()

  def findAll(): List[HealthRecord] =
    val conn = DatabaseManager.getConnection
    try
      val rs = conn.createStatement().executeQuery("SELECT * FROM health_records")
      try resultsToList(rs)
      finally rs.close()
    finally conn.close()

  private def resultsToList(rs: ResultSet): List[HealthRecord] =
    val buf = scala.collection.mutable.ListBuffer.empty[HealthRecord]
    while rs.next() do buf += mapRow(rs)
    buf.toList

  private def mapRow(rs: ResultSet): HealthRecord =
    val vetId = rs.getInt("assigned_vet_id")
    HealthRecord(
      rs.getInt("record_id"),
      rs.getInt("animal_id"),
      rs.getString("medical_condition"),
      rs.getString("vaccination_status"),
      rs.getString("treatment_details"),
      rs.getString("last_checkup_date"),
      rs.getString("next_vaccination_date"),
      if rs.wasNull() then None else Some(vetId)
    )
