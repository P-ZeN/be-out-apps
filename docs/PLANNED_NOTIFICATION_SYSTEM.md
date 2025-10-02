# Planned Notification System - Be Out Apps

## Overview

This document outlines the comprehensive notification system design for Be Out, based on the user preference settings implemented in the client application parameters page.

## Current Implementation

### User Preferences UI
The parameters page now includes three main notification sections:

1. **Notification Vectors** - How users receive notifications
2. **Event Reminders** - When users get reminded about bookings
3. **Be Out News** - Marketing and promotional communications

### Settings Storage
- User preferences stored in `localStorage` for immediate UI feedback
- Settings structure:
```javascript
{
  nativeNotifications: boolean,
  smsNotifications: boolean,
  emailNotifications: boolean,
  reminder24h: boolean,
  reminder2h: boolean,
  beOutNews: boolean
}
```

## System Architecture Design

### 1. Notification Vectors

#### Native Notifications (Push)
**Technology**: Web Push API + Service Workers (Web), Firebase Cloud Messaging (Mobile)
- **Web Implementation**: Service worker registration, push subscription management
- **Mobile Implementation**: Tauri plugin integration with platform-specific push services
- **Use Cases**: Real-time event updates, booking confirmations, immediate reminders

#### SMS Notifications
**Technology**: Provider-agnostic SMS service (Twilio, MessageBird, AWS SNS, or others)
- **Integration Point**: Server-side abstracted SMS service in `/server/src/services/smsService.js`
- **Architecture**: Provider-agnostic interface with pluggable backends
- **Use Cases**: Critical reminders (24h/2h before events), booking confirmations
- **Considerations**: Cost comparison, international coverage, opt-out compliance

#### Email Notifications
**Technology**: SendGrid (already integrated)
- **Current Status**: Partial implementation exists for booking confirmations
- **Enhancement Needed**: Template system for different notification types
- **Use Cases**: Detailed event information, booking receipts, weekly digest

### 2. Event Reminder System

#### Database Schema Requirements
```sql
-- User notification preferences
CREATE TABLE user_notification_preferences (
    user_id INTEGER REFERENCES users(id),
    notification_type VARCHAR(50), -- 'native', 'sms', 'email'
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, notification_type)
);

-- Scheduled notifications queue
CREATE TABLE notification_queue (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    booking_id INTEGER REFERENCES bookings(id),
    notification_type VARCHAR(50),
    scheduled_for TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    message_template VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Reminder Timing Logic
- **24h Reminder**: Scheduled for `event_date - INTERVAL '24 hours'`
- **2h Reminder**: Scheduled for `event_date - INTERVAL '2 hours'`
- **Processing**: Background job (cron/queue system) to process pending notifications

### 3. Background Job System

#### Technology Options
1. **Node-cron**: Simple scheduled tasks within the Express app
2. **Bull Queue + Redis**: More robust job queue system
3. **Database-driven**: Custom polling system using PostgreSQL

#### Recommended: Database-driven Approach
```javascript
// server/src/services/notificationScheduler.js
class NotificationScheduler {
  async scheduleEventReminders(booking) {
    const user = await getUserById(booking.user_id);
    const preferences = await getUserNotificationPreferences(user.id);

    if (preferences.reminder24h) {
      await this.scheduleNotification({
        user_id: user.id,
        booking_id: booking.id,
        scheduled_for: booking.event_date - 24 * 60 * 60 * 1000,
        type: '24h_reminder'
      });
    }

    if (preferences.reminder2h) {
      await this.scheduleNotification({
        user_id: user.id,
        booking_id: booking.id,
        scheduled_for: booking.event_date - 2 * 60 * 60 * 1000,
        type: '2h_reminder'
      });
    }
  }
}
```

### 4. Message Templates System

#### Template Categories
1. **Booking Confirmations**: Immediate after reservation
2. **24h Reminders**: Event tomorrow notifications
3. **2h Reminders**: Event starting soon notifications
4. **Event Updates**: Changes to booked events
5. **Be Out News**: Marketing and promotional content

#### Multi-language Support
- Templates stored in the existing i18n system
- Server-side rendering with user's preferred language
- Fallback to French (default) if translation missing

### 5. Integration Points

#### Client Applications
- **Settings Sync**: API endpoint to sync localStorage preferences to server
- **Permission Requests**: Native notification permission prompts
- **Real-time Updates**: WebSocket or Server-Sent Events for immediate notifications

#### Server Endpoints
```javascript
// Preference management
POST /api/notifications/preferences
GET /api/notifications/preferences
PUT /api/notifications/preferences/:type

