// Notification Background Job Processor
import notificationService from '../services/notificationService.js';

class NotificationProcessor {
    constructor() {
        this.isRunning = false;
        this.interval = null;
        this.processingInterval = 30000; // Process every 30 seconds
    }

    /**
     * Start the background notification processor
     */
    start() {
        if (this.isRunning) {
            console.log('Notification processor is already running');
            return;
        }

        console.log('Starting notification background processor...');
        this.isRunning = true;

        // Process notifications immediately
        this.processNotifications();

        // Set up interval for continuous processing
        this.interval = setInterval(() => {
            this.processNotifications();
        }, this.processingInterval);

        console.log(`Notification processor started with ${this.processingInterval / 1000}s interval`);
    }

    /**
     * Stop the background notification processor
     */
    stop() {
        if (!this.isRunning) {
            console.log('Notification processor is not running');
            return;
        }

        console.log('Stopping notification background processor...');
        this.isRunning = false;

        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        console.log('Notification processor stopped');
    }

    /**
     * Process pending notifications
     */
    async processNotifications() {
        if (!this.isRunning) {
            return;
        }

        try {
            const startTime = Date.now();
            const results = await notificationService.processPendingNotifications();
            const processingTime = Date.now() - startTime;

            // Log results if there was activity
            if (results.processed > 0) {
                console.log(`[NotificationProcessor] Processed ${results.processed} notifications in ${processingTime}ms`);
                console.log(`[NotificationProcessor] Successful: ${results.successful}, Failed: ${results.failed}`);
            }

            // Log performance warning if processing takes too long
            if (processingTime > 10000) { // 10 seconds
                console.warn(`[NotificationProcessor] Slow processing detected: ${processingTime}ms for ${results.processed} notifications`);
            }

        } catch (error) {
            console.error('[NotificationProcessor] Error processing notifications:', error);

            // Don't stop the processor on errors - just log and continue
            // This ensures temporary database issues don't kill the notification system
        }
    }

    /**
     * Get processor status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            processingInterval: this.processingInterval,
            uptime: this.isRunning ? Date.now() - this.startTime : 0
        };
    }

    /**
     * Update processing interval
     * @param {number} intervalMs - New interval in milliseconds
     */
    setInterval(intervalMs) {
        if (intervalMs < 5000) {
            throw new Error('Processing interval cannot be less than 5 seconds');
        }

        this.processingInterval = intervalMs;

        if (this.isRunning) {
            // Restart with new interval
            this.stop();
            setTimeout(() => this.start(), 1000);
        }

        console.log(`Notification processor interval updated to ${intervalMs / 1000}s`);
    }

    /**
     * Process notifications immediately (manual trigger)
     */
    async triggerProcessing() {
        console.log('[NotificationProcessor] Manual processing triggered');
        await this.processNotifications();
    }
}

// Create singleton instance
const notificationProcessor = new NotificationProcessor();

// Auto-start processor when module is loaded
if (process.env.NODE_ENV !== 'test') {
    // Give the server time to start up before beginning notification processing
    setTimeout(() => {
        notificationProcessor.start();
    }, 5000);
}

export default notificationProcessor;
