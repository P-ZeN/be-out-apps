import React, { useState } from "react";
import { StripeProvider } from "../context/StripeContext";
import PaymentForm from "./PaymentForm";
import "./PaymentModal.css";

const PaymentModal = ({ isOpen, onClose, event, onPaymentSuccess, onPaymentError }) => {
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

    const renderPaymentStep = () => {
        switch (paymentStep) {
            case "success":
                return (
                    <div className="payment-success">
                        <div className="success-icon">✅</div>
                        <h2>Payment Successful!</h2>
                        <p>Your booking has been confirmed.</p>
                        {paymentResult?.booking && (
                            <div className="booking-details">
                                <p>
                                    <strong>Booking ID:</strong> {paymentResult.booking.id}
                                </p>
                                <p>
                                    <strong>Event:</strong> {event.title}
                                </p>
                                <p>
                                    <strong>Date:</strong> {new Date(event.date).toLocaleDateString()}
                                </p>
                            </div>
                        )}
                        <button className="btn btn-primary" onClick={handleClose}>
                            Continue
                        </button>
                    </div>
                );

            case "error":
                return (
                    <div className="payment-error">
                        <div className="error-icon">❌</div>
                        <h2>Payment Failed</h2>
                        <p>{paymentResult?.error?.message || "An unexpected error occurred."}</p>
                        <div className="error-actions">
                            <button className="btn btn-secondary" onClick={() => setPaymentStep("payment")}>
                                Try Again
                            </button>
                            <button className="btn btn-primary" onClick={handleClose}>
                                Close
                            </button>
                        </div>
                    </div>
                );

            default:
                return (
                    <StripeProvider>
                        <div className="payment-content">
                            <div className="payment-header">
                                <h2>Complete Your Booking</h2>
                                <button className="close-btn" onClick={handleClose}>
                                    ×
                                </button>
                            </div>

                            <div className="event-details">
                                <h3>{event.title}</h3>
                                <p className="event-date">
                                    📅{" "}
                                    {new Date(event.date).toLocaleDateString("en-US", {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </p>
                                {event.location && <p className="event-location">📍 {event.location}</p>}
                                {event.price && (
                                    <p className="event-price">
                                        💰{" "}
                                        {new Intl.NumberFormat("en-US", {
                                            style: "currency",
                                            currency: "EUR",
                                        }).format(event.price)}
                                    </p>
                                )}
                            </div>

                            <PaymentForm
                                eventId={event.id}
                                amount={event.price ? Math.round(event.price * 100) : 0} // Convert to cents
                                currency="eur"
                                onPaymentSuccess={handlePaymentSuccess}
                                onPaymentError={handlePaymentError}
                                onCancel={handleClose}
                            />
                        </div>
                    </StripeProvider>
                );
        }
    };

    return (
        <div className="payment-modal-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
            <div className="payment-modal">{renderPaymentStep()}</div>
        </div>
    );
};

export default PaymentModal;
