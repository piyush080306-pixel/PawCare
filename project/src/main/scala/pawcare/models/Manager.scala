package pawcare.models

/** Shelter manager: approves adoptions and oversees operations. */
final class Manager(
  staffId: Int,
  name: String,
  contactNumber: String,
  age: Int,
  salary: Double,
  val department: String
) extends Staff(staffId, name, contactNumber, age, salary):
  require(department.nonEmpty, "Manager department cannot be empty.")

  override def role: String = "MANAGER"

  override def describe: String = super.describe + s" | Department:$department"

  override def withUpdated(
    name: String = this.name,
    contactNumber: String = this.contactNumber,
    age: Int = this.age,
    salary: Double = this.salary
  ): Manager =
    new Manager(staffId, name, contactNumber, age, salary, department)

  def withDepartment(department: String): Manager =
    new Manager(staffId, name, contactNumber, age, salary, department)
