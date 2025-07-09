import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div>Loading...</div>; // Or a spinner component
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    // If user is not onboarded and trying to access anything other than onboarding, redirect to onboarding
    if (!user.onboarding_complete && location.pathname !== "/onboarding") {
        return <Navigate to="/onboarding" />;
    }

    // If user is onboarded and trying to access onboarding, redirect to home
    if (user.onboarding_complete && location.pathname === "/onboarding") {
        return <Navigate to="/" />;
    }

    return children;
};

export default PrivateRoute;
