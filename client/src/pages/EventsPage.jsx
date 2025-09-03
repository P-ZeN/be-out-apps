import {
    Box,
    Typography,
    Container,
    Button,
    Grid,
    TextField,
    InputAdornment,
    Tabs,
    Tab,
    Divider,
    Paper,
} from "@mui/material";
import { Search, FilterList, LocalOffer } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import FilterDrawer from "../components/FilterDrawer";
import EventCard from "../components/EventCard";
import EventService from "../services/eventService";
import { useCategories } from "../services/enhancedCategoryService";

const EventsPage = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { t, i18n } = useTranslation(["home", "common"]);
    const theme = useTheme();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
    const [filters, setFilters] = useState({
        priceRange: [0, 200],
        categories: [],
        sortBy: "date",
        maxDistance: 50,
        lastMinuteOnly: false,
        availableOnly: true,
    });

    // Use the enhanced categories hook for multi-language support
    const { categories: categoriesData, loading: categoriesLoading, error: categoriesError } = useCategories();

    // Format categories for the UI
    const categories = [
        { key: "all", label: t("home:categories.all"), name: "all" },
        ...categoriesData.map((cat) => ({
            key: cat.name.toLowerCase(),
            label: cat.name,
            name: cat.name,
            event_count: cat.event_count,
        })),
    ];

    // Load events from API
    useEffect(() => {
        const loadEvents = async () => {
            try {
                setLoading(true);
                setError(null);

                // Load events
                const params = {
                    limit: 12,
                    sortBy: filters.sortBy,
                    lang: i18n.language, // Include current language
                    ...(selectedCategory !== "all" && { category: selectedCategory }),
                    ...(searchQuery && { search: searchQuery }),
                    ...(filters.lastMinuteOnly && { lastMinute: true }),
                    minPrice: filters.priceRange[0],
                    maxPrice: filters.priceRange[1],
                };

                const eventsData = await EventService.getAllEvents(params);
                const formattedData = EventService.formatEvents(eventsData);
                setEvents(formattedData.events);
            } catch (err) {
                console.error("Error loading events:", err);
                setError("Failed to load events. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        // Only load events if categories are available or not needed
        if (!categoriesLoading) {
            loadEvents();
        }
    }, [selectedCategory, searchQuery, filters, categoriesLoading, i18n.language]);

    // Since filtering is now done on the server side via API calls,
    // we can use the events directly from state
    const filteredEvents = events;
    const lastMinuteEvents = events.filter((event) => event.is_last_minute);

    return (
        <>
            {/* Hero Section - True Full Width */}
            {!loading && !categoriesLoading && !error && !categoriesError && (
                <Box
                    sx={{
                        textAlign: "center",
                        py: 8,
                        backgroundColor: theme.palette.primary.main, // Orange background
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
                                maxWidth: "600px", // Match search bar width
                                mx: "auto", // Center align
                            }}>
                            {/* Floating Logo */}
                            <Box
                                component="img"
                                src="/be-out_logo.svg"
                                alt="Be Out Logo"
                                sx={{
                                    height: 120, // Bigger logo (was 80)
                                    width: "auto",
                                    filter: "brightness(0) invert(1)", // Make logo white for orange background
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
                                {t("home:subtitle")}
                            </Typography>
                        </Box>

                        {/* Search Bar */}
                        <Box sx={{ maxWidth: "600px", mx: "auto" }}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                placeholder={t("home:searchPlaceholder")}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        backgroundColor: theme.palette.background.paper, // Theme white
                                        borderRadius: 2,
                                    },
                                }}
                            />
                        </Box>
                    </Container>
                </Box>
            )}

            <Container maxWidth="lg" sx={{ py: 4 }}>
                {/* Loading State */}
                {(loading || categoriesLoading) && (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                        <Typography variant="h6">Loading events...</Typography>
                    </Box>
                )}

                {/* Error State */}
                {(error || categoriesError) && (
                    <Box sx={{ textAlign: "center", py: 8 }}>
                        <Typography variant="h6" color="error" gutterBottom>
                            {error || categoriesError}
                        </Typography>
                        <Button variant="contained" onClick={() => window.location.reload()}>
                            Retry
                        </Button>
                    </Box>
                )}

                {/* Main Content */}
                {!loading && !categoriesLoading && !error && !categoriesError && (
                    <>
                        {" "}
                        {/* Category Tabs */}
                        <Box sx={{ mb: 4 }}>
                            <Tabs
                                value={selectedCategory}
                                onChange={(e, newValue) => setSelectedCategory(newValue)}
                                variant="scrollable"
                                scrollButtons="auto"
                                sx={{ borderBottom: 1, borderColor: "divider" }}>
                                {categories.map((category) => (
                                    <Tab key={category.key} label={category.label} value={category.key} />
                                ))}
                            </Tabs>
                        </Box>
                        {/* Last Minute Deals */}
                        {lastMinuteEvents.length > 0 && (
                            <Box sx={{ mb: 6 }}>
                                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                                    <LocalOffer sx={{ mr: 1, color: "error.main" }} />
                                    <Typography variant="h5" component="h2" sx={{ fontWeight: "bold" }}>
                                        {t("home:sections.lastMinute")}
                                    </Typography>
                                </Box>
                                <Grid container spacing={3}>
                                    {lastMinuteEvents.slice(0, 3).map((event) => (
                                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={event.id}>
                                            <EventCard event={event} />
                                        </Grid>
                                    ))}
                                </Grid>
                                <Divider sx={{ my: 4 }} />
                            </Box>
                        )}
                        {/* Main Events Section */}
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: "bold" }}>
                                {selectedCategory === "all"
                                    ? t("home:sections.allEvents")
                                    : t("home:sections.categoryEvents", {
                                          category: categories.find((c) => c.key === selectedCategory)?.label,
                                      })}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                {filteredEvents.length} {t("home:eventsFound")}
                            </Typography>
                        </Box>
                        {/* Events Grid */}
                        <Grid container spacing={3}>
                            {filteredEvents.map((event) => (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={event.id}>
                                    <EventCard event={event} />
                                </Grid>
                            ))}
                        </Grid>
                        {filteredEvents.length === 0 && (
                            <Box sx={{ textAlign: "center", py: 8 }}>
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                    {t("home:noEventsFound")}
                                </Typography>
                                <Button variant="outlined" onClick={() => setSearchQuery("")} sx={{ mt: 2 }}>
                                    {t("home:clearFilters")}
                                </Button>
                            </Box>
                        )}
                        {/* CTA Section for non-authenticated users */}
                        {!isAuthenticated && (
                            <Paper
                                sx={{
                                    textAlign: "center",
                                    p: 4,
                                    mt: 6,
                                    backgroundColor: "grey.50",
                                    borderRadius: 0,
                                    boxShadow: 0,
                                }}>
                                <Typography variant="h5" gutterBottom>
                                    {t("home:cta.title")}
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                    {t("home:cta.description")}
                                </Typography>
                                <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
                                    <Button variant="outlined" size="large" onClick={() => navigate("/register")}>
                                        {t("common:buttons.signUp")}
                                    </Button>
                                    <Button variant="contained" size="large" onClick={() => navigate("/login")}>
                                        {t("common:buttons.signIn")}
                                    </Button>
                                </Box>
                            </Paper>
                        )}
                        {/* Filter Drawer */}
                        <FilterDrawer
                            open={filterDrawerOpen}
                            onClose={() => setFilterDrawerOpen(false)}
                            filters={filters}
                            onFiltersChange={setFilters}
                            categories={categories.filter((cat) => cat.key !== "all")} // Exclude 'all' category for filter drawer
                        />
                    </>
                )}
            </Container>
        </>
    );
};

export default EventsPage;
