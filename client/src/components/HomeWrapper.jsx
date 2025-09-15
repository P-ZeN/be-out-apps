import { useEffect, useState } from "react";
import { getIsTauriApp } from "../utils/platformDetection";
import { useAuth } from "../context/AuthContext";
import LandingPage from "./LandingPage";
import { EventsPage } from "../pages";

/**
 * HomeWrapper component that shows different content based on platform:
 * - Web browser: Shows landing page with app store links and project description
 * - Tauri app (mobile): Shows the events page as the home page
 */
const HomeWrapper = ({ searchQuery, filters }) => {
    const [isTauriApp, setIsTauriApp] = useState(null);
    const { isAuthenticated, user } = useAuth();

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

    // If running in Tauri (mobile app), show events page
    if (isTauriApp) {
        return <EventsPage searchQuery={searchQuery} filters={filters} />;
    }

    // If running in web browser, show landing page with project description
    return <LandingPage />;
};

export default HomeWrapper;
