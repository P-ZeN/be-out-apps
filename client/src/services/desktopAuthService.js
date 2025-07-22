import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { areTauriApisAvailable } from "../utils/platformDetection";

class DesktopAuthService {
    constructor() {
        this.codeVerifier = null;
        this.codeChallenge = null;
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
        if (!areTauriApisAvailable()) {
            throw new Error("This OAuth service is for Tauri apps only.");
        }

        await this.generatePKCE();

        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID_DESKTOP;
        if (!clientId) {
            throw new Error("Google Client ID not configured");
        }

        const redirectUri = "com.beout.app://oauth";
        const scope = "openid email profile";

        const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        authUrl.searchParams.set("client_id", clientId);
        authUrl.searchParams.set("redirect_uri", redirectUri);
        authUrl.searchParams.set("response_type", "code");
        authUrl.search_params.set("scope", scope);
        authUrl.searchParams.set("code_challenge", this.codeChallenge);
        authUrl.searchParams.set("code_challenge_method", "S256");
        authUrl.searchParams.set("access_type", "offline");

        await invoke("plugin:shell|open", { path: authUrl.toString() });

        return this.waitForCallback();
    }

    async waitForCallback() {
        return new Promise((resolve, reject) => {
            const timeout = 5 * 60 * 1000; // 5 minutes

            const unlistenPromise = listen("deep-link-received", async (event) => {
                const unlisten = await unlistenPromise;
                unlisten();
                clearTimeout(timeoutId);

                try {
                    const url = new URL(event.payload);
                    const code = url.searchParams.get("code");
                    const error = url.searchParams.get("error");

                    if (error) {
                        return reject(new Error(`OAuth error: ${error}`));
                    }

                    if (code) {
                        const userInfo = await this.exchangeCodeForToken(code);
                        return resolve(userInfo);
                    }

                    reject(new Error("No code received in callback."));
                } catch (err) {
                    reject(err);
                }
            });

            const timeoutId = setTimeout(async () => {
                const unlisten = await unlistenPromise;
                unlisten();
                reject(new Error("OAuth timeout."));
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
                redirectUri: "com.beout.app://oauth",
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
        }

        return await response.json();
    }
}

export default new DesktopAuthService();
