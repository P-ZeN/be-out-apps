import { useEffect, useState } from "react";
import { getIsTauriApp } from "../utils/platformDetection";
import LandingPage from "./LandingPage";
import { Home } from "../pages";

/**
 * HomeWrapper component that shows different content based on platform:
 * - Web browser: Shows landing page with app store links
 * - Tauri app: Shows the actual home page with events
 */
const HomeWrapper = () => {
    const [isTauriApp, setIsTauriApp] = useState(null);

    useEffect(() => {
        // Detect platform on mount
        const detectPlatform = () => {
            const isTaburi = getIsTauriApp();
            setIsTauriApp(isTaburi);
        };

        // Small delay to ensure all scripts are loaded
        const timer = setTimeout(detectPlatform, 100);

        return () => clearTimeout(timer);
    }, []);

    // Show loading or nothing while detecting
    if (isTauriApp === null) {
        return null; // or a loading spinner if preferred
    }

    // If running in Tauri (bundled app), show the actual home page
    if (isTauriApp) {
        return <Home />;
    }

    // If running in web browser, show the landing page
    return <LandingPage />;
};

export default HomeWrapper;
