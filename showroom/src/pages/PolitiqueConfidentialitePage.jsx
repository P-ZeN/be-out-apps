import React from "react";
import { Container, Typography, Box, Divider, Paper } from "@mui/material";
import { useTranslation } from "react-i18next";

const PolitiqueConfidentialitePage = () => {
    const { t } = useTranslation("showroom");

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={0} sx={{ p: 4 }}>
                <Typography variant="h3" component="h1" gutterBottom align="center" color="primary">
                    Politique de Confidentialité (RGPD)
                </Typography>
                
                <Divider sx={{ my: 3 }} />

                <Box sx={{ '& > *': { mb: 3 } }}>
                    <Typography variant="body1" paragraph>
                        La société Be Out, opérée par Wendy David – Auto-entrepreneur, attache une grande importance à la protection des données personnelles de ses utilisateurs. La présente Politique de Confidentialité explique quelles données nous collectons, pourquoi, comment elles sont utilisées, avec qui elles peuvent être partagées, et quels sont vos droits.
                    </Typography>
                    <Typography variant="body1" paragraph>
                        <strong>Contact RGPD :</strong> contact@be-out.app
                    </Typography>

                    <Typography variant="h4" component="h2" gutterBottom>
                        1. Responsable du traitement
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Be Out, opérée par Wendy David – Auto-entrepreneur est responsable du traitement des données collectées via l'Application.
                    </Typography>

                    <Typography variant="h4" component="h2" gutterBottom>
                        2. Données collectées
                    </Typography>
                    <Box component="ul" sx={{ pl: 3 }}>
                        <Typography component="li" variant="body1" paragraph>
                            <strong>Données d'identification :</strong> prénom, nom, adresse e-mail, numéro de téléphone.
                        </Typography>
                        <Typography component="li" variant="body1" paragraph>
                            <strong>Données de connexion / usage :</strong> identifiants de compte, historique de navigation dans l'App, pages consultées, événements recherchés.
                        </Typography>
                        <Typography component="li" variant="body1" paragraph>
                            <strong>Données de paiement :</strong> nous ne stockons pas directement vos données bancaires sensibles — ces données sont traitées via des prestataires sécurisés (ex. Stripe, PayPal).
                        </Typography>
                        <Typography component="li" variant="body1" paragraph>
                            <strong>Données de réservation / transaction :</strong> événements réservés, horodatage, statuts des transactions.
                        </Typography>
                        <Typography component="li" variant="body1" paragraph>
                            <strong>Préférences :</strong> vos choix (notifications, filtres, alertes), centres d'intérêt.
                        </Typography>
                    </Box>

                    <Typography variant="h4" component="h2" gutterBottom>
                        3. Finalités du traitement
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Nous utilisons vos données pour :
                    </Typography>
                    <Box component="ul" sx={{ pl: 3 }}>
                        <Typography component="li" variant="body1" paragraph>
                            Créer et gérer votre compte utilisateur.
                        </Typography>
                        <Typography component="li" variant="body1" paragraph>
                            Gérer vos réservations et paiements.
                        </Typography>
                        <Typography component="li" variant="body1" paragraph>
                            Vous envoyer des notifications, newsletters ou offres ciblées (si vous y consentez).
                        </Typography>
                        <Typography component="li" variant="body1" paragraph>
                            Améliorer, personnaliser et sécuriser l'expérience utilisateur.
                        </Typography>
                        <Typography component="li" variant="body1" paragraph>
                            Détecter, prévenir et lutter contre la fraude.
                        </Typography>
                        <Typography component="li" variant="body1" paragraph>
                            Répondre à vos demandes de support ou réclamations.
                        </Typography>
                    </Box>

                    <Typography variant="h4" component="h2" gutterBottom>
                        4. Base légale du traitement
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Nos traitements reposent sur les fondements suivants :
                    </Typography>
                    <Box component="ul" sx={{ pl: 3 }}>
                        <Typography component="li" variant="body1" paragraph>
                            <strong>Exécution d'un contrat :</strong> pour gérer votre compte, vos réservations, paiements.
                        </Typography>
                        <Typography component="li" variant="body1" paragraph>
                            <strong>Consentement :</strong> pour les communications marketing (newsletter, notifications).
                        </Typography>
                        <Typography component="li" variant="body1" paragraph>
                            <strong>Intérêt légitime :</strong> optimisation de l'Application, prévention de la fraude, sécurité.
                        </Typography>
                    </Box>

                    <Typography variant="h4" component="h2" gutterBottom>
                        5. Destinataires des données
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Vos données peuvent être partagées avec :
                    </Typography>
                    <Box component="ul" sx={{ pl: 3 }}>
                        <Typography component="li" variant="body1" paragraph>
                            Les salles / organisateurs partenaires (pour confirmer les réservations).
                        </Typography>
                        <Typography component="li" variant="body1" paragraph>
                            Nos prestataires techniques (hébergement, services de paiement, emailing).
                        </Typography>
                        <Typography component="li" variant="body1" paragraph>
                            Les autorités compétentes si la loi l'exige (ex. en cas de demande légale).
                        </Typography>
                    </Box>

                    <Typography variant="h4" component="h2" gutterBottom>
                        6. Durée de conservation
                    </Typography>
                    <Box component="ul" sx={{ pl: 3 }}>
                        <Typography component="li" variant="body1" paragraph>
                            <strong>Données de compte :</strong> conservées tant que vous utilisez l'Application (et pendant une durée raisonnable après fermeture de compte, pour archiver les données légales).
                        </Typography>
                        <Typography component="li" variant="body1" paragraph>
                            <strong>Données de réservation / transaction :</strong> conservées pendant 5 ans, conformément aux obligations légales en matière comptable / fiscale.
                        </Typography>
                        <Typography component="li" variant="body1" paragraph>
                            <strong>Données marketing :</strong> conservées jusqu'au retrait de votre consentement (si vous désactivez les mails / notifications).
                        </Typography>
                    </Box>

                    <Typography variant="h4" component="h2" gutterBottom>
                        7. Vos droits
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Vous disposez des droits suivants :
                    </Typography>
                    <Box component="ul" sx={{ pl: 3 }}>
                        <Typography component="li" variant="body1" paragraph>
                            <strong>Droit d'accès :</strong> demander la copie des données que nous détenons.
                        </Typography>
                        <Typography component="li" variant="body1" paragraph>
                            <strong>Droit de rectification :</strong> corriger des données inexactes.
                        </Typography>
                        <Typography component="li" variant="body1" paragraph>
                            <strong>Droit à la suppression :</strong> demander l'effacement de vos données (dans les limites légales).
                        </Typography>
                        <Typography component="li" variant="body1" paragraph>
                            <strong>Droit à la limitation du traitement.</strong>
                        </Typography>
                        <Typography component="li" variant="body1" paragraph>
                            <strong>Droit d'opposition :</strong> notamment aux traitements à finalité marketing.
                        </Typography>
                        <Typography component="li" variant="body1" paragraph>
                            <strong>Droit à la portabilité :</strong> récupérer vos données dans un format structuré, couramment utilisé.
                        </Typography>
                    </Box>
                    <Typography variant="body1" paragraph>
                        Pour exercer vos droits, contactez-nous via l'adresse <strong>contact@be-out.app</strong>. Nous traiterons votre demande sous 30 jours au maximum.
                    </Typography>

                    <Typography variant="h4" component="h2" gutterBottom>
                        8. Désinscription & suppression du compte
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Pour vous désinscrire de la newsletter : lien de désinscription présent en bas de chaque e-mail envoyé.
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Pour supprimer votre compte : envoyez une demande à <strong>contact@be-out.app</strong> avec l'objet « Suppression de compte », ou utilisez l'option dans l'Application (Paramètres &gt; Supprimer mon compte).
                    </Typography>

                    <Typography variant="h4" component="h2" gutterBottom>
                        9. Sécurité des données
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Nous stockons vos données sur des serveurs sécurisés localisés en France / UE. Nous mettons en œuvre des mesures techniques et organisationnelles (chiffrement, contrôle d'accès, sauvegardes, etc.) pour prévenir toute perte, accès non autorisé ou divulgation.
                    </Typography>

                    <Typography variant="h4" component="h2" gutterBottom>
                        10. Cookies & traceurs
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Nous utilisons des cookies / traceurs pour assurer le fonctionnement de l'Application (cookies nécessaires), analyser l'usage (statistiques anonymes), et vous proposer des contenus personnalisés (si vous y consentez).
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Vous pouvez accepter, refuser ou retirer votre consentement à tout moment via les paramètres de l'Application.
                    </Typography>

                    <Typography variant="h4" component="h2" gutterBottom>
                        11. Modification de la politique
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Nous pouvons être amenés à modifier la présente Politique de Confidentialité (ex. pour respecter une nouvelle législation). La date de la version en vigueur sera toujours indiquée en haut du document. En cas de modification significative, nous vous informerons par notification ou e-mail.
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
};

export default PolitiqueConfidentialitePage;
