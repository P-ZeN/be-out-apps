import React, { useState, useEffect } from "react";
import userService from "../services/userService";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button, TextField, Container, Typography, Box, Alert, Grid, Paper, Divider, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon, DeleteForever as DeleteIcon } from "@mui/icons-material";
import { formatDateForInput, formatDateForServer } from "../utils/dateUtils";

const Profile = () => {
    const { user, updateUser, logout } = useAuth();
    const { t } = useTranslation(["profile", "common"]);
    const navigate = useNavigate();
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
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingAccount, setDeletingAccount] = useState(false);

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
                setError(t("profile:fetchError"));
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
            setMessage(t("profile:updateSuccess"));

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
            setError(t("profile:updateError"));
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeletingAccount(true);
        setError("");

        try {
            await userService.deleteAccount();
            logout(); // Clear authentication state
            navigate("/", { replace: true }); // Redirect to home page
        } catch (error) {
            setError(t("profile:deleteAccountError"));
            setDeleteDialogOpen(false);
        } finally {
            setDeletingAccount(false);
        }
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="h4" gutterBottom>
                        {t("profile:title")}
                    </Typography>
                    {!isEditing ? (
                        <Button variant="contained" startIcon={<EditIcon />} onClick={handleEdit}>
                            {t("profile:edit")}
                        </Button>
                    ) : (
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <Button
                                variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={handleSave}
                                disabled={loading}>
                                {loading ? t("profile:saving") : t("profile:save")}
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<CancelIcon />}
                                onClick={handleCancel}
                                disabled={loading}>
                                {t("profile:cancel")}
                            </Button>
                        </Box>
                    )}
                </Box>

                <Paper elevation={3} sx={{ p: 4 }}>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="h6" gutterBottom>
                                {t("profile:sections.personalInfo")}
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label={t("profile:fields.firstName")}
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
                                label={t("profile:fields.lastName")}
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
                                label={t("profile:fields.email")}
                                value={user?.email || ""}
                                InputProps={{ readOnly: true }}
                                variant="filled"
                                helperText={t("profile:fields.emailHelper")}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label={t("profile:fields.phone")}
                                value={profile.phone}
                                onChange={handleInputChange("phone")}
                                InputProps={{ readOnly: !isEditing }}
                                variant={isEditing ? "outlined" : "filled"}
                                type="tel"
                                placeholder={t("profile:placeholders.phone")}
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label={t("profile:fields.dateOfBirth")}
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
                                {t("profile:sections.address")}
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 3 }}>
                            <TextField
                                fullWidth
                                label={t("profile:fields.streetNumber")}
                                value={profile.street_number}
                                onChange={handleInputChange("street_number")}
                                InputProps={{ readOnly: !isEditing }}
                                variant={isEditing ? "outlined" : "filled"}
                                placeholder={t("profile:placeholders.streetNumber")}
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 9 }}>
                            <TextField
                                fullWidth
                                label={t("profile:fields.streetName")}
                                value={profile.street_name}
                                onChange={handleInputChange("street_name")}
                                InputProps={{ readOnly: !isEditing }}
                                variant={isEditing ? "outlined" : "filled"}
                                placeholder={t("profile:placeholders.streetName")}
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label={t("profile:fields.postalCode")}
                                value={profile.postal_code}
                                onChange={handleInputChange("postal_code")}
                                InputProps={{ readOnly: !isEditing }}
                                variant={isEditing ? "outlined" : "filled"}
                                placeholder={t("profile:placeholders.postalCode")}
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label={t("profile:fields.city")}
                                value={profile.city}
                                onChange={handleInputChange("city")}
                                InputProps={{ readOnly: !isEditing }}
                                variant={isEditing ? "outlined" : "filled"}
                                placeholder={t("profile:placeholders.city")}
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label={t("profile:fields.country")}
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

                {/* GDPR Account Deletion */}
                <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                        {t("profile:deleteAccount.description")}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Button
                            variant="text"
                            color="error"
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => setDeleteDialogOpen(true)}
                            sx={{ fontSize: '0.75rem' }}
                        >
                            {t("profile:deleteAccount.buttonText")}
                        </Button>
                    </Box>
                </Box>

                {/* Delete Account Confirmation Dialog */}
                <Dialog
                    open={deleteDialogOpen}
                    onClose={() => !deletingAccount && setDeleteDialogOpen(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>
                        {t("profile:deleteAccount.confirmTitle")}
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            {t("profile:deleteAccount.confirmMessage")}
                        </DialogContentText>
                        <DialogContentText sx={{ mt: 2, fontWeight: 'bold', color: 'error.main' }}>
                            {t("profile:deleteAccount.warningMessage")}
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={deletingAccount}
                        >
                            {t("profile:deleteAccount.cancel")}
                        </Button>
                        <Button
                            onClick={handleDeleteAccount}
                            color="error"
                            variant="contained"
                            disabled={deletingAccount}
                            startIcon={deletingAccount ? null : <DeleteIcon />}
                        >
                            {deletingAccount ? t("profile:deleteAccount.deleting") : t("profile:deleteAccount.confirm")}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Container>
    );
};

export default Profile;
