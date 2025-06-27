-- ================================================================
-- QUICK DIAGNOSTIC: Why are stats still 0?
-- ================================================================

-- 1. Check if bookings were actually created
SELECT 'BOOKINGS COUNT CHECK' as step;
SELECT COUNT(*) as total_bookings 
FROM bookings b
JOIN events e ON b.event_id = e.id
WHERE e.organizer_id = (SELECT id FROM users WHERE email = 'organizer@test.com');

-- 2. Check booking dates vs current date
SELECT 'DATE COMPARISON' as step;
SELECT 
    CURRENT_DATE as today,
    CURRENT_DATE - INTERVAL '30 days' as thirty_days_ago,
    MIN(b.booking_date::date) as earliest_booking,
    MAX(b.booking_date::date) as latest_booking
FROM bookings b
JOIN events e ON b.event_id = e.id
WHERE e.organizer_id = (SELECT id FROM users WHERE email = 'organizer@test.com');

-- 3. Check the exact filter that's failing
SELECT 'FILTERED BOOKINGS CHECK' as step;
SELECT COUNT(*) as bookings_in_30_days
FROM bookings b
JOIN events e ON b.event_id = e.id
WHERE e.organizer_id = (SELECT id FROM users WHERE email = 'organizer@test.com')
AND b.booking_date >= CURRENT_DATE - INTERVAL '30 days'
AND b.booking_status = 'confirmed';

-- 4. Check events date filter
SELECT 'EVENTS DATE CHECK' as step;
SELECT COUNT(*) as events_in_30_days
FROM events e 
WHERE e.organizer_id = (SELECT id FROM users WHERE email = 'organizer@test.com')
AND e.created_at >= CURRENT_DATE - INTERVAL '30 days';

-- 5. Raw totals without date filter
SELECT 'RAW TOTALS (NO DATE FILTER)' as step;
SELECT 
    COUNT(DISTINCT e.id) as total_events,
    COUNT(DISTINCT b.id) as total_bookings,
    COALESCE(SUM(b.total_price), 0) as total_revenue,
    COALESCE(SUM(b.quantity), 0) as total_tickets
FROM events e
LEFT JOIN bookings b ON e.id = b.event_id AND b.booking_status = 'confirmed'
WHERE e.organizer_id = (SELECT id FROM users WHERE email = 'organizer@test.com');
