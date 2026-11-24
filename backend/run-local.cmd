@echo off
setlocal
cd /d "%~dp0"
set "SPRING_PROFILES_ACTIVE=local"
java -jar "target\finco-backend-1.0.0.jar"
