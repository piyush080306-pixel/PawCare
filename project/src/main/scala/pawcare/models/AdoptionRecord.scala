package pawcare.models

/** Immutable record describing an adoption application.
  *
  * `adoptionStatus` is one of: "PENDING", "APPROVED", "REJECTED".
  * `adoptionDate` is the date the application was submitted (yyyy-MM-dd).
  */
final case class AdoptionRecord(
  adoptionId: Int,
  animalId: Int,
  adopterName: String,
  adopterAge: Int,
  adopterContact: String,
  adoptionDate: String,
  adoptionStatus: String
)
