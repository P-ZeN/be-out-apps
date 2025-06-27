-- ================================================================
-- TRANSFER ALL EVENTS FROM ADMIN TO ORGANIZER
-- ================================================================

-- 1. Show what events the admin currently owns
SELECT 'ADMIN EVENTS BEFORE TRANSFER' as step;
SELECT 
    id::text as event_uuid,
    title,
    organizer_id::text as current_organizer,
    total_tickets,
    available_tickets
FROM events 
WHERE organizer_id = '37a806e9-55c0-4b08-a378-151a642258fa'  -- admin
ORDER BY created_at DESC;

-- 2. Transfer ALL events from admin to organizer (no title filter)
DO $$
DECLARE
    transferred_count INTEGER;
BEGIN
    UPDATE events 
    SET organizer_id = 'e9097f76-ca6e-433e-8675-5bfe0e67a26a'  -- organizer@test.com
    WHERE organizer_id = '37a806e9-55c0-4b08-a378-151a642258fa';  -- admin user
    
    GET DIAGNOSTICS transferred_count = ROW_COUNT;
    RAISE NOTICE 'Events transferred to organizer: %', transferred_count;
END $$;

-- 3. Show transfer completed
SELECT 'TRANSFER RESULT' as step;

-- 4. Fix available tickets for organizer events
UPDATE events 
SET available_tickets = total_tickets
WHERE organizer_id = 'e9097f76-ca6e-433e-8675-5bfe0e67a26a'  -- organizer@test.com
AND available_tickets = 0;

-- 5. Verify organizer now owns events
SELECT 'ORGANIZER EVENTS AFTER TRANSFER' as step;
SELECT 
    id::text as event_uuid,
    title,
    organizer_id::text as organizer_uuid,
    total_tickets,
    available_tickets
FROM events 
WHERE organizer_id = 'e9097f76-ca6e-433e-8675-5bfe0e67a26a'  -- organizer@test.com
ORDER BY created_at DESC;

-- 6. Verify admin has no events left
SELECT 'ADMIN EVENTS AFTER TRANSFER' as step;
SELECT COUNT(*) as admin_events_remaining
FROM events 
WHERE organizer_id = '37a806e9-55c0-4b08-a378-151a642258fa';  -- admin

-- 7. Test the organizer stats function
SELECT 'ORGANIZER STATS TEST' as step;
SELECT * FROM get_organizer_stats(
    'e9097f76-ca6e-433e-8675-5bfe0e67a26a'::uuid,  -- organizer@test.com
    365  -- Use longer period to catch all events
);

-- 8. Create a simple test booking
DO $$
DECLARE
    organizer_uuid UUID := 'e9097f76-ca6e-433e-8675-5bfe0e67a26a';
    customer_uuid UUID;
    event_uuid UUID;
BEGIN
    -- Create customer if doesn't exist
    INSERT INTO users (email, password, role, is_active) VALUES
    ('customer1@test.com', '$2b$10$6yJrshs3kMnwvZDRkQQ7Yuar9uUSE8607SKYEpNnFhN5lvNAJjbvm', 'user', true)
    ON CONFLICT (email) DO NOTHING;
    
    SELECT id INTO customer_uuid FROM users WHERE email = 'customer1@test.com';
    
    -- Get first event with available tickets
    SELECT id INTO event_uuid 
    FROM events 
    WHERE organizer_id = organizer_uuid 
    AND available_tickets > 0
    LIMIT 1;
    
    IF customer_uuid IS NOT NULL AND event_uuid IS NOT NULL THEN
        INSERT INTO bookings (
            user_id, event_id, quantity, unit_price, total_price,
            booking_status, payment_status, booking_date,
            customer_name, customer_email
        ) VALUES (
            customer_uuid, event_uuid, 1, 25.00, 25.00,
            'confirmed', 'paid', CURRENT_TIMESTAMP,
            'Test Customer', 'customer1@test.com'
        );
        
        RAISE NOTICE 'Test booking created for event %', event_uuid;
    ELSE
        RAISE NOTICE 'Missing customer (%) or event (%)', customer_uuid, event_uuid;
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Booking creation error: %', SQLERRM;
END $$;

-- 9. Final verification with bookings
SELECT 'FINAL VERIFICATION WITH BOOKINGS' as step;
SELECT 
    e.title,
    e.organizer_id::text as organizer_uuid,
    COUNT(b.id) as booking_count,
    COALESCE(SUM(b.total_price), 0) as revenue
FROM events e
LEFT JOIN bookings b ON e.id = b.event_id AND b.booking_status = 'confirmed'
WHERE e.organizer_id = 'e9097f76-ca6e-433e-8675-5bfe0e67a26a'  -- organizer@test.com
GROUP BY e.id, e.title, e.organizer_id
ORDER BY e.title;

-- 10. Test stats again after booking creation
SELECT 'FINAL STATS TEST' as step;
SELECT * FROM get_organizer_stats(
    'e9097f76-ca6e-433e-8675-5bfe0e67a26a'::uuid,  -- organizer@test.com
    365
);
