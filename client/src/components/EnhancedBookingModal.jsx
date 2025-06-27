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
import PaymentModal from "./PaymentModal";

const EnhancedBookingModal = ({ open, onClose, event }) => {
    const theme = useTheme();
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [bookingResult, setBookingResult] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

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

        // If we're on the payment step, show the payment modal
        if (activeStep === 2) {
            setShowPaymentModal(true);
            return;
        }

        setActiveStep((prev) => prev + 1);
        setError("");
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
        setError("");
    };

    const handlePaymentSuccess = async (paymentResult) => {
        setLoading(true);
        try {
            // Update the booking with customer information
            const bookingData = {
                event_id: event.id,
                quantity: parseInt(formData.quantity),
                customer_name: formData.customer_name,
                customer_email: formData.customer_email,
                customer_phone: formData.customer_phone,
                special_requests: formData.special_requests,
                payment_intent_id: paymentResult.paymentIntent.id,
            };

            // The payment confirmation already created the booking, so we just need to update it
            setBookingResult(paymentResult);
            setSuccess(true);
            setActiveStep(3);
            setShowPaymentModal(false);
        } catch (err) {
            setError(err.message || "Une erreur est survenue lors de la finalisation de la réservation.");
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentError = (error) => {
        setError(error.message || "Une erreur est survenue lors du paiement.");
        setShowPaymentModal(false);
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
        setShowPaymentModal(false);
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
                            Détails de la réservation
                        </Typography>

                        {event && (
                            <Paper sx={{ p: 2, mb: 3, backgroundColor: theme.palette.grey[50] }}>
                                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                    <EventSeat sx={{ mr: 2, color: theme.palette.primary.main }} />
                                    <Typography variant="subtitle1">{event.title}</Typography>
                                </Box>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                            <Schedule sx={{ mr: 1, fontSize: 16 }} />
                                            <Typography variant="body2">
                                                {new Date(event.date).toLocaleDateString("fr-FR")}
                                            </Typography>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                            <LocationOn sx={{ mr: 1, fontSize: 16 }} />
                                            <Typography variant="body2">
                                                {event.location || "Lieu à confirmer"}
                                            </Typography>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                            <Euro sx={{ mr: 1, fontSize: 16 }} />
                                            <Typography variant="body2">
                                                {event.discounted_price}€ par billet
                                                {event.original_price > event.discounted_price && (
                                                    <Typography
                                                        component="span"
                                                        sx={{
                                                            textDecoration: "line-through",
                                                            color: theme.palette.text.secondary,
                                                            ml: 1,
                                                        }}>
                                                        {event.original_price}€
                                                    </Typography>
                                                )}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Paper>
                        )}

                        <TextField
                            fullWidth
                            label="Nombre de billets"
                            type="number"
                            value={formData.quantity}
                            onChange={handleInputChange("quantity")}
                            inputProps={{
                                min: 1,
                                max: event?.available_tickets || 10,
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EventSeat />
                                    </InputAdornment>
                                ),
                            }}
                            helperText={`Disponible: ${event?.available_tickets || 0} billets`}
                            sx={{ mb: 2 }}
                        />

                        {formData.quantity > 0 && (
                            <Paper sx={{ p: 2, backgroundColor: theme.palette.primary.light }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Résumé des prix
                                </Typography>
                                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                    <Typography variant="body2">
                                        {formData.quantity} × {event?.discounted_price}€
                                    </Typography>
                                    <Typography variant="body2">{totalPrice}€</Typography>
                                </Box>
                                {savings > 0 && (
                                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                        <Typography variant="body2" color="success.main">
                                            Économies
                                        </Typography>
                                        <Typography variant="body2" color="success.main">
                                            -{savings}€
                                        </Typography>
                                    </Box>
                                )}
                                <Divider sx={{ my: 1 }} />
                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                                        Total
                                    </Typography>
                                    <Typography
                                        variant="subtitle1"
                                        sx={{ fontWeight: "bold", color: theme.palette.primary.main }}>
                                        {totalPrice}€
                                    </Typography>
                                </Box>
                            </Paper>
                        )}
                    </Box>
                );

            case 1:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Informations personnelles
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Nom complet *"
                                    value={formData.customer_name}
                                    onChange={handleInputChange("customer_name")}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Person />
                                            </InputAdornment>
                                        ),
                                    }}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Email *"
                                    type="email"
                                    value={formData.customer_email}
                                    onChange={handleInputChange("customer_email")}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Email />
                                            </InputAdornment>
                                        ),
                                    }}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Téléphone"
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

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Demandes spéciales"
                                    multiline
                                    rows={3}
                                    value={formData.special_requests}
                                    onChange={handleInputChange("special_requests")}
                                    placeholder="Allergies, besoins spéciaux, commentaires..."
                                />
                            </Grid>
                        </Grid>
                    </Box>
                );

            case 2:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Récapitulatif et conditions
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
                                <Typography>Client :</Typography>
                                <Typography>{formData.customer_name}</Typography>
                            </Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                <Typography>Email :</Typography>
                                <Typography>{formData.customer_email}</Typography>
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
                                Paiement sécurisé via Stripe - Cartes acceptées: Visa, Mastercard, American Express
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
                            label="J'accepte les conditions générales de vente et la politique de remboursement"
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
                                    Votre paiement a été traité avec succès et votre réservation est confirmée.
                                </Typography>

                                {bookingResult?.booking && (
                                    <Paper sx={{ p: 2, backgroundColor: theme.palette.success.light }}>
                                        <Typography variant="subtitle1" gutterBottom>
                                            Détails de la réservation
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>ID de réservation:</strong> {bookingResult.booking.id}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Événement:</strong> {event?.title}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Date:</strong> {new Date(event?.date).toLocaleDateString("fr-FR")}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Billets:</strong> {formData.quantity}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Total payé:</strong> {totalPrice}€
                                        </Typography>
                                    </Paper>
                                )}

                                <Typography variant="body2" sx={{ mt: 2, color: theme.palette.text.secondary }}>
                                    Un email de confirmation a été envoyé à {formData.customer_email}
                                </Typography>
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

    const getStepButtonText = () => {
        if (activeStep === steps.length - 1) return "Terminer";
        if (activeStep === 2) return "Procéder au paiement";
        return "Suivant";
    };

    return (
        <>
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="h6">Réservation - {event?.title}</Typography>
                        <IconButton onClick={handleClose}>
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent>
                    <Box sx={{ width: "100%", mb: 3 }}>
                        <Stepper activeStep={activeStep} alternativeLabel>
                            {steps.map((label) => (
                                <Step key={label}>
                                    <StepLabel>{label}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {renderStepContent(activeStep)}
                </DialogContent>

                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={handleBack} disabled={activeStep === 0 || success}>
                        Retour
                    </Button>
                    <Box sx={{ flex: "1 1 auto" }} />
                    {activeStep < steps.length - 1 && (
                        <Button
                            variant="contained"
                            onClick={handleNext}
                            disabled={!validateStep(activeStep) || loading}>
                            {getStepButtonText()}
                        </Button>
                    )}
                    {activeStep === steps.length - 1 && (
                        <Button variant="contained" onClick={handleClose} disabled={loading}>
                            Fermer
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                event={{
                    ...event,
                    price: parseFloat(totalPrice),
                }}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
            />
        </>
    );
};

export default EnhancedBookingModal;
