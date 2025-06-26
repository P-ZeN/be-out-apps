import React, { useState, useEffect } from "react";
import {
    Box,
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    Chip,
    Button,
    Paper,
    Alert,
    CircularProgress,
    Tabs,
    Tab,
    Avatar,
    Divider,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
} from "@mui/material";
import {
    Schedule,
    LocationOn,
    Receipt,
    Cancel,
    CheckCircle,
    AccessTime,
    Email,
    QrCode,
    Person,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useAuth } from "../context/AuthContext";
import BookingService from "../services/bookingService";

const Bookings = () => {
    const theme = useTheme();
    const { user, isAuthenticated } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState(0);
    const [cancelDialog, setCancelDialog] = useState({ open: false, booking: null });
    const [cancellationReason, setCancellationReason] = useState("");

    useEffect(() => {
        if (isAuthenticated && user?.id) {
            loadBookings();
        }
    }, [isAuthenticated, user, activeTab]);

    const loadBookings = async () => {
        try {
            setLoading(true);
            setError("");

            const statusFilter =
                activeTab === 0 ? "" : activeTab === 1 ? "confirmed" : activeTab === 2 ? "pending" : "cancelled";

            const result = await BookingService.getUserBookings(user.id, {
                status: statusFilter,
                limit: 20,
            });

            setBookings(BookingService.formatBookings(result).bookings);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async () => {
        try {
            setLoading(true);
            await BookingService.cancelBooking(cancelDialog.booking.id, cancellationReason);
            setCancelDialog({ open: false, booking: null });
            setCancellationReason("");
            loadBookings(); // Reload bookings
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "confirmed":
                return "success";
            case "pending":
                return "warning";
            case "cancelled":
                return "error";
            case "refunded":
                return "info";
            default:
                return "default";
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case "confirmed":
                return "Confirmé";
            case "pending":
                return "En attente";
            case "cancelled":
                return "Annulé";
            case "refunded":
                return "Remboursé";
            default:
                return status;
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("fr-FR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (!isAuthenticated) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Alert severity="info">Veuillez vous connecter pour voir vos réservations.</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: "bold" }}>
                Mes réservations
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Gérez vos réservations d'événements
            </Typography>

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} variant="fullWidth">
                    <Tab label="Toutes" />
                    <Tab label="Confirmées" />
                    <Tab label="En attente" />
                    <Tab label="Annulées" />
                </Tabs>
            </Paper>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Loading */}
            {loading && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Bookings List */}
            {!loading && (
                <Grid container spacing={3}>
                    {bookings.length === 0 ? (
                        <Grid size={{ xs: 12 }}>
                            <Paper sx={{ p: 4, textAlign: "center" }}>
                                <Receipt sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                                <Typography variant="h6" color="text.secondary">
                                    Aucune réservation trouvée
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Vos réservations apparaîtront ici une fois que vous aurez réservé des événements.
                                </Typography>
                            </Paper>
                        </Grid>
                    ) : (
                        bookings.map((booking) => (
                            <Grid size={{ xs: 12, md: 6 }} key={booking.id}>
                                <Card sx={{ height: "100%" }}>
                                    <CardContent>
                                        {/* Header */}
                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "flex-start",
                                                mb: 2,
                                            }}>
                                            <Box>
                                                <Typography variant="h6" gutterBottom>
                                                    {booking.event_title}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{ fontFamily: "monospace", color: "text.secondary" }}>
                                                    {booking.booking_reference}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                label={getStatusLabel(booking.booking_status)}
                                                color={getStatusColor(booking.booking_status)}
                                                size="small"
                                            />
                                        </Box>

                                        {/* Event Details */}
                                        <Box sx={{ mb: 2 }}>
                                            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                                <Schedule sx={{ mr: 1, fontSize: "1rem", color: "text.secondary" }} />
                                                <Typography variant="body2">
                                                    {formatDate(booking.event_date)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                                <LocationOn sx={{ mr: 1, fontSize: "1rem", color: "text.secondary" }} />
                                                <Typography variant="body2">
                                                    {booking.venue_name}, {booking.venue_city}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                                <Person sx={{ mr: 1, fontSize: "1rem", color: "text.secondary" }} />
                                                <Typography variant="body2">
                                                    {booking.quantity} billet{booking.quantity > 1 ? "s" : ""}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {/* Price */}
                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                mb: 2,
                                            }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Total payé
                                            </Typography>
                                            <Typography variant="h6" color="primary" sx={{ fontWeight: "bold" }}>
                                                {booking.total_price}€
                                            </Typography>
                                        </Box>

                                        {/* Booking Date */}
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            Réservé le {new Date(booking.booking_date).toLocaleDateString("fr-FR")}
                                        </Typography>

                                        <Divider sx={{ my: 2 }} />

                                        {/* Actions */}
                                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                                            <Button size="small" variant="outlined" startIcon={<Email />} disabled>
                                                Renvoyer billets
                                            </Button>

                                            {booking.booking_status === "confirmed" && (
                                                <Button size="small" variant="outlined" startIcon={<QrCode />} disabled>
                                                    QR Codes
                                                </Button>
                                            )}

                                            {(booking.booking_status === "confirmed" ||
                                                booking.booking_status === "pending") &&
                                                new Date() < new Date(booking.event_date) && (
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        color="error"
                                                        startIcon={<Cancel />}
                                                        onClick={() => setCancelDialog({ open: true, booking })}>
                                                        Annuler
                                                    </Button>
                                                )}
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))
                    )}
                </Grid>
            )}

            {/* Cancel Dialog */}
            <Dialog
                open={cancelDialog.open}
                onClose={() => setCancelDialog({ open: false, booking: null })}
                maxWidth="sm"
                fullWidth>
                <DialogTitle>Annuler la réservation</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Êtes-vous sûr de vouloir annuler cette réservation ?
                    </Typography>
                    {cancelDialog.booking && (
                        <Paper sx={{ p: 2, mb: 2, backgroundColor: theme.palette.grey[50] }}>
                            <Typography variant="subtitle2">{cancelDialog.booking.event_title}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {cancelDialog.booking.quantity} billet{cancelDialog.booking.quantity > 1 ? "s" : ""} -{" "}
                                {cancelDialog.booking.total_price}€
                            </Typography>
                        </Paper>
                    )}
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Raison de l'annulation (optionnel)"
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        placeholder="Expliquez pourquoi vous annulez cette réservation..."
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCancelDialog({ open: false, booking: null })}>
                        Garder ma réservation
                    </Button>
                    <Button variant="contained" color="error" onClick={handleCancelBooking} disabled={loading}>
                        Confirmer l'annulation
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Bookings;
