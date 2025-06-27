-- ================================================================
-- SIMPLE EVENT TRANSFER - NO OVERCOMPLICATIONS!
-- ================================================================

-- Just transfer ALL events from admin to organizer
UPDATE events 
SET organizer_id = 'e9097f76-ca6e-433e-8675-5bfe0e67a26a'  -- organizer@test.com
WHERE organizer_id = '37a806e9-55c0-4b08-a378-151a642258fa';  -- admin

-- Fix tickets
UPDATE events 
SET available_tickets = total_tickets
WHERE organizer_id = 'e9097f76-ca6e-433e-8675-5bfe0e67a26a'
AND available_tickets = 0;

-- Verify
SELECT 
    title,
    organizer_id::text,
    total_tickets,
    available_tickets
FROM events 
WHERE organizer_id = 'e9097f76-ca6e-433e-8675-5bfe0e67a26a'
ORDER BY title;

-- Test function
SELECT * FROM get_organizer_stats(
    'e9097f76-ca6e-433e-8675-5bfe0e67a26a'::uuid,
    365
);
