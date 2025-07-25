import { areTauriApisAvailable } from "../utils/platformDetection";

class MobileAuthService {
    constructor() {
        this.codeVerifier = null;
        this.codeChallenge = null;
        this._tauriApis = null;
        this.packageName = 'com.beout.app'; // From Tauri identifier
        this.serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID_ANDROID || "1064619689471-7lr8e71tr6h55as83o8gn4bdnhabavpu.apps.googleusercontent.com";
        this.oauthState = null;
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
        console.log("[OAUTH] Initializing Android OAuth flow with system browser...");
        
        try {
            if (!areTauriApisAvailable()) {
                throw new Error("Tauri APIs not available");
            }

            console.log("[OAUTH] Tauri APIs available, using system browser OAuth flow...");
            
            // Generate PKCE parameters
            await this.generatePKCE();
            console.log("[OAUTH] PKCE parameters generated successfully");
            
            // Store PKCE parameters
            localStorage.setItem('oauth_code_verifier', this.codeVerifier);
            localStorage.setItem('oauth_code_challenge', this.codeChallenge);
            console.log("[OAUTH] PKCE parameters stored in localStorage");
            
            // Use Android client ID and proper HTTPS redirect for deep linking
            const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID_ANDROID || "1064619689471-7lr8e71tr6h55as83o8gn4bdnhabavpu.apps.googleusercontent.com";
            // Use HTTPS redirect that matches our deep-link configuration
            const redirectUri = 'https://server.be-out-app.dedibox2.philippezenone.net/auth/google/callback';
            const scope = "openid email profile";
            const state = this.base64URLEncode(crypto.getRandomValues(new Uint8Array(32)));
            
            console.log("[OAUTH] Configuration:");
            console.log("  - Client ID:", clientId);
            console.log("  - Redirect URI:", redirectUri);
            console.log("  - Scope:", scope);
            console.log("  - State:", state);
            
            // Store state for verification
            this.oauthState = state;
            console.log("[OAUTH] State stored for verification");
            
            const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
            authUrl.searchParams.set("client_id", clientId);
            authUrl.searchParams.set("redirect_uri", redirectUri);
            authUrl.searchParams.set("response_type", "code");
            authUrl.searchParams.set("scope", scope);
            authUrl.searchParams.set("state", state);
            authUrl.searchParams.set("code_challenge", this.codeChallenge);
            authUrl.searchParams.set("code_challenge_method", "S256");
            authUrl.searchParams.set("prompt", "select_account");
            
            console.log('[OAUTH] Opening OAuth URL in system browser:', authUrl.toString());
            
            // Get Tauri APIs
            const { invoke, listen } = await this._getTauriApis();
            console.log("[OAUTH] Tauri APIs loaded successfully");
            
            // Set up deep link listener before opening the URL
            console.log("[OAUTH] Setting up deep link listener...");
            
            return new Promise(async (resolve, reject) => {
                const timeout = setTimeout(() => {
                    console.error("[OAUTH] Timeout - no callback received after 5 minutes");
                    reject(new Error('OAuth timeout - no callback received'));
                }, 300000); // 5 minute timeout
                
                // Listen for deep link events
                const unlisten = await listen('deep-link://new-url', (event) => {
                    console.log('[OAUTH] Deep link received:', event.payload);
                    clearTimeout(timeout);
                    unlisten();
                    
                    try {
                        // Extract authorization code from deep link
                        const urls = event.payload;
                        if (urls && urls.length > 0) {
                            const callbackUrl = urls[0];
                            console.log('[OAUTH] Processing callback URL:', callbackUrl);
                            this.handleOAuthCallback(callbackUrl).then(resolve).catch(reject);
                        } else {
                            reject(new Error('No URL in deep link callback'));
                        }
                    } catch (error) {
                        console.error('[OAUTH] Error processing deep link:', error);
                        reject(error);
                    }
                });
                
                // Open OAuth URL in system browser
                try {
                    console.log("[OAUTH] Attempting to open URL in system browser...");
                    
                    await invoke('plugin:shell|open', {
                        path: authUrl.toString()
                    });
                    console.log('[OAUTH] OAuth URL opened successfully in system browser');
                    console.log('[OAUTH] Waiting for deep link callback...');
                    
                } catch (error) {
                    console.error('[OAUTH] Shell plugin failed:', error.message);
                    clearTimeout(timeout);
                    unlisten();
                    
                    // CRITICAL: Do NOT fall back to WebView for OAuth as Google blocks embedded browsers
                    reject(new Error(
                        'Cannot open system browser for OAuth. Google requires OAuth to happen in a secure browser, not in embedded WebViews.\n\n' +
                        'Troubleshooting steps:\n' +
                        '1. Ensure shell plugin is properly configured in Tauri\n' +
                        '2. Check Android permissions for opening URLs\n' +
                        '3. Verify the OAuth redirect URI is properly configured in Google Cloud Console\n\n' +
                        'Shell plugin error: ' + error.message
                    ));
                }
            });
            
        } catch (error) {
            console.error('[OAUTH] OAuth error:', error);
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
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID_ANDROID;

        const response = await fetch(`${API_BASE_URL}/auth/mobile/google/token`, {
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
            console.log('[OAUTH CALLBACK] Starting OAuth callback handling...');
            console.log('[OAUTH CALLBACK] Received URL:', url);
            
            try {
                const urlObj = new URL(url);
                console.log('[OAUTH CALLBACK] Parsed URL object:', {
                    protocol: urlObj.protocol,
                    host: urlObj.host,
                    pathname: urlObj.pathname,
                    search: urlObj.search
                });
                
                const code = urlObj.searchParams.get('code');
                const state = urlObj.searchParams.get('state');
                const error = urlObj.searchParams.get('error');
                
                console.log('[OAUTH CALLBACK] URL parameters:', {
                    code: code ? 'present' : 'missing',
                    state: state ? 'present' : 'missing',
                    error: error || 'none'
                });
                
                if (error) {
                    console.error('[OAUTH CALLBACK] OAuth error received:', error);
                    throw new Error(`OAuth error: ${error}`);
                }
                
                if (!code) {
                    console.error('[OAUTH CALLBACK] No authorization code received');
                    throw new Error('No authorization code received in callback');
                }
                
                console.log('[OAUTH CALLBACK] State verification:', {
                    received: state,
                    expected: this.oauthState,
                    matches: state === this.oauthState
                });
                
                if (!state || state !== this.oauthState) {
                    console.error('[OAUTH CALLBACK] State mismatch - possible CSRF attack');
                    throw new Error('Invalid state parameter - possible CSRF attack');
                }
                
                console.log('[OAUTH CALLBACK] Valid OAuth callback received, exchanging code for token...');
                
                const tokenRequestData = {
                    code,
                    codeVerifier: this.codeVerifier,
                    clientId: this.clientId
                };
                
                console.log('[OAUTH CALLBACK] Token exchange request:', {
                    serverUrl: this.serverUrl,
                    endpoint: '/api/mobile-auth/exchange-mobile-token',
                    hasCode: !!code,
                    hasCodeVerifier: !!this.codeVerifier,
                    hasClientId: !!this.clientId
                });
                
                // Exchange authorization code for access token
                const tokenResponse = await fetch(`${this.serverUrl}/api/mobile-auth/exchange-mobile-token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(tokenRequestData),
                });
                
                console.log('[OAUTH CALLBACK] Token exchange response status:', tokenResponse.status);
                
                if (!tokenResponse.ok) {
                    const errorData = await tokenResponse.json();
                    console.error('[OAUTH CALLBACK] Token exchange failed:', errorData);
                    throw new Error(`Token exchange failed: ${errorData.error || tokenResponse.statusText}`);
                }
                
                const tokenData = await tokenResponse.json();
                console.log('[OAUTH CALLBACK] Token exchange successful:', {
                    hasAccessToken: !!tokenData.access_token,
                    hasUser: !!tokenData.user,
                    userEmail: tokenData.user?.email || 'unknown'
                });
                
                // Clean up stored state
                this.oauthState = null;
                this.codeVerifier = null;
                console.log('[OAUTH CALLBACK] Cleanup completed');
                
                // Resolve the OAuth promise if it exists
                if (window.oauthPromise) {
                    console.log('[OAUTH CALLBACK] Resolving OAuth promise...');
                    clearTimeout(window.oauthPromise.timeout);
                    window.oauthPromise.resolve(tokenData);
                    window.oauthPromise = null;
                    console.log('[OAUTH CALLBACK] OAuth promise resolved successfully');
                } else {
                    console.warn('[OAUTH CALLBACK] No OAuth promise found to resolve');
                }
                
                return tokenData;
                
            } catch (error) {
                console.error('[OAUTH CALLBACK] OAuth callback handling failed:', error);
                
                // Reject the OAuth promise if it exists
                if (window.oauthPromise) {
                    console.log('[OAUTH CALLBACK] Rejecting OAuth promise due to error...');
                    clearTimeout(window.oauthPromise.timeout);
                    window.oauthPromise.reject(error);
                    window.oauthPromise = null;
                } else {
                    console.warn('[OAUTH CALLBACK] No OAuth promise found to reject');
                }
                
                throw error;
            }
        }
}

export default new MobileAuthService();
