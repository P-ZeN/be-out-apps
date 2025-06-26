# Internationalization (i18n) Setup

This application uses `react-i18next` for internationalization support.

## Supported Languages

1. **French (fr)** - Main language (default)
2. **Spanish (es)** - First translation
3. **English (en)** - Secondary language

## File Structure

```
src/i18n/
├── index.js                 # Main i18n configuration
└── locales/
    ├── fr/                  # French translations
    │   ├── common.json      # Common translations (buttons, forms, etc.)
    │   ├── auth.json        # Authentication related
    │   ├── home.json        # Home page content
    │   └── navigation.json  # Navigation and menus
    ├── es/                  # Spanish translations
    │   ├── common.json
    │   ├── auth.json
    │   ├── home.json
    │   └── navigation.json
    └── en/                  # English translations
        ├── common.json
        ├── auth.json
        ├── home.json
        └── navigation.json
```

## Usage in Components

```jsx
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation(['namespace1', 'namespace2']);

  return (
    <div>
      {/* Simple translation */}
      <h1>{t('common:buttons.login')}</h1>

      {/* Translation with interpolation */}
      <p>{t('home:subtitle.authenticated', { name: userName })}</p>
    </div>
  );
};
```

## Language Switching

Users can switch languages using the language switcher in the footer. The selected language is automatically saved to localStorage.

## Adding New Languages

1. Create a new folder in `src/i18n/locales/` (e.g., `de` for German)
2. Add all translation files (common.json, auth.json, home.json, navigation.json)
3. Update `src/i18n/index.js` to import and register the new language
4. Add the language option to `LanguageSwitcher.jsx`

## Translation Key Naming Convention

- Use namespaces to organize translations by feature/page
- Use dot notation for nested keys
- Use camelCase for key names
- Group related translations together

Example:
```json
{
  "buttons": {
    "getStarted": "Commencer",
    "signUp": "S'inscrire"
  },
  "messages": {
    "welcome": "Bienvenue",
    "error": "Erreur"
  }
}
```
