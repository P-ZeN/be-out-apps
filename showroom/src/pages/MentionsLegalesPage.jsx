import React from "react";
import { Container, Typography, Box, Divider, Paper } from "@mui/material";
import { useTranslation } from "react-i18next";

const MentionsLegalesPage = () => {
    const { t } = useTranslation("showroom");

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={0} sx={{ p: 4 }}>
                <Typography variant="h3" component="h1" gutterBottom align="center" color="primary">
                    Mentions Légales
                </Typography>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ '& > *': { mb: 3 } }}>
                    <Typography variant="body1" paragraph>
                        Conformément à la loi n°2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique, il est précisé aux utilisateurs de l'application Be Out l'identité des différents intervenants dans le cadre de sa réalisation et de son suivi.
                    </Typography>

                    <Typography variant="h4" component="h2" gutterBottom>
                        1. Éditeur de l'application
                    </Typography>
                    <Box component="ul" sx={{ pl: 3 }}>
                        <Typography component="li" variant="body1" paragraph>
                            <strong>Nom et prénom :</strong> Wendy David
                        </Typography>
                        <Typography component="li" variant="body1" paragraph>
                            <strong>Statut :</strong> Auto-entrepreneur
                        </Typography>
                        <Typography component="li" variant="body1" paragraph>
                            <strong>Directeur de la publication :</strong> Wendy David
                        </Typography>
                        <Typography component="li" variant="body1" paragraph>
                            <strong>Contact (email) :</strong> contact@be-out.app
                        </Typography>
                    </Box>

                    <Typography variant="h4" component="h2" gutterBottom>
                        2. Hébergement
                    </Typography>
                    <Typography variant="body1" paragraph>
                        L'application Be Out est hébergée par des services cloud sécurisés respectant les normes européennes de protection des données.
                    </Typography>

                    <Typography variant="h4" component="h2" gutterBottom>
                        3. Propriété intellectuelle
                    </Typography>
                    <Typography variant="body1" paragraph>
                        L'ensemble du contenu de l'application (textes, images, logos, graphismes, vidéos, etc.) est protégé par le droit d'auteur et la propriété intellectuelle.
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments de l'application, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable de l'éditeur.
                    </Typography>

                    <Typography variant="h4" component="h2" gutterBottom>
                        4. Responsabilité
                    </Typography>
                    <Typography variant="body1" paragraph>
                        L'éditeur ne pourra être tenu responsable des dommages directs ou indirects causés au matériel de l'utilisateur lors de l'accès à l'application, résultant soit de l'utilisation d'un matériel ne répondant pas aux spécifications indiquées, soit de l'apparition d'un bug ou d'une incompatibilité.
                    </Typography>

                    <Typography variant="h4" component="h2" gutterBottom>
                        5. Cookies et traceurs
                    </Typography>
                    <Typography variant="body1" paragraph>
                        L'application peut être amenée à utiliser des traceurs ou technologies similaires (ex. : cookies, SDK, outils d'analyse d'audience).
                    </Typography>
                    <Typography variant="body1" paragraph>
                        L'utilisateur est informé qu'il peut paramétrer ses préférences concernant la collecte de données et s'opposer à leur dépôt depuis l'interface dédiée dans l'application.
                    </Typography>

                    <Typography variant="h4" component="h2" gutterBottom>
                        6. Médiation de la consommation
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Conformément aux articles L.616-1 et R.616-1 du code de la consommation, tout consommateur a le droit de recourir gratuitement à un médiateur de la consommation en cas de litige avec l'éditeur.
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Plateforme européenne de règlement en ligne des litiges : <strong>https://ec.europa.eu/consumers/odr/</strong>
                    </Typography>

                    <Typography variant="h4" component="h2" gutterBottom>
                        7. Données personnelles
                    </Typography>
                    <Typography variant="body1" paragraph>
                        La gestion des données personnelles collectées via l'application Be Out est détaillée dans notre Politique de confidentialité, accessible depuis l'application.
                    </Typography>

                    <Typography variant="h4" component="h2" gutterBottom>
                        8. Droit applicable et juridiction compétente
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Les présentes mentions légales sont régies par le droit français.
                    </Typography>
                    <Typography variant="body1" paragraph>
                        En cas de litige, et à défaut de solution amiable, compétence exclusive est attribuée aux tribunaux français compétents.
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
};

export default MentionsLegalesPage;
