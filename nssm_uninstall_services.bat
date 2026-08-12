@echo off
TITLE Uninstall NSFA Windows Service via NSSM
COLOR 0C
cls

echo =========================================================================
echo   إزالة خدمة منظومة الجهاز الوطني للقوى المساندة (NSSM)
echo =========================================================================
echo.

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] This script must be run as Administrator!
    pause
    exit /b 1
)

set SERVICE_NAME=NSFA-Apparatus

where nssm >nul 2>&1
if %errorlevel% neq 0 (
    if not exist "nssm.exe" (
        set NSSM_CMD=nssm.exe
    )
) else (
    set NSSM_CMD=nssm
)

echo Stopping service %SERVICE_NAME% ...
%NSSM_CMD% stop %SERVICE_NAME%

echo Removing service %SERVICE_NAME% ...
%NSSM_CMD% remove %SERVICE_NAME% confirm

echo.
echo [SUCCESS] Windows Service removed successfully.
echo.
pause
