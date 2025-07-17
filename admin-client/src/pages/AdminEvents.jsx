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
} from "@mui/material";
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
} from "@mui/icons-material";
import AdminService from "../services/adminService";
import AdminEventDetail from "../components/AdminEventDetail";

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

    useEffect(() => {
        if (user && user.id) {
            loadEvents();
        } else {
            setLoading(false);
        }
    }, [user?.id]);

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
                                                    label={AdminService.getStatusLabel(
                                                        event.moderation_status,
                                                        "moderation"
                                                    )}
                                                    color={getStatusColor(event.moderation_status)}
                                                    size="small"
                                                />
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
                                                            <Edit />
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
