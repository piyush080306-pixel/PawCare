package pawcare.ui

import pawcare.exceptions.*
import pawcare.models.*
import pawcare.services.*

/** Console UI for the Animal Management module. */
class AnimalMenu(animalService: AnimalService, staffService: StaffService):

  def show(): Unit =
    var back = false
    while !back do
      println(ConsoleUI.line)
      println("               ANIMAL MANAGEMENT")
      println(ConsoleUI.line)
      println("1. Register New Animal")
      println("2. View All Animals")
      println("3. Search Animal")
      println("4. Update Animal")
      println("5. Delete Animal")
      println("6. View Available Animals")
      println("7. View Adopted Animals")
      println("8. Back to Main Menu")
      println(ConsoleUI.line)
      ConsoleInput.readMenuChoice(8) match
        case 1 => register()
        case 2 => viewAll()
        case 3 => search()
        case 4 => update()
        case 5 => delete()
        case 6 => viewAvailable()
        case 7 => viewAdopted()
        case 8 => back = true

  private def register(): Unit =
    try
      val id = ConsoleInput.readInt("Animal ID: ")
      val name = ConsoleInput.readLine("Name: ")
      val age = ConsoleInput.readInt("Age: ")
      val gender = ConsoleInput.readLine("Gender: ")
      val health = ConsoleInput.readLine("Health status: ")
      println("Category: 1) Dog  2) Cat  3) Bird")
      val cat = ConsoleInput.readMenuChoice(3)
      val animal: Animal = cat match
        case 1 =>
          val breed = ConsoleInput.readLine("Breed: ")
          val size = ConsoleInput.readLine("Size (Small/Medium/Large): ")
          val trained = ConsoleInput.readYesNo("Is trained?")
          new Dog(id, name, age, gender, health, false, breed, size, trained)
        case 2 =>
          val breed = ConsoleInput.readLine("Breed: ")
          val fur = ConsoleInput.readLine("Fur colour: ")
          val indoor = ConsoleInput.readYesNo("Indoor friendly?")
          new Cat(id, name, age, gender, health, false, breed, fur, indoor)
        case 3 =>
          val species = ConsoleInput.readLine("Species: ")
          val wingspan = ConsoleInput.readDouble("Wingspan (cm): ")
          val canFly = ConsoleInput.readYesNo("Can fly?")
          new Bird(id, name, age, gender, health, false, species, wingspan, canFly)
      animalService.register(animal)
      println(s"Successfully registered ${animal.category} '${animal.name}' with ID ${animal.animalId}.")
    catch
      case e: ShelterException => println(s"Error: ${e.getMessage}")
      case e: IllegalArgumentException => println(s"Invalid input: ${e.getMessage}")
      case e: Exception => println(s"Unexpected error: ${e.getMessage}")

  private def viewAll(): Unit =
    val animals = animalService.all
    if animals.isEmpty then println("No animals registered yet.")
    else animals.foreach(a => println(a.describe))

  private def search(): Unit =
    println("Search by: 1) ID  2) Name")
    ConsoleInput.readMenuChoice(2) match
      case 1 =>
        val id = ConsoleInput.readInt("Animal ID: ")
        animalService.findById(id) match
          case Some(a) => println(a.describe)
          case None    => println(s"No animal found with ID $id.")
      case 2 =>
        val name = ConsoleInput.readLine("Name (or fragment): ")
        val results = animalService.findByName(name)
        if results.isEmpty then println(s"No animals found matching '$name'.")
        else results.foreach(a => println(a.describe))

  private def update(): Unit =
    try
      val id = ConsoleInput.readInt("Animal ID to update: ")
      val current = animalService.requireById(id)
      println(s"Current record: ${current.describe}")
      val name = ConsoleInput.readLine(s"Name [${current.name}]: ")
      val age = ConsoleInput.readInt(s"Age [${current.age}]: ")
      val gender = ConsoleInput.readLine(s"Gender [${current.gender}]: ")
      val health = ConsoleInput.readLine(s"Health status [${current.healthStatus}]: ")
      animalService.update(id, name, age, gender, health)
      println(s"Animal $id updated successfully.")
    catch
      case e: ShelterException => println(s"Error: ${e.getMessage}")
      case e: Exception => println(s"Unexpected error: ${e.getMessage}")

  private def delete(): Unit =
    try
      val id = ConsoleInput.readInt("Animal ID to delete: ")
      if ConsoleInput.readYesNo(s"Are you sure you want to delete animal $id?") then
        animalService.delete(id)
        println(s"Animal $id deleted.")
    catch
      case e: ShelterException => println(s"Error: ${e.getMessage}")
      case e: Exception => println(s"Unexpected error: ${e.getMessage}")

  private def viewAvailable(): Unit =
    val list = animalService.available
    if list.isEmpty then println("No available animals.")
    else list.foreach(a => println(a.describe))

  private def viewAdopted(): Unit =
    val list = animalService.adopted
    if list.isEmpty then println("No adopted animals.")
    else list.foreach(a => println(a.describe))
