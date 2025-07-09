import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { Button, TextField, Container, Typography, Box, Alert, Divider } from "@mui/material";
import { Google, Facebook } from "@mui/icons-material";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation(["auth", "common"]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");
        try {
            const response = await authService.login({ email, password });
            login(response); // Pass the whole response to login
            setMessage(t("auth:login.success"));
            navigate("/");
        } catch (error) {
            setError(t("auth:login.failed"));
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
                    <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
                        {t("auth:login.title")}
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
                    startIcon={<Google />}
                    onClick={() => (window.location.href = `${API_BASE_URL}/auth/google`)}>
                    {t("auth:login.loginWithGoogle")}
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<Facebook />}
                    onClick={() => (window.location.href = `${API_BASE_URL}/auth/facebook`)}>
                    {t("auth:login.loginWithFacebook")}
                </Button>
            </Box>
        </Container>
    );
};

export default Login;
