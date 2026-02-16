#!/usr/bin/env node

/**
 * Firebase Migration - Batch Replacement Script
 * 
 * This script performs systematic replacements across all remaining screens
 * to migrate from Supabase to Firebase.
 */

const fs = require('fs');
const path = require('path');

// Files to migrate
const filesToMigrate = [
    'src/screens/VendorsScreen.tsx',
    'src/screens/OrdersScreen.tsx',
    'src/screens/OrderTrackingScreen.tsx',
    'src/screens/ChatScreen.tsx',
    'src/screens/NotificationsScreen.tsx',
    'src/screens/SupportScreen.tsx',
    'src/screens/FrameScreen/sections/RecommendationsSection/RecommendationsSection.tsx',
    'src/screens/vendor/CreateProductScreen.tsx',
    'src/screens/vendor/DeliveryManagementScreen.tsx',
    'src/screens/vendor/EscrowDashboardScreen.tsx',
    'src/screens/marketer/MarketerDashboardScreen.tsx',
    'src/screens/admin/AdminDashboardScreen.tsx',
    'src/screens/admin/AdminUsersScreen.tsx',
    'src/screens/admin/AdminListingsScreen.tsx',
    'src/screens/admin/AdminKYCApprovalsScreen.tsx',
    'src/screens/admin/AdminTransactionsScreen.tsx',
    'src/screens/admin/AdminCommissionsScreen.tsx',
    'src/screens/admin/AdminMarketersScreen.tsx',
    'src/screens/admin/AdminDisputesScreen.tsx',
    'src/screens/admin/AdminEscrowScreen.tsx',
    'src/screens/admin/AdminSupportScreen.tsx',
];

// Replacement patterns
const replacements = [
    {
        // Replace Supabase import
        from: /import { supabase } from ['"]\.\.\/lib\/supabase['"];?/g,
        to: "import { firestoreService, where, orderBy, limit } from '../services/firestoreService';"
    },
    {
        // Replace Supabase import (two levels up)
        from: /import { supabase } from ['"]\.\.\/\.\.\/lib\/supabase['"];?/g,
        to: "import { firestoreService, where, orderBy, limit } from '../../services/firestoreService';"
    },
    {
        // Replace Supabase import (four levels up for nested folders)
        from: /import { supabase } from ['"]\.\.\/\.\.\/\.\.\/\.\.\/lib\/supabase['"];?/g,
        to: "import { firestoreService, where, orderBy, limit } from '../../../../services/firestoreService';"
    },
    {
        // Replace user.id with user.uid
        from: /user\.id\b/g,
        to: 'user.uid'
    },
    {
        // Replace user?.id with user?.uid
        from: /user\?\.id\b/g,
        to: 'user?.uid'
    },
];

console.log('🚀 Starting Firebase Migration Batch Replacement...\n');

let totalReplacements = 0;
let filesModified = 0;

filesToMigrate.forEach((file) => {
    const filePath = path.join(__dirname, file);

    try {
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  File not found: ${file}`);
            return;
        }

        let content = fs.readFileSync(filePath, 'utf8');
        let fileReplacements = 0;

        replacements.forEach((replacement) => {
            const matches = content.match(replacement.from);
            if (matches) {
                content = content.replace(replacement.from, replacement.to);
                fileReplacements += matches.length;
            }
        });

        if (fileReplacements > 0) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ ${file}: ${fileReplacements} replacements`);
            filesModified++;
            totalReplacements += fileReplacements;
        } else {
            console.log(`⏭️  ${file}: No changes needed`);
        }
    } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
    }
});

console.log(`\n📊 Migration Summary:`);
console.log(`   Files Modified: ${filesModified}`);
console.log(`   Total Replacements: ${totalReplacements}`);
console.log(`\n✅ Batch replacement complete!`);
console.log(`\n⚠️  Note: Manual review required for complex Supabase queries.`);
console.log(`   Please check each file for:
   - Complex nested queries
   - .select() with joins
   - .from().select() patterns
   - Count queries
   - ILIKE/text search queries
`);
