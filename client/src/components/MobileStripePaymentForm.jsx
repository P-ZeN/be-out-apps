import React, { useState, useTransition, Suspense, useEffect, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
    Elements,
    CardElement,
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
    TextField,
} from "@mui/material";
import { CreditCard, Lock } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getIsTauriApp } from "../utils/platformDetection";

// Initialize Stripe with the publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Enhanced card element options for mobile WebView compatibility
const getCardElementOptions = (theme, isMobile = false) => ({
    style: {
        base: {
            fontSize: isMobile ? "18px" : "16px", // Larger font for mobile
            color: theme.palette.text.primary,
            "::placeholder": {
                color: theme.palette.text.secondary,
            },
            fontFamily: theme.typography.fontFamily,
            fontSmoothing: "antialiased",
            backgroundColor: theme.palette.background.paper,
            padding: isMobile ? "14px" : "10px", // More padding for mobile touch
        },
        invalid: {
            color: theme.palette.error.main,
        },
        complete: {
            color: theme.palette.success.main,
        },
    },
    hidePostalCode: false,
    // Mobile-specific options
    ...(isMobile && {
        // Force focus behavior for mobile
        disableLink: false,
        // Enable card brand icons
        iconStyle: "solid",
        // Force keyboard to stay open
        hidePostalCode: true, // Simplify for mobile
    }),
});

