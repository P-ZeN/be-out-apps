import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { useExternalLink } from "../hooks/useExternalLink";
import { waitForTauri, getTauriInfo } from "../utils/tauriReady";
import { areTauriApisAvailable } from "../utils/platformDetection";
import { Button, TextField, Container, Typography, Box, Alert, Divider, CircularProgress } from "@mui/material";
import { Google, Facebook, Apple } from "@mui/icons-material";
import WebViewOverlay from "./WebViewOverlay";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [oauthLoading, setOauthLoading] = useState(false);
    const { login, nativeLogin } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation(["auth", "common"]);
    const { openExternalLink, closeWebView, webViewState, isTauriApp } = useExternalLink();

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");
        setIsLoading(true);
        try {
            const response = await authService.login({ email, password });
            login(response); // AuthContext will handle navigation based on onboarding status
            setMessage(t("auth:login.success"));
        } catch (error) {
            setError(t("auth:login.failed"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError("");
        setOauthLoading(true);
        try {
            if (window.__TAURI__) {
                // Native mobile flow
                const { id_token } = await window.__TAURI__.social.signInWithGoogle();
                if (id_token) {
                    // The tauri-plugin-social returns an id_token, which is what our server needs.
                    // We can reuse the loginWithGoogleMobile function, but we'll pass the id_token instead of a serverAuthCode.
                    // For clarity, we should rename the parameter on the server-side, but for now, this will work.
                    // Let's adjust the server endpoint to accept `idToken` instead of `serverAuthCode`.
                    const response = await authService.loginWithGoogleMobile(id_token);
                    nativeLogin(response.token, response.user); // Use nativeLogin to store token and user
                    setMessage(t("auth:login.success"));
                } else {
                    throw new Error("Google Sign-In failed to return an ID token.");
                }
            } else {
                // Web flow
                console.log("=== GOOGLE OAUTH START (Web) ===");
                const googleAuthUrl = `${API_BASE_URL}/api/oauth/google/login`;
                window.location.href = googleAuthUrl;
            }
        } catch (error) {
            console.error("Google OAuth error:", error);
            setError("Google authentication failed: " + (error.message || "Unknown error"));
        } finally {
            setOauthLoading(false);
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

    const handleAppleLogin = async () => {
        setMessage("");
        setError("");
        setOauthLoading(true);

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
            console.error("Apple Sign In error:", error);
            setError(error.message || "Apple Sign In failed");
        } finally {
            setOauthLoading(false);
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
                    {t("auth:login.title")}
                </Typography>
                <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label={t("common:form.email")}
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
                        label={t("common:form.password")}
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={isLoading}>
                        {isLoading ? <CircularProgress size={24} /> : t("auth:login.title")}
                    </Button>
                </Box>
            </Box>
            {message && (
                <Alert severity="success" sx={{ mt: 2 }}>
                    {message}
                </Alert>
            )}
            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}

            <Divider sx={{ my: 2 }}>{t("auth:login.orLoginWith")}</Divider>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Button
                    variant="outlined"
                    startIcon={oauthLoading ? <CircularProgress size={20} /> : <Google />}
                    onClick={handleGoogleLogin}
                    disabled={oauthLoading || isLoading}>
                    {oauthLoading ? t("auth:login.authenticating") : t("auth:login.loginWithGoogle")}
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<Apple />}
                    onClick={handleAppleLogin}
                    disabled={oauthLoading || isLoading}>
                    Sign in with Apple
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<Facebook />}
                    onClick={handleFacebookLogin}
                    disabled={oauthLoading || isLoading}>
                    {t("auth:login.loginWithFacebook")}
                </Button>
            </Box>

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

export default Login;
