const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

class OrganizerService {
    getAuthHeaders() {
        const token = localStorage.getItem("organizerToken");
        return {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
        };
    }

    async login(email, password) {
        const response = await fetch(`${API_BASE_URL}/api/auth/organizer/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Login failed");
        }

        return response.json();
    }

    async register(userData) {
        const response = await fetch(`${API_BASE_URL}/api/auth/organizer/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Registration failed");
        }

        return response.json();
    }

    async getProfile() {
        const response = await fetch(`${API_BASE_URL}/api/organizer/profile`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch profile");
        }

        return response.json();
    }

    async getOrganizerProfile() {
        const response = await fetch(`${API_BASE_URL}/api/organizer/profile/details`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch organizer profile");
        }

        return response.json();
    }

    async updateOrganizerProfile(profileData) {
        const response = await fetch(`${API_BASE_URL}/api/organizer/profile/details`, {
            method: "PUT",
            headers: this.getAuthHeaders(),
            body: JSON.stringify(profileData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to update profile");
        }

        return response.json();
    }

    // Dashboard & Analytics
    async getDashboardStats(period = 30) {
        const response = await fetch(`${API_BASE_URL}/api/organizer/dashboard/stats?period=${period}`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch dashboard stats");
        }

        return response.json();
    }

    async getRecentBookings(limit = 10) {
        const response = await fetch(`${API_BASE_URL}/api/organizer/bookings/recent?limit=${limit}`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch recent bookings");
        }

        return response.json();
    }

    async getUpcomingEvents(limit = 10) {
        const response = await fetch(`${API_BASE_URL}/api/organizer/events/upcoming?limit=${limit}`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch upcoming events");
        }

        return response.json();
    }

    // Events Management
    async getEvents(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const response = await fetch(`${API_BASE_URL}/api/organizer/events?${queryParams}`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch events");
        }

        return response.json();
    }

    async getEvent(eventId) {
        const response = await fetch(`${API_BASE_URL}/api/organizer/events/${eventId}`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch event");
        }

        return response.json();
    }

    async createEvent(eventData) {
        const response = await fetch(`${API_BASE_URL}/api/organizer/events`, {
            method: "POST",
            headers: this.getAuthHeaders(),
            body: JSON.stringify(eventData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to create event");
        }

        return response.json();
    }

    async updateEvent(eventId, eventData) {
        const response = await fetch(`${API_BASE_URL}/api/organizer/events/${eventId}`, {
            method: "PUT",
            headers: this.getAuthHeaders(),
            body: JSON.stringify(eventData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to update event");
        }

        return response.json();
    }

    async deleteEvent(eventId) {
        const response = await fetch(`${API_BASE_URL}/api/organizer/events/${eventId}`, {
            method: "DELETE",
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to delete event");
        }

        return response.json();
    }

    // Bookings Management
    async getBookings(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const response = await fetch(`${API_BASE_URL}/api/organizer/bookings?${queryParams}`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch bookings");
        }

        return response.json();
    }

    async getBooking(bookingId) {
        const response = await fetch(`${API_BASE_URL}/api/organizer/bookings/${bookingId}`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch booking");
        }

        return response.json();
    }

    // Revenue & Analytics
    async getRevenue(period = "monthly") {
        const response = await fetch(`${API_BASE_URL}/api/organizer/revenue?period=${period}`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch revenue data");
        }

        return response.json();
    }

    async getPayouts() {
        const response = await fetch(`${API_BASE_URL}/api/organizer/payouts`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch payouts");
        }

        return response.json();
    }

    // Venues
    async getVenues() {
        const response = await fetch(`${API_BASE_URL}/api/venues`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch venues");
        }

        return response.json();
    }

    // Categories
    async getCategories() {
        const response = await fetch(`${API_BASE_URL}/api/categories`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch categories");
        }

        return response.json();
    }
}

export default new OrganizerService();
