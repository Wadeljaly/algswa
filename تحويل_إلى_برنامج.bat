@echo off
setlocal
title Al-Qaswaa POS Builder
echo ======================================================
echo           القصواء - جاري تحويل النظام إلى برنامج سطح مكتب
echo ======================================================
echo.

REM Check for Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!] خطأ: لم يتم العثور على Node.js. يرجى تثبيته من https://nodejs.org
    pause
    exit /b 1
)

REM Check for node_modules
if not exist "node_modules\" (
    echo [!] جاري تثبيت المكتبات اللازمة (npm install)...
    call npm.cmd install
)

echo [!] جاري بناء النسخة النهائية (Build)...
call npm.cmd run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] حدث خطأ أثناء عملية التحويل. 
    echo [!] إذا كانت الرسالة تشير إلى "UnauthorizedAccess" أو "Running scripts is disabled"،
    echo [!] يرجى تشغيل PowerShell كمسؤول وكتابة الأمر التالي:
    echo [!] Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
    echo.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ======================================================
echo           تمت العملية بنجاح! ستجد البرنامج في مجلد dist
echo ======================================================
echo.
pause
explorer dist
