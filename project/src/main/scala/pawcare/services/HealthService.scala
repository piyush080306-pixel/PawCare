package pawcare.services

import pawcare.exceptions.*
import pawcare.models.HealthRecord
import pawcare.repositories.{HealthRepository, StaffRepository}
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

/** Business logic for animal health management. */
class HealthService:
  private val dateFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")

  /** Adds a medical record. Validates that the animal exists and that an
    * assigned vet (if provided) is actually a veterinarian. */
  def addRecord(
    recordId: Int,
    animalId: Int,
    medicalCondition: String,
    vaccinationStatus: String,
    treatmentDetails: String,
    lastCheckupDate: String,
    nextVaccinationDate: String,
    assignedVetId: Option[Int],
    animalService: AnimalService
  ): HealthRecord =
    if HealthRepository.findById(recordId).isDefined then
      throw InvalidAdoptionStatusException(s"Health record with ID $recordId already exists.")
    animalService.requireById(animalId) // throws AnimalNotFoundException if missing
    if medicalCondition.trim.isEmpty then throw InvalidAdopterException("Medical condition cannot be empty.")
    if treatmentDetails.trim.isEmpty then throw InvalidAdopterException("Treatment details cannot be empty.")
    val normalisedStatus = vaccinationStatus.toUpperCase.trim
    if !Set("VACCINATED", "PARTIAL", "UNVACCINATED").contains(normalisedStatus) then
      throw InvalidAdopterException(s"Vaccination status must be VACCINATED, PARTIAL or UNVACCINATED (got '$vaccinationStatus').")
    assignedVetId.foreach { vid =>
      val vet = StaffRepository.findById(vid)
        .getOrElse(throw StaffNotFoundException(vid))
      if vet.role != "VETERINARIAN" then
        throw InvalidAdopterException(s"Staff $vid is not a veterinarian and cannot be assigned to a health record.")
    }
    val record = HealthRecord(recordId, animalId, medicalCondition.trim, normalisedStatus,
      treatmentDetails.trim, lastCheckupDate, nextVaccinationDate, assignedVetId)
    HealthRepository.insert(record)
    record

  /** Returns the full medical history for an animal. */
  def historyFor(animalId: Int): List[HealthRecord] =
    HealthRepository.findByAnimal(animalId)

  /** Returns all health records. */
  def all: List[HealthRecord] = HealthRepository.findAll()

  /** Updates vaccination status and next-vaccination date. */
  def updateVaccination(recordId: Int, status: String, nextVaccinationDate: String): HealthRecord =
    val record = HealthRepository.findById(recordId)
      .getOrElse(throw AdoptionNotFoundException(recordId))
    val normalised = status.toUpperCase.trim
    if !Set("VACCINATED", "PARTIAL", "UNVACCINATED").contains(normalised) then
      throw InvalidAdopterException(s"Vaccination status must be VACCINATED, PARTIAL or UNVACCINATED (got '$status').")
    HealthRepository.updateVaccination(recordId, normalised, nextVaccinationDate)
    record.copy(vaccinationStatus = normalised, nextVaccinationDate = nextVaccinationDate)

  /** Assigns a veterinarian to an existing health record. */
  def assignVet(recordId: Int, vetId: Int): HealthRecord =
    val record = HealthRepository.findById(recordId)
      .getOrElse(throw AdoptionNotFoundException(recordId))
    val vet = StaffRepository.findById(vetId)
      .getOrElse(throw StaffNotFoundException(vetId))
    if vet.role != "VETERINARIAN" then
      throw InvalidAdopterException(s"Staff $vetId is not a veterinarian.")
    HealthRepository.assignVet(recordId, vetId)
    record.copy(assignedVetId = Some(vetId))

  /** Records whose next vaccination falls within the next N days (inclusive
    * of today). Uses functional filter + date arithmetic. */
  def upcomingVaccinations(withinDays: Int): List[HealthRecord] =
    val today = LocalDate.now()
    all.filter { r =>
      scala.util.Try(LocalDate.parse(r.nextVaccinationDate, dateFormatter)).toOption.exists { d =>
        !d.isBefore(today) && !d.isAfter(today.plusDays(withinDays.toLong))
      }
    }.sortBy(_.nextVaccinationDate)

  def count: Int = all.size
