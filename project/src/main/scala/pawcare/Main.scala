package pawcare

import pawcare.database.DatabaseManager
import pawcare.services.*
import pawcare.ui.ConsoleMenu

/** Application entry point.
  *
  * Wires the service and repository layers together, seeds sample data on
  * first run, and launches the console UI.
  */
object Main:
  def main(args: Array[String]): Unit =
    // Force schema initialisation.
    DatabaseManager.getConnection.close()

    val animalService = AnimalService()
    val staffService = StaffService()
    val adoptionService = AdoptionService()
    val healthService = HealthService()
    val reportService = ReportService(animalService, staffService, adoptionService, healthService)

    DataSeeder.seedIfEmpty(animalService, staffService, healthService)

    val menu = ConsoleMenu(animalService, staffService, adoptionService, healthService, reportService)
    menu.run()
