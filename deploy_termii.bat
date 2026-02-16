@echo off
echo ==========================================
echo NIMEX: Termii Integration Deployment Script
echo ==========================================
echo.
echo 1. Logging into Firebase...
call firebase login
if %errorlevel% neq 0 (
    echo Login failed or was cancelled. Exiting.
    pause
    exit /b %errorlevel%
)

echo.
echo 2. Setting Termii Configuration (if needed)...
echo Please ensure you have set your Termii API keys securely using:
echo firebase functions:config:set termii.api_key="YOUR_KEY" ...
echo.

echo 3. Deploying Functions...
cd functions
call firebase deploy --only functions:sendTermiiSms,functions:paystackWebhook,functions:releaseEscrow

if %errorlevel% neq 0 (
    echo Deployment failed. Please check the errors above.
) else (
    echo.
    echo ==========================================
    echo Deployment Successful!
    echo ==========================================
)

pause
