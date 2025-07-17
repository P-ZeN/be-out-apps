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
            // Check for Tauri v1 API
            if (window.__TAURI__ || window.__TAURI_IPC__) {
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
