package pawcare

import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers
import pawcare.exceptions.*
import pawcare.models.*
import pawcare.services.{AnimalService, StaffService}

class StaffServiceTest extends AnyFlatSpec with Matchers with TestBase:

  private def staffService = StaffService()
  private def animalService = AnimalService()

  "StaffService" should "register a staff member successfully" in:
    val svc = staffService
    svc.add(Manager(1, "Rahul", "9876543210", 35, 60000, "Operations"))
    svc.findById(1).map(_.name) shouldBe Some("Rahul")

  it should "search staff by ID" in:
    val svc = staffService
    svc.add(Veterinarian(2, "Priya", "9123456780", 40, 75000, "Surgery", "VET-2023-001"))
    svc.findById(2).map(_.role) shouldBe Some("VETERINARIAN")

  it should "return None for a missing staff ID" in:
    staffService.findById(999) shouldBe None

  it should "throw StaffNotFoundException when requiring a missing staff ID" in:
    assertThrows[StaffNotFoundException] {
      staffService.requireById(999)
    }

  it should "filter staff by role" in:
    val svc = staffService
    svc.add(Manager(1, "Rahul", "9876543210", 35, 60000, "Operations"))
    svc.add(Caretaker(3, "Aman", "9001122334", 24, 25000, "Morning", "Kennel A"))
    svc.add(Caretaker(4, "Neha", "9005566778", 27, 26000, "Evening", "Kennel B"))
    svc.filterByRole("CARETAKER").map(_.staffId) shouldBe List(3, 4)
    svc.filterByRole("MANAGER").map(_.staffId) shouldBe List(1)

  it should "update staff information" in:
    val svc = staffService
    svc.add(Caretaker(3, "Aman", "9001122334", 24, 25000, "Morning", "Kennel A"))
    val updated = svc.update(3, "Aman Kumar", "9001122334", 25, 27000)
    updated.name shouldBe "Aman Kumar"
    updated.salary shouldBe 27000.0
    svc.findById(3).map(_.name) shouldBe Some("Aman Kumar")

  it should "remove staff members" in:
    val svc = staffService
    svc.add(Caretaker(3, "Aman", "9001122334", 24, 25000, "Morning", "Kennel A"))
    svc.remove(3)
    svc.findById(3) shouldBe None

  it should "assign a caretaker to an animal" in:
    val s = staffService
    val a = animalService
    a.register(Dog(1, "Bruno", 3, "Male", "Healthy", false, "Labrador", "Large", true))
    s.add(Caretaker(3, "Aman", "9001122334", 24, 25000, "Morning", "Kennel A"))
    s.assignCaretaker(3, 1, a)
    s.caretakerAnimalIds(3) shouldBe List(1)

  it should "reject assigning a non-caretaker to an animal" in:
    val s = staffService
    val a = animalService
    a.register(Dog(1, "Bruno", 3, "Male", "Healthy", false, "Labrador", "Large", true))
    s.add(Manager(1, "Rahul", "9876543210", 35, 60000, "Operations"))
    assertThrows[InvalidAdopterException] {
      s.assignCaretaker(1, 1, a)
    }
