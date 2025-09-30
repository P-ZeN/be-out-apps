/**
 * Utility to detect if the app is running in a Tauri environment
 */

let isTauriApp = null;

/**
 * Check if the app is running in Tauri (bundled app) vs web browser
 * @returns {boolean} true if running in Tauri, false if in web browser
 */
export const getIsTauriApp = () => {
    if (isTauriApp !== null) {
        return isTauriApp;
    }

    try {
        // Primary check: Tauri API availability
        if (typeof window !== "undefined") {
            // CRITICAL: Check if Tauri APIs are actually available
            // Even if we're on tauri.localhost, we need the actual APIs
            const hasTauriApis = !!(window.__TAURI__ || window.__TAURI_IPC__ || window.__TAURI_INTERNALS__);

            if (hasTauriApis) {
                console.log("Tauri APIs detected - confirmed Tauri environment");
                isTauriApp = true;
                return isTauriApp;
            }

            // Check for Tauri v2 API
            if (window.__TAURI_INTERNALS__) {
                isTauriApp = true;
                return isTauriApp;
            }

            // Check user agent for Tauri
            const userAgent = navigator.userAgent.toLowerCase();
            if (userAgent.includes("tauri")) {
                isTauriApp = true;
                return isTauriApp;
            }

            // Check for specific Tauri properties
            if (window.ipc || window.rpc) {
                isTauriApp = true;
                return isTauriApp;
            }

            // Additional check: if running from file:// protocol, likely bundled
            if (window.location.protocol === "file:") {
                isTauriApp = true;
                return isTauriApp;
            }

            // Check for presence of tauri:// protocol in the URL
            if (window.location.protocol.startsWith("tauri")) {
                isTauriApp = true;
                return isTauriApp;
            }

            // Check for tauri.localhost (mobile app indicator) - even without APIs
            if (window.location.href.includes("tauri.localhost")) {
                console.log("Tauri mobile app detected (tauri.localhost)");
                isTauriApp = true;
                return isTauriApp;
            }
        }

        // If none of the above, assume web browser
        isTauriApp = false;
        return isTauriApp;
    } catch (error) {
        // If any error occurs, assume web browser
        console.log("Error detecting Tauri environment:", error);
        isTauriApp = false;
        return isTauriApp;
    }
};

/**
 * Get the platform type
 * @returns {string} 'tauri' | 'web'
 */
export const getPlatformType = () => {
    return getIsTauriApp() ? "tauri" : "web";
};

/**
 * Check if running in web browser
 * @returns {boolean}
 */
export const isWebApp = () => {
    return !getIsTauriApp();
};

/**
 * Reset the cached detection (useful for testing)
 */
export const resetTauriDetection = () => {
    isTauriApp = null;
};

/**
 * Check if Tauri APIs are actually available (separate from platform detection)
 * Used for OAuth and other functionality that requires actual Tauri APIs
 * @returns {boolean}
 */
export const areTauriApisAvailable = () => {
    if (typeof window === "undefined") return false;
    return !!(window.__TAURI__ || window.__TAURI_IPC__ || window.__TAURI_INTERNALS__ || window.ipc || window.rpc);
};

/**
 * Detect if running on iOS (including Tauri iOS apps)
 * @returns {boolean}
 */
export const isIOS = () => {
    if (typeof window === "undefined") return false;

    const userAgent = navigator.userAgent;
    const platform = navigator.platform;

    // Check for iOS devices in user agent
    const isIOSUserAgent = /iPad|iPhone|iPod/.test(userAgent);

    // Check for iOS platform
    const isIOSPlatform = /iPad|iPhone|iPod|iOS/.test(platform);

    // Check for Tauri iOS app specifically
    const isTauriIOS = getIsTauriApp() && (
        isIOSUserAgent ||
        isIOSPlatform ||
        // Check for iOS WebKit specifics in Tauri
        (window.webkit && typeof window.webkit === 'object') ||
        // Check for iOS in the build target
        userAgent.includes('Mobile/') && userAgent.includes('Safari/')
    );

    return isIOSUserAgent || isIOSPlatform || isTauriIOS;
};

/**
 * Detect if running on Android (including Tauri Android apps)
 * @returns {boolean}
 */
export const isAndroid = () => {
    if (typeof window === "undefined") return false;

    const userAgent = navigator.userAgent;

    // Check for Android in user agent
    const isAndroidUserAgent = /Android/.test(userAgent);

    // Check for Tauri Android app specifically
    const isTauriAndroid = getIsTauriApp() && isAndroidUserAgent;

    return isAndroidUserAgent || isTauriAndroid;
};
