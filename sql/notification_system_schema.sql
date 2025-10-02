-- Notification System Database Schema
-- Phase 1: Core Infrastructure (excluding SMS)

-- Create extension for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User notification preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- 'native', 'email', 'reminder24h', 'reminder2h', 'beOutNews'
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, notification_type)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_type ON user_notification_preferences(notification_type);

-- Notification queue for scheduled notifications
CREATE TABLE IF NOT EXISTS notification_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- 'native', 'email'
    channel VARCHAR(20) NOT NULL, -- 'push', 'email'
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
    message_template VARCHAR(100) NOT NULL, -- template key for i18n
    template_data JSONB, -- dynamic data for template rendering
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled ON notification_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id ON notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_booking_id ON notification_queue(booking_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);

-- Push notification subscriptions (for Web Push API)
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    user_agent TEXT,
    platform VARCHAR(20), -- 'web', 'android', 'ios'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, endpoint)
);

-- Index for active subscriptions
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_active ON push_subscriptions(user_id) WHERE is_active = true;

-- Notification delivery log for analytics
CREATE TABLE IF NOT EXISTS notification_delivery_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_queue_id UUID REFERENCES notification_queue(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL, -- 'push', 'email'
    status VARCHAR(20) NOT NULL, -- 'sent', 'delivered', 'failed', 'clicked'
    provider_message_id VARCHAR(255), -- external provider message ID
    error_details JSONB,
    delivered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_notification_delivery_log_user ON notification_delivery_log(user_id, delivered_at);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_log_channel ON notification_delivery_log(channel, status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_notification_preferences_updated_at
    BEFORE UPDATE ON user_notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_queue_updated_at
    BEFORE UPDATE ON notification_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_subscriptions_updated_at
    BEFORE UPDATE ON push_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default notification preferences for existing users
-- This will be run manually by operator
INSERT INTO user_notification_preferences (user_id, notification_type, enabled)
SELECT
    u.id,
    notification_types.type as notification_type,
    notification_types.default_enabled as enabled
FROM users u
CROSS JOIN (
    VALUES
        ('native', true),
        ('email', true),
        ('reminder24h', true),
        ('reminder2h', false),
        ('beOutNews', true)
) AS notification_types(type, default_enabled)
WHERE NOT EXISTS (
    SELECT 1 FROM user_notification_preferences unp
    WHERE unp.user_id = u.id
)
ON CONFLICT (user_id, notification_type) DO NOTHING;

-- View for easy preference lookup
CREATE OR REPLACE VIEW user_notification_settings AS
SELECT
    u.id as user_id,
    u.email,
    up.first_name,
    up.last_name,
    COALESCE(
        jsonb_object_agg(
            unp.notification_type,
            unp.enabled
        ) FILTER (WHERE unp.notification_type IS NOT NULL),
        '{}'::jsonb
    ) as preferences,
    COUNT(ps.id) as active_push_subscriptions
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN user_notification_preferences unp ON u.id = unp.user_id
LEFT JOIN push_subscriptions ps ON u.id = ps.user_id AND ps.is_active = true
GROUP BY u.id, u.email, up.first_name, up.last_name;

COMMENT ON TABLE user_notification_preferences IS 'Stores user preferences for different notification types';
COMMENT ON TABLE notification_queue IS 'Queue for scheduled notifications to be processed by background jobs';
COMMENT ON TABLE push_subscriptions IS 'Web Push API subscription data for browser notifications';
COMMENT ON TABLE notification_delivery_log IS 'Log of all notification delivery attempts for analytics';
COMMENT ON VIEW user_notification_settings IS 'Convenient view for user notification preferences and subscription status';
