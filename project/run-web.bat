@echo off
cd /d "%~dp0"
echo.
echo   Starting PawCare web UI...
echo   Open http://localhost:8080 in your browser once the server is ready.
echo   Press Ctrl+C to stop the server.
echo.
sbt "runMain pawcare.web.WebMain"
pause
