package pawcare.exceptions

/** Base class for all PawCare domain exceptions. */
abstract class ShelterException(message: String) extends Exception(message)

final class AnimalNotFoundException(message: String) extends ShelterException(message)
object AnimalNotFoundException:
  def apply(animalId: Int): AnimalNotFoundException =
    new AnimalNotFoundException(s"Animal with ID $animalId was not found.")
  def applyByName(name: String): AnimalNotFoundException =
    new AnimalNotFoundException(s"No animal found with name '$name'.")

final class AnimalAlreadyAdoptedException(message: String) extends ShelterException(message)
object AnimalAlreadyAdoptedException:
  def apply(animalId: Int): AnimalAlreadyAdoptedException =
    new AnimalAlreadyAdoptedException(s"Animal with ID $animalId is already adopted and cannot receive another adoption.")

final class InvalidAdopterException(message: String) extends ShelterException(message)
object InvalidAdopterException:
  def apply(message: String): InvalidAdopterException = new InvalidAdopterException(message)

final class InvalidAnimalAgeException(message: String) extends ShelterException(message)
object InvalidAnimalAgeException:
  def apply(age: Int): InvalidAnimalAgeException =
    new InvalidAnimalAgeException(s"Invalid animal age '$age'. Age must be a non-negative integer.")

final class DuplicateAnimalException(message: String) extends ShelterException(message)
object DuplicateAnimalException:
  def apply(animalId: Int): DuplicateAnimalException =
    new DuplicateAnimalException(s"An animal with ID $animalId already exists.")

final class StaffNotFoundException(message: String) extends ShelterException(message)
object StaffNotFoundException:
  def apply(staffId: Int): StaffNotFoundException =
    new StaffNotFoundException(s"Staff member with ID $staffId was not found.")

final class AdoptionNotFoundException(message: String) extends ShelterException(message)
object AdoptionNotFoundException:
  def apply(adoptionId: Int): AdoptionNotFoundException =
    new AdoptionNotFoundException(s"Adoption record with ID $adoptionId was not found.")

final class InvalidAdoptionStatusException(message: String) extends ShelterException(message)
object InvalidAdoptionStatusException:
  def apply(message: String): InvalidAdoptionStatusException = new InvalidAdoptionStatusException(message)
