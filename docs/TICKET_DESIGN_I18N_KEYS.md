# Ticket Design i18n Translation Keys

## Overview

This document lists all the new internationalization (i18n) keys added for the enhanced ticket design system. All keys have been added to the `organizer-client/src/i18n/index.js` file in French (fr), English (en), and Spanish (es).

## New Translation Keys Added

### Ticket Format/Size
| Key | French | English | Spanish |
|-----|--------|---------|---------|
| `"Format du billet"` | "Format du billet" | "Ticket Format" | "Formato del boleto" |
| `"A4 (210×297mm)"` | "A4 (210×297mm)" | "A4 (210×297mm)" | "A4 (210×297mm)" |
| `"1/2 A4 (210×148mm)"` | "1/2 A4 (210×148mm)" | "1/2 A4 (210×148mm)" | "1/2 A4 (210×148mm)" |
| `"1/4 A4 (105×148mm)"` | "1/4 A4 (105×148mm)" | "1/4 A4 (105×148mm)" | "1/4 A4 (105×148mm)" |
| `"Format standard complet"` | "Format standard complet" | "Full standard format" | "Formato estándar completo" |
| `"Format paysage"` | "Format paysage" | "Landscape format" | "Formato paisaje" |
| `"Format ticket compact"` | "Format ticket compact" | "Compact ticket format" | "Formato de boleto compacto" |

### Background Image
| Key | French | English | Spanish |
|-----|--------|---------|---------|
| `"Image de fond"` | "Image de fond" | "Background Image" | "Imagen de fondo" |
| `"Supprimer"` | "Supprimer" | "Remove" | "Eliminar" |

### App Logo
| Key | French | English | Spanish |
|-----|--------|---------|---------|
| `"Logo Be-Out dans le pied de page"` | "Logo Be-Out dans le pied de page" | "Be-Out Logo in Footer" | "Logo Be-Out en el pie de página" |
| `"Logo SVG (recommandé)"` | "Logo SVG (recommandé)" | "SVG Logo (recommended)" | "Logo SVG (recomendado)" |
| `"Logo Orange PNG"` | "Logo Orange PNG" | "Orange PNG Logo" | "Logo PNG Naranja" |
| `"Logo Noir PNG"` | "Logo Noir PNG" | "Black PNG Logo" | "Logo PNG Negro" |
| `"Logo Blanc PNG"` | "Logo Blanc PNG" | "White PNG Logo" | "Logo PNG Blanco" |
| `"Aucun logo"` | "Aucun logo" | "No logo" | "Sin logo" |

### QR Code Configuration
| Key | French | English | Spanish |
|-----|--------|---------|---------|
| `"Configuration du QR Code"` | "Configuration du QR Code" | "QR Code Configuration" | "Configuración del Código QR" |
| `"Le QR Code permet de vérifier l'authenticité des billets et facilite le contrôle d'accès à vos événements."` | "Le QR Code permet de vérifier l'authenticité des billets et facilite le contrôle d'accès à vos événements." | "The QR Code allows to verify ticket authenticity and facilitates access control to your events." | "El Código QR permite verificar la autenticidad de los boletos y facilita el control de acceso a sus eventos." |
| `"Contenu du QR Code"` | "Contenu du QR Code" | "QR Code Content" | "Contenido del Código QR" |

#### QR Code Options
| Key | French | English | Spanish |
|-----|--------|---------|---------|
| `"URL de vérification"` | "URL de vérification" | "Verification URL" | "URL de verificación" |
| `"Lien vers une page de validation du billet (recommandé)"` | "Lien vers une page de validation du billet (recommandé)" | "Link to a ticket validation page (recommended)" | "Enlace a una página de validación del boleto (recomendado)" |
| `"Référence de réservation"` | "Référence de réservation" | "Booking Reference" | "Referencia de reserva" |
| `"Code de référence unique du billet"` | "Code de référence unique du billet" | "Unique ticket reference code" | "Código de referencia único del boleto" |
| `"Hash de sécurité"` | "Hash de sécurité" | "Security Hash" | "Hash de seguridad" |
| `"Code cryptographique unique (plus sécurisé)"` | "Code cryptographique unique (plus sécurisé)" | "Unique cryptographic code (more secure)" | "Código criptográfico único (más seguro)" |
| `"Données personnalisées"` | "Données personnalisées" | "Custom Data" | "Datos personalizados" |
| `"Format JSON avec informations de votre choix"` | "Format JSON avec informations de votre choix" | "JSON format with information of your choice" | "Formato JSON con información de su elección" |

