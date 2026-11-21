package pawcare

import org.scalatest.BeforeAndAfterEach
import org.scalatest.flatspec.AnyFlatSpec
import pawcare.database.DatabaseManager

/** Base trait for service tests: resets the SQLite schema before each test so
  * suites are independent and deterministic. */
trait TestBase extends BeforeAndAfterEach:
  self: AnyFlatSpec =>
  override def beforeEach(): Unit =
    super.beforeEach()
    DatabaseManager.resetForTesting()
