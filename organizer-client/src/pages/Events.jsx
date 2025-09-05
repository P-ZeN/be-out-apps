import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
    Tooltip,
    Switch,
    FormControlLabel,
    Snackbar,
} from "@mui/material";
import {
    Add,
    MoreVert,
    Edit,
    Delete,
    Visibility,
    CalendarToday,
    People,
    TrendingUp,
    Send,
    Publish,
    UnpublishedOutlined,
    History,
    Undo,
    CheckCircle,
    Schedule,
    Warning,
    Block,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import organizerService from "../services/organizerService";

const Events = () => {
    const { t } = useTranslation('organizer');
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, type: "", eventId: null });
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const navigate = useNavigate();

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            const data = await organizerService.getEvents();
            setEvents(data);
        } catch (error) {
            console.error("Error loading events:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMenuOpen = (event, eventData) => {
        setAnchorEl(event.currentTarget);
        setSelectedEvent(eventData);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedEvent(null);
    };

    const showSnackbar = (message, severity = "success") => {
        setSnackbar({ open: true, message, severity });
    };

    const handleConfirmDialog = (type, eventId) => {
        setConfirmDialog({ open: true, type, eventId });
        handleMenuClose();
    };

    const handleStatusAction = async () => {
        const { type, eventId } = confirmDialog;
        try {
            let response;
            switch (type) {
                case "submit":
                    response = await organizerService.submitEventForReview(eventId);
                    showSnackbar("Événement soumis pour révision avec succès");
                    break;
                case "revert":
                    response = await organizerService.revertEventToDraft(eventId);
                    showSnackbar("Événement remis en brouillon avec succès");
                    break;
                case "publish":
                    response = await organizerService.publishEvent(eventId, true);
                    showSnackbar("Événement publié avec succès");
                    break;
                case "unpublish":
                    response = await organizerService.publishEvent(eventId, false);
                    showSnackbar("Événement dépublié avec succès");
                    break;
                default:
                    break;
            }
            if (response) {
                loadEvents(); // Reload events to reflect changes
            }
        } catch (error) {
            showSnackbar(error.message, "error");
        } finally {
            setConfirmDialog({ open: false, type: "", eventId: null });
        }
    };

        const getStatusColor = (status, moderationStatus, isPublished, organizerWantsPublished) => {
        // Priority: moderation status issues first
        if (moderationStatus === "rejected" || moderationStatus === "flagged") {
            return "error"; // Red for rejected/flagged
        }
        if (moderationStatus === "revision_requested") {
            return "warning"; // Orange for revision requested
        }
        if (moderationStatus === "under_review") {
            return "info"; // Blue for under review
        }
        
        // If approved, show the publication state
        if (moderationStatus === "approved") {
            // Use new logic if organizer_wants_published is available, fallback to is_published
            const wantsPublished = organizerWantsPublished !== undefined ? organizerWantsPublished : isPublished;
            if (wantsPublished) {
                return "success"; // Green for approved AND published
            } else {
                return "info"; // Blue for approved but not published
            }
        }

        // Draft and other states
        switch (status) {
            case "draft":
                return "default"; // Gray for draft
            case "candidate":
                return "info"; // Blue for candidate (awaiting review)
            case "cancelled":
            case "suspended":
                return "error"; // Red for cancelled/suspended
            case "completed":
                return "default"; // Gray for completed
            default:
                return "default";
        }
    };

    const getStatusLabel = (status, moderationStatus, isPublished, organizerWantsPublished) => {
        // Priority: moderation status issues first
        if (moderationStatus === "rejected") {
            return "Rejeté";
        }
        if (moderationStatus === "revision_requested") {
            return "Révision demandée";
        }
        if (moderationStatus === "under_review") {
            return "En cours de révision";
        }
        if (moderationStatus === "flagged") {
            return "Signalé";
        }

        // If approved, show the publication state clearly
        if (moderationStatus === "approved") {
            // Use new logic if organizer_wants_published is available, fallback to is_published
            const wantsPublished = organizerWantsPublished !== undefined ? organizerWantsPublished : isPublished;
            if (wantsPublished) {
                return "🌐 Publié"; // Green - visible to public
            } else {
                return "✅ Approuvé (privé)"; // Blue - approved but organizer keeps private
            }
        }

        switch (status) {
            case "draft":
                return "Brouillon";
            case "candidate":
                return "En attente de validation";
            case "cancelled":
                return "Annulé";
            case "suspended":
                return "Suspendu";
            case "completed":
                return "Terminé";
            default:
                return status;
        }
    };

    const getStatusTooltip = (status, moderationStatus, isPublished, organizerWantsPublished) => {
        if (moderationStatus === "rejected") {
            return "Votre événement a été rejeté. Consultez les commentaires et modifiez-le.";
        }
        if (moderationStatus === "revision_requested") {
            return "Des modifications sont requises. Consultez les commentaires de l'administrateur.";
        }
        if (moderationStatus === "under_review") {
            return "Votre événement est en cours de révision par notre équipe.";
        }
        if (moderationStatus === "flagged") {
            return "Votre événement a été signalé. Vous pouvez le modifier et le soumettre à nouveau.";
        }
        if (moderationStatus === "approved") {
            // Use new logic if organizer_wants_published is available, fallback to is_published
            const wantsPublished = organizerWantsPublished !== undefined ? organizerWantsPublished : isPublished;
            if (wantsPublished) {
                return "Votre événement est publié et visible par le public.";
            } else {
                return "Votre événement est approuvé par l'admin mais vous l'avez gardé privé.";
            }
        }
        if (status === "draft") {
            return "Votre événement est en brouillon. Soumettez-le pour révision quand il est prêt.";
        }
        if (status === "candidate") {
            return "Votre événement attend la validation de notre équipe.";
        }
        return "";
    };

    const canSubmitForReview = (event) => {
        return event.status === "draft" || 
               event.moderation_status === "rejected" || 
               event.moderation_status === "revision_requested" || 
               event.moderation_status === "flagged";
    };

    const canRevertToDraft = (event) => {
        return event.status === "candidate" && event.moderation_status === "under_review";
    };

    const canPublishUnpublish = (event) => {
        return event.moderation_status === "approved";
    };

    const canEdit = (event) => {
        // Allow editing for draft events
        if (event.status === "draft") return true;

        // Allow editing if admin requested revision, rejected, or flagged
        if (event.moderation_status === "revision_requested") return true;
        if (event.moderation_status === "rejected") return true;
        if (event.moderation_status === "flagged") return true;

        // Do NOT allow editing approved events that are published or under review
        // Once approved, major changes should require re-submission
        return false;
    };

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Mes événements
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Gérez vos événements et suivez leurs performances
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<Add />} onClick={() => navigate("/events/new")} size="large">
                    Nouvel événement
                </Button>
            </Box>

            {events.length === 0 ? (
                <Card>
                    <CardContent sx={{ textAlign: "center", py: 6 }}>
                        <CalendarToday sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                            Aucun événement créé
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Commencez par créer votre premier événement pour commencer à vendre des billets
                        </Typography>
                        <Button variant="contained" startIcon={<Add />} onClick={() => navigate("/events/new")}>
                            Créer mon premier événement
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Grid container spacing={3}>
                    {events.map((event) => (
                        <Grid size={{ xs: 12, md: 6, lg: 4 }} key={event.id}>
                            <Card>
                                <CardContent>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "flex-start",
                                            mb: 2,
                                        }}>
                                        <Tooltip
                                            title={getStatusTooltip(
                                                event.status,
                                                event.moderation_status,
                                                event.is_published,
                                                event.organizer_wants_published
                                            )}>
                                            <Chip
                                                label={getStatusLabel(
                                                    event.status,
                                                    event.moderation_status,
                                                    event.is_published,
                                                    event.organizer_wants_published
                                                )}
                                                color={getStatusColor(event.status, event.moderation_status, event.is_published, event.organizer_wants_published)}
                                                size="small"
                                                icon={
                                                    event.moderation_status === "approved" && event.is_published ? (
                                                        <CheckCircle sx={{ fontSize: 16 }} />
                                                    ) : event.moderation_status === "under_review" ? (
                                                        <Schedule sx={{ fontSize: 16 }} />
                                                    ) : event.moderation_status === "revision_requested" ? (
                                                        <Warning sx={{ fontSize: 16 }} />
                                                    ) : event.moderation_status === "rejected" ? (
                                                        <Block sx={{ fontSize: 16 }} />
                                                    ) : undefined
                                                }
                                            />
                                        </Tooltip>
                                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, event)}>
                                            <MoreVert />
                                        </IconButton>
                                    </Box>

                                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                                        {event.title}
                                    </Typography>

                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {new Date(event.event_date).toLocaleDateString("fr-FR", {
                                            weekday: "long",
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </Typography>

                                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                                        <Box sx={{ display: "flex", alignItems: "center" }}>
                                            <People sx={{ fontSize: 16, mr: 0.5, color: "text.secondary" }} />
                                            <Typography variant="body2" color="text.secondary">
                                                {event.total_bookings || 0} réservations
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: "flex", alignItems: "center" }}>
                                            <TrendingUp sx={{ fontSize: 16, mr: 0.5, color: "text.secondary" }} />
                                            <Typography variant="body2" color="text.secondary">
                                                {event.revenue || 0}€
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Typography variant="body2" color="text.secondary">
                                        {event.available_tickets}/{event.total_tickets} billets disponibles
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem
                    disabled={!selectedEvent?.is_published || selectedEvent?.moderation_status !== "approved"}
                    onClick={() => {
                        if (selectedEvent?.is_published && selectedEvent?.moderation_status === "approved") {
                            // Navigate to the public event page in the client app
                            const clientUrl = import.meta.env.VITE_CLIENT_URL || "http://localhost:5173";
                            window.open(`${clientUrl}/events/${selectedEvent?.id}`, "_blank");
                        }
                        handleMenuClose();
                    }}>
                    <ListItemIcon>
                        <Visibility fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Voir la page de l'événement</ListItemText>
                </MenuItem>

                {/* Edit - always available */}
                <MenuItem
                    onClick={() => {
                        navigate(`/events/${selectedEvent?.id}/edit`);
                        handleMenuClose();
                    }}>
                    <ListItemIcon>
                        <Edit fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Modifier</ListItemText>
                </MenuItem>

                {/* Submit for review - only for draft events */}
                {selectedEvent && canSubmitForReview(selectedEvent) && (
                    <MenuItem onClick={() => handleConfirmDialog("submit", selectedEvent.id)}>
                        <ListItemIcon>
                            <Send fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Soumettre pour révision</ListItemText>
                    </MenuItem>
                )}

                {/* Revert to draft - only for candidate events under review */}
                {selectedEvent && canRevertToDraft(selectedEvent) && (
                    <MenuItem onClick={() => handleConfirmDialog("revert", selectedEvent.id)}>
                        <ListItemIcon>
                            <Undo fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Remettre en brouillon</ListItemText>
                    </MenuItem>
                )}

                {/* Publish/Unpublish - only for approved events */}
                {selectedEvent && canPublishUnpublish(selectedEvent) && (
                    <>
                        {!selectedEvent.is_published ? (
                            <MenuItem onClick={() => handleConfirmDialog("publish", selectedEvent.id)}>
                                <ListItemIcon>
                                    <Publish fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>Publier</ListItemText>
                            </MenuItem>
                        ) : (
                            <MenuItem onClick={() => handleConfirmDialog("unpublish", selectedEvent.id)}>
                                <ListItemIcon>
                                    <UnpublishedOutlined fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>Dépublier</ListItemText>
                            </MenuItem>
                        )}
                    </>
                )}

                {/* Status History */}
                <MenuItem
                    onClick={() => {
                        navigate(`/events/${selectedEvent?.id}/status-history`);
                        handleMenuClose();
                    }}>
                    <ListItemIcon>
                        <History fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Historique des statuts</ListItemText>
                </MenuItem>

                {/* Delete - only for draft events */}
                {selectedEvent && selectedEvent.status === "draft" && (
                    <MenuItem onClick={handleMenuClose}>
                        <ListItemIcon>
                            <Delete fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Supprimer</ListItemText>
                    </MenuItem>
                )}
            </Menu>

            {/* Confirmation Dialog */}
            <Dialog
                open={confirmDialog.open}
                onClose={() => setConfirmDialog({ open: false, type: "", eventId: null })}>
                <DialogTitle>
                    {confirmDialog.type === "submit" && "Soumettre pour révision"}
                    {confirmDialog.type === "revert" && "Remettre en brouillon"}
                    {confirmDialog.type === "publish" && "Publier l'événement"}
                    {confirmDialog.type === "unpublish" && "Dépublier l'événement"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {confirmDialog.type === "submit" &&
                            "Voulez-vous soumettre cet événement pour révision ? Une fois soumis, il sera examiné par notre équipe."}
                        {confirmDialog.type === "revert" &&
                            "Voulez-vous remettre cet événement en brouillon ? Vous pourrez le modifier et le soumettre à nouveau."}
                        {confirmDialog.type === "publish" &&
                            "Voulez-vous publier cet événement ? Il sera visible par le public et ouvert aux réservations."}
                        {confirmDialog.type === "unpublish" &&
                            "Voulez-vous dépublier cet événement ? Il ne sera plus visible par le public mais restera approuvé."}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialog({ open: false, type: "", eventId: null })}>Annuler</Button>
                    <Button onClick={handleStatusAction} variant="contained">
                        Confirmer
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ open: false, message: "", severity: "success" })}>
                <Alert
                    onClose={() => setSnackbar({ open: false, message: "", severity: "success" })}
                    severity={snackbar.severity}
                    sx={{ width: "100%" }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Events;
