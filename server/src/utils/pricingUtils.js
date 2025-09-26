/**
 * Multi-tier pricing utilities for booking system
 * Handles pricing category and tier selection, validation, and processing
 */

/**
 * Extract all available pricing options from event data
 * @param {Object} event - Event data with pricing structure
 * @returns {Array} Array of pricing options with category and tier info
 */
export const getAvailablePricingOptions = (event) => {
    const options = [];

    // Handle new multi-tier pricing structure
    if (event.pricing && event.pricing.categories) {
        event.pricing.categories.forEach(category => {
            if (category.tiers && category.tiers.length > 0) {
                category.tiers.forEach(tier => {
                    options.push({
                        category_id: category.id,
                        category_name: category.name,
                        tier_id: tier.id,
                        tier_name: tier.name,
                        price: parseFloat(tier.price || 0),
                        original_price: parseFloat(tier.originalPrice || tier.price || 0),
                        discount_percentage: parseInt(tier.discountPercentage || 0),
                        available_quantity: parseInt(tier.available_quantity || 0),
                        is_early_bird: tier.is_early_bird || false,
                        is_available: true // Will be calculated based on dates/availability
                    });
                });
            }
        });
    }

    // Fallback to legacy single pricing structure
    if (options.length === 0 && event.discounted_price) {
        options.push({
            category_id: null,
            category_name: 'Standard',
            tier_id: 'default',
            tier_name: 'Regular',
            price: parseFloat(event.discounted_price),
            original_price: parseFloat(event.original_price || event.discounted_price),
            discount_percentage: parseInt(event.discount_percentage || 0),
            available_quantity: parseInt(event.available_tickets || 0),
            is_early_bird: false,
            is_available: true
        });
    }

    return options;
};

/**
 * Find specific pricing option by category and tier IDs
 * @param {Object} event - Event data
 * @param {String} categoryId - Category ID
 * @param {String} tierId - Tier ID
 * @returns {Object|null} Pricing option or null if not found
 */
export const findPricingOption = (event, categoryId, tierId) => {
    const options = getAvailablePricingOptions(event);
    return options.find(option =>
        option.category_id === categoryId && option.tier_id === tierId
    ) || null;
};

/**
 * Validate pricing selection for booking
 * @param {Object} event - Event data
 * @param {String} categoryId - Selected category ID
 * @param {String} tierId - Selected tier ID
 * @param {Number} quantity - Requested quantity
 * @returns {Object} Validation result with success/error
 */
export const validatePricingSelection = (event, categoryId, tierId, quantity) => {
    const option = findPricingOption(event, categoryId, tierId);

    if (!option) {
        return {
            success: false,
            error: 'Selected pricing option not found',
            code: 'PRICING_OPTION_NOT_FOUND'
        };
    }

    if (!option.is_available) {
        return {
            success: false,
            error: 'Selected pricing option is not available',
            code: 'PRICING_OPTION_UNAVAILABLE'
        };
    }

    if (option.available_quantity > 0 && quantity > option.available_quantity) {
        return {
            success: false,
            error: `Only ${option.available_quantity} tickets available for ${option.category_name} - ${option.tier_name}`,
            code: 'INSUFFICIENT_QUANTITY'
        };
    }

    return {
        success: true,
        option
    };
};

/**
 * Calculate total price for booking with selected tier
 * @param {Object} pricingOption - Selected pricing option
 * @param {Number} quantity - Number of tickets
 * @returns {Object} Price calculation details
 */
export const calculateBookingPrice = (pricingOption, quantity) => {
    const unitPrice = pricingOption.price;
    const totalPrice = unitPrice * quantity;
    const totalDiscount = (pricingOption.original_price - pricingOption.price) * quantity;

    return {
        unit_price: unitPrice,
        total_price: totalPrice,
        original_total: pricingOption.original_price * quantity,
        total_discount: totalDiscount,
        discount_percentage: pricingOption.discount_percentage,
        quantity
    };
};

/**
 * Generate enhanced QR code content with pricing tier information
 * @param {Object} bookingData - Booking information
 * @param {Object} ticketData - Individual ticket information
 * @returns {String} QR code content
 */
export const generateTierAwareQRContent = (bookingData, ticketData) => {
    const qrData = {
        booking_id: bookingData.id,
        booking_reference: bookingData.booking_reference,
        ticket_number: ticketData.ticket_number,
        event_id: bookingData.event_id,
        category: bookingData.pricing_category_name || 'Standard',
        tier: bookingData.pricing_tier_name || 'Regular',
        price: ticketData.tier_price || bookingData.unit_price,
        holder_name: ticketData.holder_name,
        verification_hash: ticketData.qr_code
    };

    // Return JSON string for structured data
    return JSON.stringify(qrData);
};

/**
 * Generate ticket number with tier information
 * @param {String} bookingReference - Booking reference
 * @param {Number} ticketIndex - Ticket index (0-based)
 * @param {Object} pricingOption - Pricing option selected
 * @returns {String} Enhanced ticket number
 */
export const generateTierAwareTicketNumber = (bookingReference, ticketIndex, pricingOption) => {
    const categoryCode = pricingOption.category_name.substring(0, 3).toUpperCase();
    const tierCode = pricingOption.tier_name.substring(0, 2).toUpperCase();
    const ticketNumber = String(ticketIndex + 1).padStart(3, '0');
    const timestamp = Date.now().toString().slice(-4);

    return `${bookingReference}-${categoryCode}${tierCode}-${ticketNumber}-${timestamp}`;
};
