package pawcare.models

/** Canine residents of the shelter. */
final class Dog(
  animalId: Int,
  name: String,
  age: Int,
  gender: String,
  healthStatus: String,
  isAdopted: Boolean,
  val breed: String,
  val size: String,
  val isTrained: Boolean
) extends Animal(animalId, name, age, gender, healthStatus, isAdopted):
  require(breed.nonEmpty, "Dog breed cannot be empty.")
  require(size.nonEmpty, "Dog size cannot be empty.")

  override def category: String = "DOG"

  override def describe: String =
    super.describe + s" | Breed:$breed | Size:$size | Trained:$isTrained"

  override def withAdopted(adopted: Boolean): Dog =
    new Dog(animalId, name, age, gender, healthStatus, adopted, breed, size, isTrained)

  override def withUpdated(
    name: String = this.name,
    age: Int = this.age,
    gender: String = this.gender,
    healthStatus: String = this.healthStatus,
    isAdopted: Boolean = this.isAdopted
  ): Dog =
    new Dog(animalId, name, age, gender, healthStatus, isAdopted, breed, size, isTrained)

  def withDogDetails(breed: String = this.breed, size: String = this.size, isTrained: Boolean = this.isTrained): Dog =
    new Dog(animalId, name, age, gender, healthStatus, isAdopted, breed, size, isTrained)
