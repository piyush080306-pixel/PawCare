package pawcare.services

import pawcare.exceptions.*
import pawcare.models.{Staff, Manager, Veterinarian, Caretaker}
import pawcare.repositories.StaffRepository

/** Business logic for staff management. */
class StaffService:

  def add(s: Staff): Unit =
    if StaffRepository.existsById(s.staffId) then
      throw IllegalArgumentException(s"Staff member with ID ${s.staffId} already exists.")
    StaffRepository.insert(s)

  def all: List[Staff] = StaffRepository.findAll()

  def findById(staffId: Int): Option[Staff] = StaffRepository.findById(staffId)

  def requireById(staffId: Int): Staff =
    findById(staffId).getOrElse(throw StaffNotFoundException(staffId))

  def filterByRole(role: String): List[Staff] =
    all.filter(_.role.equalsIgnoreCase(role))

  def update(staffId: Int, name: String, contactNumber: String, age: Int, salary: Double): Staff =
    val current = requireById(staffId)
    val updated = current.withUpdated(name = name, contactNumber = contactNumber, age = age, salary = salary)
    StaffRepository.update(updated)
    updated

  def remove(staffId: Int): Unit =
    if !StaffRepository.existsById(staffId) then throw StaffNotFoundException(staffId)
    StaffRepository.delete(staffId)

  /** Assigns a caretaker to an animal. Validates that the staff member is a
    * caretaker and that the animal exists. */
  def assignCaretaker(caretakerId: Int, animalId: Int, animalService: AnimalService): Unit =
    val staff = requireById(caretakerId)
    staff match
      case c: Caretaker => ()
      case other        => throw InvalidAdopterException(s"Staff ${other.staffId} is not a caretaker and cannot be assigned to animals.")
    animalService.requireById(animalId) // throws AnimalNotFoundException if missing
    StaffRepository.assignCaretaker(caretakerId, animalId)

  def caretakerAnimalIds(caretakerId: Int): List[Int] =
    StaffRepository.caretakerAssignments(caretakerId)

  /** Counts staff by role for the dashboard. */
  def countByRole: Map[String, Int] =
    all.groupMapReduce(_.role)(_ => 1)(_ + _)

  def count: Int = all.size
