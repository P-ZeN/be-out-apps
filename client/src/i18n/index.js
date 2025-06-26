import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation files
import enCommon from "./locales/en/common.json";
import enAuth from "./locales/en/auth.json";
import enHome from "./locales/en/home.json";
import enNavigation from "./locales/en/navigation.json";

import frCommon from "./locales/fr/common.json";
import frAuth from "./locales/fr/auth.json";
import frHome from "./locales/fr/home.json";
import frNavigation from "./locales/fr/navigation.json";

import esCommon from "./locales/es/common.json";
import esAuth from "./locales/es/auth.json";
import esHome from "./locales/es/home.json";
import esNavigation from "./locales/es/navigation.json";

const resources = {
    fr: {
        common: frCommon,
        auth: frAuth,
        home: frHome,
        navigation: frNavigation,
    },
    es: {
        common: esCommon,
        auth: esAuth,
        home: esHome,
        navigation: esNavigation,
    },
    en: {
        common: enCommon,
        auth: enAuth,
        home: enHome,
        navigation: enNavigation,
    },
};

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: "fr", // French as main language
        lng: "fr", // Default language
        debug: process.env.NODE_ENV === "development",

        // Detection options
        detection: {
            order: ["localStorage", "navigator", "htmlTag"],
            caches: ["localStorage"],
        },

        interpolation: {
            escapeValue: false, // React already escapes values
        },

        // Namespace configuration
        defaultNS: "common",
        ns: ["common", "auth", "home", "navigation"],
    });

export default i18n;
