import React, { useState } from "react";
import { Box, Paper, Typography, Tabs, Tab, Divider, Chip } from "@mui/material";
import {
    Category as CategoryIcon,
    Language as LanguageIcon,
    Settings as SettingsIcon,
    Palette as PaletteIcon,
    NotificationsActive as NotificationIcon,
    BugReport as BugReportIcon,
} from "@mui/icons-material";

// Import category management component
import AdminCategories from "./AdminCategories";
import AdminDebugPanel from "../components/AdminDebugPanel";

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

const LanguageSettings = () => (
    <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
            Paramètres de langue
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
            Configuration des langues prises en charge et des fallbacks
        </Typography>

        <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
                Langues actuellement supportées :
            </Typography>
            <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                <Chip label="🇫🇷 Français (par défaut)" color="primary" />
                <Chip label="🇬🇧 English" />
                <Chip label="🇪🇸 Español" />
            </Box>

            <Typography variant="subtitle1" gutterBottom>
                Fonctionnalités à venir :
            </Typography>
            <ul style={{ color: "#666" }}>
                <li>Ajout/suppression de langues</li>
                <li>Configuration de la langue par défaut</li>
                <li>Ordre de fallback des langues</li>
                <li>Import/Export des traductions</li>
                <li>Détection automatique de traductions manquantes</li>
            </ul>
        </Box>
    </Box>
);

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