#### QR Code Helpers
| Key | French | English | Spanish |
|-----|--------|---------|---------|
| `"Exemple"` | "Exemple" | "Example" | "Ejemplo" |
| `"Données personnalisées (JSON)"` | "Données personnalisées (JSON)" | "Custom Data (JSON)" | "Datos personalizados (JSON)" |
| `"Format JSON valide requis"` | "Format JSON valide requis" | "Valid JSON format required" | "Formato JSON válido requerido" |
| `"Recommandation"` | "Recommandation" | "Recommendation" | "Recomendación" |
| `"L'URL de vérification est l'option la plus sécurisée car elle permet de valider en temps réel l'authenticité du billet et son statut."` | "L'URL de vérification est l'option la plus sécurisée car elle permet de valider en temps réel l'authenticité du billet et son statut." | "The verification URL is the most secure option as it allows real-time validation of ticket authenticity and status." | "La URL de verificación es la opción más segura ya que permite validar en tiempo real la autenticidad del boleto y su estado." |

## Implementation Details

### File Modified
- `organizer-client/src/i18n/index.js`

### Structure
The translation keys are organized within the `resources` object:
```javascript
const resources = {
    fr: { translation: { /* French keys */ } },
    es: { translation: { /* Spanish keys */ } },
    en: { translation: { /* English keys */ } }
};
```

### Key Usage in Component
All hardcoded strings in the `TicketDesignStep.jsx` component have been replaced with `t()` calls:

```javascript
// Before
name: 'A4 (210×297mm)'

// After  
name: t('A4 (210×297mm)')
```

```javascript
// Before
<Typography>Logo SVG (recommandé)</Typography>

// After
<Typography>{t('Logo SVG (recommandé)')}</Typography>
```

## Language Support

### Supported Languages
1. **French (fr)** - Default language
2. **English (en)** - Fallback language  
3. **Spanish (es)** - Additional language

### Language Detection
The organizer-client uses automatic language detection with:
1. localStorage preference
2. Browser navigator language
3. HTML tag language
4. Fallback to French

### Missing Keys Handling
- Falls back to French if key not found in selected language
- Falls back to English if key not found in French
- Displays key name if not found in any language (development mode shows warnings)

## Testing Checklist

### Functional Testing
- [ ] All ticket size options display correctly in all languages
- [ ] Background image upload button shows translated text
- [ ] Logo selection dropdown shows translated options
- [ ] QR Code configuration accordion shows translated content
- [ ] All radio button labels are translated
- [ ] Helper text and placeholders are translated
- [ ] Error messages and alerts are translated

### Language Switching
- [ ] French → English transition works
- [ ] French → Spanish transition works  
- [ ] English → Spanish transition works
- [ ] All permutations work correctly
- [ ] No missing key warnings in console
- [ ] No layout issues with longer translations

### Edge Cases
- [ ] Long Spanish translations don't break layout
- [ ] Short English translations maintain visual balance
- [ ] Special characters (é, ñ, ç) display correctly
- [ ] Currency symbols and measurements are appropriate per language

## Future Enhancements

### Potential Additions
1. **Regional Formats**: Date/time formats per locale
2. **Currency Localization**: € vs $ vs other currencies  
3. **Measurement Units**: mm vs inches for ticket sizes
4. **Cultural Adaptations**: Color preferences, design patterns
5. **Right-to-Left Support**: For Arabic, Hebrew when needed

### Maintenance Notes
- When adding new features to ticket design, remember to add translations for all 3 languages
- Keep key names consistent with existing naming patterns
- Use descriptive key names that indicate context
- Test translations with actual users from each language group
- Consider hiring native speakers for translation verification

---

**Note**: This translation system ensures that the enhanced ticket design features are accessible to French, English, and Spanish-speaking organizers, maintaining the app's multilingual support standards.
