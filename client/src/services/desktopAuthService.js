import { areTauriApisAvailable } from "../utils/platformDetection";

class DesktopAuthService {
    constructor() {
        this.codeVerifier = null;
        this.codeChallenge = null;
        this._tauriApis = null;
    }

    async _getTauriApis() {
        if (!areTauriApisAvailable()) {
            throw new Error("Tauri APIs not available");
        }

        if (!this._tauriApis) {
            try {
                const { invoke } = await import("@tauri-apps/api/core");
                const { listen } = await import("@tauri-apps/api/event");
                this._tauriApis = { invoke, listen };
            } catch (error) {
                throw new Error("Failed to load Tauri APIs: " + error.message);
            }
        }

        return this._tauriApis;
    }

    async checkTauriAvailability() {
        return areTauriApisAvailable();
    }

    generatePKCE() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        this.codeVerifier = this.base64URLEncode(array);

        return crypto.subtle.digest("SHA-256", new TextEncoder().encode(this.codeVerifier)).then((hash) => {
            this.codeChallenge = this.base64URLEncode(new Uint8Array(hash));
        });
    }

    base64URLEncode(array) {
        return btoa(String.fromCharCode(...array))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=/g, "");
    }

    async startGoogleOAuth() {
        console.log("=== GOOGLE OAUTH START ===");

        if (!areTauriApisAvailable()) {
            throw new Error("This OAuth service is for Tauri apps only.");
        }

        console.log("Tauri APIs available, generating PKCE...");
        await this.generatePKCE();

        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID_DESKTOP;
        if (!clientId) {
            throw new Error("Google Client ID not configured");
        }

        // Use our backend as a proxy for the OAuth flow
        // The backend will handle the Google OAuth and return the result
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
        
        // Create a unique session ID for this OAuth attempt
        const sessionId = this.codeChallenge; // Use the PKCE challenge as session ID
        
        // Start OAuth flow through our backend proxy
        const authUrl = `${API_BASE_URL}/auth/mobile/start?session=${sessionId}&challenge=${this.codeChallenge}`;
        
        console.log("Opening OAuth URL:", authUrl);

        try {
            console.log("Opening OAuth URL using native mobile approach...");
            
            // For mobile WebView, use direct window.open which works reliably
            const opened = window.open(authUrl.toString(), '_blank', 'noopener,noreferrer');
            
            if (!opened) {
                // Fallback: create a hidden link and click it
                const link = document.createElement('a');
                link.href = authUrl.toString();
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            
            console.log("OAuth URL opened successfully");
        } catch (error) {
            console.error("Failed to open OAuth URL:", error);
            // Last resort: show the URL to user in a more user-friendly way
            const userMessage = `To complete Google Sign-In, please open this link:\n\n${authUrl.toString()}\n\nAfter signing in, return to this app.`;
            if (confirm(userMessage + "\n\nPress OK to copy the link to clipboard.")) {
                try {
                    await navigator.clipboard.writeText(authUrl.toString());
                    alert("Link copied to clipboard! Please paste it in your browser.");
                } catch (clipboardError) {
                    alert("Please manually copy this link:\n\n" + authUrl.toString());
                }
            }
        }

        console.log("Waiting for OAuth callback...");
        return this.waitForCallbackWithPolling();
    }

    async waitForCallbackWithPolling() {
        return new Promise((resolve, reject) => {
            const timeout = 5 * 60 * 1000; // 5 minutes
            const pollInterval = 2000; // 2 seconds
            let attempts = 0;
            const maxAttempts = timeout / pollInterval;

            console.log("Starting OAuth polling...");

            const pollForResult = async () => {
                attempts++;

                if (attempts > maxAttempts) {
                    reject(new Error("OAuth timeout. Please try again."));
                    return;
                }

                try {
                    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
                    const response = await fetch(`${API_BASE_URL}/auth/mobile/poll/${this.codeChallenge}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });

                    if (response.ok) {
                        const result = await response.json();
                        if (result.status === 'completed' && result.user) {
                            console.log("OAuth completed successfully via polling");
                            resolve(result);
                            return;
                        } else if (result.status === 'error') {
                            reject(new Error(result.error || 'OAuth failed'));
                            return;
                        }
                        // Status is 'pending', continue polling
                    }
                } catch (error) {
                    console.log(`Polling attempt ${attempts} failed:`, error);
                }

                // Continue polling
                setTimeout(pollForResult, pollInterval);
            };

            // Start polling
            setTimeout(pollForResult, pollInterval);
        });
    }

    async waitForCallback() {
        const { listen } = await this._getTauriApis();

        return new Promise((resolve, reject) => {
            const timeout = 5 * 60 * 1000; // 5 minutes

            // Try to listen for different possible event names
            const eventNames = ["deep-link-received", "deeplink", "url-received", "scheme-url"];
            const unlistenPromises = [];

            console.log("Setting up deep link listeners for events:", eventNames);

            eventNames.forEach(eventName => {
                const unlistenPromise = listen(eventName, async (event) => {
                    console.log(`Event '${eventName}' received:`, event);

                    // Clean up all listeners
                    for (const promise of unlistenPromises) {
                        try {
                            const unlisten = await promise;
                            unlisten();
                        } catch (e) {
                            console.log("Could not unlisten:", e);
                        }
                    }
                    clearTimeout(timeoutId);

                    try {
                        console.log("Deep link event received:", event.payload);
                        const url = new URL(event.payload);
                        const code = url.searchParams.get("code");
                        const error = url.searchParams.get("error");

                        if (error) {
                            return reject(new Error(`OAuth error: ${error}`));
                        }

                        if (code) {
                            console.log("Authorization code received, exchanging for token...");
                            const userInfo = await this.exchangeCodeForToken(code);
                            return resolve(userInfo);
                        }

                        reject(new Error("No code received in callback."));
                    } catch (err) {
                        console.error("Error processing deep link:", err);
                        reject(err);
                    }
                }).catch((error) => {
                    console.error(`Failed to set up ${eventName} listener:`, error);
                });

                unlistenPromises.push(unlistenPromise);
            });

            const timeoutId = setTimeout(async () => {
                console.log("OAuth timeout, cleaning up listeners...");
                for (const promise of unlistenPromises) {
                    try {
                        const unlisten = await promise;
                        unlisten();
                    } catch (e) {
                        console.log("Could not unlisten during timeout:", e);
                    }
                }
                reject(new Error("OAuth timeout. Please try again."));
            }, timeout);
        });
    }

    async exchangeCodeForToken(code) {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID_DESKTOP;

        const response = await fetch(`${API_BASE_URL}/auth/desktop/google/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                code,
                clientId,
                codeVerifier: this.codeVerifier,
                redirectUri: `${API_BASE_URL}/auth/mobile/callback`,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
        }

        return await response.json();
    }

    async startAppleSignIn() {
        try {
            console.log("Starting Apple Sign In...");

            if (!areTauriApisAvailable()) {
                throw new Error("Apple Sign In only available in Tauri apps");
            }

            // For now, Apple Sign In is not fully implemented
            // This would require native iOS implementation or web-based flow
            throw new Error("Apple Sign In implementation is in progress. Please use Google OAuth for now.");
        } catch (error) {
            console.error("Apple Sign In error:", error);
            throw error;
        }
    }
}

export default new DesktopAuthService();
