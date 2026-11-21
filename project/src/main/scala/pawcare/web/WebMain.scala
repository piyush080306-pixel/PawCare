package pawcare.web

import pawcare.DataSeeder
import pawcare.database.DatabaseManager
import pawcare.services.*
import java.util.concurrent.CountDownLatch

/** Entry point for the browser version of PawCare.
  *
  * Run with:  sbt "runMain pawcare.web.WebMain"
  * Optionally: sbt "runMain pawcare.web.WebMain 9090"
  */
object WebMain:

  def main(args: Array[String]): Unit =
    // Force schema initialisation before any request arrives.
    DatabaseManager.getConnection.close()

    val animalService = AnimalService()
    val staffService = StaffService()
    val adoptionService = AdoptionService()
    val healthService = HealthService()
    val reportService =
      ReportService(animalService, staffService, adoptionService, healthService)

    DataSeeder.seedIfEmpty(animalService, staffService, healthService)

    val requestedPort = args.headOption
      .flatMap(_.toIntOption)
      .orElse(sys.env.get("PAWCARE_PORT").flatMap(_.toIntOption))
      .getOrElse(8080)

    val server = WebServer.start(
      animalService, staffService, adoptionService, healthService, reportService, requestedPort)

    val port = server.getAddress.getPort
    println("=" * 60)
    println(s"  PawCare web UI is running at  http://localhost:$port")
    println("  Press Ctrl+C to stop.")
    println("=" * 60)

    Runtime.getRuntime.addShutdownHook(new Thread(() => server.stop(0)))
    new CountDownLatch(1).await()
