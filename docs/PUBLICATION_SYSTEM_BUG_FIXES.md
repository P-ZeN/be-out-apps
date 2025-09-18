# Publication System Bug Fixes

## Issues Fixed

### 1. Event Card Action Menu Not Working

**Problem**: Clicking "Publier" or "Dépublier" from the action menu in the events list did nothing.

**Root Cause**: The event card was calling `organizerService.publishEvent()` which maps to the admin API endpoint `/publish` that requires the event to already be approved. For organizer's publication intent, it should use `/toggle-publication`.

**Fix**: Changed the action handlers in `organizer-client/src/pages/Events.jsx`:
```javascript
// OLD (broken)
case "publish":
    response = await organizerService.publishEvent(eventId, true);
case "unpublish":
    response = await organizerService.publishEvent(eventId, false);

// NEW (working)
case "publish":
    response = await organizerService.toggleEventPublication(eventId, true);
case "unpublish":
    response = await organizerService.toggleEventPublication(eventId, false);
```

### 2. Incorrect Menu Item Visibility Logic

**Problem**: The menu showed wrong publish/unpublish options because it checked `is_published` instead of the organizer's publication intent.

**Fix**: Updated the logic to check `organizer_wants_published` with fallback to `is_published`:
```javascript
// NEW logic that properly handles organizer intent
{!(selectedEvent.organizer_wants_published !== undefined
   ? selectedEvent.organizer_wants_published
   : selectedEvent.is_published) ? (
    // Show "Publier"
) : (
    // Show "Dépublier"
)}
```

### 3. Publication Step Not Loading Current State

**Problem**: The publication step in the event edit form didn't show the current publication status and never showed "dépublier" option.

**Root Cause**: The `adminData` in `EventFormWizard` wasn't being populated properly with the current event state.

**Fix**: Enhanced the data loading in `EventFormWizard.jsx`:
```javascript
adminData: {
    id: eventData.id || "",
    status: eventData.status || "",
    moderation_status: eventData.moderation_status || "",
    admin_notes: eventData.admin_notes || "",
    is_published: eventData.is_published || false,
    organizer_wants_published: eventData.organizer_wants_published !== undefined
        ? eventData.organizer_wants_published
        : eventData.is_published || false,
}
```

### 4. State Not Refreshing After Actions

**Problem**: After publication actions, the UI didn't reflect the new state.

**Fix**: Updated all action handlers to properly refresh the `adminData` state:
```javascript
const eventData = await organizerService.getEvent(eventId);
setFormData(prev => ({
    ...prev,
    adminData: {
        ...prev.adminData,
        // ... properly update all fields
    }
}));
```

## API Endpoints Used

### Correct Workflow
1. **Organizer Publication Intent**: `PATCH /api/organizer/events/:id/toggle-publication`
   - Sets `organizer_wants_published` field
   - Used for organizer's "Publier/Dépublier" actions

2. **Admin Approval**: `PATCH /api/organizer/events/:id/publish`
   - Sets `is_published` field
   - Only works for already approved events
   - Used for final publishing after admin approval

## Database Fields

- `organizer_wants_published`: Organizer's intent to publish (new field)
- `is_published`: Final publication state (existing field)
- `moderation_status`: Admin approval state ('approved', 'rejected', etc.)
- `status`: Event lifecycle status ('draft', 'candidate', 'active', etc.)

## Testing Steps

1. ✅ Create new event
2. ✅ Submit for review
3. ✅ Admin approves (sets status='active', moderation_status='approved')
4. ✅ Use "Publier" from action menu (should work now)
5. ✅ Check event appears in frontend
6. ✅ Use "Dépublier" from action menu (should work now)
7. ✅ Check event disappears from frontend
8. ✅ Edit form publication step should show current state
9. ✅ Publication actions in edit form should work

## Fallback Compatibility

The code maintains backward compatibility:
- If `organizer_wants_published` doesn't exist, falls back to `is_published`
- Existing events continue to work
- Admin approval workflow unchanged
