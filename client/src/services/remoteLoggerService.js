import { areTauriApisAvailable } from './platformDetection';

/**
 * Remote logging service for mobile debugging
 * Sends logs to the server for remote debugging, especially useful for iOS
 */
class RemoteLoggerService {
    constructor() {
        this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        this.sessionId = this.generateSessionId();
        this.deviceInfo = this.getDeviceInfo();
        this.logQueue = [];
        this.isFlushingLogs = false;
        
        // Initialize logging
        this.init();
    }

    generateSessionId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    getDeviceInfo() {
        const userAgent = navigator.userAgent || 'Unknown';
        const platform = navigator.platform || 'Unknown';
        const isTauri = areTauriApisAvailable();
        
        return {
            userAgent,
            platform,
            isTauri,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            sessionId: this.sessionId
        };
    }

    init() {
        // Override console methods to capture all logs
        if (typeof window !== 'undefined') {
            const originalLog = console.log;
            const originalError = console.error;
            const originalWarn = console.warn;
            const originalInfo = console.info;

            console.log = (...args) => {
                originalLog.apply(console, args);
                this.log('info', args.join(' '));
            };

            console.error = (...args) => {
                originalError.apply(console, args);
                this.log('error', args.join(' '));
            };

            console.warn = (...args) => {
                originalWarn.apply(console, args);
                this.log('warn', args.join(' '));
            };

            console.info = (...args) => {
                originalInfo.apply(console, args);
                this.log('info', args.join(' '));
            };

            // Capture unhandled errors
            window.addEventListener('error', (event) => {
                this.log('error', `Unhandled Error: ${event.error?.message || event.message}`, {
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    stack: event.error?.stack
                });
            });

            // Capture unhandled promise rejections
            window.addEventListener('unhandledrejection', (event) => {
                this.log('error', `Unhandled Promise Rejection: ${event.reason}`, {
                    reason: event.reason,
                    promise: event.promise
                });
            });
        }
    }

    log(level, message, metadata = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message: typeof message === 'string' ? message : JSON.stringify(message),
            metadata: {
                ...metadata,
                ...this.deviceInfo
            }
        };

        // Add to queue
        this.logQueue.push(logEntry);

        // Show critical errors on screen for iOS debugging
        if (level === 'error' && areTauriApisAvailable()) {
            this.showErrorOnScreen(message, metadata);
        }

        // Flush logs periodically or when queue gets large
        if (this.logQueue.length >= 10 || level === 'error') {
            this.flushLogs();
        }
    }

    showErrorOnScreen(message, metadata) {
        // Create a visual error display for iOS debugging
        if (typeof document !== 'undefined') {
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                position: fixed;
                top: 20px;
                left: 20px;
                right: 20px;
                background: #ff4444;
                color: white;
                padding: 15px;
                border-radius: 8px;
                z-index: 10000;
                font-family: monospace;
                font-size: 12px;
                max-height: 200px;
                overflow-y: auto;
            `;
            
            errorDiv.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 8px;">DEBUG ERROR (${new Date().toLocaleTimeString()})</div>
                <div style="margin-bottom: 8px;">${message}</div>
                ${metadata ? `<div style="font-size: 10px; opacity: 0.8;">${JSON.stringify(metadata, null, 2)}</div>` : ''}
                <button onclick="this.parentElement.remove()" style="
                    position: absolute;
                    top: 5px;
                    right: 10px;
                    background: none;
                    border: none;
                    color: white;
                    font-size: 16px;
                    cursor: pointer;
                ">×</button>
            `;

            document.body.appendChild(errorDiv);

            // Auto-remove after 10 seconds
            setTimeout(() => {
                if (errorDiv.parentElement) {
                    errorDiv.remove();
                }
            }, 10000);
        }
    }

    async flushLogs() {
        if (this.isFlushingLogs || this.logQueue.length === 0) {
            return;
        }

        this.isFlushingLogs = true;
        const logsToSend = [...this.logQueue];
        this.logQueue = [];

        try {
            const response = await fetch(`${this.apiUrl}/api/debug/logs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    logs: logsToSend,
                    deviceInfo: this.deviceInfo
                })
            });

            if (!response.ok) {
                console.warn('Failed to send remote logs:', response.status);
            }
        } catch (error) {
            console.warn('Failed to send remote logs:', error);
            // Re-add logs to queue if sending failed
            this.logQueue.unshift(...logsToSend);
        } finally {
            this.isFlushingLogs = false;
        }
    }

    // Manual logging methods
    debug(message, metadata) {
        this.log('debug', message, metadata);
    }

    info(message, metadata) {
        this.log('info', message, metadata);
    }

    warn(message, metadata) {
        this.log('warn', message, metadata);
    }

    error(message, metadata) {
        this.log('error', message, metadata);
    }

    // Special method for Google OAuth debugging
    googleAuthStep(step, data) {
        this.log('info', `GOOGLE_AUTH_${step}`, {
            step,
            data: typeof data === 'object' ? JSON.stringify(data) : data,
            timestamp: Date.now()
        });
    }
}

// Create singleton instance
const remoteLogger = new RemoteLoggerService();

export default remoteLogger;
