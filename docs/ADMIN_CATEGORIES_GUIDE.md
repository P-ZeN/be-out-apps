# Guide d'utilisation - Gestion des catégories multilingues

## Vue d'ensemble

Le système de gestion des catégories permet aux administrateurs de créer et gérer des catégories d'événements avec support complet pour les trois langues de l'application :
- 🇫🇷 **Français** (langue principale)
- 🇬🇧 **English** (langue secondaire)
- 🇪🇸 **Español** (langue tertiaire)

## Accès à la gestion des catégories

1. Connectez-vous au panel d'administration
2. Cliquez sur **"Paramètres"** dans le menu de navigation
3. Sélectionnez l'onglet **"Catégories"**

## Créer une nouvelle catégorie

1. Cliquez sur le bouton **"Nouvelle catégorie"**
2. Remplissez les informations dans chaque onglet de langue :
   - **Français** : Obligatoire (langue principale)
   - **English** : Optionnel (fallback vers le français si vide)
   - **Español** : Optionnel (fallback vers le français si vide)
3. Configurez les propriétés visuelles :
   - **Icône** : Nom d'icône Material-UI (ex: `music_note`) ou emoji (ex: 🎵)
   - **Couleur** : Couleur hexadécimale pour identifier visuellement la catégorie
4. Cliquez sur **"Créer"**

## Modifier une catégorie existante

1. Trouvez la catégorie dans la liste
2. Cliquez sur l'icône **"Modifier"** (crayon)
3. Modifiez les traductions dans les onglets correspondants
4. Cliquez sur **"Modifier"** pour sauvegarder

## Supprimer une catégorie

⚠️ **Attention** : Une catégorie ne peut être supprimée que si aucun événement ne l'utilise.

1. Vérifiez que la colonne "Événements" affiche "0 événements"
2. Cliquez sur l'icône **"Supprimer"** (poubelle)
3. Confirmez la suppression

## Bonnes pratiques

### Traductions
- **Toujours remplir le français** : C'est la langue de fallback principale
- **Être cohérent** : Utilisez un style et une terminologie cohérents
- **Éviter les traductions littérales** : Adaptez au contexte culturel de chaque langue

### Nommage
- **Noms courts** : Privilégiez des noms concis (1-3 mots)
- **Descriptions claires** : Expliquez le type d'événements couverts
- **Pas de doublons** : Vérifiez qu'une catégorie similaire n'existe pas déjà

### Visuels
- **Icônes cohérentes** : Utilisez des icônes Material-UI standards quand possible
- **Couleurs distinctes** : Choisissez des couleurs qui se démarquent des autres catégories
- **Accessibilité** : Évitez les couleurs trop claires ou trop foncées

## Exemples de catégories bien configurées

### Exemple 1 : Musique
- **Français** : "Musique" / "Concerts, festivals et événements musicaux"
- **English** : "Music" / "Concerts, festivals and music events"
- **Español** : "Música" / "Conciertos, festivales y eventos musicales"
- **Icône** : `music_note` ou 🎵
- **Couleur** : #9C27B0 (violet)

### Exemple 2 : Sport
- **Français** : "Sport" / "Événements sportifs et compétitions"
- **English** : "Sports" / "Sports events and competitions"
- **Español** : "Deportes" / "Eventos deportivos y competiciones"
- **Icône** : `sports_soccer` ou ⚽
- **Couleur** : #FF5722 (orange)

## Système de fallback

Le système utilise une logique de fallback intelligente :

1. **Affichage en français** : Utilise `name_fr` ou fallback vers `name`
2. **Affichage en anglais** : Utilise `name_en` → `name_fr` → `name`
3. **Affichage en espagnol** : Utilise `name_es` → `name_fr` → `name`

Cela garantit qu'une catégorie s'affiche toujours, même si toutes les traductions ne sont pas complètes.

## Dépannage

### La catégorie ne s'affiche pas
- Vérifiez qu'au moins le nom français est renseigné
- Vérifiez que la catégorie n'a pas été supprimée par erreur

### Les traductions ne s'affichent pas
- Vérifiez que l'utilisateur a bien changé de langue sur le site
- Vérifiez que la traduction a été sauvegardée
- Le cache peut nécessiter quelques minutes pour se mettre à jour

### Impossible de supprimer une catégorie
- Vérifiez qu'aucun événement (actif ou inactif) n'utilise cette catégorie
- Contactez un développeur si le problème persiste

## Support

Pour toute question ou problème technique, contactez l'équipe de développement avec :
- Une capture d'écran du problème
- Les étapes pour reproduire le problème
- Le navigateur et la version utilisés
