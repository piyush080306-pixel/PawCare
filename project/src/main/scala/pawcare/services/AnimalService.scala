package pawcare.services

import pawcare.exceptions.*
import pawcare.models.{Animal, Dog, Cat, Bird}
import pawcare.repositories.AnimalRepository

/** Business logic for animal management.
  *
  * The repository layer owns all JDBC interaction; this layer is responsible
  * for validation, duplicate detection, and the functional-style queries
  * (filter, sort, group) that the assignment requires.
  */
class AnimalService:

  /** Registers a new animal, rejecting duplicates and invalid fields. */
  def register(a: Animal): Unit =
    Animal.validateFields(a.name, a.age, a.gender, a.healthStatus)
    if AnimalRepository.existsById(a.animalId) then
      throw DuplicateAnimalException(a.animalId)
    AnimalRepository.insert(a)

  /** Returns every registered animal. */
  def all: List[Animal] = AnimalRepository.findAll()

  /** Finds an animal by id, returning an Option. */
  def findById(animalId: Int): Option[Animal] = AnimalRepository.findById(animalId)

  /** Finds an animal by id, throwing if missing. */
  def requireById(animalId: Int): Animal =
    findById(animalId).getOrElse(throw AnimalNotFoundException(animalId))

  /** Finds animals whose name contains the given fragment. */
  def findByName(name: String): List[Animal] =
    AnimalRepository.findByName(name)

  /** Filters animals by category (DOG/CAT/BIRD). */
  def filterByCategory(category: String): List[Animal] =
    all.filter(_.category.equalsIgnoreCase(category))

  /** Returns animals older than the given age. */
  def olderThan(age: Int): List[Animal] = all.filter(_.age > age)

  /** Sorts all animals by age ascending. */
  def sortByAge: List[Animal] = all.sortBy(_.age)

  /** Sorts all animals alphabetically by name. */
  def sortByName: List[Animal] = all.sortBy(_.name.toLowerCase)

  /** Groups animals by their category and returns a Map. */
  def groupByCategory: Map[String, List[Animal]] = all.groupBy(_.category)

  /** Animals not yet adopted. */
  def available: List[Animal] = all.filterNot(_.isAdopted)

  /** Animals already adopted. */
  def adopted: List[Animal] = all.filter(_.isAdopted)

  /** Updates mutable fields of an animal. Throws if not found. */
  def update(animalId: Int, name: String, age: Int, gender: String, healthStatus: String): Animal =
    val current = requireById(animalId)
    Animal.validateFields(name, age, gender, healthStatus)
    val updated = current.withUpdated(name = name, age = age, gender = gender, healthStatus = healthStatus)
    AnimalRepository.update(updated)
    updated

  /** Deletes an animal by id. Throws if not found. */
  def delete(animalId: Int): Unit =
    if !AnimalRepository.existsById(animalId) then throw AnimalNotFoundException(animalId)
    AnimalRepository.delete(animalId)

  /** Marks an animal as adopted (internal, used by AdoptionService). */
  private[pawcare] def markAdopted(animalId: Int): Unit =
    val a = requireById(animalId)
    if a.isAdopted then throw AnimalAlreadyAdoptedException(animalId)
    AnimalRepository.updateAdoptedFlag(animalId, true)

  /** Counts animals by category, returning a Map for the dashboard. */
  def countByCategory: Map[String, Int] =
    all.groupMapReduce(_.category)(_ => 1)(_ + _)

  /** Total number of animals. */
  def count: Int = all.size

  /** Total number of adopted animals. */
  def adoptedCount: Int = all.count(_.isAdopted)
