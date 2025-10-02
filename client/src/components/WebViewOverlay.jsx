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
            console.log(`📱 Is Tauri app: ${isTauriApp}`);
            console.log(`� WebView props - open: ${open}, url: ${url}, title: ${title}`);
            setLoading(true);
        }
    }, [open, url, isTauriApp, title]);

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
        console.log('⚠️ WebView not rendered - not a Tauri app');
        return null;
    }

    console.log('🚀 WebView rendering with AppBar');

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen
            PaperProps={{
                sx: {
                    backgroundColor: "#fff",
                    // Account for system status bar on mobile
                    marginTop: 'env(safe-area-inset-top, 0px)',
                    height: 'calc(100% - env(safe-area-inset-top, 0px))',
                },
            }}>
            <AppBar
                position="static"
                color="primary"
                elevation={2}
                sx={{
                    zIndex: 1300, // High z-index to stay above iframe
                    position: 'relative'
                }}
            >
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        onClick={onClose}
                        aria-label="back"
                        sx={{
                            mr: 1,
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            '&:hover': {
                                backgroundColor: 'rgba(255,255,255,0.2)'
                            }
                        }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                        {title || "Be Out"}
                    </Typography>
                    <IconButton
                        edge="end"
                        color="inherit"
                        onClick={onClose}
                        aria-label="close"
                        sx={{
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            '&:hover': {
                                backgroundColor: 'rgba(255,255,255,0.2)'
                            }
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Toolbar>
                {loading && <LinearProgress color="secondary" />}
            </AppBar>

            <DialogContent
                sx={{
                    p: 0,
                    height: "calc(100% - 64px)", // Subtract AppBar height
                    overflow: "hidden",
                    mt: 0 // Ensure no margin pushes content down
                }}
            >
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
