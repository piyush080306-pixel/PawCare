package pawcare

import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers
import pawcare.exceptions.*
import pawcare.models.*
import pawcare.services.AnimalService

class AnimalServiceTest extends AnyFlatSpec with Matchers with TestBase:

  private def service = AnimalService()

  "AnimalService" should "register a new animal successfully" in:
    val svc = service
    val dog = Dog(1, "Bruno", 3, "Male", "Healthy", false, "Labrador", "Large", true)
    svc.register(dog)
    svc.findById(1).map(_.name) shouldBe Some("Bruno")

  it should "prevent duplicate animal IDs" in:
    val svc = service
    svc.register(Dog(1, "Bruno", 3, "Male", "Healthy", false, "Labrador", "Large", true))
    assertThrows[DuplicateAnimalException] {
      svc.register(Dog(1, "Rocky", 5, "Male", "Healthy", false, "GSD", "Large", true))
    }

  it should "search existing animals by name" in:
    val svc = service
    svc.register(Dog(1, "Bruno", 3, "Male", "Healthy", false, "Labrador", "Large", true))
    svc.register(Cat(2, "Kitty", 2, "Female", "Healthy", false, "Persian", "White", true))
    svc.findByName("Kitty").map(_.name) shouldBe List("Kitty")

  it should "return empty when searching nonexistent IDs" in:
    val svc = service
    svc.findById(999) shouldBe None

  it should "filter available animals" in:
    val svc = service
    svc.register(Dog(1, "Bruno", 3, "Male", "Healthy", false, "Labrador", "Large", true))
    svc.register(Dog(2, "Max", 4, "Male", "Healthy", true, "Golden Retriever", "Medium", false))
    svc.available.map(_.animalId) shouldBe List(1)
    svc.adopted.map(_.animalId) shouldBe List(2)

  it should "group animals by category" in:
    val svc = service
    svc.register(Dog(1, "Bruno", 3, "Male", "Healthy", false, "Labrador", "Large", true))
    svc.register(Cat(2, "Kitty", 2, "Female", "Healthy", false, "Persian", "White", true))
    svc.register(Bird(3, "Coco", 1, "Female", "Healthy", false, "Parrot", 0.25, true))
    svc.groupByCategory.keySet shouldBe Set("DOG", "CAT", "BIRD")

  it should "sort animals by age" in:
    val svc = service
    svc.register(Dog(3, "Rocky", 5, "Male", "Healthy", false, "GSD", "Large", true))
    svc.register(Dog(1, "Bruno", 3, "Male", "Healthy", false, "Lab", "Large", true))
    svc.register(Dog(2, "Max", 4, "Male", "Healthy", false, "GR", "Medium", false))
    svc.sortByAge.map(_.age) shouldBe List(3, 4, 5)

  it should "throw AnimalNotFoundException when updating a missing animal" in:
    val svc = service
    assertThrows[AnimalNotFoundException] {
      svc.update(999, "Ghost", 1, "Male", "Healthy")
    }

  it should "throw InvalidAnimalAgeException on negative age via validateFields" in:
    assertThrows[InvalidAnimalAgeException] {
      Animal.validateFields("Bruno", -1, "Male", "Healthy")
    }
