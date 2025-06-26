const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

class FavoritesService {
    // Get JWT token from localStorage
    static getAuthToken() {
        return localStorage.getItem("token");
    }

    // Get headers with auth token
    static getAuthHeaders() {
        const token = this.getAuthToken();
        return {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
        };
    }

    // Get user's favorites
    static async getUserFavorites(userId, params = {}) {
        try {
            const searchParams = new URLSearchParams();

            Object.entries(params).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== "") {
                    searchParams.append(key, value);
                }
            });

            const url = `${API_BASE_URL}/api/favorites/user/${userId}?${searchParams.toString()}`;
            const response = await fetch(url, {
                headers: this.getAuthHeaders(),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching user favorites:", error);
            throw error;
        }
    }

    // Add event to favorites
    static async addToFavorites(eventId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/favorites`, {
                method: "POST",
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ event_id: eventId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error adding to favorites:", error);
            throw error;
        }
    }

    // Remove event from favorites
    static async removeFromFavorites(eventId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/favorites/${eventId}`, {
                method: "DELETE",
                headers: this.getAuthHeaders(),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error removing from favorites:", error);
            throw error;
        }
    }

    // Toggle favorite status (add if not exists, remove if exists)
    static async toggleFavorite(eventId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/favorites/toggle`, {
                method: "POST",
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ event_id: eventId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error toggling favorite:", error);
            throw error;
        }
    }

    // Check if event is favorited by current user
    static async checkFavoriteStatus(eventId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/favorites/check/${eventId}`, {
                headers: this.getAuthHeaders(),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error checking favorite status:", error);
            throw error;
        }
    }

    // Get favorites statistics for user
    static async getFavoritesStats(userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/favorites/stats/${userId}`, {
                headers: this.getAuthHeaders(),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching favorites stats:", error);
            throw error;
        }
    }

    // Helper method to format favorite data for frontend
    static formatFavorite(favorite) {
        return {
            ...favorite,
            favorited_at: new Date(favorite.favorited_at),
            event_date: new Date(favorite.event_date),
            booking_deadline: favorite.booking_deadline ? new Date(favorite.booking_deadline) : null,
            venue: {
                name: favorite.venue_name,
                city: favorite.venue_city,
                address: favorite.venue_address,
            },
            categories: favorite.categories || [],
            rating: {
                average: parseFloat(favorite.average_rating) || 0,
                count: parseInt(favorite.review_count) || 0,
            },
        };
    }

    // Helper method to format favorites list
    static formatFavorites(favoritesData) {
        return {
            ...favoritesData,
            favorites: favoritesData.favorites.map((favorite) => this.formatFavorite(favorite)),
        };
    }

    // Get quick stats for display
    static async getQuickStats(userId) {
        try {
            const stats = await this.getFavoritesStats(userId);
            return {
                totalFavorites: parseInt(stats.total_favorites) || 0,
                upcomingFavorites: parseInt(stats.upcoming_favorites) || 0,
                averagePrice: parseFloat(stats.avg_favorite_price) || 0,
                topCategories: stats.favorite_categories?.slice(0, 3) || [],
            };
        } catch (error) {
            console.error("Error fetching quick stats:", error);
            return {
                totalFavorites: 0,
                upcomingFavorites: 0,
                averagePrice: 0,
                topCategories: [],
            };
        }
    }

    // Check if user is authenticated
    static isAuthenticated() {
        return !!this.getAuthToken();
    }

    // Handle favorite action with authentication check
    static async handleFavoriteAction(eventId, callback) {
        if (!this.isAuthenticated()) {
            throw new Error("Please log in to manage favorites");
        }

        try {
            const result = await this.toggleFavorite(eventId);
            if (callback) callback(result);
            return result;
        } catch (error) {
            console.error("Favorite action failed:", error);
            throw error;
        }
    }

    // Bulk operations for multiple events
    static async addMultipleToFavorites(eventIds) {
        const results = [];
        const errors = [];

        for (const eventId of eventIds) {
            try {
                const result = await this.addToFavorites(eventId);
                results.push({ eventId, result });
            } catch (error) {
                errors.push({ eventId, error: error.message });
            }
        }

        return { results, errors };
    }

    // Get favorite status for multiple events at once
    static async checkMultipleFavoriteStatus(eventIds) {
        const results = {};

        await Promise.all(
            eventIds.map(async (eventId) => {
                try {
                    const status = await this.checkFavoriteStatus(eventId);
                    results[eventId] = status.is_favorited;
                } catch (error) {
                    console.error(`Error checking favorite status for event ${eventId}:`, error);
                    results[eventId] = false;
                }
            })
        );

        return results;
    }
}

export default FavoritesService;
