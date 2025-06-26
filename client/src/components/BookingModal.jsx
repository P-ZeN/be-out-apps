import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    TextField,
    Button,
    Stepper,
    Step,
    StepLabel,
    Grid,
    Paper,
    Divider,
    Alert,
    CircularProgress,
    IconButton,
    InputAdornment,
    FormControlLabel,
    Checkbox,
} from "@mui/material";
import { Close, Person, Email, Phone, CreditCard, EventSeat, Schedule, LocationOn, Euro } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import BookingService from "../services/bookingService";

const BookingModal = ({ open, onClose, event }) => {
    const theme = useTheme();
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [bookingResult, setBookingResult] = useState(null);

    const [formData, setFormData] = useState({
        quantity: 1,
        customer_name: "",
        customer_email: "",
        customer_phone: "",
        special_requests: "",
        acceptTerms: false,
    });

    const steps = ["Détails", "Informations", "Paiement", "Confirmation"];

    const handleInputChange = (field) => (event) => {
        const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
        setError("");
    };

    const validateStep = (step) => {
        switch (step) {
            case 0:
                return formData.quantity >= 1 && formData.quantity <= (event?.available_tickets || 0);
            case 1:
                return (
                    formData.customer_name.trim() &&
                    formData.customer_email.trim() &&
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)
                );
            case 2:
                return formData.acceptTerms;
            default:
                return true;
        }
    };

    const handleNext = () => {
        if (!validateStep(activeStep)) {
            setError("Veuillez remplir tous les champs requis correctement.");
            return;
        }
        setActiveStep((prev) => prev + 1);
        setError("");
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
        setError("");
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError("");

        try {
            const bookingData = {
                event_id: event.id,
                quantity: parseInt(formData.quantity),
                customer_name: formData.customer_name,
                customer_email: formData.customer_email,
                customer_phone: formData.customer_phone,
                special_requests: formData.special_requests,
            };

            const validation = BookingService.validateBookingData(bookingData);
            if (!validation.isValid) {
                setError(validation.errors.join(", "));
                setLoading(false);
                return;
            }

            const result = await BookingService.createBooking(bookingData);

            // Simulate payment processing
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Confirm the booking
            await BookingService.confirmBooking(result.booking.id, {
                payment_method: "card",
                transaction_id: `TXN_${Date.now()}`,
            });

            setBookingResult(result);
            setSuccess(true);
            setActiveStep(3);
        } catch (err) {
            setError(err.message || "Une erreur est survenue lors de la réservation.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setActiveStep(0);
        setFormData({
            quantity: 1,
            customer_name: "",
            customer_email: "",
            customer_phone: "",
            special_requests: "",
            acceptTerms: false,
        });
        setError("");
        setSuccess(false);
        setBookingResult(null);
        onClose();
    };

    const totalPrice = event ? (event.discounted_price * formData.quantity).toFixed(2) : 0;
    const originalTotal = event ? (event.original_price * formData.quantity).toFixed(2) : 0;
    const savings = event ? (originalTotal - totalPrice).toFixed(2) : 0;

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Nombre de billets
                        </Typography>
                        <TextField
                            fullWidth
                            type="number"
                            label="Quantité"
                            value={formData.quantity}
                            onChange={handleInputChange("quantity")}
                            inputProps={{ min: 1, max: event?.available_tickets || 1 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EventSeat />
                                    </InputAdornment>
                                ),
                            }}
                            helperText={`${event?.available_tickets || 0} billets disponibles`}
                            sx={{ mb: 3 }}
                        />

                        <Paper sx={{ p: 2, backgroundColor: theme.palette.grey[50] }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Récapitulatif des prix
                            </Typography>
                            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                <Typography>Prix unitaire :</Typography>
                                <Typography>{event?.discounted_price}€</Typography>
                            </Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                <Typography>Quantité :</Typography>
                                <Typography>{formData.quantity}</Typography>
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                                    Total :
                                </Typography>
                                <Typography
                                    variant="subtitle1"
                                    sx={{ fontWeight: "bold", color: theme.palette.primary.main }}>
                                    {totalPrice}€
                                </Typography>
                            </Box>
                            {savings > 0 && (
                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                    <Typography variant="body2" color="success.main">
                                        Économie :
                                    </Typography>
                                    <Typography variant="body2" color="success.main">
                                        -{savings}€
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    </Box>
                );

            case 1:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Vos informations
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Nom complet"
                                    value={formData.customer_name}
                                    onChange={handleInputChange("customer_name")}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Person />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    required
                                    type="email"
                                    label="Email"
                                    value={formData.customer_email}
                                    onChange={handleInputChange("customer_email")}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Email />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="Téléphone (optionnel)"
                                    value={formData.customer_phone}
                                    onChange={handleInputChange("customer_phone")}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Phone />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label="Demandes spéciales (optionnel)"
                                    value={formData.special_requests}
                                    onChange={handleInputChange("special_requests")}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                );

            case 2:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Paiement sécurisé
                        </Typography>
                        <Paper sx={{ p: 2, mb: 3, backgroundColor: theme.palette.grey[50] }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Récapitulatif de la commande
                            </Typography>
                            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                <Typography>Événement :</Typography>
                                <Typography>{event?.title}</Typography>
                            </Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                <Typography>Billets :</Typography>
                                <Typography>
                                    {formData.quantity} × {event?.discounted_price}€
                                </Typography>
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                                    Total à payer :
                                </Typography>
                                <Typography
                                    variant="subtitle1"
                                    sx={{ fontWeight: "bold", color: theme.palette.primary.main }}>
                                    {totalPrice}€
                                </Typography>
                            </Box>
                        </Paper>

                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                p: 2,
                                backgroundColor: theme.palette.info.light,
                                borderRadius: 1,
                                mb: 2,
                            }}>
                            <CreditCard sx={{ mr: 2, color: theme.palette.info.main }} />
                            <Typography variant="body2">
                                Paiement sécurisé simulé - Aucune carte réelle n'est requise
                            </Typography>
                        </Box>

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={formData.acceptTerms}
                                    onChange={handleInputChange("acceptTerms")}
                                    color="primary"
                                />
                            }
                            label="J'accepte les conditions générales de vente"
                        />
                    </Box>
                );

            case 3:
                return (
                    <Box sx={{ textAlign: "center" }}>
                        {success ? (
                            <>
                                <Typography variant="h5" color="success.main" gutterBottom>
                                    🎉 Réservation confirmée !
                                </Typography>
                                <Typography variant="body1" sx={{ mb: 3 }}>
                                    Votre réservation a été confirmée avec succès.
                                </Typography>
                                {bookingResult && (
                                    <Paper sx={{ p: 2, backgroundColor: theme.palette.grey[50] }}>
                                        <Typography variant="subtitle1" gutterBottom>
                                            Numéro de référence
                                        </Typography>
                                        <Typography
                                            variant="h6"
                                            sx={{ fontFamily: "monospace", color: theme.palette.primary.main }}>
                                            {bookingResult.booking.booking_reference}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                            Vous recevrez vos billets par email
                                        </Typography>
                                    </Paper>
                                )}
                            </>
                        ) : (
                            <CircularProgress />
                        )}
                    </Box>
                );

            default:
                return null;
        }
    };

    if (!event) return null;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h6">Réserver - {event.title}</Typography>
                    <IconButton onClick={handleClose}>
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent>
                {/* Event Info Header */}
                <Paper
                    sx={{
                        p: 2,
                        mb: 3,
                        backgroundColor: theme.palette.primary.light,
                        color: theme.palette.primary.contrastText,
                    }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                        <Schedule sx={{ mr: 1 }} />
                        <Typography variant="body2">
                            {new Date(event.event_date).toLocaleDateString("fr-FR", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                        <LocationOn sx={{ mr: 1 }} />
                        <Typography variant="body2">
                            {event.venue_name}, {event.venue_city}
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Euro sx={{ mr: 1 }} />
                        <Typography variant="body2">
                            À partir de {event.discounted_price}€
                            {event.original_price > event.discounted_price && (
                                <span style={{ textDecoration: "line-through", marginLeft: 8 }}>
                                    {event.original_price}€
                                </span>
                            )}
                        </Typography>
                    </Box>
                </Paper>

                {/* Stepper */}
                <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {/* Error Alert */}
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Step Content */}
                {renderStepContent(activeStep)}
            </DialogContent>

            <DialogActions sx={{ p: 3 }}>
                <Button onClick={handleClose} disabled={loading}>
                    Annuler
                </Button>
                {activeStep > 0 && activeStep < 3 && (
                    <Button onClick={handleBack} disabled={loading}>
                        Retour
                    </Button>
                )}
                {activeStep < 2 && (
                    <Button variant="contained" onClick={handleNext} disabled={loading}>
                        Suivant
                    </Button>
                )}
                {activeStep === 2 && (
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={loading || !formData.acceptTerms}
                        startIcon={loading ? <CircularProgress size={20} /> : null}>
                        {loading ? "Traitement..." : `Payer ${totalPrice}€`}
                    </Button>
                )}
                {activeStep === 3 && success && (
                    <Button variant="contained" onClick={handleClose}>
                        Fermer
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default BookingModal;
