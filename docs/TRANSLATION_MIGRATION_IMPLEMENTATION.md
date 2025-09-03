# Translation System Migration Implementation Plan

## Phase 1: Emergency Fix for Organizer-Client 🚨

### Step 1.1: Create New Translation File Structure

Create organized namespace-based translation files:

```bash
# Create directory structure
mkdir -p organizer-client/src/i18n/locales/{fr,en,es}

# Create namespace files for French (primary language)
touch organizer-client/src/i18n/locales/fr/{auth,common,events,venues,tickets,publication}.json
```

### Step 1.2: Split Current Monolithic Translation

**Current problematic structure in `organizer-client/src/i18n/index.js`:**
- Single `translation` object with 500+ mixed keys
- Hardcoded French strings as keys
- No namespace organization

**New structure:**

#### `organizer-client/src/i18n/locales/fr/auth.json`
```json
{
  "login": "Se connecter",
  "logout": "Déconnexion",
  "register": "S'inscrire",
  "email": "Email",
  "password": "Mot de passe",
  "registration": {
    "title": "Devenir organisateur",
    "subtitle": "Créez votre compte pour commencer à organiser des événements",
    "confirmPassword": "Confirmer le mot de passe",
    "companyName": "Nom de l'entreprise",
    "contactPerson": "Personne de contact",
    "phone": "Téléphone",
    "registering": "Inscription...",
    "alreadyHaveAccount": "Déjà inscrit ?",
    "success": {
      "title": "Inscription réussie !",
      "message": "Votre demande d'inscription a été envoyée. Un administrateur va examiner votre profil et vous serez notifié par email une fois votre compte approuvé.",
      "redirecting": "Redirection vers la page de connexion..."
    },
    "errors": {
      "passwordMismatch": "Les mots de passe ne correspondent pas",
      "failed": "Erreur lors de l'inscription"
    }
  }
}
```

#### `organizer-client/src/i18n/locales/fr/common.json`
```json
{
  "loading": "Chargement...",
  "save": "Enregistrer",
  "cancel": "Annuler",
  "delete": "Supprimer",
  "edit": "Modifier",
  "view": "Voir",
  "create": "Créer",
  "submit": "Soumettre",
  "back": "Retour",
  "next": "Suivant",
  "status": {
    "active": "Actif",
    "draft": "Brouillon",
    "cancelled": "Annulé",
    "pending": "En attente",
    "approved": "Approuvé",
    "rejected": "Rejeté"
  }
}
```

#### `organizer-client/src/i18n/locales/fr/events.json`
```json
{
  "details": {
    "title": "Détails de l'événement",
    "description": "Renseignez les informations principales de votre événement.",
    "fields": {
      "title": "Titre de l'événement",
      "titlePlaceholder": "Ex: Concert de jazz au parc",
      "description": "Description",
      "descriptionPlaceholder": "Décrivez votre événement de manière attractive...",
      "dateTime": "Date et heure",
      "category": "Catégorie",
      "price": "Prix",
      "priceHelp": "Laissez vide pour un événement gratuit",
      "maxParticipants": "Nombre maximum de participants",
      "maxParticipantsHelp": "Laissez vide pour illimité",
      "tags": "Tags",
      "image": "Image de l'événement",
      "chooseImage": "Choisir une image",
      "selectedFile": "Fichier sélectionné:",
      "requirements": "Prérequis ou conditions",
      "requirementsPlaceholder": "Ex: Âge minimum 18 ans, tenue correcte exigée...",
      "requirementsHelp": "Indiquez les conditions particulières de participation",
      "cancellationPolicy": "Politique d'annulation",
      "cancellationPlaceholder": "Ex: Remboursement intégral jusqu'à 48h avant l'événement...",
      "cancellationHelp": "Décrivez les conditions de remboursement et d'annulation",
      "featured": "Événement mis en avant",
      "featuredHelp": "Les événements mis en avant apparaissent en priorité dans les recherches"
    }
  }
}
```

#### `organizer-client/src/i18n/locales/fr/venues.json`
```json
{
  "title": "Lieu de l'événement",
  "description": "Sélectionnez où se déroulera votre événement. Vous pouvez également créer un nouveau lieu.",
  "selected": "Lieu sélectionné",
  "capacity": "Capacité:",
  "people": "personnes"
}
```

