import {
    Box,
    Typography,
    Container,
    Button,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Chip,
    TextField,
    InputAdornment,
    IconButton,
    Stack,
    Tabs,
    Tab,
    Avatar,
    Divider,
    Paper,
} from "@mui/material";
import {
    Search,
    LocationOn,
    FilterList,
    Schedule,
    LocalOffer,
    FavoriteOutlined,
    Share,
    ArrowForward,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import FilterDrawer from "../components/FilterDrawer";
import FavoriteButton from "../components/FavoriteButton";
import EventService from "../services/eventService";
import { useCategories } from "../services/enhancedCategoryService";

const Home = () => {
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

    const EventCard = ({ event }) => (
        <Card
            sx={{
                height: "100%",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4,
                },
                position: "relative",
            }}
            onClick={() => navigate(`/event/${event.id}`)}>
            {/* Favorite Button - positioned absolutely */}
            <Box sx={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}>
                <FavoriteButton
                    eventId={event.id}
                    size="small"
                    sx={{
                        backgroundColor: theme.palette.background.paper,
                        "&:hover": {
                            backgroundColor: theme.palette.background.paper,
                        },
                    }}
                />
            </Box>

            <CardMedia component="img" height="200" image={event.image_url} alt={event.title} />
            <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                    <Typography variant="h6" component="h3" sx={{ flex: 1, mr: 1 }}>
                        {event.title}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                        <IconButton size="small">
                            <Share />
                        </IconButton>
                    </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {event.short_description || event.description}
                </Typography>

                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    {event.categories &&
                        event.categories.map((category, index) => (
                            <Chip key={index} label={category} size="small" color="primary" variant="outlined" />
                        ))}
                    {event.is_last_minute && (
                        <Chip label={t("home:badges.lastMinute")} size="small" color="error" icon={<LocalOffer />} />
                    )}
                </Stack>

                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Schedule sx={{ mr: 1, fontSize: "1rem", color: "text.secondary" }} />
                    <Typography variant="body2" color="text.secondary">
                        {new Date(event.event_date).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <LocationOn sx={{ mr: 1, fontSize: "1rem", color: "text.secondary" }} />
                    <Typography variant="body2" color="text.secondary">
                        {event.venue?.city || event.venue_city}
                    </Typography>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                            <Typography variant="h6" color="primary" sx={{ fontWeight: "bold" }}>
                                {event.discounted_price}€
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ textDecoration: "line-through", color: "text.secondary" }}>
                                {event.original_price}€
                            </Typography>
                            <Chip
                                label={`-${event.discount_percentage}%`}
                                size="small"
                                color="success"
                                sx={{ fontWeight: "bold" }}
                            />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            {event.available_tickets} {t("home:ticketsAvailable")}
                        </Typography>
                    </Box>
                    <Button variant="contained" size="small" endIcon={<ArrowForward />}>
                        {t("common:buttons.buyNow")}
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );

    return (
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
                    {/* Hero Section */}
                    <Paper
                        sx={{
                            textAlign: "center",
                            mb: 4,
                            py: 6,
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            color: theme.palette.primary.contrastText,
                            borderRadius: 3,
                        }}>
                        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: "bold" }}>
                            {t("home:title")}
                        </Typography>
                        <Typography variant="h6" sx={{ mb: 4, opacity: 0.9, maxWidth: "600px", mx: "auto" }}>
                            {t("home:subtitle")}
                        </Typography>

                        {/* Search Bar */}
                        <Box sx={{ maxWidth: "600px", mx: "auto" }}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                placeholder={t("home:searchPlaceholder")}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                sx={{
                                    backgroundColor: theme.palette.background.paper,
                                    borderRadius: 2,
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton>
                                                <LocationOn />
                                            </IconButton>
                                            <IconButton onClick={() => setFilterDrawerOpen(true)}>
                                                <FilterList />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>
                    </Paper>

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
                        <Paper sx={{ textAlign: "center", p: 4, mt: 6, backgroundColor: "grey.50" }}>
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
    );
};

export default Home;
