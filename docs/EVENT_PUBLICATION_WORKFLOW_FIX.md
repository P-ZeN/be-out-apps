# Event Publication and Moderation Workflow

## Problem Fixed
Events were getting approved (`moderation_status = 'approved'`) and published (`is_published = true`) but remained with `status = 'candidate'` instead of `status = 'active'`. This prevented them from appearing in the frontend because the API requires ALL four conditions:
- `status = 'active'`
- `moderation_status = 'approved'`
- `is_published = true`
- `event_date > NOW()`

## Correct Workflow States

### 1. Event Creation (Organizer)
```sql
status = 'draft'
moderation_status = 'pending'
is_published = false
```

### 2. Submit for Review (Organizer)
```sql
status = 'candidate'
moderation_status = 'under_review'
is_published = false
```

### 3. Admin Approval (Admin)
```sql
status = 'active'           -- ✅ FIXED: Now auto-set when approving
moderation_status = 'approved'
is_published = false        -- Still needs organizer to publish
approved_by = admin_user_id
approved_at = NOW()
```

### 4. Organizer Publication (Organizer)
```sql
status = 'active'           -- ✅ FIXED: Ensured when publishing
moderation_status = 'approved'
is_published = true         -- 🎯 NOW VISIBLE IN FRONTEND
```

## API Endpoint Changes

### Admin Route: `PATCH /api/admin/events/:id/status`
**Fixed**: When `moderation_status = 'approved'`, automatically sets `status = 'active'`

```javascript
// Before (broken)
if (moderation_status === "approved") {
    updateFields.push(`approved_by = $${paramIndex}`);
    // Missing: status = 'active'
}

// After (fixed)
if (moderation_status === "approved") {
    updateFields.push(`approved_by = $${paramIndex}`);
    updateFields.push(`approved_at = CURRENT_TIMESTAMP`);
    if (!status) { // Only set if status wasn't explicitly provided
        updateFields.push(`status = 'active'`);
    }
}
```

### Organizer Route: `PATCH /api/organizer/events/:id/publish`
**Fixed**: When publishing, ensures `status = 'active'` if not already set

```javascript
// Before (could leave status = 'candidate')
UPDATE events SET is_published = $1 WHERE id = $2

// After (ensures status = 'active')
UPDATE events
SET is_published = $1,
    status = CASE WHEN is_published = true AND status != 'active' THEN 'active' ELSE status END
WHERE id = $2
```

## Database Fix Script

Run `/home/zen/dev/be-out-apps/fix_event_status.sql` to fix existing events with status inconsistencies.

## Frontend Display Conditions

Events appear in `/api/events` only when ALL conditions are met:
```sql
WHERE e.status = 'active'
  AND e.event_date > NOW()
  AND e.moderation_status = 'approved'
  AND e.is_published = true
```

## Status Validation Rules

### Valid Transitions
- `draft` → `candidate` (submit for review)
- `candidate` → `active` (admin approval)
- `candidate` → `draft` (revert submission)
- `active` → `cancelled` (cancel event)
- `active` → `sold_out` (no tickets left)
- `active` → `completed` (event finished)

### Invalid Transitions (should be prevented)
- Direct `draft` → `active` (must go through review)
- `active` → `candidate` (can't "unapprove")

## Testing Checklist

After applying fixes:
1. ✅ Create new event as organizer
2. ✅ Submit for review (`status = 'candidate'`)
3. ✅ Admin approves (`status = 'active'` + `moderation_status = 'approved'`)
4. ✅ Organizer publishes (`is_published = true`)
5. ✅ Event appears in frontend API
6. ✅ Event visible in client app

## Monitoring

Add this query to check for status inconsistencies:
```sql
SELECT
    COUNT(*) as inconsistent_events
FROM events
WHERE (
    -- Approved but not active
    (moderation_status = 'approved' AND status != 'active')
    OR
    -- Published but not approved or active
    (is_published = true AND (moderation_status != 'approved' OR status != 'active'))
);
```

This should always return `0` after the fixes are applied.
