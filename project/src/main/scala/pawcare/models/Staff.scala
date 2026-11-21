package pawcare.models

/** Abstract base class for all shelter staff members. */
abstract class Staff(
  val staffId: Int,
  val name: String,
  val contactNumber: String,
  val age: Int,
  val salary: Double
):
  require(name.nonEmpty, "Staff name cannot be empty.")
  require(age >= 18, s"Staff age must be at least 18 (got $age).")
  require(contactNumber.nonEmpty, "Staff contact number cannot be empty.")
  require(salary >= 0, s"Staff salary cannot be negative (got $salary).")

  /** Discriminator persisted to the database: "MANAGER", "VETERINARIAN", "CARETAKER". */
  def role: String

  def describe: String =
    s"[$role] ID:$staffId | $name | Age:$age | Contact:$contactNumber | Salary:$salary"

  def withUpdated(
    name: String = this.name,
    contactNumber: String = this.contactNumber,
    age: Int = this.age,
    salary: Double = this.salary
  ): Staff
