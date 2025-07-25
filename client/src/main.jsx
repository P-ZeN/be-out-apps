import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "./i18n"; // Initialize i18n
import desktopAuthService from "./services/desktopAuthService.js";

// Set up deep link listener for OAuth callbacks
if (window.__TAURI__) {
    (async () => {
        try {
            const { listen } = await import("@tauri-apps/api/event");
            
            // Listen for deep link events
            await listen("deep-link://new-url", (event) => {
                console.log("Deep link received:", event.payload);
                
                // Check if it's an OAuth callback
                if (event.payload && event.payload.includes("oauth/callback")) {
                    desktopAuthService.handleOAuthCallback(event.payload);
                }
            });
            
            console.log("Deep link listener registered");
        } catch (error) {
            console.error("Failed to set up deep link listener:", error);
        }
    })();
}

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
