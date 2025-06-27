import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
    fr: {
        translation: {
            // Navigation
            dashboard: "Tableau de bord",
            events: "Mes événements",
            bookings: "Réservations",
            revenue: "Revenus",
            profile: "Mon profil",

            // Auth
            login: "Se connecter",
            logout: "Déconnexion",
            register: "S'inscrire",
            email: "Email",
            password: "Mot de passe",

            // Common
            loading: "Chargement...",
            save: "Enregistrer",
            cancel: "Annuler",
            delete: "Supprimer",
            edit: "Modifier",
            view: "Voir",
            create: "Créer",

            // Status
            active: "Actif",
            draft: "Brouillon",
            cancelled: "Annulé",
            pending: "En attente",
            approved: "Approuvé",
            rejected: "Rejeté",
        },
    },
    en: {
        translation: {
            // Navigation
            dashboard: "Dashboard",
            events: "My Events",
            bookings: "Bookings",
            revenue: "Revenue",
            profile: "My Profile",

            // Auth
            login: "Login",
            logout: "Logout",
            register: "Register",
            email: "Email",
            password: "Password",

            // Common
            loading: "Loading...",
            save: "Save",
            cancel: "Cancel",
            delete: "Delete",
            edit: "Edit",
            view: "View",
            create: "Create",

            // Status
            active: "Active",
            draft: "Draft",
            cancelled: "Cancelled",
            pending: "Pending",
            approved: "Approved",
            rejected: "Rejected",
        },
    },
};

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: "fr",
        debug: import.meta.env.DEV,

        interpolation: {
            escapeValue: false,
        },

        detection: {
            order: ["localStorage", "navigator", "htmlTag"],
            caches: ["localStorage"],
        },
    });

export default i18n;
