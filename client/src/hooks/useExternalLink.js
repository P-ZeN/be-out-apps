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
 */
export const ExternalLink = ({ href, title, children, ...props }) => {
    const { openExternalLink } = useExternalLink();

    const handleClick = (e) => {
        e.preventDefault();
        openExternalLink(href, title);
    };

    return (
        <a href={href} onClick={handleClick} {...props}>
            {children}
        </a>
    );
};
