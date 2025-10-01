import { Box, Typography, Container, Button, Grid, Card, CardContent, Stack, Paper, Chip } from "@mui/material";
import { Apple, Android, EventAvailable, LocationOn, People, Star } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

const HomePage = () => {
    const theme = useTheme();
    const { t } = useTranslation("showroom", {
        useSuspense: false,
    });

    const features = [
        {
            icon: <EventAvailable sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
            title: t("features.discover.title", "Discover Events"),
            description: t("features.discover.description", "Find amazing events happening around you"),
        },
        {
            icon: <LocationOn sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
            title: t("features.location.title", "Location Based"),
            description: t("features.location.description", "See events near your location on an interactive map"),
        },
        {
            icon: <People sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
            title: t("features.connect.title", "Connect"),
            description: t("features.connect.description", "Meet like-minded people and build your community"),
        },
        {
            icon: <Star sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
            title: t("features.favorites.title", "Favorites"),
            description: t("features.favorites.description", "Save and track your favorite events and venues"),
        },
    ];

    return (
        <>
            {/* Hero Section - True Full Width */}
            <Box
                sx={{
                    textAlign: "center",
                    py: 8,
                    backgroundColor: theme.palette.primary.main, // Plain orange background
                    borderRadius: 0,
                    boxShadow: "none",
                    border: "none",
                    width: "100vw", // Full viewport width
                    marginLeft: "calc(-50vw + 50%)", // Center and expand to full width
                    marginRight: "calc(-50vw + 50%)", // Center and expand to full width
                }}>
                <Container maxWidth="lg">
                    {/* Logo and Slogan - Floating Layout */}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 4,
                            mb: 4,
                            flexWrap: { xs: "wrap", md: "nowrap" },
                            textAlign: { xs: "center", md: "left" },
                            maxWidth: 800, // Match description text width and button area
                            mx: "auto", // Center align
                        }}>
                        {/* Floating Logo */}
                        <Box
                            component="img"
                            src="/be-out_icon_512.svg"
                            alt="Be Out Logo"
                            sx={{
                                height: 120, // Bigger logo (was 80)
                                width: "auto",
                                flexShrink: 0,
                            }}
                        />

                        {/* Flowing Slogan */}
                        <Typography
                            variant="heroTitle"
                            component="h1"
                            sx={{
                                color: theme.palette.primary.contrastText, // White text on orange background
                                flex: 1,
                                maxWidth: { md: 450 }, // Adjusted for better line breaking
                            }}>
                            {t("hero.title", "Discover amazing events happening around you")}
                        </Typography>
                    </Box>
                    <Typography
                        variant="body1"
                        sx={{
                            color: theme.palette.mainMenu.textSecondary, // White text with opacity on orange background
                            mb: 4,
                            maxWidth: 600, // Match button area alignment for tighter visual consistency
                            mx: "auto", // Center align
                            fontSize: "1.1rem",
                            fontWeight: 200, // Extra light for hero descriptions
                            fontFamily: theme.typography.fontFamily,
                        }}>
                        {t(
                            "hero.description",
                            "Connect with your community, explore local events, and never miss out on the experiences that matter to you."
                        )}
                    </Typography>

                    {/* Open App Button */}
                    <Box sx={{ mb: 4 }}>
                        <Button
                            variant="contained"
                            size="large"
                            href="https://frontend.be-out-app.dedibox2.philippezenone.net"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                px: 4,
                                py: 1.5,
                                fontSize: "1.2rem",
                                borderRadius: 2,
                                textTransform: "none",
                                mb: 2,
                                backgroundColor: theme.palette.background.paper, // White background
                                color: theme.palette.primary.main, // Orange text
                                "&:hover": {
                                    backgroundColor: theme.palette.background.default, // Cream background on hover
                                    transform: "translateY(-2px)",
                                },
                                transition: "all 0.2s ease",
                            }}>
                            {t("openApp", "Open Be Out App")}
                        </Button>
                        <Typography variant="body2" sx={{ color: theme.palette.mainMenu.textSecondary }}>
                            {t("noDownloadRequired", "No download required")}
                        </Typography>
                    </Box>

                    {/* App Store Buttons */}
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center" sx={{ mb: 4 }}>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<Apple />}
                            sx={{
                                bgcolor: "#000",
                                color: "white",
                                px: 4,
                                py: 1.5,
                                fontSize: "1.1rem",
                                borderRadius: 2,
                                textTransform: "none",
                                "&:hover": {
                                    bgcolor: "#333",
                                    transform: "translateY(-2px)",
                                },
                                transition: "all 0.2s ease",
                            }}
                            href="#" // Replace with actual App Store link when available
                            target="_blank"
                            rel="noopener noreferrer">
                            {t("downloadIOS", "Download on the App Store")}
                        </Button>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<Android />}
                            sx={{
                                bgcolor: "#01875f",
                                color: "white",
                                px: 4,
                                py: 1.5,
                                fontSize: "1.1rem",
                                borderRadius: 2,
                                textTransform: "none",
                                "&:hover": {
                                    bgcolor: "#016b4a",
                                    transform: "translateY(-2px)",
                                },
                                transition: "all 0.2s ease",
                            }}
                            href="#" // Replace with actual Google Play link when available
                            target="_blank"
                            rel="noopener noreferrer">
                            {t("downloadAndroid", "Get it on Google Play")}
                        </Button>
                    </Stack>

                    <Chip
                        label={t("status", "🚀 Coming Soon to App Stores")}
                        variant="outlined"
                        sx={{
                            fontSize: "0.9rem",
                            px: 2,
                            fontWeight: 600,
                            backgroundColor: theme.palette.background.paper, // White background
                            color: theme.palette.primary.main, // Orange text
                            borderColor: theme.palette.background.paper, // White border
                            "&:hover": {
                                backgroundColor: theme.palette.background.default, // Cream background on hover
                            },
                        }}
                    />
                </Container>
            </Box>

            {/* Rest of the page with container */}
            <Container maxWidth="lg" sx={{ py: 6 }}>
                {/* Features Section */}
                <Typography
                    variant="h4"
                    component="h2"
                    textAlign="center"
                    gutterBottom
                    sx={{ mb: 4, color: theme.palette.primary.main }}>
                    {t("features.title", "Why Choose Be Out?")}
                </Typography>

                <Grid container spacing={4} sx={{ mb: 6 }}>
                    {features.map((feature, index) => (
                        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                            <Card
                                sx={{
                                    height: "100%",
                                    textAlign: "center",
                                    p: 2,
                                    transition: "transform 0.2s",
                                    borderRadius: 0,
                                    boxShadow: "none",
                                    "&:hover": {
                                        transform: "translateY(-4px)",
                                        boxShadow: "none",
                                    },
                                }}>
                                <CardContent>
                                    <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                                    <Typography
                                        variant="h6"
                                        component="h3"
                                        gutterBottom
                                        sx={{ color: theme.palette.primary.main }}>
                                        {feature.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {feature.description}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* Call to Action Section */}
                <Paper
                    sx={{
                        p: 4,
                        textAlign: "center",
                        bgcolor: theme.palette.grey[50],
                        borderRadius: 0,
                        boxShadow: "none",
                    }}>
                    <Typography
                        variant="h4"
                        component="h2"
                        gutterBottom
                        sx={{ mb: 3, color: theme.palette.primary.main }}>
                        {t("cta.title", "Start Exploring Events")}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: "auto" }}>
                        {t(
                            "cta.description",
                            "Join thousands of users who have already discovered amazing events in their city. Start exploring events now or download the app when it's ready!"
                        )}
                    </Typography>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
                        <Button
                            variant="contained"
                            size="large"
                            href="https://frontend.be-out-app.dedibox2.philippezenone.net"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                px: 4,
                                py: 1.5,
                                fontSize: "1.1rem",
                                borderRadius: 2,
                                textTransform: "none",
                            }}>
                            {t("openAppNow", "Open Be Out App Now")}
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            href="https://frontend.be-out-app.dedibox2.philippezenone.net/map"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                px: 4,
                                py: 1.5,
                                fontSize: "1.1rem",
                                borderRadius: 2,
                                textTransform: "none",
                            }}>
                            {t("viewMap", "View Map")}
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        </>
    );
};

export default HomePage;