// Notification history
GET /api/notifications/history
POST /api/notifications/test  // For testing purposes

// Webhook endpoints for delivery status
POST /api/notifications/webhook/sms
POST /api/notifications/webhook/email
```

#### Database Integration
- **Booking Creation**: Auto-schedule reminders
- **Event Changes**: Update or reschedule notifications
- **User Updates**: Sync preference changes

## Implementation Phases

### Phase 1: Foundation (Current - Complete)
- ✅ UI preferences in parameters page
- ✅ Translation keys for all languages
- ✅ localStorage persistence

### Phase 2: Server Infrastructure
- [ ] Database schema implementation
- [ ] User preferences API endpoints
- [ ] Notification queue system
- [ ] Background job processor

### Phase 3: Notification Channels
- [ ] Enhanced email templates (SendGrid)
- [ ] SMS service integration (Twilio)
- [ ] Native push notifications (Web Push API)

### Phase 4: Smart Scheduling
- [ ] Automatic reminder scheduling on booking
- [ ] Event change detection and notification updates
- [ ] Timezone-aware scheduling

### Phase 5: Advanced Features
- [ ] Notification analytics and tracking
- [ ] A/B testing for message effectiveness
- [ ] Smart batching to avoid notification spam
- [ ] Machine learning for optimal notification timing

## Technical Considerations

### Performance
- **Queue Processing**: Batch processing to avoid database overload
- **Rate Limiting**: Prevent notification spam per user
- **Retry Logic**: Failed notification retry with exponential backoff

### Privacy & Compliance
- **GDPR Compliance**: Clear opt-in/opt-out mechanisms
- **Data Retention**: Automatic cleanup of old notification logs
- **User Control**: Easy way to disable all notifications

### Mobile Considerations
- **Battery Optimization**: Efficient push notification handling
- **Offline Handling**: Queue notifications when device is offline
- **Deep Linking**: Navigate to relevant app sections from notifications

### Monitoring & Analytics
- **Delivery Rates**: Track successful notification delivery
- **User Engagement**: Monitor notification click-through rates
- **System Health**: Alert on high failure rates or processing delays

## Security Considerations

### Push Notification Security
- **Encryption**: All push payloads encrypted
- **Authentication**: Signed notification requests
- **Rate Limiting**: Prevent abuse of notification endpoints

### SMS Security
- **Phone Verification**: Verify phone numbers before SMS activation
- **Opt-out Compliance**: Automatic handling of STOP keywords
- **International Regulations**: Compliance with local SMS regulations

## SMS Provider Analysis & Integration Architecture

### Provider-Agnostic SMS Service Design

The SMS integration is designed to be **completely provider-independent** through an abstraction layer that allows easy switching between providers without code changes.

#### Architecture Pattern
```javascript
// server/src/services/smsService.js - Provider-agnostic interface
class SMSService {
  constructor() {
    this.provider = this.initializeProvider();
  }

  initializeProvider() {
    const providerName = process.env.SMS_PROVIDER || 'twilio';
    const providerConfig = {
      apiKey: process.env.SMS_API_KEY,
      apiSecret: process.env.SMS_API_SECRET,
      // ... other provider-specific config
    };

    switch (providerName.toLowerCase()) {
      case 'twilio':
        return new TwilioProvider(providerConfig);
      case 'messagebird':
        return new MessageBirdProvider(providerConfig);
      case 'aws-sns':
        return new AWSSNSProvider(providerConfig);
      case 'orange':
        return new OrangeProvider(providerConfig);
      default:
        throw new Error(`Unsupported SMS provider: ${providerName}`);
    }
  }

