import React, { useState, useEffect } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useTranslation } from "react-i18next";
import paymentService from "../services/paymentService";
import "./PaymentForm.css";

const PaymentForm = ({ eventId, amount, currency = "eur", onPaymentSuccess, onPaymentError, onCancel }) => {
    const stripe = useStripe();
    const elements = useElements();
    const { t } = useTranslation(['payment', 'common']);
    const [isLoading, setIsLoading] = useState(false);
    const [clientSecret, setClientSecret] = useState("");
    const [paymentIntent, setPaymentIntent] = useState(null);
    const [error, setError] = useState(null);

    // Create payment intent when component mounts
    useEffect(() => {
        const createPaymentIntent = async () => {
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
                setError(null);
            } catch (err) {
                console.error("Error creating payment intent:", err);
                setError(err.message);
                onPaymentError?.(err);
            } finally {
                setIsLoading(false);
            }
        };

        if (eventId && amount && !clientSecret) {
            createPaymentIntent();
        }
    }, [eventId, amount, currency, clientSecret, onPaymentError]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements || !clientSecret) {
            return;
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
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency.toUpperCase(),
        }).format(amount / 100);
    };

    if (!stripe || !elements) {
        return (
            <div className="payment-form-loading">
                <div className="spinner"></div>
                <p>Loading payment form...</p>
            </div>
        );
    }

    return (
        <div className="payment-form-container">
            <div className="payment-summary">
                <h3>Payment Summary</h3>
                <div className="payment-amount">
                    <span>Total: </span>
                    <strong>{formatAmount(amount, currency)}</strong>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="payment-form">
                {clientSecret && (
                    <div className="payment-element-container">
                        <PaymentElement
                            options={{
                                layout: "tabs",
                            }}
                        />
                    </div>
                )}

                {error && (
                    <div className="payment-error">
                        <p>{error}</p>
                    </div>
                )}

                <div className="payment-actions">
                    <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={isLoading}>
                        {t('payment:form.cancel')}
                    </button>
                    <button type="submit" disabled={!stripe || !clientSecret || isLoading} className="btn btn-primary">
                        {isLoading ? (
                            <>
                                <div className="btn-spinner"></div>
                                {t('payment:form.processing')}
                            </>
                        ) : (
                            t('payment:form.payAmount', { amount: formatAmount(amount, currency) })
                        )}
                    </button>
                </div>
            </form>

            <div className="payment-security">
                <p className="security-text">{t('payment:form.securityMessage')}</p>
            </div>
        </div>
    );
};

export default PaymentForm;
