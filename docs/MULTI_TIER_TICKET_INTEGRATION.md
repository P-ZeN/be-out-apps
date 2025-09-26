# Multi-Tier Pricing Ticket Integration

## Problem
The current ticket system doesn't support the new multi-tier pricing structure where events can have:
- Multiple categories (Standard, VIP, Student)
- Multiple tiers per category (Early Bird, Regular)
- Different prices and availability per tier

## Current Issues
1. **Database**: Bookings table doesn't store which pricing category/tier was selected
2. **Tickets**: PDF tickets don't show category/tier information
3. **QR Codes**: QR codes don't include pricing tier information
4. **Booking Flow**: No way to select specific pricing tiers during booking

## Solution Overview

### 1. Database Schema Updates
Add new columns to track pricing selections:

```sql
-- Add columns to bookings table
ALTER TABLE bookings ADD COLUMN pricing_category_id UUID REFERENCES categories(id);
ALTER TABLE bookings ADD COLUMN pricing_tier_id VARCHAR(255); -- Store tier ID from pricing JSON
ALTER TABLE bookings ADD COLUMN pricing_category_name VARCHAR(255);
ALTER TABLE bookings ADD COLUMN pricing_tier_name VARCHAR(255);

-- Add columns to booking_tickets table
ALTER TABLE booking_tickets ADD COLUMN pricing_category_name VARCHAR(255);
ALTER TABLE booking_tickets ADD COLUMN pricing_tier_name VARCHAR(255);
ALTER TABLE booking_tickets ADD COLUMN tier_price NUMERIC(10,2);
```

### 2. Booking System Updates
- Update booking creation to accept pricing tier selection
- Validate tier availability and pricing
- Store category and tier information

### 3. Ticket Design Updates
- Add category/tier display in ticket template
- Update QR code content to include tier information
- Add tier-specific styling options

### 4. PDF Generation Updates
- Include category/tier in ticket template data
- Update QR code generation to include tier info
- Handle tier-specific customizations

## Implementation Status

### ✅ **COMPLETED**
1. **Database Schema** - New columns added successfully
   - `bookings` table: pricing_category_id, pricing_tier_id, pricing_category_name, pricing_tier_name
   - `booking_tickets` table: pricing_category_name, pricing_tier_name, tier_price
   - Indexes created for performance

2. **Server-Side Utilities** - `/server/src/utils/pricingUtils.js`
   - `getAvailablePricingOptions()` - Extract pricing from event data
   - `validatePricingSelection()` - Validate tier selection
   - `generateTierAwareQRContent()` - Enhanced QR codes with tier info
   - `generateTierAwareTicketNumber()` - Tier-aware ticket numbering

3. **Booking API Updates** - `/server/src/routes/bookings.js`
   - Support for pricing_category_id and pricing_tier_id in booking creation
   - Tier validation and availability checking
   - Enhanced ticket generation with tier information

4. **PDF Ticket Service** - `/server/src/services/pdfTicketService.js`
   - New template variables: PRICING_CATEGORY, PRICING_TIER, TIER_PRICE
   - PRICING_CATEGORY_TIER combined display field

5. **Ticket Template** - `/server/src/templates/ticket-template.html`
   - Added "TYPE DE BILLET" section showing category and tier
   - Uses TIER_PRICE instead of EVENT_PRICE for accurate pricing

6. **CSS Styling** - `/server/src/templates/ticket-template.css`
   - New .tier-info class for tier display styling

### 🚧 **IN PROGRESS**
7. **Frontend Integration** - Booking flow updates needed
   - EnhancedBookingModal needs tier selection step
   - Client-side pricing utilities integration

### ⏳ **PENDING**
8. **QR Code Enhancement** - Full implementation
   - QR codes now include tier data but need client-side scanning updates
   - Verification endpoints may need tier information

## Usage Examples

### Booking with Tier Selection
```javascript
const bookingData = {
    event_id: "event-uuid",
    quantity: 2,
    pricing_category_id: "category-uuid",
    pricing_tier_id: "early-bird-tier-id",
    customer_name: "John Doe",
    customer_email: "john@example.com"
    // ... other fields
};
```

### QR Code Content (JSON Format)
```json
{
    "booking_id": "booking-uuid",
    "ticket_number": "BO20250926-STAEB-001-1234",
    "category": "Standard",
    "tier": "Early Bird",
    "price": 25.00,
    "verification_hash": "sha256-hash"
}
```

## Next Steps
1. Complete frontend booking modal integration
2. Test full booking flow end-to-end
3. Update admin interfaces to show tier information
4. Add tier-based analytics and reporting
