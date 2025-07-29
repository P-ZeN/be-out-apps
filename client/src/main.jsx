import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "./i18n"; // Initialize i18n

// Set up deep link listener for OAuth callbacks (Android only)
if (window.__TAURI__) {
    (async () => {
        try {
            const { listen } = await import("@tauri-apps/api/event");

            // Listen for deep link events - use proper event names (not URLs!)
            const eventNames = ["deep-link", "new-url", "plugin:deep-link|new-url", "deep_link", "url_opened"];

            console.log("Setting up deep link listeners for Android OAuth callbacks...");

            for (const eventName of eventNames) {
                try {
                    await listen(eventName, (event) => {
                        console.log(`[DEEP LINK] Event '${eventName}' received:`, event.payload);

                        // Check if it's an OAuth callback
                        const url = event.payload || event.url || event;
                        if (typeof url === 'string' && (url.includes("googleusercontent.apps") || url.includes("oauth2redirect"))) {
                            console.log("[DEEP LINK] OAuth callback detected - native auth handles this internally");
                        } else {
                            console.log("[DEEP LINK] Not an OAuth callback, ignoring:", url);
                        }
                    });
                    console.log(`[DEEP LINK] Listener registered successfully for: ${eventName}`);
                } catch (error) {
                    console.log(`[DEEP LINK] Failed to register listener for ${eventName}:`, error.message);
                }
            }

        } catch (error) {
            console.error("Failed to set up deep link listeners:", error);
        }
    })();
}

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
