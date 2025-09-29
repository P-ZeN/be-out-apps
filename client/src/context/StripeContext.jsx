import React, { createContext, useContext, useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

// Load Stripe with your publishable key
const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!publishableKey) {
    console.warn("⚠️ VITE_STRIPE_PUBLISHABLE_KEY not configured - payment features will be disabled");
}

const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

const StripeContext = createContext();

export const useStripe = () => {
    const context = useContext(StripeContext);
    if (!context) {
        throw new Error("useStripe must be used within a StripeProvider");
    }
    return context;
};

export const StripeProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!publishableKey) {
            setError("Stripe publishable key is not configured");
            setIsLoading(false);
            return;
        }

        // Test if Stripe loads successfully
        if (stripePromise) {
            stripePromise
                .then((stripe) => {
                    if (stripe) {
                        setIsLoading(false);
                    } else {
                        setError("Failed to initialize Stripe");
                        setIsLoading(false);
                    }
                })
                .catch((err) => {
                    console.error("Error loading Stripe:", err);
                    setError("Failed to load Stripe");
                    setIsLoading(false);
                });
        } else {
            setError("Stripe is not available");
            setIsLoading(false);
        }
    }, []);

    const options = {
        // Stripe Elements options
        appearance: {
            theme: "stripe",
            variables: {
                colorPrimary: "#0570de",
                colorBackground: "#ffffff",
                colorText: "#30313d",
                colorDanger: "#df1b41",
                fontFamily: "Ideal Sans, system-ui, sans-serif",
                spacingUnit: "2px",
                borderRadius: "4px",
            },
        },
        loader: "auto",
    };

    if (error) {
        return (
            <div className="stripe-error">
                <p>Payment system is unavailable: {error}</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="stripe-loading">
                <p>Loading payment system...</p>
            </div>
        );
    }

    return (
        <Elements stripe={stripePromise} options={options}>
            <StripeContext.Provider value={{ stripePromise }}>{children}</StripeContext.Provider>
        </Elements>
    );
};
