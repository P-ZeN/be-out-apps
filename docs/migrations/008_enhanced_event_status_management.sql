-- Enhanced Event Status Management Migration
-- This migration implements a comprehensive status management system for events

-- 1. Add new status values and published column
ALTER TABLE events
ADD COLUMN
IF NOT EXISTS is_published BOOLEAN DEFAULT false,
ADD COLUMN
IF NOT EXISTS status_changed_at TIMESTAMP
WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN
IF NOT EXISTS status_changed_by UUID REFERENCES users
(id);

-- 2. Update status constraint to include new status values
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE events ADD CONSTRAINT events_status_check
CHECK (status::text = ANY (ARRAY['draft'::character varying, 'candidate'::character varying, 'active'::character varying, 'sold_out'::character varying, 'cancelled'::character varying, 'completed'::character varying, 'suspended'::character varying]::text[])
);

-- 3. Update moderation_status constraint to include new values
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_moderation_status_check;
ALTER TABLE events ADD CONSTRAINT events_moderation_status_check
CHECK (moderation_status::text = ANY (ARRAY['pending'::character varying, 'under_review'::character varying, 'approved'::character varying, 'rejected'::character varying, 'flagged'::character varying, 'revision_requested'::character varying]::text[])
);

-- 4. Add status change tracking table
CREATE TABLE
IF NOT EXISTS event_status_history
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4
(),
    event_id UUID NOT NULL REFERENCES events
(id) ON
DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR
(50) NOT NULL,
    old_moderation_status VARCHAR
(50),
    new_moderation_status VARCHAR
(50),
    changed_by UUID REFERENCES users
(id),
    change_reason TEXT,
    admin_notes TEXT,
    created_at TIMESTAMP
WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create indexes for performance
CREATE INDEX
IF NOT EXISTS idx_events_status_published ON events
(status, is_published);
CREATE INDEX
IF NOT EXISTS idx_events_moderation_status ON events
(moderation_status);
CREATE INDEX
IF NOT EXISTS idx_events_status_changed_at ON events
(status_changed_at);
CREATE INDEX
IF NOT EXISTS idx_event_status_history_event_id ON event_status_history
(event_id);
CREATE INDEX
IF NOT EXISTS idx_event_status_history_created_at ON event_status_history
(created_at DESC);

-- 6. Create function to log status changes
CREATE OR REPLACE FUNCTION log_event_status_change
()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status or moderation_status changed
    IF (OLD.status IS DISTINCT FROM NEW.status) OR (OLD.moderation_status IS DISTINCT FROM NEW.moderation_status) THEN
    INSERT INTO event_status_history
        (
        event_id,
        old_status,
        new_status,
        old_moderation_status,
        new_moderation_status,
        changed_by,
        change_reason,
        admin_notes
        )
    VALUES
        (
            NEW.id,
            OLD.status,
            NEW.status,
            OLD.moderation_status,
            NEW.moderation_status,
            NEW.status_changed_by,
            CASE
                WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'Status changed from ' || COALESCE(OLD.status, 'null') || ' to ' || NEW.status
                ELSE 'Moderation status changed from ' || COALESCE(OLD.moderation_status, 'null') || ' to ' || NEW.moderation_status
            END,
            NEW.admin_notes
        );

    -- Update status_changed_at
    NEW.status_changed_at = CURRENT_TIMESTAMP;
END
IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for status change logging
DROP TRIGGER IF EXISTS trigger_log_event_status_change
ON events;
CREATE TRIGGER trigger_log_event_status_change
    BEFORE
UPDATE ON events
    FOR EACH ROW
EXECUTE FUNCTION log_event_status_change
();

-- 8. Update notification types to include status-related notifications
ALTER TABLE organizer_notifications DROP CONSTRAINT IF EXISTS organizer_notifications_type_check;
ALTER TABLE organizer_notifications ADD CONSTRAINT organizer_notifications_type_check
CHECK (type::text = ANY (ARRAY['booking'::character varying, 'payment'::character varying, 'dispute'::character varying, 'system'::character varying, 'marketing'::character varying, 'event_status'::character varying, 'event_approval'::character varying]::text[])
);

-- 9. Create function to send status change notifications
CREATE OR REPLACE FUNCTION notify_event_status_change
()
RETURNS TRIGGER AS $$
DECLARE
    organizer_user_id UUID;
    notification_title VARCHAR
(255);
    notification_message TEXT;
    notification_type VARCHAR
