package pawcare.models

/** Caretaker: assigned to day-to-day care of animals. */
final class Caretaker(
  staffId: Int,
  name: String,
  contactNumber: String,
  age: Int,
  salary: Double,
  val shift: String,
  val assignedArea: String
) extends Staff(staffId, name, contactNumber, age, salary):
  require(shift.nonEmpty, "Caretaker shift cannot be empty.")
  require(assignedArea.nonEmpty, "Caretaker assigned area cannot be empty.")

  override def role: String = "CARETAKER"

  override def describe: String = super.describe + s" | Shift:$shift | Area:$assignedArea"

  override def withUpdated(
    name: String = this.name,
    contactNumber: String = this.contactNumber,
    age: Int = this.age,
    salary: Double = this.salary
  ): Caretaker =
    new Caretaker(staffId, name, contactNumber, age, salary, shift, assignedArea)

  def withCaretakerDetails(shift: String = this.shift, assignedArea: String = this.assignedArea): Caretaker =
    new Caretaker(staffId, name, contactNumber, age, salary, shift, assignedArea)