#### `organizer-client/src/i18n/locales/fr/tickets.json`
```json
{
  "preview": {
    "title": "Aperçu du billet",
    "fillDetails": "Remplissez les détails de l'événement pour voir l'aperçu"
  },
  "design": {
    "title": "Design et billetterie",
    "description": "Configurez l'apparence de vos billets et les options de réservation.",
    "template": "Modèle de billet",
    "defaultTemplate": "Modèle par défaut",
    "customization": "Personnalisation",
    "primaryColor": "Couleur principale",
    "secondaryColor": "Couleur secondaire",
    "customMessage": "Message personnalisé",
    "customMessageDefault": "Merci pour votre participation!",
    "format": {
      "title": "Format du billet",
      "a4": "A4 (210×297mm)",
      "halfA4": "1/2 A4 (210×148mm)",
      "quarterA4": "1/4 A4 (105×148mm)",
      "standardFull": "Format standard complet",
      "landscape": "Format paysage",
      "compact": "Format ticket compact"
    },
    "backgroundImage": "Image de fond",
    "remove": "Supprimer",
    "logo": {
      "footer": "Logo Be-Out dans le pied de page",
      "svg": "Logo SVG (recommandé)",
      "orangePng": "Logo Orange PNG",
      "blackPng": "Logo Noir PNG",
      "whitePng": "Logo Blanc PNG",
      "none": "Aucun logo"
    },
    "qrCode": {
      "title": "Configuration du QR Code",
      "description": "Le QR Code permet de vérifier l'authenticité des billets et facilite le contrôle d'accès à vos événements.",
      "content": "Contenu du QR Code",
      "verificationUrl": "URL de vérification",
      "verificationDescription": "Lien vers une page de validation du billet (recommandé)",
      "bookingReference": "Référence de réservation",
      "bookingDescription": "Code de référence unique du billet",
      "securityHash": "Hash de sécurité",
      "securityDescription": "Code cryptographique unique (plus sécurisé)",
      "customData": "Données personnalisées",
      "customDescription": "Format JSON avec informations de votre choix",
      "example": "Exemple",
      "customJsonLabel": "Données personnalisées (JSON)",
      "jsonRequired": "Format JSON valide requis",
      "recommendation": "Recommandation",
      "recommendationText": "L'URL de vérification est l'option la plus sécurisée car elle permet de valider en temps réel l'authenticité du billet et son statut."
    }
  },
  "pricing": {
    "title": "Tarifs et catégories",
    "addRate": "Ajouter un tarif",
    "noRates": "Aucun tarif spécifique défini. Le prix principal de l'événement sera utilisé.",
    "rate": "Tarif",
    "rateName": "Nom du tarif",
    "rateNamePlaceholder": "Ex: Tarif réduit, VIP, Étudiant",
    "price": "Prix (€)",
    "quantity": "Quantité",
    "description": "Décrivez ce qui est inclus dans ce tarif"
  },
  "booking": {
    "settings": "Paramètres de réservation",
    "deadline": "Date limite de réservation",
    "deadlineHelp": "Laissez vide pour permettre les réservations jusqu'au début de l'événement",
    "maxPerUser": "Maximum de réservations par utilisateur",
    "allowMultiple": "Autoriser plusieurs réservations par utilisateur"
  }
}
```

