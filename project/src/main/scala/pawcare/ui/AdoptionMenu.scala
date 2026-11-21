package pawcare.ui

import pawcare.exceptions.*
import pawcare.models.AdoptionRecord
import pawcare.services.*

/** Console UI for the Adoption Management module. */
class AdoptionMenu(adoptionService: AdoptionService, staffService: StaffService):

  def show(): Unit =
    var back = false
    while !back do
      println(ConsoleUI.line)
      println("              ADOPTION MANAGEMENT")
      println(ConsoleUI.line)
      println("1. Submit Adoption Application")
      println("2. View Applications")
      println("3. Approve Application")
      println("4. Reject Application")
      println("5. View Adoption History")
      println("6. Search Adoption Record")
      println("7. Back to Main Menu")
      println(ConsoleUI.line)
      ConsoleInput.readMenuChoice(7) match
        case 1 => submit()
        case 2 => viewApplications()
        case 3 => approve()
        case 4 => reject()
        case 5 => viewHistory()
        case 6 => search()
        case 7 => back = true

  private def submit(): Unit =
    try
      val adoptionId = ConsoleInput.readInt("Adoption ID: ")
      val animalId = ConsoleInput.readInt("Animal ID to adopt: ")
      val name = ConsoleInput.readLine("Adopter name: ")
      val age = ConsoleInput.readInt("Adopter age: ")
      val contact = ConsoleInput.readLine("Adopter contact: ")
      val record = adoptionService.submitApplication(adoptionId, animalId, name, age, contact)
      println(s"Application ${record.adoptionId} submitted for animal ${record.animalId}. Status: PENDING.")
    catch
      case e: AnimalNotFoundException       => println(s"Error: ${e.getMessage}")
      case e: AnimalAlreadyAdoptedException => println(s"Error: ${e.getMessage}")
      case e: InvalidAdopterException       => println(s"Error: ${e.getMessage}")
      case e: InvalidAdoptionStatusException=> println(s"Error: ${e.getMessage}")
      case e: Exception                     => println(s"Unexpected error: ${e.getMessage}")

  private def viewApplications(): Unit =
    val pending = adoptionService.pending
    if pending.isEmpty then println("No pending applications.")
    else pending.foreach(printRecord)

  private def approve(): Unit =
    try
      val id = ConsoleInput.readInt("Adoption ID to approve: ")
      val approverId = ConsoleInput.readInt("Approving manager staff ID: ")
      val approver = staffService.requireById(approverId)
      if approver.role != "MANAGER" then
        println(s"Only managers can approve applications. Staff $approverId is a ${approver.role}.")
        return
      val approved = adoptionService.approve(id, staffService)
      println(s"Application ${approved.adoptionId} APPROVED. Animal ${approved.animalId} is now adopted.")
    catch
      case e: ShelterException => println(s"Error: ${e.getMessage}")
      case e: Exception => println(s"Unexpected error: ${e.getMessage}")

  private def reject(): Unit =
    try
      val id = ConsoleInput.readInt("Adoption ID to reject: ")
      val rejected = adoptionService.reject(id)
      println(s"Application ${rejected.adoptionId} REJECTED. Animal status unchanged.")
    catch
      case e: ShelterException => println(s"Error: ${e.getMessage}")
      case e: Exception => println(s"Unexpected error: ${e.getMessage}")

  private def viewHistory(): Unit =
    val history = adoptionService.history
    if history.isEmpty then println("No approved adoptions yet.")
    else history.foreach(printRecord)

  private def search(): Unit =
    val name = ConsoleInput.readLine("Adopter name (or fragment): ")
    val results = adoptionService.searchByAdopter(name)
    if results.isEmpty then println(s"No records found for '$name'.")
    else results.foreach(printRecord)

  private def printRecord(r: AdoptionRecord): Unit =
    println(s"Adoption #${r.adoptionId} | Animal:${r.animalId} | ${r.adopterName} | Age:${r.adopterAge} | " +
      s"Contact:${r.adopterContact} | Date:${r.adoptionDate} | Status:${r.adoptionStatus}")
