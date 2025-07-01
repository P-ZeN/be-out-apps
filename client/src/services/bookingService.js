// Booking service for API calls
// API base URL - use environment variable or fallback to development default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

class BookingService {
    static async createBooking(bookingData) {
        try {
            const response = await fetch(`${API_BASE_URL}/bookings`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(bookingData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error creating booking:", error);
            throw error;
        }
    }

    static async getBookingByReference(reference) {
        try {
            const response = await fetch(`${API_BASE_URL}/bookings/reference/${reference}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching booking:", error);
            throw error;
        }
    }

    static async getUserBookings(userId, params = {}) {
        try {
            const searchParams = new URLSearchParams();

            // Add all non-empty parameters to search params
            Object.entries(params).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== "") {
                    searchParams.append(key, value);
                }
            });

            const url = `${API_BASE_URL}/bookings/user/${userId}?${searchParams.toString()}`;
            const response = await fetch(url);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching user bookings:", error);
            throw error;
        }
    }

    static async confirmBooking(bookingId, paymentData = {}) {
        try {
            const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/confirm`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(paymentData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error confirming booking:", error);
            throw error;
        }
    }

    static async cancelBooking(bookingId, reason = "") {
        try {
            const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ cancellation_reason: reason }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error cancelling booking:", error);
            throw error;
        }
    }

    static async getBookingStats() {
        try {
            const response = await fetch(`${API_BASE_URL}/bookings/stats/overview`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching booking stats:", error);
            throw error;
        }
    }

    // Helper method to format booking data for frontend
    static formatBooking(booking) {
        return {
            ...booking,
            booking_date: new Date(booking.booking_date),
            event_date: booking.event_date ? new Date(booking.event_date) : null,
            cancelled_at: booking.cancelled_at ? new Date(booking.cancelled_at) : null,
            total_price: parseFloat(booking.total_price),
            unit_price: parseFloat(booking.unit_price),
        };
    }

    // Helper method to format bookings list
    static formatBookings(bookingsData) {
        return {
            ...bookingsData,
            bookings: bookingsData.bookings.map((booking) => this.formatBooking(booking)),
        };
    }

    // Generate QR code data URL for tickets
    static generateQRCodeData(ticketNumber, qrCode) {
        return `ticket:${ticketNumber}:${qrCode}`;
    }

    // Validate booking form data
    static validateBookingData(bookingData) {
        const errors = [];

        if (!bookingData.event_id) {
            errors.push("Event ID is required");
        }

        if (!bookingData.quantity || bookingData.quantity < 1) {
            errors.push("Quantity must be at least 1");
        }

        if (!bookingData.customer_name?.trim()) {
            errors.push("Customer name is required");
        }

        if (!bookingData.customer_email?.trim()) {
            errors.push("Customer email is required");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingData.customer_email)) {
            errors.push("Valid email address is required");
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}

export default BookingService;