#### `organizer-client/src/i18n/locales/fr/publication.json`
```json
{
  "title": "Publication et modération",
  "description": "Gérez la publication de votre événement et suivez son statut de modération.",
  "summary": {
    "title": "Récapitulatif de l'événement",
    "details": "Détails de l'événement",
    "detailsComplete": "Titre, description et détails configurés",
    "venue": "Lieu",
    "venueComplete": "Lieu sélectionné et configuré",
    "ticketing": "Billetterie",
    "ticketingComplete": "Configuration des billets terminée"
  },
  "status": {
    "current": "Statut actuel de l'événement",
    "approval": "Statut d'approbation:",
    "general": "Statut général:",
    "approved": "Approuvé",
    "rejected": "Rejeté",
    "underReview": "En cours de révision",
    "revisionRequested": "Révision demandée",
    "flagged": "Signalé",
    "pending": "En attente de révision",
    "draft": "Brouillon",
    "published": "Publié",
    "approvedNotPublished": "Approuvé (non publié)",
    "pendingValidation": "En attente de validation",
    "cancelled": "Annulé",
    "suspended": "Suspendu",
    "finished": "Terminé",
    "unknown": "Statut inconnu"
  },
  "admin": {
    "comments": "Commentaires de l'administrateur:",
    "noComments": "Aucun commentaire de l'administrateur"
  },
  "actions": {
    "title": "Actions disponibles",
    "submitReview": "Soumettre pour révision",
    "submitDescription": "Envoyez votre événement à l'équipe de modération pour approbation",
    "submit": "Soumettre",
    "revertDraft": "Remettre en brouillon",
    "revertDescription": "Retirez votre événement de la révision pour le modifier",
    "unpublish": "Dépublier l'événement",
    "publish": "Publier l'événement",
    "unpublishDescription": "Masquez votre événement du public temporairement",
    "publishDescription": "Rendez votre événement visible au public",
    "unpublishBtn": "Dépublier",
    "publishBtn": "Publier",
    "viewPublic": "Voir la page publique",
    "viewPublicDescription": "Consultez votre événement tel qu'il apparaît aux visiteurs",
    "viewPage": "Voir la page",
    "statusHistory": "Historique des statuts",
    "statusHistoryDescription": "Consultez l'historique complet des modifications de statut",
    "viewHistory": "Voir l'historique"
  },
  "options": {
    "title": "Options de publication",
    "submitAfterCreation": "Sera soumis à la révision après création",
    "stayDraftAfterCreation": "Rester en brouillon après création",
    "reviewTime": "Votre événement sera examiné par notre équipe dans un délai de 24-48 heures",
    "submitForReview": "Sera soumis à la révision",
    "stayDraft": "Rester en brouillon",
    "reviewSoon": "Votre événement sera examiné bientôt"
  },
  "process": {
    "title": "Processus de modération",
    "draft": "Brouillon:",
    "draftDescription": "Votre événement est en cours de création, vous pouvez le modifier librement",
    "review": "En révision:",
    "reviewDescription": "Notre équipe examine votre événement (24-48h)",
    "approved": "Approuvé:",
    "approvedDescription": "Vous pouvez maintenant publier votre événement",
    "published": "Publié:",
    "publishedDescription": "Votre événement est visible par le public et les réservations sont ouvertes",
    "note": "Note:",
    "noteDescription": "Vous pouvez modifier un événement en brouillon ou si l'administrateur demande des révisions. Une fois approuvé et publié, les modifications majeures nécessiteront une nouvelle révision."
  }
}
```

### Step 1.3: Update i18n Configuration

Replace the monolithic `organizer-client/src/i18n/index.js` with proper namespace imports:

```javascript
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import French translations
import authFr from "./locales/fr/auth.json";
import commonFr from "./locales/fr/common.json";
import eventsFr from "./locales/fr/events.json";
import venuesFr from "./locales/fr/venues.json";
import ticketsFr from "./locales/fr/tickets.json";
import publicationFr from "./locales/fr/publication.json";

// Import English translations (to be created)
import authEn from "./locales/en/auth.json";
import commonEn from "./locales/en/common.json";
import eventsEn from "./locales/en/events.json";
import venuesEn from "./locales/en/venues.json";
import ticketsEn from "./locales/en/tickets.json";
import publicationEn from "./locales/en/publication.json";

// Import Spanish translations (to be created)
import authEs from "./locales/es/auth.json";
import commonEs from "./locales/es/common.json";
import eventsEs from "./locales/es/events.json";
import venuesEs from "./locales/es/venues.json";
import ticketsEs from "./locales/es/tickets.json";
import publicationEs from "./locales/es/publication.json";

const resources = {
    fr: {
        auth: authFr,
        common: commonFr,
        events: eventsFr,
        venues: venuesFr,
        tickets: ticketsFr,
        publication: publicationFr,
    },
    en: {
        auth: authEn,
        common: commonEn,
        events: eventsEn,
        venues: venuesEn,
        tickets: ticketsEn,
        publication: publicationEn,
    },
    es: {
        auth: authEs,
        common: commonEs,
        events: eventsEs,
        venues: venuesEs,
        tickets: ticketsEs,
        publication: publicationEs,
    },
};

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        defaultNS: "common",
        fallbackLng: "fr",
        debug: import.meta.env.DEV,

        interpolation: {
            escapeValue: false,
        },

        detection: {
            order: ["localStorage", "navigator", "htmlTag"],
            caches: ["localStorage"],
        },
    });

export default i18n;
```

### Step 1.4: Update Component Translation Calls

**CRITICAL: Replace all hardcoded French strings with proper keys**

