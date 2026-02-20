@echo off
echo ==========================================
echo       Firebase CLI Setup Helper
echo ==========================================
echo.
echo This script helps you log in to Firebase and configure the project.
echo It uses 'call firebase' to bypass PowerShell execution policy issues.
echo.

echo 1. Checking Firebase Login Status...
call firebase login:list
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Not logged in. Starting login process...
    call firebase login
) else (
    echo.
    echo Already logged in (or list failed, verifying with login...)
    call firebase login
)

echo.
echo 2. Setting default project...
call firebase use default

echo.
echo ==========================================
echo       Configuration Complete!
echo ==========================================
pause
