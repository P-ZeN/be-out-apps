import express from "express";
import fs from "fs/promises";
import path from "path";

const router = express.Router();

// Store logs in memory for quick access (production should use a database)
const debugSessions = new Map();

// Log file path
const LOG_DIR = process.env.DEBUG_LOG_DIR || './debug-logs';
const ensureLogDir = async () => {
    try {
        await fs.mkdir(LOG_DIR, { recursive: true });
    } catch (error) {
        console.error('Failed to create log directory:', error);
    }
};

// Initialize log directory
ensureLogDir();

// Endpoint to receive logs from mobile devices
router.post("/logs", async (req, res) => {
    try {
        const { sessionId, logs, deviceInfo } = req.body;

        if (!sessionId || !logs || !Array.isArray(logs)) {
            return res.status(400).json({ error: "Invalid log data" });
        }

        // Store in memory
        if (!debugSessions.has(sessionId)) {
            debugSessions.set(sessionId, {
                deviceInfo,
                logs: [],
                createdAt: new Date(),
                lastActivity: new Date()
            });
        }

        const session = debugSessions.get(sessionId);
        session.logs.push(...logs);
        session.lastActivity = new Date();

        // Write to file for persistence
        const logFileName = `${sessionId}.json`;
        const logFilePath = path.join(LOG_DIR, logFileName);

        try {
            await fs.writeFile(logFilePath, JSON.stringify({
                sessionId,
                deviceInfo,
                logs: session.logs,
                createdAt: session.createdAt,
                lastActivity: session.lastActivity
            }, null, 2));
        } catch (writeError) {
            console.error('Failed to write log file:', writeError);
        }

        // Log critical errors to server console
        const criticalLogs = logs.filter(log => log.level === 'error');
        if (criticalLogs.length > 0) {
            console.log(`\n=== MOBILE DEBUG ERROR (${sessionId}) ===`);
            console.log(`Device: ${deviceInfo.platform} - ${deviceInfo.userAgent}`);
            criticalLogs.forEach(log => {
                console.log(`[${log.timestamp}] ${log.message}`);
                if (log.metadata && log.metadata.stack) {
                    console.log(`Stack: ${log.metadata.stack}`);
                }
            });
            console.log('=== END MOBILE DEBUG ERROR ===\n');
        }

        res.json({
            success: true,
            received: logs.length,
            sessionId
        });

    } catch (error) {
        console.error("Error receiving debug logs:", error);
        res.status(500).json({ error: "Failed to process logs" });
    }
});

// Endpoint to view logs (for debugging)
router.get("/sessions", (req, res) => {
    const sessions = Array.from(debugSessions.entries()).map(([sessionId, data]) => ({
        sessionId,
        deviceInfo: data.deviceInfo,
        logCount: data.logs.length,
        createdAt: data.createdAt,
        lastActivity: data.lastActivity,
        hasErrors: data.logs.some(log => log.level === 'error')
    }));

    res.json({ sessions });
});

// Endpoint to view specific session logs
router.get("/sessions/:sessionId", (req, res) => {
    const { sessionId } = req.params;
    const session = debugSessions.get(sessionId);

    if (!session) {
        return res.status(404).json({ error: "Session not found" });
    }

    res.json({
        sessionId,
        deviceInfo: session.deviceInfo,
        logs: session.logs,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity
    });
});

// Endpoint to view logs in HTML format for easy reading
router.get("/sessions/:sessionId/view", (req, res) => {
    const { sessionId } = req.params;
    const session = debugSessions.get(sessionId);

    if (!session) {
        return res.status(404).send('<h1>Session not found</h1>');
    }

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Debug Logs - ${sessionId}</title>
        <style>
            body { font-family: monospace; padding: 20px; background: #1a1a1a; color: #fff; }
            .header { background: #333; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .log-entry { margin: 10px 0; padding: 10px; border-radius: 4px; border-left: 4px solid #666; }
            .log-error { background: #2d1b1b; border-left-color: #ff4444; }
            .log-warn { background: #2d2a1b; border-left-color: #ffaa00; }
            .log-info { background: #1b2d2d; border-left-color: #00aaff; }
            .log-debug { background: #1b1d2d; border-left-color: #aa00ff; }
            .timestamp { color: #888; font-size: 0.9em; }
            .metadata { color: #aaa; font-size: 0.8em; margin-top: 5px; }
            .refresh { position: fixed; top: 20px; right: 20px; padding: 10px; background: #444; color: white; text-decoration: none; border-radius: 4px; }
        </style>
        <script>
            // Auto-refresh every 5 seconds
            setTimeout(() => window.location.reload(), 5000);
        </script>
    </head>
    <body>
        <a href="javascript:window.location.reload()" class="refresh">Refresh</a>
        <div class="header">
            <h1>Debug Session: ${sessionId}</h1>
            <p><strong>Device:</strong> ${session.deviceInfo.platform}</p>
            <p><strong>User Agent:</strong> ${session.deviceInfo.userAgent}</p>
            <p><strong>Is Tauri:</strong> ${session.deviceInfo.isTauri}</p>
            <p><strong>Created:</strong> ${session.createdAt}</p>
            <p><strong>Last Activity:</strong> ${session.lastActivity}</p>
            <p><strong>Total Logs:</strong> ${session.logs.length}</p>
        </div>

        ${session.logs.map(log => `
            <div class="log-entry log-${log.level}">
                <div class="timestamp">[${log.timestamp}] ${log.level.toUpperCase()}</div>
                <div>${log.message}</div>
                ${log.metadata && Object.keys(log.metadata).length > 2 ?
                    `<div class="metadata">${JSON.stringify(log.metadata, null, 2)}</div>` : ''}
            </div>
        `).join('')}
    </body>
    </html>
    `;

    res.send(html);
});

// Clean up old sessions (older than 24 hours)
setInterval(() => {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    for (const [sessionId, session] of debugSessions.entries()) {
        if (session.lastActivity < dayAgo) {
            debugSessions.delete(sessionId);
            // Also delete log file
            const logFilePath = path.join(LOG_DIR, `${sessionId}.json`);
            fs.unlink(logFilePath).catch(() => {}); // Ignore errors
        }
    }
}, 60 * 60 * 1000); // Run every hour

export default router;