#### Before (WRONG):
```javascript
// organizer-client/src/components/steps/EventDetailsStep.jsx
const { t } = useTranslation();

return (
    <Typography variant="h5">
        {t('Détails de l\'événement')}
    </Typography>
    <Typography variant="body2">
        {t('Renseignez les informations principales de votre événement.')}
    </Typography>
    <TextField
        label={t('Description')}
        placeholder={t('Décrivez votre événement de manière attractive...')}
    />
);
```

#### After (CORRECT):
```javascript
// organizer-client/src/components/steps/EventDetailsStep.jsx
const { t } = useTranslation(['events', 'common']);

return (
    <Typography variant="h5">
        {t('events:details.title')}
    </Typography>
    <Typography variant="body2">
        {t('events:details.description')}
    </Typography>
    <TextField
        label={t('events:details.fields.description')}
        placeholder={t('events:details.fields.descriptionPlaceholder')}
    />
);
```

### Step 1.5: Component-by-Component Migration

#### Files to update:

1. **`organizer-client/src/components/steps/EventDetailsStep.jsx`**
   - Replace all `t('French text')` with `t('events:details.fieldName')`
   - Update useTranslation to include events namespace

2. **`organizer-client/src/components/steps/VenueStep.jsx`**
   - Replace with `t('venues:key')`
   - Update useTranslation to include venues namespace

3. **`organizer-client/src/components/steps/TicketDesignStep.jsx`**
   - Replace with `t('tickets:design.key')`
   - Update useTranslation to include tickets namespace

4. **`organizer-client/src/components/steps/PublicationStep.jsx`**
   - Replace with `t('publication:key')`
   - Update useTranslation to include publication namespace

5. **`organizer-client/src/components/ticket/TicketPreview.jsx`**
   - Replace with `t('tickets:preview.key')`

6. **`organizer-client/src/pages/Register.jsx`**
   - Replace with `t('auth:registration.key')`

## Phase 2: Clean Client Application 🟡

### Step 2.1: Fix Profile Component Hardcoded Strings

**File: `client/src/components/Profile.jsx`**

Replace hardcoded strings:
```javascript
// Add to client/src/i18n/locales/*/profile.json
{
  "title": "Profile",
  "edit": "Edit",
  "save": "Save",
  "cancel": "Cancel",
  "saving": "Saving...",
  "fields": {
    "firstName": "First Name",
    "lastName": "Last Name",
    "email": "Email",
    "phone": "Phone",
    "dateOfBirth": "Date of Birth",
    "streetNumber": "Street Number",
    "streetName": "Street Name",
    "postalCode": "Postal Code",
    "city": "City",
    "country": "Country"
  },
  "messages": {
    "updateSuccess": "Profile updated successfully!",
    "fetchError": "Failed to fetch profile",
    "updateError": "Failed to update profile. Please try again.",
    "emailCannotChange": "Email cannot be changed"
  }
}
```

### Step 2.2: Remove Orphaned Keys

**Delete unused translation files:**
- `client/src/i18n/locales/*/map.json` (not imported)
- Sync server translations to match client needs

### Step 2.3: Add Missing Namespaces to Client i18n

Update `client/src/i18n/index.js` to include profile namespace.

## Phase 3: Validation and Testing 🟢

### Step 3.1: Automated Validation Script

Create script to verify all translation keys exist:

```javascript
// scripts/validate-translations.js
import fs from 'fs';
import path from 'path';

// Scan all t() calls and verify keys exist in translation files
```

### Step 3.2: Manual Testing Checklist

- [ ] Language switching works in client
- [ ] Language switching works in organizer-client
- [ ] All text displays correctly in French
- [ ] All text displays correctly in English
- [ ] All text displays correctly in Spanish
- [ ] No missing translation errors in console
- [ ] Admin translation interface can edit organizer keys

## Implementation Order

1. **Day 1**: Create new organizer-client translation structure (Step 1.1-1.3)
2. **Day 2**: Migrate EventDetailsStep and VenueStep components (Step 1.4-1.5)
3. **Day 3**: Migrate remaining organizer components and test
4. **Day 4**: Fix client Profile component and cleanup (Phase 2)
5. **Day 5**: Validation, testing, and final cleanup (Phase 3)

## Critical Success Factors

1. **Complete Key Migration**: Every `t('French text')` must become `t('namespace:key')`
2. **Namespace Consistency**: Use consistent namespace naming across components
3. **Translation File Completeness**: Ensure all three languages have all keys
4. **Admin Interface Compatibility**: Translation keys must work with admin editing interface

This migration is critical for the translation management system to function properly!
