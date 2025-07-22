import React, { useState } from "react";
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Link, Divider, Container } from "@mui/material";
import { Business, Email, Lock } from "@mui/icons-material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import organizerService from "../services/organizerService";

const Login = () => {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await organizerService.login(formData.email, formData.password);
            await login(response);
            navigate("/dashboard");
        } catch (error) {
            setError(error.message || "Erreur de connexion");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                backgroundColor: "#FFECE1", // Crème background
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                py: 3,
            }}>
            <Container maxWidth="sm">
                <Card
                    sx={{
                        maxWidth: 480,
                        mx: "auto",
                        borderRadius: 3,
                        boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                    }}>
                    <CardContent sx={{ p: 4 }}>
                        <Box sx={{ textAlign: "center", mb: 4 }}>
                            <Box
                                component="img"
                                src="/be-out_logo.svg"
                                alt="Be Out Logo"
                                sx={{
                                    height: 110,
                                    width: "auto",
                                    mb: 2,
                                }}
                            />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                Be Out - Espace Organisateur
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Connectez-vous pour gérer vos événements
                            </Typography>
                        </Box>

                        <form onSubmit={handleSubmit}>
                            <Box sx={{ mb: 3 }}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    autoComplete="email"
                                    InputProps={{
                                        startAdornment: <Email sx={{ mr: 1, color: "text.secondary" }} />,
                                    }}
                                />
                            </Box>

                            <Box sx={{ mb: 3 }}>
                                <TextField
                                    fullWidth
                                    label="Mot de passe"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    autoComplete="current-password"
                                    InputProps={{
                                        startAdornment: <Lock sx={{ mr: 1, color: "text.secondary" }} />,
                                    }}
                                />
                            </Box>

                            {error && (
                                <Alert severity="error" sx={{ mb: 3 }}>
                                    {error}
                                </Alert>
                            )}

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                color="secondary"
                                size="large"
                                disabled={loading}
                                sx={{
                                    py: 1.5,
                                    fontSize: "1.1rem",
                                    fontWeight: "bold",
                                    mb: 3,
                                }}>
                                {loading ? "Connexion..." : "Se connecter"}
                            </Button>

                            <Divider sx={{ my: 3 }}>
                                <Typography variant="body2" color="text.secondary">
                                    ou
                                </Typography>
                            </Divider>

                            <Box sx={{ textAlign: "center" }}>
                                <Typography variant="body2" color="text.secondary">
                                    Pas encore inscrit ?{" "}
                                    <Link component={RouterLink} to="/register" color="primary" fontWeight="bold">
                                        Créer un compte organisateur
                                    </Link>
                                </Typography>
                            </Box>
                        </form>
                    </CardContent>
                </Card>

                <Box sx={{ textAlign: "center", mt: 3 }}>
                    <Typography variant="body2" color="white" sx={{ opacity: 0.8 }}>
                        Vous êtes administrateur ?{" "}
                        <Link href="/admin" color="inherit" sx={{ fontWeight: "bold" }}>
                            Accès administration
                        </Link>
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
};

export default Login;
