/**
 * Utility functions for handling both legacy and new multi-tier pricing systems
 *
 * Legacy system: uses original_price, discounted_price, discount_percentage fields
 * New system: uses pricing JSONB with categories and tiers
 */

/**
 * Get the best available pricing information from an event
 * Handles both legacy and new pricing systems
 *
 * @param {Object} event - Event object from API
 * @returns {Object} Pricing information with structure:
 *   - price: final display price
 *   - originalPrice: original price (if available)
 *   - discountPercentage: discount percentage (if available)
 *   - hasMultiplePrices: true if event has multiple pricing tiers
 *   - cheapestPrice: lowest available price (for multi-tier events)
 *   - priceRange: string like "25€ - 50€" for multi-tier events
 *   - categories: array of pricing categories (for new system)
 */
export const getEventPricingInfo = (event) => {
    // Debug logging removed to reduce console noise

    // Check if event has new pricing structure and it's valid
    const hasValidNewPricing = event.pricing &&
                              typeof event.pricing === 'object' &&
                              event.pricing.categories &&
                              Array.isArray(event.pricing.categories) &&
                              event.pricing.categories.length > 0;

    if (hasValidNewPricing) {
        return extractNewPricingInfo(event.pricing.categories);
    }

    // Fallback to legacy pricing structure
    return extractLegacyPricingInfo(event);
    return result;
};

/**
 * Extract pricing info from new multi-tier pricing structure
 */
const extractNewPricingInfo = (categories) => {
    const allTiers = [];

    // Collect all tiers from all categories
    categories.forEach(category => {
        if (category.tiers && Array.isArray(category.tiers) && category.tiers.length > 0) {
            category.tiers.forEach(tier => {
                const tierPrice = parseFloat(tier.price || 0);
                if (tierPrice >= 0) { // Accept 0 for free tiers
                    allTiers.push({
                        ...tier,
                        categoryName: category.name,
                        price: tierPrice,
                        originalPrice: tier.originalPrice ? parseFloat(tier.originalPrice) : null,
                        discountPercentage: tier.discountPercentage ? parseInt(tier.discountPercentage) : null
                    });
                }
            });
        }
    });

    if (allTiers.length === 0) {
        return {
            price: 0,
            originalPrice: null,
            discountPercentage: null,
            hasMultiplePrices: false,
            cheapestPrice: 0,
            priceRange: "Gratuit",
            categories: categories
        };
    }

    // Sort tiers by price
    allTiers.sort((a, b) => a.price - b.price);

    const cheapestTier = allTiers[0];
    const mostExpensiveTier = allTiers[allTiers.length - 1];
    const hasMultiplePrices = allTiers.length > 1 || (cheapestTier.price !== mostExpensiveTier.price);

    return {
        price: cheapestTier.price,
        originalPrice: cheapestTier.originalPrice,
        discountPercentage: cheapestTier.discountPercentage,
        hasMultiplePrices,
        cheapestPrice: cheapestTier.price,
        priceRange: hasMultiplePrices
            ? `${cheapestTier.price}€ - ${mostExpensiveTier.price}€`
            : cheapestTier.price > 0 ? `${cheapestTier.price}€` : "Gratuit",
        categories: categories,
        allTiers: allTiers
    };
};

/**
 * Extract pricing info from legacy pricing structure
 */
const extractLegacyPricingInfo = (event) => {
    // Handle various field names and ensure we get numbers
    const originalPrice = parseFloat(event.original_price || 0);
    const discountedPrice = parseFloat(event.discounted_price || event.price || 0);
    const discountPercentage = parseInt(event.discount_percentage || 0);



    // If discounted price is 0, it's a free event
    if (discountedPrice === 0) {
        return {
            price: 0,
            originalPrice: null,
            discountPercentage: null,
            hasMultiplePrices: false,
            cheapestPrice: 0,
            priceRange: "Gratuit",
            categories: null
        };
    }

    // Calculate discount percentage if not provided but prices differ
    let calculatedDiscountPercentage = discountPercentage;
    let calculatedOriginalPrice = originalPrice;

    if (!discountPercentage && originalPrice > discountedPrice && originalPrice > 0) {
        calculatedDiscountPercentage = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
    }

    // For legacy events, if we have a discount percentage but original price equals discounted price,
    // calculate what the original price should have been
    if (discountPercentage > 0 && discountedPrice > 0 && originalPrice <= discountedPrice) {
        calculatedOriginalPrice = Math.round((discountedPrice / (1 - discountPercentage / 100)) * 100) / 100;
        calculatedDiscountPercentage = discountPercentage;
    }

    return {
        price: discountedPrice,
        originalPrice: calculatedOriginalPrice > discountedPrice ? calculatedOriginalPrice : null,
        discountPercentage: calculatedDiscountPercentage > 0 ? calculatedDiscountPercentage : null,
        hasMultiplePrices: false,
        cheapestPrice: discountedPrice,
        priceRange: discountedPrice > 0 ? `${discountedPrice}€` : "Gratuit",
        categories: null
    };
};

