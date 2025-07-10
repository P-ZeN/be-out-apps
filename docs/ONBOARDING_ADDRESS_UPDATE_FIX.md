# Onboarding Address Update Fix

## Problem
The onboarding flow was always creating new addresses instead of updating existing ones, causing:
- Duplicate address entries
- Unique constraint violations in address_relationships table
- Error: "duplicate key value violates unique constraint"

## Root Cause
1. The onboarding component always called `POST /api/addresses` to create new addresses
2. It always tried to create new address relationships, even when the user already had a primary address
3. The `address_relationships` table has a unique constraint on (entity_type, entity_id, relationship_type)

## Solution
1. **Added new API endpoint**: `GET /api/users/:userId/primary-address` to check for existing primary address
2. **Updated onboarding logic**:
   - First check if user has existing primary address
   - If yes, update it using `PUT /api/addresses/:addressId`
   - If no, create new address and relationship
3. **Fixed backend issues**:
   - Removed references to non-existent `updated_at` column in `address_relationships` table
   - Improved address relationship creation to handle existing relationships properly

## Changes Made

### Backend (`server/src/routes/addresses.js`)
1. Added `GET /api/users/:userId/primary-address` endpoint
2. Fixed `updated_at` column references in address_relationships operations
3. Improved address relationship creation with proper upsert logic

### Frontend (`client/src/components/Onboarding.jsx`)
1. Added `apiPut` import
2. Updated `completeOnboarding` function to:
   - Check for existing primary address
   - Update existing address if found
   - Create new address and relationship only if none exists
3. Maintained existing address pre-loading logic

## Benefits
- No more duplicate addresses
- No more unique constraint violations
- Seamless user experience when re-running onboarding
- Address data is properly updated rather than duplicated
- Maintains referential integrity in the database

## Testing
The fix handles these scenarios:
1. **New user**: Creates address and relationship normally
2. **Existing user with address**: Updates existing address, no new relationship needed
3. **Existing user without address**: Creates new address and relationship
4. **Multiple onboarding attempts**: Always updates the same address

This ensures the onboarding flow is robust and doesn't break on subsequent runs.
