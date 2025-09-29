import React, { useState, useTransition, Suspense } from "react";
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
} from "@mui/material";
import { CreditCard, Lock } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";

// Initialize Stripe with the publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Card element options for styling - adapted to Material-UI theme
const getCardElementOptions = (theme) => ({
    style: {
        base: {
            fontSize: "16px",
            color: theme.palette.text.primary,
            "::placeholder": {
                color: theme.palette.text.secondary,
            },
            fontFamily: theme.typography.fontFamily,
            fontSmoothing: "antialiased",
            backgroundColor: theme.palette.background.paper,
        },
        invalid: {
            color: theme.palette.error.main,
        },
        complete: {
            color: theme.palette.success.main,
        },
    },
    hidePostalCode: false,
});

// Internal payment form component that uses Stripe hooks
const PaymentFormContent = ({ eventId, amount, currency, bookingData, onPaymentSuccess, onPaymentError, onCancel }) => {
    const stripe = useStripe();
    const elements = useElements();
    const theme = useTheme();
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState(null);
    const [isPending, startTransition] = useTransition();

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

            {/* Card Input Section */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 600 }}>
                    Carte de crédit ou débit
                </Typography>

                <Box sx={{
                    p: 2,
                    border: `2px solid ${theme.palette.divider}`,
                    borderRadius: theme.shape.borderRadius,
                    backgroundColor: theme.palette.background.paper,
                    '&:hover': {
                        borderColor: theme.palette.primary.light,
                    },
                    '&:focus-within': {
                        borderColor: theme.palette.primary.main,
                        boxShadow: `0 0 0 2px ${theme.palette.primary.main}25`,
                    },
                }}>
                    <CardElement
                        options={getCardElementOptions(theme)}
                        onChange={(event) => {
                            if (event.error) {
                                setPaymentError(event.error.message);
                            } else {
                                setPaymentError(null);
                            }
                        }}
                    />
                </Box>
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
                    disabled={!stripe || isProcessing || isPending}
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
const StripeLoading = () => {
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
        </Box>
    );
};

// Main component with Stripe Elements provider
const StripePaymentForm = ({ eventId, amount, currency = "eur", bookingData, onPaymentSuccess, onPaymentError, onCancel }) => {
    return (
        <Suspense fallback={<StripeLoading />}>
            <Elements stripe={stripePromise}>
                <PaymentFormContent
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

export default StripePaymentForm;
