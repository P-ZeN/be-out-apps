import React, { useState, useEffect } from "react";
import {
    Box,
    Paper,
    Typography,
    Tabs,
    Tab,
    Divider,
    Chip,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Button,
    Alert,
    Snackbar,
    CircularProgress,
    Grid,
    Card,
    CardContent,
    CardActions,
    TextField,
    IconButton,
    Tooltip,
    Stack,
} from "@mui/material";
import {
    Category as CategoryIcon,
    Language as LanguageIcon,
    Settings as SettingsIcon,
    Palette as PaletteIcon,
    NotificationsActive as NotificationIcon,
    BugReport as BugReportIcon,
    Edit,
    Save,
    FileUpload,
    Search,
    Refresh,
} from "@mui/icons-material";

// Import category management component
import AdminCategories from "./AdminCategories";
import AdminDebugPanel from "../components/AdminDebugPanel";

// Import translation management components
import TranslationEditor from "../components/TranslationEditor";
import TranslationFileUpload from "../components/TranslationFileUpload";
import TranslationExport from "../components/TranslationExport";
import translationService from "../services/translationService";

// Placeholder components for future settings sections
const GeneralSettings = () => (
    <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
            Paramètres généraux
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
            Configuration générale de l'application
        </Typography>

        {/* Placeholder for future general settings */}
        <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
                Fonctionnalités à venir :
            </Typography>
            <ul style={{ color: "#666" }}>
                <li>Configuration du nom de l'application</li>
                <li>URL de base de l'application</li>
                <li>Paramètres de timezone</li>
                <li>Maintenance mode</li>
                <li>Limites de fichiers upload</li>
            </ul>
        </Box>
    </Box>
);

