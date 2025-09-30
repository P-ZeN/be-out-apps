import React, { useState, useTransition, Suspense, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import {
    Box,
    Typography,
    Button,
    Alert,
    Paper,
    CircularProgress,
    Divider,
} from "@mui/material";
import { CreditCard, Lock } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getIsTauriApp } from "../utils/platformDetection";

// Initialize Stripe with the publishable key
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Debug logging for production issues
if (!stripePublishableKey) {
    console.error('❌ VITE_STRIPE_PUBLISHABLE_KEY is not set');
} else if (!stripePublishableKey.startsWith('pk_')) {
    console.error('❌ Invalid Stripe publishable key format:', stripePublishableKey);
} else {
    console.log('✅ Stripe publishable key loaded:', stripePublishableKey.substring(0, 10) + '...');
}

const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

// Internal payment form component using modern PaymentElement
const PaymentFormContent = ({ eventId, amount, currency, bookingData, onPaymentSuccess, onPaymentError, onCancel, clientSecret, bookingId }) => {
    const stripe = useStripe();
    const elements = useElements();
    const theme = useTheme();
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState(null);
    const [isPending, startTransition] = useTransition();
    const [isReady, setIsReady] = useState(false);
    const isMobile = getIsTauriApp();

    const formatAmount = (amount) => {
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: currency.toUpperCase(),
        }).format(amount);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements || !clientSecret) {
            console.log("Stripe, elements, or client secret not ready");
            setPaymentError("Payment system not ready. Please try again.");
            return;
        }

        startTransition(() => {
            setIsProcessing(true);
            setPaymentError(null);
        });

        try {
            // Confirm payment using PaymentElement (simpler and more reliable)
            const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: window.location.origin + '/payment-success', // This won't be used in our case
                },
                redirect: 'if_required', // Prevent redirect, handle in-app
            });

            if (stripeError) {
                console.error("Stripe error:", stripeError);
                setPaymentError(stripeError.message);
                onPaymentError?.(stripeError);
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                console.log("Payment succeeded:", paymentIntent);

                // Payment succeeded - confirm on server
                console.log('About to confirm payment with booking_id:', bookingId, 'payment_intent_id:', paymentIntent.id);

                const confirmResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/payments/confirm-payment`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        payment_intent_id: paymentIntent.id,
                        booking_id: bookingId, // Pass the stored booking ID
                    }),
                });

                console.log('Confirm response status:', confirmResponse.status, 'ok:', confirmResponse.ok);

                if (confirmResponse.ok) {
                    const confirmData = await confirmResponse.json();
                    console.log("Payment confirmed:", confirmData);

                    onPaymentSuccess?.({
                        paymentIntent,
                        booking: confirmData.booking,
                        message: "Payment successful and booking confirmed!"
                    });
                } else {
                    console.log('Confirm response not ok. Status:', confirmResponse.status);
                    const responseText = await confirmResponse.text();
                    console.log('Response text:', responseText);

                    let errorData;
                    try {
                        errorData = JSON.parse(responseText);
                    } catch (e) {
                        errorData = { error: responseText };
                    }

                    throw new Error(errorData.error || "Payment succeeded but confirmation failed");
                }
            }
        } catch (error) {
            console.error("Payment error:", error);
            setPaymentError(error.message);
            onPaymentError?.(error);
        } finally {
            startTransition(() => {
                setIsProcessing(false);
            });
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit}>
            {/* Payment Details Section */}
            <Paper sx={{ p: 3, mb: 3, backgroundColor: theme.palette.grey[50] }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CreditCard sx={{ mr: 1, color: theme.palette.primary.main }} />
                    <Typography variant="h6">
                        Informations de paiement
                    </Typography>
                </Box>

                <Typography variant="body1" color="text.secondary">
                    Montant total: <strong>{formatAmount(amount)}</strong>
                </Typography>
            </Paper>

            {/* Payment Element Section - Universal and Mobile-Friendly */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 600 }}>
                    Méthode de paiement
                </Typography>

                {isMobile && !isReady && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                            📱 Chargement du formulaire de paiement optimisé pour mobile...
                        </Typography>
                    </Alert>
                )}

                <Box sx={{
                    minHeight: isMobile ? 80 : 60,
                    '& .StripeElement': {
                        padding: isMobile ? '16px' : '12px',
                        border: `2px solid ${theme.palette.divider}`,
                        borderRadius: theme.shape.borderRadius,
                        backgroundColor: theme.palette.background.paper,
                        transition: 'border-color 0.2s ease',
                    },
                    '& .StripeElement:hover': {
                        borderColor: theme.palette.primary.light,
                    },
                    '& .StripeElement--focus': {
                        borderColor: theme.palette.primary.main,
                        boxShadow: `0 0 0 2px ${theme.palette.primary.main}25`,
                    },
                    '& .StripeElement--invalid': {
                        borderColor: theme.palette.error.main,
                    },
                }}>
                    {clientSecret && (
                        <PaymentElement
                            onReady={() => {
                                setIsReady(true);
                                console.log("PaymentElement ready");
                            }}
                            onChange={(event) => {
                                if (event.error) {
                                    setPaymentError(event.error.message);
                                } else {
                                    setPaymentError(null);
                                }
                            }}
                            options={{
                                layout: isMobile ? {
                                    type: 'accordion',
                                    defaultCollapsed: false,
                                    radios: false,
                                    spacedAccordionItems: true
                                } : {
                                    type: 'tabs',
                                    defaultCollapsed: false,
                                },
                                fields: {
                                    billingDetails: 'auto',
                                },
                                // Remove invalid terms configuration that was causing warnings
                                terms: {
                                    card: 'never',
                                    auBecsDebit: 'never',
                                    bancontact: 'never',
                                    sepaDebit: 'never',
                                    sofort: 'never'
                                }
                            }}
                        />
                    )}
                </Box>

                {isMobile && isReady && (
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: theme.palette.success.main,
                        }} />
                        <Typography variant="caption" color="text.secondary">
                            Formulaire prêt - optimisé pour mobile
                        </Typography>
                    </Box>
                )}
            </Paper>

            {/* Error Display */}
            {paymentError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {paymentError}
                </Alert>
            )}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mb: 3 }}>
                <Button
                    variant="outlined"
                    onClick={onCancel}
                    disabled={isProcessing || isPending}
                    size="large"
                >
                    Annuler
                </Button>
                <Button
                    type="submit"
                    variant="contained"
                    disabled={!stripe || !elements || !clientSecret || !isReady || isProcessing || isPending}
                    size="large"
                    startIcon={isProcessing || isPending ? <CircularProgress size={20} color="inherit" /> : <Lock />}
                    sx={{ minWidth: 200 }}
                >
                    {isProcessing || isPending ?
                        'Traitement...' :
                        !isReady ?
                        'Chargement...' :
                        `Payer ${formatAmount(amount)}`
                    }
                </Button>
            </Box>

            {/* Stripe Branding */}
            <Box sx={{
                textAlign: 'center',
                pt: 2,
                borderTop: `1px solid ${theme.palette.divider}`
            }}>
                <Typography variant="caption" color="text.secondary">
                    🔒 Sécurisé par Stripe - Vos informations de paiement sont cryptées
                </Typography>
            </Box>
        </Box>
    );
};

// Loading component for Stripe
const StripeLoading = () => {
    const theme = useTheme();
    const isMobile = getIsTauriApp();

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
                Initialisation du paiement sécurisé...
            </Typography>
            {isMobile && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Optimisation mobile en cours
                </Typography>
            )}
        </Box>
    );
};

// Main component with Stripe Elements provider and payment intent setup
const StripePaymentForm = ({ eventId, amount, currency = "eur", bookingData, onPaymentSuccess, onPaymentError, onCancel }) => {
    const [clientSecret, setClientSecret] = useState(null);
    const [bookingId, setBookingId] = useState(null);
    const [setupError, setSetupError] = useState(null);
    const [isSettingUp, setIsSettingUp] = useState(true);
    const isMobile = getIsTauriApp();

    // Create booking and payment intent on component mount
    useEffect(() => {
        const setupPayment = async () => {
            try {
                setIsSettingUp(true);
                setSetupError(null);

                // Step 1: Create a pending booking
                console.log("Creating booking for event:", eventId, "with data:", bookingData);
                const bookingResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/bookings`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        event_id: eventId,
                        quantity: parseInt(bookingData?.quantity || 1),
                        customer_name: bookingData?.customer_name || "Test Customer",
                        customer_email: bookingData?.customer_email || "test@example.com",
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
                console.log("Booking created:", bookingResult);

                // Store booking ID for later use in payment confirmation
                setBookingId(bookingResult.booking.id);

                // Step 2: Create payment intent
                const paymentResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/payments/create-payment-intent`, {
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
                    }),
                });

                if (!paymentResponse.ok) {
                    const errorData = await paymentResponse.json();
                    throw new Error(errorData.error || `Payment intent creation failed: ${paymentResponse.status}`);
                }

                const { client_secret } = await paymentResponse.json();
                console.log("Payment intent created with client secret");
                setClientSecret(client_secret);

            } catch (error) {
                console.error("Payment setup error:", error);
                setSetupError(error.message);
                onPaymentError?.(error);
            } finally {
                setIsSettingUp(false);
            }
        };

        if (eventId && bookingData) {
            setupPayment();
        }
    }, [eventId, bookingData, onPaymentError]);

    if (isSettingUp) {
        return <StripeLoading />;
    }

    if (setupError || !clientSecret) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                        {setupError || "Impossible d'initialiser le paiement. Veuillez réessayer."}
                    </Typography>
                </Alert>
                <Button variant="outlined" onClick={onCancel}>
                    Fermer
                </Button>
            </Box>
        );
    }

    // Enhanced Elements options for mobile compatibility
    const elementsOptions = {
        clientSecret,
        appearance: {
            theme: 'stripe',
            variables: {
                fontFamily: 'ClashGrotesk, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSizeBase: isMobile ? '18px' : '16px',
                spacingUnit: isMobile ? '8px' : '6px',
                borderRadius: '8px',
                colorPrimary: '#FF5917',
            },
            rules: {
                '.Input': {
                    padding: isMobile ? '16px' : '12px',
                },
                '.Input:focus': {
                    border: '2px solid #FF5917',
                },
            }
        },
        loader: 'auto',
    };

    // Check if Stripe failed to initialize
    if (!stripePromise) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Configuration de paiement manquante
                    </Typography>
                    <Typography variant="body2">
                        La clé Stripe n'est pas configurée. Veuillez contacter l'administrateur.
                    </Typography>
                </Alert>
                <Button variant="outlined" onClick={onCancel}>
                    Fermer
                </Button>
            </Box>
        );
    }

    return (
        <Suspense fallback={<StripeLoading />}>
            <Elements stripe={stripePromise} options={elementsOptions}>
                <PaymentFormContent
                    eventId={eventId}
                    amount={amount}
                    currency={currency}
                    bookingData={bookingData}
                    clientSecret={clientSecret}
                    bookingId={bookingId}
                    onPaymentSuccess={onPaymentSuccess}
                    onPaymentError={onPaymentError}
                    onCancel={onCancel}
                />
            </Elements>
        </Suspense>
    );
};

export default StripePaymentForm;
