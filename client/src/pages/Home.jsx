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
    Stack,
    Tabs,
    Tab,
    Divider,
    Paper,
} from "@mui/material";
import {
    LocationOn,
    Schedule,
    LocalOffer,
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
import PullToRefresh from "../components/PullToRefresh";
import EventService from "../services/eventService";
import { getEventPricingInfo, formatPriceDisplay } from "../utils/pricingUtils";
import { getEventPricingInfo, formatPriceDisplay } from "../utils/pricingUtils";
import { useCategories } from "../services/enhancedCategoryService";

const Home = ({ searchQuery: externalSearchQuery, filters: externalFilters }) => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { t, i18n } = useTranslation(["home", "common"]);
    const theme = useTheme();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        priceRange: [0, 200],
        categories: [],
        sortBy: "date",
        maxDistance: 50,
        lastMinuteOnly: false,
        availableOnly: true,
    });

    // Sync external search query and filters
    useEffect(() => {
        if (externalSearchQuery !== undefined) {
            setSearchQuery(externalSearchQuery);
        }
    }, [externalSearchQuery]);

    useEffect(() => {
        if (externalFilters) {
            setFilters(externalFilters);
        }
    }, [externalFilters]);

    // Use the enhanced categories hook for multi-language support
    const { categories: categoriesData, loading: categoriesLoading, error: categoriesError } = useCategories();

    // Reset selected category when language changes to avoid mismatches
    useEffect(() => {
        if (selectedCategory !== "all") {
            setSelectedCategory("all");
        }
    }, [i18n.language]);

    // Format categories for the UI
    const categories = [
        { key: "all", label: t("home:categories.all"), name: "all" },
        ...categoriesData.map((cat) => ({
            key: cat.id.toString(), // Use stable ID instead of language-dependent name
            label: cat.name,
            name: cat.name,
            id: cat.id,
            event_count: cat.event_count,
        })),
    ];

    // Load events from API
    const loadEvents = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            // Load events
            const params = {
                limit: 12,
                sortBy: filters.sortBy,
                lang: i18n.language, // Include current language
                ...(filters.categories && filters.categories.length > 0 && {
                    categoryIds: filters.categories // Use category IDs from filters
                }),
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
            setRefreshing(false);
        }
    };

    useEffect(() => {
        // Only load events if categories are available or not needed
        if (!categoriesLoading) {
            loadEvents();
        }
    }, [selectedCategory, searchQuery, filters, categoriesLoading, i18n.language]);

    // Handle pull-to-refresh
    const handleRefresh = async () => {
        console.log("[HOME] Pull-to-refresh triggered");
        await loadEvents(true);
    };

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
                            {(() => {
                                const pricingInfo = getEventPricingInfo(event);
                                const priceDisplay = formatPriceDisplay(pricingInfo);

                                if (pricingInfo.price === 0) {
                                    return (
                                        <Typography variant="h6" color="success.main" sx={{ fontWeight: "bold" }}>
                                            Gratuit
                                        </Typography>
                                    );
                                }

                                return (
                                    <>
                                        <Typography variant="h6" color="primary" sx={{ fontWeight: "bold" }}>
                                            {pricingInfo.hasMultiplePrices
                                                ? `À partir de ${pricingInfo.price}€`
                                                : `${pricingInfo.price}€`
                                            }
                                        </Typography>
                                        {priceDisplay.showStrikethrough && (
                                            <Typography
                                                variant="body2"
                                                sx={{ textDecoration: "line-through", color: "text.secondary" }}>
                                                {priceDisplay.originalPrice}
                                            </Typography>
                                        )}
                                        {priceDisplay.showDiscountBadge && (
                                            <Chip
                                                label={`-${priceDisplay.discountPercentage}%`}
                                                size="small"
                                                color="success"
                                                sx={{ fontWeight: "bold" }}
                                            />
                                        )}
                                    </>
                                );
                            })()}
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
        <PullToRefresh
            onRefresh={handleRefresh}
            refreshing={refreshing}
            disabled={loading || categoriesLoading}
        >
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
                        <Button variant="contained" onClick={handleRefresh}>
                            Retry
                        </Button>
                    </Box>
                )}

                {/* Main Content */}
                {!loading && !categoriesLoading && !error && !categoriesError && (
                <>
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
                </>
            )}
            </Container>
        </PullToRefresh>
    );
};

export default Home;
