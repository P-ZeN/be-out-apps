import React, { useState, useEffect } from "react";
import {
    Box,
    Paper,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Tab,
    Tabs,
    Alert,
    Chip,
} from "@mui/material";
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Language as LanguageIcon,
    Search as SearchIcon,
} from "@mui/icons-material";
import AuthService from "../services/authService";
import IconRenderer from "../components/IconRenderer";
import IconSelector from "../components/IconSelector";

// API Base URL - should match your backend
const API_BASE_URL = "http://localhost:3000";

// Service functions for API calls with authentication
const categoryService = {
    getAllCategories: async () => {
        const token = AuthService.getToken();
        const response = await fetch(`${API_BASE_URL}/api/admin/categories`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });
        if (!response.ok) throw new Error("Failed to fetch categories");
        return response.json();
    },

    createCategory: async (categoryData) => {
        const token = AuthService.getToken();
        const response = await fetch(`${API_BASE_URL}/api/admin/categories`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(categoryData),
        });
        if (!response.ok) throw new Error("Failed to create category");
        return response.json();
    },

    updateCategory: async (id, categoryData) => {
        const token = AuthService.getToken();
        const response = await fetch(`${API_BASE_URL}/api/admin/categories/${id}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(categoryData),
        });
        if (!response.ok) throw new Error("Failed to update category");
        return response.json();
    },

    deleteCategory: async (id) => {
        const token = AuthService.getToken();
        const response = await fetch(`${API_BASE_URL}/api/admin/categories/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });
        if (!response.ok) throw new Error("Failed to delete category");
        return response.json();
    },
};

const CategoryTranslationForm = ({ category, open, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name_fr: "",
        name_en: "",
        name_es: "",
        description_fr: "",
        description_en: "",
        description_es: "",
        icon: "",
        color: "#1976d2",
    });
    const [currentTab, setCurrentTab] = useState(0);
    const [errors, setErrors] = useState({});
    const [iconSelectorOpen, setIconSelectorOpen] = useState(false);

    useEffect(() => {
        if (category) {
            setFormData({
                name_fr: category.name_fr || "",
                name_en: category.name_en || "",
                name_es: category.name_es || "",
                description_fr: category.description_fr || "",
                description_en: category.description_en || "",
                description_es: category.description_es || "",
                icon: category.icon || "",
                color: category.color || "#1976d2",
            });
        } else {
            setFormData({
                name_fr: "",
                name_en: "",
                name_es: "",
                description_fr: "",
                description_en: "",
                description_es: "",
                icon: "",
                color: "#1976d2",
            });
        }
        setErrors({});
    }, [category, open]);

    const validateForm = () => {
        const newErrors = {};

        // At least one name translation is required
        if (!formData.name_fr && !formData.name_en && !formData.name_es) {
            newErrors.general = "Au moins une traduction du nom est requise";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            setErrors({ general: error.message });
        }
    };

    const languages = [
        { code: "fr", label: "Français", flag: "🇫🇷" },
        { code: "en", label: "English", flag: "🇬🇧" },
        { code: "es", label: "Español", flag: "🇪🇸" },
    ];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{category ? "Modifier la catégorie" : "Nouvelle catégorie"}</DialogTitle>
            <DialogContent>
                {errors.general && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {errors.general}
                    </Alert>
                )}

                {/* Language Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
                    <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
                        {languages.map((lang, index) => (
                            <Tab
                                key={lang.code}
                                label={
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <span>{lang.flag}</span>
                                        <span>{lang.label}</span>
                                        {formData[`name_${lang.code}`] && (
                                            <Chip size="small" label="✓" color="success" />
                                        )}
                                    </Box>
                                }
                            />
                        ))}
                    </Tabs>
                </Box>

                {/* Translation Forms */}
                {languages.map((lang, index) => (
                    <Box key={lang.code} hidden={currentTab !== index}>
                        <Typography variant="h6" gutterBottom>
                            Traductions en {lang.label}
                        </Typography>

                        <TextField
                            fullWidth
                            label={`Nom (${lang.label})`}
                            value={formData[`name_${lang.code}`]}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    [`name_${lang.code}`]: e.target.value,
                                })
                            }
                            margin="normal"
                            required={lang.code === "fr"} // French is required
                        />

                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label={`Description (${lang.label})`}
                            value={formData[`description_${lang.code}`]}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    [`description_${lang.code}`]: e.target.value,
                                })
                            }
                            margin="normal"
                        />
                    </Box>
                ))}

                {/* Common Fields */}
                <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Propriétés visuelles
                    </Typography>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                        <TextField
                            fullWidth
                            label="Icône (nom Material-UI ou emoji)"
                            value={formData.icon}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    icon: e.target.value,
                                })
                            }
                            margin="normal"
                            placeholder="music_note ou 🎵"
                        />
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 80 }}>
                            <IconRenderer iconName={formData.icon} sx={{ fontSize: "1.5rem" }} />
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<SearchIcon />}
                                onClick={() => setIconSelectorOpen(true)}
                                sx={{ minWidth: "auto", px: 1 }}>
                                Choisir
                            </Button>
                        </Box>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}>
                        <TextField
                            label="Couleur"
                            type="color"
                            value={formData.color}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    color: e.target.value,
                                })
                            }
                            sx={{ width: 100 }}
                        />
                        <Box
                            sx={{
                                width: 30,
                                height: 30,
                                backgroundColor: formData.color,
                                border: "1px solid #ccc",
                                borderRadius: 1,
                            }}
                        />
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Annuler</Button>
                <Button onClick={handleSubmit} variant="contained">
                    {category ? "Modifier" : "Créer"}
                </Button>
            </DialogActions>

            <IconSelector
                open={iconSelectorOpen}
                value={formData.icon}
                onChange={(iconName) => setFormData({ ...formData, icon: iconName })}
                onClose={() => setIconSelectorOpen(false)}
            />
        </Dialog>
    );
};

const AdminCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [alert, setAlert] = useState(null);

    const fetchCategories = async () => {
        try {
            const data = await categoryService.getAllCategories();
            setCategories(data);
            setAlert(null); // Clear any previous errors
        } catch (error) {
            console.error("Error fetching categories:", error);
            let errorMessage = "Erreur lors du chargement des catégories";

            // Provide more specific error messages
            if (error.message.includes("401") || error.message.includes("Unauthorized")) {
                errorMessage = "Erreur d'authentification. Veuillez vous reconnecter.";
            } else if (error.message.includes("403") || error.message.includes("Forbidden")) {
                errorMessage = "Accès refusé. Droits administrateur requis.";
            } else if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
                errorMessage = "Erreur de connexion au serveur. Vérifiez que le serveur est démarré.";
            }

            setAlert({ type: "error", message: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleCreate = () => {
        setEditingCategory(null);
        setDialogOpen(true);
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setDialogOpen(true);
    };

    const handleSave = async (formData) => {
        try {
            if (editingCategory) {
                await categoryService.updateCategory(editingCategory.id, formData);
                setAlert({ type: "success", message: "Catégorie modifiée avec succès" });
            } else {
                await categoryService.createCategory(formData);
                setAlert({ type: "success", message: "Catégorie créée avec succès" });
            }
            fetchCategories();
        } catch (error) {
            throw new Error(error.message);
        }
    };

    const handleDelete = async (category) => {
        if (
            window.confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${category.name_fr || category.name}" ?`)
        ) {
            try {
                await categoryService.deleteCategory(category.id);
                setAlert({ type: "success", message: "Catégorie supprimée avec succès" });
                fetchCategories();
            } catch (error) {
                setAlert({ type: "error", message: "Erreur lors de la suppression" });
            }
        }
    };

    if (loading) {
        return <Typography>Chargement...</Typography>;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h6" component="h2">
                    Gestion des catégories d'événements
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
                    Nouvelle catégorie
                </Button>
            </Box>

            {alert && (
                <Alert severity={alert.type} onClose={() => setAlert(null)} sx={{ mb: 2 }}>
                    {alert.message}
                </Alert>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nom (FR)</TableCell>
                            <TableCell>Nom (EN)</TableCell>
                            <TableCell>Nom (ES)</TableCell>
                            <TableCell>Événements</TableCell>
                            <TableCell>Couleur</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {categories.map((category) => (
                            <TableRow key={category.id}>
                                <TableCell>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <IconRenderer iconName={category.icon} sx={{ fontSize: "1.2rem" }} />
                                        <strong>{category.name_fr || category.name}</strong>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    {category.name_en || (
                                        <Typography variant="body2" color="text.secondary">
                                            Non traduit
                                        </Typography>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {category.name_es || (
                                        <Typography variant="body2" color="text.secondary">
                                            Non traduit
                                        </Typography>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={`${category.event_count || 0} événements`}
                                        size="small"
                                        color={category.event_count > 0 ? "primary" : "default"}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Box
                                        sx={{
                                            width: 24,
                                            height: 24,
                                            backgroundColor: category.color || "#ccc",
                                            border: "1px solid #ddd",
                                            borderRadius: 1,
                                        }}
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton onClick={() => handleEdit(category)} color="primary">
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => handleDelete(category)}
                                        color="error"
                                        disabled={category.event_count > 0}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <CategoryTranslationForm
                category={editingCategory}
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSave={handleSave}
            />
        </Box>
    );
};

export default AdminCategories;
