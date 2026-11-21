package pawcare.models

import pawcare.exceptions.{InvalidAnimalAgeException, InvalidAdopterException}

/** Abstract base class for all shelter animals.
  *
  * Demonstrates encapsulation (private fields with accessors), abstract
  * members, and polymorphism via the overridden `describe` and `category`
  * methods in subclasses.
  */
abstract class Animal(
  val animalId: Int,
  val name: String,
  val age: Int,
  val gender: String,
  val healthStatus: String,
  val isAdopted: Boolean
):
  require(name.nonEmpty, "Animal name cannot be empty.")
  require(age >= 0, s"Animal age cannot be negative (got $age).")
  require(gender.nonEmpty, "Animal gender cannot be empty.")

  /** Short discriminator persisted to the database to identify the concrete
    * subclass, e.g. "DOG", "CAT", "BIRD". */
  def category: String

  /** Human readable multi-line description, overridable by subclasses. */
  def describe: String =
    s"[$category] ID:$animalId | $name | Age:$age | Gender:$gender | Health:$healthStatus | Adopted:$isAdopted"

  /** Returns a copy of this animal with the adoption flag updated. Subclasses
    * override to preserve their own fields through `copy`. */
  def withAdopted(adopted: Boolean): Animal

  /** Returns a copy of this animal with general editable fields updated. */
  def withUpdated(
    name: String = this.name,
    age: Int = this.age,
    gender: String = this.gender,
    healthStatus: String = this.healthStatus,
    isAdopted: Boolean = this.isAdopted
  ): Animal

object Animal:
  /** Centralised validation used by the service layer before persistence. */
  def validateFields(name: String, age: Int, gender: String, healthStatus: String): Unit =
    if name == null || name.trim.isEmpty then
      throw InvalidAdopterException("Animal name cannot be empty.")
    if age < 0 then throw InvalidAnimalAgeException(age)
    if gender == null || gender.trim.isEmpty then
      throw InvalidAdopterException("Animal gender cannot be empty.")
    if healthStatus == null || healthStatus.trim.isEmpty then
      throw InvalidAdopterException("Animal health status cannot be empty.")
