import React from "react";
import { Container, Typography, Box, Divider, Paper } from "@mui/material";
import { useTranslation } from "react-i18next";

const CGUPage = () => {
    const { t } = useTranslation("showroom");

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={0} sx={{ p: 4 }}>
                <Typography variant="h3" component="h1" gutterBottom align="center" color="primary">
                    Conditions Générales d'Utilisation (CGU)
                </Typography>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ '& > *': { mb: 3 } }}>
                    <Typography variant="h4" component="h2" gutterBottom>
                        Introduction
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») régissent l'utilisation de l'application **Be Out**, éditée par **Wendy David, auto-entrepreneuse**. En téléchargeant, installant ou utilisant l'Application, l'Utilisateur accepte sans réserve les présentes CGU et s'engage à en respecter l'ensemble des dispositions.
                    </Typography>

                    <Typography variant="h4" component="h2" gutterBottom>
                        Article 1 - Définitions
                    </Typography>
                    <Typography variant="body1" paragraph>
                        <strong>"Application"</strong> désigne l'application "Be Out" éditée par Wendy David donnant accès aux Services, qui est disponible gratuitement dans l'« Apple Store » d'Apple et le « Google Play Store » de Google pour être téléchargée par l'Utilisateur sur son terminal Apple iOS et Android.
                    </Typography>
                    <Typography variant="body1" paragraph>
                        <strong>« Contenu »</strong> désigne sans que cette liste soit limitative, la structure de l'Application, le contenu éditorial, les illustrations, les chartes graphiques, les marques, les logos, les sigles, les dénominations sociales, les contenus visuels ainsi que tout autre contenu présent au sein de l'Application.
                    </Typography>
                    <Typography variant="body1" paragraph>
                        <strong>« Services »</strong> désignent les différentes fonctionnalités et services proposées par l'Application.
                    </Typography>
                    <Typography variant="body1" paragraph>
                        <strong>"Utilisateur"</strong> désigne une personne physique ayant téléchargé l'Application pour ses besoins propres, dans le cadre d'un usage strictement personnel et non commercial, sans but lucratif direct ou indirect.
                    </Typography>

                    <Typography variant="h4" component="h2" gutterBottom>
                        Article 2 – Description de l'application
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Be Out est une application mobile permettant aux Utilisateurs d'accéder à des billets de dernière minute à prix réduits pour des événements culturels et sportifs. Les organisateurs partenaires (ci-après les "Organisateurs") (salles de spectacle, clubs, associations, producteurs, etc.) mettent en ligne leurs invendus directement sur l'Application.
                    </Typography>
                    <Typography variant="body1" paragraph>
                        L'Utilisateur peut consulter via Be Out des informations relatives à l'événement, au lieu et à la représentation associés au billet. Les partenaires s'engagent à proposer une réduction sur les places mises à disposition, sans condition de montant minimum imposée par Be Out.
                    </Typography>

                    <Typography variant="h4" component="h2" gutterBottom>
                        Article 3 – Droits et obligations des Utilisateurs
                    </Typography>
                    <Typography variant="body1" paragraph>
                        En utilisant l'Application Be Out, l'Utilisateur s'engage à :
                    </Typography>
                    <Box component="ul" sx={{ pl: 3 }}>
                        <Typography component="li" variant="body1" paragraph>
                            Respecter les lois et réglementations en vigueur
                        </Typography>
                        <Typography component="li" variant="body1" paragraph>
                            Ne pas reproduire de façon permanente ou provisoire l'Application, en tout ou partie, par tout moyen et sous toute forme
                        </Typography>
                        <Typography component="li" variant="body1" paragraph>
                            Ne pas procéder à toute adaptation, modification, traduction, transcription, arrangement, compilation, décompilation, assemblage, désassemblage, transcodage, ni appliquer la rétro-ingénierie
                        </Typography>
                        <Typography component="li" variant="body1" paragraph>
                            Ne pas publier de contenu illicite, offensant, violent ou discriminatoire
                        </Typography>
                        <Typography component="li" variant="body1" paragraph>
                            Ne pas porter atteinte aux droits de propriété intellectuelle d'un tiers
                        </Typography>
                        <Typography component="li" variant="body1" paragraph>
                            Ne pas utiliser l'Application à des fins commerciales ou de revente de billets sans autorisation expresse de Be Out
                        </Typography>
                        <Typography component="li" variant="body1" paragraph>
                            Ne pas perturber ou endommager l'Application ou les systèmes informatiques associés
                        </Typography>
                    </Box>

                    <Typography variant="h4" component="h2" gutterBottom>
                        Article 4 – Responsabilité de Be Out
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Be Out assure la bonne exécution des transactions et la mise à disposition des billets achetés. Toutefois, Be Out ne peut garantir le respect des présentes CGU par les utilisateurs.
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Be Out décline toute responsabilité en cas de perte, de dommage ou de préjudice lié au déroulement, au contenu ou à l'annulation d'un événement, qui relèvent de la responsabilité exclusive des Organisateurs, ou à une utilisation frauduleuse, une perte ou un vol de billets par l'Utilisateur.
                    </Typography>
                    <Typography variant="body1" paragraph>
                        En cas d'annulation d'un événement par l'Organisateur, Be Out procèdera au remboursement des sommes versées, hors frais annexes (transport, hébergement, etc.).
                    </Typography>

                    <Typography variant="h4" component="h2" gutterBottom>
                        Article 5 – Propriété intellectuelle
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Tous les Contenus présents sur l'Application Be Out, y compris les textes, images, logos, bases de données et marques, sont la propriété exclusive de Be Out ou de ses partenaires.
                    </Typography>
                    <Typography variant="body1" paragraph>
                        L'Utilisateur bénéficie uniquement d'un droit d'accès et d'usage personnel, non exclusif et non transférable, conformément aux présentes CGU.
                    </Typography>

                    <Typography variant="h4" component="h2" gutterBottom>
                        Article 6 – Modifications des CGU
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Be Out se réserve le droit de modifier les présentes CGU à tout moment. Les modifications entreront en vigueur dès leur publication sur l'Application.
                    </Typography>

                    <Typography variant="h4" component="h2" gutterBottom>
                        Article 7 – Résiliation du contrat
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Be Out se réserve le droit de suspendre ou de résilier le compte d'un Utilisateur ne respectant pas les présentes CGU ou la réglementation applicable, sans préavis ni indemnité.
                    </Typography>

                    <Typography variant="h4" component="h2" gutterBottom>
                        Article 8 – Loi applicable et juridiction compétente
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Les présentes CGU sont régies par le droit français. Tout litige relatif à l'utilisation de l'Application sera soumis à la compétence exclusive des tribunaux français.
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Pour toute question relative aux présentes CGU ou à l'Application Be Out, l'Utilisateur peut contacter l'éditrice à l'adresse suivante : <strong>contact@be-out.app</strong>
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
};

export default CGUPage;
