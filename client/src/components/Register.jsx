import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { useExternalLink } from "../hooks/useExternalLink";
import { Button, TextField, Container, Typography, Box, Alert, Divider } from "@mui/material";
import { Google, Facebook } from "@mui/icons-material";
import WebViewOverlay from "./WebViewOverlay";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const Register = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { login } = useAuth();
    const t = useTranslation(["auth", "common"]).t;
    const { openExternalLink, closeWebView, webViewState, isTauriApp } = useExternalLink();

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

    const handleGoogleLogin = () => {
        const googleAuthUrl = `${API_BASE_URL}/auth/google`;
        if (isTauriApp) {
            openExternalLink(googleAuthUrl, "Google Login");
        } else {
            window.location.href = googleAuthUrl;
        }
    };

    const handleFacebookLogin = () => {
        const facebookAuthUrl = `${API_BASE_URL}/auth/facebook`;
        if (isTauriApp) {
            openExternalLink(facebookAuthUrl, "Facebook Login");
        } else {
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
