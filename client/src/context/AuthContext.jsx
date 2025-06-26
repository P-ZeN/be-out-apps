import React, { createContext, useState, useContext, useEffect } from "react";
import userService from "../services/userService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
