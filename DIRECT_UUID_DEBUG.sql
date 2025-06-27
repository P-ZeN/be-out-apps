-- ================================================================
-- DIRECT UUID DEBUGGING
-- ================================================================

-- 1. Get organizer UUID and verify it exists
SELECT 'ORGANIZER UUID CHECK' as step;
SELECT id::text as organizer_uuid, email, role 
FROM users 
WHERE email = 'organizer@test.com';

-- 2. Check events for this specific organizer UUID
SELECT 'EVENTS FOR ORGANIZER UUID' as step;
SELECT id::text as event_uuid, title, organizer_id::text 
FROM events 
WHERE organizer_id = (SELECT id FROM users WHERE email = 'organizer@test.com');

-- 3. Check if any bookings exist at all in the system
SELECT 'TOTAL BOOKINGS IN SYSTEM' as step;
SELECT COUNT(*) as total_system_bookings FROM bookings;

-- 4. Check specific event-booking relationship
SELECT 'EVENT-BOOKING JOIN TEST' as step;
SELECT 
    e.id::text as event_uuid,
    e.title,
    e.organizer_id::text as organizer_uuid,
    COUNT(b.id) as booking_count
FROM events e
LEFT JOIN bookings b ON e.id = b.event_id
WHERE e.organizer_id = (SELECT id FROM users WHERE email = 'organizer@test.com')
GROUP BY e.id, e.title, e.organizer_id;

-- 5. Check if customer users exist
SELECT 'CUSTOMER USERS CHECK' as step;
SELECT id::text as customer_uuid, email 
FROM users 
WHERE email IN ('customer1@test.com', 'customer2@test.com', 'customer3@test.com');

-- 6. Try to create one simple booking manually
DO $$
DECLARE
    organizer_uuid UUID;
    event_uuid UUID;
    customer_uuid UUID;
BEGIN
    SELECT id INTO organizer_uuid FROM users WHERE email = 'organizer@test.com';
    SELECT id INTO event_uuid FROM events WHERE organizer_id = organizer_uuid LIMIT 1;
    SELECT id INTO customer_uuid FROM users WHERE email = 'customer1@test.com';
    
    IF organizer_uuid IS NULL THEN
        RAISE NOTICE 'ERROR: Organizer not found';
    ELSIF event_uuid IS NULL THEN
        RAISE NOTICE 'ERROR: No events found for organizer %', organizer_uuid;
    ELSIF customer_uuid IS NULL THEN
        RAISE NOTICE 'ERROR: Customer1 not found';
    ELSE
        RAISE NOTICE 'SUCCESS: Found organizer %, event %, customer %', organizer_uuid, event_uuid, customer_uuid;
        
        -- Try to insert one booking
        INSERT INTO bookings (
            user_id, event_id, quantity, unit_price, total_price,
            booking_status, payment_status, booking_date,
            customer_name, customer_email
        ) VALUES (
            customer_uuid, event_uuid, 1, 25.00, 25.00,
            'confirmed', 'paid', CURRENT_TIMESTAMP,
            'Test Customer', 'customer1@test.com'
        ) ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Booking insertion attempted';
    END IF;
END $$;

-- 7. Final verification
SELECT 'FINAL CHECK' as step;
SELECT COUNT(*) as bookings_after_test
FROM bookings b
JOIN events e ON b.event_id = e.id
WHERE e.organizer_id = (SELECT id FROM users WHERE email = 'organizer@test.com');
