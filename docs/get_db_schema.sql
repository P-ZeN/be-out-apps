-- OPERATION: Retrieve complete database schema for Be-Out application
-- TABLE(S): All tables, views, functions, triggers, indexes
-- SAFETY: Read-only operation - no data modification

-- ============================================================================
-- PART 1: Get all tables with their columns and constraints
-- ============================================================================

SELECT
    'TABLE_INFO' as info_type,
    t.table_name,
    c.column_name,
    c.data_type,
    c.character_maximum_length,
    c.is_nullable,
    c.column_default,
    c.ordinal_position
FROM information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;

-- ============================================================================
-- PART 2: Get all constraints (Primary Keys, Foreign Keys, Unique, etc.)
-- ============================================================================

SELECT
    'CONSTRAINT_INFO' as info_type,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name as referenced_table,
    ccu.column_name as referenced_column
FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    LEFT JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type;

-- ============================================================================
-- PART 3: Get all indexes
-- ============================================================================

SELECT
    'INDEX_INFO' as info_type,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- PART 4: Get table row counts (current data volume)
-- ============================================================================

SELECT
    'ROW_COUNT_INFO' as info_type,
    schemaname,
    relname as tablename,
    n_tup_ins as total_inserts,
    n_tup_upd as total_updates,
    n_tup_del as total_deletes,
    n_live_tup as current_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY relname;
