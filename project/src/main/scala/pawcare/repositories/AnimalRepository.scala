package pawcare.repositories

import pawcare.database.DatabaseManager
import pawcare.models.*
import java.sql.{Connection, PreparedStatement, ResultSet}

/** Data-access layer for animals.
  *
  * Every method opens and closes its own connection. Concrete subclasses
  * (Dog/Cat/Bird) are reconstructed through the `category` discriminator and
  * a polymorphic row-mapping function.
  */
object AnimalRepository:

  /** Inserts a new animal. Throws if the primary key already exists. */
  def insert(a: Animal): Unit =
    val conn = DatabaseManager.getConnection
    try
      val sql =
        """INSERT INTO animals
    | (animal_id, category, name, age, gender, health_status, is_adopted,
    |  breed, size, is_trained, fur_color, is_indoor, species, wingspan, can_fly)
    | VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""".stripMargin
      val ps = conn.prepareStatement(sql)
      try
        ps.setInt(1, a.animalId)
        ps.setString(2, a.category)
        ps.setString(3, a.name)
        ps.setInt(4, a.age)
        ps.setString(5, a.gender)
        ps.setString(6, a.healthStatus)
        ps.setInt(7, if a.isAdopted then 1 else 0)
        a match
          case d: Dog =>
            ps.setString(8, d.breed); ps.setString(9, d.size); ps.setBoolean(10, d.isTrained)
            ps.setNull(11, java.sql.Types.VARCHAR); ps.setNull(12, java.sql.Types.INTEGER)
            ps.setNull(13, java.sql.Types.VARCHAR); ps.setNull(14, java.sql.Types.REAL); ps.setNull(15, java.sql.Types.INTEGER)
          case c: Cat =>
            ps.setString(8, c.breed); ps.setNull(9, java.sql.Types.VARCHAR); ps.setNull(10, java.sql.Types.INTEGER)
            ps.setString(11, c.furColor); ps.setInt(12, if c.isIndoorFriendly then 1 else 0)
            ps.setNull(13, java.sql.Types.VARCHAR); ps.setNull(14, java.sql.Types.REAL); ps.setNull(15, java.sql.Types.INTEGER)
          case b: Bird =>
            ps.setNull(8, java.sql.Types.VARCHAR); ps.setNull(9, java.sql.Types.VARCHAR); ps.setNull(10, java.sql.Types.INTEGER)
            ps.setNull(11, java.sql.Types.VARCHAR); ps.setNull(12, java.sql.Types.INTEGER)
            ps.setString(13, b.species); ps.setDouble(14, b.wingspan); ps.setInt(15, if b.canFly then 1 else 0)
          case other => throw new IllegalArgumentException(s"Unknown animal category: ${other.category}")
        ps.executeUpdate()
      finally ps.close()
    finally conn.close()

  /** Updates the mutable fields of an animal (name, age, gender, health, adopted). */
  def update(a: Animal): Unit =
    val conn = DatabaseManager.getConnection
    try
      val sql =
        """UPDATE animals SET name=?, age=?, gender=?, health_status=?, is_adopted=?
    | WHERE animal_id=?""".stripMargin
      val ps = conn.prepareStatement(sql)
      try
        ps.setString(1, a.name)
        ps.setInt(2, a.age)
        ps.setString(3, a.gender)
        ps.setString(4, a.healthStatus)
        ps.setInt(5, if a.isAdopted then 1 else 0)
        ps.setInt(6, a.animalId)
        ps.executeUpdate()
      finally ps.close()
    finally conn.close()

  /** Updates only the adoption flag for an animal. Used by adoption approval. */
  def updateAdoptedFlag(animalId: Int, isAdopted: Boolean): Unit =
    val conn = DatabaseManager.getConnection
    try
      val ps = conn.prepareStatement("UPDATE animals SET is_adopted=? WHERE animal_id=?")
      try
        ps.setInt(1, if isAdopted then 1 else 0)
        ps.setInt(2, animalId)
        ps.executeUpdate()
      finally ps.close()
    finally conn.close()

  def delete(animalId: Int): Unit =
    val conn = DatabaseManager.getConnection
    try
      val ps = conn.prepareStatement("DELETE FROM animals WHERE animal_id=?")
      try
        ps.setInt(1, animalId)
        ps.executeUpdate()
      finally ps.close()
    finally conn.close()

  def findById(animalId: Int): Option[Animal] =
    val conn = DatabaseManager.getConnection
    try
      val ps = conn.prepareStatement("SELECT * FROM animals WHERE animal_id=?")
      try
        ps.setInt(1, animalId)
        val rs = ps.executeQuery()
        try if rs.next() then Some(mapRow(rs)) else None
        finally rs.close()
      finally ps.close()
    finally conn.close()

  def findByName(name: String): List[Animal] =
    val conn = DatabaseManager.getConnection
    try
      val ps = conn.prepareStatement("SELECT * FROM animals WHERE name LIKE ?")
      try
        ps.setString(1, s"%$name%")
        val rs = ps.executeQuery()
        try resultsToList(rs)
        finally rs.close()
      finally ps.close()
    finally conn.close()

  def findAll(): List[Animal] =
    val conn = DatabaseManager.getConnection
    try
      val rs = conn.createStatement().executeQuery("SELECT * FROM animals")
      try resultsToList(rs)
      finally rs.close()
    finally conn.close()

  def existsById(animalId: Int): Boolean =
    val conn = DatabaseManager.getConnection
    try
      val ps = conn.prepareStatement("SELECT 1 FROM animals WHERE animal_id=?")
      try
        ps.setInt(1, animalId)
        val rs = ps.executeQuery()
        try rs.next()
        finally rs.close()
      finally ps.close()
    finally conn.close()

  // --- row mapping ---------------------------------------------------------

  private def resultsToList(rs: ResultSet): List[Animal] =
    val buf = scala.collection.mutable.ListBuffer.empty[Animal]
    while rs.next() do buf += mapRow(rs)
    buf.toList

  private def mapRow(rs: ResultSet): Animal =
    val category = rs.getString("category")
    val id = rs.getInt("animal_id")
    val name = rs.getString("name")
    val age = rs.getInt("age")
    val gender = rs.getString("gender")
    val health = rs.getString("health_status")
    val adopted = rs.getInt("is_adopted") == 1
    category match
      case "DOG" =>
        new Dog(id, name, age, gender, health, adopted,
          rs.getString("breed"), rs.getString("size"), rs.getBoolean("is_trained"))
      case "CAT" =>
        new Cat(id, name, age, gender, health, adopted,
          rs.getString("breed"), rs.getString("fur_color"), rs.getInt("is_indoor") == 1)
      case "BIRD" =>
        new Bird(id, name, age, gender, health, adopted,
          rs.getString("species"), rs.getDouble("wingspan"), rs.getInt("can_fly") == 1)
      case other => throw new IllegalArgumentException(s"Unknown animal category in DB: $other")
