/**
 * Remote Debug Logger for Mobile Applications
 * Sends logs to server for debugging mobile issues when local logging is not available
 */

import { getIsTauriApp, getPlatformType } from './platformDetection';

class DebugLogger {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.logs = [];
        this.isEnabled = import.meta.env.DEV || import.meta.env.VITE_DEBUG_LOGGING === 'true';
        this.serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        this.flushInterval = 5000; // Send logs every 5 seconds
        this.maxLogsBeforeFlush = 50;
        this.deviceInfo = this.getDeviceInfo();

        if (this.isEnabled) {
            this.startAutoFlush();
            this.logInfo('Debug logger initialized', { sessionId: this.sessionId });
        }
    }

    generateSessionId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        return `debug_${timestamp}_${random}`;
    }

    getDeviceInfo() {
        const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
        const platform = getPlatformType();
        const isTauri = getIsTauriApp();

        return {
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            platform,
            userAgent,
            isTauri,
            url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
            screen: typeof window !== 'undefined' && window.screen ? {
                width: window.screen.width,
                height: window.screen.height
            } : null
        };
    }

    log(level, message, metadata = {}) {
        if (!this.isEnabled) return;

        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            metadata: {
                sessionId: this.sessionId,
                ...metadata
            }
        };

        this.logs.push(logEntry);

        // Also log to console for immediate feedback
        const consoleMethod = console[level] || console.log;
        consoleMethod(`[DEBUG-${level.toUpperCase()}] ${message}`, metadata);

        // Flush immediately for errors
        if (level === 'error' || this.logs.length >= this.maxLogsBeforeFlush) {
            this.flush();
        }
    }

    logError(message, error = null, metadata = {}) {
        const errorMetadata = {
            ...metadata
        };

        if (error) {
            errorMetadata.error = {
                name: error.name,
                message: error.message,
                stack: error.stack
            };
        }

        this.log('error', message, errorMetadata);
    }

    logWarn(message, metadata = {}) {
        this.log('warn', message, metadata);
    }

    logInfo(message, metadata = {}) {
        this.log('info', message, metadata);
    }

    logDebug(message, metadata = {}) {
        this.log('debug', message, metadata);
    }

    // Special method for OAuth debugging
    logOAuthEvent(event, details = {}) {
        this.logInfo(`OAuth Event: ${event}`, {
            oauthEvent: event,
            ...details
        });
    }

    // Special method for Tauri plugin debugging
    logTauriPluginEvent(plugin, method, details = {}) {
        this.logInfo(`Tauri Plugin: ${plugin}.${method}`, {
            tauriPlugin: plugin,
            tauriMethod: method,
            ...details
        });
    }

    async flush() {
        if (!this.isEnabled || this.logs.length === 0) return;

        const logsToSend = [...this.logs];
        this.logs = []; // Clear the queue

        try {
            const response = await fetch(`${this.serverUrl}/api/debug/logs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    deviceInfo: this.deviceInfo,
                    logs: logsToSend
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log(`[DEBUG-LOGGER] Sent ${result.received} logs to server`);

        } catch (error) {
            console.error('[DEBUG-LOGGER] Failed to send logs to server:', error);
            // Put logs back in the queue to retry later
            this.logs.unshift(...logsToSend);
        }
    }

    startAutoFlush() {
        setInterval(() => {
            this.flush();
        }, this.flushInterval);

        // Flush when page unloads (for mobile apps)
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => {
                this.flush();
            });

            // For mobile apps, also flush on visibility change
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.flush();
                }
            });
        }
    }

    // Method to get the debug session URL for viewing logs
    getDebugUrl() {
        return `${this.serverUrl}/api/debug/sessions/${this.sessionId}/view`;
    }

    // Method to manually trigger a test log (useful for testing)
    test() {
        this.logInfo('Debug logger test', {
            test: true,
            timestamp: new Date().toISOString()
        });
        return this.getDebugUrl();
    }
}

// Create a singleton instance
const debugLogger = new DebugLogger();

export default debugLogger;
export { debugLogger };

// Export convenience methods
export const logError = (message, error, metadata) => debugLogger.logError(message, error, metadata);
export const logWarn = (message, metadata) => debugLogger.logWarn(message, metadata);
export const logInfo = (message, metadata) => debugLogger.logInfo(message, metadata);
export const logDebug = (message, metadata) => debugLogger.logDebug(message, metadata);
export const logOAuthEvent = (event, details) => debugLogger.logOAuthEvent(event, details);
export const logTauriPluginEvent = (plugin, method, details) => debugLogger.logTauriPluginEvent(plugin, method, details);
export const getDebugUrl = () => debugLogger.getDebugUrl();
export const testDebugLogger = () => debugLogger.test();
