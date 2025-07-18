import { useState, useEffect } from "react";
import { getIsTauriApp } from "../utils/platformDetection";

/**
 * Custom hook for handling external links in mobile apps
 * Returns a function to open external links and WebView state
 */
export const useExternalLink = () => {
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

    return {
        openExternalLink,
        closeWebView,
        webViewState,
        isTauriApp,
    };
};

/**
 * Higher-order component to wrap external links
 * Automatically handles platform-specific link behavior
 * Note: This should be imported separately when needed
 */
export const createExternalLink = (openExternalLink) => {
    return ({ href, title, children, ...props }) => {
        const handleClick = (e) => {
            e.preventDefault();
            openExternalLink(href, title);
        };

        // Return props for creating the link element
        return {
            href,
            onClick: handleClick,
            ...props
        };
    };
};
