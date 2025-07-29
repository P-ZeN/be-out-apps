import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { useExternalLink } from "../hooks/useExternalLink";
import { Button, TextField, Container, Typography, Box, Alert, Divider } from "@mui/material";
import { Google, Facebook, Apple } from "@mui/icons-material";
import WebViewOverlay from "./WebViewOverlay";
import { areTauriApisAvailable } from "../utils/platformDetection";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const Register = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isTauriAvailable, setIsTauriAvailable] = useState(false);
    const navigate = useNavigate();
    const { login, nativeLogin } = useAuth();
    const t = useTranslation(["auth", "common"]).t;
    const { openExternalLink, closeWebView, webViewState, isTauriApp } = useExternalLink();

    useEffect(() => {
        const checkTauri = async () => {
            try {
                const isAvailable = areTauriApisAvailable();
                setIsTauriAvailable(isAvailable);
                console.log("Register: Tauri availability:", isAvailable);
            } catch (error) {
                console.log("Register: Tauri not available:", error);
                setIsTauriAvailable(false);
            }
        };
        checkTauri();
    }, []);

    const handleRegister = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");
        try {
            const response = await authService.register({ email, password });
            login(response);
            setMessage("Registration successful");
            // Redirect to onboarding instead of home
            navigate("/onboarding");
        } catch (error) {
            setError("Registration failed");
        }
    };

    const handleGoogleLogin = async () => {
        console.log("=== REGISTER GOOGLE DEBUG INFO ===");
        console.log("isTauriAvailable:", isTauriAvailable);
        console.log("isTauriApp (hook):", isTauriApp);
        console.log("==================================");

        try {
            if (isTauriApp) {
                console.log("Starting native Google Sign-In for registration...");
                await nativeLogin();
                setMessage("Registration/Login successful");
                navigate("/onboarding");
            } else {
                console.log("Using web browser redirect for Google");
                const googleAuthUrl = `${API_BASE_URL}/auth/google`;
                window.location.href = googleAuthUrl;
            }
        } catch (error) {
            console.error("Google OAuth error:", error);
            setError("Google authentication failed: " + error.message);
        }
    };

    const handleAppleLogin = async () => {
        console.log("=== REGISTER APPLE DEBUG INFO ===");
        console.log("isTauriAvailable:", isTauriAvailable);
        console.log("=================================");

        try {
            if (isTauriApp) {
                console.log("Apple Sign-In not yet implemented for native auth");
                setError("Apple Sign-In will be available in a future update");
                // TODO: Implement Apple Sign-In in native auth service
            } else {
                console.log("Using web browser redirect for Apple");
                const appleAuthUrl = `${API_BASE_URL}/auth/apple`;
                window.location.href = appleAuthUrl;
            }
        } catch (error) {
            console.error("Apple OAuth error:", error);
            setError("Apple authentication failed: " + error.message);
        }
    };

    const handleFacebookLogin = () => {
        console.log("=== REGISTER FACEBOOK DEBUG INFO ===");
        console.log("isTauriAvailable:", isTauriAvailable);
        console.log("isTauriApp (hook):", isTauriApp);
        console.log("====================================");

        const facebookAuthUrl = `${API_BASE_URL}/auth/facebook`;
        if (isTauriApp) {
            console.log("Using Tauri external link handling for Facebook");
            openExternalLink(facebookAuthUrl, "Facebook Login");
        } else {
            console.log("Using web browser redirect for Facebook");
            window.location.href = facebookAuthUrl;
        }
    };

    return (
        <Container maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}>
                <Typography component="h1" variant="h5">
                    Register
                </Typography>
                <Box component="form" onSubmit={handleRegister} sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
                        Register
                    </Button>
                </Box>
            </Box>

            <Divider sx={{ my: 2 }}>{t("auth:login.orLoginWith")}</Divider>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Button variant="outlined" startIcon={<Google />} onClick={handleGoogleLogin}>
                    {t("auth:login.loginWithGoogle")}
                </Button>
                <Button variant="outlined" startIcon={<Apple />} onClick={handleAppleLogin}>
                    Sign in with Apple
                </Button>
                <Button variant="outlined" startIcon={<Facebook />} onClick={handleFacebookLogin}>
                    {t("auth:login.loginWithFacebook")}
                </Button>
            </Box>

            {message && <Alert severity="success">{message}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}

            {/* WebView Overlay for mobile external links */}
            <WebViewOverlay
                url={webViewState.url}
                title={webViewState.title}
                open={webViewState.open}
                onClose={closeWebView}
            />
        </Container>
    );
};

export default Register;
