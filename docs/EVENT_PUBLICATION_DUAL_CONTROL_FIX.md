# Event Publication Flow Fix

## Problem Identified

Events were showing as "published" in the organizer client with a green pill, but weren't actually visible to the public. This happened because:

1. **Admin approved** the event (`moderation_status = 'approved'`, `status = 'active'`)
2. **Organizer clicked "Publish"** which called `toggleEventPublication()` and set `organizer_wants_published = true`
3. **Frontend API checked** `is_published = true` but this field was never updated
4. **Result**: Event appeared published in organizer UI but wasn't visible to users because `is_published` was still `false`

## Root Cause Analysis

The organizer client was calling the wrong API endpoint:
- **Wrong**: `/api/organizer/events/:id/toggle-publication` (sets `organizer_wants_published`)
- **Correct**: `/api/organizer/events/:id/publish` (sets `is_published`)

The frontend events API correctly checks `is_published = true`, but the organizer "Publish" action wasn't setting this field.

## Fix Applied

### Organizer Client Endpoint Correction

**File**: `/home/zen/dev/be-out-apps/organizer-client/src/pages/Events.jsx`

**Problem**: The organizer "Publish/Unpublish" actions were calling the wrong API endpoint.

**Before**:
```javascript
case "publish":
    response = await organizerService.toggleEventPublication(eventId, true);
case "unpublish":
    response = await organizerService.toggleEventPublication(eventId, false);
```

**After**:
```javascript
case "publish":
    response = await organizerService.publishEvent(eventId, true);
case "unpublish":
    response = await organizerService.publishEvent(eventId, false);
```

**API Endpoints**:
- **toggleEventPublication()** → `PATCH /api/organizer/events/:id/toggle-publication` (sets `organizer_wants_published`)
- **publishEvent()** → `PATCH /api/organizer/events/:id/publish` (sets `is_published`) ✅ CORRECT

## Correct Workflow (After Fix)

### 1. Event Creation
```sql
status = 'draft'
moderation_status = 'pending'
is_published = false
```

### 2. Submit for Review
```sql
status = 'candidate'
moderation_status = 'under_review'
is_published = false (unchanged)
```

### 3. Admin Approval
```sql
status = 'active'
moderation_status = 'approved'
is_published = false (unchanged - waiting for organizer)
```
**Result**: Event approved but NOT visible (organizer hasn't published yet)

### 4. Organizer Publishes
```sql
status = 'active' (unchanged)
moderation_status = 'approved' (unchanged)
is_published = true (✅ SET BY ORGANIZER)
```
**Result**: Event NOW visible in frontend API ✅

### 5. Organizer Unpublishes (Optional)
```sql
status = 'active' (unchanged)
moderation_status = 'approved' (unchanged)
is_published = false (✅ SET BY ORGANIZER)
```
**Result**: Event hidden from frontend API

## Publication Control Clarity

The fix clarifies the publication control system:

1. **Admin Role**: Approves/rejects events for quality (`moderation_status`)
2. **Organizer Role**: Decides when to make approved events public (`is_published`)
3. **Simple Flow**: Admin approves → Organizer publishes → Event visible
4. **Helper Tools**: Admin can also publish events if needed (copilot command)

## Testing Verification

After applying fixes, verify this workflow:

1. ✅ Create event as organizer
2. ✅ Submit for review (`status = 'candidate'`)
3. ✅ Admin approves (`moderation_status = 'approved'`)
4. ✅ Organizer publishes (sets `organizer_wants_published = true`)
5. ✅ Event appears in `/api/events` (visible to public)
6. ✅ Organizer unpublishes (sets `organizer_wants_published = false`)
7. ✅ Event disappears from `/api/events` (hidden from public)

## Database Health Check

Monitor for inconsistencies with this query:
```sql
SELECT
    id,
    title,
    status,
    moderation_status,
    is_published
FROM events
WHERE (
    -- Published but not approved or active
    (is_published = true
     AND (moderation_status != 'approved' OR status != 'active'))
);
```

This should return 0 rows - all published events should be approved and active.
