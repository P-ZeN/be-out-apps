// Admin service for API calls
// API base URL - use environment variable or fallback to development default
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const API_URL = API_BASE_URL.replace("/api", "");

class AdminService {
    // Helper method to get admin headers with JWT token
    static getAdminHeaders() {
        const token = localStorage.getItem("adminToken");
        if (!token) {
            throw new Error("No authentication token found");
        }

        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        };
    }

    static async getDashboardStats() {
        try {
            const token = localStorage.getItem("adminToken");
            if (!token) {
                throw new Error("No authentication token found");
            }

            const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/stats`, {
                headers: this.getAdminHeaders(),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
            throw error;
        }
    }

    static async getEvents(params = {}) {
        try {
            const searchParams = new URLSearchParams();

            Object.entries(params).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== "") {
                    searchParams.append(key, value);
                }
            });

            const url = `${API_BASE_URL}/api/admin/events?${searchParams.toString()}`;
            const response = await fetch(url, {
                headers: this.getAdminHeaders(),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching admin events:", error);
            throw error;
        }
    }

    static async updateEventStatus(eventId, status, adminNotes = "") {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/events/${eventId}/status`, {
                method: "PATCH",
                headers: this.getAdminHeaders(),
                body: JSON.stringify({ status, admin_notes: adminNotes }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error updating event status:", error);
            throw error;
        }
    }

    static async updateEventModeration(eventId, moderationStatus, adminNotes = "") {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/events/${eventId}/status`, {
                method: "PATCH",
                headers: this.getAdminHeaders(),
                body: JSON.stringify({ moderation_status: moderationStatus, admin_notes: adminNotes }),
            });

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (parseError) {
                    // If JSON parsing fails, try to get text response
                    try {
                        const textError = await response.text();
                        errorMessage = textError || errorMessage;
                    } catch (textError) {
                        // If both fail, use the original error message
                        console.error("Failed to parse error response:", parseError);
                    }
                }
                throw new Error(errorMessage);
            }

            return await response.json();
        } catch (error) {
            console.error("Error updating event moderation:", error);
            throw error;
        }
    }

    static async getUsers(params = {}) {
        try {
            const searchParams = new URLSearchParams();

            Object.entries(params).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== "") {
                    searchParams.append(key, value);
                }
            });

            const url = `${API_BASE_URL}/api/admin/users?${searchParams.toString()}`;
            const response = await fetch(url, {
                headers: this.getAdminHeaders(),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching admin users:", error);
            throw error;
        }
    }

    static async updateUserRole(userId, role) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/role`, {
                method: "PATCH",
                headers: this.getAdminHeaders(),
                body: JSON.stringify({ role }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error updating user role:", error);
            throw error;
        }
    }

    static async updateUser(adminId, userId, userData) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
                method: "PATCH",
                headers: this.getAdminHeaders(),
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error updating user:", error);
            throw error;
        }
    }

    static async deleteUser(adminId, userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
                method: "DELETE",
                headers: this.getAdminHeaders(),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error deleting user:", error);
            throw error;
        }
    }

    static async getUserDetails(userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
                headers: this.getAdminHeaders(),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching user details:", error);
            throw error;
        }
    }

    static async deleteEvent(adminId, eventId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/events/${eventId}`, {
                method: "DELETE",
                headers: this.getAdminHeaders(),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error deleting event:", error);
            throw error;
        }
    }

    static async moderateEvent(adminId, eventId, moderationData) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/events/${eventId}/status`, {
                method: "PATCH",
                headers: this.getAdminHeaders(),
                body: JSON.stringify(moderationData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error moderating event:", error);
            throw error;
        }
    }

    static async getBookings(params = {}) {
        try {
            const searchParams = new URLSearchParams();

            Object.entries(params).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== "") {
                    searchParams.append(key, value);
                }
            });

            const url = `${API_BASE_URL}/api/admin/bookings?${searchParams.toString()}`;
            const response = await fetch(url, {
                headers: this.getAdminHeaders(),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching admin bookings:", error);
            throw error;
        }
    }

    static async getAdminLogs(params = {}) {
        try {
            const searchParams = new URLSearchParams();

            Object.entries(params).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== "") {
                    searchParams.append(key, value);
                }
            });

            const url = `${API_BASE_URL}/api/admin/logs?${searchParams.toString()}`;
            const response = await fetch(url, {
                headers: this.getAdminHeaders(),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching admin logs:", error);
            throw error;
        }
    }

    static async getProfile() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/profile`, {
                headers: this.getAdminHeaders(),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching admin profile:", error);
            throw error;
        }
    }

    // Helper methods for formatting data
    static formatCurrency(amount) {
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR",
        }).format(amount || 0);
    }

    static formatDate(dateString) {
        return new Date(dateString).toLocaleDateString("fr-FR", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    static formatNumber(number) {
        return new Intl.NumberFormat("fr-FR").format(number || 0);
    }

    static getStatusColor(status) {
        const statusColors = {
            // Event statuses
            active: "success",
            inactive: "warning",
            cancelled: "error",
            pending: "info",

            // Booking statuses
            confirmed: "success",
            refunded: "info",

            // User roles
            admin: "error",
            moderator: "warning",
            organizer: "info",
            user: "default",
        };

        return statusColors[status] || "default";
    }

    static getStatusLabel(status, type = "event") {
        const labels = {
            event: {
                active: "Actif",
                inactive: "Inactif",
                cancelled: "Annulé",
                pending: "En attente",
            },
            booking: {
                pending: "En attente",
                confirmed: "Confirmé",
                cancelled: "Annulé",
                refunded: "Remboursé",
            },
            user: {
                user: "Utilisateur",
                admin: "Administrateur",
                moderator: "Modérateur",
                organizer: "Organisateur",
            },
        };

        return labels[type]?.[status] || status;
    }

    static isAdmin(user) {
        return user && (user.role === "admin" || user.role === "moderator");
    }

    static isSuperAdmin(user) {
        return user && user.role === "admin";
    }
}

export default AdminService;
