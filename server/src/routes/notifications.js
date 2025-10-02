// Notification API Routes
import { Router } from 'express';
import notificationService from '../services/notificationService.js';
import pushNotificationService from '../services/pushNotificationService.js';
import authenticateToken from '../middleware/authenticateToken.js';

const router = Router();

/**
 * Get user notification preferences
 * GET /api/notifications/preferences
 */
router.get('/preferences', authenticateToken, async (req, res) => {
    try {
        const preferences = await notificationService.getUserPreferences(req.user.userId);
        res.json({
            success: true,
            preferences
        });
    } catch (error) {
        console.error('Error getting notification preferences:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get notification preferences'
        });
    }
});

/**
 * Update user notification preferences
 * POST /api/notifications/preferences
 */
router.post('/preferences', authenticateToken, async (req, res) => {
    try {
        const { preferences } = req.body;

        if (!preferences || typeof preferences !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Invalid preferences data'
            });
        }

        await notificationService.updateUserPreferences(req.user.userId, preferences);

        res.json({
            success: true,
            message: 'Notification preferences updated successfully'
        });
    } catch (error) {
        console.error('Error updating notification preferences:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update notification preferences'
        });
    }
});

/**
 * Register push notification subscription
 * POST /api/notifications/push/subscribe
 */
router.post('/push/subscribe', authenticateToken, async (req, res) => {
    try {
        const { subscription } = req.body;
        const userAgent = req.get('User-Agent') || '';

        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return res.status(400).json({
                success: false,
                error: 'Invalid subscription data'
            });
        }

        await pushNotificationService.registerSubscription(
            req.user.userId,
            subscription,
            userAgent
        );

        res.json({
            success: true,
            message: 'Push subscription registered successfully'
        });
    } catch (error) {
        console.error('Error registering push subscription:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to register push subscription'
        });
    }
});

/**
 * Unregister push notification subscription
 * POST /api/notifications/push/unsubscribe
 */
router.post('/push/unsubscribe', authenticateToken, async (req, res) => {
    try {
        const { endpoint } = req.body;

        if (!endpoint) {
            return res.status(400).json({
                success: false,
                error: 'Endpoint is required'
            });
        }

        await pushNotificationService.unregisterSubscription(req.user.userId, endpoint);

        res.json({
            success: true,
            message: 'Push subscription unregistered successfully'
        });
    } catch (error) {
        console.error('Error unregistering push subscription:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to unregister push subscription'
        });
    }
});

/**
 * Test push notification
 * POST /api/notifications/push/test
 */
router.post('/push/test', authenticateToken, async (req, res) => {
    try {
        const result = await pushNotificationService.sendTestNotification(req.user.userId);

        if (result.success) {
            res.json({
                success: true,
                message: 'Test notification sent successfully',
                sentTo: result.sentTo,
                totalSubscriptions: result.totalSubscriptions
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send test notification'
        });
    }
});

/**
 * Get notification history for user
 * GET /api/notifications/history
 */
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const analytics = await notificationService.getNotificationAnalytics(req.user.userId, days);

        res.json({
            success: true,
            analytics,
            period: `${days} days`
        });
    } catch (error) {
        console.error('Error getting notification history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get notification history'
        });
    }
});

/**
 * Get VAPID public key for push notifications
 * GET /api/notifications/vapid-public-key
 */
router.get('/vapid-public-key', (req, res) => {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;

    if (!vapidPublicKey) {
        return res.status(500).json({
            success: false,
            error: 'VAPID public key not configured'
        });
    }

    res.json({
        success: true,
        publicKey: vapidPublicKey
    });
});

/**
 * Manual notification sending (for testing/admin use)
 * POST /api/notifications/send
 */
router.post('/send', authenticateToken, async (req, res) => {
    try {
        const { userId, notificationType, channel, messageTemplate, templateData, scheduledFor } = req.body;

        // Only allow users to send to themselves, or admins to send to anyone
        if (userId !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized to send notification to other users'
            });
        }

        const targetUserId = userId || req.user.userId;
        const scheduleTime = scheduledFor ? new Date(scheduledFor) : new Date();

        const result = await notificationService.scheduleNotification({
            userId: targetUserId,
            notificationType,
            channel,
            scheduledFor: scheduleTime,
            messageTemplate,
            templateData: templateData || {}
        });

        res.json(result);
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send notification'
        });
    }
});

/**
 * Webhook endpoint for handling notification delivery status
 * This will be extended when SMS is implemented
 */
router.post('/webhook/:provider', async (req, res) => {
    try {
        const { provider } = req.params;
        const payload = req.body;

        console.log(`Received webhook from ${provider}:`, payload);

        // For now, just acknowledge receipt
        // TODO: Process delivery status updates

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ success: false });
    }
});

export default router;
