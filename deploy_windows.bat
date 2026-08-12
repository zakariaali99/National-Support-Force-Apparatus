@echo off
TITLE National Support Force Apparatus - Windows One-Click Deployment
COLOR 0A
cls

echo =========================================================================
echo   الجهاز الوطني للقوى المساندة — منظومة التوثيق وإدارة شؤون الأفراد
echo   Windows One-Click Automated Deployment Script
echo =========================================================================
echo.

REM 1. Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH! Please install Python 3.11+ first.
    pause
    exit /b 1
)

REM 2. Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH! Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo [1/4] Setting up Python Virtual Environment (backend/venv)...
if not exist "backend\venv" (
    python -m venv backend\venv
)
call backend\venv\Scripts\activate.bat

echo.
echo [2/4] Installing Backend Dependencies (requirements.txt + Waitress)...
pip install --upgrade pip
pip install -r backend\requirements.txt

echo.
echo [3/4] Building Frontend SPA Application (frontend/dist)...
cd frontend
call npm install
call npm run build
cd ..

echo.
echo [4/4] Setting up Database and Migrations...
set DJANGO_SETTINGS_MODULE=config.settings.windows
python backend\manage.py migrate --noinput
python backend\manage.py seed_system

echo.
echo =========================================================================
echo   [SUCCESS] Deployment build completed successfully!
echo   To install as a Windows Background Service using NSSM, run:
echo   nssm_install_services.bat
echo =========================================================================
echo.
pause
