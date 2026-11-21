package pawcare.models

/** Veterinarian: assigned to animal health records. */
final class Veterinarian(
  staffId: Int,
  name: String,
  contactNumber: String,
  age: Int,
  salary: Double,
  val specialization: String,
  val licenseNumber: String
) extends Staff(staffId, name, contactNumber, age, salary):
  require(specialization.nonEmpty, "Veterinarian specialization cannot be empty.")
  require(licenseNumber.nonEmpty, "Veterinarian license number cannot be empty.")

  override def role: String = "VETERINARIAN"

  override def describe: String = super.describe + s" | Specialization:$specialization | License:$licenseNumber"

  override def withUpdated(
    name: String = this.name,
    contactNumber: String = this.contactNumber,
    age: Int = this.age,
    salary: Double = this.salary
  ): Veterinarian =
    new Veterinarian(staffId, name, contactNumber, age, salary, specialization, licenseNumber)

  def withVetDetails(specialization: String = this.specialization, licenseNumber: String = this.licenseNumber): Veterinarian =
    new Veterinarian(staffId, name, contactNumber, age, salary, specialization, licenseNumber)
