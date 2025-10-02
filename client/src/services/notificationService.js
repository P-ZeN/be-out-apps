// Notification Service - Client-side service for managing notification preferences
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

class NotificationService {
    constructor() {
        this.localStorageKey = 'beOutNotificationSettings';
        this.vapidPublicKey = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the notification service
     */
    async initialize() {
        if (this.isInitialized) return;

        try {
            // Get VAPID public key for push notifications
            const response = await fetch(`${API_BASE_URL}/notifications/vapid-public-key`);
            if (response.ok) {
                const data = await response.json();
                this.vapidPublicKey = data.publicKey;
            }

            this.isInitialized = true;
        } catch (error) {
            console.error('Error initializing notification service:', error);
        }
    }

    /**
     * Get notification preferences from localStorage
     */
    getLocalPreferences() {
        const stored = localStorage.getItem(this.localStorageKey);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (error) {
                console.error('Error parsing stored notification preferences:', error);
            }
        }

        // Return default preferences
        return {
            nativeNotifications: true,
            smsNotifications: false,
            emailNotifications: true,
            reminder24h: true,
            reminder2h: false,
            beOutNews: true
        };
    }

    /**
     * Save notification preferences to localStorage
     */
    setLocalPreferences(preferences) {
        localStorage.setItem(this.localStorageKey, JSON.stringify(preferences));
    }

    /**
     * Get notification preferences from server
     */
    async getServerPreferences() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return null;

            const response = await fetch(`${API_BASE_URL}/notifications/preferences`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data.preferences;
            }
        } catch (error) {
            console.error('Error fetching server preferences:', error);
        }
        return null;
    }

    /**
     * Update notification preferences on server
     */
    async updateServerPreferences(preferences) {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No authentication token');

            const response = await fetch(`${API_BASE_URL}/notifications/preferences`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ preferences })
            });

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating server preferences:', error);
            throw error;
        }
    }

    /**
     * Sync preferences between localStorage and server
     */
    async syncPreferences() {
        try {
            const localPrefs = this.getLocalPreferences();
            const serverPrefs = await this.getServerPreferences();

            if (serverPrefs) {
                // Server has preferences, use them and update localStorage
                this.setLocalPreferences(serverPrefs);
                return serverPrefs;
            } else {
                // No server preferences, send local preferences to server
                await this.updateServerPreferences(localPrefs);
                return localPrefs;
            }
        } catch (error) {
            console.error('Error syncing preferences:', error);
            // Fall back to local preferences if sync fails
            return this.getLocalPreferences();
        }
    }

    /**
     * Update preferences both locally and on server
     */
    async updatePreferences(preferences) {
        // Update localStorage immediately for responsive UI
        this.setLocalPreferences(preferences);

        try {
            // Update server in background
            await this.updateServerPreferences(preferences);

            // Handle push notification subscription changes
            if (preferences.nativeNotifications !== this.getLocalPreferences().nativeNotifications) {
                if (preferences.nativeNotifications) {
                    await this.subscribeToPushNotifications();
                } else {
                    await this.unsubscribeFromPushNotifications();
                }
            }

        } catch (error) {
            console.error('Error updating preferences on server:', error);
            // Don't revert localStorage changes - let user see their changes
            // and retry sync later
        }
    }

    /**
     * Check if push notifications are supported
     */
    isPushNotificationSupported() {
        return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    }

    /**
     * Request permission for native notifications
     */
    async requestNotificationPermission() {
        if (!this.isPushNotificationSupported()) {
            throw new Error('Push notifications are not supported');
        }

        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    /**
     * Subscribe to push notifications
     */
    async subscribeToPushNotifications() {
        if (!this.isPushNotificationSupported()) {
            console.warn('Push notifications not supported');
            return false;
        }

        if (!this.vapidPublicKey) {
            await this.initialize();
            if (!this.vapidPublicKey) {
                throw new Error('VAPID public key not available');
            }
        }

        try {
            // Request permission
            const hasPermission = await this.requestNotificationPermission();
            if (!hasPermission) {
                throw new Error('Notification permission denied');
            }

            // Register service worker
            const registration = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;

            // Subscribe to push notifications
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
            });

            // Send subscription to server
            await this.registerPushSubscription(subscription);

            console.log('Successfully subscribed to push notifications');
            return true;

        } catch (error) {
            console.error('Error subscribing to push notifications:', error);
            throw error;
        }
    }

    /**
     * Unsubscribe from push notifications
     */
    async unsubscribeFromPushNotifications() {
        try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                    await subscription.unsubscribe();
                    await this.unregisterPushSubscription(subscription.endpoint);
                }
            }
            console.log('Successfully unsubscribed from push notifications');
            return true;
        } catch (error) {
            console.error('Error unsubscribing from push notifications:', error);
            throw error;
        }
    }

    /**
     * Register push subscription with server
     */
    async registerPushSubscription(subscription) {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token');

        const response = await fetch(`${API_BASE_URL}/notifications/push/subscribe`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ subscription })
        });

        if (!response.ok) {
            throw new Error(`Failed to register push subscription: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Unregister push subscription from server
     */
    async unregisterPushSubscription(endpoint) {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token');

        const response = await fetch(`${API_BASE_URL}/notifications/push/unsubscribe`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ endpoint })
        });

        if (!response.ok) {
            throw new Error(`Failed to unregister push subscription: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Send test notification
     */
    async sendTestNotification() {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token');

        const response = await fetch(`${API_BASE_URL}/notifications/push/test`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to send test notification: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Get notification analytics
     */
    async getNotificationHistory(days = 30) {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token');

        const response = await fetch(`${API_BASE_URL}/notifications/history?days=${days}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to get notification history: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Convert VAPID key to Uint8Array
     */
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
}

export default new NotificationService();
