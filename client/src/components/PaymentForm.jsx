import React, { useState, useEffect, useTransition } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useTranslation } from "react-i18next";
import {
    Box,
    Typography,
    Button,
    Paper,
    Alert,
    Divider,
    CircularProgress,
    Chip,
    Card,
    CardContent,
} from "@mui/material";
import {
    CreditCard,
    Security,
    Lock,
    CheckCircle
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import paymentService from "../services/paymentService";

const PaymentForm = ({ eventId, amount, currency = "eur", onPaymentSuccess, onPaymentError, onCancel }) => {
    const { t } = useTranslation(['payment', 'common']);
    const theme = useTheme();
    const [isLoading, setIsLoading] = useState(false);
    const [clientSecret, setClientSecret] = useState("");
    const [paymentIntent, setPaymentIntent] = useState(null);
    const [error, setError] = useState(null);
    const [paymentIntentCreated, setPaymentIntentCreated] = useState(false);
    const [stripeReady, setStripeReady] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Create payment intent when user first interacts with the form
    const createPaymentIntentIfNeeded = async () => {
        if (paymentIntentCreated) {
            return;
        }

        try {
            setIsLoading(true);
            const response = await paymentService.createPaymentIntent({
                eventId,
                amount,
                currency,
                metadata: {
                    source: "client_app",
                    event_id: eventId,
                },
            });

            setClientSecret(response.clientSecret);
            setPaymentIntent(response.paymentIntent);
            setPaymentIntentCreated(true);
            setError(null);
        } catch (err) {
            console.error("Error creating payment intent:", err);
            setError(err.message);
            onPaymentError?.(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        // Get Stripe instances only when submitting
        const stripe = window.Stripe ? await window.Stripe : null;
        const elements = stripe?.elements();

        if (!stripe || !elements) {
            setError("Payment system not available");
            return;
        }

        // Create payment intent if not already created
        if (!clientSecret) {
            await createPaymentIntentIfNeeded();
            return; // Will be called again once clientSecret is set
        }

        setIsLoading(true);
        setError(null);

        try {
            // Confirm the payment with Stripe
            const { error: stripeError, paymentIntent: confirmedPaymentIntent } = await stripe.confirmPayment({
                elements,
                clientSecret,
                confirmParams: {
                    return_url: `${window.location.origin}/payment-success`,
                },
                redirect: "if_required",
            });

            if (stripeError) {
                setError(stripeError.message);
                onPaymentError?.(stripeError);
            } else if (confirmedPaymentIntent && confirmedPaymentIntent.status === "succeeded") {
                // Confirm payment on our backend
                try {
                    const confirmResponse = await paymentService.confirmPayment(confirmedPaymentIntent.id, eventId);

                    onPaymentSuccess?.({
                        paymentIntent: confirmedPaymentIntent,
                        booking: confirmResponse.booking,
                    });
                } catch (confirmError) {
                    console.error("Error confirming payment on backend:", confirmError);
                    setError("Payment succeeded but booking confirmation failed. Please contact support.");
                    onPaymentError?.(confirmError);
                }
            }
        } catch (err) {
            console.error("Error during payment:", err);
            setError(err.message);
            onPaymentError?.(err);
        } finally {
            setIsLoading(false);
        }
    };

    const formatAmount = (amount, currency) => {
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: currency.toUpperCase(),
        }).format(amount / 100);
    };

    // Simple loading check
    if (isLoading && !paymentIntentCreated) {
        return (
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 6,
                textAlign: 'center'
            }}>
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                    Chargement du formulaire de paiement...
                </Typography>
            </Box>
        );
    }

    if (error && !clientSecret) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Alert severity="error" sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Erreur de configuration du paiement
                    </Typography>
                    <Typography variant="body2">
                        {error}
                    </Typography>
                </Alert>
                <Button
                    variant="outlined"
                    onClick={onCancel}
                    size="large"
                >
                    Fermer
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 500, mx: 'auto', p: 3 }}>
            {/* Payment Summary Card */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <CreditCard sx={{ mr: 1, color: theme.palette.primary.main }} />
                        <Typography variant="h6">
                            Résumé du paiement
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body1">
                            Total:
                        </Typography>
                        <Chip
                            label={formatAmount(amount, currency)}
                            color="primary"
                            sx={{
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                height: 36
                            }}
                        />
                    </Box>
                </CardContent>
            </Card>

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Initialize Payment State */}
                {!clientSecret && !isLoading && (
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <CheckCircle sx={{ fontSize: 48, color: theme.palette.success.main, mb: 2 }} />
                        <Typography variant="body1" sx={{ mb: 3 }}>
                            Prêt à traiter votre paiement de manière sécurisée via Stripe
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={() => startTransition(createPaymentIntentIfNeeded)}
                            startIcon={<Lock />}
                        >
                            Initialiser le paiement
                        </Button>
                    </Paper>
                )}

                {/* Loading State */}
                {isLoading && (
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                        <CircularProgress size={40} sx={{ mb: 2 }} />
                        <Typography variant="body2" color="text.secondary">
                            Configuration du paiement sécurisé...
                        </Typography>
                    </Paper>
                )}

                {/* Stripe Payment Element */}
                {clientSecret && (
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="body1" sx={{ mb: 2, fontWeight: 600 }}>
                            Informations de paiement
                        </Typography>
                        <Box sx={{ minHeight: 120 }}>
                            <PaymentElement
                                options={{
                                    layout: "tabs",
                                }}
                            />
                        </Box>
                    </Paper>
                )}

                {/* Error Display */}
                {error && (
                    <Alert severity="error">
                        {error}
                    </Alert>
                )}

                {/* Action Buttons */}
                {clientSecret && (
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
                        <Button
                            variant="outlined"
                            onClick={onCancel}
                            disabled={isLoading}
                            size="large"
                            sx={{ flex: 1 }}
                        >
                            {t('payment:form.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={!stripe || !clientSecret || isLoading}
                            size="large"
                            sx={{ flex: 1 }}
                            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Lock />}
                        >
                            {isLoading ?
                                t('payment:form.processing') :
                                t('payment:form.payAmount', { amount: formatAmount(amount, currency) })
                            }
                        </Button>
                    </Box>
                )}
            </Box>

            {/* Security Notice */}
            <Box sx={{
                mt: 3,
                pt: 2,
                borderTop: `1px solid ${theme.palette.divider}`,
                textAlign: 'center'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <Security sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                        {t('payment:form.securityMessage')}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default PaymentForm;
