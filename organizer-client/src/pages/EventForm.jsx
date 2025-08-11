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
    Phone,
} from "@mui/icons-material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import organizerService from "../services/organizerService";
import EventMobilePreview from "../components/EventMobilePreview";
import VenueSelector from "../components/VenueSelector";

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
        is_published: false, // Add publication status to form data
        request_review: false, // Switch to request review on submit
    });

    // Event administrative data (read-only for organizers except publication status)
    const [eventAdminData, setEventAdminData] = useState({
        status: "",
        moderation_status: "",
        admin_notes: "",
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

    // Load initial data
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Load venues and categories
                const [venuesData, categoriesData] = await Promise.all([
                    organizerService.getVenues(),
                    organizerService.getCategories(),
                ]);

                // Ensure we have arrays to work with
                const venuesArray = venuesData.venues || venuesData || [];
                const categoriesArray = categoriesData.categories || categoriesData || [];

                setVenues(venuesArray);
                setCategories(categoriesArray);

                // Load event data if editing
                if (isEdit) {
                    const eventData = await organizerService.getEvent(eventId);

                    // Validate that venue_id and category_id exist in available options
                    const validVenueId =
                        eventData.venue_id && venuesArray.some((v) => v.id === eventData.venue_id)
                            ? eventData.venue_id
                            : "";
                    const validCategoryId =
                        eventData.category_id && categoriesArray.some((c) => c.id === eventData.category_id)
                            ? eventData.category_id
                            : "";

                    // Log warnings if IDs were invalid
                    if (eventData.venue_id && !validVenueId) {
                        console.warn(`Event venue_id ${eventData.venue_id} not found in available venues`);
                        setError(
                            "Le lieu associé à cet événement n'est plus disponible. Veuillez sélectionner un nouveau lieu."
                        );
                    }
                    if (eventData.category_id && !validCategoryId) {
                        console.warn(`Event category_id ${eventData.category_id} not found in available categories`);
                        setError(
                            "La catégorie associée à cet événement n'est plus disponible. Veuillez sélectionner une nouvelle catégorie."
                        );
                    }

                    setFormData({
                        title: eventData.title || "",
                        description: eventData.description || "",
                        event_date: eventData.event_date ? new Date(eventData.event_date) : null,
                        venue_id: validVenueId,
                        category_id: validCategoryId,
                        price: eventData.original_price || eventData.price || "",
                        max_participants: eventData.total_tickets || eventData.max_participants || "",
                        tags: eventData.tags || [],
                        is_featured: eventData.is_featured || false,
                        requirements: eventData.requirements || "",
                        cancellation_policy: eventData.cancellation_policy || "",
                        image: null, // Will be handled separately for existing events
                        is_published: eventData.is_published || false,
                    });

                    // Set administrative data
                    setEventAdminData({
                        status: eventData.status || "",
                        moderation_status: eventData.moderation_status || "",
                        admin_notes: eventData.admin_notes || "",
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
        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
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

            // Remove fields that shouldn't be sent to the backend
            delete eventData.image;
            delete eventData.request_review;

            let createdEvent;
            if (isEdit) {
                await organizerService.updateEvent(eventId, eventData);

                // If request_review is enabled, submit for review after update
                if (
                    formData.request_review &&
                    eventAdminData.moderation_status !== "approved" &&
                    eventAdminData.moderation_status !== "under_review"
                ) {
                    await organizerService.submitEventForReview(eventId);
                    setEventAdminData((prev) => ({
                        ...prev,
                        moderation_status: "under_review",
                    }));
                    setSuccess("Événement mis à jour et soumis pour révision avec succès !");
                } else {
                    setSuccess("Événement mis à jour avec succès !");
                }

                // Upload image if present
                if (formData.image) {
                    console.log("Uploading image for event:", eventId);
                    try {
                        await organizerService.uploadEventImage(eventId, formData.image);
                        console.log("Image uploaded successfully");
                    } catch (imageError) {
                        console.error("Image upload failed:", imageError);
                        throw new Error(
                            `Événement sauvegardé mais erreur lors de l'upload de l'image: ${imageError.message}`
                        );
                    }
                }
            } else {
                createdEvent = await organizerService.createEvent(eventData);
                console.log("Event created:", createdEvent);

                // If request_review is enabled, submit for review after creation
                if (formData.request_review && createdEvent?.id) {
                    await organizerService.submitEventForReview(createdEvent.id);
                    setSuccess("Événement créé et soumis pour révision avec succès !");
                } else {
                    setSuccess("Événement créé avec succès !");
                }

                // Upload image if present
                if (formData.image && createdEvent?.id) {
                    console.log("Uploading image for new event:", createdEvent.id);
                    try {
                        await organizerService.uploadEventImage(createdEvent.id, formData.image);
                        console.log("Image uploaded successfully");
                    } catch (imageError) {
                        console.error("Image upload failed:", imageError);
                        throw new Error(
                            `Événement créé mais erreur lors de l'upload de l'image: ${imageError.message}`
                        );
                    }
                } else if (formData.image) {
                    console.error("No event ID returned from createEvent");
                    throw new Error("Événement créé mais impossible d'uploader l'image (ID manquant)");
                }
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

    // Handle venue updates from VenueSelector
    const handleVenuesUpdate = (newVenues) => {
        setVenues(newVenues);
    };

    const handleVenueChange = (venueId) => {
        handleChange("venue_id", venueId);
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">
                    {isEdit ? "Modifier l'événement" : "Créer un événement"}
                </Typography>
                <Chip
                    icon={<Phone />}
                    label="Aperçu mobile"
                    color="primary"
                    variant="outlined"
                    sx={{ ml: "auto" }}
                />
            </Box>

            <Grid container spacing={3}>
                {/* Form Column */}
                <Grid size={{ xs: 12, lg: 8 }}>
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
                            {/* Administrative Parameters */}
                            <Grid size={{ xs: 12 }}>
                                <Card
                                    variant="outlined"
                                    sx={{
                                        p: 3,
                                        mb: 3,
                                        backgroundColor: "grey.50",
                                        border: "1px solid",
                                        borderColor: "grey.300",
                                    }}>
                                    <Grid container spacing={3} alignItems="center">
                                        {/* Publication Status */}
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={formData.is_published}
                                                        onChange={(e) => handleChange("is_published", e.target.checked)}
                                                        disabled={
                                                            eventAdminData.moderation_status !== "approved" && isEdit
                                                        }
                                                    />
                                                }
                                                label={
                                                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                                                        <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                                                            Publication
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {formData.is_published
                                                                ? "Événement publié"
                                                                : "Événement non publié"}
                                                        </Typography>
                                                    </Box>
                                                }
                                                sx={{ margin: 0 }}
                                            />
                                            {eventAdminData.moderation_status !== "approved" && isEdit && (
                                                <Typography
                                                    variant="caption"
                                                    color="warning.main"
                                                    sx={{ display: "block", mt: 1 }}>
                                                    Publication disponible après approbation
                                                </Typography>
                                            )}
                                        </Grid>

                                        {/* Featured Status */}
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={formData.is_featured}
                                                        onChange={(e) => handleChange("is_featured", e.target.checked)}
                                                    />
                                                }
                                                label={
                                                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                                                        <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                                                            En vedette
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {formData.is_featured
                                                                ? "Événement mis en avant"
                                                                : "Événement standard"}
                                                        </Typography>
                                                    </Box>
                                                }
                                                sx={{ margin: 0 }}
                                            />
                                        </Grid>

                                        {/* Approval Status and Admin Comments (combined block when editing) */}
                                        {isEdit && (
                                            <Grid size={{ xs: 12, md: 8 }}>
                                                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                                    {/* Approval Status */}
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{ fontWeight: "medium", minWidth: "140px" }}>
                                                            Statut d'approbation:
                                                        </Typography>
                                                        <Chip
                                                            label={
                                                                eventAdminData.moderation_status === "approved"
                                                                    ? "Approuvé"
                                                                    : eventAdminData.moderation_status === "rejected"
                                                                    ? "Rejeté"
                                                                    : eventAdminData.moderation_status ===
                                                                      "under_review"
                                                                    ? "En révision"
                                                                    : eventAdminData.moderation_status ===
                                                                      "revision_requested"
                                                                    ? "Révision demandée"
                                                                    : eventAdminData.moderation_status === "flagged"
                                                                    ? "Signalé"
                                                                    : "En attente"
                                                            }
                                                            color={
                                                                eventAdminData.moderation_status === "approved"
                                                                    ? "success"
                                                                    : eventAdminData.moderation_status === "rejected" ||
                                                                      eventAdminData.moderation_status === "flagged"
                                                                    ? "error"
                                                                    : eventAdminData.moderation_status ===
                                                                      "revision_requested"
                                                                    ? "warning"
                                                                    : "default"
                                                            }
                                                            size="small"
                                                        />
                                                    </Box>

                                                    {/* Admin Comments */}
                                                    <Box>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{ fontWeight: "medium", mb: 1 }}>
                                                            Commentaires de l'administrateur:
                                                        </Typography>
                                                        {eventAdminData.admin_notes ? (
                                                            <Alert
                                                                severity={
                                                                    eventAdminData.moderation_status === "rejected" ||
                                                                    eventAdminData.moderation_status === "flagged"
                                                                        ? "error"
                                                                        : eventAdminData.moderation_status ===
                                                                          "revision_requested"
                                                                        ? "warning"
                                                                        : "info"
                                                                }
                                                                sx={{ mt: 1 }}>
                                                                <Typography variant="body2">
                                                                    {eventAdminData.admin_notes}
                                                                </Typography>
                                                            </Alert>
                                                        ) : (
                                                            <Typography
                                                                variant="body2"
                                                                color="text.secondary"
                                                                sx={{ fontStyle: "italic" }}>
                                                                Aucun commentaire de l'administrateur
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Grid>
                                        )}

                                        {/* Request Review Switch - only for non-approved events when editing */}
                                        {isEdit &&
                                            eventAdminData.moderation_status !== "approved" &&
                                            eventAdminData.moderation_status !== "under_review" && (
                                                <Grid size={{ xs: 12, md: 4 }}>
                                                    <FormControlLabel
                                                        control={
                                                            <Switch
                                                                checked={formData.request_review}
                                                                onChange={(e) =>
                                                                    handleChange("request_review", e.target.checked)
                                                                }
                                                            />
                                                        }
                                                        label={
                                                            <Box sx={{ display: "flex", flexDirection: "column" }}>
                                                                <Typography
                                                                    variant="body2"
                                                                    sx={{ fontWeight: "medium" }}>
                                                                    Soumettre pour révision
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {formData.request_review
                                                                        ? "Sera soumis à la révision"
                                                                        : "Rester en brouillon"}
                                                                </Typography>
                                                            </Box>
                                                        }
                                                        sx={{ margin: 0 }}
                                                    />
                                                    {formData.request_review && (
                                                        <Alert severity="info" sx={{ mt: 1, p: 1 }}>
                                                            <Typography variant="caption">
                                                                Votre événement sera examiné bientôt
                                                            </Typography>
                                                        </Alert>
                                                    )}
                                                </Grid>
                                            )}

                                        {/* Request Review Switch - for new events (non-edit mode) */}
                                        {!isEdit && (
                                            <Grid size={{ xs: 12, md: 4 }}>
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={formData.request_review}
                                                            onChange={(e) =>
                                                                handleChange("request_review", e.target.checked)
                                                            }
                                                        />
                                                    }
                                                    label={
                                                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                                                            <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                                                                Soumettre pour révision
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {formData.request_review
                                                                    ? "Sera soumis à la révision"
                                                                    : "Rester en brouillon"}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                    sx={{ margin: 0 }}
                                                />
                                                {formData.request_review && (
                                                    <Alert severity="info" sx={{ mt: 1, p: 1 }}>
                                                        <Typography variant="caption">
                                                            Votre événement sera examiné bientôt
                                                        </Typography>
                                                    </Alert>
                                                )}
                                            </Grid>
                                        )}
                                    </Grid>
                                </Card>
                            </Grid>
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
                            <VenueSelector
                                venues={venues}
                                selectedVenueId={formData.venue_id}
                                onVenueChange={handleVenueChange}
                                error={errors.venue_id}
                                onVenuesUpdate={handleVenuesUpdate}
                                onError={setError}
                                onSuccess={setSuccess}
                            />

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
        </Grid>

        {/* Mobile Preview Column */}
        <Grid size={{ xs: 12, lg: 4 }}>
            <Box sx={{ position: "sticky", top: 20 }}>
                <EventMobilePreview
                    formData={formData}
                    venues={venues}
                    categories={categories}
                    imagePreview={imagePreview}
                />
            </Box>
        </Grid>
    </Grid>
</Box>
    );
};

export default EventForm;
