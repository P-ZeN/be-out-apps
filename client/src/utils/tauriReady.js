/**
 * Utility to wait for Tauri to be ready
 */

export const waitForTauri = (timeout = 5000) => {
    return new Promise((resolve, reject) => {
        const checkTauri = () => {
            console.log("Checking for Tauri...");

            // Check for any Tauri API
            if (window.__TAURI__ || window.__TAURI_IPC__ || window.__TAURI_INTERNALS__) {
                console.log("Tauri API found!");
                resolve(true);
                return;
            }

            // Check other indicators
            if (window.ipc || window.rpc) {
                console.log("Tauri IPC found!");
                resolve(true);
                return;
            }

            console.log("Tauri not ready yet...");
        };

        // Immediate check
        checkTauri();

        // If not found immediately, start polling
        const interval = setInterval(checkTauri, 100);

        // Timeout after specified time
        setTimeout(() => {
            clearInterval(interval);
            console.log("Tauri wait timeout - assuming web environment");
            resolve(false);
        }, timeout);
    });
};

export const getTauriInfo = () => {
    const info = {
        hasTauri: !!(window.__TAURI__ || window.__TAURI_IPC__ || window.__TAURI_INTERNALS__),
        hasIpc: !!(window.ipc || window.rpc),
        userAgent: navigator.userAgent,
        protocol: window.location.protocol,
        href: window.location.href,
        windowKeys: Object.keys(window).filter((key) => key.includes("TAURI") || key.includes("tauri")),
    };

    console.log("Tauri Info:", info);
    return info;
};
