import React, { useState, useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline, Box } from "@mui/material";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { theme } from "./theme";
import AuthService from "./services/authService";
import Login from "./pages/Login";
import AdminMainLayout from "./components/AdminMainLayout";

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            if (AuthService.isAuthenticated()) {
                const profile = await AuthService.getProfile();
                setUser(profile);
            }
        } catch (error) {
            console.error("Auth check failed:", error);
            AuthService.logout();
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (email, password) => {
        try {
            const result = await AuthService.login(email, password);

            // Verify admin role after login
            if (!result.user.role || (result.user.role !== "admin" && result.user.role !== "moderator")) {
                AuthService.logout();
                throw new Error("Access denied: Admin privileges required");
            }

            setUser(result.user);
            return result;
        } catch (error) {
            throw error;
        }
    };

    const handleLogout = () => {
        AuthService.logout();
        setUser(null);
    };

    if (loading) {
        return (
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                    <div>Loading...</div>
                </Box>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <Routes>
                    <Route
                        path="/login"
                        element={user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />}
                    />
                    <Route
                        path="/*"
                        element={
                            user ? (
                                <AdminMainLayout user={user} onLogout={handleLogout} />
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        }
                    />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;
