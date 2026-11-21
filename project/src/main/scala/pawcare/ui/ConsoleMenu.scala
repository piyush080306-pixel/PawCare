package pawcare.ui

import pawcare.services.*
import pawcare.ui.ConsoleUI.{line, banner}

/** The main console application: top-level menu loop that delegates to the
  * per-module menus and the dashboard/reports view.
  */
class ConsoleMenu(
  animalService: AnimalService,
  staffService: StaffService,
  adoptionService: AdoptionService,
  healthService: HealthService,
  reportService: ReportService
):
  private val animalMenu = AnimalMenu(animalService, staffService)
  private val staffMenu = StaffMenu(staffService, animalService)
  private val adoptionMenu = AdoptionMenu(adoptionService, staffService)
  private val healthMenu = HealthMenu(healthService, animalService)

  def run(): Unit =
    println(ConsoleUI.banner)
    var exit = false
    while !exit do
      println(line)
      println("                 PAWCARE MANAGEMENT")
      println("              ANIMAL SHELTER SYSTEM")
      println(line)
      println("1. Animal Management")
      println("2. Staff Management")
      println("3. Adoption Management")
      println("4. Animal Health Management")
      println("5. Search & Filter")
      println("6. Shelter Dashboard")
      println("7. Reports")
      println("8. Exit")
      println(line)
      try
        ConsoleInput.readMenuChoice(8) match
          case 1 => animalMenu.show()
          case 2 => staffMenu.show()
          case 3 => adoptionMenu.show()
          case 4 => healthMenu.show()
          case 5 => searchAndFilter()
          case 6 => dashboard()
          case 7 => reports()
          case 8 =>
            println("Thank you for using PawCare. Goodbye!")
            exit = true
      catch
        case e: Exception => println(s"Unexpected error: ${e.getMessage}")

  // --- search & filter -----------------------------------------------------

  private def searchAndFilter(): Unit =
    var back = false
    while !back do
      println(line)
      println("                SEARCH & FILTER")
      println(line)
      println("1. Search animal by ID")
      println("2. Search animal by name")
      println("3. Filter by animal type (DOG/CAT/BIRD)")
      println("4. Filter by age (older than)")
      println("5. Filter by gender")
      println("6. Filter available animals")
      println("7. Filter adopted animals")
      println("8. Sort animals alphabetically")
      println("9. Sort animals by age")
      println("10. Search adoption records by adopter name")
      println("11. Back to Main Menu")
      println(line)
      ConsoleInput.readMenuChoice(11) match
        case 1 =>
          val id = ConsoleInput.readInt("Animal ID: ")
          animalService.findById(id) match
            case Some(a) => println(a.describe)
            case None    => println(s"No animal with ID $id.")
        case 2 =>
          val name = ConsoleInput.readLine("Name fragment: ")
          val results = animalService.findByName(name)
          if results.isEmpty then println("No matches.")
          else results.foreach(a => println(a.describe))
        case 3 =>
          val cat = ConsoleInput.readLine("Category (DOG/CAT/BIRD): ")
          val results = animalService.filterByCategory(cat)
          if results.isEmpty then println(s"No $cat animals.")
          else results.foreach(a => println(a.describe))
        case 4 =>
          val age = ConsoleInput.readInt("Minimum age (exclusive): ")
          val results = animalService.olderThan(age)
          if results.isEmpty then println(s"No animals older than $age.")
          else results.foreach(a => println(a.describe))
        case 5 =>
          val gender = ConsoleInput.readLine("Gender: ")
          val results = animalService.all.filter(_.gender.equalsIgnoreCase(gender))
          if results.isEmpty then println(s"No animals with gender '$gender'.")
          else results.foreach(a => println(a.describe))
        case 6 => animalService.available.foreach(a => println(a.describe))
        case 7 => animalService.adopted.foreach(a => println(a.describe))
        case 8 => animalService.sortByName.foreach(a => println(a.describe))
        case 9 => animalService.sortByAge.foreach(a => println(a.describe))
        case 10 =>
          val name = ConsoleInput.readLine("Adopter name fragment: ")
          val results = adoptionService.searchByAdopter(name)
          if results.isEmpty then println("No matching adoption records.")
          else results.foreach(r =>
            println(s"Adoption #${r.adoptionId} | Animal:${r.animalId} | ${r.adopterName} | ${r.adoptionStatus}"))
        case 11 => back = true

  // --- dashboard & reports -------------------------------------------------

  private def dashboard(): Unit =
    val s = reportService.snapshot
    println(line)
    println("                SHELTER DASHBOARD")
    println(line)
    println(f"Total registered animals     : ${s("totalAnimals")}")
    println(f"Total available animals      : ${s("availableAnimals")}")
    println(f"Total adopted animals        : ${s("adoptedAnimals")}")
    println(f"Total dogs                   : ${s("totalDogs")}")
    println(f"Total cats                   : ${s("totalCats")}")
    println(f"Total birds                  : ${s("totalBirds")}")
    println(f"Total staff members          : ${s("totalStaff")}")
    println(f"Pending adoption applications: ${s("pendingApplications")}")
    println(f"Approved applications        : ${s("approvedApplications")}")
    println(f"Rejected applications        : ${s("rejectedApplications")}")
    println(f"Total medical records        : ${s("totalMedicalRecords")}")
    println(f"Adoption rate                : ${reportService.adoptionRate}%.2f%%")
    println(line)

  private def reports(): Unit =
    println(line)
    println("                   REPORTS")
    println(line)
    println("Animal category distribution:")
    reportService.categoryDistribution.foreach { case (k, v) => println(f"  $k%-12s : $v") }
    println("Monthly adoption statistics:")
    val monthly = reportService.monthlyAdoptionStats
    if monthly.isEmpty then println("  No adoptions recorded yet.")
    else monthly.toList.sortBy(_._1).foreach { case (m, c) => println(s"  $m : $c") }
    println(f"Adoption success rate: ${reportService.adoptionSuccessRate}%.2f%%")
    val (avail, adopted) = reportService.availableVsAdopted
    println(s"Available vs adopted: $avail available, $adopted adopted")
    println("Staff distribution by role:")
    reportService.staffDistribution.foreach { case (k, v) => println(f"  $k%-14s : $v") }
    println("Upcoming vaccinations (next 30 days):")
    val upcoming = reportService.upcomingVaccinations(30)
    if upcoming.isEmpty then println("  None due.")
    else upcoming.foreach(r => println(s"  Record #${r.recordId} | Animal:${r.animalId} | ${r.nextVaccinationDate}"))
    println(line)
end ConsoleMenu
