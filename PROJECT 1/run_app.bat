@echo off
title MedVitals Desktop Launcher
color 0b
echo =====================================================================
echo               MEDVITALS DESKTOP APPLICATION LAUNCHER
echo =====================================================================
echo.

:: Check for Node.js installation
node -v >nul 2>&1
if %errorlevel% neq 0 (
    color 0c
    echo [ERROR] Node.js is NOT installed on this computer!
    echo.
    echo Node.js is required to download Electron and run this desktop app.
    echo.
    echo Please follow these steps to run the application:
    echo 1. Download Node.js from: https://nodejs.org/
    echo 2. Run the installer (choose the recommended LTS version).
    echo 3. Once installed, double-click this "run_app.bat" file again!
    echo.
    echo ---------------------------------------------------------------------
    echo ALTERNATIVE: You can still open the web app immediately without Node:
    echo -- Double-click the "index.html" file in this folder!
    echo ---------------------------------------------------------------------
    echo.
    pause
    exit /b 1
)

:: Install dependencies if not present
if not exist node_modules (
    echo [INFO] First-time setup: Installing Electron dependencies...
    echo Please wait, this might take a minute depending on your connection...
    call npm install
    if %errorlevel% neq 0 (
        color 0c
        echo [ERROR] npm install failed. Please check your internet connection and try again.
        pause
        exit /b 1
    )
)

echo.
echo [SUCCESS] Starting MedVitals Desktop Application...
echo The GUI window will open shortly. Do not close this terminal window.
echo.
npm start
