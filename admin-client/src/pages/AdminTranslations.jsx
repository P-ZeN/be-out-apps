import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Button,
    Alert,
    Snackbar,
    CircularProgress,
    Chip,
    Grid,
    Card,
    CardContent,
    CardActions,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    Tooltip,
    Stack,
} from "@mui/material";
import {
    Language,
    Edit,
    Save,
    Cancel,
    Add,
    Delete,
    FileUpload,
    FileDownload,
    Search,
    Refresh,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import translationService from "../services/translationService";
import TranslationEditor from "../components/TranslationEditor";
import TranslationFileUpload from "../components/TranslationFileUpload";
import TranslationExport from "../components/TranslationExport";

const AdminTranslations = () => {
    const { t } = useTranslation();
    const [currentTab, setCurrentTab] = useState(0);
    const [selectedLanguage, setSelectedLanguage] = useState("fr");
    const [selectedNamespace, setSelectedNamespace] = useState("common");
    const [translations, setTranslations] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [languages, setLanguages] = useState([]);
    const [namespaces, setNamespaces] = useState([]);
    const [editingKey, setEditingKey] = useState(null);
    const [addKeyDialog, setAddKeyDialog] = useState(false);
    const [newKey, setNewKey] = useState("");
    const [newValue, setNewValue] = useState("");
    const [deleteDialog, setDeleteDialog] = useState(null);

    // Available languages and namespaces
    const availableLanguages = [
        { code: "en", name: "English", flag: "🇺🇸" },
        { code: "fr", name: "Français", flag: "🇫🇷" },
        { code: "es", name: "Español", flag: "🇪🇸" },
    ];

    const availableNamespaces = [
        { key: "common", name: "Common UI" },
        { key: "auth", name: "Authentication" },
        { key: "home", name: "Home Page" },
        { key: "navigation", name: "Navigation" },
        { key: "onboarding", name: "Onboarding" },
        { key: "map", name: "Map & Events" },
        { key: "profile", name: "User Profile" },
        { key: "bookings", name: "Bookings" },
        { key: "payment", name: "Payments" },
        { key: "dashboard", name: "User Dashboard" },
        { key: "footer", name: "Footer" },
        { key: "showroom", name: "Showroom (Marketing Site)" },
    ];

    useEffect(() => {
        loadTranslations();
        loadAvailableLanguages();
        // Temporarily disable dynamic namespace loading to test
        // loadAvailableNamespaces();
    }, [selectedLanguage, selectedNamespace]);

    const loadTranslations = async () => {
        try {
            setLoading(true);
            const data = await translationService.getTranslations(selectedLanguage, selectedNamespace);
            setTranslations(data);
        } catch (err) {
            setError("Échec du chargement des traductions");
        } finally {
            setLoading(false);
        }
    };

    const loadAvailableLanguages = async () => {
        try {
            const langs = await translationService.getAvailableLanguages();
            setLanguages(langs);
        } catch (err) {
            console.error("Error loading languages:", err);
        }
    };

    const loadAvailableNamespaces = async () => {
        try {
            const ns = await translationService.getAvailableNamespaces(selectedLanguage);
            setNamespaces(ns);
        } catch (err) {
            console.error("Error loading namespaces:", err);
        }
    };

    const handleSaveTranslations = async () => {
        try {
            setSaving(true);
            const result = await translationService.saveTranslations(selectedLanguage, selectedNamespace, translations);
            setSuccess("Traductions sauvegardées avec succès !");
            await loadTranslations();
        } catch (err) {
            setError("Échec de la sauvegarde des traductions");
        } finally {
            setSaving(false);
        }
    };

    // Auto-save function for field-level saves (doesn't reload)
    const handleAutoSave = async (updatedTranslations) => {
        try {
            console.log("Auto-saving translations:", updatedTranslations);
            // Use the provided translations or fall back to current state
            const translationsToSave = updatedTranslations || translations;
            await translationService.saveTranslations(selectedLanguage, selectedNamespace, translationsToSave);
            console.log("Auto-save successful");
            setSuccess("Traduction sauvegardée !");
        } catch (err) {
            console.error("Auto-save error:", err);
            setError("Échec de la sauvegarde de la traduction");
            console.error("Error auto-saving translation:", err);
        }
    };

    const handleUpdateKey = (key, value) => {
        setTranslations((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleAddKey = async () => {
        if (!newKey.trim() || !newValue.trim()) return;

        try {
            const updatedTranslations = {
                ...translations,
                [newKey]: newValue,
            };
            setTranslations(updatedTranslations);
            setAddKeyDialog(false);
            setNewKey("");
            setNewValue("");
            setSuccess("Clé ajoutée avec succès !");
        } catch (err) {
            setError("Échec de l'ajout de la clé");
        }
    };

    const handleDeleteKey = async (key) => {
        try {
            const updatedTranslations = { ...translations };
            delete updatedTranslations[key];
            setTranslations(updatedTranslations);
            setDeleteDialog(null);
            setSuccess("Clé supprimée avec succès !");
        } catch (err) {
            setError("Échec de la suppression de la clé");
        }
    };

    const getFilteredTranslations = () => {
        if (!searchTerm) return translations;

        return Object.entries(translations).reduce((filtered, [key, value]) => {
            if (
                key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                value.toLowerCase().includes(searchTerm.toLowerCase())
            ) {
                filtered[key] = value;
            }
            return filtered;
        }, {});
    };

    const tabsData = [
        { label: "Modifier les Traductions", icon: <Edit /> },
        { label: "Import/Export", icon: <FileUpload /> },
        { label: "Statistiques", icon: <Language /> },
    ];

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Gestion des Traductions
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Gérer les traductions pour tous les composants de l'interface utilisateur dans différentes langues
                </Typography>
            </Box>

            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={currentTab}
                    onChange={(e, newValue) => setCurrentTab(newValue)}
                    sx={{ borderBottom: 1, borderColor: "divider" }}>
                    {tabsData.map((tab, index) => (
                        <Tab key={index} icon={tab.icon} label={tab.label} iconPosition="start" />
                    ))}
                </Tabs>
            </Paper>

            {/* Edit Translations Tab */}
            {currentTab === 0 && (
                <Box>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Grid container spacing={3} alignItems="center">
                            <Grid item xs={12} md={3}>
                                <FormControl fullWidth>
                                    <InputLabel>Langue</InputLabel>
                                    <Select
                                        value={selectedLanguage}
                                        label="Langue"
                                        onChange={(e) => setSelectedLanguage(e.target.value)}>
                                        {availableLanguages.map((lang) => (
                                            <MenuItem key={lang.code} value={lang.code}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    <span>{lang.flag}</span>
                                                    <span>{lang.name}</span>
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <FormControl fullWidth>
                                    <InputLabel>Espace de noms</InputLabel>
                                    <Select
                                        value={selectedNamespace}
                                        label="Espace de noms"
                                        onChange={(e) => setSelectedNamespace(e.target.value)}>
                                        {availableNamespaces.map((ns) => (
                                            <MenuItem key={ns.key} value={ns.key}>
                                                {ns.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Rechercher des traductions"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    InputProps={{
                                        startAdornment: <Search sx={{ mr: 1, color: "action.active" }} />,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Stack direction="row" spacing={1}>
                                    <Button
                                        variant="contained"
                                        startIcon={<Add />}
                                        onClick={() => setAddKeyDialog(true)}>
                                        Ajouter une Clé
                                    </Button>
                                    <Tooltip title="Actualiser">
                                        <IconButton onClick={loadTranslations}>
                                            <Refresh />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                            </Grid>
                        </Grid>
                    </Paper>

                    {loading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <TranslationEditor
                            translations={getFilteredTranslations()}
                            onUpdateKey={handleUpdateKey}
                            onDeleteKey={(key) => setDeleteDialog(key)}
                            onSave={handleAutoSave}
                            language={selectedLanguage}
                            namespace={selectedNamespace}
                        />
                    )}

                    <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
                        <Button
                            variant="contained"
                            startIcon={<Save />}
                            onClick={handleSaveTranslations}
                            disabled={saving}>
                            {saving ? <CircularProgress size={20} /> : "Sauvegarder les Modifications"}
                        </Button>
                    </Box>
                </Box>
            )}

            {/* Import/Export Tab */}
            {currentTab === 1 && (
                <Box>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <TranslationFileUpload
                                onUploadComplete={loadTranslations}
                                selectedLanguage={selectedLanguage}
                                selectedNamespace={selectedNamespace}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TranslationExport
                                selectedLanguage={selectedLanguage}
                                selectedNamespace={selectedNamespace}
                            />
                        </Grid>
                    </Grid>
                </Box>
            )}

            {/* Statistics Tab */}
            {currentTab === 2 && (
                <Box>
                    <Grid container spacing={3}>
                        {availableLanguages.map((lang) => (
                            <Grid item xs={12} md={4} key={lang.code}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                                            <span style={{ fontSize: "1.5rem" }}>{lang.flag}</span>
                                            <Typography variant="h6">{lang.name}</Typography>
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Complétude des traductions et statistiques
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* Add Key Dialog */}
            <Dialog open={addKeyDialog} onClose={() => setAddKeyDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>Ajouter une Clé de Traduction</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <TextField
                            fullWidth
                            label="Clé"
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value)}
                            sx={{ mb: 2 }}
                            placeholder="ex: buttons.submit"
                        />
                        <TextField
                            fullWidth
                            label="Valeur"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            multiline
                            rows={3}
                            placeholder="Entrez la valeur de traduction"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddKeyDialog(false)}>Annuler</Button>
                    <Button onClick={handleAddKey} variant="contained">
                        Ajouter la Clé
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
                <DialogTitle>Supprimer la Clé de Traduction</DialogTitle>
                <DialogContent>
                    <Typography>Êtes-vous sûr de vouloir supprimer la clé "{deleteDialog}" ?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog(null)}>Annuler</Button>
                    <Button onClick={() => handleDeleteKey(deleteDialog)} color="error">
                        Supprimer
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Success/Error Snackbars */}
            <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess(null)}>
                <Alert severity="success" onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            </Snackbar>

            <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}>
                <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AdminTranslations;
