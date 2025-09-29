# Analyse Juridique - Données Personnelles et Technologies de Suivi
**Application Be-Out Apps**
**Date : 29 septembre 2025**

---

## **Technologies de Cookies et de Suivi Utilisées :**

### **1. Cookies de Session (Côté serveur)**
- **Sessions Express** : L'application utilise `express-session` pour l'authentification
  - Les cookies de session sont HTTP-only pour la sécurité
  - Expiration de 24 heures
  - Utilisés uniquement pour les flux d'authentification OAuth
  - Configurés avec `sameSite: "lax"` pour la compatibilité OAuth

### **2. Stockage Local (Côté client)**
- **Jetons d'authentification** : Jetons JWT stockés dans le localStorage du navigateur
- **Données de profil utilisateur** : Informations utilisateur de base mises en cache localement
- **Préférences linguistiques** : Langue sélectionnée par l'utilisateur (français/anglais/espagnol)
- **Aucune donnée de suivi ou d'analyse stockée**

---

## **SDKs et Services Tiers :**

### **1. Services Google**
- **Google OAuth** : Pour l'authentification utilisateur (Google Sign-In)
- **Google Auth Library** : Vérification de jetons côté serveur
- **Pas de Google Analytics ou de suivi Firebase**

### **2. Facebook OAuth**
- **Facebook Login** : Authentification de base uniquement
- **Pas de Facebook Pixel ou de technologies de suivi**

### **3. Traitement des Paiements Stripe**
- **Stripe SDK** : Pour le traitement des paiements uniquement
- **@stripe/stripe-js** et **@stripe/react-stripe-js**
- **Uniquement des données transactionnelles, pas de suivi comportemental**

### **4. Mapbox**
- **Mapbox GL JS** : Pour les cartes interactives affichant les lieux d'événements
- **Jeton d'accès** : `VITE_MAPBOX_ACCESS_TOKEN`
- **Utilisé uniquement pour le rendu de cartes, pas pour le suivi utilisateur**

### **5. SendGrid**
- **Service de livraison d'emails** : Pour les emails transactionnels (confirmations de réservation, notifications)
- **Pas de pixels marketing ou de suivi dans les emails**

---

## **Données Personnelles Collectées :**

### **1. Données de Compte Utilisateur**
- **Adresse email** (obligatoire pour l'inscription)
- **Mot de passe** (haché avec bcrypt)
- **Fournisseur d'authentification** (email, Google, Facebook)

### **2. Données de Profil Utilisateur**
- **Prénom et nom de famille**
- **Numéro de téléphone**
- **Date de naissance**
- **Photo de profil** (optionnelle)

### **3. Informations d'Adresse**
- **Numéro et nom de rue**
- **Code postal**
- **Ville**
- **Pays** (par défaut la France)

### **4. Données de Réservation et de Transaction**
- **Historique et détails des réservations**
- **Informations de paiement** (traitées par Stripe, non stockées localement)
- **Préférences d'événements et favoris**
- **Codes QR pour les billets**

### **5. Données Spécifiques aux Organisateurs** (pour les organisateurs d'événements)
- **Informations d'entreprise**
- **Numéros d'immatriculation d'entreprise**
- **Numéros de TVA**
- **Détails de compte bancaire** (gérés par Stripe Connect)

### **6. Données Système/Techniques**
- **User agent et adresse IP** (dans les logs serveur uniquement)
- **Préférences linguistiques**
- **Horodatages d'authentification**

---

## **Notes Importantes pour la Conformité Légale :**

### ✅ **Aucun Suivi Analytique ou Comportemental**
L'application **N'utilise PAS** :
- Google Analytics
- Firebase Analytics
- Facebook Pixel
- Toute technologie de suivi comportemental

### ✅ **Collecte de Données Minimale**
La collecte de données est limitée à ce qui est fonctionnellement nécessaire pour la plateforme de réservation d'événements.

### ✅ **Traitement de Données par des Tiers**
- **Stripe** : Gère les données de paiement (conforme PCI DSS)
- **Google/Facebook** : Uniquement pour l'authentification (jetons OAuth, pas de suivi)
- **SendGrid** : Uniquement pour les emails transactionnels

### ✅ **Stockage de Données Local**
Utilise le localStorage du navigateur uniquement pour l'authentification et les préférences utilisateur, **pas de cookies de suivi**.

### ✅ **Localisation Géographique**
Mapbox est utilisé uniquement pour afficher les lieux d'événements sur les cartes, **pas pour le suivi de localisation utilisateur**.

---

## **Conclusion Technique**

Cette architecture suggère que l'application est conçue avec **la vie privée à l'esprit**, se concentrant sur la collecte de données fonctionnelles plutôt que sur l'analyse marketing ou comportementale.

L'application respecte les principes de **minimisation des données** et de **finalité** requis par le RGPD.

---

**Document généré automatiquement par l'analyse du code source**
**Chemin de stockage** : `/home/zen/dev/be-out-apps/docs/ANALYSE_JURIDIQUE_DONNEES_PERSONNELLES.md`