/**
 * Format price display with discount information
 *
 * @param {Object} pricingInfo - Result from getEventPricingInfo()
 * @param {Object} options - Display options
 * @returns {Object} Formatted pricing display components
 */
export const formatPriceDisplay = (pricingInfo, options = {}) => {
    const {
        showRange = false,           // Show price range for multi-tier events
        showOriginalPrice = true,    // Show crossed-out original price
        showDiscountBadge = true,    // Show discount percentage badge
        showCurrency = true,         // Show currency symbol
        currency = '€'               // Currency symbol
    } = options;

    const { price, originalPrice, discountPercentage, hasMultiplePrices, priceRange } = pricingInfo;

    // Free event
    if (price === 0) {
        return {
            displayPrice: "Gratuit",
            originalPrice: null,
            discountPercentage: null,
            showStrikethrough: false,
            showDiscountBadge: false,
            priceText: "Gratuit"
        };
    }

    // Multi-tier pricing - show range if requested
    if (hasMultiplePrices && showRange) {
        return {
            displayPrice: `À partir de ${price}${showCurrency ? currency : ''}`,
            originalPrice: null,
            discountPercentage: null,
            showStrikethrough: false,
            showDiscountBadge: false,
            priceText: `À partir de ${price}€`,
            priceRange: priceRange
        };
    }

    // Single price or cheapest price display
    const displayPrice = `${price}${showCurrency ? currency : ''}`;
    const showStrikethrough = showOriginalPrice && originalPrice && originalPrice > price;
    const showDiscountBadgeFlag = showDiscountBadge && discountPercentage && discountPercentage > 0;

    return {
        displayPrice,
        originalPrice: showStrikethrough ? `${originalPrice}${showCurrency ? currency : ''}` : null,
        discountPercentage: showDiscountBadgeFlag ? discountPercentage : null,
        showStrikethrough,
        showDiscountBadge: showDiscountBadgeFlag,
        priceText: displayPrice
    };
};

/**
 * Get all available pricing options for booking selection
 * Used in booking modals to show different categories and tiers
 *
 * @param {Object} event - Event object from API
 * @returns {Array} Array of booking options with price, name, description, etc.
 */
export const getBookingPricingOptions = (event) => {
    const pricingInfo = getEventPricingInfo(event);

    // If it's new pricing system with categories
    if (pricingInfo.categories && pricingInfo.categories.length > 0) {
        const options = [];

        pricingInfo.categories.forEach(category => {
            if (category.tiers && category.tiers.length > 0) {
                category.tiers.forEach(tier => {
                    if (tier.price && parseFloat(tier.price) > 0) {
                        options.push({
                            id: `${category.id}-${tier.id}`,
                            categoryId: category.id,
                            tierId: tier.id,
                            categoryName: category.name,
                            categoryDescription: category.description,
                            tierName: tier.name,
                            price: parseFloat(tier.price),
                            originalPrice: tier.originalPrice ? parseFloat(tier.originalPrice) : null,
                            discountPercentage: tier.discountPercentage ? parseInt(tier.discountPercentage) : null,
                            availableQuantity: tier.available_quantity ? parseInt(tier.available_quantity) : null,
                            isEarlyBird: tier.is_early_bird || false,
                            displayName: category.tiers.length > 1
                                ? `${category.name} - ${tier.name}`
                                : category.name
                        });
                    }
                });
            }
        });

        return options.sort((a, b) => a.price - b.price);
    }

    // Legacy system - return single option
    return [{
        id: 'legacy-single',
        categoryId: null,
        tierId: null,
        categoryName: 'Standard',
        categoryDescription: null,
        tierName: 'Standard',
        price: pricingInfo.price,
        originalPrice: pricingInfo.originalPrice,
        discountPercentage: pricingInfo.discountPercentage,
        availableQuantity: event.available_tickets,
        isEarlyBird: false,
        displayName: 'Standard'
    }];
};

/**
 * Check if an event is free
 */
export const isEventFree = (event) => {
    const pricingInfo = getEventPricingInfo(event);
    return pricingInfo.price === 0;
};

/**
 * Get the minimum price for an event (for sorting, filtering, etc.)
 */
export const getMinimumPrice = (event) => {
    const pricingInfo = getEventPricingInfo(event);
    return pricingInfo.cheapestPrice;
};
