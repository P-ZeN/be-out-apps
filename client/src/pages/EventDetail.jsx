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
    Avatar,
    Divider,
    Paper,
    IconButton,
    Breadcrumbs,
    Link,
} from "@mui/material";
import {
    Schedule,
    LocationOn,
    LocalOffer,
    FavoriteOutlined,
    Share,
    ArrowBack,
    Person,
    Group,
    Star,
    StarBorder,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import EventService from "../services/eventService";
import BookingModal from "../components/BookingModal";
import FavoriteButton from "../components/FavoriteButton";

const EventDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user, isAuthenticated } = useAuth();
    const { t, i18n } = useTranslation(["home", "common"]);
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bookingModalOpen, setBookingModalOpen] = useState(false);

    // Load event data from API
    useEffect(() => {
        const loadEvent = async () => {
            try {
                setLoading(true);
                setError(null);
                const eventData = await EventService.getEventById(id, i18n.language);
                const formattedEvent = EventService.formatEvent(eventData);
                setEvent(formattedEvent);
            } catch (err) {
                console.error("Error loading event:", err);
                setError("Failed to load event details. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadEvent();
        }
    }, [id, i18n.language]);

    // Loading state
    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <Typography variant="h6">Loading event details...</Typography>
                </Box>
            </Container>
        );
    }

    // Error state
    if (error) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ textAlign: "center", py: 8 }}>
                    <Typography variant="h6" color="error" gutterBottom>
                        {error}
                    </Typography>
                    <Button variant="contained" onClick={() => navigate("/")}>
                        Back to Home
                    </Button>
                </Box>
            </Container>
        );
    }

    // Event not found
    if (!event) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ textAlign: "center", py: 8 }}>
                    <Typography variant="h6" gutterBottom>
                        Event not found
                    </Typography>
                    <Button variant="contained" onClick={() => navigate("/")}>
                        Back to Home
                    </Button>
                </Box>
            </Container>
        );
    }

    const handlePurchase = () => {
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }

        // Check if booking deadline has passed
        if (event.booking_deadline && new Date() > new Date(event.booking_deadline)) {
            alert("La période de réservation pour cet événement est terminée.");
            return;
        }

        // Check if event has already occurred
        if (new Date() > new Date(event.event_date)) {
            alert("Cet événement a déjà eu lieu.");
            return;
        }

        // Check if tickets are available
        if (event.available_tickets <= 0) {
            alert("Désolé, cet événement est complet.");
            return;
        }

        setBookingModalOpen(true);
    };

    const handleFavorite = () => {
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }
        setIsFavorite(!isFavorite);
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: event.title,
                text: event.description,
                url: window.location.href,
            });
        }
    };

    if (!event) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Typography>Chargement...</Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Breadcrumbs */}
            <Breadcrumbs sx={{ mb: 3 }}>
                <Link component="button" variant="body2" onClick={() => navigate("/")} sx={{ textDecoration: "none" }}>
                    Accueil
                </Link>
                <Link component="button" variant="body2" onClick={() => navigate("/")} sx={{ textDecoration: "none" }}>
                    Événements
                </Link>
                <Typography variant="body2" color="text.primary">
                    {event.title}
                </Typography>
            </Breadcrumbs>

            <Grid container spacing={4}>
                {/* Main Content */}
                <Grid size={{ xs: 12, md: 8 }}>
                    {/* Event Image */}
                    <Card sx={{ mb: 4 }}>
                        <CardMedia component="img" height="400" image={event.image_url} alt={event.title} />
                    </Card>

                    {/* Event Info */}
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                            <Box sx={{ flex: 1 }}>
                                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                    {event.categories &&
                                        event.categories.map((category, index) => (
                                            <Chip key={index} label={category} color="primary" variant="outlined" />
                                        ))}
                                    {event.is_last_minute && (
                                        <Chip label={t("home:badges.lastMinute")} color="error" icon={<LocalOffer />} />
                                    )}
                                </Stack>
                                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: "bold" }}>
                                    {event.title}
                                </Typography>
                            </Box>
                            <Box sx={{ display: "flex", gap: 1 }}>
                                <FavoriteButton eventId={event.id} size="large" />
                                <IconButton onClick={handleShare}>
                                    <Share />
                                </IconButton>
                            </Box>
                        </Box>

                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            {event.description}
                        </Typography>

                        {/* Event Details */}
                        <Grid container spacing={3} sx={{ mb: 4 }}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                    <Schedule sx={{ mr: 2, color: "primary.main" }} />
                                    <Box>
                                        <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                                            {new Date(event.event_date).toLocaleDateString("fr-FR", {
                                                weekday: "long",
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {new Date(event.event_date).toLocaleTimeString("fr-FR", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                    <LocationOn sx={{ mr: 2, color: "primary.main" }} />
                                    <Box>
                                        <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                                            {event.venue?.name || event.venue_name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {event.address}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 3 }} />

                        {/* Long Description */}
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                            À propos de cet événement
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
                            {event.longDescription}
                        </Typography>

                        {/* Features */}
                        {event.features && event.features.length > 0 && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                                    Inclus
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    {event.features.map((feature, index) => (
                                        <Chip key={index} label={feature} variant="outlined" size="small" />
                                    ))}
                                </Stack>
                            </Box>
                        )}

                        {/* Organizer */}
                        {event.organizer && (
                            <Paper sx={{ p: 3, backgroundColor: "grey.50" }}>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                                    Organisateur
                                </Typography>
                                <Box sx={{ display: "flex", alignItems: "center" }}>
                                    <Avatar src={event.organizer?.avatar} sx={{ mr: 2, width: 60, height: 60 }}>
                                        {!event.organizer?.avatar && event.organizer?.name?.charAt(0)}
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                                            {event.organizer?.name || "Organisateur"}
                                        </Typography>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <Star sx={{ fontSize: "1rem", color: "orange" }} />
                                            <Typography variant="body2" color="text.secondary">
                                                {event.organizer?.rating || 0}/5 • {event.organizer?.eventsCount || 0}{" "}
                                                événements
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Button variant="outlined" size="small">
                                        Voir le profil
                                    </Button>
                                </Box>
                            </Paper>
                        )}
                    </Box>
                </Grid>

                {/* Sidebar */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, position: "sticky", top: 20 }}>
                        {/* Price */}
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 1 }}>
                                <Typography variant="h4" color="primary" sx={{ fontWeight: "bold" }}>
                                    {event.discounted_price}€
                                </Typography>
                                <Typography
                                    variant="h6"
                                    sx={{ textDecoration: "line-through", color: "text.secondary" }}>
                                    {event.original_price}€
                                </Typography>
                                <Chip
                                    label={`-${event.discount_percentage}%`}
                                    color="success"
                                    sx={{ fontWeight: "bold" }}
                                />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                par personne
                            </Typography>
                        </Box>

                        {/* Availability */}
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                <Group sx={{ mr: 1, fontSize: "1rem", color: "text.secondary" }} />
                                <Typography variant="body2" color="text.secondary">
                                    {event.available_tickets} places disponibles sur {event.total_tickets}
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    width: "100%",
                                    height: 6,
                                    backgroundColor: "grey.200",
                                    borderRadius: 3,
                                    overflow: "hidden",
                                }}>
                                <Box
                                    sx={{
                                        width: `${
                                            ((event.total_tickets - event.available_tickets) / event.total_tickets) *
                                            100
                                        }%`,
                                        height: "100%",
                                        backgroundColor: event.available_tickets < 20 ? "error.main" : "primary.main",
                                    }}
                                />
                            </Box>
                        </Box>

                        {/* Purchase Button */}
                        <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            onClick={handlePurchase}
                            sx={{ mb: 2, py: 1.5, fontSize: "1.1rem" }}>
                            {isAuthenticated ? "Réserver maintenant" : "Se connecter pour réserver"}
                        </Button>

                        {event.available_tickets < 20 && (
                            <Typography variant="body2" color="error" sx={{ textAlign: "center", fontWeight: "bold" }}>
                                ⚠️ Plus que {event.available_tickets} places disponibles !
                            </Typography>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Booking Modal */}
            <BookingModal open={bookingModalOpen} onClose={() => setBookingModalOpen(false)} event={event} />
        </Container>
    );
};

export default EventDetail;
