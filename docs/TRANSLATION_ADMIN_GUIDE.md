# Translation Management System - Admin Guide

## Overview
The translation management system allows administrators to edit existing translations but NOT to add/remove translation keys or namespaces. This design ensures system stability while allowing content management.

## What Admins CAN Do ✅

### 1. Edit Translation Values
- Modify existing translation text
- Update complex JSON objects using the structured editor
- Change translations for all supported languages (FR, EN, ES)

### 2. Import/Export Translations
- Export current translations to JSON files
- Import updated translations from JSON files
- Backup and restore translation data

### 3. Language Management
- View supported languages
- Edit translations per language/namespace combination
- View translation statistics and completion status

## What Admins CANNOT Do ❌

### 1. Create New Translation Keys
- Translation keys are defined in the codebase by developers
- Adding new keys requires code changes and proper integration
- This prevents breaking the application

### 2. Delete Translation Keys
- Removing keys could break UI components
- Key structure is tied to component implementation

### 3. Create New Namespaces
- Namespaces require import/export configuration in the codebase
- This is a developer task that affects build process

## Current Translation Structure

### Supported Languages
- 🇫🇷 **French (default)** - Primary language
- 🇬🇧 **English** - Secondary language
- 🇪🇸 **Spanish** - Additional language

### Available Namespaces
- **common** - Common UI elements (buttons, messages, forms)
- **auth** - Authentication and login flows
- **home** - Home page content
- **navigation** - Menu and navigation elements
- **onboarding** - User onboarding process
- **profile** - User profile management
- **events** - Event-related content
- **bookings** - Booking system content
- **payments** - Payment flow content

## Developer Tasks vs Admin Tasks

### Developer Responsibilities
- Add new translation keys to JSON files
- Update import statements in i18n configuration
- Add new namespaces and their integration
- Deploy translation updates

### Admin Responsibilities
- Update translation content
- Manage existing language variations
- Import/export translation files
- Monitor translation completeness

## Best Practices

1. **Always Save Changes**: Use the "Save Changes" button after editing
2. **Test Before Deploying**: Verify translations in the live application
3. **Use Consistent Tone**: Maintain consistent language style across translations
4. **JSON Objects**: Use the structured editor for complex nested translations
5. **Backup**: Export translations before making major changes

## Getting New Translation Keys Added

If you need new translation keys:

1. **Contact Development Team** with:
   - The specific keys needed
   - The content in all supported languages
   - Which namespace they belong to
   - Which components will use them

2. **Development Process**:
   - Developer adds keys to appropriate JSON files
   - Updates i18n import configuration if needed
   - Tests integration in components
   - Deploys update

3. **Admin Follow-up**:
   - Verify new keys appear in admin interface
   - Fine-tune translation content as needed
   - Test in live application

## Troubleshooting

### Translation Keys Not Showing
- Check if the app has been restarted after configuration changes
- Verify the namespace is properly imported in i18n config
- Contact development team if keys are missing

### Translations Not Appearing in App
- Ensure you clicked "Save Changes"
- Check if the app needs to be restarted
- Verify the component is using the correct translation key
- Check browser console for i18n errors

---

This approach ensures system stability while giving admins appropriate control over content management.
