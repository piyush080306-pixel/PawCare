package pawcare.ui

import scala.io.StdIn

/** Small utilities for reading validated console input. */
object ConsoleInput:

  /** Reads a non-empty trimmed line, reprompting on empty input. */
  def readLine(prompt: String): String =
    print(prompt)
    val raw = StdIn.readLine()
    if raw == null then ""
    else
      val trimmed = raw.trim
      if trimmed.nonEmpty then trimmed
      else
        println("Input cannot be empty. Please try again.")
        readLine(prompt)

  /** Reads an integer, reprompting on invalid input. */
  def readInt(prompt: String): Int =
    val raw = readLine(prompt)
    try raw.toInt
    catch
      case _: NumberFormatException =>
        println(s"'$raw' is not a valid integer. Please try again.")
        readInt(prompt)

  /** Reads an integer, returning None on empty input (for optional fields). */
  def readIntOptional(prompt: String): Option[Int] =
    print(prompt)
    val raw = StdIn.readLine()
    if raw == null || raw.trim.isEmpty then None
    else
      try Some(raw.trim.toInt)
      catch
        case _: NumberFormatException =>
          println(s"'${raw.trim}' is not a valid integer. Treating as empty.")
          None

  /** Reads a double, reprompting on invalid input. */
  def readDouble(prompt: String): Double =
    val raw = readLine(prompt)
    try raw.toDouble
    catch
      case _: NumberFormatException =>
        println(s"'$raw' is not a valid number. Please try again.")
        readDouble(prompt)

  /** Reads a yes/no answer. */
  def readYesNo(prompt: String): Boolean =
    val raw = readLine(prompt + " (y/n): ").toLowerCase
    raw == "y" || raw == "yes"

  /** Reads a menu choice in the range 1..max, reprompting otherwise. */
  def readMenuChoice(max: Int): Int =
    val raw = readLine("Enter your choice: ")
    try
      val n = raw.toInt
      if n >= 1 && n <= max then n
      else
        println(s"Please enter a number between 1 and $max.")
        readMenuChoice(max)
    catch
      case _: NumberFormatException =>
        println(s"'$raw' is not a valid choice.")
        readMenuChoice(max)
