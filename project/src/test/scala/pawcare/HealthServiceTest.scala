package pawcare

import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers
import pawcare.exceptions.*
import pawcare.models.*
import pawcare.services.{AnimalService, HealthService, StaffService}
import java.time.LocalDate
import java.time.format.DateTimeFormatter

class HealthServiceTest extends AnyFlatSpec with Matchers with TestBase:

  private val df = DateTimeFormatter.ofPattern("yyyy-MM-dd")
  private def animalService = AnimalService()
  private def healthService = HealthService()
  private def staffService = StaffService()

  private def withAnimalAndVet(): Unit =
    animalService.register(Dog(1, "Bruno", 3, "Male", "Healthy", false, "Labrador", "Large", true))
    staffService.add(Veterinarian(2, "Priya", "9123456780", 40, 75000, "Surgery", "VET-2023-001"))

  "HealthService" should "add a medical record" in:
    val a = animalService; val h = healthService
    a.register(Dog(1, "Bruno", 3, "Male", "Healthy", false, "Labrador", "Large", true))
    val today = LocalDate.now().format(df)
    val rec = h.addRecord(1, 1, "Routine checkup", "VACCINATED", "Annual vaccine",
      today, today, None, a)
    rec.recordId shouldBe 1
    rec.medicalCondition shouldBe "Routine checkup"

  it should "retrieve medical history for an animal" in:
    val a = animalService; val h = healthService
    a.register(Dog(1, "Bruno", 3, "Male", "Healthy", false, "Labrador", "Large", true))
    val today = LocalDate.now().format(df)
    h.addRecord(1, 1, "Routine checkup", "VACCINATED", "Annual vaccine", today, today, None, a)
    h.addRecord(2, 1, "Skin infection", "PARTIAL", "Ointment", today, today, None, a)
    h.historyFor(1).map(_.recordId) shouldBe List(1, 2)

  it should "update vaccination status" in:
    val a = animalService; val h = healthService
    a.register(Dog(1, "Bruno", 3, "Male", "Healthy", false, "Labrador", "Large", true))
    val today = LocalDate.now().format(df)
    h.addRecord(1, 1, "Routine checkup", "UNVACCINATED", "Pending vaccine", today, today, None, a)
    val updated = h.updateVaccination(1, "VACCINATED", today)
    updated.vaccinationStatus shouldBe "VACCINATED"

  it should "assign a veterinarian to a health record" in:
    val a = animalService; val h = healthService; val s = staffService
    a.register(Dog(1, "Bruno", 3, "Male", "Healthy", false, "Labrador", "Large", true))
    s.add(Veterinarian(2, "Priya", "9123456780", 40, 75000, "Surgery", "VET-2023-001"))
    val today = LocalDate.now().format(df)
    h.addRecord(1, 1, "Checkup", "VACCINATED", "None", today, today, None, a)
    val assigned = h.assignVet(1, 2)
    assigned.assignedVetId shouldBe Some(2)

  it should "reject assigning a non-veterinarian to a health record" in:
    val a = animalService; val h = healthService; val s = staffService
    a.register(Dog(1, "Bruno", 3, "Male", "Healthy", false, "Labrador", "Large", true))
    s.add(Manager(1, "Rahul", "9876543210", 35, 60000, "Operations"))
    val today = LocalDate.now().format(df)
    h.addRecord(1, 1, "Checkup", "VACCINATED", "None", today, today, None, a)
    assertThrows[InvalidAdopterException] {
      h.assignVet(1, 1)
    }

  it should "show upcoming vaccination reminders" in:
    val a = animalService; val h = healthService
    a.register(Dog(1, "Bruno", 3, "Male", "Healthy", false, "Labrador", "Large", true))
    val today = LocalDate.now()
    h.addRecord(1, 1, "Checkup", "PARTIAL", "Booster due",
      today.minusDays(10).format(df), today.plusDays(5).format(df), None, a)
    h.upcomingVaccinations(30).map(_.recordId) shouldBe List(1)

  it should "throw AnimalNotFoundException when adding a record for a missing animal" in:
    val a = animalService; val h = healthService
    val today = LocalDate.now().format(df)
    assertThrows[AnimalNotFoundException] {
      h.addRecord(1, 999, "Checkup", "VACCINATED", "None", today, today, None, a)
    }
