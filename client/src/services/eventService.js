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

            // Parse pricing JSONB field if it exists and is a string
            if (response.events) {
                response.events = response.events.map(event => {
                    if (event.pricing && typeof event.pricing === 'string') {
                        try {
                            event.pricing = JSON.parse(event.pricing);
                        } catch (e) {
                            console.warn('Failed to parse pricing JSON for event', event.id, e);
                            event.pricing = null;
                        }
                    }
                    return event;
                });
            }

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

            const event = await response.json();

            // Parse pricing JSONB field if it exists and is a string
            if (event.pricing && typeof event.pricing === 'string') {
                try {
                    event.pricing = JSON.parse(event.pricing);
                } catch (e) {
                    console.warn('Failed to parse pricing JSON for event', event.id, e);
                    event.pricing = null;
                }
            }

            return event;
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

    // Helper method to extract pricing information from new pricing structure
    static extractPricingInfo(event) {
        // Debug only for events that might have new pricing structure
        if (!event.price && !event.original_price) {
            console.log('� Checking event with no legacy pricing:', event.title, {
                price: event.price,
                original_price: event.original_price,
                pricing: event.pricing,
                pricingType: typeof event.pricing
            });
        }

        // If event has legacy price fields, use them (check actual database fields)
        const legacyDiscountedPrice = parseFloat(event.discounted_price) || 0;
        const legacyOriginalPrice = parseFloat(event.original_price) || 0;
        const legacyDiscountPercentage = parseInt(event.discount_percentage) || 0;

        // Use legacy pricing if we have a valid discounted_price OR original_price > 0
        if (legacyDiscountedPrice > 0 || legacyOriginalPrice > 0) {
            let discountedPrice, originalPrice, discountPercentage;

            if (legacyDiscountedPrice > 0) {
                // Use the actual database fields
                discountedPrice = legacyDiscountedPrice;
                originalPrice = legacyOriginalPrice > legacyDiscountedPrice ? legacyOriginalPrice : null;
                discountPercentage = legacyDiscountPercentage > 0 ? legacyDiscountPercentage : null;
                
                // If we have discount percentage but no original price, calculate it
                if (legacyDiscountPercentage > 0 && (!originalPrice || originalPrice <= discountedPrice)) {
                    originalPrice = Math.round((discountedPrice / (1 - legacyDiscountPercentage / 100)) * 100) / 100;
                    discountPercentage = legacyDiscountPercentage;
                }
            } else if (legacyOriginalPrice > 0) {
                // We only have original_price, use it as current price
                discountedPrice = legacyOriginalPrice;
                originalPrice = null;
                discountPercentage = null;
            }

            console.log('🐛 Using legacy pricing:', {
                legacyDiscountedPrice,
                legacyOriginalPrice,
                legacyDiscountPercentage,
                discountedPrice,
                originalPrice,
                discountPercentage
            });

            return {
                discounted_price: discountedPrice,
                original_price: originalPrice,
                discount_percentage: discountPercentage > 0 ? discountPercentage : null,
                available_tickets: parseInt(event.available_tickets) || 0,
                total_tickets: parseInt(event.max_participants) || 0,
                is_free: discountedPrice === 0
            };
        }

        // Handle new pricing structure
        let pricing = null;
        if (typeof event.pricing === 'string') {
            try {
                pricing = JSON.parse(event.pricing);
                console.log('🐛 Parsed pricing JSON:', pricing);
            } catch (e) {
                console.warn('Failed to parse pricing JSON:', e);
            }
        } else if (typeof event.pricing === 'object' && event.pricing !== null) {
            pricing = event.pricing;
            console.log('🐛 Using pricing object:', pricing);
        }

        if (!pricing || !pricing.categories || pricing.categories.length === 0) {
            console.log('🐛 NO PRICING DATA - showing as free', { pricing, categories: pricing?.categories });
            // No pricing info - show as free
            return {
                discounted_price: 0,
                original_price: null,
                discount_percentage: null,
                available_tickets: parseInt(event.max_participants) || 0,
                total_tickets: parseInt(event.max_participants) || 0,
                is_free: true
            };
        }

        // Find the lowest priced tier across all categories
        let lowestPrice = null;
        let lowestOriginalPrice = null;
        let totalTickets = 0;
        let availableTickets = 0;

        for (const category of pricing.categories) {
            if (category.tiers && category.tiers.length > 0) {
                for (const tier of category.tiers) {
                    const tierPrice = parseFloat(tier.price) || 0;
                    const tierOriginalPrice = parseFloat(tier.originalPrice) || tierPrice;
                    const tierQuantity = parseInt(tier.available_quantity) || 0;

                    // Track lowest price
                    if (lowestPrice === null || tierPrice < lowestPrice) {
                        lowestPrice = tierPrice;
                        lowestOriginalPrice = tierOriginalPrice > tierPrice ? tierOriginalPrice : null;
                    }

                    // Sum up tickets (only count if quantity is specified)
                    if (tier.available_quantity && tier.available_quantity !== '') {
                        totalTickets += tierQuantity;
                        availableTickets += tierQuantity; // TODO: subtract booked tickets when available
                    }
                }
            }
        }

        // If no tickets counted from tiers, use event max_participants
        if (totalTickets === 0) {
            totalTickets = parseInt(event.max_participants) || 0;
            availableTickets = totalTickets; // TODO: subtract booked tickets when available
        }

        // If we still don't have a price and there are no legacy price fields,
        // check if this might be a pricing migration issue
        if (lowestPrice === null || lowestPrice === 0) {
            // Check if there were any legacy fields we missed
            const legacyPrice = parseFloat(event.price) || 0;
            const legacyOriginal = parseFloat(event.original_price) || 0;

            if (legacyPrice > 0 || legacyOriginal > 0) {
                console.log('🐛 FALLBACK: Using legacy pricing as backup', { legacyPrice, legacyOriginal });
                const finalPrice = legacyPrice || legacyOriginal;
                return {
                    discounted_price: finalPrice,
                    original_price: legacyOriginal > finalPrice ? legacyOriginal : null,
                    discount_percentage: legacyOriginal > finalPrice ?
                        Math.round(((legacyOriginal - finalPrice) / legacyOriginal) * 100) : null,
                    available_tickets: parseInt(event.available_tickets) || totalTickets,
                    total_tickets: parseInt(event.max_participants) || totalTickets,
                    is_free: finalPrice === 0
                };
            }
        }

        // Calculate discount percentage
        const discountPercentage = lowestOriginalPrice && lowestPrice < lowestOriginalPrice ?
            Math.round(((lowestOriginalPrice - lowestPrice) / lowestOriginalPrice) * 100) : 0;

        console.log('🐛 Final pricing result:', {
            lowestPrice,
            lowestOriginalPrice,
            discountPercentage,
            availableTickets,
            totalTickets,
            is_free: (lowestPrice === null || lowestPrice === 0)
        });

        return {
            discounted_price: lowestPrice || 0,
            original_price: lowestOriginalPrice,
            discount_percentage: discountPercentage > 0 ? discountPercentage : null,
            available_tickets: availableTickets,
            total_tickets: totalTickets,
            is_free: (lowestPrice === null || lowestPrice === 0)
        };
    }

    // Helper method to format event data for frontend
    static formatEvent(event) {
        const pricingInfo = this.extractPricingInfo(event);

        return {
            ...event,
            ...pricingInfo,
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
