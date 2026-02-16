@echo off
echo ==========================================
echo NIMEX: Cloud Functions Deployment Script
echo ==========================================
echo.
echo This script will deploy:
echo 1. Termii SMS Integration
echo 2. Paystack Webhook & Escrow Logic
echo 3. GIGL Logistics API Integration
echo.

echo 1. Logging into Firebase...
call firebase login
if %errorlevel% neq 0 (
    echo Login failed or was cancelled. Exiting.
    pause
    exit /b %errorlevel%
)

echo.
echo 2. Deploying Functions...
cd functions
echo Deploying: sendTermiiSms, paystackWebhook, releaseEscrow
echo            getGiglShippingQuote, createGiglShipment, trackGiglShipment, getGiglServiceAreas
echo.
call firebase deploy --only functions:sendTermiiSms,functions:paystackWebhook,functions:releaseEscrow,functions:getGiglShippingQuote,functions:createGiglShipment,functions:trackGiglShipment,functions:getGiglServiceAreas

if %errorlevel% neq 0 (
    echo.
    echo Deployment failed. Please check the errors above.
) else (
    echo.
    echo ==========================================
    echo Deployment Successful!
    echo ==========================================
)

pause