  async sendSMS(phoneNumber, message, options = {}) {
    return await this.provider.send(phoneNumber, message, options);
  }

  async getDeliveryStatus(messageId) {
    return await this.provider.getStatus(messageId);
  }
}
```

#### Provider Interface Standard
```javascript
// server/src/services/sms/providers/BaseProvider.js
class BaseSMSProvider {
  constructor(config) {
    this.config = config;
  }

  // All providers must implement these methods
  async send(phoneNumber, message, options) {
    throw new Error('send() method must be implemented');
  }

  async getStatus(messageId) {
    throw new Error('getStatus() method must be implemented');
  }

  async handleWebhook(payload) {
    throw new Error('handleWebhook() method must be implemented');
  }

  // Standardized response format
  formatResponse(providerResponse) {
    return {
      messageId: providerResponse.id,
      status: this.normalizeStatus(providerResponse.status),
      cost: providerResponse.cost || null,
      timestamp: new Date(),
      provider: this.constructor.name
    };
  }
}
```

### SMS Provider Comparison

#### 1. **Twilio** (International Leader)
**Pros:**
- Excellent global coverage (190+ countries)
- Superior delivery rates (>95%)
- Comprehensive APIs and webhooks
- Strong developer tools and documentation
- Reliable infrastructure

**Cons:**
- Higher cost (€0.08-0.12 per SMS in Europe)
- US-based company (data sovereignty considerations)

**France Pricing:** ~€0.08 per SMS
**Europe Average:** ~€0.05-0.15 per SMS

#### 2. **MessageBird** (European Alternative)
**Pros:**
- European company (Netherlands) - GDPR compliant
- Competitive pricing (20-30% cheaper than Twilio)
- Good European coverage
- Multi-channel platform (SMS, Voice, Email)

**Cons:**
- Smaller global reach than Twilio
- Less mature developer ecosystem

**France Pricing:** ~€0.06 per SMS
**Europe Average:** ~€0.04-0.12 per SMS

#### 3. **AWS SNS** (Infrastructure Integration)
**Pros:**
- If already using AWS infrastructure
- Pay-as-you-go pricing
- Integrates with existing AWS services
- High reliability

**Cons:**
- More complex setup for SMS-only use
- Requires AWS knowledge
- Limited SMS-specific features

**France Pricing:** ~€0.07 per SMS
**Europe Average:** ~€0.05-0.13 per SMS

#### 4. **Orange Business Services** (French Operator)
**Pros:**
- French telecom operator - local presence
- Potentially better rates for French numbers
- Direct carrier relationship
- Local support in French

**Cons:**
- Limited international coverage
- Less developer-friendly APIs
- Smaller developer community

**France Pricing:** ~€0.05-0.07 per SMS (potentially lower for volume)

#### 5. **Infobip** (Croatian, Growing in Europe)
**Pros:**
- Strong European presence
- Competitive pricing
- Good delivery rates
- Multi-channel communication platform

**Cons:**
- Less well-known brand
- Smaller developer community

**France Pricing:** ~€0.05-0.08 per SMS

### Implementation Examples

#### Twilio Provider Implementation
```javascript
// server/src/services/sms/providers/TwilioProvider.js
import twilio from 'twilio';

class TwilioProvider extends BaseSMSProvider {
  constructor(config) {
    super(config);
    this.client = twilio(config.accountSid, config.authToken);
  }

  async send(phoneNumber, message, options = {}) {
    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.config.fromNumber,
        to: phoneNumber,
        statusCallback: `${process.env.BASE_URL}/api/notifications/webhook/sms/twilio`,
        ...options
      });

      return this.formatResponse({
        id: result.sid,
        status: result.status,
        cost: result.price
      });
    } catch (error) {
      throw new Error(`Twilio SMS failed: ${error.message}`);
    }
  }

  normalizeStatus(providerStatus) {
    const statusMap = {
      'queued': 'pending',
      'sent': 'sent',
      'delivered': 'delivered',
      'failed': 'failed',
      'undelivered': 'failed'
    };
    return statusMap[providerStatus] || 'unknown';
  }
}
```

#### MessageBird Provider Implementation
```javascript
// server/src/services/sms/providers/MessageBirdProvider.js
import messagebird from 'messagebird';

