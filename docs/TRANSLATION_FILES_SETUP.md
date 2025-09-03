# Translation System - Complete Guide

## System Architecture

**Centralized Translation Storage**: All translation files are stored in `server/translations/` for persistence across deployments and admin editing capabilities.

```
server/translations/
├── en/
│   ├── auth.json        # Authentication (login, register, etc.)
│   ├── common.json      # Shared elements (buttons, status, etc.)
│   ├── home.json        # Homepage content
│   ├── map.json         # Map interface
│   ├── navigation.json  # Menu items
│   ├── onboarding.json  # User onboarding flow
│   ├── profile.json     # User profile pages
│   ├── events.json      # Event listings and details
│   ├── bookings.json    # Booking system
│   ├── payments.json    # Payment flow
│   └── organizer.json   # Organizer-specific content (NEW)
├── fr/ (same structure)
└── es/ (same structure)
```

## Application Translation Patterns

### ✅ Client (Correct Implementation)
```javascript
// client/src/i18n/index.js
i18n.use(Backend) // Loads from server/translations/ via HTTP API
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        backend: {
            loadPath: `${API_BASE_URL}/api/translations/{{lng}}/{{ns}}`,
        },
        ns: ["common", "auth", "home", "navigation", "onboarding", "map", "profile", "events", "bookings", "payments"]
    });
```

### ❌ Organizer-Client (Broken - Needs Fix)
```javascript
// organizer-client/src/i18n/index.js - CURRENT WRONG APPROACH
const resources = {
    fr: {
        translation: {
            "Détails de l'événement": "Détails de l'événement", // Hardcoded French strings!
            // 500+ more hardcoded strings...
        }
    }
};
// Does NOT use centralized server translations!
```

### ❌ Admin-Client (Intentionally Not Translated)
Admin interface manages translations but is not itself translatable.

## Critical Issues Found

### 1. Organizer-Client Architecture Problem 🚨
- **Problem**: Uses local hardcoded French strings instead of server translation API
- **Impact**: Admin translation edits don't affect organizer-client
- **Root Cause**: Different i18n architecture than client

### 2. Hardcoded Translation Keys 🚨
- **Problem**: Uses `t('French text')` instead of `t('namespace:key')`
- **Impact**: Breaks admin translation management system
- **Examples**: `t('Aperçu du billet')` should be `t('organizer:tickets.preview.title')`

### 3. Missing Namespace Organization
- **Problem**: Organizer translations not properly structured
- **Impact**: Difficult to manage and edit via admin interface

## Migration Plan

### Phase 1: Fix Organizer-Client Architecture 🚨 CRITICAL

#### Step 1: Create Organizer Namespace in Server
```bash
# Create organizer.json in all languages
touch server/translations/{fr,en,es}/organizer.json
```

#### Step 2: Extract and Structure Organizer Translations
Move all translations from `organizer-client/src/i18n/index.js` to `server/translations/*/organizer.json` with proper key structure:

```json
// server/translations/fr/organizer.json
{
  "navigation": {
    "dashboard": "Tableau de bord",
    "events": "Mes événements",
    "bookings": "Réservations"
  },
  "events": {
    "details": {
      "title": "Détails de l'événement",
      "description": "Renseignez les informations principales de votre événement."
    }
  },
  "tickets": {
    "preview": {
      "title": "Aperçu du billet",
      "fillDetails": "Remplissez les détails de l'événement pour voir l'aperçu"
    }
  },
  "publication": {
    "status": {
      "approved": "Approuvé",
      "rejected": "Rejeté",
      "draft": "Brouillon"
    }
  }
}
```

#### Step 3: Convert Organizer-Client to HTTP Backend
Replace `organizer-client/src/i18n/index.js` with HTTP backend pattern:

```javascript
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

i18n.use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        lng: "fr",
        fallbackLng: "en",
        backend: {
            loadPath: `${API_BASE_URL}/api/translations/{{lng}}/{{ns}}`,
        },
        defaultNS: "common",
        ns: ["common", "auth", "organizer", "events", "navigation"],
    });
```

#### Step 4: Replace All Hardcoded Strings with Keys
Convert every component from:
```javascript
// WRONG: Hardcoded French
{t('Détails de l\'événement')}

// CORRECT: Proper key
{t('organizer:events.details.title')}
```

### Phase 2: Clean Up Client Issues 🟡

#### Step 1: Fix Client Hardcoded Strings
- Profile component form labels
- Error messages
- Debug/console messages

#### Step 2: Remove Orphaned Keys
- Delete unused translation files
- Remove duplicate keys
- Consolidate similar translations

### Phase 3: Validation and Testing ✅

#### Step 1: Verify Admin Interface
- Can load organizer translations
- Can edit organizer keys
- Changes persist and appear in organizer-client

#### Step 2: Test Language Switching
- All apps switch languages correctly
- No missing translation errors
- Consistent user experience

## Development Workflow

### Local Development
```bash
cd /home/zen/dev/be-out-apps
npm run dev  # Starts all apps including translation API

# If needed, sync translations from client to server
cd server
npm run sync-translations
```

### Translation Management
1. **Admin Interface**: Edit translations via admin panel at port 5174
2. **Persistence**: Changes automatically saved to `server/translations/`
3. **Hot Reload**: Translation changes appear immediately in running apps

### Deployment
1. **Volume Mount**: `/app/translations` persists translation files
2. **Migration Script**: `server/scripts/migrate-translations.js` handles initial setup
3. **Environment**: `TRANSLATIONS_PATH=/app/translations` in production

## API Endpoints

- `GET /api/translations/:language/:namespace` - Load translation file
- `PUT /api/admin/translations/:language/:namespace` - Update translations (admin only)

## Best Practices

### Translation Keys
```javascript
// ✅ Good: Organized, descriptive keys
{t('events:details.fields.title')}
{t('common:buttons.save')}
{t('organizer:publication.status.approved')}

// ❌ Bad: Hardcoded strings
{t('Titre de l\'événement')}
{t('Save')}
{t('Approuvé')}
```

### Component Usage
```javascript
const { t } = useTranslation(['organizer', 'common']);
// Load multiple namespaces as needed
```

### Namespace Organization
- `common`: Shared across all apps (buttons, status, etc.)
- `auth`: Authentication flows
- `organizer`: Organizer-specific content
- `events`: Event-related content (shared between client/organizer)
- `navigation`: Menu items and navigation

## Troubleshooting

### Translation Not Loading
1. Check network tab for API call to `/api/translations/`
2. Verify translation file exists in `server/translations/`
3. Check namespace is included in i18n config

### Admin Edits Not Appearing
1. Verify translation uses proper key structure
2. Check browser cache/refresh
3. Ensure component uses correct namespace

### Missing Translations
1. Check fallback language (English) has the key
2. Verify namespace is loaded in component
3. Add missing keys via admin interface

## Migration Status

- ❌ **Organizer-Client**: Critical fixes needed (hardcoded strings, wrong architecture)
- ⚠️ **Client**: Minor cleanup needed (Profile component, orphaned keys)
- ✅ **Admin-Client**: Working correctly (not translated by design)
- ✅ **Server**: Translation API working correctly

## Files to Modify

1. `server/translations/*/organizer.json` - Create new namespace files
2. `organizer-client/src/i18n/index.js` - Replace with HTTP backend
3. All organizer-client components - Replace hardcoded strings with keys
4. `client/src/components/Profile.jsx` - Replace hardcoded labels

---

**CRITICAL**: The organizer-client translation system is completely broken and must be fixed for the admin translation management to work properly. This is blocking proper multilingual support for event organizers.
