package pawcare.repositories

import pawcare.database.DatabaseManager
import pawcare.models.*
import java.sql.{Connection, PreparedStatement, ResultSet}

/** Data-access layer for staff members. */
object StaffRepository:

  def insert(s: Staff): Unit =
    val conn = DatabaseManager.getConnection
    try
      val sql =
        """INSERT INTO staff
    | (staff_id, role, name, contact_number, age, salary,
    |  department, specialization, license_number, shift, assigned_area)
    | VALUES (?,?,?,?,?,?,?,?,?,?,?)""".stripMargin
      val ps = conn.prepareStatement(sql)
      try
        ps.setInt(1, s.staffId)
        ps.setString(2, s.role)
        ps.setString(3, s.name)
        ps.setString(4, s.contactNumber)
        ps.setInt(5, s.age)
        ps.setDouble(6, s.salary)
        s match
          case m: Manager =>
            ps.setString(7, m.department)
            ps.setNull(8, java.sql.Types.VARCHAR); ps.setNull(9, java.sql.Types.VARCHAR)
            ps.setNull(10, java.sql.Types.VARCHAR); ps.setNull(11, java.sql.Types.VARCHAR)
          case v: Veterinarian =>
            ps.setNull(7, java.sql.Types.VARCHAR)
            ps.setString(8, v.specialization); ps.setString(9, v.licenseNumber)
            ps.setNull(10, java.sql.Types.VARCHAR); ps.setNull(11, java.sql.Types.VARCHAR)
          case c: Caretaker =>
            ps.setNull(7, java.sql.Types.VARCHAR); ps.setNull(8, java.sql.Types.VARCHAR); ps.setNull(9, java.sql.Types.VARCHAR)
            ps.setString(10, c.shift); ps.setString(11, c.assignedArea)
          case other => throw new IllegalArgumentException(s"Unknown staff role: ${other.role}")
        ps.executeUpdate()
      finally ps.close()
    finally conn.close()

  def update(s: Staff): Unit =
    val conn = DatabaseManager.getConnection
    try
      val sql = "UPDATE staff SET name=?, contact_number=?, age=?, salary=? WHERE staff_id=?"
      val ps = conn.prepareStatement(sql)
      try
        ps.setString(1, s.name)
        ps.setString(2, s.contactNumber)
        ps.setInt(3, s.age)
        ps.setDouble(4, s.salary)
        ps.setInt(5, s.staffId)
        ps.executeUpdate()
      finally ps.close()
    finally conn.close()

  def delete(staffId: Int): Unit =
    val conn = DatabaseManager.getConnection
    try
      val ps = conn.prepareStatement("DELETE FROM staff WHERE staff_id=?")
      try
        ps.setInt(1, staffId)
        ps.executeUpdate()
      finally ps.close()
    finally conn.close()

  def findById(staffId: Int): Option[Staff] =
    val conn = DatabaseManager.getConnection
    try
      val ps = conn.prepareStatement("SELECT * FROM staff WHERE staff_id=?")
      try
        ps.setInt(1, staffId)
        val rs = ps.executeQuery()
        try if rs.next() then Some(mapRow(rs)) else None
        finally rs.close()
      finally ps.close()
    finally conn.close()

  def findAll(): List[Staff] =
    val conn = DatabaseManager.getConnection
    try
      val rs = conn.createStatement().executeQuery("SELECT * FROM staff")
      try resultsToList(rs)
      finally rs.close()
    finally conn.close()

  def findByRole(role: String): List[Staff] =
    val conn = DatabaseManager.getConnection
    try
      val ps = conn.prepareStatement("SELECT * FROM staff WHERE role=?")
      try
        ps.setString(1, role.toUpperCase)
        val rs = ps.executeQuery()
        try resultsToList(rs)
        finally rs.close()
      finally ps.close()
    finally conn.close()

  def existsById(staffId: Int): Boolean =
    findById(staffId).isDefined

  // --- caretaker assignments ----------------------------------------------

  def assignCaretaker(caretakerId: Int, animalId: Int): Unit =
    val conn = DatabaseManager.getConnection
    try
      val ps = conn.prepareStatement(
        "INSERT INTO caretaker_assignments (caretaker_id, animal_id) VALUES (?,?)")
      try
        ps.setInt(1, caretakerId)
        ps.setInt(2, animalId)
        ps.executeUpdate()
      finally ps.close()
    finally conn.close()

  def caretakerAssignments(caretakerId: Int): List[Int] =
    val conn = DatabaseManager.getConnection
    try
      val ps = conn.prepareStatement(
        "SELECT animal_id FROM caretaker_assignments WHERE caretaker_id=?")
      try
        ps.setInt(1, caretakerId)
        val rs = ps.executeQuery()
        try
          val buf = scala.collection.mutable.ListBuffer.empty[Int]
          while rs.next() do buf += rs.getInt("animal_id")
          buf.toList
        finally rs.close()
      finally ps.close()
    finally conn.close()

  // --- row mapping ---------------------------------------------------------

  private def resultsToList(rs: ResultSet): List[Staff] =
    val buf = scala.collection.mutable.ListBuffer.empty[Staff]
    while rs.next() do buf += mapRow(rs)
    buf.toList

  private def mapRow(rs: ResultSet): Staff =
    val role = rs.getString("role")
    val id = rs.getInt("staff_id")
    val name = rs.getString("name")
    val contact = rs.getString("contact_number")
    val age = rs.getInt("age")
    val salary = rs.getDouble("salary")
    role match
      case "MANAGER" =>
        new Manager(id, name, contact, age, salary, rs.getString("department"))
      case "VETERINARIAN" =>
        new Veterinarian(id, name, contact, age, salary,
          rs.getString("specialization"), rs.getString("license_number"))
      case "CARETAKER" =>
        new Caretaker(id, name, contact, age, salary,
          rs.getString("shift"), rs.getString("assigned_area"))
      case other => throw new IllegalArgumentException(s"Unknown staff role in DB: $other")
