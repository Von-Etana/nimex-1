# Deploy Firestore Rules Script
# This script helps deploy Firestore security rules to Firebase

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Nimex Firestore Rules Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is installed
$firebaseInstalled = Get-Command firebase -ErrorAction SilentlyContinue

if (-not $firebaseInstalled) {
    Write-Host "Firebase CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g firebase-tools
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install Firebase CLI" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please install manually:" -ForegroundColor Yellow
        Write-Host "  npm install -g firebase-tools" -ForegroundColor White
        Write-Host ""
        Write-Host "Or deploy rules manually via Firebase Console:" -ForegroundColor Yellow
        Write-Host "  1. Go to https://console.firebase.google.com/" -ForegroundColor White
        Write-Host "  2. Select your project" -ForegroundColor White
        Write-Host "  3. Navigate to Firestore Database -> Rules" -ForegroundColor White
        Write-Host "  4. Copy contents from firestore.rules" -ForegroundColor White
        Write-Host "  5. Paste and Publish" -ForegroundColor White
        exit 1
    }
}

Write-Host "Checking Firebase login status..." -ForegroundColor Yellow
firebase login:list

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Not logged in to Firebase. Please login..." -ForegroundColor Yellow
    firebase login
}

Write-Host ""
Write-Host "Deploying Firestore security rules..." -ForegroundColor Yellow
firebase deploy --only firestore:rules

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Rules deployed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now test vendor signup without permission errors." -ForegroundColor Green
}
else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  Deployment failed!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please deploy manually via Firebase Console:" -ForegroundColor Yellow
    Write-Host "  1. Go to https://console.firebase.google.com/" -ForegroundColor White
    Write-Host "  2. Select your project" -ForegroundColor White
    Write-Host "  3. Navigate to Firestore Database -> Rules" -ForegroundColor White
    Write-Host "  4. Copy contents from firestore.rules" -ForegroundColor White
    Write-Host "  5. Paste and Publish" -ForegroundColor White
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
