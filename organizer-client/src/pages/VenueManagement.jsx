import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Chip,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
} from "@mui/material";
import { Add, Edit, Delete, LocationOn, Business, People, Save, Cancel } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import organizerService from "../services/organizerService";

const VenueManagement = () => {
    const { t } = useTranslation();

    // State
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Dialog state
    const [openDialog, setOpenDialog] = useState(false);
    const [editingVenue, setEditingVenue] = useState(null);
    const [dialogLoading, setDialogLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        capacity: "",
        address_line_1: "",
        address_line_2: "",
        locality: "",
        administrative_area: "",
        postal_code: "",
        country_code: "FR",
        latitude: "",
        longitude: "",
    });

    // Form validation
    const [formErrors, setFormErrors] = useState({});

    // Countries list
    const countries = [
        { code: "FR", name: "France" },
        { code: "ES", name: "Espagne" },
        { code: "IT", name: "Italie" },
        { code: "DE", name: "Allemagne" },
        { code: "GB", name: "Royaume-Uni" },
        { code: "BE", name: "Belgique" },
        { code: "CH", name: "Suisse" },
        { code: "LU", name: "Luxembourg" },
    ];

    // Load venues
    useEffect(() => {
        loadVenues();
    }, []);

    const loadVenues = async () => {
        try {
            setLoading(true);
            const data = await organizerService.getVenues();
            setVenues(data);
        } catch (error) {
            setError(error.message || "Erreur lors du chargement des lieux");
        } finally {
            setLoading(false);
        }
    };

    // Handle form changes
    const handleFormChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));

        // Clear error for this field
        if (formErrors[field]) {
            setFormErrors((prev) => ({
                ...prev,
                [field]: "",
            }));
        }
    };

    // Validate form
    const validateForm = () => {
        const errors = {};

        if (!formData.name.trim()) {
            errors.name = "Le nom du lieu est requis";
        }

        if (!formData.address_line_1.trim()) {
            errors.address_line_1 = "L'adresse est requise";
        }

        if (!formData.locality.trim()) {
            errors.locality = "La ville est requise";
        }

        if (!formData.country_code) {
            errors.country_code = "Le pays est requis";
        }

        if (formData.capacity && (isNaN(formData.capacity) || Number(formData.capacity) <= 0)) {
            errors.capacity = "La capacité doit être un nombre positif";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Open create dialog
    const handleCreate = () => {
        setEditingVenue(null);
        setFormData({
            name: "",
            capacity: "",
            address_line_1: "",
            address_line_2: "",
            locality: "",
            administrative_area: "",
            postal_code: "",
            country_code: "FR",
            latitude: "",
            longitude: "",
        });
        setFormErrors({});
        setOpenDialog(true);
    };

    // Open edit dialog
    const handleEdit = (venue) => {
        setEditingVenue(venue);
        setFormData({
            name: venue.name || "",
            capacity: venue.capacity?.toString() || "",
            address_line_1: venue.address_line_1 || "",
            address_line_2: venue.address_line_2 || "",
            locality: venue.locality || "",
            administrative_area: venue.administrative_area || "",
            postal_code: venue.postal_code || "",
            country_code: venue.country_code || "FR",
            latitude: venue.latitude?.toString() || "",
            longitude: venue.longitude?.toString() || "",
        });
        setFormErrors({});
        setOpenDialog(true);
    };

    // Handle save
    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        setDialogLoading(true);
        setError("");
        setSuccess("");

        try {
            const venueData = {
                ...formData,
                capacity: formData.capacity ? Number(formData.capacity) : null,
                latitude: formData.latitude ? Number(formData.latitude) : null,
                longitude: formData.longitude ? Number(formData.longitude) : null,
            };

            if (editingVenue) {
                await organizerService.updateVenue(editingVenue.id, venueData);
                setSuccess("Lieu mis à jour avec succès !");
            } else {
                await organizerService.createVenue(venueData);
                setSuccess("Lieu créé avec succès !");
            }

            setOpenDialog(false);
            loadVenues();
        } catch (error) {
            setError(error.message || "Erreur lors de la sauvegarde");
        } finally {
            setDialogLoading(false);
        }
    };

    // Handle delete
    const handleDelete = async (venue) => {
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le lieu "${venue.name}" ?`)) {
            return;
        }

        try {
            await organizerService.deleteVenue(venue.id);
            setSuccess("Lieu supprimé avec succès !");
            loadVenues();
        } catch (error) {
            setError(error.message || "Erreur lors de la suppression");
        }
    };

    // Format address for display
    const formatAddress = (venue) => {
        const parts = [
            venue.address_line_1,
            venue.address_line_2,
            venue.locality,
            venue.administrative_area,
            venue.postal_code,
            countries.find((c) => c.code === venue.country_code)?.name,
        ].filter(Boolean);

        return parts.join(", ");
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" fontWeight="bold">
                    Gestion des lieux
                </Typography>
                <Button variant="contained" startIcon={<Add />} onClick={handleCreate}>
                    Ajouter un lieu
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    {success}
                </Alert>
            )}

            <Card>
                <CardContent>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Nom</TableCell>
                                    <TableCell>Adresse</TableCell>
                                    <TableCell>Capacité</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {venues.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            <Typography color="text.secondary">
                                                Aucun lieu trouvé. Créez votre premier lieu pour commencer.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    venues.map((venue) => (
                                        <TableRow key={venue.id}>
                                            <TableCell>
                                                <Box display="flex" alignItems="center">
                                                    <Business sx={{ mr: 1, color: "text.secondary" }} />
                                                    <Typography fontWeight="medium">{venue.name}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box display="flex" alignItems="center">
                                                    <LocationOn sx={{ mr: 1, color: "text.secondary" }} />
                                                    <Typography>{formatAddress(venue)}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                {venue.capacity ? (
                                                    <Box display="flex" alignItems="center">
                                                        <People sx={{ mr: 1, color: "text.secondary" }} />
                                                        <Typography>{venue.capacity} personnes</Typography>
                                                    </Box>
                                                ) : (
                                                    <Typography color="text.secondary">Non spécifiée</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    onClick={() => handleEdit(venue)}
                                                    size="small"
                                                    color="primary">
                                                    <Edit />
                                                </IconButton>
                                                <IconButton
                                                    onClick={() => handleDelete(venue)}
                                                    size="small"
                                                    color="error">
                                                    <Delete />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>{editingVenue ? "Modifier le lieu" : "Créer un nouveau lieu"}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                        {/* Basic Information */}
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="h6" gutterBottom>
                                Informations générales
                            </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Nom du lieu"
                                value={formData.name}
                                onChange={(e) => handleFormChange("name", e.target.value)}
                                error={!!formErrors.name}
                                helperText={formErrors.name}
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Capacité"
                                type="number"
                                value={formData.capacity}
                                onChange={(e) => handleFormChange("capacity", e.target.value)}
                                error={!!formErrors.capacity}
                                helperText={formErrors.capacity}
                            />
                        </Grid>

                        {/* Address */}
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                Adresse
                            </Typography>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Adresse (ligne 1)"
                                value={formData.address_line_1}
                                onChange={(e) => handleFormChange("address_line_1", e.target.value)}
                                error={!!formErrors.address_line_1}
                                helperText={formErrors.address_line_1}
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Adresse (ligne 2)"
                                value={formData.address_line_2}
                                onChange={(e) => handleFormChange("address_line_2", e.target.value)}
                                helperText="Appartement, étage, etc. (optionnel)"
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Ville"
                                value={formData.locality}
                                onChange={(e) => handleFormChange("locality", e.target.value)}
                                error={!!formErrors.locality}
                                helperText={formErrors.locality}
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Région/État"
                                value={formData.administrative_area}
                                onChange={(e) => handleFormChange("administrative_area", e.target.value)}
                                helperText="Région, département, état (optionnel)"
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Code postal"
                                value={formData.postal_code}
                                onChange={(e) => handleFormChange("postal_code", e.target.value)}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth error={!!formErrors.country_code} required>
                                <InputLabel>Pays</InputLabel>
                                <Select
                                    value={formData.country_code}
                                    onChange={(e) => handleFormChange("country_code", e.target.value)}
                                    label="Pays">
                                    {countries.map((country) => (
                                        <MenuItem key={country.code} value={country.code}>
                                            {country.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Coordinates */}
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                Coordonnées GPS (optionnel)
                            </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Latitude"
                                type="number"
                                value={formData.latitude}
                                onChange={(e) => handleFormChange("latitude", e.target.value)}
                                helperText="Ex: 48.8566"
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Longitude"
                                type="number"
                                value={formData.longitude}
                                onChange={(e) => handleFormChange("longitude", e.target.value)}
                                helperText="Ex: 2.3522"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)} startIcon={<Cancel />} disabled={dialogLoading}>
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        startIcon={dialogLoading ? <CircularProgress size={20} /> : <Save />}
                        disabled={dialogLoading}>
                        {dialogLoading ? "Sauvegarde..." : editingVenue ? "Mettre à jour" : "Créer"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default VenueManagement;
