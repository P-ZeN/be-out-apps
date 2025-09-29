import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
import { useAuth } from "../context/AuthContext";
import BookingService from "../services/bookingService";
import PaymentModal from "./PaymentModal";
import { getEventPricingInfo, getBookingPricingOptions } from "../utils/pricingUtils";

const BookingModal = ({ open, onClose, event }) => {
    const theme = useTheme();
    const { user } = useAuth();
    const { t } = useTranslation(['bookings']);
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
        // Multi-tier pricing support
        pricing_category_id: null,
        pricing_tier_id: null,
        selected_pricing_option: null,
    });

    // Pre-fill user information when component mounts or user changes
    useEffect(() => {
        if (user && open) {
            const customerName = user.first_name && user.last_name
                ? `${user.first_name} ${user.last_name}`.trim()
                : "";

            setFormData(prev => ({
                ...prev,
                customer_name: customerName,
                customer_email: user.email || "",
                customer_phone: user.phone || "",
            }));
        }
    }, [user, open]);

    const steps = ["Tarification", "Détails", "Informations", "Paiement", "Confirmation"];

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
                return formData.pricingCategoryId && formData.pricingTierId;
            case 1:
                return formData.quantity >= 1 && formData.quantity <= (event?.available_tickets || 0);
            case 2:
                return (
                    formData.customer_name.trim() &&
                    formData.customer_email.trim() &&
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)
                );
            case 3:
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
        if (activeStep === 3) {
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
            setActiveStep(4);
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

        // Reset form but keep user information
        const customerName = user && user.first_name && user.last_name
            ? `${user.first_name} ${user.last_name}`.trim()
            : "";

        setFormData({
            quantity: 1,
            customer_name: customerName,
            customer_email: user?.email || "",
            customer_phone: user?.phone || "",
            special_requests: "",
            acceptTerms: false,
        });

        setError("");
        setSuccess(false);
        setBookingResult(null);
        setShowPaymentModal(false);
        onClose();
    };

    // Calculate pricing using the selected tier or default to cheapest
    const pricingInfo = event ? getEventPricingInfo(event) : null;
    const pricingOptions = event ? getBookingPricingOptions(event) : [];

    // Find the selected pricing option
    const selectedPricingOption = pricingOptions.find(option =>
        option.categoryId === formData.pricingCategoryId &&
        option.tierId === formData.pricingTierId
    );

    // Use selected tier pricing or fallback to default
    const unitPrice = selectedPricingOption ? selectedPricingOption.price : (pricingInfo ? pricingInfo.price : 0);
    const originalUnitPrice = selectedPricingOption ? selectedPricingOption.originalPrice : (pricingInfo ? pricingInfo.originalPrice : null);
    const totalPrice = event ? (unitPrice * formData.quantity).toFixed(2) : 0;
    const originalTotal = event && originalUnitPrice ? (originalUnitPrice * formData.quantity).toFixed(2) : 0;
    const savings = event && originalUnitPrice ? (originalTotal - totalPrice).toFixed(2) : 0;

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                const pricingOptions = getBookingPricingOptions(event);
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Choisissez votre tarif
                        </Typography>
                        <Grid container spacing={2}>
                            {pricingOptions.map((option) => (
                                <Grid size={{ xs: 12, sm: 6 }} key={option.id}>
                                    <Paper
                                        sx={{
                                            p: 2,
                                            cursor: 'pointer',
                                            border: formData.pricingCategoryId === option.categoryId &&
                                                   formData.pricingTierId === option.tierId
                                                ? `2px solid ${theme.palette.primary.main}`
                                                : `1px solid ${theme.palette.divider}`,
                                            '&:hover': {
                                                backgroundColor: theme.palette.action.hover,
                                            },
                                        }}
                                        onClick={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                pricingCategoryId: option.categoryId,
                                                pricingTierId: option.tierId
                                            }));
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Box>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                                    {option.displayName}
                                                </Typography>
                                                {option.categoryDescription && (
                                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                        {option.categoryDescription}
                                                    </Typography>
                                                )}
                                                {option.isEarlyBird && (
                                                    <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 0.5 }}>
                                                        🐦 Tarif Early Bird
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Box sx={{ textAlign: 'right' }}>
                                                <Typography variant="h6" color="primary.main">
                                                    {option.price}€
                                                </Typography>
                                                {option.originalPrice && option.originalPrice > option.price && (
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            textDecoration: 'line-through',
                                                            color: 'text.secondary'
                                                        }}
                                                    >
                                                        {option.originalPrice}€
                                                    </Typography>
                                                )}
                                                {option.discountPercentage && (
                                                    <Typography variant="caption" color="success.main">
                                                        -{option.discountPercentage}%
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                        {option.availableQuantity && option.availableQuantity < 10 && (
                                            <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 1 }}>
                                                ⚠️ Plus que {option.availableQuantity} places disponibles
                                            </Typography>
                                        )}
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                );

            case 1:
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
                                <Typography>{unitPrice}€</Typography>
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

            case 2:
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

            case 3:
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
                            {selectedPricingOption && (
                                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                    <Typography>Tarif :</Typography>
                                    <Typography>{selectedPricingOption.displayName}</Typography>
                                </Box>
                            )}
                            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                <Typography>Billets :</Typography>
                                <Typography>
                                    {formData.quantity} × {unitPrice}€
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
                            {originalUnitPrice && originalUnitPrice > unitPrice && (
                                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
                                    <Typography variant="body2" color="success.main">
                                        Économies :
                                    </Typography>
                                    <Typography variant="body2" color="success.main">
                                        -{savings}€
                                    </Typography>
                                </Box>
                            )}
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
                            label="J'accepte les conditions générales de vente"
                        />
                    </Box>
                );

            case 4:
                return (
                    <Box sx={{ textAlign: "center" }}>
                        {success ? (
                            <>
                                <Typography variant="h5" color="success.main" gutterBottom>
                                    {t('bookings:success.title')}
                                </Typography>
                                <Typography variant="body1" sx={{ mb: 3 }}>
                                    {t('bookings:success.message')}
                                </Typography>
                                {bookingResult && (
                                    <Paper sx={{ p: 2, backgroundColor: theme.palette.grey[50] }}>
                                        <Typography variant="subtitle1" gutterBottom>
                                            {t('bookings:success.reference_label')}
                                        </Typography>
                                        <Typography
                                            variant="h6"
                                            sx={{ fontFamily: "monospace", color: theme.palette.primary.main }}>
                                            {bookingResult.booking.booking_reference}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                            {t('bookings:success.email_info')}
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
        <>
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h6">Réserver - {event.title}</Typography>
                    <IconButton onClick={handleClose}>
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent
                sx={{
                    px: { xs: 2, sm: 3 }, // Reduced horizontal padding on mobile
                    py: { xs: 2, sm: 3 }  // Reduced vertical padding on mobile
                }}
            >
                {/* Event Info Header */}
                <Paper
                    sx={{
                        p: { xs: 1.5, sm: 2 }, // Responsive padding for event info
                        mb: { xs: 2, sm: 3 },
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
                            {(() => {
                                const pricingInfo = getEventPricingInfo(event);
                                if (pricingInfo.price === 0) {
                                    return "Gratuit";
                                }
                                if (pricingInfo.hasMultiplePrices) {
                                    return `À partir de ${pricingInfo.price}€`;
                                }
                                return (
                                    <>
                                        {pricingInfo.price}€
                                        {pricingInfo.originalPrice && pricingInfo.originalPrice > pricingInfo.price && (
                                            <span style={{ textDecoration: "line-through", marginLeft: 8 }}>
                                                {pricingInfo.originalPrice}€
                                            </span>
                                        )}
                                    </>
                                );
                            })()}
                        </Typography>
                    </Box>
                </Paper>

                {/* Stepper - Mobile Responsive */}
                <Stepper
                    activeStep={activeStep}
                    sx={{
                        mb: 3,
                        // Mobile responsive stepper
                        '& .MuiStepper-root': {
                            flexWrap: 'wrap'
                        },
                        '& .MuiStep-root': {
                            // Allow steps to wrap on mobile
                            minWidth: {
                                xs: '60px', // Very compact on mobile
                                sm: '80px',
                                md: 'auto'
                            },
                            padding: {
                                xs: '2px',
                                sm: '4px',
                                md: '8px'
                            }
                        },
                        '& .MuiStepLabel-label': {
                            fontSize: {
                                xs: '0.7rem',  // Smaller text on mobile
                                sm: '0.8rem',
                                md: '0.875rem'
                            },
                            // Hide step labels on very small screens
                            display: {
                                xs: 'none',
                                sm: 'block'
                            }
                        },
                        // Show only step numbers on mobile
                        '& .MuiStepIcon-root': {
                            fontSize: {
                                xs: '1.2rem',
                                sm: '1.5rem',
                                md: '1.5rem'
                            }
                        }
                    }}
                    orientation="horizontal"
                    alternativeLabel
                >
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
                {activeStep > 0 && activeStep < 4 && (
                    <Button onClick={handleBack} disabled={loading}>
                        Retour
                    </Button>
                )}
                {activeStep < 3 && (
                    <Button variant="contained" onClick={handleNext} disabled={loading}>
                        Suivant
                    </Button>
                )}
                {activeStep === 3 && (
                    <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={loading || !formData.acceptTerms}>
                        {`Payer ${totalPrice}€`}
                    </Button>
                )}
                {activeStep === 4 && success && (
                    <Button variant="contained" onClick={handleClose}>
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
            bookingData={formData}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
        />
    </>
    );
};

export default BookingModal;
