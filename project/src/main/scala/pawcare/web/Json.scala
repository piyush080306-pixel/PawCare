package pawcare.web

import scala.collection.mutable

/** Tiny JSON helpers: just enough to build flat responses and read the flat
  * request bodies posted by the browser. Keeps the project dependency-free.
  */
object Json:

  def escape(s: String): String =
    val sb = new StringBuilder
    s.foreach {
      case '"'  => sb.append("\\\"")
      case '\\' => sb.append("\\\\")
      case '\n' => sb.append("\\n")
      case '\r' => sb.append("\\r")
      case '\t' => sb.append("\\t")
      case c if c < ' ' => sb.append(f"\\u${c.toInt}%04x")
      case c => sb.append(c)
    }
    sb.toString

  def str(s: String): String = "\"" + escape(s) + "\""
  def num(n: Int): String = n.toString
  def num(n: Double): String = if n.isWhole then n.toLong.toString else n.toString
  def bool(b: Boolean): String = b.toString
  def optStr(o: Option[String]): String = o.map(str).getOrElse("null")

  def obj(fields: (String, String)*): String =
    fields.map { case (k, v) => str(k) + ":" + v }.mkString("{", ",", "}")

  def arr(items: Seq[String]): String = items.mkString("[", ",", "]")

  /** Parses a flat JSON object. Nested objects/arrays are skipped, `null`
    * becomes an empty string; numbers and booleans are returned as literals.
    */
  def parseObject(raw: String): Map[String, String] =
    Parser(raw).parseObject()

  private final class Parser(s: String):
    private var i = 0

    private def ws(): Unit = while i < s.length && s.charAt(i).isWhitespace do i += 1

    private def expect(c: Char): Unit =
      ws()
      if i >= s.length || s.charAt(i) != c then
        throw IllegalArgumentException(s"Invalid JSON: expected '$c' at position $i")
      i += 1

    def parseObject(): Map[String, String] =
      val fields = mutable.LinkedHashMap.empty[String, String]
      expect('{')
      ws()
      if i < s.length && s.charAt(i) == '}' then
        i += 1
        return fields.toMap
      var done = false
      while !done do
        ws()
        val key = parseString()
        expect(':')
        ws()
        fields += (key -> parseValue())
        ws()
        if i < s.length && s.charAt(i) == ',' then i += 1
        else
          expect('}')
          done = true
      fields.toMap

    private def parseValue(): String =
      ws()
      if i >= s.length then throw IllegalArgumentException("Invalid JSON: unexpected end")
      s.charAt(i) match
        case '"' => parseString()
        case '{' => skipNested('{', '}'); ""
        case '[' => skipNested('[', ']'); ""
        case _ =>
          val start = i
          while i < s.length && !",}] \t\r\n".contains(s.charAt(i)) do i += 1
          val raw = s.substring(start, i)
          if raw == "null" then "" else raw

    private def skipNested(open: Char, close: Char): Unit =
      var depth = 0
      while i < s.length do
        val c = s.charAt(i)
        if c == open then depth += 1
        else if c == close then
          depth -= 1
          if depth == 0 then
            i += 1
            return
        i += 1
      throw IllegalArgumentException("Invalid JSON: unbalanced value")

    private def parseString(): String =
      expect('"')
      val sb = new StringBuilder
      while i < s.length && s.charAt(i) != '"' do
        val c = s.charAt(i)
        if c == '\\' then
          i += 1
          if i >= s.length then throw IllegalArgumentException("Invalid JSON: bad escape")
          s.charAt(i) match
            case '"'  => sb.append('"')
            case '\\' => sb.append('\\')
            case '/'  => sb.append('/')
            case 'n'  => sb.append('\n')
            case 'r'  => sb.append('\r')
            case 't'  => sb.append('\t')
            case 'b'  => sb.append('\b')
            case 'f'  => sb.append('\f')
            case 'u' =>
              if i + 4 >= s.length then throw IllegalArgumentException("Invalid JSON: bad unicode escape")
              sb.append(Integer.parseInt(s.substring(i + 1, i + 5), 16).toChar)
              i += 4
            case other => sb.append(other)
        else sb.append(c)
        i += 1
      if i >= s.length then throw IllegalArgumentException("Invalid JSON: unterminated string")
      i += 1
      sb.toString
