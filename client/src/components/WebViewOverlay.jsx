import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, AppBar, Toolbar, IconButton, Typography, Box, LinearProgress } from "@mui/material";
import { Close as CloseIcon, ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { getIsTauriApp } from "../utils/platformDetection";

/**
 * WebViewOverlay component for handling external links in mobile apps
 * Shows external URLs in an overlay with navigation controls
 */
const WebViewOverlay = ({ url, title, open, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [isTauriApp, setIsTauriApp] = useState(false);

    useEffect(() => {
        setIsTauriApp(getIsTauriApp());
    }, []);

    useEffect(() => {
        if (open && url) {
            console.log(`🌐 WebView overlay opening for URL: ${url}`);
            setLoading(true);
        }
    }, [open, url]);

    const handleIframeLoad = () => {
        console.log(`✅ WebView iframe loaded successfully: ${url}`);
        setLoading(false);
    };

    const handleIframeError = (event) => {
        console.error(`❌ WebView iframe failed to load: ${url}`, event);
        setLoading(false);
    };

    // Only show overlay in mobile apps
    if (!isTauriApp) {
        return null;
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen
            PaperProps={{
                sx: {
                    backgroundColor: "#fff",
                },
            }}>
            <AppBar position="static" color="default" elevation={1}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, ml: 1 }}>
                        {title || "External Link"}
                    </Typography>
                    <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
                        <CloseIcon />
                    </IconButton>
                </Toolbar>
                {loading && <LinearProgress />}
            </AppBar>

            <DialogContent sx={{ p: 0, height: "100%", overflow: "hidden" }}>
                {url && (
                    <Box sx={{ height: "100%", width: "100%" }}>
                        <iframe
                            src={url}
                            style={{
                                width: "100%",
                                height: "100%",
                                border: "none",
                                display: loading ? "none" : "block",
                            }}
                            onLoad={handleIframeLoad}
                            onError={handleIframeError}
                            title={title || "External Content"}
                            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
                        />
                        {loading && (
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    height: "100%",
                                }}>
                                <Typography>Loading...</Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default WebViewOverlay;
