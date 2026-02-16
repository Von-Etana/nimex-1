# Firebase Deployment Script for Nimex E-commerce Platform
# Run this script to deploy security rules and indexes

Write-Host "🚀 Nimex Firebase Deployment Script" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

# Check if Firebase CLI is installed
Write-Host "Checking Firebase CLI..." -ForegroundColor Yellow
try {
    $firebaseVersion = firebase --version 2>&1
    Write-Host "✅ Firebase CLI installed: $firebaseVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Firebase CLI not found!" -ForegroundColor Red
    Write-Host "Installing Firebase CLI..." -ForegroundColor Yellow
    npm install -g firebase-tools
}

Write-Host "`n"

# Check if user is logged in
Write-Host "Checking Firebase authentication..." -ForegroundColor Yellow
$loginCheck = firebase projects:list 2>&1
if ($loginCheck -like "*not logged in*" -or $loginCheck -like "*error*") {
    Write-Host "⚠️  Not logged in to Firebase" -ForegroundColor Yellow
    Write-Host "Opening browser for login..." -ForegroundColor Yellow
    firebase login
}
else {
    Write-Host "✅ Already logged in to Firebase" -ForegroundColor Green
}

Write-Host "`n"

# Deploy security rules
Write-Host "📋 Deploying Firestore Security Rules..." -ForegroundColor Yellow
firebase deploy --only firestore:rules

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Firestore rules deployed successfully!" -ForegroundColor Green
}
else {
    Write-Host "❌ Failed to deploy Firestore rules" -ForegroundColor Red
    exit 1
}

Write-Host "`n"

# Deploy storage rules
Write-Host "📋 Deploying Storage Security Rules..." -ForegroundColor Yellow
firebase deploy --only storage:rules

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Storage rules deployed successfully!" -ForegroundColor Green
}
else {
    Write-Host "❌ Failed to deploy Storage rules" -ForegroundColor Red
    exit 1
}

Write-Host "`n"

# Deploy indexes
Write-Host "📋 Deploying Firestore Indexes..." -ForegroundColor Yellow
firebase deploy --only firestore:indexes

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Firestore indexes deployed successfully!" -ForegroundColor Green
    Write-Host "⏳ Note: Indexes may take a few minutes to build" -ForegroundColor Yellow
}
else {
    Write-Host "❌ Failed to deploy Firestore indexes" -ForegroundColor Red
    exit 1
}

Write-Host "`n"
Write-Host "====================================`n" -ForegroundColor Cyan
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "1. Enable Firebase services in console (if not done)" -ForegroundColor White
Write-Host "2. Test your application: npm run dev" -ForegroundColor White
Write-Host "3. Implement search service (Algolia/Typesense)" -ForegroundColor White
Write-Host "4. Complete testing checklist" -ForegroundColor White
Write-Host "5. Deploy to production: firebase deploy --only hosting`n" -ForegroundColor White

Write-Host "Firebase Console: https://console.firebase.google.com/project/nimex-ecommerce" -ForegroundColor Cyan
Write-Host "`n"