// Internal payment form component with mobile fixes
const MobilePaymentFormContent = ({
    eventId,
    amount,
    currency,
    bookingData,
    onPaymentSuccess,
    onPaymentError,
    onCancel
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const theme = useTheme();
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState(null);
    const [isPending, startTransition] = useTransition();
    const [cardReady, setCardReady] = useState(false);
    const [cardFocused, setCardFocused] = useState(false);
    const cardContainerRef = useRef(null);
    const isMobile = getIsTauriApp();

    // Mobile WebView focus fix
    useEffect(() => {
        if (isMobile && cardContainerRef.current) {
            // Add mobile-specific styles and behaviors
            const container = cardContainerRef.current;

            // Add touch event handlers for better mobile interaction
            const handleTouchStart = (e) => {
                // Force focus on the card element
                const cardElement = elements?.getElement(CardElement);
                if (cardElement) {
                    // Trigger focus programmatically
                    setTimeout(() => {
                        cardElement.focus();
                    }, 100);
                }
            };

            container.addEventListener('touchstart', handleTouchStart, { passive: true });
            container.addEventListener('click', handleTouchStart);

            return () => {
                container.removeEventListener('touchstart', handleTouchStart);
                container.removeEventListener('click', handleTouchStart);
            };
        }
    }, [elements, isMobile]);

    const formatAmount = (amount) => {
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: currency.toUpperCase(),
        }).format(amount);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements) {
            console.log("Stripe not yet loaded");
            return;
        }

        const cardElement = elements.getElement(CardElement);

        if (!cardElement) {
            setPaymentError("Card element not found");
            return;
        }

        startTransition(() => {
            setIsProcessing(true);
            setPaymentError(null);
        });

        try {
            // Step 1: Create a pending booking first
            console.log("Creating booking for event:", eventId, "with data:", bookingData);
            const bookingResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/bookings`, {
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

            // Step 2: Create payment intent with the booking ID
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
                }),
            });

            if (!paymentResponse.ok) {
                const errorData = await paymentResponse.json();
                throw new Error(errorData.error || `Payment intent creation failed: ${paymentResponse.status}`);
            }

            const { client_secret, payment_intent_id } = await paymentResponse.json();
            console.log("Payment intent created:", payment_intent_id);

            // Step 3: Confirm payment with Stripe
            const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
                payment_method: {
                    card: cardElement,
                    billing_details: {
                        name: bookingResult.booking.customer_name,
                        email: bookingResult.booking.customer_email,
                    },
                },
            });

            if (stripeError) {
                console.error("Stripe error:", stripeError);
                setPaymentError(stripeError.message);
                onPaymentError?.(stripeError);
            } else if (paymentIntent.status === 'succeeded') {
                console.log("Payment succeeded:", paymentIntent);

                // Step 4: Confirm payment on server to update booking status
                const confirmResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/payments/confirm-payment`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        payment_intent_id: paymentIntent.id,
                        booking_id: bookingResult.booking.id,
                    }),
                });

                if (confirmResponse.ok) {
                    const confirmData = await confirmResponse.json();
                    console.log("Payment confirmed:", confirmData);

                    onPaymentSuccess?.({
                        paymentIntent,
                        booking: confirmData.booking,
                        message: "Payment successful and booking confirmed!"
                    });
                } else {
                    const errorData = await confirmResponse.json();
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

            {/* Mobile Instructions */}
            {isMobile && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                        📱 <strong>Mobile:</strong> Appuyez et maintenez sur le champ de carte pour activer le clavier.
                        Si le clavier ne s'affiche pas, essayez de fermer et rouvrir cette fenêtre.
                    </Typography>
                </Alert>
            )}

            {/* Card Input Section with Mobile Enhancements */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 600 }}>
                    Carte de crédit ou débit
                </Typography>

                <Box
                    ref={cardContainerRef}
                    sx={{
                        p: isMobile ? 3 : 2,
                        border: `2px solid ${cardFocused ? theme.palette.primary.main : theme.palette.divider}`,
                        borderRadius: theme.shape.borderRadius,
                        backgroundColor: theme.palette.background.paper,
                        minHeight: isMobile ? 60 : 50,
                        cursor: 'text',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            borderColor: theme.palette.primary.light,
                        },
                        '&:focus-within': {
                            borderColor: theme.palette.primary.main,
                            boxShadow: `0 0 0 2px ${theme.palette.primary.main}25`,
                        },
                        // Mobile-specific styles
                        ...(isMobile && {
                            touchAction: 'manipulation',
                            WebkitTouchCallout: 'none',
                            WebkitUserSelect: 'none',
                            userSelect: 'none',
                            WebkitTapHighlightColor: 'transparent',
                        }),
                    }}
                    onClick={() => {
                        // Additional mobile focus trigger
                        if (isMobile) {
                            const cardElement = elements?.getElement(CardElement);
                            if (cardElement) {
                                setTimeout(() => cardElement.focus(), 50);
                            }
                        }
                    }}
                >
                    <CardElement
                        options={getCardElementOptions(theme, isMobile)}
                        onReady={() => {
                            setCardReady(true);
                            console.log("Card element ready");
                        }}
                        onFocus={() => {
                            setCardFocused(true);
                            console.log("Card element focused");
                        }}
                        onBlur={() => {
                            setCardFocused(false);
                            console.log("Card element blurred");
                        }}
                        onChange={(event) => {
                            if (event.error) {
                                setPaymentError(event.error.message);
                            } else {
                                setPaymentError(null);
                            }
                            console.log("Card element changed:", event);
                        }}
                    />
                </Box>

                {/* Card Status Indicator */}
                {isMobile && (
                    <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Box sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: cardReady ? theme.palette.success.main : theme.palette.grey[400],
                        }} />
                        <Typography variant="caption" color="text.secondary">
                            {cardReady ? "Formulaire prêt" : "Chargement..."}
                        </Typography>
                        {cardFocused && (
                            <>
                                <Box sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: theme.palette.primary.main,
                                }} />
                                <Typography variant="caption" color="primary">
                                    Champ actif
                                </Typography>
                            </>
                        )}
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
                    disabled={!stripe || !cardReady || isProcessing || isPending}
                    size="large"
                    startIcon={isProcessing || isPending ? <CircularProgress size={20} color="inherit" /> : <Lock />}
                    sx={{ minWidth: 200 }}
                >
                    {isProcessing || isPending ?
                        'Traitement...' :
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
const MobileStripeLoading = () => {
    const theme = useTheme();
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
                Chargement du formulaire de paiement sécurisé...
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Optimisé pour mobile
            </Typography>
        </Box>
    );
};

// Main component with mobile-optimized Stripe Elements provider
const MobileStripePaymentForm = ({
    eventId,
    amount,
    currency = "eur",
    bookingData,
    onPaymentSuccess,
    onPaymentError,
    onCancel
}) => {
    const isMobile = getIsTauriApp();

    // Mobile-specific Elements options
    const elementsOptions = {
        appearance: {
            theme: 'stripe',
            variables: {
                // Mobile-optimized variables
                fontSizeBase: isMobile ? '18px' : '16px',
                spacingUnit: isMobile ? '6px' : '4px',
                borderRadius: '8px',
            },
        },
        // Enable mobile optimizations
        ...(isMobile && {
            clientSecret: null, // Will be set when payment intent is created
            loader: 'auto',
        }),
    };

    return (
        <Suspense fallback={<MobileStripeLoading />}>
            <Elements
                stripe={stripePromise}
                options={elementsOptions}
            >
                <MobilePaymentFormContent
                    eventId={eventId}
                    amount={amount}
                    currency={currency}
                    bookingData={bookingData}
                    onPaymentSuccess={onPaymentSuccess}
                    onPaymentError={onPaymentError}
                    onCancel={onCancel}
                />
            </Elements>
        </Suspense>
    );
};

export default MobileStripePaymentForm;
