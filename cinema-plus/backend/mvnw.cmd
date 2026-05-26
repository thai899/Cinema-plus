@echo off
REM Apache Maven Wrapper (Windows)
SETLOCAL
SET "BASE_DIR=%~dp0"
SET "WRAPPER_JAR=%BASE_DIR%\.mvn\wrapper\maven-wrapper.jar"
IF EXIST "%WRAPPER_JAR%" (
  "%JAVA_HOME%\bin\java" -jar "%WRAPPER_JAR%" %*
) ELSE (
  echo WARNING: maven-wrapper.jar not found in .mvn\wrapper — falling back to system mvn
  mvn %*
)
ENDLOCAL
