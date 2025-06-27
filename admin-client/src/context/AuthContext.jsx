import React, { createContext, useState, useContext, useEffect } from "react";
import adminService from "../services/adminService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("adminToken");
        if (token) {
            adminService
                .getProfile()
                .then(setUser)
                .catch(() => {
                    localStorage.removeItem("adminToken");
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = (userData) => {
        localStorage.setItem("adminToken", userData.token);
        adminService.getProfile().then(setUser);
    };

    const logout = () => {
        localStorage.removeItem("adminToken");
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
