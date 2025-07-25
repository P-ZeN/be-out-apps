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
        
        try {
            if (!areTauriApisAvailable()) {
                throw new Error("Tauri APIs not available");
            }

            console.log("Tauri APIs available, using system browser with deep links...");
            
            // Generate PKCE parameters
            await this.generatePKCE();
            
            // Store PKCE parameters
            localStorage.setItem('oauth_code_verifier', this.codeVerifier);
            localStorage.setItem('oauth_code_challenge', this.codeChallenge);
            
            // Use Android client ID and redirect to custom scheme
            const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID_ANDROID || "1064619689471-7lr8e71tr6h55as83o8gn4bdnhabavpu.apps.googleusercontent.com"; // Fallback for safety
            const redirectUri = "com.beout.app://oauth/callback"; // Custom URL scheme
            const scope = "openid email profile";
            const state = this.base64URLEncode(crypto.getRandomValues(new Uint8Array(32)));
            
            const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
            authUrl.searchParams.set("client_id", clientId);
            authUrl.searchParams.set("redirect_uri", redirectUri);
            authUrl.searchParams.set("response_type", "code");
            authUrl.searchParams.set("scope", scope);
            authUrl.searchParams.set("state", state);
            authUrl.searchParams.set("code_challenge", this.codeChallenge);
            authUrl.searchParams.set("code_challenge_method", "S256");
            authUrl.searchParams.set("prompt", "select_account");
            
            console.log('Opening OAuth URL in system browser:', authUrl.toString());
            
            // Get Tauri APIs
            const { invoke } = await this._getTauriApis();
            
            // Open in system browser
            await invoke('plugin:shell|open', {
                path: authUrl.toString(),
                with: null
            });
            
            console.log('OAuth URL opened successfully in system browser');
            console.log('Waiting for deep link callback...');
            
            // Return a promise that resolves when the deep link is received
            return new Promise((resolve, reject) => {
                // Set up deep link listener
                const timeout = setTimeout(() => {
                    reject(new Error('OAuth timeout - no callback received'));
                }, 300000); // 5 minute timeout
                
                // Store resolve/reject for deep link handler
                window.oauthPromise = { resolve, reject, timeout };
            });
            
        } catch (error) {
            console.error('OAuth error:', error);
            throw error;
        }
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

    // Deep link handler (called by Tauri when URL scheme is received)
    async handleOAuthCallback(url) {
        console.log('=== OAUTH CALLBACK RECEIVED ===');
        console.log('Callback URL:', url);
        
        try {
            const urlObj = new URL(url);
            const code = urlObj.searchParams.get('code');
            const state = urlObj.searchParams.get('state');
            const error = urlObj.searchParams.get('error');
            
            if (error) {
                throw new Error(`OAuth error: ${error}`);
            }
            
            if (!code) {
                throw new Error('No authorization code received');
            }
            
            console.log('Authorization code received, exchanging for tokens...');
            
            // Get stored PKCE verifier
            const codeVerifier = localStorage.getItem('oauth_code_verifier');
            if (!codeVerifier) {
                throw new Error('PKCE code verifier not found');
            }
            
            // Exchange code for tokens
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/mobile/exchange`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code,
                    codeVerifier,
                    redirectUri: "com.beout.app://oauth/callback"
                }),
            });
            
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Token exchange failed: ${response.status} - ${errorData}`);
            }
            
            const data = await response.json();
            console.log('OAuth successful:', data);
            
            // Clean up
            localStorage.removeItem('oauth_code_verifier');
            localStorage.removeItem('oauth_code_challenge');
            
            // Resolve the promise
            if (window.oauthPromise) {
                clearTimeout(window.oauthPromise.timeout);
                window.oauthPromise.resolve(data);
                window.oauthPromise = null;
            }
            
            return data;
            
        } catch (error) {
            console.error('OAuth callback error:', error);
            
            // Clean up
            localStorage.removeItem('oauth_code_verifier');
            localStorage.removeItem('oauth_code_challenge');
            
            // Reject the promise
            if (window.oauthPromise) {
                clearTimeout(window.oauthPromise.timeout);
                window.oauthPromise.reject(error);
                window.oauthPromise = null;
            }
            
            throw error;
        }
    }
}

export default new DesktopAuthService();
