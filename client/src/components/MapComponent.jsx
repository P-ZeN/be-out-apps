import { useState, useCallback, useEffect, useRef } from "react";
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from "react-map-gl";
import { Box, Paper, Typography, Chip, Button, IconButton } from "@mui/material";
import { LocationOn, LocalOffer, Close } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import "mapbox-gl/dist/mapbox-gl.css";

// Function to detect if running in Tauri
const isTauri = () => {
    return typeof window !== "undefined" && window.__TAURI__ !== undefined;
};

// Function to get Mapbox token with multiple fallback strategies
const getMapboxToken = () => {
    const isTauriApp = isTauri();
    console.log("Environment detection:", {
        isTauri: isTauriApp,
        origin: typeof window !== "undefined" ? window.location.origin : "unknown",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown"
    });

    // Strategy 1: Vite build-time environment variable
    const buildTimeToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    console.log("Build-time token check:", {
        buildTimeToken,
        length: buildTimeToken?.length,
        isValid: buildTimeToken && buildTimeToken !== "%VITE_MAPBOX_ACCESS_TOKEN%" && !buildTimeToken.includes("undefined")
    });
    if (buildTimeToken && buildTimeToken !== "%VITE_MAPBOX_ACCESS_TOKEN%" && !buildTimeToken.includes("undefined")) {
        console.log("Using build-time Mapbox token");
        return buildTimeToken;
    }

    // Strategy 2: Runtime environment variable (for Docker/server environments)
    if (typeof window !== "undefined" && window.ENV && window.ENV.VITE_MAPBOX_ACCESS_TOKEN) {
        const runtimeToken = window.ENV.VITE_MAPBOX_ACCESS_TOKEN;
        if (runtimeToken !== "%VITE_MAPBOX_ACCESS_TOKEN%" && !runtimeToken.includes("undefined")) {
            console.log("Using runtime window.ENV Mapbox token");
            return runtimeToken;
        }
    }

    // Strategy 3: Check if running in production and try to get from meta tag
    if (typeof document !== "undefined") {
        const metaToken = document.querySelector('meta[name="mapbox-token"]');
        if (metaToken) {
            const tokenContent = metaToken.getAttribute("content");
            if (tokenContent && tokenContent !== "%VITE_MAPBOX_ACCESS_TOKEN%" && !tokenContent.includes("undefined")) {
                console.log("Using meta tag Mapbox token");
                return tokenContent;
            }
        }
    }

    // Strategy 4: Fallback token (your current hardcoded token)
    console.log("Using fallback Mapbox token");
    return "pk.eyJ1IjoicGhpbGlwcGV6ZW5vbmUiLCJhIjoiY21jeXQyemdpMHRwazJsc2JkdG9vZzViaCJ9.0h5JWCXgM5nY6hrDtj-vsw";
};

const MAPBOX_TOKEN = getMapboxToken();

// Debug logging for mobile and Tauri troubleshooting
console.log("MapComponent Debug Info:", {
    token: MAPBOX_TOKEN,
    tokenLength: MAPBOX_TOKEN?.length,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    origin: typeof window !== "undefined" ? window.location.origin : "unknown",
    isMobile: typeof window !== "undefined" && /Mobi|Android/i.test(navigator.userAgent),
    isTauri: isTauri(),
    protocol: typeof window !== "undefined" ? window.location.protocol : "unknown",
    hostname: typeof window !== "undefined" ? window.location.hostname : "unknown"
});

