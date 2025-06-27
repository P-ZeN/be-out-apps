import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Simple French translations for admin interface
const resources = {
    fr: {
        translation: {
            // Common
            loading: "Chargement...",
            error: "Erreur",
            save: "Enregistrer",
            cancel: "Annuler",
            delete: "Supprimer",
            edit: "Modifier",
            view: "Voir",
            search: "Rechercher",
            filter: "Filtrer",
            export: "Exporter",
            refresh: "Actualiser",

            // Admin interface
            dashboard: "Tableau de bord",
            users: "Utilisateurs",
            events: "Événements",
            bookings: "Réservations",
            payments: "Paiements",
            logs: "Journaux",
            statistics: "Statistiques",

            // Messages
            no_data: "Aucune donnée disponible",
            access_denied: "Accès refusé",
            login_required: "Veuillez vous connecter",
            admin_required: "Droits d'administrateur requis",
        },
    },
    en: {
        translation: {
            // Common
            loading: "Loading...",
            error: "Error",
            save: "Save",
            cancel: "Cancel",
            delete: "Delete",
            edit: "Edit",
            view: "View",
            search: "Search",
            filter: "Filter",
            export: "Export",
            refresh: "Refresh",

            // Admin interface
            dashboard: "Dashboard",
            users: "Users",
            events: "Events",
            bookings: "Bookings",
            payments: "Payments",
            logs: "Logs",
            statistics: "Statistics",

            // Messages
            no_data: "No data available",
            access_denied: "Access denied",
            login_required: "Please log in",
            admin_required: "Admin rights required",
        },
    },
};

i18n.use(initReactI18next).init({
    resources,
    lng: "fr", // Default language
    fallbackLng: "en",

    interpolation: {
        escapeValue: false,
    },
});

export default i18n;
