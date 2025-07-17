import { Box, Typography, Chip, Stack, IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";
import { useState } from "react";
import { getIsTauriApp, getPlatformType, isWebApp } from "../utils/platformDetection";

/**
 * Debug component to help verify platform detection during development
 * This should be removed or hidden in production
 */
const PlatformDebug = () => {
    const [isVisible, setIsVisible] = useState(true);
    const isTauri = getIsTauriApp();
    const platformType = getPlatformType();
    const isWeb = isWebApp();

    // Only show in development mode
    if (process.env.NODE_ENV === "production" || !isVisible) {
        return null;
    }

    return (
        <Box
            sx={{
                position: "fixed",
                top: 16,
                right: 16,
                zIndex: 9999,
                bgcolor: "rgba(0,0,0,0.8)",
                color: "white",
                p: 2,
                borderRadius: 2,
                minWidth: 200,
            }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="h6">Platform Debug</Typography>
                <IconButton size="small" onClick={() => setIsVisible(false)} sx={{ color: "white", ml: 1 }}>
                    <Close fontSize="small" />
                </IconButton>
            </Box>
            <Stack spacing={1}>
                <div>
                    <Typography variant="body2">Platform Type:</Typography>
                    <Chip label={platformType} color={isTauri ? "success" : "info"} size="small" />
                </div>
                <div>
                    <Typography variant="body2">Is Tauri App:</Typography>
                    <Chip label={isTauri ? "Yes" : "No"} color={isTauri ? "success" : "error"} size="small" />
                </div>
                <div>
                    <Typography variant="body2">Is Web App:</Typography>
                    <Chip label={isWeb ? "Yes" : "No"} color={isWeb ? "info" : "default"} size="small" />
                </div>
                <div>
                    <Typography variant="body2">Protocol:</Typography>
                    <Typography variant="caption">
                        {typeof window !== "undefined" ? window.location.protocol : "N/A"}
                    </Typography>
                </div>
                <div>
                    <Typography variant="body2">User Agent:</Typography>
                    <Typography variant="caption" sx={{ wordBreak: "break-all" }}>
                        {typeof navigator !== "undefined" ? navigator.userAgent.substring(0, 50) + "..." : "N/A"}
                    </Typography>
                </div>
            </Stack>
        </Box>
    );
};

export default PlatformDebug;
