import { invoke } from "@tauri-apps/api/core";
import { areTauriApisAvailable } from "../utils/platformDetection";

/**
 * Desktop OAuth service for Tauri apps
 * Implements OAuth 2.0 with PKCE flow for native applications
 */
class DesktopAuthService {
    constructor() {
        this.codeVerifier = null;
        this.codeChallenge = null;
    }

    // Check if Tauri is available
    async checkTauriAvailability() {
        return areTauriApisAvailable();
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

    // Start Google OAuth flow for mobile/desktop
    async startGoogleOAuth() {
        try {
            console.log("=== OAUTH FLOW DEBUG ===");
            console.log("Starting OAuth flow...");
            console.log("navigator.userAgent:", navigator.userAgent);
            console.log("window.location:", window.location.href);
            console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);
            console.log("======================");

            // Check if we're actually in Tauri with APIs available
            const isTauri = areTauriApisAvailable();
            console.log("Running in Tauri with APIs:", isTauri);

            if (!isTauri) {
                throw new Error("This OAuth service is for Tauri apps only. Use web OAuth for browsers.");
            }

            // For now, use the desktop OAuth flow for all Tauri platforms
            // This uses a popup window with manual code entry, which is more reliable
            console.log("Using desktop OAuth flow with manual code entry");
            return await this.startDesktopOAuth();
        } catch (error) {
            console.error("OAuth error:", error);
            throw error;
        }
    }

    // Desktop OAuth flow (reliable implementation)
    async startDesktopOAuth() {
        try {
            console.log("Starting desktop OAuth flow...");

            // Generate PKCE parameters
            await this.generatePKCE();

            const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID_DESKTOP;
            if (!clientId) {
                throw new Error("Desktop Google Client ID not configured");
            }

            // Start local HTTP server for OAuth callback
            const callbackUrl = await invoke("open_oauth_url", {
                clientId,
                codeChallenge: this.codeChallenge,
            });

            console.log("Desktop OAuth callback URL:", callbackUrl);

            // Parse the callback URL to get the authorization code
            const url = new URL(callbackUrl);
            const code = url.searchParams.get("code");
            const error = url.searchParams.get("error");

            if (error) {
                throw new Error(`OAuth error: ${error}`);
            }

            if (!code) {
                throw new Error("No authorization code received");
            }

            // Exchange code for token
            return await this.exchangeCodeForTokens("google", code);
        } catch (error) {
            console.error("Desktop OAuth error:", error);
            throw error;
        }
    }

    // Exchange authorization code for tokens
    async exchangeCodeForTokens(provider, authCode, redirectUri = "urn:ietf:wg:oauth:2.0:oob") {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

        const response = await fetch(`${API_BASE_URL}/auth/desktop/${provider}/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                code: authCode,
                codeVerifier: this.codeVerifier,
                redirectUri: redirectUri,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: "Token exchange failed" }));
            throw new Error(errorData.message || "Token exchange failed");
        }

        const data = await response.json();
        return data;
    }

    // Apple Sign In for mobile (simplified placeholder)
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

    // Start Facebook OAuth flow (placeholder)
    async startFacebookOAuth() {
        throw new Error("Facebook desktop OAuth not implemented yet");
    }
}

export default new DesktopAuthService();
