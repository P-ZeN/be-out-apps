// Event service for API calls
// API base URL - TEMPORARILY HARDCODED FOR TESTING
// const API_BASE_URL = "https://server.be-out-app.dedibox2.philippezenone.net";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

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
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching events:", error);
            throw error;
        }
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
