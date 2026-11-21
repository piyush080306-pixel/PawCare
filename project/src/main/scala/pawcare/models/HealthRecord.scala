package pawcare.models

/** Immutable medical record for an animal.
  *
  * Dates are stored as yyyy-MM-dd strings for SQLite compatibility.
  * `vaccinationStatus` is one of: "VACCINATED", "PARTIAL", "UNVACCINATED".
  */
final case class HealthRecord(
  recordId: Int,
  animalId: Int,
  medicalCondition: String,
  vaccinationStatus: String,
  treatmentDetails: String,
  lastCheckupDate: String,
  nextVaccinationDate: String,
  assignedVetId: Option[Int]
)
