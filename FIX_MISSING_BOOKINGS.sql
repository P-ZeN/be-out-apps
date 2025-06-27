-- ================================================================
-- FIX MISSING BOOKINGS FOR ORGANIZER
-- ================================================================
-- The events exist but no bookings - let's add them

DO $
$
DECLARE
    organizer_user_id UUID;
    event_1_id UUID;
    event_2_id UUID;
    event_3_id UUID;
    customer_1_id UUID;
    customer_2_id UUID;
    customer_3_id UUID;
BEGIN
    -- Get organizer and customer IDs
    SELECT id
    INTO organizer_user_id
    FROM users
    WHERE email = 'organizer@test.com';
    SELECT id
    INTO customer_1_id
    FROM users
    WHERE email = 'customer1@test.com';
    SELECT id
    INTO customer_2_id
    FROM users
    WHERE email = 'customer2@test.com';
    SELECT id
    INTO customer_3_id
    FROM users
    WHERE email = 'customer3@test.com';

    -- Get event IDs for this organizer
    SELECT id
    INTO event_1_id
    FROM events
    WHERE organizer_id = organizer_user_id AND title LIKE '%Jazz%'
    LIMIT 1;
SELECT id
INTO event_2_id
FROM events
WHERE organizer_id = organizer_user_id AND title LIKE '%Théâtre%'
LIMIT 1;
SELECT id
INTO event_3_id
FROM events
WHERE organizer_id = organizer_user_id AND title LIKE '%Conférence%'
LIMIT 1;

-- If no specific events, get any 3 events from this organizer
IF event_1_id IS NULL THEN
SELECT id
INTO event_1_id
FROM events
WHERE organizer_id = organizer_user_id
LIMIT 1;
SELECT id
INTO event_2_id
FROM events
WHERE organizer_id = organizer_user_id AND id != event_1_id
LIMIT 1;
SELECT id
INTO event_3_id
FROM events
WHERE organizer_id = organizer_user_id AND id NOT IN (event_1_id, event_2_id)
LIMIT 1;
END
IF;

    RAISE NOTICE 'Found organizer: %, events: %, %, %', organizer_user_id, event_1_id, event_2_id, event_3_id;

-- Create bookings if events exist
IF event_1_id IS NOT NULL THEN
-- Jazz Concert bookings (7 tickets total = €315)
INSERT INTO bookings
    (
    user_id, event_id, quantity, unit_price, total_price,
    booking_status, payment_status, booking_date,
    customer_name, customer_email, customer_phone
    )
VALUES
    (customer_1_id, event_1_id, 2, 45.00, 90.00, 'confirmed', 'paid', CURRENT_TIMESTAMP - INTERVAL
'3 days', 'Marie Dubois', 'customer1@test.com', '+33 6 12 34 56 78'),
(customer_2_id, event_1_id, 1, 45.00, 45.00, 'confirmed', 'paid', CURRENT_TIMESTAMP - INTERVAL '2 days', 'Pierre Martin', 'customer2@test.com', '+33 6 98 76 54 32'),
(customer_3_id, event_1_id, 4, 45.00, 180.00, 'confirmed', 'paid', CURRENT_TIMESTAMP - INTERVAL '1 day', 'Sophie Leclerc', 'customer3@test.com', '+33 6 11 22 33 44')
        ON CONFLICT DO NOTHING;

        RAISE NOTICE 'Added bookings for event 1: %', event_1_id;
END
IF;

    IF event_2_id IS NOT NULL THEN
-- Theater bookings (5 tickets total = €175)
INSERT INTO bookings
    (
    user_id, event_id, quantity, unit_price, total_price,
    booking_status, payment_status, booking_date,
    customer_name, customer_email, customer_phone
    )
VALUES
    (customer_1_id, event_2_id, 2, 35.00, 70.00, 'confirmed', 'paid', CURRENT_TIMESTAMP - INTERVAL
'4 days', 'Marie Dubois', 'customer1@test.com', '+33 6 12 34 56 78'),
(customer_2_id, event_2_id, 3, 35.00, 105.00, 'confirmed', 'paid', CURRENT_TIMESTAMP - INTERVAL '1 day', 'Pierre Martin', 'customer2@test.com', '+33 6 98 76 54 32')
        ON CONFLICT DO NOTHING;

        RAISE NOTICE 'Added bookings for event 2: %', event_2_id;
END
IF;

    IF event_3_id IS NOT NULL THEN
-- Conference bookings (3 tickets total = €75)
INSERT INTO bookings
    (
    user_id, event_id, quantity, unit_price, total_price,
    booking_status, payment_status, booking_date,
    customer_name, customer_email, customer_phone
    )
VALUES
    (customer_1_id, event_3_id, 1, 25.00, 25.00, 'confirmed', 'paid', CURRENT_TIMESTAMP - INTERVAL
'2 days', 'Marie Dubois', 'customer1@test.com', '+33 6 12 34 56 78'),
(customer_3_id, event_3_id, 2, 25.00, 50.00, 'confirmed', 'paid', CURRENT_TIMESTAMP - INTERVAL '6 hours', 'Sophie Leclerc', 'customer3@test.com', '+33 6 11 22 33 44')
        ON CONFLICT DO NOTHING;

        RAISE NOTICE 'Added bookings for event 3: %', event_3_id;
END
IF;

    RAISE NOTICE '✅ Bookings added successfully!';
END $$;

-- Verify the bookings were created
SELECT 'VERIFICATION: Bookings after fix' as status;
SELECT
    e.title,
    COUNT(b.id) as booking_count,
    SUM(b.total_price) as revenue,
    SUM(b.quantity) as tickets_sold
FROM events e
    LEFT JOIN bookings b ON e.id = b.event_id AND b.booking_status = 'confirmed'
WHERE e.organizer_id = (SELECT id
FROM users
WHERE email = 'organizer@test.com')
GROUP BY e.id, e.title
ORDER BY e.title;

-- Test the function again
SELECT 'TESTING FUNCTION AFTER FIX' as status;
SELECT *
FROM get_organizer_stats(
    (SELECT id
    FROM users
    WHERE email = 'organizer@test.com'),
    30
);
