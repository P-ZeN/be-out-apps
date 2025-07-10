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

            // Registration
            register: {
                title: "Devenir organisateur",
                subtitle: "Créez votre compte pour commencer à organiser des événements",
                confirmPassword: "Confirmer le mot de passe",
                companyName: "Nom de l'entreprise",
                contactPerson: "Personne de contact",
                phone: "Téléphone",
                registering: "Inscription...",
                alreadyHaveAccount: "Déjà inscrit ?",
                success: {
                    title: "Inscription réussie !",
                    message:
                        "Votre demande d'inscription a été envoyée. Un administrateur va examiner votre profil et vous serez notifié par email une fois votre compte approuvé.",
                    redirecting: "Redirection vers la page de connexion...",
                },
                errors: {
                    passwordMismatch: "Les mots de passe ne correspondent pas",
                    failed: "Erreur lors de l'inscription",
                },
            },

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

            // Registration
            register: {
                title: "Become an Organizer",
                subtitle: "Create your account to start organizing events",
                confirmPassword: "Confirm Password",
                companyName: "Company Name",
                contactPerson: "Contact Person",
                phone: "Phone",
                registering: "Registering...",
                alreadyHaveAccount: "Already have an account?",
                success: {
                    title: "Registration Successful!",
                    message:
                        "Your registration request has been sent. An administrator will review your profile and you will be notified by email once your account is approved.",
                    redirecting: "Redirecting to login page...",
                },
                errors: {
                    passwordMismatch: "Passwords do not match",
                    failed: "Registration failed",
                },
            },

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
