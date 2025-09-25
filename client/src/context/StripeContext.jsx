import React, { createContext, useContext } from "react";
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

    return (
        <Elements stripe={stripePromise} options={options}>
            <StripeContext.Provider value={{ stripePromise }}>{children}</StripeContext.Provider>
        </Elements>
    );
};
