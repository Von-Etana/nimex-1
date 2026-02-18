@echo off
echo Deploying Firestore Rules...
call firebase deploy --only firestore:rules
pause
