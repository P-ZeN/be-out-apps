import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getIsTauriApp } from "../utils/platformDetection";
import { useAuth } from "../context/AuthContext";
import LandingPage from "./LandingPage";
import { EventsPage } from "../pages";

/**
 * HomeWrapper component that shows different content based on platform and authentication:
 * - Authenticated users: Redirected to dashboard
 * - Web browser (not authenticated): Shows landing page with app store links
 * - Tauri app (not authenticated): Shows the actual home page with events
 */
const HomeWrapper = () => {
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

    // If user is authenticated and onboarding is complete, redirect to dashboard
    if (isAuthenticated && user?.onboarding_complete) {
        return <Navigate to="/dashboard" replace />;
    }

    // If running in Tauri (mobile app), show events page
    if (isTauriApp) {
        return <EventsPage />;
    }

    // If running in web browser, show landing page with project description
    return <LandingPage />;
};

export default HomeWrapper;
