-- ================================================================
-- DEBUG ORGANIZER DASHBOARD ISSUE
-- ================================================================
-- This script helps debug why the dashboard shows 0 for everything

-- 1. Verify organizer user exists and get their ID
SELECT 'ORGANIZER USER CHECK' as debug_step;
SELECT id, email, role, is_active, created_at
FROM users
WHERE email = 'organizer@test.com';

-- 2. Check if events exist for this organizer
SELECT 'EVENTS BY ORGANIZER' as debug_step;
SELECT id, title, organizer_id, status, created_at, event_date
FROM events
WHERE organizer_id = (SELECT id
FROM users
WHERE email = 'organizer@test.com');

-- 3. Check if bookings exist for organizer's events
SELECT 'BOOKINGS FOR ORGANIZER EVENTS' as debug_step;
SELECT
    b.id as booking_id,
    b.event_id,
    e.title as event_title,
    b.booking_status,
    b.total_price,
    b.quantity,
    b.booking_date
FROM bookings b
    JOIN events e ON b.event_id = e.id
WHERE e.organizer_id = (SELECT id
FROM users
WHERE email = 'organizer@test.com')
ORDER BY b.booking_date DESC;

-- 4. Test the function directly with organizer ID
SELECT 'TESTING get_organizer_stats FUNCTION' as debug_step;
SELECT *
FROM get_organizer_stats(
    (SELECT id
    FROM users
    WHERE email = 'organizer@test.com'),
    30
);

-- 5. Check what the period filter is doing
SELECT 'DATE RANGE CHECK' as debug_step;
    SELECT
        'Current Date' as label,
        CURRENT_DATE as date_value
UNION ALL
    SELECT
        '30 days ago' as label,
        CURRENT_DATE - INTERVAL '30 days'
as date_value
UNION ALL
SELECT
    'Events created_at range' as label,
    MIN(created_at)
::date as date_value
FROM events
WHERE organizer_id =
    (SELECT id
    FROM users
    WHERE email = 'organizer@test.com')
UNION ALL
    SELECT
        'Bookings booking_date range' as label,
        MIN(booking_date)
::date as date_value
FROM bookings b
JOIN events e ON b.event_id = e.id
WHERE e.organizer_id =
(SELECT id
FROM users
WHERE email = 'organizer@test.com');

-- 6. Raw count without date filter
SELECT 'RAW COUNTS (NO DATE FILTER)' as debug_step;
SELECT
    COUNT(DISTINCT e.id) as total_events,
    COUNT(DISTINCT b.id) as total_bookings,
    COALESCE(SUM(b.total_price), 0) as total_revenue
FROM events e
    LEFT JOIN bookings b ON e.id = b.event_id AND b.booking_status = 'confirmed'
WHERE e.organizer_id = (SELECT id
FROM users
WHERE email = 'organizer@test.com');

-- 7. Check if there's a date mismatch in the function
SELECT 'EVENTS WITHIN 30 DAYS (created_at)' as debug_step;
SELECT COUNT(*) as events_count
FROM events e
WHERE e.organizer_id = (SELECT id
    FROM users
    WHERE email = 'organizer@test.com')
    AND e.created_at >= CURRENT_DATE - INTERVAL
'30 days';

SELECT 'BOOKINGS WITHIN 30 DAYS (booking_date)' as debug_step;
SELECT COUNT(*) as bookings_count
FROM bookings b
    JOIN events e ON b.event_id = e.id
WHERE e.organizer_id = (SELECT id
    FROM users
    WHERE email = 'organizer@test.com')
    AND b.booking_date >= CURRENT_DATE - INTERVAL
'30 days'
AND b.booking_status = 'confirmed';
