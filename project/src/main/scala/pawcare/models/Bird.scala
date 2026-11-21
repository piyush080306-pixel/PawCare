package pawcare.models

/** Avian residents of the shelter. */
final class Bird(
  animalId: Int,
  name: String,
  age: Int,
  gender: String,
  healthStatus: String,
  isAdopted: Boolean,
  val species: String,
  val wingspan: Double,
  val canFly: Boolean
) extends Animal(animalId, name, age, gender, healthStatus, isAdopted):
  require(species.nonEmpty, "Bird species cannot be empty.")
  require(wingspan >= 0, s"Bird wingspan cannot be negative (got $wingspan).")

  override def category: String = "BIRD"

  override def describe: String =
    super.describe + s" | Species:$species | Wingspan:$wingspan | CanFly:$canFly"

  override def withAdopted(adopted: Boolean): Bird =
    new Bird(animalId, name, age, gender, healthStatus, adopted, species, wingspan, canFly)

  override def withUpdated(
    name: String = this.name,
    age: Int = this.age,
    gender: String = this.gender,
    healthStatus: String = this.healthStatus,
    isAdopted: Boolean = this.isAdopted
  ): Bird =
    new Bird(animalId, name, age, gender, healthStatus, isAdopted, species, wingspan, canFly)

  def withBirdDetails(species: String = this.species, wingspan: Double = this.wingspan, canFly: Boolean = this.canFly): Bird =
    new Bird(animalId, name, age, gender, healthStatus, isAdopted, species, wingspan, canFly)
