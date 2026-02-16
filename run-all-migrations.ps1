# ============================================================================
# NIMEX Database Migration Script
# ============================================================================
# This script runs all Supabase migrations in the correct order
# 
# Prerequisites:
# - Supabase CLI installed (npm install -g supabase)
# OR
# - PostgreSQL client (psql) installed
#
# Usage:
# .\run-all-migrations.ps1
# ============================================================================

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "NIMEX E-COMMERCE PLATFORM - DATABASE MIGRATION" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$SUPABASE_PROJECT_REF = "frlayqbmnpmjtwxrweke"
$SUPABASE_HOST = "db.frlayqbmnpmjtwxrweke.supabase.co"
$SUPABASE_PORT = "5432"
$SUPABASE_DB = "postgres"
$SUPABASE_USER = "postgres"
$SUPABASE_PASSWORD = "@Nimex.online!#@123"

# Migration files in order (excluding duplicates)
$migrations = @(
    "20251105095128_complete_production_schema.sql",
    "20251105095252_admin_roles_analytics_tables.sql",
    "20251022173018_create_chat_system.sql",
    "20251022180653_create_ads_management_system.sql",
    "20251023120000_create_escrow_delivery_system.sql",
    "20251024070431_create_market_locations_and_product_tags.sql",
    "20251025020000_add_flutterwave_vendor_wallets.sql",
    "20251105105227_create_referral_commission_system.sql",
    "20251103081200_fix_profiles_rls_policy.sql",
    "20251111131500_update_admin_role.sql",
    "20251119100000_add_vendor_preferences.sql",
    "20251123120000_create_cart_tables.sql",
    "20251126000000_marketer_dashboard_sync.sql",
    "20251023000000_create_demo_accounts.sql"
)

$migrationsPath = ".\supabase\migrations"

Write-Host "Checking migration files..." -ForegroundColor Yellow
Write-Host ""

