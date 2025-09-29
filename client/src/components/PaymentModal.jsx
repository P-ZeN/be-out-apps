import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    Button,
    Paper,
    Divider,
    Alert,
    IconButton,
    Card,
    CardContent,
    Chip,
} from "@mui/material";
import {
    Close,
    CheckCircle,
    Error,
    Schedule,
    LocationOn,
    Euro,
    CreditCard,
    Security
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import StripePaymentForm from "./StripePaymentForm";

const PaymentModal = ({ isOpen, onClose, event, bookingData, onPaymentSuccess, onPaymentError }) => {
    const theme = useTheme();
    const { t } = useTranslation(['bookings']);
    const [paymentStep, setPaymentStep] = useState("payment"); // 'payment' | 'success' | 'error'
    const [paymentResult, setPaymentResult] = useState(null);

    if (!isOpen || !event) return null;

    const handlePaymentSuccess = (result) => {
        setPaymentResult(result);
        setPaymentStep("success");
        onPaymentSuccess?.(result);
    };

    const handlePaymentError = (error) => {
        setPaymentResult({ error });
        setPaymentStep("error");
        onPaymentError?.(error);
    };

    const handleClose = () => {
        setPaymentStep("payment");
        setPaymentResult(null);
        onClose();
    };

    const formatEventDate = (date) => {
        return new Date(date).toLocaleDateString("fr-FR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR",
        }).format(price);
    };

    const renderPaymentStep = () => {
        switch (paymentStep) {
            case "success":
                return (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <CheckCircle
                            sx={{
                                fontSize: 64,
                                color: theme.palette.success.main,
                                mb: 2
                            }}
                        />
                        <Typography variant="h4" gutterBottom color="success.main">
                            Paiement Réussi !
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            Votre réservation a été confirmée avec succès.
                        </Typography>

                        {paymentResult?.booking && (
                            <Card sx={{ mb: 3, textAlign: 'left' }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Détails de la réservation
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>ID de réservation:</strong> {paymentResult.booking.booking_reference || paymentResult.booking.id}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>Événement:</strong> {event.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>Date:</strong> {formatEventDate(event.date)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>Quantité:</strong> {bookingData?.quantity || 1} billet(s)
                                    </Typography>
                                </CardContent>
                            </Card>
                        )}

                        <Button
                            variant="contained"
                            onClick={handleClose}
                            size="large"
                        >
                            Continuer
                        </Button>
                    </Box>
                );

            case "error":
                return (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Error
                            sx={{
                                fontSize: 64,
                                color: theme.palette.error.main,
                                mb: 2
                            }}
                        />
                        <Typography variant="h4" gutterBottom color="error.main">
                            Paiement Échoué
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            {paymentResult?.error?.message || "Une erreur inattendue s'est produite."}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                            <Button
                                variant="outlined"
                                onClick={() => setPaymentStep("payment")}
                            >
                                Réessayer
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleClose}
                            >
                                Fermer
                            </Button>
                        </Box>
                    </Box>
                );

            default:
                return (
                    <Box>
                        {/* Event Details Card */}
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <CreditCard sx={{ mr: 1, color: theme.palette.primary.main }} />
                                    <Typography variant="h6">
                                        Finaliser votre réservation
                                    </Typography>
                                </Box>

                                <Typography variant="h5" gutterBottom>
                                    {event.title}
                                </Typography>

                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <Schedule sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                                    <Typography variant="body2" color="text.secondary">
                                        {formatEventDate(event.date)}
                                    </Typography>
                                </Box>

                                {event.location && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <LocationOn sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                                        <Typography variant="body2" color="text.secondary">
                                            {event.location}
                                        </Typography>
                                    </Box>
                                )}

                                <Divider sx={{ my: 2 }} />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body1">
                                        Total ({bookingData?.quantity || 1} billet{(bookingData?.quantity || 1) > 1 ? 's' : ''})
                                    </Typography>
                                    <Chip
                                        label={formatPrice(event.price || 0)}
                                        color="primary"
                                        sx={{
                                            fontSize: '1.1rem',
                                            fontWeight: 600,
                                            height: 40
                                        }}
                                    />
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Security Notice */}
                        <Alert
                            severity="info"
                            icon={<Security />}
                            sx={{ mb: 3 }}
                        >
                            <Typography variant="body2">
                                Paiement sécurisé par Stripe. Vos informations de carte sont cryptées et ne sont jamais stockées sur nos serveurs.
                            </Typography>
                        </Alert>

                        {/* Stripe Payment Form */}
                        <StripePaymentForm
                            eventId={event.id}
                            amount={event.price || 0}
                            currency="eur"
                            bookingData={bookingData}
                            onPaymentSuccess={handlePaymentSuccess}
                            onPaymentError={handlePaymentError}
                            onCancel={handleClose}
                        />
                    </Box>
                );
        }
    };

    return (
        <Dialog
            open={isOpen}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: theme.shape.borderRadius * 2,
                    maxHeight: '90vh'
                }
            }}
        >
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: paymentStep === 'success' ? theme.palette.success.main :
                                paymentStep === 'error' ? theme.palette.error.main :
                                theme.palette.primary.main,
                color: 'white',
                mb: 0
            }}>
                <Typography variant="h6" component="div">
                    {paymentStep === 'success' ? 'Confirmation' :
                     paymentStep === 'error' ? 'Erreur de paiement' :
                     'Paiement sécurisé'}
                </Typography>
                <IconButton
                    onClick={handleClose}
                    sx={{ color: 'white' }}
                >
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{
                px: { xs: 2, sm: 3 }, // Responsive horizontal padding
                py: { xs: 1.5, sm: 3 }  // Reduced vertical padding on mobile
            }}>
                {renderPaymentStep()}
            </DialogContent>
        </Dialog>
    );
};

export default PaymentModal;
