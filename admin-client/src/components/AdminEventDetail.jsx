import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    CardMedia,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    Paper,
    Typography,
    Alert,
    CircularProgress,
    Avatar,
    Stack,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
} from "@mui/material";
import {
    ArrowBack,
    Edit,
    Delete,
    Event,
    LocationOn,
    Schedule,
    Person,
    Euro,
    Visibility,
    CheckCircle,
    Cancel,
    Warning,
    Block,
    Star,
    Group,
    BookOnline,
} from "@mui/icons-material";
import AdminService from "../services/adminService";

const AdminEventDetail = ({ eventId, onClose, user }) => {
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [moderationDialogOpen, setModerationDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [moderationData, setModerationData] = useState({
        moderation_status: "",
        notes: "",
    });

    useEffect(() => {
        if (eventId) {
            loadEvent();
        }
    }, [eventId]);

    const loadEvent = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await AdminService.getEvent(eventId);
            setEvent(data);
        } catch (err) {
            console.error("Event loading error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleModerateEvent = async () => {
        if (!event) return;

        try {
            await AdminService.updateEventModeration(event.id, moderationData.moderation_status, moderationData.notes);
            await loadEvent(); // Reload to get updated data
            setModerationDialogOpen(false);
            setModerationData({ moderation_status: "", notes: "" });
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteEvent = async () => {
        if (!event) return;

        try {
            await AdminService.deleteEvent(user.id, event.id);
            setDeleteDialogOpen(false);
            onClose(); // Close the detail view after deletion
        } catch (err) {
            setError(err.message);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "approved":
                return "success";
            case "rejected":
                return "error";
            case "under_review":
                return "warning";
            case "suspended":
                return "error";
            default:
                return "default";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "approved":
                return <CheckCircle />;
            case "rejected":
                return <Cancel />;
            case "under_review":
                return <Warning />;
            case "suspended":
                return <Block />;
            default:
                return <Event />;
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("fr-FR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR",
        }).format(amount || 0);
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box>
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
                <Button onClick={onClose} startIcon={<ArrowBack />}>
                    Retour
                </Button>
            </Box>
        );
    }

    if (!event) {
        return (
            <Box>
                <Alert severity="error" sx={{ mb: 3 }}>
                    Événement non trouvé
                </Alert>
                <Button onClick={onClose} startIcon={<ArrowBack />}>
                    Retour
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Button onClick={onClose} startIcon={<ArrowBack />}>
                    Retour à la liste
                </Button>
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => {
                            setModerationData({
                                moderation_status: event.moderation_status || "",
                                notes: event.admin_notes || "",
                            });
                            setModerationDialogOpen(true);
                        }}>
                        Modérer
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => setDeleteDialogOpen(true)}>
                        Supprimer
                    </Button>
                </Stack>
            </Box>

            <Grid container spacing={3}>
                {/* Event Image and Basic Info */}
                <Grid size={{ xs: 12, md: 8 }}>
                    {/* Event Image */}
                    {event.image_url && (
                        <Card sx={{ mb: 3 }}>
                            <CardMedia
                                component="img"
                                height="300"
                                image={event.image_url}
                                alt={event.title}
                                sx={{ objectFit: "cover" }}
                            />
                        </Card>
                    )}

                    {/* Event Details */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                <Avatar src={event.image_url} sx={{ mr: 2, width: 56, height: 56 }}>
                                    <Event />
                                </Avatar>
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="h4" component="h1" sx={{ fontWeight: "bold", mb: 1 }}>
                                        {event.title}
                                    </Typography>
                                    <Chip
                                        icon={getStatusIcon(event.moderation_status)}
                                        label={AdminService.getStatusLabel(event.moderation_status, "moderation")}
                                        color={getStatusColor(event.moderation_status)}
                                        size="medium"
                                    />
                                </Box>
                            </Box>

                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                {event.description}
                            </Typography>

                            {/* Event Categories */}
                            {event.categories && event.categories.length > 0 && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="h6" sx={{ mb: 1 }}>
                                        Catégories
                                    </Typography>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                        {event.categories.map((category, index) => (
                                            <Chip key={index} label={category} variant="outlined" />
                                        ))}
                                    </Stack>
                                </Box>
                            )}

                            {/* Event Details Grid */}
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                        <Schedule sx={{ mr: 2, color: "primary.main" }} />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Date et heure
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                                                {formatDate(event.event_date)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                        <LocationOn sx={{ mr: 2, color: "primary.main" }} />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Lieu
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                                                {event.venue_name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {event.venue_address}, {event.venue_city}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                        <Euro sx={{ mr: 2, color: "primary.main" }} />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Prix
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                                                {formatCurrency(event.discounted_price || event.original_price)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                        <Group sx={{ mr: 2, color: "primary.main" }} />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Capacité
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                                                {event.available_tickets}/{event.total_tickets} places disponibles
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                            </Grid>

                            {/* Additional Info */}
                            {(event.requirements || event.cancellation_policy) && (
                                <Box sx={{ mt: 3 }}>
                                    {event.requirements && (
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="h6" sx={{ mb: 1 }}>
                                                Exigences
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {event.requirements}
                                            </Typography>
                                        </Box>
                                    )}
                                    {event.cancellation_policy && (
                                        <Box>
                                            <Typography variant="h6" sx={{ mb: 1 }}>
                                                Politique d'annulation
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {event.cancellation_policy}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Sidebar */}
                <Grid size={{ xs: 12, md: 4 }}>
                    {/* Organizer Info */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                                Organisateur
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                <Person sx={{ mr: 2, color: "text.secondary" }} />
                                <Box>
                                    <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                                        {event.creator_first_name || event.creator_last_name
                                            ? `${event.creator_first_name || ""} ${
                                                  event.creator_last_name || ""
                                              }`.trim()
                                            : "Nom non disponible"}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {event.creator_email}
                                    </Typography>
                                    {event.creator_phone && (
                                        <Typography variant="body2" color="text.secondary">
                                            {event.creator_phone}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Statistics */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                                Statistiques
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                <BookOnline sx={{ mr: 2, color: "primary.main" }} />
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Réservations
                                    </Typography>
                                    <Typography variant="h6">{event.bookings_count || 0}</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                <Euro sx={{ mr: 2, color: "success.main" }} />
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Revenus totaux
                                    </Typography>
                                    <Typography variant="h6">{formatCurrency(event.total_revenue)}</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                <Star sx={{ mr: 2, color: "warning.main" }} />
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Note moyenne
                                    </Typography>
                                    <Typography variant="h6">
                                        {event.average_rating
                                            ? `${parseFloat(event.average_rating).toFixed(1)}/5`
                                            : "N/A"}
                                        {event.reviews_count > 0 && (
                                            <Typography
                                                component="span"
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ ml: 1 }}>
                                                ({event.reviews_count} avis)
                                            </Typography>
                                        )}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Event Meta */}
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                                Informations techniques
                            </Typography>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    ID de l'événement
                                </Typography>
                                <Typography variant="body1">{event.id}</Typography>
                            </Box>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Statut
                                </Typography>
                                <Typography variant="body1">{event.status}</Typography>
                            </Box>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Publication
                                </Typography>
                                <Typography variant="body1">{event.is_published ? "Publié" : "Non publié"}</Typography>
                            </Box>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    En vedette
                                </Typography>
                                <Typography variant="body1">{event.is_featured ? "Oui" : "Non"}</Typography>
                            </Box>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Créé le
                                </Typography>
                                <Typography variant="body1">{formatDate(event.created_at)}</Typography>
                            </Box>
                            {event.updated_at && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Mis à jour le
                                    </Typography>
                                    <Typography variant="body1">{formatDate(event.updated_at)}</Typography>
                                </Box>
                            )}
                            {event.approved_by_email && (
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Approuvé par
                                    </Typography>
                                    <Typography variant="body1">{event.approved_by_email}</Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Admin Notes */}
            {event.admin_notes && (
                <Card sx={{ mt: 3 }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                            Notes administratives
                        </Typography>
                        <Alert severity="info">
                            <Typography variant="body2">{event.admin_notes}</Typography>
                        </Alert>
                    </CardContent>
                </Card>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirmer la suppression</DialogTitle>
                <DialogContent>
                    <Typography>
                        Êtes-vous sûr de vouloir supprimer l'événement "{event.title}" ? Cette action est irréversible.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
                    <Button onClick={handleDeleteEvent} color="error" variant="contained">
                        Supprimer
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Moderation Dialog */}
            <Dialog
                open={moderationDialogOpen}
                onClose={() => {
                    setModerationDialogOpen(false);
                    setModerationData({ moderation_status: "", notes: "" });
                }}
                maxWidth="sm"
                fullWidth>
                <DialogTitle>Modérer l'événement: {event.title}</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Statut de modération</InputLabel>
                            <Select
                                value={moderationData.moderation_status || ""}
                                label="Statut de modération"
                                onChange={(e) =>
                                    setModerationData({
                                        ...moderationData,
                                        moderation_status: e.target.value,
                                    })
                                }>
                                <MenuItem value="under_review">En cours de révision</MenuItem>
                                <MenuItem value="approved">Approuvé</MenuItem>
                                <MenuItem value="rejected">Rejeté</MenuItem>
                                <MenuItem value="revision_requested">Révision demandée</MenuItem>
                                <MenuItem value="flagged">Signalé</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Notes administratives"
                            value={moderationData.notes}
                            onChange={(e) =>
                                setModerationData({
                                    ...moderationData,
                                    notes: e.target.value,
                                })
                            }
                            placeholder="Ajoutez des notes pour justifier votre décision..."
                            required={
                                moderationData.moderation_status === "rejected" ||
                                moderationData.moderation_status === "revision_requested"
                            }
                            error={
                                !moderationData.notes &&
                                (moderationData.moderation_status === "rejected" ||
                                    moderationData.moderation_status === "revision_requested")
                            }
                            helperText={
                                (moderationData.moderation_status === "rejected" ||
                                    moderationData.moderation_status === "revision_requested") &&
                                !moderationData.notes
                                    ? "Une justification est obligatoire pour les décisions négatives"
                                    : "Ajoutez des notes pour expliquer votre décision"
                            }
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setModerationDialogOpen(false);
                            setModerationData({ moderation_status: "", notes: "" });
                        }}>
                        Annuler
                    </Button>
                    <Button
                        onClick={handleModerateEvent}
                        variant="contained"
                        disabled={
                            !moderationData.moderation_status ||
                            ((moderationData.moderation_status === "rejected" ||
                                moderationData.moderation_status === "revision_requested") &&
                                !moderationData.notes.trim())
                        }>
                        Sauvegarder
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminEventDetail;
