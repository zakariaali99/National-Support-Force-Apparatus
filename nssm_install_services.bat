@echo off
TITLE Install NSFA System Windows Service via NSSM
COLOR 0B
cls

echo =========================================================================
echo   الجهاز الوطني للقوى المساندة — تثبيت الخدمة على نظام ويندوز (NSSM)
echo =========================================================================
echo.

REM Check Administrator privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] This script must be run as Administrator!
    echo Right-click nssm_install_services.bat and select "Run as administrator".
    pause
    exit /b 1
)

REM Set Current Working Directory
set BASE_DIR=%CD%
set SERVICE_NAME=NSFA-Apparatus
set PYTHON_EXE=%BASE_DIR%\backend\venv\Scripts\python.exe
set SERVE_SCRIPT=%BASE_DIR%\backend\serve_windows.py
set LOGS_DIR=%BASE_DIR%\logs

if not exist "%LOGS_DIR%" (
    mkdir "%LOGS_DIR%"
)

REM Check if NSSM is available in PATH or current directory
where nssm >nul 2>&1
if %errorlevel% neq 0 (
    if not exist "nssm.exe" (
        echo [ERROR] nssm.exe not found!
        echo Please download NSSM from https://nssm.cc/download and place nssm.exe in this folder or in System PATH.
        pause
        exit /b 1
    )
    set NSSM_CMD=nssm.exe
) else (
    set NSSM_CMD=nssm
)

echo [1/3] Removing old service instance if exists...
%NSSM_CMD% stop %SERVICE_NAME% >nul 2>&1
%NSSM_CMD% remove %SERVICE_NAME% confirm >nul 2>&1

echo.
echo [2/3] Installing Windows Service: %SERVICE_NAME% ...
%NSSM_CMD% install %SERVICE_NAME% "%PYTHON_EXE%" "%SERVE_SCRIPT%"
%NSSM_CMD% set %SERVICE_NAME% AppDirectory "%BASE_DIR%\backend"
%NSSM_CMD% set %SERVICE_NAME% AppStdout "%LOGS_DIR%\nssm_stdout.log"
%NSSM_CMD% set %SERVICE_NAME% AppStderr "%LOGS_DIR%\nssm_stderr.log"
%NSSM_CMD% set %SERVICE_NAME% Start SERVICE_AUTO_START
%NSSM_CMD% set %SERVICE_NAME% AppEnvironmentExtra "DJANGO_SETTINGS_MODULE=config.settings.windows" "PORT=8000"

echo.
echo [3/3] Starting Service %SERVICE_NAME% ...
%NSSM_CMD% start %SERVICE_NAME%

echo.
echo =========================================================================
echo   [SUCCESS] Service %SERVICE_NAME% installed and started successfully!
echo.
echo   System Access Link: http://localhost:8000
echo   Service Logs Location: %LOGS_DIR%
echo =========================================================================
echo.
pause
