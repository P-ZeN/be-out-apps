import React, { createContext, useContext, useState, useEffect } from "react";
import { getIsTauriApp } from "../utils/platformDetection";
import WebViewOverlay from "../components/WebViewOverlay";

const WebViewContext = createContext();

/**
 * WebView Provider - Manages external link overlays globally
 * Provides a consistent way to handle external links across the app
 */
export const WebViewProvider = ({ children }) => {
    const [isTauriApp, setIsTauriApp] = useState(false);
    const [webViewState, setWebViewState] = useState({
        open: false,
        url: null,
        title: null,
    });

    useEffect(() => {
        setIsTauriApp(getIsTauriApp());
    }, []);

    const openExternalLink = (url, title = null) => {
        if (isTauriApp) {
            // For mobile apps: open in overlay
            setWebViewState({
                open: true,
                url,
                title,
            });
        } else {
            // For web: open in new tab
            window.open(url, "_blank", "noopener,noreferrer");
        }
    };

    const closeWebView = () => {
        setWebViewState({
            open: false,
            url: null,
            title: null,
        });
    };

    const value = {
        openExternalLink,
        closeWebView,
        webViewState,
        isTauriApp,
    };

    return (
        <WebViewContext.Provider value={value}>
            {children}
            {/* Global WebView Overlay */}
            <WebViewOverlay
                url={webViewState.url}
                title={webViewState.title}
                open={webViewState.open}
                onClose={closeWebView}
            />
        </WebViewContext.Provider>
    );
};

/**
 * Hook to use WebView context
 */
export const useWebView = () => {
    const context = useContext(WebViewContext);
    if (!context) {
        throw new Error("useWebView must be used within a WebViewProvider");
    }
    return context;
};

/**
 * Component for external links that automatically handles platform differences
 */
export const ExternalLink = ({ href, title, children, className, style, ...props }) => {
    const { openExternalLink } = useWebView();

    const handleClick = (e) => {
        e.preventDefault();
        openExternalLink(href, title);
    };

    return (
        <a href={href} onClick={handleClick} className={className} style={style} {...props}>
            {children}
        </a>
    );
};