class MessageBirdProvider extends BaseSMSProvider {
  constructor(config) {
    super(config);
    this.client = messagebird(config.apiKey);
  }

  async send(phoneNumber, message, options = {}) {
    return new Promise((resolve, reject) => {
      this.client.messages.create({
        originator: this.config.originator || 'BeOut',
        recipients: [phoneNumber],
        body: message,
        webhook: `${process.env.BASE_URL}/api/notifications/webhook/sms/messagebird`
      }, (err, response) => {
        if (err) reject(new Error(`MessageBird SMS failed: ${err}`));
        else resolve(this.formatResponse({
          id: response.id,
          status: response.recipients.items[0].status,
          cost: null // MessageBird doesn't return cost in response
        }));
      });
    });
  }
}
```

### Configuration Management

#### Environment Variables
```bash
# SMS Provider Configuration
SMS_PROVIDER=twilio  # twilio, messagebird, aws-sns, orange, infobip
SMS_API_KEY=your_api_key
SMS_API_SECRET=your_api_secret
SMS_FROM_NUMBER=+33123456789
SMS_WEBHOOK_BASE_URL=https://your-domain.com

# Provider-specific variables
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
MESSAGEBIRD_ORIGINATOR=BeOut
AWS_SNS_REGION=eu-west-1
```

#### Runtime Provider Switching
```javascript
// Easy provider switching without code changes
const smsService = new SMSService();