# Check if all migration files exist
$missingFiles = @()
foreach ($migration in $migrations) {
    $filePath = Join-Path $migrationsPath $migration
    if (-not (Test-Path $filePath)) {
        $missingFiles += $migration
        Write-Host "❌ Missing: $migration" -ForegroundColor Red
    } else {
        Write-Host "✅ Found: $migration" -ForegroundColor Green
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "ERROR: Some migration files are missing!" -ForegroundColor Red
    Write-Host "Please ensure all migration files are in the migrations folder." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "MIGRATION OPTIONS" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Choose migration method:" -ForegroundColor Yellow
Write-Host "1. Use Supabase CLI (Recommended)" -ForegroundColor White
Write-Host "2. Use PostgreSQL client (psql)" -ForegroundColor White
Write-Host "3. Generate combined SQL file for manual execution" -ForegroundColor White
Write-Host "4. Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Using Supabase CLI..." -ForegroundColor Cyan
        Write-Host ""
        
        # Check if Supabase CLI is installed
        $supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue
        
        if (-not $supabaseInstalled) {
            Write-Host "❌ Supabase CLI is not installed!" -ForegroundColor Red
            Write-Host ""
            Write-Host "Install with: npm install -g supabase" -ForegroundColor Yellow
            Write-Host "Then run: supabase link --project-ref $SUPABASE_PROJECT_REF" -ForegroundColor Yellow
            exit 1
        }
        
        Write-Host "Linking to Supabase project..." -ForegroundColor Yellow
        supabase link --project-ref $SUPABASE_PROJECT_REF
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "Pushing migrations to Supabase..." -ForegroundColor Yellow
            supabase db push
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "✅ All migrations completed successfully!" -ForegroundColor Green
            } else {
                Write-Host ""
                Write-Host "❌ Migration failed!" -ForegroundColor Red
                exit 1
            }
        } else {
            Write-Host ""
            Write-Host "❌ Failed to link to Supabase project!" -ForegroundColor Red
            exit 1
        }
    }
    
    "2" {
        Write-Host ""
        Write-Host "Using PostgreSQL client (psql)..." -ForegroundColor Cyan
        Write-Host ""
        
        # Check if psql is installed
        $psqlInstalled = Get-Command psql -ErrorAction SilentlyContinue
        
        if (-not $psqlInstalled) {
            Write-Host "❌ PostgreSQL client (psql) is not installed!" -ForegroundColor Red
            Write-Host ""
            Write-Host "Please install PostgreSQL or use option 1 (Supabase CLI) or option 3 (Manual)" -ForegroundColor Yellow
            exit 1
        }
        
        # Set password environment variable
        $env:PGPASSWORD = $SUPABASE_PASSWORD
        
        Write-Host "Running migrations in order..." -ForegroundColor Yellow
        Write-Host ""
        
        $successCount = 0
        $failCount = 0
        
        foreach ($migration in $migrations) {
            $filePath = Join-Path $migrationsPath $migration
            
            Write-Host "Running: $migration" -ForegroundColor Cyan
            
            psql -h $SUPABASE_HOST -U $SUPABASE_USER -d $SUPABASE_DB -p $SUPABASE_PORT -f $filePath
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Success: $migration" -ForegroundColor Green
                $successCount++
            } else {
                Write-Host "❌ Failed: $migration" -ForegroundColor Red
                $failCount++
                
                $continue = Read-Host "Continue with next migration? (y/n)"
                if ($continue -ne "y") {
                    Write-Host ""
                    Write-Host "Migration stopped by user." -ForegroundColor Yellow
                    exit 1
                }
            }
            
            Write-Host ""
        }
        
        Write-Host "============================================================================" -ForegroundColor Cyan
        Write-Host "MIGRATION SUMMARY" -ForegroundColor Cyan
        Write-Host "============================================================================" -ForegroundColor Cyan
        Write-Host "✅ Successful: $successCount" -ForegroundColor Green
        Write-Host "❌ Failed: $failCount" -ForegroundColor Red
        Write-Host ""
        
        if ($failCount -eq 0) {
            Write-Host "All migrations completed successfully!" -ForegroundColor Green
        } else {
            Write-Host "Some migrations failed. Please check the errors above." -ForegroundColor Yellow
        }
    }
    
    "3" {
        Write-Host ""
        Write-Host "Generating combined SQL file..." -ForegroundColor Cyan
        Write-Host ""
        
        $outputFile = ".\supabase\ALL_MIGRATIONS_COMBINED.sql"
        
        # Create header
        $header = @"
-- ============================================================================
-- NIMEX E-COMMERCE PLATFORM - COMBINED MIGRATIONS
-- ============================================================================
-- Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- 
-- This file contains all migrations combined in the correct order.
-- Run this in Supabase SQL Editor to set up the complete database.
-- 
-- IMPORTANT: This is a large file. Your SQL editor may have size limits.
-- If you encounter issues, run individual migration files instead.
-- ============================================================================

"@
        
        Set-Content -Path $outputFile -Value $header
        
        foreach ($migration in $migrations) {
            $filePath = Join-Path $migrationsPath $migration
            
            Write-Host "Adding: $migration" -ForegroundColor Yellow
            
            $separator = @"

-- ============================================================================
-- MIGRATION: $migration
-- ============================================================================

"@
            
            Add-Content -Path $outputFile -Value $separator
            
            $content = Get-Content -Path $filePath -Raw
            Add-Content -Path $outputFile -Value $content
        }
        
        $footer = @"

-- ============================================================================
-- END OF COMBINED MIGRATIONS
-- ============================================================================
-- All migrations have been combined.
-- Run this file in Supabase SQL Editor to apply all changes.
-- ============================================================================
"@
        
        Add-Content -Path $outputFile -Value $footer
        
        Write-Host ""
        Write-Host "✅ Combined SQL file created: $outputFile" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Open Supabase Dashboard → SQL Editor" -ForegroundColor White
        Write-Host "2. Copy the contents of: $outputFile" -ForegroundColor White
        Write-Host "3. Paste into SQL Editor" -ForegroundColor White
        Write-Host "4. Click 'Run' or press Ctrl+Enter" -ForegroundColor White
        Write-Host ""
        Write-Host "Note: The file may be large. Consider running migrations individually if you encounter issues." -ForegroundColor Yellow
    }
    
    "4" {
        Write-Host ""
        Write-Host "Exiting..." -ForegroundColor Yellow
        exit 0
    }
    
    default {
        Write-Host ""
        Write-Host "Invalid choice. Exiting..." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "VERIFICATION" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To verify the migration, run these queries in Supabase SQL Editor:" -ForegroundColor Yellow
Write-Host ""
Write-Host "-- Check tables" -ForegroundColor Gray
Write-Host "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';" -ForegroundColor Gray
Write-Host ""
Write-Host "-- Check admin accounts" -ForegroundColor Gray
Write-Host "SELECT email, role FROM profiles WHERE role = 'admin';" -ForegroundColor Gray
Write-Host ""
Write-Host "-- Check demo accounts" -ForegroundColor Gray
Write-Host "SELECT email, role FROM profiles WHERE email LIKE '%demo%';" -ForegroundColor Gray
Write-Host ""

Write-Host "Migration process complete!" -ForegroundColor Green
Write-Host ""
