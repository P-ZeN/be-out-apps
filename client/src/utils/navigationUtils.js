/**
 * Platform-aware navigation utilities
 * Ensures consistent navigation behavior across web and mobile platforms
 */

import { getIsTauriApp } from "./platformDetection";

export const NavigationConfig = {
    WEB: {
        HOME: { path: "/", label: "Home", tabIndex: 0 },
        EVENTS: { path: "/events", label: "Events", tabIndex: 1 },
        MAP: { path: "/map", label: "Map", tabIndex: 2 },
    },
    MOBILE: {
        EVENTS: { path: "/events", label: "Events", tabIndex: 0 },
        MAP: { path: "/map", label: "Map", tabIndex: 1 },
    },
};

/**
 * Get the appropriate navigation configuration based on platform
 */
export const getNavigationConfig = () => {
    const isTauriApp = getIsTauriApp();
    return isTauriApp ? NavigationConfig.MOBILE : NavigationConfig.WEB;
};

/**
 * Get the correct tab index for a given path
 */
export const getTabIndex = (pathname) => {
    const config = getNavigationConfig();
    const isTauriApp = getIsTauriApp();

    if (isTauriApp) {
        // Mobile: Events=0, Map=1
        if (pathname === "/events" || pathname === "/" || pathname === "/home") return 0;
        if (pathname === "/map") return 1;
        return 0; // Default to events
    } else {
        // Web: Home=0, Events=1, Map=2
        if (pathname === "/" || pathname === "/home") return 0;
        if (pathname === "/events") return 1;
        if (pathname === "/map") return 2;
        return 0; // Default to home
    }
};

/**
 * Get the correct navigation path for a tab index
 */
export const getNavigationPath = (tabIndex) => {
    const isTauriApp = getIsTauriApp();

    if (isTauriApp) {
        // Mobile: 0=Events, 1=Map
        switch (tabIndex) {
            case 0:
                return "/events";
            case 1:
                return "/map";
            default:
                return "/events";
        }
    } else {
        // Web: 0=Home, 1=Events, 2=Map
        switch (tabIndex) {
            case 0:
                return "/";
            case 1:
                return "/events";
            case 2:
                return "/map";
            default:
                return "/";
        }
    }
};

/**
 * Debug navigation state - useful for development
 */
export const debugNavigation = (pathname) => {
    const isTauriApp = getIsTauriApp();
    const tabIndex = getTabIndex(pathname);
    const config = getNavigationConfig();

    console.log("Navigation Debug:", {
        pathname,
        isTauriApp,
        tabIndex,
        config: Object.keys(config),
        expectedPath: getNavigationPath(tabIndex),
    });
};
