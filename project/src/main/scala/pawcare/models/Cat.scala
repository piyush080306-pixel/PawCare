package pawcare.models

/** Feline residents of the shelter. */
final class Cat(
  animalId: Int,
  name: String,
  age: Int,
  gender: String,
  healthStatus: String,
  isAdopted: Boolean,
  val breed: String,
  val furColor: String,
  val isIndoorFriendly: Boolean
) extends Animal(animalId, name, age, gender, healthStatus, isAdopted):
  require(breed.nonEmpty, "Cat breed cannot be empty.")
  require(furColor.nonEmpty, "Cat fur colour cannot be empty.")

  override def category: String = "CAT"

  override def describe: String =
    super.describe + s" | Breed:$breed | Fur:$furColor | IndoorFriendly:$isIndoorFriendly"

  override def withAdopted(adopted: Boolean): Cat =
    new Cat(animalId, name, age, gender, healthStatus, adopted, breed, furColor, isIndoorFriendly)

  override def withUpdated(
    name: String = this.name,
    age: Int = this.age,
    gender: String = this.gender,
    healthStatus: String = this.healthStatus,
    isAdopted: Boolean = this.isAdopted
  ): Cat =
    new Cat(animalId, name, age, gender, healthStatus, isAdopted, breed, furColor, isIndoorFriendly)

  def withCatDetails(breed: String = this.breed, furColor: String = this.furColor, isIndoorFriendly: Boolean = this.isIndoorFriendly): Cat =
    new Cat(animalId, name, age, gender, healthStatus, isAdopted, breed, furColor, isIndoorFriendly)
