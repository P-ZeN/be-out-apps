/**
 * Secure Storage Service for Mobile Apps
 * Handles persistent credential storage across app sessions
 */

import { areTauriApisAvailable } from "../utils/platformDetection";

class SecureStorageService {
    constructor() {
        this.isTauri = areTauriApisAvailable();
        this.storagePrefix = 'beout_';
    }

    /**
     * Store credentials securely
     */
    async storeCredentials(credentials) {
        try {
            const data = {
                ...credentials,
                timestamp: Date.now(),
                version: '1.0'
            };

            if (this.isTauri) {
                // For mobile apps, use enhanced localStorage with additional security
                // Note: In future versions, we could integrate with Tauri's keyring plugin
                await this._storeSecurely('credentials', JSON.stringify(data));
            } else {
                // Web fallback - standard localStorage
                localStorage.setItem(`${this.storagePrefix}credentials`, JSON.stringify(data));
            }

            console.log('[SECURE_STORAGE] Credentials stored successfully');
            return true;
        } catch (error) {
            console.error('[SECURE_STORAGE] Failed to store credentials:', error);
            return false;
        }
    }

    /**
     * Retrieve stored credentials
     */
    async getStoredCredentials() {
        try {
            let credentialsStr;

            if (this.isTauri) {
                credentialsStr = await this._retrieveSecurely('credentials');
            } else {
                credentialsStr = localStorage.getItem(`${this.storagePrefix}credentials`);
            }

            if (!credentialsStr) {
                return null;
            }

            const credentials = JSON.parse(credentialsStr);
            
            // Check if credentials are expired (30 days)
            const expirationTime = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
            if (credentials.timestamp && (Date.now() - credentials.timestamp) > expirationTime) {
                console.log('[SECURE_STORAGE] Credentials expired, removing...');
                await this.clearCredentials();
                return null;
            }

            console.log('[SECURE_STORAGE] Credentials retrieved successfully');
            return credentials;
        } catch (error) {
            console.error('[SECURE_STORAGE] Failed to retrieve credentials:', error);
            return null;
        }
    }

    /**
     * Clear stored credentials
     */
    async clearCredentials() {
        try {
            if (this.isTauri) {
                await this._removeSecurely('credentials');
            } else {
                localStorage.removeItem(`${this.storagePrefix}credentials`);
            }

            console.log('[SECURE_STORAGE] Credentials cleared successfully');
            return true;
        } catch (error) {
            console.error('[SECURE_STORAGE] Failed to clear credentials:', error);
            return false;
        }
    }

    /**
     * Store user preferences (non-sensitive data)
     */
    async storeUserPreferences(preferences) {
        try {
            const data = {
                ...preferences,
                timestamp: Date.now()
            };

            const key = `${this.storagePrefix}preferences`;
            if (this.isTauri) {
                localStorage.setItem(key, JSON.stringify(data));
            } else {
                localStorage.setItem(key, JSON.stringify(data));
            }

            return true;
        } catch (error) {
            console.error('[SECURE_STORAGE] Failed to store preferences:', error);
            return false;
        }
    }

    /**
     * Get user preferences
     */
    async getUserPreferences() {
        try {
            const key = `${this.storagePrefix}preferences`;
            const preferencesStr = localStorage.getItem(key);
            
            if (!preferencesStr) {
                return null;
            }

            return JSON.parse(preferencesStr);
        } catch (error) {
            console.error('[SECURE_STORAGE] Failed to retrieve preferences:', error);
            return null;
        }
    }

    /**
     * Private method to store data securely (Tauri-specific)
     */
    async _storeSecurely(key, value) {
        if (this.isTauri) {
            try {
                // Use Tauri's secure store plugin if available
                const { Store } = await import('@tauri-apps/plugin-store');
                const store = new Store('secure.dat');
                await store.set(key, value);
                await store.save();
                console.log('[SECURE_STORAGE] Data stored using Tauri store plugin');
                return true;
            } catch (error) {
                console.warn('[SECURE_STORAGE] Tauri store not available, falling back to enhanced localStorage:', error);
                try {
                    // Enhanced localStorage storage with obfuscation
                    const obfuscatedValue = btoa(unescape(encodeURIComponent(value)));
                    localStorage.setItem(`${this.storagePrefix}secure_${key}`, obfuscatedValue);
                    return true;
                } catch (fallbackError) {
                    // Final fallback to regular localStorage
                    localStorage.setItem(`${this.storagePrefix}${key}`, value);
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Private method to retrieve data securely (Tauri-specific)
     */
    async _retrieveSecurely(key) {
        if (this.isTauri) {
            try {
                // Use Tauri's secure store plugin if available
                const { Store } = await import('@tauri-apps/plugin-store');
                const store = new Store('secure.dat');
                const value = await store.get(key);
                if (value !== null && value !== undefined) {
                    console.log('[SECURE_STORAGE] Data retrieved using Tauri store plugin');
                    return value;
                }
            } catch (error) {
                console.warn('[SECURE_STORAGE] Tauri store not available, falling back to localStorage:', error);
            }
            
            try {
                // Enhanced localStorage retrieval
                const obfuscatedValue = localStorage.getItem(`${this.storagePrefix}secure_${key}`);
                if (obfuscatedValue) {
                    return decodeURIComponent(escape(atob(obfuscatedValue)));
                }
                
                // Fallback to regular localStorage
                return localStorage.getItem(`${this.storagePrefix}${key}`);
            } catch (error) {
                // Final fallback to regular localStorage
                return localStorage.getItem(`${this.storagePrefix}${key}`);
            }
        }
        return null;
    }

    /**
     * Private method to remove data securely (Tauri-specific)
     */
    async _removeSecurely(key) {
        if (this.isTauri) {
            try {
                // Use Tauri's secure store plugin if available
                const { Store } = await import('@tauri-apps/plugin-store');
                const store = new Store('secure.dat');
                await store.delete(key);
                await store.save();
                console.log('[SECURE_STORAGE] Data removed using Tauri store plugin');
            } catch (error) {
                console.warn('[SECURE_STORAGE] Tauri store not available, falling back to localStorage removal:', error);
            }
            
            try {
                localStorage.removeItem(`${this.storagePrefix}secure_${key}`);
                localStorage.removeItem(`${this.storagePrefix}${key}`); // Remove fallback too
                return true;
            } catch (error) {
                console.error('[SECURE_STORAGE] Error removing secure data:', error);
                return false;
            }
        }
        return false;
    }

    /**
     * Check if credentials are stored
     */
    async hasStoredCredentials() {
        const credentials = await this.getStoredCredentials();
        return credentials !== null && credentials.token;
    }

    /**
     * Store remember me preference
     */
    async setRememberMe(remember) {
        try {
            localStorage.setItem(`${this.storagePrefix}remember_me`, remember.toString());
            return true;
        } catch (error) {
            console.error('[SECURE_STORAGE] Failed to store remember preference:', error);
            return false;
        }
    }

    /**
     * Get remember me preference
     */
    getRememberMe() {
        try {
            const remember = localStorage.getItem(`${this.storagePrefix}remember_me`);
            return remember === 'true';
        } catch (error) {
            return false;
        }
    }
}

export default new SecureStorageService();