const LanguageSettings = () => {
    const [selectedLanguage, setSelectedLanguage] = useState("fr");
    const [selectedNamespace, setSelectedNamespace] = useState("common");
    const [translations, setTranslations] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentSubTab, setCurrentSubTab] = useState(0);

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
        { key: "events", name: "Events" },
        { key: "bookings", name: "Bookings" },
        { key: "payments", name: "Payments" },
        { key: "showroom", name: "Showroom (Marketing Site)" },
    ];

    useEffect(() => {
        loadTranslations();
    }, [selectedLanguage, selectedNamespace]);

    const loadTranslations = async () => {
        try {
            setLoading(true);
            const data = await translationService.getTranslations(selectedLanguage, selectedNamespace);
            setTranslations(data);
        } catch (err) {
            setError("Failed to load translations");
            console.error("Error loading translations:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTranslations = async () => {
        try {
            setSaving(true);
            await translationService.saveTranslations(selectedLanguage, selectedNamespace, translations);
            setSuccess("Translations saved successfully!");
            await loadTranslations();
        } catch (err) {
            setError("Failed to save translations");
            console.error("Error saving translations:", err);
        } finally {
            setSaving(false);
        }
    };

    // Auto-save function for field-level saves (doesn't reload)
    const handleAutoSave = async (updatedTranslations) => {
        try {
            // Use the provided translations or fall back to current state
            const translationsToSave = updatedTranslations || translations;
            await translationService.saveTranslations(selectedLanguage, selectedNamespace, translationsToSave);
            setSuccess("Translation saved!");
        } catch (err) {
            setError("Failed to save translation");
            console.error("Error auto-saving translation:", err);
        }
    };

    const handleUpdateKey = (key, value) => {
        setTranslations((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const getFilteredTranslations = () => {
        if (!searchTerm) return translations;

        return Object.entries(translations).reduce((filtered, [key, value]) => {
            const valueString = typeof value === "string" ? value : JSON.stringify(value);
            if (
                key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                valueString.toLowerCase().includes(searchTerm.toLowerCase())
            ) {
                filtered[key] = value;
            }
            return filtered;
        }, {});
    };

    const subTabsData = [
        { label: "Modifier les Traductions", icon: <Edit /> },
        { label: "Import/Export", icon: <FileUpload /> },
        { label: "Statistiques", icon: <LanguageIcon /> },
    ];

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Gestion des traductions
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
                Modification des traductions existantes. Les clés de traduction sont gérées par les développeurs dans le
                code.
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                    Fonctionnalités disponibles :
                </Typography>
                <ul style={{ margin: 0, paddingLeft: "20px" }}>
                    <li>Modifier les valeurs de traduction existantes</li>
                    <li>Importer/Exporter des fichiers de traduction</li>
                    <li>Consulter les statistiques de traduction</li>
                </ul>
            </Alert>

            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                    Langues actuellement supportées :
                </Typography>
                <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                    <Chip label="🇫🇷 Français (par défaut)" color="primary" />
                    <Chip label="🇬🇧 English" />
                    <Chip label="🇪🇸 Español" />
                </Box>
            </Box>

            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={currentSubTab}
                    onChange={(e, newValue) => setCurrentSubTab(newValue)}
                    sx={{ borderBottom: 1, borderColor: "divider" }}>
                    {subTabsData.map((tab, index) => (
                        <Tab key={index} icon={tab.icon} label={tab.label} iconPosition="start" />
                    ))}
                </Tabs>
            </Paper>

            {/* Edit Translations Tab */}
            {currentSubTab === 0 && (
                <Box>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Grid container spacing={3} alignItems="center">
                            <Grid size={{ xs: 12, md: 3 }}>
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
                            <Grid size={{ xs: 12, md: 3 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Espace de noms</InputLabel>
                                    <Select
                                        value={selectedNamespace}
                                        label="Namespace"
                                        onChange={(e) => setSelectedNamespace(e.target.value)}>
                                        {availableNamespaces.map((ns) => (
                                            <MenuItem key={ns.key} value={ns.key}>
                                                {ns.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
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
                            <Grid size={{ xs: 12, md: 2 }}>
                                <Stack direction="row" spacing={1}>
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
                            onSave={handleAutoSave}
                            language={selectedLanguage}
                            namespace={selectedNamespace}
                        />
                    )}
                </Box>
            )}

            {/* Import/Export Tab */}
            {currentSubTab === 1 && (
                <Box>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TranslationFileUpload
                                onUploadComplete={loadTranslations}
                                selectedLanguage={selectedLanguage}
                                selectedNamespace={selectedNamespace}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TranslationExport
                                selectedLanguage={selectedLanguage}
                                selectedNamespace={selectedNamespace}
                            />
                        </Grid>
                    </Grid>
                </Box>
            )}

            {/* Statistics Tab */}
            {currentSubTab === 2 && (
                <Box>
                    <Grid container spacing={3}>
                        {availableLanguages.map((lang) => (
                            <Grid size={{ xs: 12, md: 4 }} key={lang.code}>
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

            {/* Snackbars */}
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

const ThemeSettings = () => (
    <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
            Thème et apparence
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
            Personnalisation de l'apparence de l'application
        </Typography>

        <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
                Fonctionnalités à venir :
            </Typography>
            <ul style={{ color: "#666" }}>
                <li>Couleurs primaires et secondaires</li>
                <li>Logo de l'application</li>
                <li>Mode sombre/clair</li>
                <li>Personnalisation des emails</li>
                <li>Thèmes personnalisés pour les événements</li>
            </ul>
        </Box>
    </Box>
);

const NotificationSettings = () => (
    <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
            Notifications
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
            Configuration des notifications et alertes
        </Typography>

        <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
                Fonctionnalités à venir :
            </Typography>
            <ul style={{ color: "#666" }}>
                <li>Templates d'emails</li>
                <li>Configuration SMTP</li>
                <li>Notifications push</li>
                <li>Alertes d'administration</li>
                <li>Fréquence des notifications</li>
            </ul>
        </Box>
    </Box>
);

const AdminSettings = ({ user }) => {
    const [currentTab, setCurrentTab] = useState(0);

    const settingsTabs = [
        {
            label: "🔧 Debug",
            icon: <BugReportIcon />,
            component: <AdminDebugPanel />,
            description: "Panel de debug pour diagnostiquer les problèmes d'API",
        },
        {
            label: "Catégories",
            icon: <CategoryIcon />,
            component: <AdminCategories />,
            description: "Gestion des catégories d'événements et leurs traductions",
        },
        {
            label: "Général",
            icon: <SettingsIcon />,
            component: <GeneralSettings />,
            description: "Paramètres généraux de l'application",
        },
        {
            label: "Langues",
            icon: <LanguageIcon />,
            component: <LanguageSettings />,
            description: "Configuration des langues et traductions",
        },
        {
            label: "Thème",
            icon: <PaletteIcon />,
            component: <ThemeSettings />,
            description: "Personnalisation de l'apparence",
        },
        {
            label: "Notifications",
            icon: <NotificationIcon />,
            component: <NotificationSettings />,
            description: "Configuration des notifications",
        },
    ];

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Paramètres
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Configuration et gestion des paramètres de l'application
                </Typography>
            </Box>

            <Paper sx={{ width: "100%" }}>
                {/* Tabs Navigation */}
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <Tabs
                        value={currentTab}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{ px: 2 }}>
                        {settingsTabs.map((tab, index) => (
                            <Tab
                                key={index}
                                icon={tab.icon}
                                label={tab.label}
                                iconPosition="start"
                                sx={{
                                    minHeight: 64,
                                    textTransform: "none",
                                    fontWeight: currentTab === index ? 600 : 400,
                                }}
                            />
                        ))}
                    </Tabs>
                </Box>

                {/* Tab Description */}
                <Box sx={{ px: 3, py: 2, bgcolor: "grey.50" }}>
                    <Typography variant="body2" color="text.secondary">
                        {settingsTabs[currentTab]?.description}
                    </Typography>
                </Box>

                <Divider />

                {/* Tab Content */}
                <Box>{settingsTabs[currentTab]?.component}</Box>
            </Paper>
        </Box>
    );
};

export default AdminSettings;
