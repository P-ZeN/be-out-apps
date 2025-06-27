import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    Grid,
    Chip,
    Alert,
    Divider,
    Avatar,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
} from "@mui/material";
import { Business, Email, Phone, Person, Language, LocationOn, CheckCircle, Warning, Error } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import organizerService from "../services/organizerService";

const Profile = () => {
    const { user, profile, updateProfile } = useAuth();
    const [formData, setFormData] = useState({
        company_name: "",
        contact_person: "",
        phone: "",
        website_url: "",
        description: "",
        business_address: "",
        business_city: "",
        business_postal_code: "",
        business_country: "France",
        business_registration_number: "",
        vat_number: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        if (profile) {
            setFormData({
                company_name: profile.company_name || "",
                contact_person: profile.contact_person || "",
                phone: profile.phone || "",
                website_url: profile.website_url || "",
                description: profile.description || "",
                business_address: profile.business_address || "",
                business_city: profile.business_city || "",
                business_postal_code: profile.business_postal_code || "",
                business_country: profile.business_country || "France",
                business_registration_number: profile.business_registration_number || "",
                vat_number: profile.vat_number || "",
            });
        }
    }, [profile]);

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
        setSuccess("");

        try {
            const updatedProfile = await organizerService.updateOrganizerProfile(formData);
            updateProfile(updatedProfile);
            setSuccess("Profil mis à jour avec succès");
        } catch (err) {
            setError(err.message || "Erreur lors de la mise à jour");
        } finally {
            setLoading(false);
        }
    };

    const getStatusInfo = () => {
        if (!profile) return null;

        const status = profile.status || "pending";
        const statusConfig = {
            approved: {
                label: "Compte approuvé",
                color: "success",
                icon: <CheckCircle />,
                description: "Votre compte est validé. Vous pouvez créer des événements.",
            },
            pending: {
                label: "En attente d'approbation",
                color: "warning",
                icon: <Warning />,
                description: "Votre profil est en cours de validation par notre équipe.",
            },
            suspended: {
                label: "Compte suspendu",
                color: "error",
                icon: <Error />,
                description: "Votre compte a été suspendu. Contactez le support.",
            },
            rejected: {
                label: "Demande rejetée",
                color: "error",
                icon: <Error />,
                description: "Votre demande a été rejetée. Contactez le support pour plus d'informations.",
            },
        };

        return statusConfig[status] || statusConfig.pending;
    };

    const statusInfo = getStatusInfo();

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                Mon profil organisateur
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Gérez les informations de votre entreprise et votre compte
            </Typography>

            {/* Status Card */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                        <Avatar sx={{ bgcolor: `${statusInfo?.color}.main`, mr: 2 }}>{statusInfo?.icon}</Avatar>
                        <Box>
                            <Typography variant="h6">Statut du compte</Typography>
                            <Chip label={statusInfo?.label} color={statusInfo?.color} size="small" />
                        </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        {statusInfo?.description}
                    </Typography>
                </CardContent>
            </Card>

            <Grid container spacing={3}>
                {/* Account Information */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Informations du compte
                            </Typography>
                            <List>
                                <ListItem>
                                    <ListItemIcon>
                                        <Email />
                                    </ListItemIcon>
                                    <ListItemText primary="Email" secondary={user?.email} />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon>
                                        <Person />
                                    </ListItemIcon>
                                    <ListItemText primary="Rôle" secondary="Organisateur" />
                                </ListItem>
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Profile Form */}
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Informations de l'entreprise
                            </Typography>

                            {error && (
                                <Alert severity="error" sx={{ mb: 3 }}>
                                    {error}
                                </Alert>
                            )}

                            {success && (
                                <Alert severity="success" sx={{ mb: 3 }}>
                                    {success}
                                </Alert>
                            )}

                            <form onSubmit={handleSubmit}>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Nom de l'entreprise"
                                            name="company_name"
                                            value={formData.company_name}
                                            onChange={handleChange}
                                            required
                                            InputProps={{
                                                startAdornment: <Business sx={{ mr: 1, color: "text.secondary" }} />,
                                            }}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Personne de contact"
                                            name="contact_person"
                                            value={formData.contact_person}
                                            onChange={handleChange}
                                            required
                                            InputProps={{
                                                startAdornment: <Person sx={{ mr: 1, color: "text.secondary" }} />,
                                            }}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Téléphone"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            InputProps={{
                                                startAdornment: <Phone sx={{ mr: 1, color: "text.secondary" }} />,
                                            }}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Site web"
                                            name="website_url"
                                            value={formData.website_url}
                                            onChange={handleChange}
                                            InputProps={{
                                                startAdornment: <Language sx={{ mr: 1, color: "text.secondary" }} />,
                                            }}
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Description de l'entreprise"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            multiline
                                            rows={3}
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Divider sx={{ my: 2 }}>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Adresse
                                            </Typography>
                                        </Divider>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Adresse"
                                            name="business_address"
                                            value={formData.business_address}
                                            onChange={handleChange}
                                            InputProps={{
                                                startAdornment: <LocationOn sx={{ mr: 1, color: "text.secondary" }} />,
                                            }}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Ville"
                                            name="business_city"
                                            value={formData.business_city}
                                            onChange={handleChange}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={3}>
                                        <TextField
                                            fullWidth
                                            label="Code postal"
                                            name="business_postal_code"
                                            value={formData.business_postal_code}
                                            onChange={handleChange}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={3}>
                                        <TextField
                                            fullWidth
                                            label="Pays"
                                            name="business_country"
                                            value={formData.business_country}
                                            onChange={handleChange}
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Divider sx={{ my: 2 }}>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Informations légales
                                            </Typography>
                                        </Divider>
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="SIRET"
                                            name="business_registration_number"
                                            value={formData.business_registration_number}
                                            onChange={handleChange}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Numéro de TVA"
                                            name="vat_number"
                                            value={formData.vat_number}
                                            onChange={handleChange}
                                        />
                                    </Grid>
                                </Grid>

                                <Box sx={{ mt: 3, textAlign: "right" }}>
                                    <Button type="submit" variant="contained" disabled={loading} size="large">
                                        {loading ? "Mise à jour..." : "Mettre à jour"}
                                    </Button>
                                </Box>
                            </form>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Profile;
