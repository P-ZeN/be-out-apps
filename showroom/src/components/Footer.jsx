import React from "react";
import { Box, Container, Typography, Grid, Link, Stack, IconButton, Divider } from "@mui/material";
import { Facebook, Twitter, Instagram, LinkedIn } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import { useTheme } from "@mui/material/styles";

const Footer = () => {
    const { t } = useTranslation("footer");
    const theme = useTheme();
    const currentYear = new Date().getFullYear();

    return (
        <Box
            component="footer"
            sx={{
                backgroundColor: theme.palette.footer.background,
                color: theme.palette.footer.text,
                pt: 6, // Increased top padding
                pb: 4, // Keep bottom padding as before
                mt: 6,
                mx: 0,
                width: "100%",
                px: { xs: 0 }, // Ensure no padding on the outer Box, let Container handle it
            }}>
            <Container maxWidth="lg">
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "column", md: "row" },
                        gap: 3,
                        flexWrap: "nowrap"
                    }}
                >
                    {/* Brand & Description */}
                    <Box sx={{ flex: { xs: "1 1 100%", md: "2 1 0" }, minWidth: 0 }}>
                        <Typography
                            variant="h6"
                            gutterBottom
                            sx={{
                                fontWeight: "bold",
                                color: theme.palette.footer.titleColor,
                            }}>
                            {t("brand.name", "Be Out")}
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                mb: 2,
                                color: theme.palette.footer.textSecondary,
                                wordWrap: "break-word",
                                lineHeight: 1.6,
                                maxWidth: "90%"
                            }}>
                            {t("brand.description", "Discover amazing events happening around you and connect with your community.")}
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
                    </Box>

                    {/* Quick Links */}
                    <Box sx={{ flex: { xs: "1 1 45%", md: "1 1 0" }, minWidth: 0 }}>
                        <Typography
                            variant="h6"
                            gutterBottom
                            sx={{
                                color: theme.palette.footer.titleColor,
                            }}>
                            {t("navigation.title", "Navigation")}
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
                                {t("navigation.home", "Home")}
                            </Link>
                            <Link
                                component={RouterLink}
                                to="/about"
                                color="inherit"
                                sx={{
                                    textDecoration: "none",
                                    color: theme.palette.footer.textSecondary,
                                    "&:hover": { color: theme.palette.footer.text },
                                }}>
                                {t("navigation.about", "About")}
                            </Link>
                            <Link
                                href="https://frontend.be-out-app.dedibox2.philippezenone.net"
                                target="_blank"
                                rel="noopener noreferrer"
                                color="inherit"
                                sx={{
                                    textDecoration: "none",
                                    color: theme.palette.footer.textSecondary,
                                    "&:hover": { color: theme.palette.footer.text },
                                }}>
                                {t("navigation.openApp", "Open App")}
                            </Link>
                        </Stack>
                    </Box>

                    {/* Legal */}
                    <Box sx={{ flex: { xs: "1 1 45%", md: "1 1 0" }, minWidth: 0 }}>
                        <Typography
                            variant="h6"
                            gutterBottom
                            sx={{
                                color: theme.palette.footer.titleColor,
                            }}>
                            {t("legal.title", "Legal")}
                        </Typography>
                        <Stack spacing={1}>
                            <Link
                                component={RouterLink}
                                to="/cgu"
                                color="inherit"
                                sx={{
                                    textDecoration: "none",
                                    color: theme.palette.footer.textSecondary,
                                    "&:hover": { color: theme.palette.footer.text },
                                }}>
                                {t("legal.cgu", "CGU")}
                            </Link>
                            <Link
                                component={RouterLink}
                                to="/cgv"
                                color="inherit"
                                sx={{
                                    textDecoration: "none",
                                    color: theme.palette.footer.textSecondary,
                                    "&:hover": { color: theme.palette.footer.text },
                                }}>
                                {t("legal.cgv", "CGV")}
                            </Link>
                            <Link
                                component={RouterLink}
                                to="/mentions-legales"
                                color="inherit"
                                sx={{
                                    textDecoration: "none",
                                    color: theme.palette.footer.textSecondary,
                                    "&:hover": { color: theme.palette.footer.text },
                                }}>
                                {t("legal.mentions", "Mentions légales")}
                            </Link>
                            <Link
                                component={RouterLink}
                                to="/politique-confidentialite"
                                color="inherit"
                                sx={{
                                    textDecoration: "none",
                                    color: theme.palette.footer.textSecondary,
                                    "&:hover": { color: theme.palette.footer.text },
                                }}>
                                {t("legal.privacy", "Politique de confidentialité")}
                            </Link>
                        </Stack>
                    </Box>

                    {/* Contact */}
                    <Box sx={{ flex: { xs: "1 1 45%", md: "1 1 0" }, minWidth: 0 }}>
                        <Typography
                            variant="h6"
                            gutterBottom
                            sx={{
                                color: theme.palette.footer.titleColor,
                            }}>
                            {t("contact.title", "Contact")}
                        </Typography>
                        <Stack spacing={1}>
                            <Link
                                href="mailto:contact@be-out.app"
                                color="inherit"
                                sx={{
                                    textDecoration: "none",
                                    color: theme.palette.footer.textSecondary,
                                    "&:hover": { color: theme.palette.footer.text },
                                }}>
                                {t("contact.email", "Contact Us")}
                            </Link>
                            <Link
                                href="https://organizer.be-out-app.dedibox2.philippezenone.net"
                                target="_blank"
                                rel="noopener noreferrer"
                                color="inherit"
                                sx={{
                                    textDecoration: "none",
                                    color: theme.palette.footer.textSecondary,
                                    "&:hover": { color: theme.palette.footer.text },
                                }}>
                                {t("contact.organizers", "For Organizers")}
                            </Link>
                        </Stack>
                    </Box>

                    {/* Download */}
                    <Box sx={{ flex: { xs: "1 1 45%", md: "1 1 0" }, minWidth: 0 }}>
                        <Typography
                            variant="h6"
                            gutterBottom
                            sx={{
                                color: theme.palette.footer.titleColor,
                            }}>
                            {t("download.title", "Get the App")}
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
                                {t("download.ios", "App Store")}
                            </Link>
                            <Link
                                href="#"
                                color="inherit"
                                sx={{
                                    textDecoration: "none",
                                    color: theme.palette.footer.textSecondary,
                                    "&:hover": { color: theme.palette.footer.text },
                                }}>
                                {t("download.android", "Google Play")}
                            </Link>
                        </Stack>
                    </Box>
                </Box>

                <Divider sx={{ my: 3, backgroundColor: theme.palette.footer.textSecondary }} />

                {/* Bottom Row */}
                <Grid container justifyContent="space-between" alignItems="center">
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="body2" sx={{ color: theme.palette.footer.textSecondary }}>
                            {t("legal.copyright", `© ${currentYear} Be Out. All rights reserved.`)}
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
                                {t("legal.developer", "Made with ❤️ in France")}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default Footer;
