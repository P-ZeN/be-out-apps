import { areTauriApisAvailable } from "../utils/platformDetection";

class NativeMobileAuthService {
    constructor() {
        this.serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        this._tauriApis = null;
    }

    async _getTauriApis() {
        if (!areTauriApisAvailable()) {
            throw new Error("Tauri APIs not available");
        }

        if (!this._tauriApis) {
            try {
                const { invoke } = await import("@tauri-apps/api/core");
                this._tauriApis = { invoke };
            } catch (error) {
                throw new Error("Failed to load Tauri APIs: " + error.message);
            }
        }

        return this._tauriApis;
    }

    async signIn() {
        console.log("[NATIVE_AUTH] Starting native Google Sign-In...");
        
        try {
            const { invoke } = await this._getTauriApis();
            
            // First try to sign in with existing authorized accounts
            console.log("[NATIVE_AUTH] Attempting sign-in with authorized accounts...");
            
            const result = await invoke('google_sign_in', {
                filter_by_authorized_accounts: true,
                auto_select_enabled: true,
                nonce: this._generateNonce()
            });
            
            console.log("[NATIVE_AUTH] Native sign-in result:", result);
            
            // Check if native sign-in was actually successful
            if (!result.success || !result.id_token) {
                const error = result.error || "Native sign-in failed - no token received";
                console.log("[NATIVE_AUTH] Native sign-in failed:", error);
                throw new Error(error);
            }
            
            // Validate the ID token with your server
            const validatedUser = await this.validateTokenWithServer(result.id_token);
            
            console.log("[NATIVE_AUTH] Token validation successful");
            return validatedUser;
            
        } catch (error) {
            console.error("[NATIVE_AUTH] Sign-in failed:", error);
            
            // If authorized accounts failed, try sign-up flow
            if (error.toString().includes("No credentials available")) {
                console.log("[NATIVE_AUTH] No authorized accounts, trying sign-up flow...");
                return this.signUp();
            }
            
            throw error;
        }
    }

    async signUp() {
        console.log("[NATIVE_AUTH] Starting native Google Sign-Up...");
        
        try {
            const { invoke } = await this._getTauriApis();
            
            const result = await invoke('google_sign_in', {
                filterByAuthorizedAccounts: false,
                autoSelectEnabled: false,
                nonce: this._generateNonce()
            });
            
            console.log("[NATIVE_AUTH] Native sign-up successful:", result);
            
            // Validate the ID token with your server
            const validatedUser = await this.validateTokenWithServer(result.idToken);
            
            console.log("[NATIVE_AUTH] Token validation successful");
            return validatedUser;
            
        } catch (error) {
            console.error("[NATIVE_AUTH] Sign-up failed:", error);
            throw error;
        }
    }

    async signOut() {
        console.log("[NATIVE_AUTH] Starting native Google Sign-Out...");
        
        try {
            const { invoke } = await this._getTauriApis();
            
            await invoke('google_sign_out');
            
            console.log("[NATIVE_AUTH] Native sign-out successful");
            
            // Clear any local storage or state
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem('authToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('userProfile');
            }
            
        } catch (error) {
            console.error("[NATIVE_AUTH] Sign-out failed:", error);
            throw error;
        }
    }

    async validateTokenWithServer(idToken) {
        console.log("[NATIVE_AUTH] Validating ID token with server...");
        
        try {
            const response = await fetch(`${this.serverUrl}/api/auth/google/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    idToken: idToken,
                    platform: 'android'
                }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Server validation failed: ${response.status} ${errorData}`);
            }

            const userData = await response.json();
            console.log("[NATIVE_AUTH] Server validation successful");
            
            // Store the validated user data
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('authToken', userData.token);
                localStorage.setItem('refreshToken', userData.refreshToken);
                localStorage.setItem('userProfile', JSON.stringify(userData.user));
            }
            
            return userData;
            
        } catch (error) {
            console.error("[NATIVE_AUTH] Server validation failed:", error);
            throw new Error(`Token validation failed: ${error.message}`);
        }
    }

    _generateNonce() {
        // Generate a random nonce for security
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Method to check if user is currently signed in
    async isSignedIn() {
        if (typeof localStorage === 'undefined') {
            return false;
        }
        
        const token = localStorage.getItem('authToken');
        if (!token) {
            return false;
        }
        
        // TODO: Optionally verify token with server
        return true;
    }

    // Method to get current user profile
    getCurrentUser() {
        if (typeof localStorage === 'undefined') {
            return null;
        }
        
        const userProfile = localStorage.getItem('userProfile');
        if (!userProfile) {
            return null;
        }
        
        try {
            return JSON.parse(userProfile);
        } catch (error) {
            console.error("[NATIVE_AUTH] Failed to parse user profile:", error);
            return null;
        }
    }
}

export default NativeMobileAuthService;
