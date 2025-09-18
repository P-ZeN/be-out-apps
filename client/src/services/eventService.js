// Event service for API calls
import { apiRequest, API_BASE_URL } from "../utils/apiUtils.js";

class EventService {
    static async getAllEvents(params = {}) {
        try {
            const searchParams = new URLSearchParams();

            // Add all non-empty parameters to search params
            Object.entries(params).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== "") {
                    searchParams.append(key, value);
                }
            });

            // Default language if not provided
            if (!params.lang) {
                searchParams.append("lang", "fr");
            }

            const url = `${API_BASE_URL}/api/events?${searchParams.toString()}`;
            const response = await apiRequest(url);
            return response;
        } catch (error) {
            console.error("Error fetching events:", error);
            throw error;
        }
    }

    // Get events filtered by time period
    static async getEventsByTimePeriod(period, lang = "fr", limit = 12) {
        const now = new Date();
        let startDate, endDate;

        switch (period) {
            case "today":
                startDate = new Date(now);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setHours(23, 59, 59, 999);
                break;
            case "thisWeek":
                startDate = new Date(now);
                startDate.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6); // End of week (Saturday)
                endDate.setHours(23, 59, 59, 999);
                break;
            case "thisMonth":
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            default:
                return this.getAllEvents({ lang, limit });
        }

        return this.getAllEvents({
            lang,
            limit,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            sortBy: "date"
        });
    }

    // Get recommended events (placeholder for now - can be enhanced with user preferences)
    static async getRecommendedEvents(lang = "fr", limit = 12) {
        return this.getAllEvents({
            lang,
            limit,
            sortBy: "popularity"
        });
    }

    // Get events near user location
    static async getNearbyEvents(lat, lng, lang = "fr", limit = 12, maxDistance = 25) {
        return this.getAllEvents({
            lang,
            limit,
            latitude: lat,
            longitude: lng,
            maxDistance,
            sortBy: "distance"
        });
    }

    // Get events by category
    static async getEventsByCategory(categoryId, lang = "fr", limit = 12) {
        return this.getAllEvents({
            lang,
            limit,
            categoryIds: categoryId,
            sortBy: "date"
        });
    }

    static async getEventById(id, lang = "fr") {
        try {
            const response = await fetch(`${API_BASE_URL}/api/events/${id}?lang=${lang}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching event:", error);
            throw error;
        }
    }

    static async getStats() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/events/meta/stats`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching stats:", error);
            throw error;
        }
    }

    // Helper method to format event data for frontend
    static formatEvent(event) {
        return {
            ...event,
            event_date: new Date(event.event_date),
            booking_deadline: event.booking_deadline ? new Date(event.booking_deadline) : null,
            venue: {
                name: event.venue_name,
                city: event.venue_city,
                address: event.venue_address,
                postal_code: event.venue_postal_code,
                latitude: event.venue_latitude,
                longitude: event.venue_longitude,
                capacity: event.venue_capacity,
            },
            categories: event.categories || [],
            rating: {
                average: parseFloat(event.average_rating) || 0,
                count: parseInt(event.review_count) || 0,
            },
        };
    }

    // Helper method to format events list
    static formatEvents(eventsData) {
        return {
            ...eventsData,
            events: eventsData.events.map((event) => this.formatEvent(event)),
        };
    }
}

export default EventService;
