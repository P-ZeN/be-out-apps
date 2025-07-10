import React, { useState } from "react";
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Link, Container, Grid } from "@mui/material";
import { Business, Email, Lock, Person, Phone } from "@mui/icons-material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import organizerService from "../services/organizerService";

const Register = () => {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        company_name: "",
        contact_person: "",
        phone: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    const { t } = useTranslation();

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

        if (formData.password !== formData.confirmPassword) {
            setError(t("register.errors.passwordMismatch"));
            setLoading(false);
            return;
        }

        try {
            await organizerService.register(formData);
            setSuccess(true);
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } catch (error) {
            setError(error.message || t("register.errors.failed"));
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    background: "linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}>
                <Container maxWidth="sm">
                    <Card sx={{ borderRadius: 3, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}>
                        <CardContent sx={{ p: 4, textAlign: "center" }}>
                            <Business sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
                            <Typography variant="h5" fontWeight="bold" gutterBottom>
                                {t("register.success.title")}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                {t("register.success.message")}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {t("register.success.redirecting")}
                            </Typography>
                        </CardContent>
                    </Card>
                </Container>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                py: 3,
            }}>
            <Container maxWidth="md">
                <Card
                    sx={{
                        maxWidth: 600,
                        mx: "auto",
                        borderRadius: 3,
                        boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                    }}>
                    <CardContent sx={{ p: 4 }}>
                        <Box sx={{ textAlign: "center", mb: 4 }}>
                            <Business
                                sx={{
                                    fontSize: 48,
                                    color: "primary.main",
                                    mb: 2,
                                }}
                            />
                            <Typography variant="h4" fontWeight="bold" gutterBottom>
                                {t("register.title")}
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                {t("register.subtitle")}
                            </Typography>
                        </Box>

                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        label={t("email")}
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
                                </Grid>

                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label={t("password")}
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        autoComplete="new-password"
                                        InputProps={{
                                            startAdornment: <Lock sx={{ mr: 1, color: "text.secondary" }} />,
                                        }}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label={t("register.confirmPassword")}
                                        name="confirmPassword"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        autoComplete="new-password"
                                        InputProps={{
                                            startAdornment: <Lock sx={{ mr: 1, color: "text.secondary" }} />,
                                        }}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        label={t("register.companyName")}
                                        name="company_name"
                                        value={formData.company_name}
                                        onChange={handleChange}
                                        required
                                        autoComplete="organization"
                                        InputProps={{
                                            startAdornment: <Business sx={{ mr: 1, color: "text.secondary" }} />,
                                        }}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label={t("register.contactPerson")}
                                        name="contact_person"
                                        value={formData.contact_person}
                                        onChange={handleChange}
                                        required
                                        autoComplete="name"
                                        InputProps={{
                                            startAdornment: <Person sx={{ mr: 1, color: "text.secondary" }} />,
                                        }}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label={t("register.phone")}
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        autoComplete="tel"
                                        InputProps={{
                                            startAdornment: <Phone sx={{ mr: 1, color: "text.secondary" }} />,
                                        }}
                                    />
                                </Grid>
                            </Grid>

                            {error && (
                                <Alert severity="error" sx={{ mt: 3 }}>
                                    {error}
                                </Alert>
                            )}

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                size="large"
                                disabled={loading}
                                sx={{
                                    py: 1.5,
                                    fontSize: "1.1rem",
                                    fontWeight: "bold",
                                    mt: 4,
                                    mb: 3,
                                }}>
                                {loading ? t("register.registering") : t("register")}
                            </Button>

                            <Box sx={{ textAlign: "center" }}>
                                <Typography variant="body2" color="text.secondary">
                                    {t("register.alreadyHaveAccount")}{" "}
                                    <Link component={RouterLink} to="/login" color="primary" fontWeight="bold">
                                        {t("login")}
                                    </Link>
                                </Typography>
                            </Box>
                        </form>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};

export default Register;
