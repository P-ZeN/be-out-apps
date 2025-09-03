import React from "react";
import { Box, Container, Typography, Grid, Link, Stack, IconButton, Divider } from "@mui/material";
import { Facebook, Twitter, Instagram, LinkedIn, Email, Phone, LocationOn } from "@mui/icons-material";
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
                py: 4,
                mt: 6,
                mx: 0,
                width: "100%",
            }}>
            <Container maxWidth="lg">
                <Grid container spacing={4}>
                    {/* Brand & Description */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Typography
                            variant="h6"
                            gutterBottom
                            sx={{
                                fontWeight: "bold",
                                color: theme.palette.footer.titleColor,
                            }}>
                            {t("brand.name")}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2, color: theme.palette.footer.textSecondary }}>
                            {t("brand.description")}
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
                        <Typography
                            variant="h6"
                            gutterBottom
                            sx={{
                                color: theme.palette.footer.titleColor,
                            }}>
                            {t("navigation.title")}
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
                                {t("navigation.home")}
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
                                {t("navigation.map")}
                            </Link>
                            <Link
                                href="#"
                                color="inherit"
                                sx={{
                                    textDecoration: "none",
                                    color: theme.palette.footer.textSecondary,
                                    "&:hover": { color: theme.palette.footer.text },
                                }}>
                                {t("navigation.categories")}
                            </Link>
                            <Link
                                href="#"
                                color="inherit"
                                sx={{
                                    textDecoration: "none",
                                    color: theme.palette.footer.textSecondary,
                                    "&:hover": { color: theme.palette.footer.text },
                                }}>
                                {t("navigation.todayOffers")}
                            </Link>
                        </Stack>
                    </Grid>

                    {/* Categories */}
                    <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                        <Typography
                            variant="h6"
                            gutterBottom
                            sx={{
                                color: theme.palette.footer.titleColor,
                            }}>
                            {t("categories.title")}
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
                                {t("categories.music")}
                            </Link>
                            <Link
                                href="#"
                                color="inherit"
                                sx={{
                                    textDecoration: "none",
                                    color: theme.palette.footer.textSecondary,
                                    "&:hover": { color: theme.palette.footer.text },
                                }}>
                                {t("categories.sports")}
                            </Link>
                            <Link
                                href="#"
                                color="inherit"
                                sx={{
                                    textDecoration: "none",
                                    color: theme.palette.footer.textSecondary,
                                    "&:hover": { color: theme.palette.footer.text },
                                }}>
                                {t("categories.theater")}
                            </Link>
                            <Link
                                href="#"
                                color="inherit"
                                sx={{
                                    textDecoration: "none",
                                    color: theme.palette.footer.textSecondary,
                                    "&:hover": { color: theme.palette.footer.text },
                                }}>
                                {t("categories.gastronomy")}
                            </Link>
                        </Stack>
                    </Grid>

                    {/* Support & Legal */}
                    <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                        <Typography
                            variant="h6"
                            gutterBottom
                            sx={{
                                color: theme.palette.footer.titleColor,
                            }}>
                            {t("support.title")}
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
                                {t("support.helpCenter")}
                            </Link>
                            <Link
                                href="#"
                                color="inherit"
                                sx={{
                                    textDecoration: "none",
                                    color: theme.palette.footer.textSecondary,
                                    "&:hover": { color: theme.palette.footer.text },
                                }}>
                                {t("support.contact")}
                            </Link>
                            <Link
                                href="#"
                                color="inherit"
                                sx={{
                                    textDecoration: "none",
                                    color: theme.palette.footer.textSecondary,
                                    "&:hover": { color: theme.palette.footer.text },
                                }}>
                                {t("support.terms")}
                            </Link>
                            <Link
                                href="#"
                                color="inherit"
                                sx={{
                                    textDecoration: "none",
                                    color: theme.palette.footer.textSecondary,
                                    "&:hover": { color: theme.palette.footer.text },
                                }}>
                                {t("support.privacy")}
                            </Link>
                        </Stack>
                    </Grid>

                    {/* Partner Info */}
                    <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                        <Typography
                            variant="h6"
                            gutterBottom
                            sx={{
                                color: theme.palette.footer.titleColor,
                            }}>
                            {t("partners.title")}
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
                                {t("partners.becomePartner")}
                            </Link>
                            <Link
                                href="#"
                                color="inherit"
                                sx={{
                                    textDecoration: "none",
                                    color: theme.palette.footer.textSecondary,
                                    "&:hover": { color: theme.palette.footer.text },
                                }}>
                                {t("partners.partnerSpace")}
                            </Link>
                            <Link
                                href="#"
                                color="inherit"
                                sx={{
                                    textDecoration: "none",
                                    color: theme.palette.footer.textSecondary,
                                    "&:hover": { color: theme.palette.footer.text },
                                }}>
                                {t("partners.apiDocs")}
                            </Link>
                        </Stack>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3, backgroundColor: theme.palette.footer.textSecondary }} />

                {/* Bottom Row */}
                <Grid container justifyContent="space-between" alignItems="center">
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="body2" sx={{ color: theme.palette.footer.textSecondary }}>
                            {t("legal.copyright", { year: currentYear })}
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
                                {t("legal.developer")}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default Footer;
