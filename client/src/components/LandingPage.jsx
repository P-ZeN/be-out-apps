import {
    Box,
    Typography,
    Container,
    Button,
    Grid,
    Card,
    CardContent,
    Stack,
    Paper,
    Chip,
} from "@mui/material";
import {
    Apple,
    Android,
    EventAvailable,
    LocationOn,
    People,
    Star,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
    const theme = useTheme();
    const { t } = useTranslation("landing", { 
        useSuspense: false,
        // Provide fallback translations that work even if server is down
        fallbackLng: false
    });
    const navigate = useNavigate();

    const features = [
        {
            icon: <EventAvailable sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
            title: t("features.discover.title", "Discover Events"),
            description: t("features.discover.description", "Find amazing events happening around you")
        },
        {
            icon: <LocationOn sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
            title: t("features.location.title", "Location Based"),
            description: t("features.location.description", "See events near your location on an interactive map")
        },
        {
            icon: <People sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
            title: t("features.connect.title", "Connect"),
            description: t("features.connect.description", "Meet like-minded people and build your community")
        },
        {
            icon: <Star sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
            title: t("features.favorites.title", "Favorites"),
            description: t("features.favorites.description", "Save and track your favorite events and venues")
        }
    ];

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Hero Section */}
            <Box
                sx={{
                    textAlign: "center",
                    py: 8,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}20, ${theme.palette.secondary.main}20)`,
                    borderRadius: 4,
                    mb: 6,
                }}
            >
                <Typography
                    variant="h2"
                    component="h1"
                    gutterBottom
                    sx={{
                        fontWeight: 700,
                        color: theme.palette.primary.main,
                        mb: 2,
                    }}
                >
                    {t("appName", "BeOut")}
                </Typography>
                <Typography
                    variant="h5"
                    component="h2"
                    gutterBottom
                    sx={{
                        color: theme.palette.text.primary,
                        mb: 3,
                        maxWidth: 600,
                        mx: "auto",
                    }}
                >
                    {t("hero.title", "Discover amazing events happening around you")}
                </Typography>
                <Typography
                    variant="body1"
                    sx={{
                        color: theme.palette.text.secondary,
                        mb: 4,
                        maxWidth: 800,
                        mx: "auto",
                        fontSize: "1.1rem",
                    }}
                >
                    {t("hero.description", "Connect with your community, explore local events, and never miss out on the experiences that matter to you.")}
                </Typography>

                {/* Browse Events Button */}
                <Box sx={{ mb: 4 }}>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={() => navigate('/events')}
                        sx={{
                            px: 4,
                            py: 1.5,
                            fontSize: "1.2rem",
                            borderRadius: 2,
                            textTransform: "none",
                            mb: 2,
                            "&:hover": {
                                transform: "translateY(-2px)",
                            },
                            transition: "all 0.2s ease",
                        }}
                    >
                        {t("browseEvents", "Browse Events Now")}
                    </Button>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        {t("noDownloadRequired", "No download required")}
                    </Typography>
                </Box>

                {/* App Store Buttons */}
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    justifyContent="center"
                    sx={{ mb: 4 }}
                >
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
                        rel="noopener noreferrer"
                    >
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
                        rel="noopener noreferrer"
                    >
                        {t("downloadAndroid", "Get it on Google Play")}
                    </Button>
                </Stack>

                <Chip
                    label={t("status", "🚀 Coming Soon to App Stores")}
                    color="primary"
                    variant="outlined"
                    sx={{ 
                        fontSize: "0.9rem", 
                        px: 2, 
                        fontWeight: 600,
                        bgcolor: theme.palette.primary.main + '10',
                    }}
                />
            </Box>

            {/* Features Section */}
            <Typography
                variant="h4"
                component="h2"
                textAlign="center"
                gutterBottom
                sx={{ mb: 4, color: theme.palette.primary.main }}
            >
                {t("features.title", "Why Choose BeOut?")}
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
                                "&:hover": {
                                    transform: "translateY(-4px)",
                                    boxShadow: 4,
                                },
                            }}
                        >
                            <CardContent>
                                <Box sx={{ mb: 2 }}>
                                    {feature.icon}
                                </Box>
                                <Typography
                                    variant="h6"
                                    component="h3"
                                    gutterBottom
                                    sx={{ color: theme.palette.primary.main }}
                                >
                                    {feature.title}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
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
                }}
            >
                <Typography
                    variant="h4"
                    component="h2"
                    gutterBottom
                    sx={{ mb: 3, color: theme.palette.primary.main }}
                >
                    {t("cta.title", "Start Exploring Events")}
                </Typography>
                <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mb: 4, maxWidth: 600, mx: "auto" }}
                >
                    {t("cta.description", "Join thousands of users who have already discovered amazing events in their city. Start exploring events now or download the app when it's ready!")}
                </Typography>
                
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    justifyContent="center"
                >
                    <Button
                        variant="contained"
                        size="large"
                        onClick={() => navigate('/events')}
                        sx={{
                            px: 4,
                            py: 1.5,
                            fontSize: "1.1rem",
                            borderRadius: 2,
                            textTransform: "none",
                        }}
                    >
                        {t("browseEventsNow", "Browse Events Now")}
                    </Button>
                    <Button
                        variant="outlined"
                        size="large"
                        onClick={() => navigate('/map')}
                        sx={{
                            px: 4,
                            py: 1.5,
                            fontSize: "1.1rem",
                            borderRadius: 2,
                            textTransform: "none",
                        }}
                    >
                        {t("viewMap", "View Map")}
                    </Button>
                </Stack>
            </Paper>
        </Container>
    );
};

export default LandingPage;
