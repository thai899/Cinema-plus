@echo off
chcp 65001 > nul
echo ============================================================
echo   CINEMA PLUS - BACKUP DATABASE MONGODB ^& REDIS
echo ============================================================

set BACKUP_DIR=D:\backup
set MONGO_DB=CinemaPlusReviews
set MONGO_HOST=localhost
set MONGO_PORT=27017

echo 1. Tao thu muc sao luu tai %BACKUP_DIR%...
if not exist "%BACKUP_DIR%\mongodb" mkdir "%BACKUP_DIR%\mongodb"
if not exist "%BACKUP_DIR%\redis" mkdir "%BACKUP_DIR%\redis"
if not exist "%BACKUP_DIR%\sqlserver" mkdir "%BACKUP_DIR%\sqlserver"

echo 2. Dang sao luu MongoDB (%MONGO_DB%)...
mongodump --host=%MONGO_HOST% --port=%MONGO_PORT% --db=%MONGO_DB% --out="%BACKUP_DIR%\mongodb"
if %ERRORLEVEL% EQU 0 (
    echo    ^=^> MongoDB Backup thanh cong!
) else (
    echo    ^=^> Luu y: Kiem tra dich vu mongod hoac cai dat mongodump.
)

echo 3. Dang kich hoat luu Snapshot Redis (BGSAVE)...
redis-cli bgsave
if %ERRORLEVEL% EQU 0 (
    echo    ^=^> Redis Snapshot da duoc yeu cau luu background!
) else (
    echo    ^=^> Luu y: Kiem tra dich vu Redis dang chay tren may.
)

echo ============================================================
echo   HOAN TAT! File luu tai: %BACKUP_DIR%
echo ============================================================
pause
