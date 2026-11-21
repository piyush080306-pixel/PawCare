package pawcare.ui

import pawcare.exceptions.*
import pawcare.services.*

/** Console UI for the Animal Health Management module. */
class HealthMenu(healthService: HealthService, animalService: AnimalService):

  def show(): Unit =
    var back = false
    while !back do
      println(ConsoleUI.line)
      println("            ANIMAL HEALTH MANAGEMENT")
      println(ConsoleUI.line)
      println("1. Add Medical Record")
      println("2. View Medical History")
      println("3. Update Vaccination Status")
      println("4. Upcoming Vaccination Reminders")
      println("5. Back to Main Menu")
      println(ConsoleUI.line)
      ConsoleInput.readMenuChoice(5) match
        case 1 => addRecord()
        case 2 => viewHistory()
        case 3 => updateVaccination()
        case 4 => reminders()
        case 5 => back = true

  private def addRecord(): Unit =
    try
      val id = ConsoleInput.readInt("Record ID: ")
      val animalId = ConsoleInput.readInt("Animal ID: ")
      val condition = ConsoleInput.readLine("Medical condition: ")
      val vacc = ConsoleInput.readLine("Vaccination status (VACCINATED/PARTIAL/UNVACCINATED): ")
      val treatment = ConsoleInput.readLine("Treatment details: ")
      val lastCheckup = ConsoleInput.readLine("Last checkup date (yyyy-MM-dd): ")
      val nextVacc = ConsoleInput.readLine("Next vaccination date (yyyy-MM-dd): ")
      val vetId = ConsoleInput.readIntOptional("Assigned vet staff ID (blank for none): ")
      val record = healthService.addRecord(id, animalId, condition, vacc, treatment,
        lastCheckup, nextVacc, vetId, animalService)
      println(s"Medical record ${record.recordId} added for animal ${record.animalId}.")
    catch
      case e: ShelterException => println(s"Error: ${e.getMessage}")
      case e: Exception => println(s"Unexpected error: ${e.getMessage}")

  private def viewHistory(): Unit =
    val animalId = ConsoleInput.readInt("Animal ID: ")
    val records = healthService.historyFor(animalId)
    if records.isEmpty then println(s"No medical records for animal $animalId.")
    else records.foreach(r =>
      println(s"Record #${r.recordId} | Animal:${r.animalId} | Condition:${r.medicalCondition} | " +
        s"Vaccination:${r.vaccinationStatus} | Treatment:${r.treatmentDetails} | " +
        s"LastCheckup:${r.lastCheckupDate} | NextVacc:${r.nextVaccinationDate} | Vet:${r.assignedVetId.getOrElse("none")}"))

  private def updateVaccination(): Unit =
    try
      val id = ConsoleInput.readInt("Record ID to update: ")
      val status = ConsoleInput.readLine("New vaccination status (VACCINATED/PARTIAL/UNVACCINATED): ")
      val nextVacc = ConsoleInput.readLine("Next vaccination date (yyyy-MM-dd): ")
      val updated = healthService.updateVaccination(id, status, nextVacc)
      println(s"Record ${updated.recordId} updated. Status: ${updated.vaccinationStatus}, next: ${updated.nextVaccinationDate}.")
    catch
      case e: ShelterException => println(s"Error: ${e.getMessage}")
      case e: Exception => println(s"Unexpected error: ${e.getMessage}")

  private def reminders(): Unit =
    val within = ConsoleInput.readInt("Show vaccinations due within how many days? ")
    val list = healthService.upcomingVaccinations(within)
    if list.isEmpty then println(s"No vaccinations due within $within days.")
    else
      println(s"Upcoming vaccinations (next $within days):")
      list.foreach(r =>
        println(s"Record #${r.recordId} | Animal:${r.animalId} | Next vacc: ${r.nextVaccinationDate}"))
