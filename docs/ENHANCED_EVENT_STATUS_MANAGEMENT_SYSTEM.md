# Enhanced Event Status Management System

## Overview

This implementation provides a comprehensive event status management system that allows organizers to manage their events through different lifecycle stages while enabling admin oversight and moderation.

## Status Workflow

### For Organizers

1. **Draft** (`status: 'draft'`)
   - Default state for new events
   - Organizer can edit freely
   - Not visible to the public
   - Can be submitted for review

2. **Candidate** (`status: 'candidate'`, `moderation_status: 'under_review'`)
   - Event submitted for admin review
   - Organizer cannot edit during review
   - Admin can approve, reject, or request revisions
   - Can be reverted to draft by organizer if still under review

3. **Approved** (`moderation_status: 'approved'`)
   - Event approved by admin
   - Organizer can publish/unpublish
   - Ready for public visibility

4. **Published** (`moderation_status: 'approved'`, `is_published: true`)
   - Event visible to public
   - Available for bookings
   - Can be temporarily unpublished by organizer

### Admin Moderation States

- **pending**: Initial state
- **under_review**: Event is being reviewed
- **approved**: Event approved for publication
- **rejected**: Event rejected, requires significant changes
- **revision_requested**: Minor changes requested
- **flagged**: Event flagged for review

## Database Schema Changes

### New Columns in `events` table:
- `is_published` BOOLEAN: Controls public visibility
- `status_changed_at` TIMESTAMP: When status was last changed
- `status_changed_by` UUID: Who changed the status

### New Tables:
- `event_status_history`: Tracks all status changes
- Enhanced `organizer_notifications`: Includes event status notifications

### New Status Values:
- Event Status: `draft`, `candidate`, `active`, `sold_out`, `cancelled`, `completed`, `suspended`
- Moderation Status: `pending`, `under_review`, `approved`, `rejected`, `flagged`, `revision_requested`

## API Endpoints

### Organizer Endpoints

#### Status Management
- `PATCH /api/organizer/events/:id/submit` - Submit draft for review
- `PATCH /api/organizer/events/:id/publish` - Publish/unpublish approved event
- `PATCH /api/organizer/events/:id/revert` - Revert candidate to draft
- `GET /api/organizer/events/:id/status-history` - Get status change history

#### Notifications
- `GET /api/organizer/notifications` - Get notifications
- `PATCH /api/organizer/notifications/:id/read` - Mark as read
- `PATCH /api/organizer/notifications/read-all` - Mark all as read

### Admin Endpoints (Enhanced)
- `PATCH /api/admin/events/:id/status` - Update status and moderation status

## Frontend Components

### Organizer Client

#### Enhanced Events Page (`Events.jsx`)
- Visual status indicators with tooltips
- Context-aware action menus
- Status-based edit restrictions
- Workflow guidance

#### New Components
- `EventStatusHistory.jsx` - Shows complete status timeline
- `OrganizerNotifications.jsx` - Notification center

### Status Display Logic
- Priority-based status display (moderation status overrides event status)
- Color-coded chips with appropriate icons
- Helpful tooltips explaining current state and next actions

## Notification System

### Automatic Notifications
Events trigger notifications for:
- Submission for review
- Admin approval/rejection
- Revision requests
- Publication status changes

### Notification Types
- `event_status`: General status changes
- `event_approval`: Moderation-related changes

## Business Rules

### Organizer Permissions
- **Edit**: Only draft, rejected, or revision-requested events
- **Submit**: Only draft events
- **Revert**: Only candidate events still under review
- **Publish/Unpublish**: Only approved events
- **Delete**: Only draft events

### Admin Permissions
- Full control over all status transitions
- Can add admin notes for transparency
- Actions are logged for audit trail

## Security Considerations

- All status changes are logged with user attribution
- Organizers can only modify their own events
- Admin actions require authentication and authorization
- Status transitions are validated server-side

## Migration Guide

### Database Migration
Run the migration script: `docs/migrations/008_enhanced_event_status_management.sql`

### Code Updates
1. Update organizer service with new methods
2. Replace Events component with enhanced version
3. Add new pages for status history and notifications
4. Update admin components to use new moderation endpoints

## Benefits

1. **Clear Workflow**: Organizers understand the process
2. **Quality Control**: Admin oversight ensures quality
3. **Flexibility**: Organizers can manage publication independently
4. **Transparency**: Full audit trail of changes
5. **Communication**: Automatic notifications keep all parties informed
6. **User Experience**: Intuitive interface with helpful guidance

## Technical Implementation

### Database Triggers
- Automatic status change logging
- Notification generation
- Audit trail maintenance

### Service Layer
- Comprehensive validation
- Business rule enforcement
- Transaction management

### Frontend
- React components with Material-UI
- Real-time status updates
- Responsive design
- Accessibility considerations

This system provides a professional event management workflow that balances organizer autonomy with administrative oversight, ensuring quality while maintaining user experience.
