import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { useExternalLink } from "../hooks/useExternalLink";
import { Button, TextField, Container, Typography, Box, Alert, Divider, FormControlLabel, Checkbox, Link } from "@mui/material";
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
    const [legalConsent, setLegalConsent] = useState({
        termsOfUse: false,
        termsOfService: false,
        privacyPolicy: false
    });
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

    const handleLegalConsentChange = (field) => (event) => {
        setLegalConsent({
            ...legalConsent,
            [field]: event.target.checked
        });
    };

    const isLegalConsentComplete = () => {
        return legalConsent.termsOfUse && legalConsent.termsOfService && legalConsent.privacyPolicy;
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        // Check legal consent before proceeding
        if (!isLegalConsentComplete()) {
            setError(t("auth:register.legalConsentRequired"));
            return;
        }

        try {
            const response = await authService.register({
                email,
                password,
                legalConsent
            });
            login(response);
            setMessage(t("auth:register.success"));
            // Redirect to onboarding instead of home
            navigate("/onboarding");
        } catch (error) {
            console.error("Registration error:", error);
            setError(error.message || t("auth:register.failed"));
        }
    };

    const handleGoogleLogin = async () => {
        setError("");

        // Check if we're in a Tauri (mobile) environment
        if (isTauriAvailable) {
            // Google Sign-In temporarily disabled for mobile apps
            setMessage("🚀 Google Sign-In coming soon for mobile! Stay tuned for this exciting feature.");
            return;
        }

        // For web version, use the normal Google OAuth flow
        const googleAuthUrl = `${API_BASE_URL}/auth/google`;
        window.location.href = googleAuthUrl;
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
                    {t("auth:register.title")}
                </Typography>
                <Box component="form" onSubmit={handleRegister} sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label={t("auth:register.fields.email")}
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
                        label={t("auth:register.fields.password")}
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    {/* Legal Consent Section */}
                    <Box sx={{ mt: 3, mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                            {t("auth:register.legalConsent.title")}
                        </Typography>

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={legalConsent.termsOfUse}
                                    onChange={handleLegalConsentChange("termsOfUse")}
                                    size="small"
                                />
                            }
                            label={
                                <Typography variant="body2">
                                    {t("auth:register.legalConsent.acceptTermsPrefix")}{" "}
                                    <Link
                                        href="https://www.be-out-app.dedibox2.philippezenone.net/cgu"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ textDecoration: 'underline' }}
                                    >
                                        {t("auth:register.legalConsent.termsOfUse")}
                                    </Link>
                                </Typography>
                            }
                            sx={{ alignItems: 'flex-start', mb: 1 }}
                        />

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={legalConsent.termsOfService}
                                    onChange={handleLegalConsentChange("termsOfService")}
                                    size="small"
                                />
                            }
                            label={
                                <Typography variant="body2">
                                    {t("auth:register.legalConsent.acceptTermsPrefix")}{" "}
                                    <Link
                                        href="https://www.be-out-app.dedibox2.philippezenone.net/cgv"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ textDecoration: 'underline' }}
                                    >
                                        {t("auth:register.legalConsent.termsOfService")}
                                    </Link>
                                </Typography>
                            }
                            sx={{ alignItems: 'flex-start', mb: 1 }}
                        />

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={legalConsent.privacyPolicy}
                                    onChange={handleLegalConsentChange("privacyPolicy")}
                                    size="small"
                                />
                            }
                            label={
                                <Typography variant="body2">
                                    {t("auth:register.legalConsent.acceptTermsPrefix")}{" "}
                                    <Link
                                        href="https://www.be-out-app.dedibox2.philippezenone.net/politique-confidentialite"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ textDecoration: 'underline' }}
                                    >
                                        {t("auth:register.legalConsent.privacyPolicy")}
                                    </Link>
                                </Typography>
                            }
                            sx={{ alignItems: 'flex-start', mb: 1 }}
                        />
                    </Box>

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 2, mb: 2 }}
                        disabled={!isLegalConsentComplete()}
                    >
                        {t("auth:register.submitButton")}
                    </Button>
                </Box>
            </Box>

            {/* Temporarily commented out - Social login section */}
            {/*
            <Divider sx={{ my: 2 }}>{t("auth:login.orLoginWith")}</Divider>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Button variant="outlined" startIcon={<Google />} onClick={handleGoogleLogin}>
                    {isTauriAvailable ? t("auth:register.social.googleComingSoon") : t("auth:register.social.signInWithGoogle")}
                </Button>
                <Button variant="outlined" startIcon={<Apple />} onClick={handleAppleLogin}>
                    {t("auth:register.social.signInWithApple")}
                </Button>
                <Button variant="outlined" startIcon={<Facebook />} onClick={handleFacebookLogin}>
                    {t("auth:login.loginWithFacebook")}
                </Button>
            </Box>
            */}

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
