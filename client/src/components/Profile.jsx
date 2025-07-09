import React, { useState, useEffect } from "react";
import userService from "../services/userService";
import { useAuth } from "../context/AuthContext";
import {
    Button,
    TextField,
    Container,
    Typography,
    Box,
    Alert,
    Grid,
    Paper,
    Card,
    CardContent,
    Divider,
} from "@mui/material";

const Profile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState({
        first_name: "",
        last_name: "",
        phone: "",
        date_of_birth: "",
        street_number: "",
        street_name: "",
        postal_code: "",
        city: "",
        country: "",
    });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await userService.getProfile();
                // Ensure no null values are passed to inputs
                const sanitizedProfile = {
                    first_name: data.first_name || "",
                    last_name: data.last_name || "",
                    phone: data.phone || "",
                    date_of_birth: data.date_of_birth || "",
                    street_number: data.street_number || "",
                    street_name: data.street_name || "",
                    postal_code: data.postal_code || "",
                    city: data.city || "",
                    country: data.country || "",
                };
                setProfile(sanitizedProfile);
            } catch (error) {
                setError("Failed to fetch profile");
            }
        };

        if (user) {
            fetchProfile();
        }
    }, [user]);

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    My Profile
                </Typography>

                <Paper elevation={3} sx={{ p: 4 }}>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="h6" gutterBottom>
                                Personal Information
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="First Name"
                                value={profile.first_name}
                                InputProps={{ readOnly: true }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Last Name"
                                value={profile.last_name}
                                InputProps={{ readOnly: true }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Email"
                                value={user?.email || ""}
                                InputProps={{ readOnly: true }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField fullWidth label="Phone" value={profile.phone} InputProps={{ readOnly: true }} />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Date of Birth"
                                value={profile.date_of_birth}
                                InputProps={{ readOnly: true }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                Address
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 3 }}>
                            <TextField
                                fullWidth
                                label="Street Number"
                                value={profile.street_number}
                                InputProps={{ readOnly: true }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 9 }}>
                            <TextField
                                fullWidth
                                label="Street Name"
                                value={profile.street_name}
                                InputProps={{ readOnly: true }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Postal Code"
                                value={profile.postal_code}
                                InputProps={{ readOnly: true }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField fullWidth label="City" value={profile.city} InputProps={{ readOnly: true }} />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Country"
                                value={profile.country}
                                InputProps={{ readOnly: true }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                To update your profile information, please contact support.
                            </Typography>
                        </Grid>
                    </Grid>
                </Paper>

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
            </Box>
        </Container>
    );
};

export default Profile;
