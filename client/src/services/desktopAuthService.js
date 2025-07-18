import { invoke } from "@tauri-apps/api/core";

/**
 * Desktop OAuth service for Tauri apps
 * Implements OAuth 2.0 with PKCE flow for native applications
 */
class DesktopAuthService {
    constructor() {
        this.codeVerifier = null;
        this.codeChallenge = null;
    }

    // Generate PKCE code verifier and challenge
    generatePKCE() {
        // Generate a cryptographically random code verifier
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        this.codeVerifier = this.base64URLEncode(array);

        // Create code challenge from verifier
        return crypto.subtle.digest("SHA-256", new TextEncoder().encode(this.codeVerifier)).then((hash) => {
            this.codeChallenge = this.base64URLEncode(new Uint8Array(hash));
            return {
                codeVerifier: this.codeVerifier,
                codeChallenge: this.codeChallenge,
            };
        });
    }

    base64URLEncode(array) {
        return btoa(String.fromCharCode(...array))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=/g, "");
    }

    // Start Google OAuth flow for desktop
    async startGoogleOAuth() {
        try {
            const pkce = await this.generatePKCE();

            const params = new URLSearchParams({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID_DESKTOP || import.meta.env.VITE_GOOGLE_CLIENT_ID,
                redirect_uri: "urn:ietf:wg:oauth:2.0:oob", // For desktop apps
                response_type: "code",
                scope: "openid email profile",
                code_challenge: pkce.codeChallenge,
                code_challenge_method: "S256",
                access_type: "offline",
            });

            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

            // Open browser and get authorization code
            const authCode = await invoke("open_oauth_url", { url: authUrl });

            if (authCode) {
                return this.exchangeCodeForTokens("google", authCode);
            }

            throw new Error("Authorization cancelled");
        } catch (error) {
            console.error("Desktop Google OAuth error:", error);
            throw error;
        }
    }

    // Exchange authorization code for tokens
    async exchangeCodeForTokens(provider, authCode) {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

        const response = await fetch(`${API_BASE_URL}/auth/desktop/${provider}/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                code: authCode,
                codeVerifier: this.codeVerifier,
                redirectUri: "urn:ietf:wg:oauth:2.0:oob",
            }),
        });

        if (!response.ok) {
            throw new Error("Token exchange failed");
        }

        const data = await response.json();
        return data;
    }

    // Start Facebook OAuth flow for desktop (if needed)
    async startFacebookOAuth() {
        // Facebook OAuth implementation would be similar
        // but Facebook has different endpoints and parameters
        throw new Error("Facebook desktop OAuth not implemented yet");
    }
}

export default new DesktopAuthService();
