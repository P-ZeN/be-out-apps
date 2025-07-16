import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    Chip,
    OutlinedInput,
    Alert,
    Divider,
    Switch,
    FormControlLabel,
    InputAdornment,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import {
    Event,
    LocationOn,
    Category,
    Euro,
    People,
    AccessTime,
    CloudUpload,
    Save,
    Cancel,
    Add,
    Delete,
    Image,
} from "@mui/icons-material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import organizerService from "../services/organizerService";

const EventForm = () => {
    const { id: eventId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const isEdit = Boolean(eventId);

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        event_date: null,
        venue_id: "",
        category_id: "",
        price: "",
        max_participants: "",
        tags: [],
        is_featured: false,
        requirements: "",
        cancellation_policy: "",
        image: null,
    });

    // UI state
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEdit);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [venues, setVenues] = useState([]);
    const [categories, setCategories] = useState([]);
    const [tagInput, setTagInput] = useState("");
    const [imagePreview, setImagePreview] = useState("");
    const [imageError, setImageError] = useState("");

    // Validation state
    const [errors, setErrors] = useState({});

    // New venue dialog state
    const [openVenueDialog, setOpenVenueDialog] = useState(false);
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

    // Countries list for venue creation
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

    // Load initial data
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Load venues and categories
                const [venuesData, categoriesData] = await Promise.all([
                    organizerService.getVenues(),
                    organizerService.getCategories(),
                ]);
                setVenues(venuesData.venues || venuesData);
                setCategories(categoriesData.categories || categoriesData);

                // Load event data if editing
                if (isEdit) {
                    const eventData = await organizerService.getEvent(eventId);
                    setFormData({
                        title: eventData.title || "",
                        description: eventData.description || "",
                        event_date: eventData.event_date ? new Date(eventData.event_date) : null,
                        venue_id: eventData.venue_id || "",
                        category_id: eventData.category_id || "",
                        price: eventData.original_price || eventData.price || "",
                        max_participants: eventData.total_tickets || eventData.max_participants || "",
                        tags: eventData.tags || [],
                        is_featured: eventData.is_featured || false,
                        requirements: eventData.requirements || "",
                        cancellation_policy: eventData.cancellation_policy || "",
                        image: null, // Will be handled separately for existing events
                    });

                    // Set image preview if event has an image
                    if (eventData.image_url) {
                        setImagePreview(eventData.image_url);
                    }
                }
            } catch (error) {
                setError(error.message || "Erreur lors du chargement des données");
            } finally {
                setInitialLoading(false);
            }
        };

        loadInitialData();
    }, [eventId, isEdit]);

    // Form validation
    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = "Le titre est requis";
        }

        if (!formData.description.trim()) {
            newErrors.description = "La description est requise";
        }

        if (!formData.event_date) {
            newErrors.event_date = "La date de l'événement est requise";
        }

        if (!formData.venue_id) {
            newErrors.venue_id = "Le lieu est requis";
        }

        if (!formData.category_id) {
            newErrors.category_id = "La catégorie est requise";
        }

        if (!formData.price || isNaN(formData.price) || Number(formData.price) < 0) {
            newErrors.price = "Le prix doit être un nombre positif";
        }

        if (!formData.max_participants || isNaN(formData.max_participants) || Number(formData.max_participants) <= 0) {
            newErrors.max_participants = "Le nombre maximum de participants doit être supérieur à 0";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form changes
    const handleChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));

        // Clear specific error when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({
                ...prev,
                [field]: "",
            }));
        }
    };

    // Handle tag management
    const handleAddTag = () => {
        const tag = tagInput.trim();
        if (tag && !formData.tags.includes(tag)) {
            handleChange("tags", [...formData.tags, tag]);
            setTagInput("");
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        handleChange(
            "tags",
            formData.tags.filter((tag) => tag !== tagToRemove)
        );
    };

    const handleTagKeyPress = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddTag();
        }
    };

    // Handle image upload
    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        setImageError("");

        if (!file) {
            return;
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setImageError("Seuls les fichiers JPEG, PNG et WebP sont acceptés");
            return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            setImageError("La taille du fichier ne doit pas dépasser 5MB");
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);

        // Store file in form data
        handleChange("image", file);
    };

    const handleRemoveImage = () => {
        handleChange("image", null);
        setImagePreview("");
        setImageError("");
        // Reset file input
        const fileInput = document.getElementById("image-upload");
        if (fileInput) {
            fileInput.value = "";
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const eventData = {
                ...formData,
                price: Number(formData.price),
                max_participants: Number(formData.max_participants),
                event_date: formData.event_date.toISOString(),
            };

            // Remove image from eventData as it will be handled separately
            delete eventData.image;

            let createdEvent;
            if (isEdit) {
                await organizerService.updateEvent(eventId, eventData);
                
                // Upload image if present
                if (formData.image) {
                    console.log("Uploading image for event:", eventId);
                    try {
                        await organizerService.uploadEventImage(eventId, formData.image);
                        console.log("Image uploaded successfully");
                    } catch (imageError) {
                        console.error("Image upload failed:", imageError);
                        throw new Error(`Événement sauvegardé mais erreur lors de l'upload de l'image: ${imageError.message}`);
                    }
                }
                
                setSuccess("Événement mis à jour avec succès !");
            } else {
                createdEvent = await organizerService.createEvent(eventData);
                console.log("Event created:", createdEvent);
                
                // Upload image if present
                if (formData.image && createdEvent?.id) {
                    console.log("Uploading image for new event:", createdEvent.id);
                    try {
                        await organizerService.uploadEventImage(createdEvent.id, formData.image);
                        console.log("Image uploaded successfully");
                    } catch (imageError) {
                        console.error("Image upload failed:", imageError);
                        throw new Error(`Événement créé mais erreur lors de l'upload de l'image: ${imageError.message}`);
                    }
                } else if (formData.image) {
                    console.error("No event ID returned from createEvent");
                    throw new Error("Événement créé mais impossible d'uploader l'image (ID manquant)");
                }
                
                setSuccess("Événement créé avec succès !");
            }

            setTimeout(() => {
                navigate("/events");
            }, 2000);
        } catch (error) {
            setError(error.message || "Erreur lors de la sauvegarde");
        } finally {
            setLoading(false);
        }
    }; 

    // Handle venue creation
    const handleCreateVenue = () => {
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
        setOpenVenueDialog(true);
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
        setError("");

        try {
            const venueData = {
                ...newVenueData,
                capacity: newVenueData.capacity ? Number(newVenueData.capacity) : null,
                latitude: newVenueData.latitude ? Number(newVenueData.latitude) : null,
                longitude: newVenueData.longitude ? Number(newVenueData.longitude) : null,
            };

            const newVenue = await organizerService.createVenue(venueData);

            // Reload venues
            const venuesData = await organizerService.getVenues();
            setVenues(venuesData);

            // Select the new venue
            handleChange("venue_id", newVenue.id);

            setOpenVenueDialog(false);
            setSuccess("Nouveau lieu créé et sélectionné !");
        } catch (error) {
            setError(error.message || "Erreur lors de la création du lieu");
        } finally {
            setVenueDialogLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                {isEdit ? "Modifier l'événement" : "Créer un événement"}
            </Typography>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardContent sx={{ p: 4 }}>
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

                        <Grid container spacing={3}>
                            {/* Basic Information */}
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
                                    <Event sx={{ mr: 1 }} />
                                    Informations générales
                                </Typography>
                                <Divider sx={{ mb: 3 }} />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="Titre de l'événement"
                                    value={formData.title}
                                    onChange={(e) => handleChange("title", e.target.value)}
                                    error={!!errors.title}
                                    helperText={errors.title}
                                    required
                                />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="Description"
                                    value={formData.description}
                                    onChange={(e) => handleChange("description", e.target.value)}
                                    error={!!errors.description}
                                    helperText={errors.description}
                                    multiline
                                    rows={4}
                                    required
                                />
                            </Grid>

                            {/* Image Upload */}
                            <Grid size={{ xs: 12 }}>
                                <Typography
                                    variant="h6"
                                    gutterBottom
                                    sx={{ display: "flex", alignItems: "center", mt: 2 }}>
                                    <Image sx={{ mr: 1 }} />
                                    Image de l'événement
                                </Typography>
                                <Divider sx={{ mb: 3 }} />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                {!formData.image && !imagePreview ? (
                                    <Box
                                        sx={{
                                            border: "2px dashed #ccc",
                                            borderRadius: 2,
                                            p: 4,
                                            textAlign: "center",
                                            cursor: "pointer",
                                            transition: "border-color 0.3s",
                                            "&:hover": {
                                                borderColor: "primary.main",
                                            },
                                        }}
                                        onClick={() => document.getElementById("image-upload").click()}>
                                        <CloudUpload sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                                        <Typography variant="h6" gutterBottom>
                                            Cliquez pour sélectionner une image
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Formats acceptés: JPEG, PNG, WebP • Taille max: 5MB
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Box sx={{ position: "relative", display: "inline-block" }}>
                                        <img
                                            src={imagePreview}
                                            alt="Aperçu de l'image"
                                            style={{
                                                maxWidth: "300px",
                                                maxHeight: "200px",
                                                width: "100%",
                                                height: "auto",
                                                borderRadius: "8px",
                                                objectFit: "cover",
                                            }}
                                        />
                                        <Button
                                            variant="contained"
                                            color="error"
                                            size="small"
                                            startIcon={<Delete />}
                                            onClick={handleRemoveImage}
                                            sx={{
                                                position: "absolute",
                                                top: 8,
                                                right: 8,
                                            }}>
                                            Supprimer
                                        </Button>
                                    </Box>
                                )}
                                
                                <input
                                    id="image-upload"
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                    onChange={handleImageUpload}
                                    style={{ display: "none" }}
                                />
                                
                                {imageError && (
                                    <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                                        {imageError}
                                    </Typography>
                                )}
                                
                                {!formData.image && !imagePreview && (
                                    <Button
                                        variant="outlined"
                                        startIcon={<CloudUpload />}
                                        onClick={() => document.getElementById("image-upload").click()}
                                        sx={{ mt: 2 }}>
                                        Sélectionner une image
                                    </Button>
                                )}
                            </Grid>

                            {/* Date and Time */}
                            <Grid size={{ xs: 12 }}>
                                <Typography
                                    variant="h6"
                                    gutterBottom
                                    sx={{ display: "flex", alignItems: "center", mt: 2 }}>
                                    <AccessTime sx={{ mr: 1 }} />
                                    Date et heure
                                </Typography>
                                <Divider sx={{ mb: 3 }} />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <DateTimePicker
                                    label="Date et heure de l'événement"
                                    value={formData.event_date}
                                    onChange={(value) => handleChange("event_date", value)}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            error: !!errors.event_date,
                                            helperText: errors.event_date,
                                            required: true,
                                        },
                                    }}
                                />
                            </Grid>

                            {/* Location and Category */}
                            <Grid size={{ xs: 12 }}>
                                <Typography
                                    variant="h6"
                                    gutterBottom
                                    sx={{ display: "flex", alignItems: "center", mt: 2 }}>
                                    <LocationOn sx={{ mr: 1 }} />
                                    Lieu et catégorie
                                </Typography>
                                <Divider sx={{ mb: 3 }} />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormControl fullWidth error={!!errors.venue_id} required>
                                    <InputLabel>Lieu</InputLabel>
                                    <Select
                                        value={formData.venue_id}
                                        onChange={(e) => handleChange("venue_id", e.target.value)}
                                        label="Lieu">
                                        {venues.map((venue) => (
                                            <MenuItem key={venue.id} value={venue.id}>
                                                {venue.name} - {venue.formatted_address || `${venue.locality || ""}`}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.venue_id && <FormHelperText>{errors.venue_id}</FormHelperText>}
                                </FormControl>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<Add />}
                                    onClick={handleCreateVenue}
                                    sx={{ mt: 1 }}>
                                    Créer un nouveau lieu
                                </Button>
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormControl fullWidth error={!!errors.category_id} required>
                                    <InputLabel>Catégorie</InputLabel>
                                    <Select
                                        value={formData.category_id}
                                        onChange={(e) => handleChange("category_id", e.target.value)}
                                        label="Catégorie">
                                        {categories.map((category) => (
                                            <MenuItem key={category.id} value={category.id}>
                                                {category.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.category_id && <FormHelperText>{errors.category_id}</FormHelperText>}
                                </FormControl>
                            </Grid>

                            {/* Pricing and Capacity */}
                            <Grid size={{ xs: 12 }}>
                                <Typography
                                    variant="h6"
                                    gutterBottom
                                    sx={{ display: "flex", alignItems: "center", mt: 2 }}>
                                    <Euro sx={{ mr: 1 }} />
                                    Tarification et capacité
                                </Typography>
                                <Divider sx={{ mb: 3 }} />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Prix"
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => handleChange("price", e.target.value)}
                                    error={!!errors.price}
                                    helperText={errors.price}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">€</InputAdornment>,
                                    }}
                                    required
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Nombre maximum de participants"
                                    type="number"
                                    value={formData.max_participants}
                                    onChange={(e) => handleChange("max_participants", e.target.value)}
                                    error={!!errors.max_participants}
                                    helperText={errors.max_participants}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <People />
                                            </InputAdornment>
                                        ),
                                    }}
                                    required
                                />
                            </Grid>

                            {/* Tags */}
                            <Grid size={{ xs: 12 }}>
                                <Typography
                                    variant="h6"
                                    gutterBottom
                                    sx={{ display: "flex", alignItems: "center", mt: 2 }}>
                                    <Category sx={{ mr: 1 }} />
                                    Tags et mots-clés
                                </Typography>
                                <Divider sx={{ mb: 3 }} />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="Ajouter des tags"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyPress={handleTagKeyPress}
                                    helperText="Appuyez sur Entrée pour ajouter un tag"
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <Button onClick={handleAddTag} size="small">
                                                    Ajouter
                                                </Button>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <Box sx={{ mt: 2 }}>
                                    {formData.tags.map((tag, index) => (
                                        <Chip
                                            key={index}
                                            label={tag}
                                            onDelete={() => handleRemoveTag(tag)}
                                            sx={{ mr: 1, mb: 1 }}
                                        />
                                    ))}
                                </Box>
                            </Grid>

                            {/* Additional Information */}
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                    Informations complémentaires
                                </Typography>
                                <Divider sx={{ mb: 3 }} />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Prérequis"
                                    value={formData.requirements}
                                    onChange={(e) => handleChange("requirements", e.target.value)}
                                    multiline
                                    rows={3}
                                    helperText="Matériel nécessaire, niveau requis, etc."
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Politique d'annulation"
                                    value={formData.cancellation_policy}
                                    onChange={(e) => handleChange("cancellation_policy", e.target.value)}
                                    multiline
                                    rows={3}
                                    helperText="Conditions de remboursement"
                                />
                            </Grid>

                            {/* Settings */}
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                    Paramètres
                                </Typography>
                                <Divider sx={{ mb: 3 }} />
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.is_featured}
                                            onChange={(e) => handleChange("is_featured", e.target.checked)}
                                        />
                                    }
                                    label="Événement en vedette"
                                />
                            </Grid>
                        </Grid>

                        {/* Actions */}
                        <Box sx={{ mt: 4, display: "flex", gap: 2, justifyContent: "flex-end" }}>
                            <Button
                                variant="outlined"
                                onClick={() => navigate("/events")}
                                startIcon={<Cancel />}
                                disabled={loading}>
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                                disabled={loading}>
                                {loading ? "Sauvegarde..." : isEdit ? "Mettre à jour" : "Créer l'événement"}
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            </form>

            {/* New Venue Dialog */}
            <Dialog open={openVenueDialog} onClose={() => setOpenVenueDialog(false)} maxWidth="md" fullWidth>
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
                                    label="Pays">
                                    {countries.map((country) => (
                                        <MenuItem key={country.code} value={country.code}>
                                            {country.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenVenueDialog(false)} disabled={venueDialogLoading}>
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSaveNewVenue}
                        variant="contained"
                        disabled={venueDialogLoading}
                        startIcon={venueDialogLoading ? <CircularProgress size={20} /> : <Save />}>
                        {venueDialogLoading ? "Création..." : "Créer le lieu"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EventForm;
