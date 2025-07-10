-- Quick fix to reactivate the deactivated address relationship

-- Reactivate the specific relationship for user 37a806e9-55c0-4b08-a378-151a642258fa
UPDATE address_relationships
SET is_active = true
WHERE entity_type = 'user'
    AND entity_id = '37a806e9-55c0-4b08-a378-151a642258fa'
    AND relationship_type = 'primary'
    AND is_active = false;

-- General fix: reactivate any primary relationships that got deactivated but not reactivated
UPDATE address_relationships
SET is_active = true
WHERE relationship_type = 'primary'
    AND is_active = false
    AND created_at > '2025-07-10 07:00:00';
-- Only recent ones that might have been affected

-- Verify the fix
SELECT
    ar.entity_type,
    ar.entity_id,
    ar.relationship_type,
    ar.is_active,
    ar.created_at,
    a.address_line_1,
    a.locality
FROM address_relationships ar
    JOIN addresses a ON a.id = ar.address_id
WHERE ar.entity_type = 'user'
    AND ar.entity_id = '37a806e9-55c0-4b08-a378-151a642258fa';