(50) := 'event_status';
BEGIN
    -- Get organizer user_id
    SELECT organizer_id
    INTO organizer_user_id
    FROM events
    WHERE id = NEW.event_id;

    -- Determine notification content based on status change
    IF NEW.new_moderation_status IS DISTINCT FROM NEW.old_moderation_status THEN
        notification_type := 'event_approval';
CASE NEW.new_moderation_status
            WHEN 'under_review' THEN
                notification_title := 'Événement en cours de révision';
                notification_message := 'Votre événement "' ||
(SELECT title
FROM events
WHERE id = NEW.event_id)
|| '" est maintenant en cours de révision par notre équipe.';
            WHEN 'approved' THEN
                notification_title := 'Événement approuvé';
                notification_message := 'Félicitations ! Votre événement "' ||
(SELECT title
FROM events
WHERE id = NEW.event_id)
|| '" a été approuvé et peut maintenant être publié.';
            WHEN 'rejected' THEN
                notification_title := 'Événement rejeté';
                notification_message := 'Votre événement "' ||
(SELECT title
FROM events
WHERE id = NEW.event_id)
|| '" a été rejeté. Veuillez consulter les notes de l''administrateur pour plus de détails.';
            WHEN 'revision_requested' THEN
                notification_title := 'Révision demandée';
                notification_message := 'Des modifications sont requises pour votre événement "' ||
(SELECT title
FROM events
WHERE id = NEW.event_id)
|| '". Veuillez consulter les commentaires de l''administrateur.';
            ELSE
                notification_title := 'Statut de modération mis à jour';
                notification_message := 'Le statut de modération de votre événement "' ||
(SELECT title
FROM events
WHERE id = NEW.event_id)
|| '" a été mis à jour.';
END CASE;
    ELSE
        CASE NEW.new_status
            WHEN 'candidate' THEN
                notification_title := 'Événement soumis pour révision';
                notification_message := 'Votre événement "' ||
(SELECT title
FROM events
WHERE id = NEW.event_id)
|| '" a été soumis pour révision. Nous vous tiendrons informé du statut.';
            WHEN 'active' THEN
                notification_title := 'Événement activé';
                notification_message := 'Votre événement "' ||
(SELECT title
FROM events
WHERE id = NEW.event_id)
|| '" est maintenant actif et visible par le public.';
            WHEN 'suspended' THEN
                notification_title := 'Événement suspendu';
                notification_message := 'Votre événement "' ||
(SELECT title
FROM events
WHERE id = NEW.event_id)
|| '" a été suspendu temporairement.';
            ELSE
                notification_title := 'Statut d''événement mis à jour';
                notification_message := 'Le statut de votre événement "' ||
(SELECT title
FROM events
WHERE id = NEW.event_id)
|| '" a été mis à jour.';
END CASE;
END
IF;

    -- Insert notification
    INSERT INTO organizer_notifications
    (
    organizer_id,
    type,
    title,
    message,
    data,
    priority
    )
VALUES
    (
        organizer_user_id,
        notification_type,
        notification_title,
        notification_message,
        jsonb_build_object(
            'event_id', NEW.event_id,
            'old_status', NEW.old_status,
            'new_status', NEW.new_status,
            'old_moderation_status', NEW.old_moderation_status,
            'new_moderation_status', NEW.new_moderation_status,
            'change_reason', NEW.change_reason
        ),
        CASE
            WHEN NEW.new_moderation_status IN ('rejected', 'revision_requested') THEN 'high'
            WHEN NEW.new_moderation_status = 'approved' THEN 'normal'
            ELSE 'normal'
        END
    );

RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger for status change notifications
DROP TRIGGER IF EXISTS trigger_notify_event_status_change
ON event_status_history;
CREATE TRIGGER trigger_notify_event_status_change
    AFTER
INSERT ON
event_status_history
FOR
EACH
ROW
EXECUTE FUNCTION notify_event_status_change
();

-- 11. Update existing events to set default values
UPDATE events
SET
    is_published = CASE
        WHEN status IN ('active', 'sold_out') THEN true
        ELSE false
    END,
    status_changed_at = COALESCE(updated_at, created_at)
WHERE is_published IS NULL OR status_changed_at IS NULL;

-- 12. Set events created by organizers to draft by default (update constraint later)
-- This will be handled in the application logic for new events

COMMENT ON COLUMN events.is_published IS 'Whether the event is published and visible to the public';
COMMENT ON COLUMN events.status_changed_at IS 'Timestamp when the status was last changed';
COMMENT ON COLUMN events.status_changed_by IS 'User who changed the status';
COMMENT ON TABLE event_status_history IS 'Tracks all status changes for events';
