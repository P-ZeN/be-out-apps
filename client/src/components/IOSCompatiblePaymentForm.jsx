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
import { CreditCard, Lock, Security, Apple } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getIsTauriApp } from "../utils/platformDetection";

// Initialize Stripe key at module level (same as regular form)
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Debug logging at module level
console.log("📱 IOSCompatiblePaymentForm module loaded");
console.log("📱 Module-level Stripe key check:", {
    stripePublishableKey: stripePublishableKey ? `${stripePublishableKey.substring(0, 10)}...` : 'UNDEFINED',
    typeofKey: typeof stripePublishableKey,
    allEnvVars: Object.keys(import.meta.env)
});

/**
 * iOS WebKit-specific payment form that addresses iOS Tauri WebView limitations
 * Uses direct Stripe Elements API calls instead of PaymentElement for better iOS compatibility
 */
const IOSCompatiblePaymentForm = ({
    eventId,
    amount,
    currency = "eur",
    bookingData,
    onPaymentSuccess,
    onPaymentError,
    onCancel
}) => {
    console.log("🍎 IOSCompatiblePaymentForm rendering with props:", { eventId, amount, currency });
    
    // Early validation to prevent white screen
    if (!eventId || !amount) {
        return (
            <Box sx={{ maxWidth: 500, mx: 'auto', p: 2 }}>
                <Alert severity="error">
                    <Typography variant="h6">Invalid Payment Data</Typography>
                    <Typography variant="body2">
                        Missing required payment information (eventId: {eventId}, amount: {amount})
                    </Typography>
                    <Button onClick={onCancel} sx={{ mt: 2 }}>
                        Return
                    </Button>
                </Alert>
            </Box>
        );
    }
    
    const theme = useTheme();
    const [isLoading, setIsLoading] = useState(true);

    // Debug: Show what the environment variable actually contains
    const debugInfo = {
        stripeKey: stripePublishableKey,
        hasKey: !!stripePublishableKey,
        keyLength: stripePublishableKey?.length || 0,
        startsWithPk: stripePublishableKey?.startsWith('pk_') || false
    };
    const [clientSecret, setClientSecret] = useState("");
    const [error, setError] = useState(null);
    const [stripeInstance, setStripeInstance] = useState(null);
    const [elementsInstance, setElementsInstance] = useState(null);
    const [cardElementReady, setCardElementReady] = useState(false);
    const [cardError, setCardError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const cardElementRef = useRef(null);
    const isMobile = getIsTauriApp();

    // iOS WebKit-specific Stripe loading with enhanced error handling
    useEffect(() => {
        const loadStripeForIOS = async () => {
            try {
                setIsLoading(true);
                console.log("Loading Stripe for iOS WebKit environment...");

                // Import Stripe with iOS-specific configuration
                const { loadStripe } = await import("@stripe/stripe-js");

                // Debug info that will be visible in the UI if there's an error
                const debugInfo = {
                    stripeKey: stripePublishableKey ? `${stripePublishableKey.substring(0, 10)}...` : 'NOT SET',
                    keyType: typeof stripePublishableKey,
                    keyLength: stripePublishableKey ? stripePublishableKey.length : 0,
                    nodeEnv: import.meta.env.NODE_ENV,
                    mode: import.meta.env.MODE
                };

                if (!stripePublishableKey) {
                    throw new Error(`❌ iOS: Stripe publishable key not configured! Debug: ${JSON.stringify(debugInfo)}`);
                }

                if (!stripePublishableKey.startsWith('pk_')) {
                    throw new Error(`❌ iOS: Invalid Stripe key format: ${stripePublishableKey.substring(0, 10)}... (should start with pk_)`);
                }

                // Load Stripe with iOS-specific options (minimal config for WebKit compatibility)
                const stripe = await loadStripe(stripePublishableKey, {
                    // iOS WebKit-specific configuration - minimal options only
                    locale: 'auto'
                });

                if (!stripe) {
                    throw new Error("Failed to initialize Stripe");
                }

                setStripeInstance(stripe);
                console.log("✅ Stripe loaded successfully for iOS");

            } catch (error) {
                console.error("❌ Error loading Stripe for iOS:", error);
                setError(`Failed to load payment system: ${error.message}`);
            } finally {
                setIsLoading(false);
            }
        };

        loadStripeForIOS();
    }, []);

    // Create payment intent and Elements instance for iOS
    useEffect(() => {
        if (stripeInstance && !clientSecret && !isLoading) {
            createPaymentIntentForIOS();
        }
    }, [stripeInstance]);

    const createPaymentIntentForIOS = async () => {
        try {
            setIsLoading(true);
            console.log("Creating iOS-compatible payment intent...");

            // Step 1: Create booking
            const bookingResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    event_id: eventId,
                    ...bookingData
                })
            });

            if (!bookingResponse.ok) {
                const errorData = await bookingResponse.json();
                throw new Error(errorData.error || 'Failed to create booking');
            }

            const bookingResult = await bookingResponse.json();
            console.log("Booking created:", bookingResult.booking_id);

            // Step 2: Create payment intent with correct API endpoint
            const paymentResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/payments/create-payment-intent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    booking_id: bookingResult.booking.id, // Use correct field name
                    amount: bookingResult.booking.total_price, // Use the price from booking
                    event_title: bookingResult.event?.title,
                    customer_email: bookingResult.booking.customer_email
                })
            });

            if (!paymentResponse.ok) {
                const errorData = await paymentResponse.json();
                throw new Error(errorData.error || 'Failed to create payment intent');
            }

            const { client_secret, payment_intent_id } = await paymentResponse.json();
            console.log("iOS payment intent created:", payment_intent_id);

            setClientSecret(client_secret);

            // Step 3: Create Elements instance with iOS-optimized configuration
            const elements = stripeInstance.elements({
                clientSecret: client_secret,
                appearance: {
                    theme: 'stripe',
                    variables: {
                        fontFamily: theme.typography.fontFamily,
                        // Larger fonts for iOS
                        fontSizeBase: '18px',
                        spacingUnit: '8px',
                        borderRadius: '8px',
                        colorPrimary: theme.palette.primary.main,
                        colorBackground: theme.palette.background.paper,
                        colorText: theme.palette.text.primary,
                        colorDanger: theme.palette.error.main,
                    },
                    rules: {
                        '.Input': {
                            padding: '16px',
                            fontSize: '18px',
                        },
                        '.Input:focus': {
                            border: `2px solid ${theme.palette.primary.main}`,
                        },
                    }
                },
                // iOS-specific options
                loader: 'auto',
            });

            setElementsInstance(elements);

            // Step 4: Mount Card Element (more reliable than PaymentElement in iOS WebView)
            setTimeout(() => {
                if (cardElementRef.current && elements) {
                    console.log("Mounting iOS-compatible Card Element...");

                    const cardElement = elements.create('card', {
                        style: {
                            base: {
                                fontSize: '18px',
                                color: theme.palette.text.primary,
                                fontFamily: theme.typography.fontFamily,
                                fontSmoothing: 'antialiased',
                                backgroundColor: theme.palette.background.paper,
                                padding: '16px',
                                '::placeholder': {
                                    color: theme.palette.text.secondary,
                                },
                            },
                            invalid: {
                                color: theme.palette.error.main,
                                iconColor: theme.palette.error.main,
                            },
                            complete: {
                                color: theme.palette.success.main,
                            },
                        },
                        hidePostalCode: false,
                        iconStyle: 'solid',
                        // iOS-specific options
                        disableLink: true, // Disable Link in iOS WebView
                    });

                    cardElement.mount(cardElementRef.current);

                    cardElement.on('ready', () => {
                        setCardElementReady(true);
                        console.log("✅ iOS Card Element ready");

                        // iOS-specific focus fix: Add touch event listeners to the container
                        if (cardElementRef.current) {
                            const container = cardElementRef.current;

                            // Add iOS focus fix: prevent default touch behavior and force focus
                            const handleTouch = (e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                // Trigger focus on the Stripe element
                                cardElement.focus();

                                // Also try to focus the iframe inside
                                const iframe = container.querySelector('iframe');
                                if (iframe) {
                                    iframe.focus();
                                }
                            };

                            container.addEventListener('touchstart', handleTouch, { passive: false });
                            container.addEventListener('touchend', handleTouch, { passive: false });
                            container.addEventListener('click', handleTouch, { passive: false });

                            // Add visual feedback for touch
                            container.style.cursor = 'text';
                            container.style.webkitTapHighlightColor = 'transparent';
                        }
                    });

                    cardElement.on('change', (event) => {
                        if (event.error) {
                            setCardError(event.error.message);
                        } else {
                            setCardError(null);
                        }
                        console.log("iOS Card Element change:", event.complete);
                    });

                    // Store booking info for later use
                    window._iosBookingData = bookingResult;
                }
            }, 500);

        } catch (error) {
            console.error("❌ Error creating iOS payment intent:", error);
            setError(error.message);
            onPaymentError?.(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleIOSPayment = async (event) => {
        event.preventDefault();

        if (!stripeInstance || !elementsInstance || !clientSecret) {
            setError("Payment system not ready");
            return;
        }

        setIsProcessing(true);
        setError(null);
        setCardError(null);

        try {
            console.log("Processing iOS payment...");

            const cardElement = elementsInstance.getElement('card');

            if (!cardElement) {
                throw new Error("Card element not found");
            }

            // Confirm payment with iOS-specific configuration
            const { error: stripeError, paymentIntent } = await stripeInstance.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: {
                        name: bookingData.name,
                        email: bookingData.email,
                    },
                },
            });

            if (stripeError) {
                console.error("iOS Stripe payment error:", stripeError);
                throw new Error(stripeError.message);
            }

            if (paymentIntent && paymentIntent.status === "succeeded") {
                console.log("✅ iOS payment succeeded:", paymentIntent.id);

                // Confirm with backend
            // Step 4: Confirm payment on server
            const confirmResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/payments/confirm-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    payment_intent_id: paymentResult.client_secret.split('_secret_')[0],
                    booking_id: bookingResult.booking.id
                })
            });                if (confirmResponse.ok) {
                    const confirmResult = await confirmResponse.json();
                    onPaymentSuccess?.(paymentIntent, confirmResult);
                } else {
                    const errorData = await confirmResponse.json();
                    throw new Error(errorData.error || "Payment succeeded but confirmation failed");
                }
            }
        } catch (error) {
            console.error("❌ iOS payment processing error:", error);
            setError(error.message);
            onPaymentError?.(error);
        } finally {
            setIsProcessing(false);
        }
    };

    const formatAmount = (amount) => {
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: currency.toUpperCase(),
        }).format(amount);
    };

    // Loading state
    if (isLoading) {
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
                    🍎 Chargement optimisé pour iOS...
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Configuration WebKit en cours
                </Typography>
            </Box>
        );
    }

    // Error state
    if (error) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                        {error}
                    </Typography>
                </Alert>
                <Button variant="outlined" onClick={onCancel}>
                    Fermer
                </Button>
            </Box>
        );
    }

    // Add error boundary protection
    try {
        return (
            <Box sx={{ maxWidth: 500, mx: 'auto', p: 2 }}>
                {/* iOS-specific header */}
                <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                        <Apple sx={{ color: theme.palette.text.secondary }} />
                        <Typography variant="h6" color="primary">
                            Paiement iOS WebKit
                        </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary">
                        Montant total: <strong>{amount ? formatAmount(amount) : 'N/A'}</strong>
                    </Typography>
                </Paper>

            {/* iOS-specific instructions */}
            <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                    🍎 <strong>iOS:</strong> Ce formulaire est optimisé pour WebKit.
                    Si le chargement échoue, fermer et rouvrir cette fenêtre peut aider.
                </Typography>
            </Alert>

            {/* Card input section */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 600 }}>
                    <CreditCard sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Informations de carte
                </Typography>

                <Box
                    ref={cardElementRef}
                    sx={{
                        p: 2,
                        border: `2px solid ${cardError ? theme.palette.error.main : theme.palette.divider}`,
                        borderRadius: theme.shape.borderRadius,
                        backgroundColor: theme.palette.background.paper,
                        minHeight: 60,
                        // iOS-specific focus improvements
                        cursor: 'text',
                        WebkitTapHighlightColor: 'transparent',
                        WebkitTouchCallout: 'none',
                        WebkitUserSelect: 'none',
                        userSelect: 'none',
                        // Ensure the container is interactive
                        position: 'relative',
                        zIndex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'all 0.2s ease',
                        '&:focus-within': {
                            borderColor: theme.palette.primary.main,
                            boxShadow: `0 0 0 2px ${theme.palette.primary.main}25`,
                        },
                    }}
                >
                    {/* iOS Focus Helper - Invisible overlay to help with touch events */}
                    {!cardElementReady && (
                        <Box sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: theme.palette.text.secondary,
                            fontSize: '14px',
                            pointerEvents: 'none'
                        }}>
                            Chargement du formulaire de carte...
                        </Box>
                    )}
                </Box>

                {/* iOS Focus Helper Text */}
                {cardElementReady && (
                    <Typography variant="caption" sx={{
                        mt: 1,
                        color: theme.palette.text.secondary,
                        fontSize: '12px',
                        fontStyle: 'italic'
                    }}>
                        💡 iOS: Toucher directement dans le champ de carte pour saisir les informations
                    </Typography>
                )}

                {/* Card status indicator */}
                {cardElementReady && (
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: theme.palette.success.main,
                        }} />
                        <Typography variant="caption" color="text.secondary">
                            ✅ Formulaire iOS prêt
                        </Typography>
                    </Box>
                )}

                {/* Card error display */}
                {cardError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {cardError}
                    </Alert>
                )}
            </Paper>

            {/* Error display */}
            {error && (
                <Box sx={{ mb: 3 }}>
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                    {/* Debug info for iOS */}
                    <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                        <Typography variant="caption" component="div">
                            <strong>Debug Info:</strong>
                        </Typography>
                        <Typography variant="caption" component="div">
                            Has Key: {debugInfo.hasKey ? 'YES' : 'NO'}
                        </Typography>
                        <Typography variant="caption" component="div">
                            Key Length: {debugInfo.keyLength}
                        </Typography>
                        <Typography variant="caption" component="div">
                            Starts with pk_: {debugInfo.startsWithPk ? 'YES' : 'NO'}
                        </Typography>
                        <Typography variant="caption" component="div">
                            Key Preview: {debugInfo.stripeKey ? `${debugInfo.stripeKey.substring(0, 15)}...` : 'UNDEFINED'}
                        </Typography>
                    </Paper>
                </Box>
            )}

            {/* Action buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', mb: 3 }}>
                <Button
                    variant="outlined"
                    onClick={onCancel}
                    disabled={isProcessing}
                    size="large"
                    sx={{ minWidth: 120 }}
                >
                    Annuler
                </Button>
                <Button
                    variant="contained"
                    onClick={handleIOSPayment}
                    disabled={!stripeInstance || !cardElementReady || isProcessing}
                    size="large"
                    startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : <Lock />}
                    sx={{ minWidth: 200 }}
                >
                    {isProcessing ?
                        'Traitement iOS...' :
                        `Payer ${formatAmount(amount)}`
                    }
                </Button>
            </Box>

            {/* iOS-specific security notice */}
            <Box sx={{
                mt: 3,
                pt: 2,
                borderTop: `1px solid ${theme.palette.divider}`,
                textAlign: 'center'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <Security sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                        🔒 Sécurisé par Stripe - Optimisé pour iOS WebKit
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
    } catch (renderError) {
        console.error("❌ iOS Payment Form render error:", renderError);
        return (
            <Box sx={{ maxWidth: 500, mx: 'auto', p: 2 }}>
                <Alert severity="error">
                    <Typography variant="h6">iOS Payment Form Error</Typography>
                    <Typography variant="body2">
                        The payment form encountered an error: {renderError.message}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        Debug info: Amount={amount}, EventId={eventId}
                    </Typography>
                    <Button onClick={onCancel} sx={{ mt: 2 }}>
                        Return
                    </Button>
                </Alert>
            </Box>
        );
    }
};

export default IOSCompatiblePaymentForm;
