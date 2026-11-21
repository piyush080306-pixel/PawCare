package pawcare.web

import com.sun.net.httpserver.{HttpExchange, HttpServer}
import java.net.{InetSocketAddress, URLDecoder}
import java.nio.charset.StandardCharsets
import java.time.LocalDate
import java.util.concurrent.Executors
import scala.collection.mutable
import scala.util.control.NonFatal
import pawcare.models.*
import pawcare.services.*
import pawcare.exceptions.*

/** Lightweight HTTP layer for PawCare.
  *
  * Serves a single-page browser UI and a small JSON API that simply delegates
  * to the existing service layer, so every validation rule, transaction and
  * computed statistic is exactly the same as the console application.
  */
object WebServer:

  final case class Services(
    animals: AnimalService,
    staff: StaffService,
    adoptions: AdoptionService,
    health: HealthService,
    reports: ReportService
  )

  private var services: Services = null

  def start(
    animals: AnimalService,
    staff: StaffService,
    adoptions: AdoptionService,
    health: HealthService,
    reports: ReportService,
    preferredPort: Int
  ): HttpServer =
    services = Services(animals, staff, adoptions, health, reports)
    val server =
      try HttpServer.create(new InetSocketAddress("127.0.0.1", preferredPort), 0)
      catch
        case _: java.net.BindException =>
          throw new RuntimeException(
            s"Port $preferredPort is already in use. Stop the other process or pass a different port.")
    server.createContext("/", handle)
    server.setExecutor(Executors.newFixedThreadPool(8))
    server.start()
    server

  // --- routing -------------------------------------------------------------

  private def handle(ex: HttpExchange): Unit =
    val method = ex.getRequestMethod.toUpperCase
    val path = ex.getRequestURI.getPath
    val segs = path.split('/').filter(_.nonEmpty).toList
    cors(ex)
    if method == "OPTIONS" then
      ex.sendResponseHeaders(204, -1)
      ex.close()
      return
    try
      (method, segs) match
        case ("GET", Nil) =>
          serveSpa(ex, "/")
        case ("GET", "app.js" :: Nil) =>
          serveResource(ex, "/web/app.js", "application/javascript; charset=utf-8")
        case ("GET", "styles.css" :: Nil) =>
          serveResource(ex, "/web/styles.css", "text/css; charset=utf-8")

        case ("GET", "api" :: "dashboard" :: Nil) => dashboard(ex)
        case ("GET", "api" :: "reports" :: Nil)   => reports(ex)

        case ("GET", "api" :: "animals" :: Nil)              => listAnimals(ex)
        case ("GET", "api" :: "animals" :: "available" :: Nil) => listAnimalsByFlag(ex, adopted = false)
        case ("GET", "api" :: "animals" :: "adopted" :: Nil)   => listAnimalsByFlag(ex, adopted = true)
        case ("GET", "api" :: "animals" :: id :: Nil)        => getAnimal(ex, id.toInt)
        case ("POST", "api" :: "animals" :: Nil)             => createAnimal(ex)
        case ("PUT", "api" :: "animals" :: id :: Nil)        => updateAnimal(ex, id.toInt)
        case ("DELETE", "api" :: "animals" :: id :: Nil)     => deleteAnimal(ex, id.toInt)

        case ("GET", "api" :: "staff" :: Nil)                => listStaff(ex)
        case ("GET", "api" :: "staff" :: id :: Nil)          => getStaff(ex, id.toInt)
        case ("POST", "api" :: "staff" :: Nil)               => createStaff(ex)
        case ("PUT", "api" :: "staff" :: id :: Nil)          => updateStaff(ex, id.toInt)
        case ("DELETE", "api" :: "staff" :: id :: Nil)       => deleteStaff(ex, id.toInt)

        case ("GET", "api" :: "adoptions" :: Nil)            => listAdoptions(ex)
        case ("GET", "api" :: "adoptions" :: "pending" :: Nil) => listAdoptionsByStatus(ex, "PENDING")
        case ("GET", "api" :: "adoptions" :: "history" :: Nil) => listAdoptionsByStatus(ex, "APPROVED")
        case ("GET", "api" :: "adoptions" :: id :: Nil)      => getAdoption(ex, id.toInt)
        case ("POST", "api" :: "adoptions" :: Nil)           => createAdoption(ex)
        case ("POST", "api" :: "adoptions" :: id :: "approve" :: Nil) =>
          decideAdoption(ex, id.toInt, approve = true)
        case ("POST", "api" :: "adoptions" :: id :: "reject" :: Nil) =>
          decideAdoption(ex, id.toInt, approve = false)

        case ("GET", "api" :: "health" :: Nil)               => listHealth(ex)
        case ("GET", "api" :: "health" :: "animal" :: id :: Nil) => listHealthForAnimal(ex, id.toInt)
        case ("GET", "api" :: "health" :: id :: Nil)         => getHealth(ex, id.toInt)
        case ("POST", "api" :: "health" :: Nil)              => createHealth(ex)
        case ("POST", "api" :: "health" :: id :: "vaccination" :: Nil) =>
          updateVaccination(ex, id.toInt)

        case ("GET", _) if !path.startsWith("/api/") => serveSpa(ex, path)

        case _ => json(ex, 404, Json.obj("error" -> Json.str(s"Not found: $method $path")))
    catch
      case e: IllegalArgumentException =>
        json(ex, 400, Json.obj("error" -> Json.str(message(e))))
      case e: AnimalNotFoundException =>
        json(ex, 404, Json.obj("error" -> Json.str(message(e))))
      case e: StaffNotFoundException =>
        json(ex, 404, Json.obj("error" -> Json.str(message(e))))
      case e: AdoptionNotFoundException =>
        json(ex, 404, Json.obj("error" -> Json.str(message(e))))
      case e: ShelterException =>
        json(ex, 400, Json.obj("error" -> Json.str(message(e))))
      case NonFatal(e) =>
        json(ex, 500, Json.obj("error" -> Json.str(message(e))))

  // --- dashboard -----------------------------------------------------------

  private def dashboard(ex: HttpExchange): Unit =
    val s = services.reports.snapshot
    val category = services.reports.categoryDistribution.toSeq.sortBy(-_._2)
    val staff = services.reports.staffDistribution.toSeq.sortBy(-_._2)
    val upcoming = services.reports.upcomingVaccinations(30)

    val stat = (k: String) => Json.num(s.getOrElse(k, 0))
    json(ex, 200, Json.obj(
      "stats" -> Json.obj(
        "totalAnimals"          -> stat("totalAnimals"),
        "availableAnimals"      -> stat("availableAnimals"),
        "adoptedAnimals"        -> stat("adoptedAnimals"),
        "totalDogs"             -> stat("totalDogs"),
        "totalCats"             -> stat("totalCats"),
        "totalBirds"            -> stat("totalBirds"),
        "totalStaff"            -> stat("totalStaff"),
        "pendingApplications"   -> stat("pendingApplications"),
        "approvedApplications"  -> stat("approvedApplications"),
        "rejectedApplications"  -> stat("rejectedApplications"),
        "totalMedicalRecords"   -> stat("totalMedicalRecords")
      ),
      "adoptionRate"  -> Json.num(services.reports.adoptionRate),
      "successRate"   -> Json.num(services.reports.adoptionSuccessRate),
      "categories"    -> Json.arr(category.map { case (k, v) =>
        Json.obj("label" -> Json.str(k), "count" -> Json.num(v))
      }),
      "roles"         -> Json.arr(staff.map { case (k, v) =>
        Json.obj("label" -> Json.str(k), "count" -> Json.num(v))
      }),
      "upcoming"      -> Json.arr(upcoming.map(healthJson))
    ))

  private def reports(ex: HttpExchange): Unit =
    val monthly = services.reports.monthlyAdoptionStats.toSeq.sortBy(_._1)
    val category = services.reports.categoryDistribution.toSeq.sortBy(-_._2)
    val staff = services.reports.staffDistribution.toSeq.sortBy(-_._2)
    val (available, adopted) = services.reports.availableVsAdopted
    json(ex, 200, Json.obj(
      "adoptionSuccessRate" -> Json.num(services.reports.adoptionSuccessRate),
      "adoptionRate"        -> Json.num(services.reports.adoptionRate),
      "available"           -> Json.num(available),
      "adopted"             -> Json.num(adopted),
      "categories"          -> Json.arr(category.map { case (k, v) =>
        Json.obj("label" -> Json.str(k), "count" -> Json.num(v)) }),
      "roles"               -> Json.arr(staff.map { case (k, v) =>
        Json.obj("label" -> Json.str(k), "count" -> Json.num(v)) }),
      "monthly"             -> Json.arr(monthly.map { case (m, c) =>
        Json.obj("label" -> Json.str(m), "count" -> Json.num(c)) }),
      "upcoming"            -> Json.arr(services.reports.upcomingVaccinations(30).map(healthJson))
    ))

  // --- animals -------------------------------------------------------------

  private def listAnimals(ex: HttpExchange): Unit =
    val q = query(ex)
    var xs = services.animals.all
    q.get("category").filter(_.nonEmpty).foreach(c =>
      xs = xs.filter(_.category.equalsIgnoreCase(c)))
    q.get("status").map(_.toLowerCase).foreach {
      case "available" => xs = xs.filterNot(_.isAdopted)
      case "adopted"   => xs = xs.filter(_.isAdopted)
      case _           => ()
    }
    q.get("q").filter(_.nonEmpty).foreach { s =>
      val needle = s.toLowerCase
      xs = xs.filter(a => a.name.toLowerCase.contains(needle))
    }
    json(ex, 200, Json.arr(xs.sortBy(_.animalId).map(animalJson)))

  private def listAnimalsByFlag(ex: HttpExchange, adopted: Boolean): Unit =
    val xs = services.animals.all.filter(_.isAdopted == adopted).sortBy(_.animalId)
    json(ex, 200, Json.arr(xs.map(animalJson)))

  private def getAnimal(ex: HttpExchange, id: Int): Unit =
    json(ex, 200, animalJson(services.animals.requireById(id)))

  private def createAnimal(ex: HttpExchange): Unit =
    val b = body(ex)
    val category = text(b, "category", "DOG").toUpperCase
    val id = nextId(services.animals.all.map(_.animalId))
    val animal: Animal = category match
      case "CAT" =>
        new Cat(id, text(b, "name"), whole(b, "age", 1), text(b, "gender", "Unknown"),
          text(b, "healthStatus", "Healthy"), false, text(b, "breed", "Mixed"),
          text(b, "furColor", "Brown"), flag(b, "isIndoorFriendly"))
      case "BIRD" =>
        new Bird(id, text(b, "name"), whole(b, "age", 1), text(b, "gender", "Unknown"),
          text(b, "healthStatus", "Healthy"), false, text(b, "species", "Parrot"),
          decimal(b, "wingspan", 0.3), flag(b, "canFly", default = true))
      case _ =>
        new Dog(id, text(b, "name"), whole(b, "age", 1), text(b, "gender", "Unknown"),
          text(b, "healthStatus", "Healthy"), false, text(b, "breed", "Mixed"),
          text(b, "size", "Medium"), flag(b, "isTrained"))
    services.animals.register(animal)
    json(ex, 201, animalJson(animal))

  private def updateAnimal(ex: HttpExchange, id: Int): Unit =
    val b = body(ex)
    val current = services.animals.requireById(id)
    val updated = services.animals.update(
      id,
      text(b, "name", current.name),
      whole(b, "age", current.age),
      text(b, "gender", current.gender),
      text(b, "healthStatus", current.healthStatus)
    )
    json(ex, 200, animalJson(updated))

  private def deleteAnimal(ex: HttpExchange, id: Int): Unit =
    services.animals.delete(id)
    json(ex, 200, Json.obj("deleted" -> Json.num(id)))

  // --- staff ---------------------------------------------------------------

  private def listStaff(ex: HttpExchange): Unit =
    val q = query(ex)
    var xs = services.staff.all
    q.get("role").filter(_.nonEmpty).foreach(r =>
      xs = xs.filter(_.role.equalsIgnoreCase(r)))
    json(ex, 200, Json.arr(xs.sortBy(_.staffId).map(staffJson)))

  private def getStaff(ex: HttpExchange, id: Int): Unit =
    json(ex, 200, staffJson(services.staff.requireById(id)))

  private def createStaff(ex: HttpExchange): Unit =
    val b = body(ex)
    val id = nextId(services.staff.all.map(_.staffId))
    val name = text(b, "name")
    val contact = text(b, "contactNumber")
    val age = whole(b, "age", 25)
    val salary = decimal(b, "salary", 0)
    val member: Staff = text(b, "role", "CARETAKER").toUpperCase match
      case "MANAGER" =>
        new Manager(id, name, contact, age, salary, text(b, "department", "Operations"))
      case "VETERINARIAN" =>
        new Veterinarian(id, name, contact, age, salary,
          text(b, "specialization", "General"), text(b, "licenseNumber", s"VET-$id"))
      case _ =>
        new Caretaker(id, name, contact, age, salary,
          text(b, "shift", "Morning"), text(b, "assignedArea", "Kennel A"))
    services.staff.add(member)
    json(ex, 201, staffJson(member))

  private def deleteStaff(ex: HttpExchange, id: Int): Unit =
    services.staff.remove(id)
    json(ex, 200, Json.obj("deleted" -> Json.num(id)))

  private def updateStaff(ex: HttpExchange, id: Int): Unit =
    val b = body(ex)
    val current = services.staff.requireById(id)
    val updated = services.staff.update(
      id,
      text(b, "name", current.name),
      text(b, "contactNumber", current.contactNumber),
      whole(b, "age", current.age),
      decimal(b, "salary", current.salary)
    )
    json(ex, 200, staffJson(updated))

  // --- adoptions -----------------------------------------------------------

  private def listAdoptions(ex: HttpExchange): Unit =
    val q = query(ex)
    var xs = services.adoptions.all
    q.get("status").filter(_.nonEmpty).foreach(s =>
      xs = xs.filter(_.adoptionStatus.equalsIgnoreCase(s)))
    json(ex, 200, Json.arr(xs.sortBy(_.adoptionId).map(adoptionJson)))

  private def listAdoptionsByStatus(ex: HttpExchange, status: String): Unit =
    val xs = services.adoptions.all.filter(_.adoptionStatus == status).sortBy(_.adoptionId)
    json(ex, 200, Json.arr(xs.map(adoptionJson)))

  private def getAdoption(ex: HttpExchange, id: Int): Unit =
    services.adoptions.findById(id) match
      case Some(record) => json(ex, 200, adoptionJson(record))
      case None         => json(ex, 404, Json.obj("error" -> Json.str(s"Adoption application $id not found")))

  private def createAdoption(ex: HttpExchange): Unit =
    val b = body(ex)
    val id = nextId(services.adoptions.all.map(_.adoptionId))
    val record = services.adoptions.submitApplication(
      id,
      whole(b, "animalId"),
      text(b, "adopterName"),
      whole(b, "adopterAge", 18),
      text(b, "adopterContact")
    )
    json(ex, 201, adoptionJson(record))

  private def decideAdoption(ex: HttpExchange, id: Int, approve: Boolean): Unit =
    val record =
      if approve then services.adoptions.approve(id, services.staff)
      else services.adoptions.reject(id)
    json(ex, 200, adoptionJson(record))

  // --- health --------------------------------------------------------------

  private def listHealth(ex: HttpExchange): Unit =
    json(ex, 200, Json.arr(services.health.all.sortBy(_.recordId).map(healthJson)))

  private def listHealthForAnimal(ex: HttpExchange, animalId: Int): Unit =
    json(ex, 200, Json.arr(services.health.historyFor(animalId).sortBy(_.recordId).map(healthJson)))

  private def getHealth(ex: HttpExchange, id: Int): Unit =
    services.health.all.find(_.recordId == id) match
      case Some(record) => json(ex, 200, healthJson(record))
      case None         => json(ex, 404, Json.obj("error" -> Json.str(s"Health record $id not found")))

  private def createHealth(ex: HttpExchange): Unit =
    val b = body(ex)
    val today = LocalDate.now()
    val id = nextId(services.health.all.map(_.recordId))
    val vet = b.get("assignedVetId").map(_.trim).filter(_.nonEmpty).map(_.toInt)
    val record = services.health.addRecord(
      id,
      whole(b, "animalId"),
      text(b, "medicalCondition"),
      text(b, "vaccinationStatus", "UNVACCINATED"),
      text(b, "treatmentDetails"),
      text(b, "lastCheckupDate", today.toString),
      text(b, "nextVaccinationDate", today.plusDays(180).toString),
      vet,
      services.animals
    )
    json(ex, 201, healthJson(record))

  private def updateVaccination(ex: HttpExchange, id: Int): Unit =
    val b = body(ex)
    val record = services.health.updateVaccination(
      id,
      text(b, "status", "VACCINATED"),
      text(b, "nextVaccinationDate", LocalDate.now().toString)
    )
    json(ex, 200, healthJson(record))

  // --- serialisers ---------------------------------------------------------

  private def animalJson(a: Animal): String =
    val fields = mutable.ArrayBuffer[(String, String)](
      "id" -> Json.num(a.animalId),
      "category" -> Json.str(a.category),
      "name" -> Json.str(a.name),
      "age" -> Json.num(a.age),
      "gender" -> Json.str(a.gender),
      "healthStatus" -> Json.str(a.healthStatus),
      "isAdopted" -> Json.bool(a.isAdopted),
      "describe" -> Json.str(a.describe)
    )
    a match
      case d: Dog =>
        fields += ("breed" -> Json.str(d.breed))
        fields += ("size" -> Json.str(d.size))
        fields += ("isTrained" -> Json.bool(d.isTrained))
        fields += ("detail" -> Json.str(s"${d.breed} · ${d.size}${if d.isTrained then " · trained" else ""}"))
      case c: Cat =>
        fields += ("breed" -> Json.str(c.breed))
        fields += ("furColor" -> Json.str(c.furColor))
        fields += ("isIndoorFriendly" -> Json.bool(c.isIndoorFriendly))
        fields += ("detail" -> Json.str(s"${c.breed} · ${c.furColor} fur${if c.isIndoorFriendly then " · indoor friendly" else ""}"))
      case b: Bird =>
        fields += ("species" -> Json.str(b.species))
        fields += ("wingspan" -> Json.num(b.wingspan))
        fields += ("canFly" -> Json.bool(b.canFly))
        fields += ("detail" -> Json.str(s"${b.species} · ${b.wingspan}m wingspan${if b.canFly then " · can fly" else ""}"))
      case _ => ()
    Json.obj(fields.toSeq*)

  private def staffJson(s: Staff): String =
    val fields = mutable.ArrayBuffer[(String, String)](
      "id" -> Json.num(s.staffId),
      "role" -> Json.str(s.role),
      "name" -> Json.str(s.name),
      "contactNumber" -> Json.str(s.contactNumber),
      "age" -> Json.num(s.age),
      "salary" -> Json.num(s.salary),
      "describe" -> Json.str(s.describe)
    )
    s match
      case m: Manager =>
        fields += ("department" -> Json.str(m.department))
        fields += ("detail" -> Json.str(s"Department: ${m.department}"))
      case v: Veterinarian =>
        fields += ("specialization" -> Json.str(v.specialization))
        fields += ("licenseNumber" -> Json.str(v.licenseNumber))
        fields += ("detail" -> Json.str(s"${v.specialization} · ${v.licenseNumber}"))
      case c: Caretaker =>
        fields += ("shift" -> Json.str(c.shift))
        fields += ("assignedArea" -> Json.str(c.assignedArea))
        fields += ("detail" -> Json.str(s"${c.shift} shift · ${c.assignedArea}"))
      case _ => ()
    Json.obj(fields.toSeq*)

  private def adoptionJson(r: AdoptionRecord): String =
    val animalName = services.animals.findById(r.animalId).map(_.name).getOrElse(s"Animal #${r.animalId}")
    Json.obj(
      "id" -> Json.num(r.adoptionId),
      "animalId" -> Json.num(r.animalId),
      "animalName" -> Json.str(animalName),
      "adopterName" -> Json.str(r.adopterName),
      "adopterAge" -> Json.num(r.adopterAge),
      "adopterContact" -> Json.str(r.adopterContact),
      "date" -> Json.str(r.adoptionDate),
      "status" -> Json.str(r.adoptionStatus)
    )

  private def healthJson(r: HealthRecord): String =
    val animalName = services.animals.findById(r.animalId).map(_.name).getOrElse(s"Animal #${r.animalId}")
    val vetName = r.assignedVetId.flatMap(services.staff.findById).map(_.name)
    Json.obj(
      "id" -> Json.num(r.recordId),
      "animalId" -> Json.num(r.animalId),
      "animalName" -> Json.str(animalName),
      "condition" -> Json.str(r.medicalCondition),
      "vaccinationStatus" -> Json.str(r.vaccinationStatus),
      "treatment" -> Json.str(r.treatmentDetails),
      "lastCheckupDate" -> Json.str(r.lastCheckupDate),
      "nextVaccinationDate" -> Json.str(r.nextVaccinationDate),
      "vetId" -> r.assignedVetId.map(Json.num).getOrElse("null"),
      "vetName" -> Json.optStr(vetName)
    )

  // --- helpers -------------------------------------------------------------

  private def nextId(existing: List[Int]): Int =
    if existing.isEmpty then 1 else existing.max + 1

  private def text(b: Map[String, String], key: String, default: String = ""): String =
    b.getOrElse(key, "").trim match
      case "" => default
      case v  => v

  private def whole(b: Map[String, String], key: String, default: Int = 0): Int =
    b.get(key).map(_.trim).filter(_.nonEmpty).map(_.toInt).getOrElse(default)

  private def decimal(b: Map[String, String], key: String, default: Double): Double =
    b.get(key).map(_.trim).filter(_.nonEmpty).map(_.toDouble).getOrElse(default)

  private def flag(b: Map[String, String], key: String, default: Boolean = false): Boolean =
    b.get(key).map(_.trim.toLowerCase) match
      case Some("true") | Some("on") | Some("1") => true
      case Some("false") | Some("off") | Some("0") => false
      case _ => default

  private def query(ex: HttpExchange): Map[String, String] =
    Option(ex.getRequestURI.getRawQuery).filter(_.nonEmpty) match
      case None => Map.empty
      case Some(raw) =>
        raw.split('&').toList.filter(_.nonEmpty).map { pair =>
          pair.split("=", 2).toList match
            case k :: v :: Nil =>
              URLDecoder.decode(k, StandardCharsets.UTF_8) ->
                URLDecoder.decode(v, StandardCharsets.UTF_8)
            case k :: Nil => URLDecoder.decode(k, StandardCharsets.UTF_8) -> ""
            case _        => "" -> ""
        }.toMap

  private def body(ex: HttpExchange): Map[String, String] =
    val raw = new String(ex.getRequestBody.readAllBytes(), StandardCharsets.UTF_8)
    if raw.trim.isEmpty then Map.empty else Json.parseObject(raw)

  private def message(e: Throwable): String =
    Option(e.getMessage).map(_.trim).filter(_.nonEmpty).getOrElse(e.getClass.getSimpleName)

  private def cors(ex: HttpExchange): Unit =
    val headers = ex.getResponseHeaders
    headers.set("Access-Control-Allow-Origin", "*")
    headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
    headers.set("Access-Control-Max-Age", "86400")

  private def json(ex: HttpExchange, status: Int, payload: String): Unit =
    sendBytes(ex, status, payload.getBytes(StandardCharsets.UTF_8), "application/json; charset=utf-8")

  private def sendBytes(ex: HttpExchange, status: Int, bytes: Array[Byte], contentType: String): Unit =
    ex.getResponseHeaders.set("Content-Type", contentType)
    ex.getResponseHeaders.set("Cache-Control", "no-store")
    ex.sendResponseHeaders(status, bytes.length.toLong)
    val out = ex.getResponseBody
    try out.write(bytes)
    finally out.close()

  private def serveResource(ex: HttpExchange, resource: String, contentType: String): Unit =
    val in = getClass.getResourceAsStream(resource)
    if in == null then
      json(ex, 404, Json.obj("error" -> Json.str(s"Missing resource $resource")))
    else
      try sendBytes(ex, 200, in.readAllBytes(), contentType)
      finally in.close()

  /** Serves the compiled React SPA from `frontend/dist` when it exists, falling
    * back to the bundled legacy console UI resources otherwise. */
  private def serveSpa(ex: HttpExchange, path: String): Unit =
    val relative =
      if path == "/" || path.isEmpty then "index.html" else path.stripPrefix("/")
    val root = Seq(new java.io.File("frontend/dist"), new java.io.File("../frontend/dist"))
      .map(_.getCanonicalFile)
      .find(_.isDirectory)
      .getOrElse(new java.io.File("../frontend/dist").getCanonicalFile)
    val file = new java.io.File(root, relative).getCanonicalFile
    if file.getPath.startsWith(root.getPath) && file.isFile then
      sendBytes(ex, 200, java.nio.file.Files.readAllBytes(file.toPath), contentTypeFor(relative))
    else if !relative.contains(".") then
      // Client-side route: hand index.html to the browser router.
      val index = new java.io.File(root, "index.html")
      if file.getPath.startsWith(root.getPath) && index.isFile then
        sendBytes(ex, 200, java.nio.file.Files.readAllBytes(index.toPath), "text/html; charset=utf-8")
      else serveResource(ex, "/web/index.html", "text/html; charset=utf-8")
    else if path == "/" then
      serveResource(ex, "/web/index.html", "text/html; charset=utf-8")
    else
      json(ex, 404, Json.obj("error" -> Json.str(s"Not found: $path")))

  private def contentTypeFor(name: String): String =
    val lower = name.toLowerCase
    if lower.endsWith(".html") then "text/html; charset=utf-8"
    else if lower.endsWith(".js") || lower.endsWith(".mjs") then "application/javascript; charset=utf-8"
    else if lower.endsWith(".css") then "text/css; charset=utf-8"
    else if lower.endsWith(".json") then "application/json; charset=utf-8"
    else if lower.endsWith(".svg") then "image/svg+xml"
    else if lower.endsWith(".png") then "image/png"
    else if lower.endsWith(".jpg") || lower.endsWith(".jpeg") then "image/jpeg"
    else if lower.endsWith(".woff2") then "font/woff2"
    else if lower.endsWith(".woff") then "font/woff"
    else if lower.endsWith(".ico") then "image/x-icon"
    else "application/octet-stream"
