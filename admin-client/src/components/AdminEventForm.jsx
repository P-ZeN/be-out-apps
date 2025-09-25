import React, { useState, useEffect, useRef } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    Box,
    Typography,
    InputAdornment,
    Alert,
    CircularProgress,
    Card,
    CardMedia,
    IconButton,
    Chip,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
    Save,
    Cancel,
    PhotoCamera,
    Delete,
    Add,
    LocationOn
} from "@mui/icons-material";
import AdminService from "../services/adminService";

const AdminEventForm = ({
    open,
    onClose,
    event = null, // null for create, event object for edit
    onSave
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [venues, setVenues] = useState([]);
    const [categories, setCategories] = useState([]);
    const [organizers, setOrganizers] = useState([]);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [showAddVenueDialog, setShowAddVenueDialog] = useState(false);
    const [venueDialogLoading, setVenueDialogLoading] = useState(false);
    const [newVenueData, setNewVenueData] = useState({
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
    const fileInputRef = useRef();

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        event_date: null,
        venue_id: "",
        category_id: "",
        original_price: "",
        discounted_price: "",
        discount_percentage: 0,
        max_participants: "",
        requirements: "",
        cancellation_policy: "",
        is_featured: false,
        is_last_minute: false,
        is_published: false, // Default to hidden from public
        organizer_id: "", // Add organizer_id field
    });

    const isEdit = Boolean(event);

    // Load venues, categories and organizers on mount
    useEffect(() => {
        const loadFormData = async () => {
            try {
                setLoading(true);
                const [venuesData, categoriesData, organizersData] = await Promise.all([
                    AdminService.getVenues(),
                    AdminService.getCategories(),
                    AdminService.getOrganizers()
                ]);

                setVenues(venuesData || []);
                setCategories(categoriesData || []);
                setOrganizers(organizersData?.users || []);
            } catch (err) {
                setError("Erreur lors du chargement des données");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (open) {
            loadFormData();
        }
    }, [open]);

    // Load event data when editing - but only after categories and organizers are loaded
    useEffect(() => {
        if (event && open && categories.length > 0 && organizers.length >= 0) {
            const loadFullEventData = async () => {
                try {
                    setLoading(true);
                    // Fetch complete event data with categories
                    const fullEventData = await AdminService.getEvent(event.id);

                    console.log("=== FULL EVENT DATA ===");
                    console.log("Full event object:", fullEventData);
                    console.log("Full event categories:", fullEventData.categories);

                    // Extract category_id from the categories array if available
                    let categoryId = "";
                    if (fullEventData.categories && fullEventData.categories.length > 0) {
                        // Find the category ID by matching the category name
                        const categoryName = fullEventData.categories[0]; // Take first category if multiple
                        const matchedCategory = categories.find(c => c.name === categoryName);
                        categoryId = matchedCategory ? String(matchedCategory.id) : "";
                    } else if (fullEventData.category_id) {
                        categoryId = String(fullEventData.category_id);
                    }

                    console.log("Final resolved category_id:", categoryId);

                    // Handle organizer_id - if it's an admin user, set to empty string to show "No organizer defined"
                    let resolvedOrganizerId = "";
                    if (fullEventData.organizer_id) {
                        // Check if the organizer_id exists in our loaded organizers list
                        const organizerExists = organizers.find(org => String(org.id) === String(fullEventData.organizer_id));
                        if (organizerExists) {
                            resolvedOrganizerId = String(fullEventData.organizer_id);
                        }
                        // If organizer doesn't exist in our list (likely an admin), leave as empty string
                    }

                    setFormData({
                        title: fullEventData.title || "",
                        description: fullEventData.description || "",
                        event_date: fullEventData.event_date ? new Date(fullEventData.event_date) : null,
                        venue_id: String(fullEventData.venue_id || ""),
                        category_id: categoryId,
                        original_price: fullEventData.original_price || fullEventData.price || "",
                        discounted_price: fullEventData.discounted_price || fullEventData.price || "",
                        discount_percentage: fullEventData.discount_percentage || 0,
                        max_participants: fullEventData.total_tickets || fullEventData.max_participants || "",
                        requirements: fullEventData.requirements || "",
                        cancellation_policy: fullEventData.cancellation_policy || "",
                        is_featured: fullEventData.is_featured || false,
                        is_last_minute: fullEventData.is_last_minute || false,
                        is_published: fullEventData.is_published || false,
                        organizer_id: resolvedOrganizerId,
                    });

                    // Set image preview if event has an image
                    if (fullEventData.image_url) {
                        setImagePreview(fullEventData.image_url);
                    } else {
                        setImagePreview("");
                    }
                    setImageFile(null);

                } catch (err) {
                    console.error("Error loading full event data:", err);
                    setError("Erreur lors du chargement des données de l'événement");
                } finally {
                    setLoading(false);
                }
            };

            loadFullEventData();
        } else if (open && !event) {
            // Reset form for new event
            setFormData({
                title: "",
                description: "",
                event_date: null,
                venue_id: "",
                category_id: "",
                original_price: "",
                discounted_price: "",
                discount_percentage: 0,
                max_participants: "",
                requirements: "",
                cancellation_policy: "",
                is_featured: false,
                is_last_minute: false,
                is_published: false, // Default to "masqué du public"
                organizer_id: "",
            });
            setImagePreview("");
            setImageFile(null);
        }
        setError("");
    }, [event, open, categories, organizers]);

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handlePriceChange = (field, value) => {
        const updatedData = { ...formData, [field]: value };

        // Auto-calculate discount percentage when prices change
        if (field === 'original_price' || field === 'discounted_price') {
            const original = parseFloat(field === 'original_price' ? value : formData.original_price) || 0;
            const discounted = parseFloat(field === 'discounted_price' ? value : formData.discounted_price) || 0;

            if (original > 0 && discounted >= 0) {
                const percentage = Math.round(((original - discounted) / original) * 100);
                updatedData.discount_percentage = Math.max(0, Math.min(100, percentage));
            }
        }

        setFormData(updatedData);
    };

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setImageFile(file);

            // Create preview URL
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageRemove = () => {
        setImageFile(null);
        setImagePreview("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleAddVenue = () => {
        setNewVenueData({
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
        setShowAddVenueDialog(true);
    };

    const handleVenueDataChange = (field, value) => {
        setNewVenueData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSaveNewVenue = async () => {
        // Basic validation
        if (!newVenueData.name.trim() || !newVenueData.address_line_1.trim() || !newVenueData.locality.trim()) {
            setError("Veuillez remplir les champs obligatoires du nouveau lieu");
            return;
        }

        setVenueDialogLoading(true);

        try {
            const venueData = {
                ...newVenueData,
                capacity: newVenueData.capacity ? Number(newVenueData.capacity) : null,
                latitude: newVenueData.latitude ? Number(newVenueData.latitude) : null,
                longitude: newVenueData.longitude ? Number(newVenueData.longitude) : null,
            };

            const newVenue = await AdminService.createVenue(venueData);

            // Reload venues
            const venuesData = await AdminService.getVenues();
            setVenues(venuesData || []);

            // Select the new venue
            handleChange('venue_id', String(newVenue.id));

            setShowAddVenueDialog(false);

            // Clear any previous errors
            setError("");
        } catch (error) {
            setError(error.message || "Erreur lors de la création du lieu");
        } finally {
            setVenueDialogLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.description || !formData.event_date ||
            !formData.venue_id || !formData.category_id) {
            setError("Veuillez remplir tous les champs obligatoires");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const eventData = {
                ...formData,
                original_price: Number(formData.original_price) || 0,
                discounted_price: Number(formData.discounted_price) || Number(formData.original_price) || 0,
                discount_percentage: Number(formData.discount_percentage) || 0,
                max_participants: Number(formData.max_participants) || null,
                event_date: formData.event_date.toISOString(),
                organizer_id: formData.organizer_id || null, // Send null instead of empty string
            };

            let result;
            if (isEdit) {
                result = await AdminService.updateEvent(event.id, eventData);
            } else {
                result = await AdminService.createEvent(eventData);
            }

            onSave(result);
            onClose();
        } catch (err) {
            setError(err.message || "Erreur lors de la sauvegarde");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setError("");
        onClose();
    };

    return (
        <div>
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
                disableRestoreFocus={true}
                PaperProps={{
                    sx: { minHeight: '80vh' }
                }}
            >
            <DialogTitle>
                {isEdit ? `Modifier l'événement` : "Créer un nouvel événement"}
            </DialogTitle>

            <DialogContent dividers>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={3}>
                    {/* Event Title */}
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            label="Titre de l'événement *"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            disabled={loading}
                        />
                    </Grid>

                    {/* Event Description */}
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Description *"
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            disabled={loading}
                        />
                    </Grid>

                    {/* Event Date */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DateTimePicker
                                label="Date et heure *"
                                value={formData.event_date}
                                onChange={(value) => handleChange('event_date', value)}
                                disabled={loading}
                                format="dd/MM/yyyy HH:mm"
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        required: true,
                                    },
                                    popper: {
                                        disablePortal: true,
                                    },
                                }}
                            />
                        </LocalizationProvider>
                    </Grid>

                    {/* Category */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth required disabled={loading}>
                            <InputLabel>Catégorie</InputLabel>
                            <Select
                                value={formData.category_id}
                                onChange={(e) => handleChange('category_id', e.target.value)}
                                label="Catégorie"
                            >
                                {categories.map((category) => (
                                    <MenuItem key={category.id} value={String(category.id)}>
                                        {category.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Event Owner (Organizer) */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth disabled={loading}>
                            <InputLabel>Propriétaire de l'événement</InputLabel>
                            <Select
                                value={formData.organizer_id}
                                onChange={(e) => handleChange('organizer_id', e.target.value)}
                                label="Propriétaire de l'événement"
                            >
                                <MenuItem value="">
                                    <em>Aucun organisateur défini</em>
                                </MenuItem>
                                {organizers.map((organizer) => (
                                    <MenuItem key={organizer.id} value={String(organizer.id)}>
                                        {organizer.email}
                                        {organizer.first_name && organizer.last_name && (
                                            <span style={{ marginLeft: '8px', opacity: 0.7 }}>
                                                ({organizer.first_name} {organizer.last_name})
                                            </span>
                                        )}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Venue */}
                    <Grid size={{ xs: 12 }}>
                        <Box display="flex" gap={1} alignItems="flex-end">
                            <FormControl fullWidth required disabled={loading}>
                                <InputLabel>Lieu</InputLabel>
                                <Select
                                    value={formData.venue_id}
                                    onChange={(e) => handleChange('venue_id', e.target.value)}
                                    label="Lieu"
                                >
                                    {venues.map((venue) => (
                                        <MenuItem key={venue.id} value={venue.id}>
                                            {venue.name} - {venue.city}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Button
                                variant="outlined"
                                startIcon={<Add />}
                                onClick={handleAddVenue}
                                disabled={loading}
                                sx={{ minWidth: 'fit-content', px: 2 }}
                            >
                                Ajouter lieu
                            </Button>
                        </Box>
                    </Grid>

                    {/* Image Upload */}
                    <Grid size={{ xs: 12 }}>
                        <Box>
                            <Typography variant="subtitle1" gutterBottom>
                                Image de l'événement
                            </Typography>
                            <Box display="flex" alignItems="center" gap={2} mb={2}>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                />
                                <Button
                                    variant="outlined"
                                    startIcon={<PhotoCamera />}
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={loading}
                                >
                                    Choisir image
                                </Button>
                                {imagePreview && (
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        startIcon={<Delete />}
                                        onClick={handleImageRemove}
                                        disabled={loading}
                                    >
                                        Supprimer
                                    </Button>
                                )}
                            </Box>
                            {imagePreview && (
                                <Card sx={{ maxWidth: 300, mb: 2 }}>
                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={imagePreview}
                                        alt="Aperçu de l'image"
                                        sx={{ objectFit: 'cover' }}
                                    />
                                </Card>
                            )}
                        </Box>
                    </Grid>

                    {/* Pricing Section */}
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                            Tarification
                        </Typography>
                    </Grid>

                    {/* Original Price */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Prix original"
                            value={formData.original_price}
                            onChange={(e) => handlePriceChange('original_price', e.target.value)}
                            disabled={loading}
                            InputProps={{
                                endAdornment: <InputAdornment position="end">€</InputAdornment>,
                            }}
                        />
                    </Grid>

                    {/* Discounted Price */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Prix réduit"
                            value={formData.discounted_price}
                            onChange={(e) => handlePriceChange('discounted_price', e.target.value)}
                            disabled={loading}
                            InputProps={{
                                endAdornment: <InputAdornment position="end">€</InputAdornment>,
                            }}
                        />
                    </Grid>

                    {/* Discount Percentage */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Réduction (%)"
                            value={formData.discount_percentage}
                            disabled={loading}
                            InputProps={{
                                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                readOnly: true,
                            }}
                            helperText="Calculé automatiquement"
                        />
                    </Grid>

                    {/* Max Participants */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Nombre maximum de participants"
                            value={formData.max_participants}
                            onChange={(e) => handleChange('max_participants', e.target.value)}
                            disabled={loading}
                            helperText="Laisser vide pour illimité"
                        />
                    </Grid>

                    {/* Admin Controls Section */}
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                            Contrôles administrateur
                        </Typography>
                    </Grid>

                    {/* Event Publication Status */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth disabled={loading}>
                            <InputLabel>Visibilité de l'événement</InputLabel>
                            <Select
                                value={formData.is_published ?? false}
                                onChange={(e) => handleChange('is_published', e.target.value)}
                                label="Visibilité de l'événement"
                            >
                                <MenuItem value={false}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Chip
                                            label="Non publié"
                                            color="default"
                                            size="small"
                                            sx={{ minWidth: 80 }}
                                        />
                                        <Typography>Masqué du public</Typography>
                                    </Box>
                                </MenuItem>
                                <MenuItem value={true}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Chip
                                            label="Publié"
                                            color="success"
                                            size="small"
                                            sx={{ minWidth: 80 }}
                                        />
                                        <Typography>Visible du public</Typography>
                                    </Box>
                                </MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Featured Event */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.is_featured}
                                    onChange={(e) => handleChange('is_featured', e.target.checked)}
                                    disabled={loading}
                                />
                            }
                            label="Événement mis en avant"
                        />
                        <Typography variant="body2" color="text.secondary">
                            L'événement apparaîtra en priorité sur la plateforme
                        </Typography>
                    </Grid>

                    {/* Last Minute Offer */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.is_last_minute}
                                    onChange={(e) => handleChange('is_last_minute', e.target.checked)}
                                    disabled={loading}
                                />
                            }
                            label="Offre de dernière minute"
                        />
                        <Typography variant="body2" color="text.secondary">
                            L'événement sera marqué comme offre de dernière minute
                        </Typography>
                    </Grid>

                    {/* Requirements */}
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Prérequis / Conditions"
                            value={formData.requirements}
                            onChange={(e) => handleChange('requirements', e.target.value)}
                            disabled={loading}
                            placeholder="Ex: Âge minimum, équipement nécessaire..."
                        />
                    </Grid>

                    {/* Cancellation Policy */}
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Politique d'annulation"
                            value={formData.cancellation_policy}
                            onChange={(e) => handleChange('cancellation_policy', e.target.value)}
                            disabled={loading}
                            placeholder="Conditions d'annulation et de remboursement..."
                        />
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions>
                <Button
                    onClick={handleClose}
                    startIcon={<Cancel />}
                    disabled={loading}
                >
                    Annuler
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                    disabled={loading}
                >
                    {loading ? "Sauvegarde..." : (isEdit ? "Mettre à jour" : "Créer")}
                </Button>
            </DialogActions>
        </Dialog>

        {/* Venue Creation Dialog */}
        <Dialog
            open={showAddVenueDialog}
            onClose={() => setShowAddVenueDialog(false)}
            maxWidth="md"
            fullWidth
            disablePortal
            sx={{ zIndex: 1400 }}
            PaperProps={{
                sx: { zIndex: 1400 }
            }}
        >
            <DialogTitle>Créer un nouveau lieu</DialogTitle>
            <DialogContent>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Nom du lieu"
                            value={newVenueData.name}
                            onChange={(e) => handleVenueDataChange("name", e.target.value)}
                            required
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Capacité"
                            type="number"
                            value={newVenueData.capacity}
                            onChange={(e) => handleVenueDataChange("capacity", e.target.value)}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            label="Adresse"
                            value={newVenueData.address_line_1}
                            onChange={(e) => handleVenueDataChange("address_line_1", e.target.value)}
                            required
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Ville"
                            value={newVenueData.locality}
                            onChange={(e) => handleVenueDataChange("locality", e.target.value)}
                            required
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Code postal"
                            value={newVenueData.postal_code}
                            onChange={(e) => handleVenueDataChange("postal_code", e.target.value)}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth required>
                            <InputLabel>Pays</InputLabel>
                            <Select
                                value={newVenueData.country_code}
                                onChange={(e) => handleVenueDataChange("country_code", e.target.value)}
                                label="Pays"
                            >
                                <MenuItem value="FR">France</MenuItem>
                                <MenuItem value="ES">Espagne</MenuItem>
                                <MenuItem value="IT">Italie</MenuItem>
                                <MenuItem value="DE">Allemagne</MenuItem>
                                <MenuItem value="GB">Royaume-Uni</MenuItem>
                                <MenuItem value="BE">Belgique</MenuItem>
                                <MenuItem value="CH">Suisse</MenuItem>
                                <MenuItem value="LU">Luxembourg</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Région/État"
                            value={newVenueData.administrative_area}
                            onChange={(e) => handleVenueDataChange("administrative_area", e.target.value)}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            label="Complément d'adresse"
                            value={newVenueData.address_line_2}
                            onChange={(e) => handleVenueDataChange("address_line_2", e.target.value)}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => setShowAddVenueDialog(false)}
                    disabled={venueDialogLoading}
                >
                    Annuler
                </Button>
                <Button
                    onClick={handleSaveNewVenue}
                    variant="contained"
                    disabled={venueDialogLoading}
                    startIcon={venueDialogLoading ? <CircularProgress size={20} /> : <Save />}
                >
                    {venueDialogLoading ? "Création..." : "Créer le lieu"}
                </Button>
            </DialogActions>
        </Dialog>
        </div>
    );
};

export default AdminEventForm;
