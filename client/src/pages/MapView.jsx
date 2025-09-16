import {
    Box,
    Container,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    Button,
    Chip,
    IconButton,
    TextField,
    InputAdornment,
    Alert,
    Snackbar,
} from "@mui/material";
import { Search, MyLocation, LocationOn, Schedule, LocalOffer, FilterList } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import MapComponent from "../components/MapComponent";
import AddressSearch from "../components/AddressSearch";
import { GeocodingService } from "../services/geocodingService";
import EventService from "../services/eventService";

const MapView = ({ searchQuery: externalSearchQuery, filters: externalFilters }) => {
    const { t, i18n } = useTranslation(["map", "common"]);
    const theme = useTheme();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState({
        priceRange: [0, 200],
        categories: [],
        sortBy: "date",
        maxDistance: 50,
        lastMinuteOnly: false,
        availableOnly: true,
    });
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [mapCenter, setMapCenter] = useState({ lat: 48.8566, lng: 2.3522 });
    const [mapZoom, setMapZoom] = useState(12);
    const [userLocation, setUserLocation] = useState(null);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [realEvents, setRealEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

    // Sync external props with local state
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

    const loadRealEvents = async () => {
        try {
            setLoading(true);
            const response = await EventService.getAllEvents({
                limit: 50,
                lang: i18n.language, // Use current language
                ...(filters.categories && filters.categories.length > 0 && {
                    categoryIds: filters.categories
                }),
                ...(searchQuery && { search: searchQuery }),
                ...(filters.lastMinuteOnly && { lastMinute: true }),
                minPrice: filters.priceRange[0],
                maxPrice: filters.priceRange[1],
                sortBy: filters.sortBy,
            });

            if (response && response.events) {
                // First try to geocode events without coordinates
                const eventsWithGeocodedCoords = await geocodeEventsWithoutCoords(response.events);

                // Transform API events to map format and filter out events without coordinates
                const mapEvents = eventsWithGeocodedCoords
                    .filter((event) => event.venue_latitude && event.venue_longitude) // Only events with real coordinates
                    .map((event) => ({
                        id: event.id,
                        title: event.title,
                        category: event.categories?.[0]?.toLowerCase() || "default",
                        discountedPrice: event.discounted_price,
                        originalPrice: event.original_price,
                        discount: event.discount_percentage,
                        distance: "0 km", // Will be calculated based on user location
                        location: `${event.venue_name || ""}, ${event.venue_city || ""}`.trim(),
                        isLastMinute: event.is_last_minute,
                        lat: parseFloat(event.venue_latitude),
                        lng: parseFloat(event.venue_longitude),
                        venue_name: event.venue_name,
                        venue_address: event.venue_address,
                        venue_city: event.venue_city,
                    }));

                if (mapEvents.length > 0) {
                    setRealEvents(mapEvents);
                    setFilteredEvents(mapEvents);

                    // Center map on the average location of all events
                    const avgLat = mapEvents.reduce((sum, event) => sum + event.lat, 0) / mapEvents.length;
                    const avgLng = mapEvents.reduce((sum, event) => sum + event.lng, 0) / mapEvents.length;
                    setMapCenter({ lat: avgLat, lng: avgLng });

                    setSnackbar({
                        open: true,
                        message: t("eventsLoaded", { count: mapEvents.length }),
                        severity: "success",
                    });
                } else {
                    // No events with coordinates
                    setFilteredEvents([]);
                    setSnackbar({
                        open: true,
                        message: t("noEventsWithLocation"),
                        severity: "info",
                    });
                }
            } else {
                // API returned no events
                setFilteredEvents([]);
                setSnackbar({
                    open: true,
                    message: t("noEventsFromAPI"),
                    severity: "info",
                });
            }
        } catch (error) {
            console.error("Error loading events:", error);
            // API error - show empty state
            setFilteredEvents([]);
            setSnackbar({
                open: true,
                message: t("errorLoadingEvents"),
                severity: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    // Geocode events that don't have coordinates
    const geocodeEventsWithoutCoords = async (events) => {
        const eventsToGeocode = events.filter((event) => !event.venue_latitude || !event.venue_longitude);

        if (eventsToGeocode.length === 0) return events;

        const geocodedEvents = await Promise.all(
            eventsToGeocode.map(async (event) => {
                try {
                    // Create search query from venue information
                    const searchQuery = [event.venue_address, event.venue_name, event.venue_city, "France"]
                        .filter(Boolean)
                        .join(", ");

                    if (searchQuery.length > 5) {
                        // Only search if we have meaningful data
                        const results = await GeocodingService.searchPlaces(searchQuery, {
                            country: "fr",
                            limit: 1,
                        });

                        if (results.length > 0) {
                            return {
                                ...event,
                                venue_latitude: results[0].center[1],
                                venue_longitude: results[0].center[0],
                            };
                        }
                    }
                } catch (error) {
                    console.warn(`Failed to geocode event ${event.id}:`, error);
                }
                return event; // Return original event if geocoding fails
            })
        );

        // Merge geocoded events back with events that already had coordinates
        const eventsWithCoords = events.filter((event) => event.venue_latitude && event.venue_longitude);
        return [...eventsWithCoords, ...geocodedEvents];
    };

    const handleEventClick = (eventId) => {
        setSelectedEventId(eventId);
        navigate(`/event/${eventId}`);
    };

    const handleEventSelect = (eventId) => {
        // Select event on map without navigating
        setSelectedEventId(eventId);
        if (eventId) {
            const event = filteredEvents.find((e) => e.id === eventId);
            if (event) {
                setMapCenter({ lat: event.lat, lng: event.lng });
                setMapZoom(15);
            }
        }
    };

    const handleLocationSelect = (location) => {
        setMapCenter({ lat: location.latitude, lng: location.longitude });
        setMapZoom(14);

        // Calculate distances and update events
        if (realEvents.length > 0) {
            const eventsWithDistance = realEvents.map((event) => ({
                ...event,
                distance: GeocodingService.formatDistance(
                    GeocodingService.calculateDistance(location.latitude, location.longitude, event.lat, event.lng)
                ),
            }));

            setFilteredEvents(eventsWithDistance);
        }

        setSnackbar({
            open: true,
            message: t("locationUpdated", { address: location.address }),
            severity: "success",
        });
    };

    const handleCurrentLocation = async () => {
        try {
            const location = await GeocodingService.getCurrentLocation();
            handleLocationSelect(location);
            setUserLocation(location);
        } catch (error) {
            setSnackbar({
                open: true,
                message: t("locationError"),
                severity: "error",
            });
        }
    };

    // Initialize with real events or fallback to mock
    useEffect(() => {
        loadRealEvents();
    }, [filters, searchQuery, i18n.language]);

    return (
        <>

            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Grid container spacing={3}>
                    {/* Interactive Map */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Paper
                            sx={{
                                height: "600px",
                                borderRadius: 2,
                                overflow: "hidden",
                            }}>
                            <MapComponent
                                events={filteredEvents}
                                onEventClick={handleEventClick}
                                onEventSelect={handleEventSelect}
                                selectedEventId={selectedEventId}
                                center={mapCenter}
                                zoom={mapZoom}
                            />
                        </Paper>
                    </Grid>

                    {/* Events List */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                                {t("nearbyEvents", { count: filteredEvents.length })}
                            </Typography>
                        </Box>

                        <Box sx={{ maxHeight: "600px", overflowY: "auto" }}>
                            {filteredEvents.map((event) => (
                                <Card
                                    key={event.id}
                                    sx={{
                                        mb: 2,
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                        border: selectedEventId === event.id ? "2px solid" : "1px solid",
                                        borderColor: selectedEventId === event.id ? "primary.main" : "divider",
                                        "&:hover": {
                                            transform: "translateY(-2px)",
                                            boxShadow: 2,
                                        },
                                    }}
                                    onClick={() => handleEventSelect(event.id)}>
                                    <CardContent sx={{ p: 2 }}>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "flex-start",
                                                mb: 1,
                                            }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: "bold", flex: 1 }}>
                                                {event.title}
                                            </Typography>
                                            {event.isLastMinute && (
                                                <Chip
                                                    label={t("lastMinute", { ns: "common" })}
                                                    size="small"
                                                    color="error"
                                                    sx={{ ml: 1 }}
                                                />
                                            )}
                                        </Box>

                                        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                            <LocationOn sx={{ fontSize: "1rem", mr: 0.5, color: "text.secondary" }} />
                                            <Typography variant="body2" color="text.secondary">
                                                {event.location} • {event.distance}
                                            </Typography>
                                        </Box>

                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}>
                                            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                                                <Typography variant="h6" color="primary" sx={{ fontWeight: "bold" }}>
                                                    {event.discountedPrice}€
                                                </Typography>
                                                {event.originalPrice !== event.discountedPrice && (
                                                    <>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                textDecoration: "line-through",
                                                                color: "text.secondary",
                                                            }}>
                                                            {event.originalPrice}€
                                                        </Typography>
                                                        <Chip
                                                            label={`-${event.discount}%`}
                                                            size="small"
                                                            color="success"
                                                        />
                                                    </>
                                                )}
                                            </Box>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEventClick(event.id);
                                                }}>
                                                {t("view", { ns: "common" })}
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>

                        <Button variant="outlined" fullWidth sx={{ mt: 2 }} onClick={() => navigate("/")}>
                            {t("viewAllEvents")}
                        </Button>
                    </Grid>
                </Grid>

                {/* Snackbar for notifications */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={4000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    sx={{
                        bottom: { xs: 80, sm: 80 }, // Position above bottom navbar (72px + 8px margin)
                    }}>
                    <Alert
                        onClose={() => setSnackbar({ ...snackbar, open: false })}
                        severity={snackbar.severity}
                        sx={{ width: "100%" }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Container>
        </>
    );
};

export default MapView;
