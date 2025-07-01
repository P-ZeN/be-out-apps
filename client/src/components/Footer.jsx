import React from "react";
import { Box, Container, Typography, Grid, Link, Stack, IconButton, Divider } from "@mui/material";
import { Facebook, Twitter, Instagram, LinkedIn, Email, Phone, LocationOn } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import { useTheme } from "@mui/material/styles";

const Footer = () => {
    const { t } = useTranslation("common");
    const theme = useTheme();
    const currentYear = new Date().getFullYear();

    return (
        <Box
            component="footer"
            sx={{
                backgroundColor: theme.palette.footer.background,
                color: theme.palette.footer.text,
                py: 4,
                mt: 6,
                mx: 0,
                width: "100%",
            }}>
            <Container maxWidth="lg">
                <Grid container spacing={4}>
                    {/* Brand & Description */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                            Be Out
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2, color: theme.palette.footer.textSecondary }}>
                            Découvrez des événements incroyables à prix réduits. Des offres de dernière minute aux
                            expériences exclusives, trouvez votre prochaine sortie parfaite.
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            <IconButton size="small" sx={{ color: theme.palette.footer.text }}>
                                <Facebook />
                            </IconButton>
                            <IconButton size="small" sx={{ color: theme.palette.footer.text }}>
                                <Twitter />
                            </IconButton>
                            <IconButton size="small" sx={{ color: theme.palette.footer.text }}>
                                <Instagram />
                            </IconButton>
                            <IconButton size="small" sx={{ color: theme.palette.footer.text }}>
                                <LinkedIn />
                            </IconButton>
                        </Stack>
                    </Grid>

                    {/* Quick Links */}
                    <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Navigation
                        </Typography>
                        <Stack spacing={1}>
                            <Link
                                component={RouterLink}
                                to="/"
                                color="inherit"
                                sx={{
                                    textDecoration: "none",
                                    color: theme.palette.footer.textSecondary,
                                    "&:hover": { color: theme.palette.footer.text },
                                }}>
                                Accueil
                            </Link>
                            <Link
                                component={RouterLink}
                                to="/map"
                                color="inherit"
                                sx={{
                                    textDecoration: "none",
                                    color: theme.palette.footer.textSecondary,
                                    "&:hover": { color: theme.palette.footer.text },
                                }}>
                                Carte
                            </Link>
                            <Link
                                href="#"
                                color="inherit"
                                sx={{
                                    textDecoration: "none",
                                    color: theme.palette.footer.textSecondary,
                                    "&:hover": { color: theme.palette.footer.text },
                                }}>
                                Catégories
                            </Link>
                            <Link
                                href="#"
                                color="inherit"
                                sx={{
                                    textDecoration: "none",
                                    color: theme.palette.footer.textSecondary,
                                    "&:hover": { color: theme.palette.footer.text },
                                }}>
                                Offres du jour
                            </Link>
                        </Stack>
                    </Grid>

                    {/* Categories */}
                    <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Catégories
                        </Typography>
                        <Stack spacing={1}>
                            <Link
                                href="#"
                                color="inherit"
                                sx={{
                                    textDecoration: "none",
                                    color: theme.palette.footer.textSecondary,
                                    "&:hover": { color: theme.palette.footer.text },
                                }}>
                                Musique
                            </Link>
                            <Link
                                href="#"
                                color="inherit"
                                sx={{
                                    textDecoration: "none",
                                    color: theme.palette.footer.textSecondary,
                                    "&:hover": { color: theme.palette.footer.text },
                                }}>
                                Sports
                            </Link>
                            <Link
                                href="#"
                                color="inherit"
                                sx={{
                                    textDecoration: "none",
                                    color: theme.palette.footer.textSecondary,
                                    "&:hover": { color: theme.palette.footer.text },
                                }}>
                                Théâtre
                            </Link>
                            <Link
                                href="#"
                                color="inherit"
                                sx={{
                                    textDecoration: "none",
                                    color: theme.palette.footer.textSecondary,
                                    "&:hover": { color: theme.palette.footer.text },
                                }}>
                                Gastronomie
                            </Link>
                        </Stack>
                    </Grid>

                    {/* Support & Legal */}
                    <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Support
                        </Typography>
                        <Stack spacing={1}>
                            <Link
                                href="#"
                                color="inherit"
                                sx={{
                                    textDecoration: "none",
                                    color: theme.palette.footer.textSecondary,
                                    "&:hover": { color: theme.palette.footer.text },
                                }}>
                                Centre d'aide
                            </Link>
                            <Link
                                href="#"
                                color="inherit"
                                sx={{
                                    textDecoration: "none",
                                    color: theme.palette.footer.textSecondary,
                                    "&:hover": { color: theme.palette.footer.text },
                                }}>
                                Contact
                            </Link>
                            <Link
                                href="#"
                                color="inherit"
                                sx={{
                                    textDecoration: "none",
                                    color: theme.palette.footer.textSecondary,
                                    "&:hover": { color: theme.palette.footer.text },
                                }}>
                                Conditions d'utilisation
                            </Link>
                            <Link
                                href="#"
                                color="inherit"
                                sx={{
                                    textDecoration: "none",
                                    color: theme.palette.footer.textSecondary,
                                    "&:hover": { color: theme.palette.footer.text },
                                }}>
                                Confidentialité
                            </Link>
                        </Stack>
                    </Grid>

                    {/* Partner Info */}
                    <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Partenaires
                        </Typography>
                        <Stack spacing={1}>
                            <Link
                                href="#"
                                color="inherit"
                                sx={{
                                    textDecoration: "none",
                                    color: theme.palette.footer.textSecondary,
                                    "&:hover": { color: theme.palette.footer.text },
                                }}>
                                Devenir partenaire
                            </Link>
                            <Link
                                href="#"
                                color="inherit"
                                sx={{
                                    textDecoration: "none",
                                    color: theme.palette.footer.textSecondary,
                                    "&:hover": { color: theme.palette.footer.text },
                                }}>
                                Espace partenaire
                            </Link>
                            <Link
                                href="#"
                                color="inherit"
                                sx={{
                                    textDecoration: "none",
                                    color: theme.palette.footer.textSecondary,
                                    "&:hover": { color: theme.palette.footer.text },
                                }}>
                                API Documentation
                            </Link>
                        </Stack>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3, backgroundColor: theme.palette.footer.textSecondary }} />

                {/* Bottom Row */}
                <Grid container justifyContent="space-between" alignItems="center">
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="body2" sx={{ color: theme.palette.footer.textSecondary }}>
                            © {currentYear} Be Out. Tous droits réservés.
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: { xs: "flex-start", md: "flex-end" },
                                mt: { xs: 1, md: 0 },
                            }}>
                            <Typography variant="body2" sx={{ color: theme.palette.footer.textSecondary }}>
                                Inspiré par Too Good To Go
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default Footer;
