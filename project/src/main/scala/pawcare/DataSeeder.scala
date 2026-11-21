package pawcare

import pawcare.database.DatabaseManager
import pawcare.models.*
import pawcare.services.*
import java.time.LocalDate
import java.time.format.DateTimeFormatter

/** Seeds the database with sample animals and staff on first run only.
  * Called when the database is empty; never overwrites existing rows.
  */
object DataSeeder:
  private val dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")

  def seedIfEmpty(animalService: AnimalService, staffService: StaffService,
                  healthService: HealthService): Unit =
    if DatabaseManager.isDatabaseEmpty then
      seedAnimals(animalService)
      seedStaff(staffService)
      seedHealth(healthService, animalService)

  private def seedAnimals(animalService: AnimalService): Unit =
    val today = LocalDate.now().format(dateFormatter)
    animalService.register(new Dog(1, "Bruno", 3, "Male", "Healthy", false, "Labrador", "Large", true))
    animalService.register(new Cat(2, "Kitty", 2, "Female", "Healthy", false, "Persian", "White", true))
    animalService.register(new Dog(3, "Rocky", 5, "Male", "Under Treatment", false, "German Shepherd", "Large", true))
    animalService.register(new Bird(4, "Coco", 1, "Female", "Healthy", false, "Parrot", 0.25, true))
    animalService.register(new Dog(5, "Max", 4, "Male", "Healthy", false, "Golden Retriever", "Medium", false))

  private def seedStaff(staffService: StaffService): Unit =
    staffService.add(new Manager(1, "Rahul", "9876543210", 35, 60000, "Operations"))
    staffService.add(new Veterinarian(2, "Priya", "9123456780", 40, 75000, "Surgery", "VET-2023-001"))
    staffService.add(new Caretaker(3, "Aman", "9001122334", 24, 25000, "Morning", "Kennel A"))
    staffService.add(new Caretaker(4, "Neha", "9005566778", 27, 26000, "Evening", "Kennel B"))

  private def seedHealth(healthService: HealthService, animalService: AnimalService): Unit =
    val today = LocalDate.now()
    healthService.addRecord(1, 1, "Routine checkup", "VACCINATED", "Annual vaccination complete",
      today.minusDays(10).format(dateFormatter), today.plusDays(180).format(dateFormatter), Some(2), animalService)
    healthService.addRecord(2, 3, "Skin infection", "PARTIAL", "Topical ointment prescribed",
      today.minusDays(5).format(dateFormatter), today.plusDays(20).format(dateFormatter), Some(2), animalService)
