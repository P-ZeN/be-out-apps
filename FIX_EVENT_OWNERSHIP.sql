-- ================================================================
-- FIX EVENT OWNERSHIP - ASSIGN TO CORRECT ORGANIZER
-- ================================================================

-- 1. Show current situation
SELECT 'CURRENT EVENT OWNERSHIP' as step;
SELECT 
    e.id::text as event_uuid,
    e.title,
    e.organizer_id::text as current_organizer,
    u.email as current_owner_email
FROM events e
LEFT JOIN users u ON e.organizer_id = u.id
WHERE e.organizer_id IN (
    '37a806e9-55c0-4b08-a378-151a642258fa',  -- admin
    'e9097f76-ca6e-433e-8675-5bfe0e67a26a'   -- organizer
)
ORDER BY e.created_at DESC;

-- 2. Reassign events from admin to organizer
UPDATE events 
SET organizer_id = 'e9097f76-ca6e-433e-8675-5bfe0e67a26a'  -- organizer@test.com
WHERE organizer_id = '37a806e9-55c0-4b08-a378-151a642258fa'  -- admin user
AND title IN (
    'Concert Jazz Fusion 2024',
    'Théâtre Contemporain: "Les Voix du Temps"',
    'Conférence Tech: L''IA en 2024'
);

-- 3. Also fix available_tickets while we're at it
UPDATE events 
SET available_tickets = total_tickets
WHERE organizer_id = 'e9097f76-ca6e-433e-8675-5bfe0e67a26a'  -- organizer@test.com
AND available_tickets = 0;

-- 4. Verify the fix
SELECT 'AFTER OWNERSHIP FIX' as step;
SELECT 
    e.id::text as event_uuid,
    e.title,
    e.organizer_id::text as organizer_uuid,
    u.email as organizer_email,
    e.total_tickets,
    e.available_tickets
FROM events e
JOIN users u ON e.organizer_id = u.id
WHERE e.organizer_id = 'e9097f76-ca6e-433e-8675-5bfe0e67a26a'  -- organizer@test.com
ORDER BY e.title;

-- 5. Now test the stats function
SELECT 'ORGANIZER STATS TEST' as step;
SELECT * FROM get_organizer_stats(
    'e9097f76-ca6e-433e-8675-5bfe0e67a26a'::uuid,  -- organizer@test.com
    30
);

-- 6. Create a test booking now that events are assigned correctly
DO $$
DECLARE
    organizer_uuid UUID := 'e9097f76-ca6e-433e-8675-5bfe0e67a26a';
    customer_uuid UUID;
    event_uuid UUID;
BEGIN
    -- Get customer
    SELECT id INTO customer_uuid FROM users WHERE email = 'customer1@test.com';
    
    -- Get first event
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
            customer_uuid, event_uuid, 2, 45.00, 90.00,
            'confirmed', 'paid', CURRENT_TIMESTAMP,
            'Marie Dubois', 'customer1@test.com'
        );
        
        RAISE NOTICE 'Test booking created successfully!';
    ELSE
        RAISE NOTICE 'Missing customer (%) or event (%)', customer_uuid, event_uuid;
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: %', SQLERRM;
END $$;

-- 7. Final verification
SELECT 'FINAL VERIFICATION' as step;
SELECT 
    COUNT(DISTINCT e.id) as total_events,
    COUNT(DISTINCT b.id) as total_bookings,
    COALESCE(SUM(b.total_price), 0) as total_revenue
FROM events e
LEFT JOIN bookings b ON e.id = b.event_id AND b.booking_status = 'confirmed'
WHERE e.organizer_id = 'e9097f76-ca6e-433e-8675-5bfe0e67a26a';  -- organizer@test.com

-- 8. Test all functions
SELECT 'UPCOMING EVENTS TEST' as step;
SELECT * FROM get_organizer_upcoming_events(
    'e9097f76-ca6e-433e-8675-5bfe0e67a26a'::uuid,
    5
);

SELECT 'RECENT BOOKINGS TEST' as step;
SELECT * FROM get_organizer_recent_bookings(
    'e9097f76-ca6e-433e-8675-5bfe0e67a26a'::uuid,
    30,
    10
);
