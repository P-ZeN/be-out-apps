-- Email Templates Table
CREATE TABLE email_templates
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    description TEXT,
    variables JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    UNIQUE(name, language)
);

-- Email Logs Table
CREATE TABLE email_logs
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient VARCHAR(255) NOT NULL,
    template_name VARCHAR(255),
    subject TEXT,
    status VARCHAR(50) NOT NULL,
    -- 'sent', 'failed', 'bounced', 'opened', 'clicked'
    error_message TEXT,
    message_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP
);

-- Email Settings Table (for admin configuration)
CREATE TABLE email_settings
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(255) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

-- Indexes for better performance
CREATE INDEX idx_email_templates_name ON email_templates(name);
CREATE INDEX idx_email_templates_language ON email_templates(language);
CREATE INDEX idx_email_templates_name_language ON email_templates(name, language);
CREATE INDEX idx_email_templates_active ON email_templates(is_active);
CREATE INDEX idx_email_logs_recipient ON email_logs(recipient);
CREATE INDEX idx_email_logs_template ON email_logs(template_name);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at);
CREATE INDEX idx_email_settings_key ON email_settings(setting_key);

-- Insert default email templates (English)
INSERT INTO email_templates
    (name, language, subject, body, description, variables)
VALUES
    ('welcome', 'en',
        'Welcome to {{appName}}!',
        '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to {{appName}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { max-width: 150px; height: auto; }
        .content { margin-bottom: 30px; }
        .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to {{appName}}!</h1>
        </div>
        <div class="content">
            <p>Hi {{userName}},</p>
            <p>Welcome to {{appName}}! We''re excited to have you join our community.</p>
            <p>Your account has been successfully created. You can now start exploring our platform and discover amazing events near you.</p>
            {{#if confirmationUrl}}
            <p>Please click the button below to confirm your email address:</p>
            <a href="{{confirmationUrl}}" class="button">Confirm Email</a>
            {{/if}}
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>Best regards,<br>The {{appName}} Team</p>
        </div>
        <div class="footer">
            <p>&copy; {{currentYear}} {{appName}}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
        'Welcome email sent to new users',
        '{"appName": "BeOut", "userName": "User Name", "confirmationUrl": "optional", "currentYear": "2024"}'
),
    ('welcome', 'fr',
        'Bienvenue sur {{appName}} !',
        '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenue sur {{appName}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { max-width: 150px; height: auto; }
        .content { margin-bottom: 30px; }
        .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Bienvenue sur {{appName}} !</h1>
        </div>
        <div class="content">
            <p>Bonjour {{userName}},</p>
            <p>Bienvenue sur {{appName}} ! Nous sommes ravis de vous compter parmi notre communauté.</p>
            <p>Votre compte a été créé avec succès. Vous pouvez maintenant commencer à explorer notre plateforme et découvrir des événements extraordinaires près de chez vous.</p>
            {{#if confirmationUrl}}
            <p>Veuillez cliquer sur le bouton ci-dessous pour confirmer votre adresse email :</p>
            <a href="{{confirmationUrl}}" class="button">Confirmer l''email</a>
            {{/if}}
            <p>Si vous avez des questions, n''hésitez pas à contacter notre équipe de support.</p>
            <p>Cordialement,<br>L''équipe {{appName}}</p>
        </div>
        <div class="footer">
            <p>&copy; {{currentYear}} {{appName}}. Tous droits réservés.</p>
        </div>
    </div>
</body>
</html>',
        'Email de bienvenue envoyé aux nouveaux utilisateurs',
        '{"appName": "BeOut", "userName": "Nom Utilisateur", "confirmationUrl": "optionnel", "currentYear": "2024"}'
);
-- Add booking confirmation templates for multiple languages
INSERT INTO email_templates
    (name, language, subject, body, description, variables)
VALUES
    ('booking_confirmation', 'en',
        'Booking Confirmation - {{eventTitle}}',
        '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .booking-details { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .detail-label { font-weight: bold; }
        .button { display: inline-block; background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Booking Confirmed!</h1>
        </div>
        <div class="content">
            <p>Hi {{userName}},</p>
            <p>Your booking has been confirmed! Here are your booking details:</p>

            <div class="booking-details">
                <div class="detail-row">
                    <span class="detail-label">Booking Reference:</span>
                    <span>{{bookingReference}}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Event:</span>
                    <span>{{eventTitle}}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date:</span>
                    <span>{{eventDate}}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Time:</span>
                    <span>{{eventTime}}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Location:</span>
                    <span>{{eventLocation}}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Tickets:</span>
                    <span>{{ticketCount}}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Total Amount:</span>
                    <span>{{totalAmount}}</span>
                </div>
            </div>

            <p>Please save this email for your records. You can also view your booking details in your account.</p>

            <a href="{{bookingUrl}}" class="button">View Booking Details</a>

            <p>We look forward to seeing you at the event!</p>
            <p>Best regards,<br>The {{appName}} Team</p>
        </div>
        <div class="footer">
            <p>&copy; {{currentYear}} {{appName}}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
        'Booking confirmation email sent after successful booking',
        '{"userName": "User Name", "bookingReference": "BO20240101123456", "eventTitle": "Event Title", "eventDate": "January 1, 2024", "eventTime": "7:00 PM", "eventLocation": "Event Location", "ticketCount": "2", "totalAmount": "€50.00", "bookingUrl": "https://app.com/booking/123", "appName": "BeOut", "currentYear": "2024"}'
),
    ('password_reset',
        'Reset Your Password - {{appName}}',
        '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .button { display: inline-block; background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; }
        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 10px; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Reset Your Password</h1>
        </div>
        <div class="content">
            <p>Hi {{userName}},</p>
            <p>We received a request to reset your password for your {{appName}} account.</p>

            <div class="warning">
                <strong>Note:</strong> This link will expire in {{expirationTime}} minutes.
            </div>

            <p>Click the button below to reset your password:</p>

            <a href="{{resetUrl}}" class="button">Reset Password</a>

            <p>If you didn''t request this password reset, please ignore this email. Your password will remain unchanged.</p>

            <p>For security reasons, this link can only be used once and will expire automatically.</p>

            <p>Best regards,<br>The {{appName}} Team</p>
        </div>
        <div class="footer">
            <p>&copy; {{currentYear}} {{appName}}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
        'Password reset email with secure link',
        '{"userName": "User Name", "resetUrl": "https://app.com/reset-password?token=abc123", "expirationTime": "30", "appName": "BeOut", "currentYear": "2024"}'
),
    ('event_reminder',
        'Event Reminder - {{eventTitle}}',
        '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Reminder</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .event-details { background-color: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .detail-label { font-weight: bold; }
        .button { display: inline-block; background-color: #2196f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; }
        .highlight { background-color: #ffecb3; padding: 10px; border-radius: 5px; margin: 10px 0; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Event Reminder</h1>
        </div>
        <div class="content">
            <p>Hi {{userName}},</p>
            <p>This is a friendly reminder about your upcoming event in {{timeBeforeEvent}}:</p>

            <div class="event-details">
                <div class="detail-row">
                    <span class="detail-label">Event:</span>
                    <span>{{eventTitle}}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date:</span>
                    <span>{{eventDate}}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Time:</span>
                    <span>{{eventTime}}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Location:</span>
                    <span>{{eventLocation}}</span>
                </div>
            </div>

            <div class="highlight">
                <strong>Don''t forget to arrive early to ensure you don''t miss anything!</strong>
            </div>

            <p>We''re excited to see you there!</p>
            <p>Best regards,<br>The {{appName}} Team</p>
        </div>
        <div class="footer">
            <p>&copy; {{currentYear}} {{appName}}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
        'Event reminder email sent before events',
        '{"userName": "User Name", "eventTitle": "Event Title", "eventDate": "January 1, 2024", "eventTime": "7:00 PM", "eventLocation": "Event Location", "timeBeforeEvent": "24 hours", "appName": "BeOut", "currentYear": "2024"}'
);

-- Insert default email settings
INSERT INTO email_settings
    (setting_key, setting_value, description)
VALUES
    ('default_from_email', 'noreply@beout.app', 'Default sender email address'),
    ('default_from_name', 'BeOut Team', 'Default sender name'),
    ('admin_notification_email', 'admin@beout.app', 'Email for admin notifications'),
    ('smtp_enabled', 'true', 'Enable/disable email sending'),
    ('daily_email_limit', '1000', 'Maximum emails per day'),
    ('rate_limit_per_minute', '10', 'Maximum emails per minute');

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column
()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW
();
RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_templates_updated_at BEFORE
UPDATE ON email_templates FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column
();
CREATE TRIGGER update_email_settings_updated_at BEFORE
UPDATE ON email_settings FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column
();
