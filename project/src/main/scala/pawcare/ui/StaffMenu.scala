package pawcare.ui

import pawcare.exceptions.*
import pawcare.models.*
import pawcare.services.*

/** Console UI for the Staff Management module. */
class StaffMenu(staffService: StaffService, animalService: AnimalService):

  def show(): Unit =
    var back = false
    while !back do
      println(ConsoleUI.line)
      println("                STAFF MANAGEMENT")
      println(ConsoleUI.line)
      println("1. Add Staff")
      println("2. View All Staff")
      println("3. Search Staff")
      println("4. Update Staff")
      println("5. Remove Staff")
      println("6. Assign Caretaker")
      println("7. Back to Main Menu")
      println(ConsoleUI.line)
      ConsoleInput.readMenuChoice(7) match
        case 1 => add()
        case 2 => viewAll()
        case 3 => search()
        case 4 => update()
        case 5 => remove()
        case 6 => assignCaretaker()
        case 7 => back = true

  private def add(): Unit =
    try
      val id = ConsoleInput.readInt("Staff ID: ")
      val name = ConsoleInput.readLine("Name: ")
      val contact = ConsoleInput.readLine("Contact number: ")
      val age = ConsoleInput.readInt("Age: ")
      val salary = ConsoleInput.readDouble("Salary: ")
      println("Role: 1) Manager  2) Veterinarian  3) Caretaker")
      val roleChoice = ConsoleInput.readMenuChoice(3)
      val staff: Staff = roleChoice match
        case 1 =>
          val dept = ConsoleInput.readLine("Department: ")
          new Manager(id, name, contact, age, salary, dept)
        case 2 =>
          val spec = ConsoleInput.readLine("Specialization: ")
          val lic = ConsoleInput.readLine("License number: ")
          new Veterinarian(id, name, contact, age, salary, spec, lic)
        case 3 =>
          val shift = ConsoleInput.readLine("Shift (Morning/Evening): ")
          val area = ConsoleInput.readLine("Assigned area: ")
          new Caretaker(id, name, contact, age, salary, shift, area)
      staffService.add(staff)
      println(s"Successfully added ${staff.role} '${staff.name}' with ID ${staff.staffId}.")
    catch
      case e: ShelterException => println(s"Error: ${e.getMessage}")
      case e: IllegalArgumentException => println(s"Invalid input: ${e.getMessage}")
      case e: Exception => println(s"Unexpected error: ${e.getMessage}")

  private def viewAll(): Unit =
    val list = staffService.all
    if list.isEmpty then println("No staff registered yet.")
    else list.foreach(s => println(s.describe))

  private def search(): Unit =
    val id = ConsoleInput.readInt("Staff ID: ")
    staffService.findById(id) match
      case Some(s) => println(s.describe)
      case None    => println(s"No staff found with ID $id.")

  private def update(): Unit =
    try
      val id = ConsoleInput.readInt("Staff ID to update: ")
      val current = staffService.requireById(id)
      println(s"Current: ${current.describe}")
      val name = ConsoleInput.readLine(s"Name [${current.name}]: ")
      val contact = ConsoleInput.readLine(s"Contact [${current.contactNumber}]: ")
      val age = ConsoleInput.readInt(s"Age [${current.age}]: ")
      val salary = ConsoleInput.readDouble(s"Salary [${current.salary}]: ")
      staffService.update(id, name, contact, age, salary)
      println(s"Staff $id updated successfully.")
    catch
      case e: ShelterException => println(s"Error: ${e.getMessage}")
      case e: Exception => println(s"Unexpected error: ${e.getMessage}")

  private def remove(): Unit =
    try
      val id = ConsoleInput.readInt("Staff ID to remove: ")
      if ConsoleInput.readYesNo(s"Remove staff $id?") then
        staffService.remove(id)
        println(s"Staff $id removed.")
    catch
      case e: ShelterException => println(s"Error: ${e.getMessage}")
      case e: Exception => println(s"Unexpected error: ${e.getMessage}")

  private def assignCaretaker(): Unit =
    try
      val caretakerId = ConsoleInput.readInt("Caretaker staff ID: ")
      val animalId = ConsoleInput.readInt("Animal ID to assign: ")
      staffService.assignCaretaker(caretakerId, animalId, animalService)
      println(s"Caretaker $caretakerId assigned to animal $animalId.")
    catch
      case e: ShelterException => println(s"Error: ${e.getMessage}")
      case e: Exception => println(s"Unexpected error: ${e.getMessage}")
