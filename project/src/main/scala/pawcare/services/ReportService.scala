package pawcare.services

import pawcare.models.Animal

/** Aggregates live statistics from the other services for the dashboard and
  * reports module. Every figure is computed from stored records, never
  * hardcoded.
  */
class ReportService(
  animalService: AnimalService,
  staffService: StaffService,
  adoptionService: AdoptionService,
  healthService: HealthService
):

  /** A flat snapshot of all dashboard numbers, returned as a Map so the UI can
    * render it without coupling to field names. */
  def snapshot: Map[String, Int] =
    val animals = animalService.all
    val adopted = animals.count(_.isAdopted)
    val available = animals.size - adopted
    val counts = animalService.countByCategory
    Map(
      "totalAnimals"      -> animals.size,
      "availableAnimals"  -> available,
      "adoptedAnimals"    -> adopted,
      "totalDogs"         -> counts.getOrElse("DOG", 0),
      "totalCats"         -> counts.getOrElse("CAT", 0),
      "totalBirds"        -> counts.getOrElse("BIRD", 0),
      "totalStaff"        -> staffService.count,
      "pendingApplications"  -> adoptionService.all.count(_.adoptionStatus == "PENDING"),
      "approvedApplications" -> adoptionService.all.count(_.adoptionStatus == "APPROVED"),
      "rejectedApplications" -> adoptionService.all.count(_.adoptionStatus == "REJECTED"),
      "totalMedicalRecords"  -> healthService.count
    )

  /** Adoption rate = adopted / total * 100. */
  def adoptionRate: Double =
    val total = animalService.count
    if total == 0 then 0.0 else animalService.adoptedCount.toDouble / total * 100.0

  /** Distribution of animals by category (DOG/CAT/BIRD). */
  def categoryDistribution: Map[String, Int] = animalService.countByCategory

  /** Approved adoptions grouped by yyyy-MM month. */
  def monthlyAdoptionStats: Map[String, Int] = adoptionService.monthlyAdoptions

  /** Success rate across all applications. */
  def adoptionSuccessRate: Double = adoptionService.successRate

  /** Available vs adopted counts. */
  def availableVsAdopted: (Int, Int) =
    (animalService.available.size, animalService.adopted.size)

  /** Staff distribution by role. */
  def staffDistribution: Map[String, Int] = staffService.countByRole

  /** Upcoming vaccinations within the given window. */
  def upcomingVaccinations(withinDays: Int) = healthService.upcomingVaccinations(withinDays)
