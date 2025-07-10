# Email System Implementation Guide

## Overview

This document outlines the comprehensive email system implementation for the BeOut application. The system provides templated email functionality with an admin interface for managing templates, tracking email delivery, and configuring settings.

## Architecture

### 1. Email Service Provider
- **Primary**: SendGrid (recommended for production)
- **Alternative**: Nodemailer with SMTP (for development/testing)
- **Fallback**: Console logging in development mode

### 2. Core Components

#### Backend Services
- `EmailService` - Core email sending functionality
- `EmailNotificationService` - Business logic for different email types
- `EmailRoutes` - Admin API endpoints for template management

#### Frontend Components
- `EmailTemplateManager` - Admin interface for template management
- Template editor with Monaco code editor
- Email logs and analytics dashboard

#### Database Schema
- `email_templates` - Stores email templates with Handlebars syntax
- `email_logs` - Tracks all sent emails and delivery status
- `email_settings` - Configurable email system settings

## Features

### ✅ Implemented Features

1. **Template Management**
   - Create, edit, delete email templates
   - Handlebars template engine for dynamic content
   - Variable substitution with JSON configuration
   - Template versioning and activation status

2. **Email Sending**
   - Templated email sending
   - Simple email sending (without templates)
   - Bulk email sending with rate limiting
   - Development mode (console logging)

3. **Admin Interface**
   - Visual template editor with HTML syntax highlighting
   - Template testing functionality
   - Email logs and delivery tracking
   - Settings configuration

4. **Pre-built Templates**
   - Welcome email for new users
   - Booking confirmation emails
   - Password reset emails
   - Event reminder emails

5. **Integration Points**
   - User registration welcome emails
   - Booking confirmation automation
   - Password reset workflow
   - Event reminder system

### 🔄 Integration Examples

#### User Registration
```javascript
import emailNotificationService from '../services/emailNotificationService.js';

// In your user registration endpoint
await emailNotificationService.sendWelcomeEmail(
    user.id,
    user.email,
    user.name
);
```

#### Booking Confirmation
```javascript
// In your booking completion endpoint
await emailNotificationService.sendBookingConfirmation(booking.id);
```

#### Password Reset
```javascript
// In your password reset endpoint
await emailNotificationService.sendPasswordResetEmail(
    user.email,
    user.name,
    resetToken
);
```

## Setup Instructions

### 1. Database Migration
Run the email system migration:
```sql
-- Execute docs/migrations/005_create_email_system.sql
```

### 2. Environment Configuration
Update your `.env` file:
```env
# Email Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
DEFAULT_FROM_EMAIL=noreply@beout.app
DEFAULT_FROM_NAME=BeOut Team
CLIENT_URL=http://localhost:5173

# Development Mode
NODE_ENV=development  # Set to 'production' for live emails
```

### 3. SendGrid Setup
1. Create a SendGrid account at https://sendgrid.com/
2. Generate an API key in Settings > API Keys
3. Add the API key to your environment variables
4. Verify your sender domain/email

### 4. Admin Interface
The email template manager is accessible in the admin panel:
- URL: `/admin/emails`
- Features: Template CRUD, testing, logs, settings

## Email Templates

### Template Syntax
Templates use Handlebars syntax for dynamic content:

```html
<h1>Welcome {{userName}}!</h1>
<p>Thank you for joining {{appName}}.</p>
{{#if confirmationUrl}}
<a href="{{confirmationUrl}}">Confirm Email</a>
{{/if}}
```

### Available Variables
Each template defines its expected variables in JSON format:
```json
{
  "userName": "User Name",
  "appName": "BeOut",
  "confirmationUrl": "https://app.com/confirm/123",
  "currentYear": "2024"
}
```

### Default Templates
1. **welcome** - New user welcome email
2. **booking_confirmation** - Booking confirmation with details
3. **password_reset** - Password reset with secure link
4. **event_reminder** - Event reminder before event date

## API Endpoints

### Template Management
- `GET /api/emails/templates` - List all templates
- `POST /api/emails/templates` - Create new template
- `PUT /api/emails/templates/:id` - Update template
- `DELETE /api/emails/templates/:id` - Delete template
- `POST /api/emails/templates/:id/test` - Send test email

### Email Logs
- `GET /api/emails/logs` - Get email delivery logs
- Query parameters: `status`, `template_name`, `page`, `limit`

### Settings
- `GET /api/emails/settings` - Get email settings
- `PUT /api/emails/settings/:key` - Update setting

### Bulk Operations
- `POST /api/emails/bulk-send` - Send bulk emails

## Best Practices

### 1. Email Deliverability
- Use verified sender domains
- Implement SPF, DKIM, and DMARC records
- Monitor bounce rates and sender reputation
- Use double opt-in for subscriptions

### 2. Template Design
- Mobile-responsive HTML templates
- Fallback text for images
- Clear call-to-action buttons
- Consistent branding

### 3. Rate Limiting
- Implement sending limits (default: 10 emails/minute)
- Use bulk sending for large lists
- Monitor daily sending quotas

### 4. Testing
- Always test templates before deployment
- Use the built-in test functionality
- Validate HTML and variables
- Test across different email clients

### 5. Privacy & Compliance
- Include unsubscribe links
- Respect user preferences
- Comply with GDPR/CAN-SPAM
- Secure handling of email addresses

## Monitoring & Analytics

### Email Logs
Track all email activity:
- Delivery status (sent, failed, bounced)
- Open tracking (if enabled)
- Click tracking (if enabled)
- Error messages and debugging info

### Dashboard Metrics
- Total emails sent
- Delivery success rate
- Template usage statistics
- Error rates by template

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check SendGrid API key
   - Verify sender email/domain
   - Check rate limits
   - Review error logs

2. **Templates not rendering**
   - Validate Handlebars syntax
   - Check variable JSON format
   - Verify template activation status

3. **Deliverability issues**
   - Check sender reputation
   - Verify DNS records
   - Review email content for spam triggers

### Development Mode
In development, emails are logged to console instead of sent:
```javascript
console.log('Email would be sent:', {
    to: 'user@example.com',
    subject: 'Welcome!',
    template: 'welcome'
});
```

## Future Enhancements

### Planned Features
- [ ] Email analytics dashboard
- [ ] A/B testing for templates
- [ ] Email scheduling
- [ ] Advanced segmentation
- [ ] Webhook integration for delivery events
- [ ] Multi-language template support
- [ ] Rich text editor for templates
- [ ] Email automation workflows

### Integration Opportunities
- [ ] SMS notifications
- [ ] Push notifications
- [ ] Slack/Discord integrations
- [ ] CRM synchronization
- [ ] Marketing automation tools

## Security Considerations

- API key rotation
- Template injection prevention
- Rate limiting and abuse prevention
- Secure token generation for reset links
- Audit logging for admin actions

## Performance Optimization

- Template caching (5-minute TTL)
- Bulk sending optimization
- Database indexing for logs
- Asynchronous processing for large sends
- Connection pooling for database

## Conclusion

The email system provides a robust foundation for all email communications in the BeOut application. With proper configuration and monitoring, it ensures reliable delivery of important notifications while providing administrators with full control over email content and delivery.

For additional support or feature requests, please refer to the development team or create an issue in the project repository.
