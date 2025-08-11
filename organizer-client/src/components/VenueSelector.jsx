import React, { useState } from "react";
import {
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Typography,
    Divider,
} from "@mui/material";
import { LocationOn, Add, Save } from "@mui/icons-material";
import organizerService from "../services/organizerService";

const VenueSelector = ({
    venues,
    selectedVenueId,
    onVenueChange,
    error,
    onVenuesUpdate,
    onError,
    onSuccess
}) => {
    // New venue dialog state
    const [openVenueDialog, setOpenVenueDialog] = useState(false);
    const [venueDialogLoading, setVenueDialogLoading] = useState(false);
    const [newVenueData, setNewVenueData] = useState({
        name: "",
        capacity: "",
        address_line_1: "",
        address_line_2: "",
        locality: "",
        administrative_area: "",
        postal_code: "",
        country_code: "FR",
        latitude: "",
        longitude: "",
    });

    // Countries list for venue creation
    const countries = [
        { code: "FR", name: "France" },
        { code: "ES", name: "Espagne" },
        { code: "IT", name: "Italie" },
        { code: "DE", name: "Allemagne" },
        { code: "GB", name: "Royaume-Uni" },
        { code: "BE", name: "Belgique" },
        { code: "CH", name: "Suisse" },
        { code: "LU", name: "Luxembourg" },
    ];

    // Handle venue creation
    const handleCreateVenue = () => {
        setNewVenueData({
            name: "",
            capacity: "",
            address_line_1: "",
            address_line_2: "",
            locality: "",
            administrative_area: "",
            postal_code: "",
            country_code: "FR",
            latitude: "",
            longitude: "",
        });
        setOpenVenueDialog(true);
    };

    const handleVenueDataChange = (field, value) => {
        setNewVenueData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSaveNewVenue = async () => {
        // Basic validation
        if (!newVenueData.name.trim() || !newVenueData.address_line_1.trim() || !newVenueData.locality.trim()) {
            onError("Veuillez remplir les champs obligatoires du nouveau lieu");
            return;
        }

        setVenueDialogLoading(true);

        try {
            const venueData = {
                ...newVenueData,
                capacity: newVenueData.capacity ? Number(newVenueData.capacity) : null,
                latitude: newVenueData.latitude ? Number(newVenueData.latitude) : null,
                longitude: newVenueData.longitude ? Number(newVenueData.longitude) : null,
            };

            const newVenue = await organizerService.createVenue(venueData);

            // Reload venues
            const venuesData = await organizerService.getVenues();
            onVenuesUpdate(venuesData);

            // Select the new venue
            onVenueChange(newVenue.id);

            setOpenVenueDialog(false);
            onSuccess("Nouveau lieu créé et sélectionné !");
        } catch (error) {
            onError(error.message || "Erreur lors de la création du lieu");
        } finally {
            setVenueDialogLoading(false);
        }
    };

    return (
        <>
            <Grid size={{ xs: 12 }}>
                <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", mt: 2 }}>
                    <LocationOn sx={{ mr: 1 }} />
                    Lieu et catégorie
                </Typography>
                <Divider sx={{ mb: 3 }} />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth error={!!error} required>
                    <InputLabel>Lieu</InputLabel>
                    <Select
                        value={selectedVenueId}
                        onChange={(e) => onVenueChange(e.target.value)}
                        label="Lieu">
                        {venues.map((venue) => (
                            <MenuItem key={venue.id} value={venue.id}>
                                {venue.name} - {venue.formatted_address || `${venue.locality || ""}`}
                            </MenuItem>
                        ))}
                    </Select>
                    {error && <FormHelperText>{error}</FormHelperText>}
                </FormControl>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    onClick={handleCreateVenue}
                    sx={{ mt: 1 }}>
                    Créer un nouveau lieu
                </Button>
            </Grid>

            {/* New Venue Dialog */}
            <Dialog open={openVenueDialog} onClose={() => setOpenVenueDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>Créer un nouveau lieu</DialogTitle>
                <DialogContent>
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Nom du lieu"
                                value={newVenueData.name}
                                onChange={(e) => handleVenueDataChange("name", e.target.value)}
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Capacité"
                                type="number"
                                value={newVenueData.capacity}
                                onChange={(e) => handleVenueDataChange("capacity", e.target.value)}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Adresse"
                                value={newVenueData.address_line_1}
                                onChange={(e) => handleVenueDataChange("address_line_1", e.target.value)}
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Ville"
                                value={newVenueData.locality}
                                onChange={(e) => handleVenueDataChange("locality", e.target.value)}
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Code postal"
                                value={newVenueData.postal_code}
                                onChange={(e) => handleVenueDataChange("postal_code", e.target.value)}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth required>
                                <InputLabel>Pays</InputLabel>
                                <Select
                                    value={newVenueData.country_code}
                                    onChange={(e) => handleVenueDataChange("country_code", e.target.value)}
                                    label="Pays">
                                    {countries.map((country) => (
                                        <MenuItem key={country.code} value={country.code}>
                                            {country.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenVenueDialog(false)} disabled={venueDialogLoading}>
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSaveNewVenue}
                        variant="contained"
                        disabled={venueDialogLoading}
                        startIcon={venueDialogLoading ? <CircularProgress size={20} /> : <Save />}>
                        {venueDialogLoading ? "Création..." : "Créer le lieu"}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default VenueSelector;
