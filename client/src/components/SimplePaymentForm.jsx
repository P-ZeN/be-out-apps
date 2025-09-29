import React, { useState } from "react";

const SimplePaymentForm = ({ eventId, amount, currency = "eur", bookingData, onPaymentSuccess, onPaymentError, onCancel }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStep, setProcessingStep] = useState("");
    const [error, setError] = useState(null);
    const [cardData, setCardData] = useState({
        number: "",
        expiry: "",
        cvc: "",
        name: "",
    });

    const formatAmount = (amount, currency) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency.toUpperCase()
        }).format(amount);
    };

    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
        const matches = v.match(/\d{4,16}/g);
        const match = matches && matches[0] || "";
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        if (parts.length) {
            return parts.join(" ");
        } else {
            return v;
        }
    };

    const formatExpiry = (value) => {
        const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
        if (v.length >= 2) {
            return v.substring(0, 2) + "/" + v.substring(2, 4);
        }
        return v;
    };

    const handleCardInputChange = (field, value) => {
        let formattedValue = value;

        if (field === "number") {
            formattedValue = formatCardNumber(value);
        } else if (field === "expiry") {
            formattedValue = formatExpiry(value);
        } else if (field === "cvc") {
            formattedValue = value.replace(/[^0-9]/g, "").substring(0, 4);
        }

        setCardData(prev => ({
            ...prev,
            [field]: formattedValue
        }));
    };

    const isFormValid = () => {
        return cardData.number.length >= 15 &&
               cardData.expiry.length === 5 &&
               cardData.cvc.length >= 3 &&
               cardData.name.trim().length > 0;
    };

    const handleTestPayment = async () => {
        if (!isFormValid()) {
            setError("Please fill in all card details");
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            // Step 1: Creating booking
            setProcessingStep("Creating booking...");
            await new Promise(resolve => setTimeout(resolve, 800));

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

            // Step 2: Processing payment
            setProcessingStep("Processing payment...");
            await new Promise(resolve => setTimeout(resolve, 1200));

            // Step 3: Validating with bank
            setProcessingStep("Validating with bank...");
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Step 4: Confirming booking
            setProcessingStep("Confirming booking...");
            await new Promise(resolve => setTimeout(resolve, 600));

            // Success - simulate Stripe-like response
            const mockResult = {
                paymentIntent: {
                    id: `pi_test_${Date.now()}`,
                    status: 'succeeded',
                    amount: Math.round(amount * 100),
                    currency: currency,
                    payment_method: {
                        card: {
                            brand: 'visa',
                            last4: cardData.number.slice(-4),
                            exp_month: cardData.expiry.split('/')[0],
                            exp_year: cardData.expiry.split('/')[1],
                        }
                    }
                },
                booking: bookingResult.booking || {
                    id: `booking_${Date.now()}`,
                    status: 'confirmed'
                },
                message: "Payment processed successfully!",
                paymentMethod: `**** **** **** ${cardData.number.slice(-4)}`,
            };

            onPaymentSuccess(mockResult);

        } catch (err) {
            console.error("Payment error:", err);
            setError(err.message);
            onPaymentError?.(err);
        } finally {
            setIsProcessing(false);
            setProcessingStep("");
        }
    };

    return (
        <div className="payment-form-container">
            <div className="payment-summary">
                <h3>Payment Details</h3>
                <div className="payment-amount">
                    <span>Total: </span>
                    <strong>{formatAmount(amount, currency)}</strong>
                </div>
            </div>

            <div className="payment-form">
                <div className="stripe-test-info">
                    <p>💳 <strong>Test Stripe Payment</strong></p>
                    <p>Use test card: <code>4242 4242 4242 4242</code></p>
                    <p>Any future date and CVC will work</p>
                </div>

                <div className="card-inputs">
                    <div className="input-group">
                        <label>Card Number</label>
                        <input
                            type="text"
                            placeholder="1234 5678 9012 3456"
                            value={cardData.number}
                            onChange={(e) => handleCardInputChange("number", e.target.value)}
                            maxLength="19"
                            disabled={isProcessing}
                        />
                    </div>

                    <div className="input-row">
                        <div className="input-group">
                            <label>Expiry</label>
                            <input
                                type="text"
                                placeholder="MM/YY"
                                value={cardData.expiry}
                                onChange={(e) => handleCardInputChange("expiry", e.target.value)}
                                maxLength="5"
                                disabled={isProcessing}
                            />
                        </div>
                        <div className="input-group">
                            <label>CVC</label>
                            <input
                                type="text"
                                placeholder="123"
                                value={cardData.cvc}
                                onChange={(e) => handleCardInputChange("cvc", e.target.value)}
                                maxLength="4"
                                disabled={isProcessing}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Cardholder Name</label>
                        <input
                            type="text"
                            placeholder="John Doe"
                            value={cardData.name}
                            onChange={(e) => handleCardInputChange("name", e.target.value)}
                            disabled={isProcessing}
                        />
                    </div>
                </div>

                {error && (
                    <div className="payment-error">
                        <span className="error-icon">⚠️</span>
                        <p>{error}</p>
                    </div>
                )}

                {isProcessing && (
                    <div className="processing-status">
                        <div className="processing-spinner"></div>
                        <p>{processingStep}</p>
                    </div>
                )}

                <div className="payment-actions">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="btn btn-secondary"
                        disabled={isProcessing}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleTestPayment}
                        disabled={isProcessing || !isFormValid()}
                        className="btn btn-primary"
                    >
                        {isProcessing ? (
                            <>
                                <div className="btn-spinner"></div>
                                Processing...
                            </>
                        ) : (
                            `Pay ${formatAmount(amount, currency)}`
                        )}
                    </button>
                </div>
            </div>

            <div className="payment-security">
                <p className="security-text">🔒 Powered by Stripe (Test Mode)</p>
            </div>
        </div>
    );
};

export default SimplePaymentForm;
