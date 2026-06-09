-- ============================================================================
-- Database Reset Script — AtomDrops Marketplace OS
-- Truncates ALL 83 tables with CASCADE, resets all sequences, then clears
-- Supabase Storage. Reference data is re-seeded by DataInitializer on next
-- backend restart (roles, admin user, categories, condition levels, platform
-- settings, subscription plans).
--
-- HOW TO USE:
--   1. Open Supabase Dashboard → SQL Editor
--   2. Paste this entire script
--   3. Run (confirm when prompted)
--   4. Clear Storage bucket "atomdrops" via Supabase Dashboard → Storage
--      (delete folders: avatars/, products/, used-items/, repairs/, auctions/)
--   5. Restart the Spring Boot backend
--   6. Login as admin@login.com / 88888888
-- ============================================================================

BEGIN;

-- Step 1: Truncate ALL public tables in one shot with CASCADE.
-- A single TRUNCATE with CASCADE handles FK dependency ordering automatically.
DO $$
DECLARE
    tables text;
BEGIN
    SELECT string_agg(quote_ident(tablename), ', ' ORDER BY tablename)
    INTO tables
    FROM pg_tables
    WHERE schemaname = 'public';

    IF tables IS NOT NULL THEN
        EXECUTE 'TRUNCATE TABLE ' || tables || ' CASCADE;';
    END IF;
END $$;

-- Step 2: Reset all sequences to start from 1.
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT sequence_name
        FROM information_schema.sequences
        WHERE sequence_schema = 'public'
    ) LOOP
        EXECUTE format('ALTER SEQUENCE %I RESTART WITH 1;', r.sequence_name);
    END LOOP;
END $$;

COMMIT;
