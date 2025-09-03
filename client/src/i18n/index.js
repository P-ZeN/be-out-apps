import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";

// API base URL for loading translations
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const i18nConfig = {
    lng: "fr", // Default language
    fallbackLng: "en",

    backend: {
        loadPath: `${API_BASE_URL}/api/translations/{{lng}}/{{ns}}`,
        allowMultiLoading: false,
        crossDomain: true,
    },

    // Force disable all caching for development
    cache: {
        enabled: false
    },

    interpolation: {
        escapeValue: false,
    },

    detection: {
        order: ["localStorage", "navigator", "htmlTag"],
        caches: ["localStorage"],
    },

    defaultNS: "common",
    ns: ["common", "auth", "home", "navigation", "onboarding", "map", "profile", "bookings", "footer"],
};

i18n.use(Backend) // Use HTTP backend to load translations
    .use(LanguageDetector)
    .use(initReactI18next)
    .init(i18nConfig);

export default i18n;