// Switch provider via environment variable change + restart
// No code changes required in business logic
await smsService.sendSMS(user.phone, reminderMessage);
```

### Cost Comparison (1000 users × 4 SMS/month)

| Provider | Cost per SMS (France) | Monthly Cost | Annual Cost | Notes |
|----------|----------------------|--------------|-------------|-------|
| **Twilio** | €0.08 | €320 | €3,840 | Premium reliability |
| **MessageBird** | €0.06 | €240 | €2,880 | EU-based, GDPR compliant |
| **AWS SNS** | €0.07 | €280 | €3,360 | If using AWS ecosystem |
| **Orange Business** | €0.055* | €220 | €2,640 | French operator rates |
| **Infobip** | €0.065 | €260 | €3,120 | Growing European player |

*Estimated - actual rates depend on volume negotiation

### Recommendation Strategy

#### Phase 1: Start with MessageBird
**Rationale:**
- European company (GDPR compliance advantage)
- 25% cost savings vs Twilio (~€960/year for 1000 users)
- Good enough reliability for MVP
- Easy to implement and test

#### Phase 2: Add Twilio as Failover
**Rationale:**
- Use MessageBird as primary, Twilio as backup
- Best of both worlds: cost savings + reliability
- Automatic failover capability

#### Phase 3: Volume Negotiations
**Rationale:**
- Once reaching 5,000+ SMS/month, negotiate custom rates
- Consider direct carrier relationships (Orange, SFR, etc.)
- Potentially 30-50% cost reduction at scale

### Technical Implementation Benefits

✅ **Zero Vendor Lock-in**: Switch providers with environment variable change
✅ **A/B Testing**: Compare provider performance easily
✅ **Cost Optimization**: Choose best provider per region/volume
✅ **Failover Capability**: Automatic backup if primary provider fails
✅ **Feature Flexibility**: Use different providers for different features
✅ **Easy Testing**: Mock provider for development/testing

This architecture ensures you can start with any provider and switch seamlessly as business needs evolve!

## Success Metrics

### User Engagement
- **Notification Open Rate**: Target >20%
- **Settings Adoption**: >60% users customize preferences
- **Opt-out Rate**: <10% for relevant notifications

### System Performance
- **Delivery Success Rate**: >95%
- **Processing Latency**: <5 minutes for scheduled notifications
- **System Uptime**: >99.5%

## Onboarding Integration

### New Onboarding Step: Notification Preferences

The notification preferences should be integrated into the existing onboarding flow as a third step after personal information and address collection.

#### Current Onboarding Flow
1. **Personal Information** (existing) - Name, phone, date of birth
2. **Address Information** (existing) - Address details and location
3. **Notification Preferences** (NEW) - Communication preferences

#### Implementation Plan for Onboarding Integration

##### Step 1: Update Onboarding Component Structure
```javascript
// client/src/components/Onboarding.jsx - Add new step to steps array
const steps = [
    {
        label: t("steps.personal.label", { ns: "onboarding" }),
        icon: <AccountCircle />,
        fields: ["firstName", "lastName", "phone", "dateOfBirth"],
        id: "personal",
    },
    {
        label: t("steps.address.label", { ns: "onboarding" }),
        icon: <LocationOn />,
        fields: ["addressLine1", "locality", "postalCode", "countryCode"],
        id: "address",
    },
    {
        label: t("steps.notifications.label", { ns: "onboarding" }),
        icon: <Notifications />,
        fields: ["nativeNotifications", "smsNotifications", "emailNotifications", "reminder24h", "reminder2h", "beOutNews"],
        id: "notifications",
    },
];
```

##### Step 2: Add Notification Fields to Form Data
```javascript
// Add to formData state in Onboarding.jsx
const [formData, setFormData] = useState({
    // ... existing fields

    // Notification preferences - defaults optimized for user engagement
    nativeNotifications: true,    // Default enabled - most immediate
    smsNotifications: false,      // Default disabled - user opt-in for cost
    emailNotifications: true,     // Default enabled - booking confirmations
    reminder24h: true,           // Default enabled - helpful for planning
    reminder2h: false,           // Default disabled - might be too frequent
    beOutNews: true,             // Default enabled - marketing (with easy opt-out)
});
```

##### Step 3: Create Notification Step UI Component
```javascript
case "notifications":
    return (
        <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom>
                    {t("steps.notifications.title", { ns: "onboarding" })}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t("steps.notifications.description", { ns: "onboarding" })}
                </Typography>
            </Grid>

            {/* Notification Vectors Section */}
            <Grid size={{ xs: 12 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                        <Notifications sx={{ mr: 1 }} />
                        {t("steps.notifications.how.title", { ns: "onboarding" })}
                    </Typography>

                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.nativeNotifications}
                                    onChange={handleInputChange("nativeNotifications")}
                                />
                            }
                            label={
                                <Box>
                                    <Typography variant="body2">
                                        {t("steps.notifications.native", { ns: "onboarding" })}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {t("steps.notifications.nativeDesc", { ns: "onboarding" })}
                                    </Typography>
                                </Box>
                            }
                        />
                        // ... other switches
                    </FormGroup>
                </Paper>
            </Grid>

            {/* Reminders Section */}
            <Grid size={{ xs: 12 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                    // ... reminder switches
                </Paper>
            </Grid>

            {/* News Section */}
            <Grid size={{ xs: 12 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                    // ... news preferences
                </Paper>
            </Grid>
        </Grid>
    );
```

##### Step 4: Update Translation Keys
Add new translation keys to `/server/translations/*/onboarding.json`:

```json
{
    "steps": {
        "notifications": {
            "label": "Notifications",
            "title": "Notification Preferences",
            "description": "Choose how you'd like to stay informed about your events and Be Out news",
            "how": {
                "title": "How would you like to receive notifications?"
            },
            "when": {
                "title": "When would you like event reminders?"
            },
            "news": {
                "title": "Stay updated with Be Out"
            },
            "native": "Push notifications",
            "nativeDesc": "Instant notifications on your device",
            "sms": "Text messages",
            "smsDesc": "SMS reminders (standard rates apply)",
            "email": "Email notifications",
            "emailDesc": "Detailed information and confirmations",
            "reminder24h": "Day before reminder",
            "reminder24hDesc": "Get notified 24 hours before your events",
            "reminder2h": "2-hour reminder",
            "reminder2hDesc": "Last-minute reminder before events start",
            "beOutNews": "Be Out updates",
            "beOutNewsDesc": "New events, features, and special offers"
        }
    }
}
```

##### Step 5: Server-Side Integration
Update onboarding completion endpoint to save notification preferences:

```javascript
// server/src/routes/users.js - Update onboarding completion
app.post('/api/users/:id/complete-onboarding', async (req, res) => {
    const { userId } = req.params;
    const { profileData, notificationPreferences } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // ... existing profile update logic

        // Save notification preferences
        for (const [type, enabled] of Object.entries(notificationPreferences)) {
            await client.query(
                `INSERT INTO user_notification_preferences (user_id, notification_type, enabled)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (user_id, notification_type)
                 DO UPDATE SET enabled = $3, updated_at = CURRENT_TIMESTAMP`,
                [userId, type, enabled]
            );
        }

        await client.query('COMMIT');
        res.json({ success: true });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});
```

#### Benefits of Onboarding Integration

1. **Higher Adoption Rate**: Users more likely to configure preferences during setup
2. **Better Defaults**: Smart defaults based on UX research
3. **Contextual Education**: Explain notification benefits when users are engaged
4. **Reduced Configuration Friction**: One-time setup vs. buried in settings
5. **Permission Requests**: Perfect time to request notification permissions

#### User Experience Considerations

##### Smart Defaults Strategy
- **Native Notifications**: ON (immediate value, builds engagement)
- **Email Notifications**: ON (essential for bookings, widely accepted)
- **SMS Notifications**: OFF (cost implications, requires explicit opt-in)
- **24h Reminders**: ON (practical utility, reduces no-shows)
- **2h Reminders**: OFF (potentially annoying, let users opt-in)
- **Be Out News**: ON (business value, easy to opt-out later)

##### Permission Handling
```javascript
// Request native notification permission during onboarding
const requestNotificationPermission = async () => {
    if ('Notification' in window && formData.nativeNotifications) {
        const permission = await Notification.requestPermission();
        if (permission === 'denied') {
            // Update UI to show native notifications are blocked
            // Offer alternative: "Enable in browser settings or use email notifications"
            setFormData(prev => ({ ...prev, nativeNotifications: false }));
        }
    }
};
```

##### Progressive Disclosure
- Start with simple ON/OFF switches
- Add "Advanced Settings" link that expands to show timing options
- Provide clear explanations for each option
- Show example notifications or previews

#### Technical Implementation Notes

##### Database Schema Requirements
The existing planned schema supports this integration:
```sql
-- user_notification_preferences table structure already designed
-- Maps perfectly to onboarding form fields
-- Supports granular preference tracking
```

##### API Integration
- Extend existing onboarding completion endpoint
- Sync preferences between localStorage (immediate) and database (persistent)
- Handle permission failures gracefully

##### Mobile Considerations
- Request native permissions at optimal time (after user shows intent)
- Handle platform-specific permission flows (iOS vs Android)
- Provide clear fallback explanations if permissions denied

## Future Enhancements

### Advanced Personalization
- **Location-based**: Notifications for nearby events
- **Interest-based**: Smart filtering based on past bookings
- **Social**: Notifications when friends book similar events
- **Adaptive Timing**: Machine learning to optimize notification timing per user

### Onboarding Enhancements
- **A/B Testing**: Test different default settings for optimal engagement
- **Preview System**: Show users what notifications look like before enabling
- **Smart Recommendations**: Suggest settings based on user type (frequent vs occasional)
- **Progressive Onboarding**: Advanced notification features unlocked after first successful booking

### Integration Opportunities
- **Calendar Integration**: Add events to user calendars during onboarding
- **Social Media**: Share registration and first booking achievements
- **Third-party Apps**: Integration with popular notification aggregators
- **Analytics Integration**: Track onboarding completion rates and preference patterns

This notification system will significantly enhance user engagement while providing flexibility and respecting user preferences. The phased approach ensures manageable implementation while building toward a comprehensive solution.
