#!/bin/bash

# Bulk replace hardcoded French strings in TicketDesignStep.jsx
FILE="/home/zen/dev/be-out-apps/organizer-client/src/components/steps/TicketDesignStep.jsx"

# Color and UI elements
sed -i "s/t('Choisir une image')/t('organizer:tickets.design.chooseImage')/g" "$FILE"
sed -i "s/t('Supprimer')/t('organizer:tickets.design.remove')/g" "$FILE"
sed -i "s/t('Couleur principale')/t('organizer:tickets.design.primaryColor')/g" "$FILE"
sed -i "s/t('Couleur secondaire')/t('organizer:tickets.design.secondaryColor')/g" "$FILE"

# Logo options
sed -i "s/t('Logo Be-Out dans le pied de page')/t('organizer:tickets.design.logo.footer')/g" "$FILE"
sed -i "s/t('Logo SVG (recommandé)')/t('organizer:tickets.design.logo.svg')/g" "$FILE"
sed -i "s/t('Logo Orange PNG')/t('organizer:tickets.design.logo.orangePng')/g" "$FILE"
sed -i "s/t('Logo Noir PNG')/t('organizer:tickets.design.logo.blackPng')/g" "$FILE"
sed -i "s/t('Logo Blanc PNG')/t('organizer:tickets.design.logo.whitePng')/g" "$FILE"
sed -i "s/t('Aucun logo')/t('organizer:tickets.design.logo.none')/g" "$FILE"

# Messages and QR Code
sed -i "s/t('Message personnalisé')/t('organizer:tickets.design.customMessage')/g" "$FILE"
sed -i "s/t('Merci pour votre participation!')/t('organizer:tickets.design.customMessageDefault')/g" "$FILE"
sed -i "s/t('Configuration du QR Code')/t('organizer:tickets.design.qrCode.title')/g" "$FILE"
sed -i "s/t('Le QR Code permet de vérifier l\\'authenticité des billets et facilite le contrôle d\\'accès à vos événements.')/t('organizer:tickets.design.qrCode.description')/g" "$FILE"
sed -i "s/t('Contenu du QR Code')/t('organizer:tickets.design.qrCode.content')/g" "$FILE"
sed -i "s/t('Exemple')/t('organizer:tickets.design.qrCode.example')/g" "$FILE"
sed -i "s/t('Données personnalisées (JSON)')/t('organizer:tickets.design.qrCode.customJsonLabel')/g" "$FILE"
sed -i "s/t('Format JSON valide requis')/t('organizer:tickets.design.qrCode.jsonRequired')/g" "$FILE"
sed -i "s/t('Recommandation')/t('organizer:tickets.design.qrCode.recommendation')/g" "$FILE"
sed -i "s/t('L\\'URL de vérification est l\\'option la plus sécurisée car elle permet de valider en temps réel l\\'authenticité du billet et son statut.')/t('organizer:tickets.design.qrCode.recommendationText')/g" "$FILE"

# Pricing section
sed -i "s/t('Tarifs et catégories')/t('organizer:tickets.pricing.title')/g" "$FILE"
sed -i "s/t('Ajouter un tarif')/t('organizer:tickets.pricing.addRate')/g" "$FILE"
sed -i "s/t('Aucun tarif spécifique défini. Le prix principal de l\\'événement sera utilisé.')/t('organizer:tickets.pricing.noRates')/g" "$FILE"
sed -i "s/t('Tarif')/t('organizer:tickets.pricing.rate')/g" "$FILE"
sed -i "s/t('Nom du tarif')/t('organizer:tickets.pricing.rateName')/g" "$FILE"
sed -i "s/t('Ex: Tarif réduit, VIP, Étudiant')/t('organizer:tickets.pricing.rateNamePlaceholder')/g" "$FILE"
sed -i "s/t('Prix (€)')/t('organizer:tickets.pricing.price')/g" "$FILE"
sed -i "s/t('Quantité')/t('organizer:tickets.pricing.quantity')/g" "$FILE"
sed -i "s/t('Description')/t('organizer:tickets.pricing.description')/g" "$FILE"
sed -i "s/t('Décrivez ce qui est inclus dans ce tarif')/t('organizer:tickets.pricing.description')/g" "$FILE"

# Booking settings
sed -i "s/t('Paramètres de réservation')/t('organizer:tickets.booking.settings')/g" "$FILE"
sed -i "s/t('Date limite de réservation')/t('organizer:tickets.booking.deadline')/g" "$FILE"
sed -i "s/t('Laissez vide pour permettre les réservations jusqu\\'au début de l\\'événement')/t('organizer:tickets.booking.deadlineHelp')/g" "$FILE"
sed -i "s/t('Maximum de réservations par utilisateur')/t('organizer:tickets.booking.maxPerUser')/g" "$FILE"
sed -i "s/t('Autoriser plusieurs réservations par utilisateur')/t('organizer:tickets.booking.allowMultiple')/g" "$FILE"

echo "Bulk replacement completed for TicketDesignStep.jsx"
