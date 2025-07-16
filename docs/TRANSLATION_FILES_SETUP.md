# Translation Files Setup

## Directory Structure

Translation files are stored in `server/translations/` with the following structure:

```
server/translations/
├── en/
│   ├── auth.json
│   ├── common.json
│   ├── home.json
│   ├── map.json
│   ├── navigation.json
│   ├── onboarding.json
│   ├── profile.json
│   ├── events.json
│   ├── bookings.json
│   └── payments.json
├── fr/ (same structure)
└── es/ (same structure)
```

## Keeping Translations in Sync

### Development
When working locally, run this command from the server directory to sync translations from client:

```bash
npm run sync-translations
```

### Deployment
Make sure the `server/translations/` directory is included in your Docker build context and deployed files.

### Admin Interface
The admin translation management interface reads from and writes to `server/translations/` files.

## Important Notes

1. The client application uses translations from `client/src/i18n/locales/`
2. The admin interface manages translations in `server/translations/`
3. These need to be kept in sync for consistency
4. In production, only the server translations directory is used by the admin interface
