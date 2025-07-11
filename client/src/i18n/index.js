import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation files
import enCommon from "./locales/en/common.json";
import enAuth from "./locales/en/auth.json";
import enHome from "./locales/en/home.json";
import enNavigation from "./locales/en/navigation.json";
import enOnboarding from "./locales/en/onboarding.json";
import enMap from "./locales/en/map.json";

import frCommon from "./locales/fr/common.json";
import frAuth from "./locales/fr/auth.json";
import frHome from "./locales/fr/home.json";
import frNavigation from "./locales/fr/navigation.json";
import frOnboarding from "./locales/fr/onboarding.json";
import frMap from "./locales/fr/map.json";

import esCommon from "./locales/es/common.json";
import esAuth from "./locales/es/auth.json";
import esHome from "./locales/es/home.json";
import esNavigation from "./locales/es/navigation.json";
import esOnboarding from "./locales/es/onboarding.json";
import esMap from "./locales/es/map.json";

const resources = {
    fr: {
        common: frCommon,
        auth: frAuth,
        home: frHome,
        navigation: frNavigation,
        onboarding: frOnboarding,
        map: frMap,
    },
    es: {
        common: esCommon,
        auth: esAuth,
        home: esHome,
        navigation: esNavigation,
        onboarding: esOnboarding,
        map: esMap,
    },
    en: {
        common: enCommon,
        auth: enAuth,
        home: enHome,
        navigation: enNavigation,
        onboarding: enOnboarding,
        map: enMap,
    },
};

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: "fr", // French as main language
        lng: "fr", // Default language
        debug: false, // Disable debug logging to reduce console verbosity

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
        ns: ["common", "auth", "home", "navigation", "onboarding", "map"],
    });

export default i18n;
