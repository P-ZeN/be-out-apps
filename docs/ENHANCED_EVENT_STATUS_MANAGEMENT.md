# Enhanced Event Status Management System

## Overview

This implementation provides a comprehensive event status management system that allows organizers to manage their event lifecycle while giving administrators full control over the approval process. The system includes real-time notifications and detailed status tracking.

## Status Workflow

### For Organizers

1. **Draft** (Initial State)
   - All new events start as drafts
   - Organizers can edit and modify freely
   - Not visible to the public
   - Can be submitted for review

2. **Candidate** (Submitted for Review)
   - Event submitted by organizer for admin review
   - Cannot be edited by organizer
   - Moderation status changes to "under_review"
   - Can be reverted to draft if not yet reviewed

3. **Approved** (Admin Approved)
   - Event approved by admin
   - Organizer can now publish/unpublish
   - Can edit basic details but major changes may require re-approval

4. **Published/Unpublished** (Visibility Control)
   - Independent of approval status
   - Controls public visibility
   - Organizer can toggle at will for approved events

### For Administrators

Administrators can manage events through the following moderation statuses:

- **pending**: Initial state for new events
- **under_review**: Event submitted by organizer for review
- **approved**: Event approved and can be published
- **rejected**: Event rejected with notes
- **revision_requested**: Changes required before approval
- **flagged**: Event flagged for review

## Database Schema Changes

### New Columns in `events` Table

```sql
-- Publication control
is_published BOOLEAN DEFAULT false

-- Status tracking
status_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
status_changed_by UUID REFERENCES users(id)
```

### Updated Status Constraints

```sql
-- Event status values
status: 'draft', 'candidate', 'active', 'sold_out', 'cancelled', 'completed', 'suspended'

-- Moderation status values
moderation_status: 'pending', 'under_review', 'approved', 'rejected', 'flagged', 'revision_requested'
```

### New `event_status_history` Table

Tracks all status changes with:
- Old and new status values
- Change reason and admin notes
- Timestamp and user who made the change

### Enhanced Notifications

New notification types:
- `event_status`: For status changes initiated by organizer
- `event_approval`: For admin moderation decisions

## API Endpoints

### Organizer Endpoints

#### Status Management
- `PATCH /api/organizer/events/:id/submit` - Submit event for review
- `PATCH /api/organizer/events/:id/publish` - Publish/unpublish approved event
- `PATCH /api/organizer/events/:id/revert` - Revert to draft (if still under review)
- `GET /api/organizer/events/:id/status-history` - Get status change history

#### Notifications
- `GET /api/organizer/notifications` - Get notifications with pagination
- `PATCH /api/organizer/notifications/:id/read` - Mark notification as read
- `PATCH /api/organizer/notifications/read-all` - Mark all as read

### Admin Endpoints

#### Enhanced Moderation
- `PATCH /api/admin/events/:id/status` - Update status and/or moderation status

Request body can include:
```json
{
  "status": "active",           // Optional
  "moderation_status": "approved", // Optional
  "admin_notes": "Approved with minor suggestions"
}
```

## Frontend Components

### Organizer Interface

#### Enhanced Events List (`Events.jsx`)
- Color-coded status chips with tooltips
- Context menu with status-appropriate actions
- Submit for review, publish/unpublish, revert options
- Workflow information panel

#### Status History Page (`EventStatusHistory.jsx`)
- Timeline view of all status changes
- Admin notes and change reasons
- Current status display

#### Notifications Page (`OrganizerNotifications.jsx`)
- Real-time status change notifications
- Priority-based display
- Navigation to relevant events

### Status Display Logic

```javascript
const getStatusLabel = (status, moderationStatus, isPublished) => {
    // Moderation status takes priority
    if (moderationStatus === 'rejected') return "Rejeté";
    if (moderationStatus === 'revision_requested') return "Révision demandée";
    if (moderationStatus === 'under_review') return "En cours de révision";

    // Regular status
    switch (status) {
        case "active":
            return isPublished ? "Publié" : "Approuvé (non publié)";
        case "draft": return "Brouillon";
        case "candidate": return "En attente de validation";
        // ... other statuses
    }
};
```

## Business Rules

### Organizer Permissions

1. **Can Edit**: Draft events, rejected events, events requiring revision
2. **Can Submit**: Draft events only
3. **Can Revert**: Candidate events still under review
4. **Can Publish/Unpublish**: Approved events only
5. **Can Delete**: Draft events only

### Admin Permissions

1. **Full Status Control**: Can change any status or moderation status
2. **Notification Triggers**: Status changes automatically notify organizers
3. **Audit Trail**: All changes logged with timestamps and reasons

### Automatic Behaviors

1. **New Events**: Created as draft with pending moderation status
2. **Status Logging**: All changes automatically logged to history
3. **Notifications**: Sent automatically on status changes
4. **Publication Control**: Independent of approval but requires approval first

## Implementation Benefits

### For Organizers
- Clear workflow understanding
- Better control over event visibility
- Real-time feedback on approval status
- Detailed change history

### For Administrators
- Structured review process
- Better communication with organizers
- Complete audit trail
- Flexible approval workflow

### For Users/Public
- Only approved and published events visible
- Higher quality events through review process
- Consistent event standards

## Usage Examples

### Organizer Workflow

1. Create event (starts as draft)
2. Complete event details
3. Submit for review (becomes candidate/under_review)
4. Wait for admin decision
5. If approved: publish when ready
6. If rejected/revision needed: edit and resubmit

### Admin Workflow

1. Review submitted events (candidate/under_review)
2. Approve, reject, or request revisions
3. Add notes for organizer feedback
4. Monitor published events
5. Suspend if needed

This system provides a complete solution for event lifecycle management while maintaining clear separation of concerns between organizers and administrators.
