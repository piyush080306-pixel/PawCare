ThisBuild / scalaVersion := "3.3.1"
ThisBuild / organization := "pawcare"
ThisBuild / version := "1.0.0"

lazy val root = (project in file("."))
  .settings(
    name := "pawcare",
    libraryDependencies ++= Seq(
      "org.xerial" % "sqlite-jdbc" % "3.42.0.0",
      "org.scalatest" %% "scalatest" % "3.2.17" % Test
    ),
    scalacOptions ++= Seq(
      "-deprecation",
      "-feature",
      "-unchecked"
    ),
    Compile / mainClass := Some("pawcare.Main"),
    fork := false,
    Test / parallelExecution := false
  )
