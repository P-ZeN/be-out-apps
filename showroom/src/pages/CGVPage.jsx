import React from "react";
import { Container, Typography, Box, Divider, Paper } from "@mui/material";
import { useTranslation } from "react-i18next";

const CGVPage = () => {
    const { t } = useTranslation("showroom");

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={0} sx={{ p: 4 }}>
                <Typography variant="h3" component="h1" gutterBottom align="center" color="primary">
                    Conditions Générales de Vente (CGV)
                </Typography>
                
                <Divider sx={{ my: 3 }} />

                <Box sx={{ '& > *': { mb: 3 } }}>
                    <Typography variant="h4" component="h2" gutterBottom>
                        Préambule
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Les présentes conditions générales de vente (ci-après « CGV ») s'appliquent à toutes les prestations conclues via l'application mobile et le site web **Be Out**, propriété de la société Be Out.
                    </Typography>
                    <Typography variant="body1" paragraph>
                        En validant son achat, l'Utilisateur reconnaît avoir pris connaissance et accepté les présentes CGV. Toute réservation est définitive et non remboursable, sauf en cas d'annulation de l'événement par le Partenaire.
                    </Typography>

                    <Typography variant="h4" component="h2" gutterBottom>
                        Article 1 – Contenu et champ d'application
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Les présentes CGV encadrent la vente d'offres **culturelles et sportives** (billets, invitations, accès de dernière minute, etc.) proposées sur l'application mobile et le site web Be Out. Elles s'appliquent à l'exclusion de toutes autres conditions, notamment celles propres aux Partenaires ou à d'autres canaux de distribution.
                    </Typography>

                    <Typography variant="h4" component="h2" gutterBottom>
                        Article 2 – Droit de rétractation
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne s'applique pas aux prestations de loisirs fournies à une date ou période déterminée, ce qui inclut les événements culturels et sportifs proposés via Be Out.
                    </Typography>

                    <Typography variant="h4" component="h2" gutterBottom>
                        Article 3 – Description du Service
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Be Out permet à ses Utilisateurs d'accéder à des offres de dernière minute dans les domaines de la culture et du sport, à prix réduits. Be Out agit en qualité d'intermédiaire technique entre les Partenaires (théâtres, cinémas, salles de concert, clubs sportifs, organisateurs d'événements, etc.) et les Utilisateurs.
                    </Typography>

                    <Typography variant="h4" component="h2" gutterBottom>
                        Article 4 – Prix
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Les prix sont exprimés en euros, toutes taxes comprises (TTC). Ils sont fermes et définitifs, sauf mention particulière indiquée dans l'offre.
                    </Typography>

                    <Typography variant="h4" component="h2" gutterBottom>
                        Article 5 – Paiement
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Le paiement est réalisé en ligne via des prestataires sécurisés (ex : Stripe, Apple Pay, etc.). La commande est considérée comme validée uniquement après encaissement effectif du montant dû. Une confirmation d'achat est envoyée par email et le justificatif est disponible dans l'espace « Mes Réservations » de l'application.
                    </Typography>

                    <Typography variant="h4" component="h2" gutterBottom>
                        Article 6 – Compte et données
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Lors de la création d'un compte, l'Utilisateur renseigne : Nom, Prénom, Adresse email, Numéro de téléphone (optionnel). Ces informations sont utilisées pour assurer le bon déroulement de la commande et peuvent être communiquées aux Partenaires afin de garantir l'accès à la prestation.
                    </Typography>

                    <Typography variant="h4" component="h2" gutterBottom>
                        Article 7 – Processus d'achat
                    </Typography>
                    <Box component="ol" sx={{ pl: 3 }}>
                        <Typography component="li" variant="body1" paragraph>
                            L'Utilisateur sélectionne une offre disponible via l'application.
                        </Typography>
                        <Typography component="li" variant="body1" paragraph>
                            Il confirme son achat en procédant au paiement sécurisé.
                        </Typography>
                        <Typography component="li" variant="body1" paragraph>
                            Une confirmation est envoyée par email et le billet/QR code est accessible dans l'espace « Mes Réservations ».
                        </Typography>
                    </Box>

                    <Typography variant="h4" component="h2" gutterBottom>
                        Article 8 – Annulation et remboursement
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Toutes les commandes sont fermes et définitives. Un remboursement est uniquement possible si l'événement est annulé par le Partenaire ou le lieu est fermé de manière exceptionnelle. Dans ces cas, Be Out procède au remboursement intégral dans un délai de 14 jours maximum.
                    </Typography>

                    <Typography variant="h4" component="h2" gutterBottom>
                        Article 9 – Responsabilités
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Be Out agit exclusivement comme intermédiaire. La société n'est pas responsable de la qualité, du contenu ou du déroulement des prestations fournies par les Partenaires. En cas d'annulation, de modification ou de litige lié à un événement, la responsabilité incombe au Partenaire.
                    </Typography>

                    <Typography variant="h4" component="h2" gutterBottom>
                        Article 10 – Propriété intellectuelle
                    </Typography>
                    <Typography variant="body1" paragraph>
                        L'application, son contenu, son design et la marque **Be Out** sont protégés par le droit de la propriété intellectuelle. Toute reproduction ou utilisation sans autorisation préalable est interdite.
                    </Typography>

                    <Typography variant="h4" component="h2" gutterBottom>
                        Article 11 – Données personnelles
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Les données personnelles collectées sont traitées conformément à la Politique de Confidentialité de Be Out et au RGPD. L'Utilisateur dispose d'un droit d'accès, de rectification et de suppression de ses données.
                    </Typography>

                    <Typography variant="h4" component="h2" gutterBottom>
                        Article 12 – Service client
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Pour toute question ou réclamation, l'Utilisateur peut contacter Be Out à l'adresse : <strong>contact@be-out.app</strong>
                    </Typography>

                    <Typography variant="h4" component="h2" gutterBottom>
                        Article 13 – Modifications des CGV
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Be Out se réserve le droit de modifier les présentes CGV à tout moment. Les Utilisateurs seront informés de toute modification par notification dans l'application, via le site web ou par email.
                    </Typography>

                    <Typography variant="h4" component="h2" gutterBottom>
                        Article 14 – Droit applicable et juridiction
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Les présentes CGV sont régies par le droit français. En cas de litige, les tribunaux français compétents seront seuls compétents après tentative de résolution amiable.
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
};

export default CGVPage;
