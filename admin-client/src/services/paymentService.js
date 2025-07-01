// Payment monitoring service for admin
// API base URL - use environment variable or fallback to development default
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

class PaymentService {
    static getAdminHeaders() {
        const token = localStorage.getItem("adminToken");
        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        };
    }

    // Get payment statistics
    static async getPaymentStats(params = {}) {
        try {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== "") {
                    searchParams.append(key, value);
                }
            });

            const url = `${API_BASE_URL}/api/payments/admin/stats?${searchParams.toString()}`;
            const response = await fetch(url, {
                headers: this.getAdminHeaders(),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching payment stats:", error);
            throw error;
        }
    }

    // Get payment transactions
    static async getPaymentTransactions(params = {}) {
        try {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== "") {
                    searchParams.append(key, value);
                }
            });

            const url = `${API_BASE_URL}/api/payments/admin/transactions?${searchParams.toString()}`;
            const response = await fetch(url, {
                headers: this.getAdminHeaders(),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching payment transactions:", error);
            throw error;
        }
    }

    // Get revenue analytics
    static async getRevenueAnalytics(params = {}) {
        try {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== "") {
                    searchParams.append(key, value);
                }
            });

            const url = `${API_BASE_URL}/api/payments/admin/revenue?${searchParams.toString()}`;
            const response = await fetch(url, {
                headers: this.getAdminHeaders(),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching revenue analytics:", error);
            throw error;
        }
    }

    // Process refund
    static async processRefund(paymentId, amount, reason) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/payments/admin/refund`, {
                method: "POST",
                headers: this.getAdminHeaders(),
                body: JSON.stringify({
                    payment_id: paymentId,
                    amount: amount,
                    reason: reason,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error processing refund:", error);
            throw error;
        }
    }

    // Get failed payments
    static async getFailedPayments(params = {}) {
        try {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== "") {
                    searchParams.append(key, value);
                }
            });

            const url = `${API_BASE_URL}/api/payments/admin/failed?${searchParams.toString()}`;
            const response = await fetch(url, {
                headers: this.getAdminHeaders(),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching failed payments:", error);
            throw error;
        }
    }

    // Get payment disputes
    static async getPaymentDisputes(params = {}) {
        try {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== "") {
                    searchParams.append(key, value);
                }
            });

            const url = `${API_BASE_URL}/api/payments/admin/disputes?${searchParams.toString()}`;
            const response = await fetch(url, {
                headers: this.getAdminHeaders(),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching payment disputes:", error);
            throw error;
        }
    }

    // Utility methods
    static formatCurrency(amount, currency = "EUR") {
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: currency,
        }).format(amount / 100); // Stripe amounts are in cents
    }

    static getPaymentStatusLabel(status) {
        const statusLabels = {
            succeeded: "Réussi",
            pending: "En attente",
            failed: "Échoué",
            canceled: "Annulé",
            refunded: "Remboursé",
            partially_refunded: "Partiellement remboursé",
        };
        return statusLabels[status] || status;
    }

    static getPaymentStatusColor(status) {
        const statusColors = {
            succeeded: "success",
            pending: "warning",
            failed: "error",
            canceled: "default",
            refunded: "info",
            partially_refunded: "info",
        };
        return statusColors[status] || "default";
    }

    static getPaymentMethodLabel(method) {
        const methodLabels = {
            card: "Carte bancaire",
            paypal: "PayPal",
            sepa_debit: "Prélèvement SEPA",
            bancontact: "Bancontact",
            ideal: "iDEAL",
        };
        return methodLabels[method] || method;
    }
}

export default PaymentService;
