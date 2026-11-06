@echo off
echo ==========================================================
echo     LIBERTY STUDIO AI – Windows Automatic Setup
echo ==========================================================

echo [1/3] Checking Node.js...
node -v >nul 2>&1
if errorlevel 1 (
    echo Node.js is not found. Please install Node.js v20+ from https://nodejs.org
    pause
    exit /b 1
)

echo [2/3] Installing Studio Dependencies...
call npm install

echo [3/3] Creating Storage Directories...
if not exist "public\storage\uploads" mkdir "public\storage\uploads"
if not exist "public\storage\generations" mkdir "public\storage\generations"
if not exist "public\storage\exports" mkdir "public\storage\exports"
if not exist "public\storage\projects" mkdir "public\storage\projects"

echo ==========================================================
echo Setup Finished successfully!
echo Run start.bat to launch LIBERTY STUDIO AI.
pause
