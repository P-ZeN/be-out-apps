-- Debug booking confirmation email template
-- Run this to see what variables the template is expecting

SELECT
    name,
    language,
    subject,
    body,
    variables
FROM email_templates
WHERE name = 'booking_confirmation'
ORDER BY language;
