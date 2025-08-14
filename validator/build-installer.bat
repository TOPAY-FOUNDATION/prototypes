@echo off
REM TOPAY Validator Windows Installer Build Script (Batch Version)
REM Simple batch file to build the Windows installer

echo.
echo TOPAY Validator Installer Build Script
echo =======================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

echo Node.js detected
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo Error: package.json not found. Please run this script from the validator directory.
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if errorlevel 1 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
    echo Dependencies installed successfully
    echo.
)

REM Build the Windows installer
echo Building Windows installer...
echo This may take a few minutes...
echo.

npm run build:win -- --publish=never
if errorlevel 1 (
    echo Error: Failed to build Windows installer
    pause
    exit /b 1
)

echo.
echo Build completed successfully!
echo.

REM Show results
if exist "dist\*.exe" (
    echo Installer files created in the 'dist' directory:
    dir /b dist\*.exe
    echo.
    echo To install:
    echo 1. Navigate to the 'dist' directory
    echo 2. Right-click on the .exe file and select 'Run as administrator'
    echo 3. Follow the installation wizard
    echo.
) else (
    echo Warning: No installer files found in dist directory
)

echo Press any key to exit...
pause >nul