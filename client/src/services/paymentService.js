// API base URL - use environment variable or fallback to development default
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const API_URL = API_BASE_URL + "/api/payments";

/**
 * Create a payment intent for an event booking
 * @param {Object} paymentData - Payment details
 * @param {string} paymentData.eventId - Event ID
 * @param {number} paymentData.amount - Amount in cents
 * @param {string} paymentData.currency - Currency code (default: EUR)
 * @param {Object} paymentData.metadata - Additional metadata
 * @returns {Promise<Object>} Payment intent response
 */
const createPaymentIntent = async (paymentData) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/create-payment-intent`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
        throw new Error(`Payment intent creation failed: ${response.statusText}`);
    }

    return response.json();
};

/**
 * Confirm a payment after successful Stripe payment
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} Confirmation response
 */
const confirmPayment = async (paymentIntentId, eventId) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/confirm-payment`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentIntentId, eventId }),
    });

    if (!response.ok) {
        throw new Error(`Payment confirmation failed: ${response.statusText}`);
    }

    return response.json();
};

/**
 * Get payment details by payment intent ID
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @returns {Promise<Object>} Payment details
 */
const getPaymentDetails = async (paymentIntentId) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/payment-details/${paymentIntentId}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch payment details: ${response.statusText}`);
    }

    return response.json();
};

/**
 * Get user's payment history
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 10)
 * @param {string} params.status - Filter by payment status
 * @returns {Promise<Object>} Payment history response
 */
const getPaymentHistory = async (params = {}) => {
    const token = localStorage.getItem("token");
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/transactions?${queryParams}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch payment history: ${response.statusText}`);
    }

    return response.json();
};

/**
 * Request a refund for a payment
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @param {number} amount - Refund amount in cents (optional, defaults to full refund)
 * @param {string} reason - Refund reason
 * @returns {Promise<Object>} Refund response
 */
const requestRefund = async (paymentIntentId, amount = null, reason = "requested_by_customer") => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/refund`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentIntentId, amount, reason }),
    });

    if (!response.ok) {
        throw new Error(`Refund request failed: ${response.statusText}`);
    }

    return response.json();
};

export default {
    createPaymentIntent,
    confirmPayment,
    getPaymentDetails,
    getPaymentHistory,
    requestRefund,
};
