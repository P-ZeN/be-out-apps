import React, { createContext, useState, useContext, useEffect } from "react";
import userService from "../services/userService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for token in URL parameters (from OAuth redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');
        
        if (tokenFromUrl) {
            // Store the token and clean up URL
            localStorage.setItem("token", tokenFromUrl);
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Get user profile with the new token
            userService
                .getProfile()
                .then(setUser)
                .catch(() => {
                    localStorage.removeItem("token");
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            // Check for existing token in localStorage
            const token = localStorage.getItem("token");
            if (token) {
                userService
                    .getProfile()
                    .then(setUser)
                    .catch(() => {
                        localStorage.removeItem("token");
                        setUser(null);
                    })
                    .finally(() => setLoading(false));
            } else {
                setLoading(false);
            }
        }
    }, []);

    const login = (userData) => {
        localStorage.setItem("token", userData.token);
        userService.getProfile().then(setUser);
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
    };

    const value = {
        user,
        login,
        logout,
        loading,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};
