import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography,
    Alert,
    CircularProgress,
    Avatar,
    Tooltip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    Switch,
    FormControlLabel,
    Divider,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { fr } from "date-fns/locale";
import {
    Edit,
    Delete,
    Visibility,
    Add,
    Search,
    FilterList,
    Event,
    LocationOn,
    Schedule,
    Person,
    Euro,
    CheckCircle,
    Cancel,
    Warning,
    Block,
    Star,
    FlashOn,
    Security,
} from "@mui/icons-material";
import AdminService from '../services/adminService';
import AdminEventDetail from "../components/AdminEventDetail";
import AdminEventForm from "../components/AdminEventForm";

const AdminEvents = ({ user }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [moderationDialogOpen, setModerationDialogOpen] = useState(false);
    const [moderationData, setModerationData] = useState({
        moderation_status: "",
        notes: "",
    });
    
    // State for the new event form
    const [eventFormOpen, setEventFormOpen] = useState(false);
    const [eventFormData, setEventFormData] = useState(null); // null for create, event object for edit
    const [editFormData, setEditFormData] = useState({
        title: "",
        description: "",
        event_date: "",
        venue_id: "",
        category_id: "",
        original_price: "",
        discounted_price: "",
        discount_percentage: 0,
        max_participants: "",
        requirements: "",
        cancellation_policy: "",
    });
    const [venues, setVenues] = useState([]);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        if (user && user.id) {
            loadEvents();
            loadFormData();
        } else {
            setLoading(false);
        }
    }, [user?.id]);

    const loadFormData = async () => {
        try {
            // Load venues and categories for the edit form
            const [venuesData, categoriesData] = await Promise.all([
                AdminService.getVenues(),
                AdminService.getCategories(),
            ]);
            setVenues(venuesData || []);
            setCategories(categoriesData || []);
        } catch (err) {
            console.error("Error loading form data:", err);
        }
    };

    const loadEvents = async () => {
        if (!user || !user.id) {
            setError("User not authenticated");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");
            const data = await AdminService.getEvents();
            setEvents(data.events || []); // Extract events from response
        } catch (err) {
            console.error("Events loading error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value) => {
        setSearchTerm(value);
        setPage(0);
    };

    const handleStatusFilter = (status) => {
        setStatusFilter(status);
        setPage(0);
    };

    const filteredEvents = events.filter((event) => {
        const matchesSearch =
            !searchTerm ||
            event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (event.venue_name && event.venue_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (event.venue_city && event.venue_city.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (event.venue_address && event.venue_address.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === "all" || event.moderation_status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const paginatedEvents = filteredEvents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const handleDeleteEvent = async () => {
        if (!selectedEvent) return;

        try {
            await AdminService.deleteEvent(user.id, selectedEvent.id);
            setEvents(events.filter((e) => e.id !== selectedEvent.id));
            setDeleteDialogOpen(false);
            setSelectedEvent(null);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleModerateEvent = async () => {
        if (!selectedEvent) return;

        try {
            await AdminService.updateEventModeration(
                selectedEvent.id,
                moderationData.moderation_status,
                moderationData.notes
            );
            await loadEvents(); // Reload to get updated data
            setModerationDialogOpen(false);
            setSelectedEvent(null);
            setModerationData({ moderation_status: "", notes: "" });
        } catch (err) {
            setError(err.message);
        }
    };

    const handleToggleFeatured = async (eventId, isFeatured) => {
        try {
            await AdminService.updateEventFeatured(eventId, isFeatured);
            // Update local state
            setEvents(events.map(event =>
                event.id === eventId
                    ? { ...event, is_featured: isFeatured }
                    : event
            ));
        } catch (err) {
            setError(err.message);
        }
    };

    const handleToggleLastMinute = async (eventId, isLastMinute) => {
        try {
            await AdminService.updateEventLastMinute(eventId, isLastMinute);
            // Update local state
            setEvents(events.map(event =>
                event.id === eventId
                    ? { ...event, is_last_minute: isLastMinute }
                    : event
            ));
        } catch (err) {
            setError(err.message);
        }
    };

    // Handlers for the new event form
    const handleCreateEvent = () => {
        setEventFormData(null); // null indicates create mode
        setEventFormOpen(true);
    };

    const handleEventFormSave = async (savedEvent) => {
        // Reload events to get updated data
        await loadEvents();
    };

    const handleEditDialogOpen = (event) => {
        if (event) {
            // Editing existing event
            setEditFormData({
                title: event.title || "",
                description: event.description || "",
                event_date: event.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : "",
                venue_id: event.venue_id || "",
                category_id: event.category_id || "",
                original_price: event.original_price || "",
                discounted_price: event.discounted_price || "",
                discount_percentage: event.discount_percentage || 0,
                max_participants: event.max_participants || event.total_tickets || "",
                requirements: event.requirements || "",
                cancellation_policy: event.cancellation_policy || "",
            });
        } else {
            // Creating new event
            setEditFormData({
                title: "",
                description: "",
                event_date: "",
                venue_id: "",
                category_id: "",
                original_price: "",
                discounted_price: "",
                discount_percentage: 0,
                max_participants: "",
                requirements: "",
                cancellation_policy: "",
            });
        }
        setEditDialogOpen(true);
    };

    const handleEditEventOld = async () => {
        try {
            const eventData = {
                ...editFormData,
                event_date: new Date(editFormData.event_date).toISOString(),
                original_price: Number(editFormData.original_price) || 0,
                discounted_price: Number(editFormData.discounted_price) || 0,
                discount_percentage: Number(editFormData.discount_percentage) || 0,
                max_participants: Number(editFormData.max_participants) || null,
            };

            if (selectedEvent) {
                // Update existing event
                await AdminService.updateEvent(selectedEvent.id, eventData);
            } else {
                // Create new event
                await AdminService.createEvent(eventData);
            }

            await loadEvents(); // Reload events
            setEditDialogOpen(false);
            setSelectedEvent(null);
            setEditFormData({
                title: "",
                description: "",
                event_date: "",
                venue_id: "",
                category_id: "",
                original_price: "",
                discounted_price: "",
                discount_percentage: 0,
                max_participants: "",
                requirements: "",
                cancellation_policy: "",
            });
        } catch (err) {
            setError(err.message);
        }
    };

    // Handlers for the new AdminEventForm
    const handleEditEvent = (event) => {
        setSelectedEvent(event);
        setEventFormOpen(true);
    };

    const handleAddEvent = () => {
        setSelectedEvent(null); // No selected event = create new
        setEventFormOpen(true);
    };

    const handleEventFormClose = () => {
        setEventFormOpen(false);
        setSelectedEvent(null);
    };

    const handleEventFormSubmit = async (eventData) => {
        try {
            // The AdminEventForm component already handles the API call
            // This function just needs to handle UI state updates
            await loadEvents(); // Reload events
            setEventFormOpen(false);
            setSelectedEvent(null);
        } catch (err) {
            setError(err.message);
        }
    };

    const getStatusColor = (moderationStatus, isPublished, organizerWantsPublished) => {
        // Priority: moderation status issues first
        if (moderationStatus === "rejected") {
            return "error"; // Red for rejected
        }
        if (moderationStatus === "revision_requested") {
            return "warning"; // Orange for revision requested
        }
        if (moderationStatus === "under_review") {
            return "info"; // Blue for under review
        }
        if (moderationStatus === "flagged") {
            return "error"; // Red for flagged
        }

        // If approved, show the publication state
        if (moderationStatus === "approved") {
            // Use new logic if organizer_wants_published is available, fallback to is_published
            const wantsPublished = organizerWantsPublished !== undefined ? organizerWantsPublished : isPublished;
            if (wantsPublished) {
                return "success"; // Green - approved AND published
            } else {
                return "info"; // Blue - approved but organizer keeps private
            }
        }

        return "default"; // Gray as fallback
    };

    const getStatusLabel = (moderationStatus, isPublished, organizerWantsPublished) => {
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

        return moderationStatus || "Inconnu";
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
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <Box>
            {selectedEventId ? (
                <AdminEventDetail
                    eventId={selectedEventId}
                    onClose={() => {
                        setSelectedEventId(null);
                        loadEvents(); // Reload events in case of changes
                    }}
                    user={user}
                />
            ) : (
                <>
                    {/* Header */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                        <Typography variant="h5" component="h2" sx={{ fontWeight: "bold" }}>
                            Gestion des événements
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={handleAddEvent}
                        >
                            Nouvel événement
                        </Button>
                    </Box>

                    {/* Error Alert */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
                            {error}
                        </Alert>
                    )}

                    {/* Filters */}
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    placeholder="Rechercher par titre, description, lieu..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    InputProps={{
                                        startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
                                    }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 3 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Statut</InputLabel>
                                    <Select
                                        value={statusFilter}
                                        label="Statut"
                                        onChange={(e) => handleStatusFilter(e.target.value)}>
                                        <MenuItem value="all">Tous</MenuItem>
                                        <MenuItem value="approved">Approuvé</MenuItem>
                                        <MenuItem value="under_review">En révision</MenuItem>
                                        <MenuItem value="rejected">Rejeté</MenuItem>
                                        <MenuItem value="suspended">Suspendu</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, md: 3 }}>
                                <Typography variant="body2" color="text.secondary">
                                    {filteredEvents.length} événement(s) trouvé(s)
                                </Typography>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Loading */}
                    {loading && (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                            <CircularProgress />
                        </Box>
                    )}

                    {/* Events Table */}
                    {!loading && (
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Événement</TableCell>
                                        <TableCell>Organisateur</TableCell>
                                        <TableCell>Date & Lieu</TableCell>
                                        <TableCell>Prix</TableCell>
                                        <TableCell>Statut</TableCell>
                                        <TableCell>Promotion</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedEvents.map((event) => (
                                        <TableRow key={event.id} hover>
                                            <TableCell>
                                                <Box sx={{ display: "flex", alignItems: "center" }}>
                                                    <Avatar src={event.image_url} sx={{ mr: 2, width: 40, height: 40 }}>
                                                        <Event />
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                                                            {event.title}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary" noWrap>
                                                            {event.description?.substring(0, 50)}...
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: "flex", alignItems: "center" }}>
                                                    <Person sx={{ mr: 1, color: "text.secondary" }} />
                                                    <Typography variant="body2">
                                                        {event.creator_email || "N/A"}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box>
                                                    <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                                                        <Schedule
                                                            sx={{
                                                                mr: 1,
                                                                fontSize: "0.875rem",
                                                                color: "text.secondary",
                                                            }}
                                                        />
                                                        <Typography variant="body2">
                                                            {formatDate(event.event_date)}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: "flex", alignItems: "center" }}>
                                                        <LocationOn
                                                            sx={{
                                                                mr: 1,
                                                                fontSize: "0.875rem",
                                                                color: "text.secondary",
                                                            }}
                                                        />
                                                        <Typography variant="body2" color="text.secondary">
                                                            {event.venue_name && event.venue_city
                                                                ? `${event.venue_name}, ${event.venue_city}`
                                                                : event.venue_address ||
                                                                  event.venue_name ||
                                                                  "Lieu non défini"}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: "flex", alignItems: "center" }}>
                                                    <Euro
                                                        sx={{ mr: 0.5, fontSize: "0.875rem", color: "text.secondary" }}
                                                    />
                                                    <Typography variant="body2">
                                                        {AdminService.formatCurrency(
                                                            event.discounted_price || event.original_price
                                                        )}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    icon={getStatusIcon(event.moderation_status)}
                                                    label={getStatusLabel(
                                                        event.moderation_status,
                                                        event.is_published,
                                                        event.organizer_wants_published
                                                    )}
                                                    color={getStatusColor(event.moderation_status, event.is_published, event.organizer_wants_published)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                    <FormControlLabel
                                                        control={
                                                            <Switch
                                                                size="small"
                                                                checked={event.is_featured || false}
                                                                onChange={(e) => handleToggleFeatured(event.id, e.target.checked)}
                                                            />
                                                        }
                                                        label={
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                <Star sx={{ fontSize: '1rem', color: event.is_featured ? 'gold' : 'text.secondary' }} />
                                                                <Typography variant="caption">Mis en avant</Typography>
                                                            </Box>
                                                        }
                                                        labelPlacement="end"
                                                        sx={{ margin: 0 }}
                                                    />
                                                    <FormControlLabel
                                                        control={
                                                            <Switch
                                                                size="small"
                                                                checked={event.is_last_minute || false}
                                                                onChange={(e) => handleToggleLastMinute(event.id, e.target.checked)}
                                                            />
                                                        }
                                                        label={
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                <FlashOn sx={{ fontSize: '1rem', color: event.is_last_minute ? 'orange' : 'text.secondary' }} />
                                                                <Typography variant="caption">Dernière min</Typography>
                                                            </Box>
                                                        }
                                                        labelPlacement="end"
                                                        sx={{ margin: 0 }}
                                                    />
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={1}>
                                                    <Tooltip title="Voir">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                setSelectedEventId(event.id);
                                                            }}>
                                                            <Visibility />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Modifier">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleEditEvent(event)}>
                                                            <Edit />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Modérer">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                setSelectedEvent(event);
                                                                setModerationData({
                                                                    moderation_status: event.moderation_status || "",
                                                                    notes: event.admin_notes || "",
                                                                });
                                                                setModerationDialogOpen(true);
                                                            }}>
                                                            <Security />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Supprimer">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => {
                                                                setSelectedEvent(event);
                                                                setDeleteDialogOpen(true);
                                                            }}>
                                                            <Delete />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <TablePagination
                                component="div"
                                count={filteredEvents.length}
                                page={page}
                                onPageChange={(e, newPage) => setPage(newPage)}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={(e) => {
                                    setRowsPerPage(parseInt(e.target.value, 10));
                                    setPage(0);
                                }}
                                rowsPerPageOptions={[5, 10, 25, 50]}
                                labelRowsPerPage="Lignes par page:"
                            />
                        </TableContainer>
                    )}

                    {/* Admin Event Form Dialog */}
                    <AdminEventForm
                        open={eventFormOpen}
                        onClose={handleEventFormClose}
                        event={selectedEvent}
                        onSave={handleEventFormSubmit}
                        venues={venues}
                        categories={categories}
                    />

                    {/* Delete Confirmation Dialog */}
                    <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                        <DialogTitle>Confirmer la suppression</DialogTitle>
                        <DialogContent>
                            <Typography>
                                Êtes-vous sûr de vouloir supprimer l'événement "{selectedEvent?.title}" ? Cette action
                                est irréversible.
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
                        <DialogTitle>Modérer l'événement: {selectedEvent?.title}</DialogTitle>
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
                </>
            )}
        </Box>
    );
};

export default AdminEvents;
