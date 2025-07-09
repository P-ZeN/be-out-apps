import React, { useState, useEffect } from "react";
import userService from "../services/userService";
import { useAuth } from "../context/AuthContext";
import { Button, TextField, Container, Typography, Box, Alert, Grid, Paper, Divider, IconButton } from "@mui/material";
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from "@mui/icons-material";
import { formatDateForInput, formatDateForServer } from "../utils/dateUtils";

const Profile = () => {
    const { user, updateUser } = useAuth();
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
    const [originalProfile, setOriginalProfile] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
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
                    date_of_birth: formatDateForInput(data.date_of_birth) || "",
                    street_number: data.street_number || "",
                    street_name: data.street_name || "",
                    postal_code: data.postal_code || "",
                    city: data.city || "",
                    country: data.country || "",
                };
                setProfile(sanitizedProfile);
                setOriginalProfile(sanitizedProfile);
            } catch (error) {
                setError("Failed to fetch profile");
            }
        };

        if (user) {
            fetchProfile();
        }
    }, [user]);

    const handleInputChange = (field) => (event) => {
        setProfile({
            ...profile,
            [field]: event.target.value,
        });
    };

    const handleEdit = () => {
        setIsEditing(true);
        setMessage("");
        setError("");
    };

    const handleCancel = () => {
        setProfile(originalProfile);
        setIsEditing(false);
        setMessage("");
        setError("");
    };

    const handleSave = async () => {
        setLoading(true);
        setError("");
        setMessage("");

        try {
            // Format date for server
            const profileToUpdate = {
                ...profile,
                date_of_birth: formatDateForServer(profile.date_of_birth),
            };
            const updatedProfile = await userService.updateProfile(profileToUpdate);

            // Format the response back for display
            const formattedProfile = {
                ...updatedProfile,
                date_of_birth: formatDateForInput(updatedProfile.date_of_birth),
            };

            setProfile(formattedProfile);
            setOriginalProfile(formattedProfile);
            setIsEditing(false);
            setMessage("Profile updated successfully!");

            // Update the user in AuthContext to reflect the changes
            const updatedUser = {
                ...user,
                first_name: profile.first_name,
                last_name: profile.last_name,
                phone: profile.phone,
                date_of_birth: profile.date_of_birth,
                street_number: profile.street_number,
                street_name: profile.street_name,
                postal_code: profile.postal_code,
                city: profile.city,
                country: profile.country,
            };
            updateUser(updatedUser);
        } catch (error) {
            setError("Failed to update profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="h4" gutterBottom>
                        My Profile
                    </Typography>
                    {!isEditing ? (
                        <Button variant="contained" startIcon={<EditIcon />} onClick={handleEdit}>
                            Edit Profile
                        </Button>
                    ) : (
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <Button
                                variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={handleSave}
                                disabled={loading}>
                                {loading ? "Saving..." : "Save"}
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<CancelIcon />}
                                onClick={handleCancel}
                                disabled={loading}>
                                Cancel
                            </Button>
                        </Box>
                    )}
                </Box>

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
                                onChange={handleInputChange("first_name")}
                                InputProps={{ readOnly: !isEditing }}
                                variant={isEditing ? "outlined" : "filled"}
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Last Name"
                                value={profile.last_name}
                                onChange={handleInputChange("last_name")}
                                InputProps={{ readOnly: !isEditing }}
                                variant={isEditing ? "outlined" : "filled"}
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Email"
                                value={user?.email || ""}
                                InputProps={{ readOnly: true }}
                                variant="filled"
                                helperText="Email cannot be changed"
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Phone"
                                value={profile.phone}
                                onChange={handleInputChange("phone")}
                                InputProps={{ readOnly: !isEditing }}
                                variant={isEditing ? "outlined" : "filled"}
                                type="tel"
                                placeholder="+33 1 23 45 67 89"
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Date of Birth"
                                value={formatDateForInput(profile.date_of_birth)}
                                onChange={handleInputChange("date_of_birth")}
                                InputProps={{ readOnly: !isEditing }}
                                variant={isEditing ? "outlined" : "filled"}
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                required
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
                                onChange={handleInputChange("street_number")}
                                InputProps={{ readOnly: !isEditing }}
                                variant={isEditing ? "outlined" : "filled"}
                                placeholder="123"
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 9 }}>
                            <TextField
                                fullWidth
                                label="Street Name"
                                value={profile.street_name}
                                onChange={handleInputChange("street_name")}
                                InputProps={{ readOnly: !isEditing }}
                                variant={isEditing ? "outlined" : "filled"}
                                placeholder="Rue de la Paix"
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Postal Code"
                                value={profile.postal_code}
                                onChange={handleInputChange("postal_code")}
                                InputProps={{ readOnly: !isEditing }}
                                variant={isEditing ? "outlined" : "filled"}
                                placeholder="75001"
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="City"
                                value={profile.city}
                                onChange={handleInputChange("city")}
                                InputProps={{ readOnly: !isEditing }}
                                variant={isEditing ? "outlined" : "filled"}
                                placeholder="Paris"
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Country"
                                value={profile.country}
                                onChange={handleInputChange("country")}
                                InputProps={{ readOnly: !isEditing }}
                                variant={isEditing ? "outlined" : "filled"}
                                required
                            />
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
