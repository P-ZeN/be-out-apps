-- ================================================================
-- FIX AVAILABLE TICKETS ISSUE
-- ================================================================
-- The trigger probably fails because available_tickets = 0

-- 1. Check current ticket availability for organizer events
SELECT 'TICKET AVAILABILITY CHECK' as step;
SELECT 
    id::text as event_uuid,
    title,
    total_tickets,
    available_tickets,
    (total_tickets - available_tickets) as tickets_sold
FROM events 
WHERE organizer_id = (SELECT id FROM users WHERE email = 'organizer@test.com')
ORDER BY title;

-- 2. Update available_tickets to match total_tickets for testing
UPDATE events 
SET available_tickets = total_tickets
WHERE organizer_id = (SELECT id FROM users WHERE email = 'organizer@test.com')
AND available_tickets = 0;

-- 3. Check after update
SELECT 'AFTER TICKET UPDATE' as step;
SELECT 
    id::text as event_uuid,
    title,
    total_tickets,
    available_tickets
FROM events 
WHERE organizer_id = (SELECT id FROM users WHERE email = 'organizer@test.com')
ORDER BY title;

-- 4. Now try to create bookings again
DO $$
DECLARE
    organizer_uuid UUID;
    event_uuid UUID;
    customer_uuid UUID;
    event_count INTEGER;
BEGIN
    SELECT id INTO organizer_uuid FROM users WHERE email = 'organizer@test.com';
    SELECT id INTO customer_uuid FROM users WHERE email = 'customer1@test.com';
    
    -- Get first event with available tickets
    SELECT id INTO event_uuid 
    FROM events 
    WHERE organizer_id = organizer_uuid 
    AND available_tickets > 0 
    LIMIT 1;
    
    SELECT COUNT(*) INTO event_count 
    FROM events 
    WHERE organizer_id = organizer_uuid;
    
    RAISE NOTICE 'Found % events for organizer', event_count;
    RAISE NOTICE 'Selected event: %', event_uuid;
    
    IF event_uuid IS NOT NULL AND customer_uuid IS NOT NULL THEN
        -- Try to insert one booking
        INSERT INTO bookings (
            user_id, event_id, quantity, unit_price, total_price,
            booking_status, payment_status, booking_date,
            customer_name, customer_email
        ) VALUES (
            customer_uuid, event_uuid, 1, 25.00, 25.00,
            'confirmed', 'paid', CURRENT_TIMESTAMP,
            'Test Customer', 'customer1@test.com'
        );
        
        RAISE NOTICE 'Booking created successfully!';
    ELSE
        RAISE NOTICE 'ERROR: Missing event (%) or customer (%)', event_uuid, customer_uuid;
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR creating booking: %', SQLERRM;
END $$;

-- 5. Final verification
SELECT 'FINAL BOOKING CHECK' as step;
SELECT COUNT(*) as bookings_created
FROM bookings b
JOIN events e ON b.event_id = e.id
WHERE e.organizer_id = (SELECT id FROM users WHERE email = 'organizer@test.com');

-- 6. If booking created, test the stats function
SELECT 'STATS FUNCTION TEST' as step;
SELECT * FROM get_organizer_stats(
    (SELECT id FROM users WHERE email = 'organizer@test.com'),
    365
);
