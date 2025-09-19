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
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [showAddVenueDialog, setShowAddVenueDialog] = useState(false);
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
        status: "active", // active, inactive, cancelled, pending
    });

    const isEdit = Boolean(event);

    // Load venues and categories on mount
    useEffect(() => {
        const loadFormData = async () => {
            try {
                setLoading(true);
                const [venuesData, categoriesData] = await Promise.all([
                    AdminService.getVenues(),
                    AdminService.getCategories()
                ]);
                
                setVenues(venuesData || []);
                setCategories(categoriesData || []);
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

    // Load event data when editing - but only after categories are loaded
    useEffect(() => {
        if (event && open && categories.length > 0) {
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
            });
            setImagePreview("");
            setImageFile(null);
        }
        setError("");
    }, [event, open, categories]);

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
        // TODO: Implement venue creation dialog
        alert("Fonctionnalité d'ajout de lieu à venir. Contactez l'administrateur pour ajouter un nouveau lieu.");
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
        <Dialog 
            open={open} 
            onClose={handleClose} 
            maxWidth="md" 
            fullWidth
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
                                value={formData.is_published}
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
    );
};

export default AdminEventForm;
