import React, { useState, useEffect, useRef } from "react";
import {
    Box,
    Typography,
    Button,
    Alert,
    Paper,
    CircularProgress,
    TextField,
    Grid,
    Card,
    CardContent,
    Chip,
} from "@mui/material";
import { CreditCard, Lock, Security } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getIsTauriApp } from "../utils/platformDetection";

/**
 * Alternative payment form that works better in mobile WebViews
 * Uses Stripe's Payment Element instead of CardElement for better mobile compatibility
 */
const MobileCompatiblePaymentForm = ({
    eventId,
    amount,
    currency = "eur",
    bookingData,
    onPaymentSuccess,
    onPaymentError,
    onCancel
}) => {
    const theme = useTheme();
    const [isLoading, setIsLoading] = useState(false);
    const [clientSecret, setClientSecret] = useState("");
    const [error, setError] = useState(null);
    const [stripeInstance, setStripeInstance] = useState(null);
    const [elementsInstance, setElementsInstance] = useState(null);
    const [paymentElementReady, setPaymentElementReady] = useState(false);
    const paymentElementRef = useRef(null);
    const isMobile = getIsTauriApp();

    useEffect(() => {
        // Load Stripe dynamically for better mobile compatibility
        const loadStripe = async () => {
            try {
                const { loadStripe: stripeLoader } = await import("@stripe/stripe-js");
                const stripe = await stripeLoader(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
                setStripeInstance(stripe);
                console.log("Stripe loaded successfully for mobile");
            } catch (error) {
                console.error("Error loading Stripe:", error);
                setError("Failed to load payment system");
            }
        };

        loadStripe();
    }, []);

    // Create payment intent and set up Elements
    useEffect(() => {
        if (stripeInstance && !clientSecret && !isLoading) {
            createPaymentIntent();
        }
    }, [stripeInstance]);

    const createPaymentIntent = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Step 1: Create a pending booking
            console.log("Creating booking for mobile payment...");
            const bookingResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    event_id: eventId,
                    quantity: parseInt(bookingData?.quantity || 1),
                    customer_name: bookingData?.customer_name || "Mobile Customer",
                    customer_email: bookingData?.customer_email || "mobile@example.com",
                    customer_phone: bookingData?.customer_phone || "",
                    special_requests: bookingData?.special_requests || "",
                    pricing_category_id: bookingData?.pricingCategoryId,
                    pricing_tier_id: bookingData?.pricingTierId,
                }),
            });

            if (!bookingResponse.ok) {
                const errorData = await bookingResponse.json();
                throw new Error(errorData.error || `Booking creation failed: ${bookingResponse.status}`);
            }

            const bookingResult = await bookingResponse.json();
            console.log("Mobile booking created:", bookingResult);

            // Step 2: Create payment intent
            const paymentResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/payments/create-payment-intent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    booking_id: bookingResult.booking.id,
                    amount: bookingResult.booking.total_price,
                    event_title: bookingResult.event?.title,
                    customer_email: bookingResult.booking.customer_email,
                    metadata: {
                        platform: "mobile_app",
                        tauri: isMobile ? "true" : "false",
                        booking_id: bookingResult.booking.id,
                    }
                }),
            });

            if (!paymentResponse.ok) {
                const errorData = await paymentResponse.json();
                throw new Error(errorData.error || `Payment intent creation failed: ${paymentResponse.status}`);
            }

            const { client_secret, payment_intent_id } = await paymentResponse.json();
            console.log("Mobile payment intent created:", payment_intent_id);

            setClientSecret(client_secret);

            // Step 3: Create Elements instance with mobile-optimized options
            const elements = stripeInstance.elements({
                clientSecret: client_secret,
                appearance: {
                    theme: 'stripe',
                    variables: {
                        fontFamily: theme.typography.fontFamily,
                        fontSizeBase: isMobile ? '18px' : '16px',
                        spacingUnit: isMobile ? '8px' : '6px',
                        borderRadius: '8px',
                        colorPrimary: theme.palette.primary.main,
                        colorBackground: theme.palette.background.paper,
                        colorText: theme.palette.text.primary,
                        colorDanger: theme.palette.error.main,
                    },
                },
                loader: 'auto',
            });

            setElementsInstance(elements);

            // Step 4: Mount Payment Element with mobile optimization
            setTimeout(() => {
                if (paymentElementRef.current && elements) {
                    const paymentElement = elements.create('payment', {
                        layout: {
                            type: 'accordion',
                            defaultCollapsed: false,
                            radios: false,
                            spacedAccordionItems: false
                        },
                        fields: {
                            billingDetails: {
                                name: 'auto',
                                email: 'auto',
                                phone: 'auto',
                                address: {
                                    country: 'never',
                                    line1: 'never',
                                    line2: 'never',
                                    city: 'never',
                                    state: 'never',
                                    postalCode: 'never',
                                }
                            }
                        },
                        terms: {
                            card: 'never',
                        },
                        // Mobile-specific options
                        wallets: {
                            applePay: 'auto',
                            googlePay: 'auto',
                        }
                    });

                    paymentElement.mount(paymentElementRef.current);

                    paymentElement.on('ready', () => {
                        setPaymentElementReady(true);
                        console.log("Payment element ready for mobile");
                    });

                    paymentElement.on('change', (event) => {
                        if (event.error) {
                            setError(event.error.message);
                        } else {
                            setError(null);
                        }
                    });

                    // Store booking info for later use
                    window._mobileBookingData = bookingResult;
                }
            }, 500); // Give some time for the ref to be ready

        } catch (error) {
            console.error("Error creating mobile payment intent:", error);
            setError(error.message);
            onPaymentError?.(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripeInstance || !elementsInstance || !clientSecret) {
            setError("Payment system not ready");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            console.log("Confirming mobile payment...");

            const { error: stripeError, paymentIntent } = await stripeInstance.confirmPayment({
                elements: elementsInstance,
                clientSecret: clientSecret,
                confirmParams: {
                    return_url: `${window.location.origin}/payment-success`,
                },
                redirect: "if_required",
            });

            if (stripeError) {
                console.error("Stripe mobile error:", stripeError);
                setError(stripeError.message);
                onPaymentError?.(stripeError);
            } else if (paymentIntent && paymentIntent.status === "succeeded") {
                console.log("Mobile payment succeeded:", paymentIntent);

                // Confirm payment on backend
                const confirmResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/payments/confirm-payment`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        payment_intent_id: paymentIntent.id,
                        booking_id: window._mobileBookingData?.booking?.id,
                    }),
                });

                if (confirmResponse.ok) {
                    const confirmData = await confirmResponse.json();
                    console.log("Mobile payment confirmed:", confirmData);

                    onPaymentSuccess?.({
                        paymentIntent,
                        booking: confirmData.booking,
                        message: "Mobile payment successful!"
                    });
                } else {
                    const errorData = await confirmResponse.json();
                    throw new Error(errorData.error || "Payment succeeded but confirmation failed");
                }
            }
        } catch (error) {
            console.error("Mobile payment error:", error);
            setError(error.message);
            onPaymentError?.(error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatAmount = (amount) => {
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: currency.toUpperCase(),
        }).format(amount);
    };

    // Loading state
    if (!stripeInstance || (!clientSecret && isLoading)) {
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
                    {isMobile ? "Chargement du paiement mobile..." : "Chargement du paiement..."}
                </Typography>
            </Box>
        );
    }

    // Error state
    if (error && !clientSecret) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Alert severity="error" sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Erreur de paiement mobile
                    </Typography>
                    <Typography variant="body2">
                        {error}
                    </Typography>
                </Alert>
                <Button variant="outlined" onClick={onCancel} size="large">
                    Fermer
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 500, mx: 'auto', p: 3 }}>
            {/* Mobile Payment Header */}
            {isMobile && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                        📱 <strong>Version mobile optimisée</strong> - Formulaire de paiement adapté aux écrans tactiles
                    </Typography>
                </Alert>
            )}

            {/* Payment Summary */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <CreditCard sx={{ mr: 1, color: theme.palette.primary.main }} />
                        <Typography variant="h6">
                            Paiement sécurisé
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body1">
                            Montant total:
                        </Typography>
                        <Chip
                            label={formatAmount(amount)}
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
                {/* Payment Element Container */}
                <Paper sx={{ p: 3 }}>
                    <Typography variant="body1" sx={{ mb: 3, fontWeight: 600 }}>
                        Informations de paiement
                    </Typography>

                    <Box
                        ref={paymentElementRef}
                        sx={{
                            minHeight: isMobile ? 200 : 150,
                            '& .p-Element': {
                                padding: isMobile ? '16px' : '12px',
                                fontSize: isMobile ? '18px' : '16px',
                            }
                        }}
                    />

                    {/* Status indicator */}
                    {clientSecret && (
                        <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Box sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: paymentElementReady ? theme.palette.success.main : theme.palette.grey[400],
                            }} />
                            <Typography variant="caption" color="text.secondary">
                                {paymentElementReady ? "Prêt pour le paiement" : "Initialisation..."}
                            </Typography>
                        </Box>
                    )}
                </Paper>

                {/* Error Display */}
                {error && (
                    <Alert severity="error">
                        {error}
                    </Alert>
                )}

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
                    <Button
                        variant="outlined"
                        onClick={onCancel}
                        disabled={isLoading}
                        size="large"
                        sx={{ flex: 1 }}
                    >
                        Annuler
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={!paymentElementReady || isLoading}
                        size="large"
                        sx={{ flex: 2 }}
                        startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Lock />}
                    >
                        {isLoading ?
                            'Traitement...' :
                            `Payer ${formatAmount(amount)}`
                        }
                    </Button>
                </Box>
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
                        🔒 Paiement sécurisé par Stripe - Optimisé pour mobile
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default MobileCompatiblePaymentForm;
