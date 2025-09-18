import {
    Box,
    Typography,
    Container,
    Button,
    Paper,
} from "@mui/material";
import {
    LocalOffer,
    Today,
    DateRange,
    CalendarMonth,
    Recommend,
    LocationOn
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import EventService from "../services/eventService";
import { useCategories } from "../services/enhancedCategoryService";
import HorizontalEventsSection from "../components/HorizontalEventsSection";

const EventsPage = ({ searchQuery: externalSearchQuery, filters: externalFilters }) => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { t, i18n } = useTranslation(["home", "common"]);
    const theme = useTheme();

    // Section data state
    const [sectionsData, setSectionsData] = useState({
        lastMinute: { events: [], loading: true },
        today: { events: [], loading: true },
        thisWeek: { events: [], loading: true },
        thisMonth: { events: [], loading: true },
        recommended: { events: [], loading: true },
        nearYou: { events: [], loading: true },
        categories: {}
    });

    // User location state
    const [userLocation, setUserLocation] = useState(null);

    // Use the enhanced categories hook for multi-language support
    const { categories: categoriesData, loading: categoriesLoading } = useCategories();

    // Get user location on mount
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.log("Geolocation error:", error);
                    // Continue without location
                }
            );
        }
    }, []);

    // Load all sections data
    useEffect(() => {
        const loadAllSections = async () => {
            const currentLang = i18n.language;

            try {
                // Load time-based sections
                const [lastMinuteData, todayData, thisWeekData, thisMonthData, recommendedData] = await Promise.all([
                    EventService.getAllEvents({
                        lang: currentLang,
                        limit: 12,
                        lastMinute: true,
                        sortBy: "date"
                    }),
                    EventService.getEventsByTimePeriod("today", currentLang, 12),
                    EventService.getEventsByTimePeriod("thisWeek", currentLang, 12),
                    EventService.getEventsByTimePeriod("thisMonth", currentLang, 12),
                    EventService.getRecommendedEvents(currentLang, 12)
                ]);

                // Load nearby events if location available
                let nearYouData = { events: [] };
                if (userLocation) {
                    nearYouData = await EventService.getNearbyEvents(
                        userLocation.lat,
                        userLocation.lng,
                        currentLang,
                        12
                    );
                }

                // Update sections data
                setSectionsData(prev => ({
                    ...prev,
                    lastMinute: {
                        events: EventService.formatEvents(lastMinuteData).events,
                        loading: false
                    },
                    today: {
                        events: EventService.formatEvents(todayData).events,
                        loading: false
                    },
                    thisWeek: {
                        events: EventService.formatEvents(thisWeekData).events,
                        loading: false
                    },
                    thisMonth: {
                        events: EventService.formatEvents(thisMonthData).events,
                        loading: false
                    },
                    recommended: {
                        events: EventService.formatEvents(recommendedData).events,
                        loading: false
                    },
                    nearYou: {
                        events: EventService.formatEvents(nearYouData).events,
                        loading: false
                    }
                }));

            } catch (error) {
                console.error("Error loading sections:", error);
                // Set all sections as not loading with empty events
                setSectionsData(prev => ({
                    ...prev,
                    lastMinute: { events: [], loading: false },
                    today: { events: [], loading: false },
                    thisWeek: { events: [], loading: false },
                    thisMonth: { events: [], loading: false },
                    recommended: { events: [], loading: false },
                    nearYou: { events: [], loading: false }
                }));
            }
        };

        loadAllSections();
    }, [i18n.language, userLocation]);

    // Load category sections
    useEffect(() => {
        const loadCategorySections = async () => {
            if (categoriesLoading || !categoriesData.length) return;

            const currentLang = i18n.language;
            const categoryPromises = categoriesData.map(async (category) => {
                try {
                    const data = await EventService.getEventsByCategory(category.id, currentLang, 12);
                    return {
                        id: category.id,
                        events: EventService.formatEvents(data).events
                    };
                } catch (error) {
                    console.error(`Error loading category ${category.id}:`, error);
                    return {
                        id: category.id,
                        events: []
                    };
                }
            });

            const categoryResults = await Promise.all(categoryPromises);
            const categorySections = {};

            categoryResults.forEach(({ id, events }) => {
                categorySections[id] = { events, loading: false };
            });

            setSectionsData(prev => ({
                ...prev,
                categories: categorySections
            }));
        };

        loadCategorySections();
    }, [categoriesData, categoriesLoading, i18n.language]);

    return (
        <Container maxWidth="lg" sx={{ py: 4, backgroundColor: "#fff" }}>
            {/* Last Minute Deals Section */}
            <HorizontalEventsSection
                title={t("home:sections.lastMinute")}
                events={sectionsData.lastMinute.events}
                loading={sectionsData.lastMinute.loading}
                icon={<LocalOffer />}
                viewAllLabel={t("common:buttons.viewAll")}
            />

            {/* Today Section */}
            <HorizontalEventsSection
                title={t("home:sections.today")}
                events={sectionsData.today.events}
                loading={sectionsData.today.loading}
                icon={<Today />}
                viewAllLabel={t("common:buttons.viewAll")}
            />

            {/* This Week Section */}
            <HorizontalEventsSection
                title={t("home:sections.thisWeek")}
                events={sectionsData.thisWeek.events}
                loading={sectionsData.thisWeek.loading}
                icon={<DateRange />}
                viewAllLabel={t("common:buttons.viewAll")}
            />

            {/* This Month Section */}
            <HorizontalEventsSection
                title={t("home:sections.thisMonth")}
                events={sectionsData.thisMonth.events}
                loading={sectionsData.thisMonth.loading}
                icon={<CalendarMonth />}
                viewAllLabel={t("common:buttons.viewAll")}
            />

            {/* Recommended Section */}
            <HorizontalEventsSection
                title={t("home:sections.recommended")}
                events={sectionsData.recommended.events}
                loading={sectionsData.recommended.loading}
                icon={<Recommend />}
                viewAllLabel={t("common:buttons.viewAll")}
            />

            {/* Near You Section - Only show if we have location */}
            {userLocation && (
                <HorizontalEventsSection
                    title={t("home:sections.nearYou")}
                    events={sectionsData.nearYou.events}
                    loading={sectionsData.nearYou.loading}
                    icon={<LocationOn />}
                    viewAllLabel={t("common:buttons.viewAll")}
                />
            )}

            {/* Category Sections */}
            {categoriesData.map((category) => {
                const categorySection = sectionsData.categories[category.id];
                if (!categorySection) return null;

                return (
                    <HorizontalEventsSection
                        key={category.id}
                        title={category.name}
                        events={categorySection.events}
                        loading={categorySection.loading}
                        viewAllLabel={t("common:buttons.viewAll")}
                    />
                );
            })}

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
        </Container>
    );
};

export default EventsPage;
