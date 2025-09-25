#!/usr/bin/env node

/**
 * Stripe Configuration Validator
 *
 * This script validates that Stripe is properly configured for both
 * server and client applications.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server environment
dotenv.config({ path: path.join(__dirname, '../server/.env') });

// Load client environment
dotenv.config({ path: path.join(__dirname, '../client/.env') });

console.log('🔍 Validating Stripe Configuration...\n');

// Server Configuration
console.log('📦 Server Configuration:');
const serverStripeSecret = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (serverStripeSecret) {
    const keyType = serverStripeSecret.startsWith('sk_live_') ? 'LIVE' :
                   serverStripeSecret.startsWith('sk_test_') ? 'TEST' : 'UNKNOWN';
    console.log(`   ✅ STRIPE_SECRET_KEY: ${keyType} (${serverStripeSecret.substring(0, 12)}...)`);
} else {
    console.log('   ❌ STRIPE_SECRET_KEY: Missing');
}

if (webhookSecret && webhookSecret !== 'whsec_temp_secret_replace_with_real_webhook_secret') {
    console.log(`   ✅ STRIPE_WEBHOOK_SECRET: Configured (${webhookSecret.substring(0, 12)}...)`);
} else {
    console.log('   ❌ STRIPE_WEBHOOK_SECRET: Missing or placeholder');
}

// Client Configuration
console.log('\n🌐 Client Configuration:');
const clientStripePublishable = process.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (clientStripePublishable) {
    const keyType = clientStripePublishable.startsWith('pk_live_') ? 'LIVE' :
                   clientStripePublishable.startsWith('pk_test_') ? 'TEST' : 'UNKNOWN';
    console.log(`   ✅ VITE_STRIPE_PUBLISHABLE_KEY: ${keyType} (${clientStripePublishable.substring(0, 12)}...)`);
} else {
    console.log('   ❌ VITE_STRIPE_PUBLISHABLE_KEY: Missing');
}

// Key Pair Validation
console.log('\n🔑 Key Pair Validation:');
if (serverStripeSecret && clientStripePublishable) {
    const serverEnv = serverStripeSecret.includes('test') ? 'test' : 'live';
    const clientEnv = clientStripePublishable.includes('test') ? 'test' : 'live';

    if (serverEnv === clientEnv) {
        console.log(`   ✅ Key pair match: Both using ${serverEnv.toUpperCase()} keys`);
    } else {
        console.log(`   ❌ Key pair mismatch: Server (${serverEnv}) vs Client (${clientEnv})`);
    }
} else {
    console.log('   ⚠️  Cannot validate key pair - missing keys');
}

// Overall Status
console.log('\n📊 Overall Status:');
const allConfigured = serverStripeSecret &&
                     webhookSecret &&
                     webhookSecret !== 'whsec_temp_secret_replace_with_real_webhook_secret' &&
                     clientStripePublishable;

if (allConfigured) {
    console.log('   🎉 Stripe is fully configured and ready for use!');
} else {
    console.log('   ⚠️  Stripe configuration incomplete. Please update the missing keys.');
}

// Next Steps
console.log('\n📝 Next Steps:');
if (!serverStripeSecret) {
    console.log('   1. Add STRIPE_SECRET_KEY to server/.env');
}
if (!clientStripePublishable) {
    console.log('   2. Add VITE_STRIPE_PUBLISHABLE_KEY to client/.env');
}
if (!webhookSecret || webhookSecret === 'whsec_temp_secret_replace_with_real_webhook_secret') {
    console.log('   3. Set up webhook in Stripe Dashboard and add STRIPE_WEBHOOK_SECRET');
}
if (allConfigured) {
    console.log('   1. Test payment flow with a test booking');
    console.log('   2. Verify webhook is receiving events');
    console.log('   3. Check payment_transactions table for logged payments');
}

console.log('\n📚 For detailed setup instructions, see: docs/STRIPE_PAYMENT_SETUP.md');
