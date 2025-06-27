import React, { createContext, useState, useContext, useEffect } from "react";
import organizerService from "../services/organizerService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("organizerToken");
        if (token) {
            organizerService
                .getProfile()
                .then((userData) => {
                    setUser(userData);
                    // Get organizer profile information
                    organizerService.getOrganizerProfile().then(setProfile).catch(console.error);
                })
                .catch(() => {
                    localStorage.removeItem("organizerToken");
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (userData) => {
        localStorage.setItem("organizerToken", userData.token);
        const userProfile = await organizerService.getProfile();
        setUser(userProfile);

        // Get organizer profile
        try {
            const orgProfile = await organizerService.getOrganizerProfile();
            setProfile(orgProfile);
        } catch (error) {
            console.error("Error fetching organizer profile:", error);
        }
    };

    const logout = () => {
        localStorage.removeItem("organizerToken");
        setUser(null);
        setProfile(null);
    };

    const updateProfile = (updatedProfile) => {
        setProfile(updatedProfile);
    };

    const value = {
        user,
        profile,
        login,
        logout,
        updateProfile,
        loading,
        isAuthenticated: !!user,
        isApproved: profile?.status === "approved",
        isOnboardingComplete: profile?.onboarding_completed || false,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};
