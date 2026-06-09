#!/usr/bin/env node

/**
 * API Key Testing Script
 * Run with: npx tsx src/test-api-keys.ts
 */

import { config } from 'dotenv';
config({ path: '.env', override: true }); // Load .env file

// Debug: Check if env vars are loaded
console.log('🔧 Environment Variables Check:');
console.log('VITE_CLERK_PUBLISHABLE_KEY:', process.env.VITE_CLERK_PUBLISHABLE_KEY ? 'Present' : 'Missing');
console.log('');

// Set global environment variables for the entire process
process.env.VITE_CLERK_PUBLISHABLE_KEY = process.env.VITE_CLERK_PUBLISHABLE_KEY || '';
process.env.VITE_TWILIO_ACCOUNT_SID = process.env.VITE_TWILIO_ACCOUNT_SID || '';
process.env.VITE_TWILIO_API_KEY = process.env.VITE_TWILIO_API_KEY || '';
process.env.VITE_TWILIO_API_SECRET = process.env.VITE_TWILIO_API_SECRET || '';
process.env.VITE_TWILIO_PHONE_NUMBER = process.env.VITE_TWILIO_PHONE_NUMBER || '';

import { apiKeyTester } from './services/apiKeyTester';
import { databaseTester } from './services/databaseTester';

async function main() {
  console.log('🔍 Testing NIMEX Platform Infrastructure\n');
  console.log('=' .repeat(60));

  try {
    // Test API Keys
    console.log('🔑 TESTING API KEYS');
    console.log('='.repeat(30));
    const { results: apiResults, summary: apiSummary } = await apiKeyTester.runComprehensiveTest();

    apiResults.forEach(result => {
      console.log(`\n📋 ${result.service.toUpperCase()}`);
      console.log('-'.repeat(20));

      switch (result.status) {
        case 'success':
          console.log('✅ STATUS: Working');
          if (result.details) {
            console.log('📊 DETAILS:', JSON.stringify(result.details, null, 2));
          }
          break;

        case 'failed':
          console.log('❌ STATUS: Failed');
          console.log('🚨 ERROR:', result.error);
          if (result.details) {
            console.log('📊 DETAILS:', JSON.stringify(result.details, null, 2));
          }
          break;

        case 'missing_config':
          console.log('⚠️  STATUS: Missing Configuration');
          console.log('🚨 ERROR:', result.error);
          break;
      }
    });

    // Test Database
    console.log('\n\n🗄️  TESTING DATABASE CONNECTIVITY');
    console.log('='.repeat(35));
    const { connection, tables, summary: dbSummary } = await databaseTester.runComprehensiveTest();

    console.log('\n🔌 DATABASE CONNECTION');
    console.log('-'.repeat(22));
    if (connection.connected) {
      console.log('✅ STATUS: Connected');
    } else {
      console.log('❌ STATUS: Failed');
      console.log('🚨 ERROR:', connection.error);
    }

    console.log('\n📋 DATABASE TABLES');
    console.log('-'.repeat(18));
    tables.forEach(table => {
      const status = table.status === 'success' ? '✅' : table.status === 'empty' ? '📭' : '❌';
      console.log(`${status} ${table.table}: ${table.status}${table.recordCount !== undefined ? ` (${table.recordCount} records)` : ''}`);
      if (table.error) {
        console.log(`   🚨 ${table.error}`);
      }
    });

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 INFRASTRUCTURE SUMMARY');
    console.log('='.repeat(60));

    console.log('🔑 API KEYS:');
    console.log(`   Total: ${apiSummary.total}, ✅ Working: ${apiSummary.successful}, ❌ Failed: ${apiSummary.failed}, ⚠️ Missing: ${apiSummary.missing}`);

    console.log('🗄️  DATABASE:');
    console.log(`   Connection: ${connection.connected ? '✅ Connected' : '❌ Failed'}`);
    console.log(`   Tables: Total ${dbSummary.total}, ✅ Working: ${dbSummary.successful}, 📭 Empty: ${dbSummary.empty}, ❌ Failed: ${dbSummary.failed}`);

    const hasIssues = !connection.connected || apiSummary.failed > 0 || apiSummary.missing > 0 || dbSummary.failed > 0;

    if (hasIssues) {
      console.log('\n🚨 ISSUES FOUND - Check your configuration');
      process.exit(1);
    } else {
      console.log('\n🎉 ALL SYSTEMS OPERATIONAL!');
      process.exit(0);
    }

  } catch (error) {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  }
}

main();