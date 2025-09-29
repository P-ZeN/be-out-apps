-- Add reservation expiry column to bookings table for 15-minute ticket reservations
-- This supports proper e-commerce checkout flow where tickets are temporarily held
-- during payment process instead of immediately decremented

ALTER TABLE bookings
ADD COLUMN reservation_expires_at TIMESTAMP NULL;

-- Add index for efficient cleanup queries
CREATE INDEX idx_bookings_reservation_expiry
ON bookings(reservation_expires_at)
WHERE reservation_expires_at IS NOT NULL;

-- Add index for efficient pending reservation queries
CREATE INDEX idx_bookings_pending_reservations
ON bookings(event_id, booking_status, reservation_expires_at)
WHERE booking_status = 'pending';

-- Comments for documentation
COMMENT ON COLUMN bookings.reservation_expires_at IS 'Expiry timestamp for pending ticket reservations (15 minutes from booking creation)';
