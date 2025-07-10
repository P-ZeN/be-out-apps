# Onboarding i18n Translation Updates

## Overview
Updated all onboarding translation files to support the new international address system following ISO 3166 standards.

## Files Updated
- `client/src/i18n/locales/en/onboarding.json` - English translations
- `client/src/i18n/locales/fr/onboarding.json` - French translations
- `client/src/i18n/locales/es/onboarding.json` - Spanish translations
- `client/src/i18n/locales/es/common.json` - Added missing common keys

## New Translation Keys Added

### Address Fields (International Standard)
- `fields.addressLine1` - Street address line 1
- `fields.addressLine1Help` - Help text for address line 1
- `fields.addressLine2` - Street address line 2 (optional)
- `fields.addressLine2Help` - Help text for address line 2
- `fields.locality` - City/locality
- `fields.administrativeArea` - State/province/region
- `fields.administrativeAreaHelp` - Help text for administrative area
- `fields.addressLabel` - Custom label for address
- `fields.addressLabelHelp` - Help text for address labeling

### Removed Old Keys
- `fields.streetNumber` - Replaced by addressLine1
- `fields.streetName` - Replaced by addressLine1

## Address System Benefits
1. **International Compatibility** - Works with addresses from multiple countries
2. **Flexibility** - Supports various address formats (US, European, etc.)
3. **Standardization** - Follows ISO 3166 and UPU S42 standards
4. **User Experience** - Clear help text and proper field labeling
5. **Extensibility** - Easy to add new countries and address formats

## Usage in Component
The onboarding component now uses these keys for:
- Address autocomplete with international support
- Multi-line address entry
- Country-specific validation
- User-friendly field labels and help text

## Next Steps
1. Test the onboarding flow with different locales
2. Add additional countries to the `countryOptions` array as needed
3. Implement address geocoding service integration
4. Add address validation based on country-specific rules

---
**Updated:** July 10, 2025
**Status:** Complete - Ready for testing
