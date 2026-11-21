package pawcare

import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers
import pawcare.exceptions.*
import pawcare.models.*
import pawcare.services.{AdoptionService, AnimalService, StaffService}

class AdoptionServiceTest extends AnyFlatSpec with Matchers with TestBase:

  private def animalService = AnimalService()
  private def adoptionService = AdoptionService()
  private def staffService = StaffService()

  private def withAvailableAnimal(): Unit =
    animalService.register(Dog(1, "Bruno", 3, "Male", "Healthy", false, "Labrador", "Large", true))

  "AdoptionService" should "submit a pending adoption application" in:
    val a = animalService; val ad = adoptionService
    a.register(Dog(1, "Bruno", 3, "Male", "Healthy", false, "Labrador", "Large", true))
    val rec = ad.submitApplication(100, 1, "John Doe", 28, "9800000000")
    rec.adoptionStatus shouldBe "PENDING"
    rec.animalId shouldBe 1
    // pending application must NOT mark the animal as adopted
    a.requireById(1).isAdopted shouldBe false

  it should "approve a pending application and mark the animal adopted" in:
    val a = animalService; val ad = adoptionService
    a.register(Dog(1, "Bruno", 3, "Male", "Healthy", false, "Labrador", "Large", true))
    ad.submitApplication(100, 1, "John Doe", 28, "9800000000")
    val approved = ad.approve(100, staffService)
    approved.adoptionStatus shouldBe "APPROVED"
    a.requireById(1).isAdopted shouldBe true

  it should "reject a pending application without changing animal status" in:
    val a = animalService; val ad = adoptionService
    a.register(Dog(1, "Bruno", 3, "Male", "Healthy", false, "Labrador", "Large", true))
    ad.submitApplication(100, 1, "John Doe", 28, "9800000000")
    val rejected = ad.reject(100)
    rejected.adoptionStatus shouldBe "REJECTED"
    a.requireById(1).isAdopted shouldBe false

  it should "prevent adopting an already adopted animal" in:
    val a = animalService; val ad = adoptionService
    a.register(Dog(1, "Bruno", 3, "Male", "Healthy", false, "Labrador", "Large", true))
    ad.submitApplication(100, 1, "John", 30, "9800000000")
    ad.approve(100, staffService)
    assertThrows[AnimalAlreadyAdoptedException] {
      ad.submitApplication(101, 1, "Jane", 30, "9800001111")
    }

  it should "prevent adoption of nonexistent animals" in:
    assertThrows[AnimalNotFoundException] {
      adoptionService.submitApplication(100, 999, "John", 30, "9800000000")
    }

  it should "ensure pending applications do not change animal status" in:
    val a = animalService; val ad = adoptionService
    a.register(Dog(1, "Bruno", 3, "Male", "Healthy", false, "Labrador", "Large", true))
    ad.submitApplication(100, 1, "John", 30, "9800000000")
    a.requireById(1).isAdopted shouldBe false

  it should "ensure rejected applications do not change animal status" in:
    val a = animalService; val ad = adoptionService
    a.register(Dog(1, "Bruno", 3, "Male", "Healthy", false, "Labrador", "Large", true))
    ad.submitApplication(100, 1, "John", 30, "9800000000")
    ad.reject(100)
    a.requireById(1).isAdopted shouldBe false

  it should "reject approving an application that is not pending" in:
    val a = animalService; val ad = adoptionService
    a.register(Dog(1, "Bruno", 3, "Male", "Healthy", false, "Labrador", "Large", true))
    ad.submitApplication(100, 1, "John", 30, "9800000000")
    ad.approve(100, staffService)
    assertThrows[InvalidAdoptionStatusException] {
      ad.approve(100, staffService)
    }

  it should "validate adopter details" in:
    val a = animalService; val ad = adoptionService
    a.register(Dog(1, "Bruno", 3, "Male", "Healthy", false, "Labrador", "Large", true))
    assertThrows[InvalidAdopterException] {
      ad.submitApplication(100, 1, "", 30, "9800000000")
    }
    assertThrows[InvalidAdopterException] {
      ad.submitApplication(100, 1, "John", 16, "9800000000")
    }
    assertThrows[InvalidAdopterException] {
      ad.submitApplication(100, 1, "John", 30, "")
    }

  it should "maintain adoption history of approved records" in:
    val a = animalService; val ad = adoptionService
    a.register(Dog(1, "Bruno", 3, "Male", "Healthy", false, "Labrador", "Large", true))
    ad.submitApplication(100, 1, "John", 30, "9800000000")
    ad.approve(100, staffService)
    ad.history.map(_.adoptionId) shouldBe List(100)

  it should "search adoption records by adopter name" in:
    val a = animalService; val ad = adoptionService
    a.register(Dog(1, "Bruno", 3, "Male", "Healthy", false, "Labrador", "Large", true))
    ad.submitApplication(100, 1, "John Doe", 30, "9800000000")
    ad.searchByAdopter("John").map(_.adoptionId) shouldBe List(100)