// Test the token with a direct API call, but handle Tauri CORS issues
if (MAPBOX_TOKEN && typeof fetch !== "undefined") {
    // For Tauri, the WebView should handle HTTPS requests normally
    const testUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=${MAPBOX_TOKEN}`;

    // Only test in development or if specifically needed
    if (process.env.NODE_ENV === 'development') {
        fetch(testUrl)
            .then(response => {
                console.log("Direct Mapbox API test:", {
                    status: response.status,
                    statusText: response.statusText,
                    url: testUrl
                });
                return response.text();
            })
            .then(text => console.log("API Response preview:", text.substring(0, 200)))
            .catch(error => console.log("Direct API test error:", error));
    }
}

// Fallback component if Mapbox fails to load
const MapFallback = ({ events, onEventClick, t }) => (
    <Box
        sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "grey.100",
            p: 3,
        }}>
        <LocationOn sx={{ fontSize: "4rem", color: "grey.400", mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
            {t("map.mapUnavailable")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mb: 3 }}>
            {t("map.checkMapboxToken")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
            {t("map.eventsAvailable", { count: events.length })}
        </Typography>
    </Box>
);

const MapComponent = ({
    events = [],
    onEventClick,
    onEventSelect,
    selectedEventId = null,
    center = { lat: 48.8566, lng: 2.3522 }, // Paris default
    zoom = 12,
}) => {
    const { t } = useTranslation(["map", "common"]);
    const [viewState, setViewState] = useState({
        longitude: center.lng,
        latitude: center.lat,
        zoom: zoom,
    });
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [mapError, setMapError] = useState(false);
    const mapRef = useRef();

    // Sync selectedEvent with selectedEventId prop (but don't auto-show popup)
    useEffect(() => {
        if (selectedEventId) {
            const event = events.find((e) => e.id === selectedEventId);
            // Only highlight the event, don't automatically show popup
            if (event && (!selectedEvent || event.id !== selectedEvent.id)) {
                // Just center the map on the selected event, don't show popup
                setViewState((prev) => ({
                    ...prev,
                    longitude: event.lng,
                    latitude: event.lat,
                    zoom: Math.max(prev.zoom, 14),
                }));
            }
        }
    }, [selectedEventId, events]);

    // Update view when center changes
    useEffect(() => {
        setViewState((prev) => ({
            ...prev,
            longitude: center.lng,
            latitude: center.lat,
        }));
    }, [center]);

    // Handle map errors
    const handleMapError = useCallback((error) => {
        console.error("Map error:", error);
        console.error("Map error details:", {
            message: error.message,
            stack: error.stack,
            token: MAPBOX_TOKEN,
            tokenLength: MAPBOX_TOKEN?.length,
            userAgent: navigator.userAgent,
            origin: window.location.origin,
            href: window.location.href,
        });
        setMapError(true);
    }, []);

    // Handle marker click (show popup)
    const handleMarkerClick = useCallback(
        (event) => {
            // Set the selected event to show popup
            setSelectedEvent(event);

            // Center map on clicked event
            setViewState((prev) => ({
                ...prev,
                longitude: event.lng,
                latitude: event.lat,
                zoom: Math.max(prev.zoom, 14),
            }));

            // Notify parent component about selection
            if (onEventSelect) {
                onEventSelect(event.id);
            }
        },
        [onEventSelect]
    );

    // Handle popup button click (navigate to event)
    const handleViewEventClick = useCallback(
        (eventId) => {
            if (onEventClick) {
                onEventClick(eventId);
            }
        },
        [onEventClick]
    );

    // Close popup
    const handleClosePopup = useCallback(() => {
        setSelectedEvent(null);
        // Also clear the selected event in the parent component
        if (onEventSelect) {
            onEventSelect(null);
        }
    }, [onEventSelect]);

    // Handle map click to close popup
    const handleMapClick = useCallback(() => {
        if (selectedEvent) {
            handleClosePopup();
        }
    }, [selectedEvent, handleClosePopup]);

    // Get user location and auto-center map on triangle view
    const handleGeolocate = useCallback(
        (e) => {
            const newUserLocation = {
                longitude: e.coords.longitude,
                latitude: e.coords.latitude,
            };
            setUserLocation(newUserLocation);

            // Calculate optimal view with user location and nearest events
            if (events.length > 0) {
                const optimalBounds = calculateOptimalBounds(newUserLocation, events);
                if (optimalBounds && mapRef.current) {
                    // Use fitBounds to smoothly transition to the triangle view
                    mapRef.current.fitBounds(optimalBounds.bounds, {
                        padding: 80,
                        duration: 2000, // 2 second smooth transition
                        maxZoom: 15, // Don't zoom in too much
                    });
                }
            }
        },
        [events]
    );

    // Get category color
    const getCategoryColor = (category) => {
        const colors = {
            music: "#e91e63",
            sport: "#2196f3",
            theater: "#9c27b0",
            cinema: "#ff5722",
            conference: "#607d8b",
            festival: "#ff9800",
            default: "#4caf50",
        };
        return colors[category] || colors.default;
    };

    // Custom marker component
    const EventMarker = ({ event, isSelected, isNearestToUser = false }) => (
        <Marker
            longitude={event.lng}
            latitude={event.lat}
            anchor="bottom"
            onClick={(e) => {
                e.originalEvent.stopPropagation();
                handleMarkerClick(event);
            }}>
            <Box
                sx={{
                    position: "relative",
                    cursor: "pointer",
                    transform: isSelected ? "scale(1.3)" : "scale(1)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                        transform: isSelected ? "scale(1.3)" : "scale(1.15)",
                    },
                }}>
                {/* Special indicator for nearest events to user */}
                {isNearestToUser && (
                    <Box
                        sx={{
                            position: "absolute",
                            top: "-8px",
                            right: "-8px",
                            width: "16px",
                            height: "16px",
                            backgroundColor: "primary.main",
                            borderRadius: "50%",
                            border: "2px solid white",
                            zIndex: 1001,
                            animation: "pulse 2s infinite",
                            "@keyframes pulse": {
                                "0%": {
                                    boxShadow: "0 0 0 0 rgba(25, 118, 210, 0.7)",
                                },
                                "70%": {
                                    boxShadow: "0 0 0 10px rgba(25, 118, 210, 0)",
                                },
                                "100%": {
                                    boxShadow: "0 0 0 0 rgba(25, 118, 210, 0)",
                                },
                            },
                        }}
                    />
                )}

                {/* Connecting line from bubble to pin */}
                <Box
                    sx={{
                        position: "absolute",
                        bottom: "90%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "2px",
                        height: "8px",
                        backgroundColor: "rgba(0,0,0,0.3)",
                        zIndex: 999,
                    }}
                />

                {/* Event title bubble with discount */}
                <Box
                    sx={{
                        position: "absolute",
                        bottom: "100%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        mb: 1,
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        color: "text.primary",
                        borderRadius: "12px",
                        px: 1.5,
                        py: 0.8,
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        border: "1px solid rgba(0,0,0,0.1)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        maxWidth: "220px",
                        textAlign: "center",
                        zIndex: 1000,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 0.5,
                    }}>
                    {/* Event title */}
                    <Box
                        sx={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "100%",
                        }}>
                        {event.title}
                    </Box>

                    {/* Badges row */}
                    <Box
                        sx={{
                            display: "flex",
                            gap: 0.5,
                            alignItems: "center",
                            flexWrap: "wrap",
                            justifyContent: "center",
                        }}>
                        {event.discount && event.discount > 0 && (
                            <Chip
                                label={`-${event.discount}%`}
                                size="small"
                                color="success"
                                sx={{
                                    height: "16px",
                                    fontSize: "0.6rem",
                                    "& .MuiChip-label": { px: 0.5 },
                                }}
                            />
                        )}
                        {event.isLastMinute && (
                            <Chip
                                label="⚡"
                                size="small"
                                color="error"
                                sx={{
                                    height: "16px",
                                    fontSize: "0.6rem",
                                    minWidth: "16px",
                                    "& .MuiChip-label": { px: 0.25 },
                                }}
                            />
                        )}
                    </Box>
                </Box>

                {/* Location pin icon */}
                <LocationOn
                    sx={{
                        fontSize: "2.5rem",
                        color: getCategoryColor(event.category),
                        filter: isSelected
                            ? "drop-shadow(0 4px 8px rgba(0,0,0,0.4))"
                            : "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                        transition: "all 0.3s ease",
                    }}
                />
            </Box>
        </Marker>
    );

    // Utility function to calculate distance between two points (Haversine formula)
    const calculateDistance = (lat1, lng1, lat2, lng2) => {
        const R = 6371; // Earth's radius in kilometers
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLng = ((lng2 - lng1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLng / 2) *
                Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Calculate optimal bounds to show user location and nearest events
    const calculateOptimalBounds = (userLoc, events) => {
        if (!userLoc || events.length === 0) return null;

        // Find the two nearest events to user
        const eventsWithDistance = events.map((event) => ({
            ...event,
            distance: calculateDistance(userLoc.latitude, userLoc.longitude, event.lat, event.lng),
        }));

        eventsWithDistance.sort((a, b) => a.distance - b.distance);
        const nearestEvents = eventsWithDistance.slice(0, Math.min(2, events.length));

        // Create triangle points (user + up to 2 nearest events)
        const trianglePoints = [
            { lat: userLoc.latitude, lng: userLoc.longitude },
            ...nearestEvents.map((event) => ({ lat: event.lat, lng: event.lng })),
        ];

        // Calculate bounds
        const lats = trianglePoints.map((p) => p.lat);
        const lngs = trianglePoints.map((p) => p.lng);

        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);

        // Add padding (10% of the range)
        const latPadding = (maxLat - minLat) * 0.1 || 0.01; // fallback for single point
        const lngPadding = (maxLng - minLng) * 0.1 || 0.01;

        return {
            bounds: [
                [minLng - lngPadding, minLat - latPadding], // southwest
                [maxLng + lngPadding, maxLat + latPadding], // northeast
            ],
            center: {
                latitude: (minLat + maxLat) / 2,
                longitude: (minLng + maxLng) / 2,
            },
            nearestEvents,
        };
    };

    // Fallback function to center on events when geolocation is not available
    const centerOnEvents = useCallback(() => {
        if (events.length > 0 && mapRef.current) {
            // Calculate bounds for all events
            const lats = events.map((event) => event.lat);
            const lngs = events.map((event) => event.lng);

            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);
            const minLng = Math.min(...lngs);
            const maxLng = Math.max(...lngs);

            // Add padding
            const latPadding = (maxLat - minLat) * 0.15 || 0.01;
            const lngPadding = (maxLng - minLng) * 0.15 || 0.01;

            const bounds = [
                [minLng - lngPadding, minLat - latPadding], // southwest
                [maxLng + lngPadding, maxLat + latPadding], // northeast
            ];

            mapRef.current.fitBounds(bounds, {
                padding: 80,
                duration: 1500,
                maxZoom: 14,
            });
        }
    }, [events]);

    // Auto-center when events change and user location is available, or fallback to events
    useEffect(() => {
        if (userLocation && events.length > 0 && mapRef.current) {
            // User location available: use triangle view
            const optimalBounds = calculateOptimalBounds(userLocation, events);
            if (optimalBounds) {
                mapRef.current.fitBounds(optimalBounds.bounds, {
                    padding: 80,
                    duration: 1500,
                    maxZoom: 15,
                });
            }
        } else if (!userLocation && events.length > 0 && mapRef.current) {
            // No user location: center on all events
            centerOnEvents();
        }
    }, [events, userLocation, centerOnEvents]);

    // Auto-request geolocation on component mount
    useEffect(() => {
        const requestGeolocation = async () => {
            // Small delay to let map initialize
            await new Promise((resolve) => setTimeout(resolve, 1000));

            if ("geolocation" in navigator) {
                try {
                    const position = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 300000, // 5 minutes
                        });
                    });

                    // Simulate the geolocation event structure
                    handleGeolocate({ coords: position.coords });
                } catch (error) {
                    // Fallback: center on events if geolocation fails
                    centerOnEvents();
                }
            } else {
                // Fallback: center on events if geolocation not supported
                centerOnEvents();
            }
        };

        // Only auto-request on initial mount if we don't have user location
        if (!userLocation) {
            requestGeolocation();
        }
    }, []); // Only run on mount

    return (
        <Box sx={{ position: "relative", height: "100%", width: "100%" }}>
            {mapError || !MAPBOX_TOKEN || MAPBOX_TOKEN.includes("example") ? (
                <MapFallback events={events} onEventClick={onEventClick} t={t} />
            ) : (
                <Map
                    ref={mapRef}
                    {...viewState}
                    onMove={(evt) => setViewState(evt.viewState)}
                    onClick={handleMapClick}
                    onError={handleMapError}
                    mapboxAccessToken={MAPBOX_TOKEN}
                    style={{ width: "100%", height: "100%" }}
                    mapStyle="mapbox://styles/mapbox/streets-v12"
                    attributionControl={false}
                    optimizeForTerrain={false}
                    preserveDrawingBuffer={false}
                    reuseMaps>
                    {/* Navigation Controls */}
                    <NavigationControl position="top-right" />

                    {/* Geolocation Control */}
                    <GeolocateControl position="top-right" trackUserLocation onGeolocate={handleGeolocate} />

                    {/* Event Markers */}
                    {events.map((event) => {
                        // Check if this event is one of the nearest to user
                        let isNearestToUser = false;
                        if (userLocation) {
                            const optimalBounds = calculateOptimalBounds(userLocation, events);
                            isNearestToUser =
                                optimalBounds?.nearestEvents?.some((nearest) => nearest.id === event.id) || false;
                        }

                        return (
                            <EventMarker
                                key={event.id}
                                event={event}
                                isSelected={selectedEventId === event.id}
                                isNearestToUser={isNearestToUser}
                            />
                        );
                    })}

                    {/* User Location Marker */}
                    {userLocation && (
                        <Marker longitude={userLocation.longitude} latitude={userLocation.latitude} anchor="center">
                            <Box
                                sx={{
                                    position: "relative",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}>
                                {/* Pulsing ring effect */}
                                <Box
                                    sx={{
                                        position: "absolute",
                                        width: 24,
                                        height: 24,
                                        borderRadius: "50%",
                                        backgroundColor: "primary.main",
                                        opacity: 0.3,
                                        animation: "userLocationPulse 2s infinite",
                                        "@keyframes userLocationPulse": {
                                            "0%": {
                                                transform: "scale(1)",
                                                opacity: 0.7,
                                            },
                                            "100%": {
                                                transform: "scale(2)",
                                                opacity: 0,
                                            },
                                        },
                                    }}
                                />
                                {/* Main marker dot */}
                                <Box
                                    sx={{
                                        width: 16,
                                        height: 16,
                                        backgroundColor: "primary.main",
                                        borderRadius: "50%",
                                        border: "3px solid white",
                                        boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                                        zIndex: 1000,
                                    }}
                                />
                                {/* User location label
                                bel
                                bel */}
                                <Typography
                                    variant="caption"
                                    sx={{
                                        position: "absolute",
                                        top: "150%",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        backgroundColor: "rgba(0,0,0,0.7)",
                                        color: "white",
                                        px: 1.5,
                                        py: 0.8,
                                        borderRadius: 1,
                                        fontSize: "0.7rem",
                                        whiteSpace: "nowrap",
                                        pointerEvents: "none",
                                    }}>
                                    {t("yourLocation")}
                                </Typography>
                            </Box>
                        </Marker>
                    )}

                    {/* Event Popup */}
                    {selectedEvent && (
                        <Popup
                            longitude={selectedEvent.lng}
                            latitude={selectedEvent.lat}
                            anchor="bottom"
                            onClose={handleClosePopup}
                            closeButton={false}
                            maxWidth="320px">
                            <Paper sx={{ p: 0, minWidth: 280, maxWidth: 320, overflow: "hidden" }}>
                                {/* Header with close button */}
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        p: 2,
                                        pb: 1,
                                    }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: "bold", flex: 1, pr: 1 }}>
                                        {selectedEvent.title}
                                    </Typography>
                                    <IconButton size="small" onClick={handleClosePopup} sx={{ mt: -0.5 }}>
                                        <Close fontSize="small" />
                                    </IconButton>
                                </Box>

                                {/* Content */}
                                <Box sx={{ px: 2, pb: 2 }}>
                                    {/* Badges */}
                                    <Box sx={{ display: "flex", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
                                        {selectedEvent.isLastMinute && (
                                            <Chip
                                                label={t("lastMinute", { ns: "common" })}
                                                size="small"
                                                color="error"
                                            />
                                        )}
                                        <Chip
                                            label={selectedEvent.category}
                                            size="small"
                                            variant="outlined"
                                            sx={{
                                                textTransform: "capitalize",
                                                color: getCategoryColor(selectedEvent.category),
                                                borderColor: getCategoryColor(selectedEvent.category),
                                            }}
                                        />
                                    </Box>

                                    {/* Location */}
                                    <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
                                        <LocationOn sx={{ fontSize: "1rem", mr: 0.5, color: "text.secondary" }} />
                                        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                                            {selectedEvent.location}
                                        </Typography>
                                    </Box>

                                    {/* Venue details if available */}
                                    {selectedEvent.venue_name && (
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ mb: 1, fontStyle: "italic" }}>
                                            {selectedEvent.venue_name}
                                        </Typography>
                                    )}

                                    {/* Price section */}
                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            mb: 2,
                                            p: 1.5,
                                            backgroundColor: "grey.50",
                                            borderRadius: 1,
                                        }}>
                                        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                                            <Typography variant="h6" color="primary" sx={{ fontWeight: "bold" }}>
                                                {selectedEvent.discountedPrice}€
                                            </Typography>
                                            {selectedEvent.originalPrice !== selectedEvent.discountedPrice && (
                                                <>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            textDecoration: "line-through",
                                                            color: "text.secondary",
                                                        }}>
                                                        {selectedEvent.originalPrice}€
                                                    </Typography>
                                                    <Chip
                                                        label={`-${selectedEvent.discount}%`}
                                                        size="small"
                                                        color="success"
                                                    />
                                                </>
                                            )}
                                        </Box>
                                    </Box>

                                    {/* Distance if available */}
                                    {selectedEvent.distance && selectedEvent.distance !== "0 km" && (
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ mb: 2, textAlign: "center" }}>
                                            📍 {t("map.atDistance", { distance: selectedEvent.distance })}
                                        </Typography>
                                    )}

                                    {/* Action button */}
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        size="medium"
                                        onClick={() => handleViewEventClick(selectedEvent.id)}
                                        sx={{
                                            fontWeight: "bold",
                                            textTransform: "none",
                                            borderRadius: 2,
                                            py: 1,
                                        }}>
                                        {t("viewEventDetails")}
                                    </Button>
                                </Box>
                            </Paper>
                        </Popup>
                    )}
                </Map>
            )}
        </Box>
    );
};

export default MapComponent;
