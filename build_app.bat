@echo off
setlocal
title Al-Qaswaa POS - Final Build
echo ======================================================
echo           القصواء - جاري تحويل النظام إلى برنامج
echo ======================================================
echo.

echo [+] Checking environment...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Error: Node.js is not installed!
    echo [!] Download it from: https://nodejs.org
    pause
    exit /b
)

echo [+] Clearing old builds...
if exist "dist" rd /s /q "dist"

echo [+] Installing missing dependencies (if any)...
call npm install --no-audit

echo [+] Starting the build process...
echo [!] This might take 2-5 minutes depending on your PC.
call npm run build

if %errorlevel% neq 0 (
    echo.
    echo [!] ERROR: Build failed. 
    echo [!] Please make sure no other program is using the 'dist' folder.
    echo [!] Also, ensure your antivirus is not blocking 'electron-builder'.
    echo.
    pause
    exit /b
)

echo.
echo ======================================================
echo           SUCCESS! Build completed.
echo           Check the 'dist' folder for your .exe files.
echo ======================================================
echo.
pause
explorer dist
