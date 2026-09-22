-- ============================================================================
-- TABACO CITY TRD PORTAL - DISABLE ALL ROW LEVEL SECURITY (RLS) & GRANT PERMISSIONS
-- 
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/ynyjkwcjjfswcfzwgumv/sql
-- 2. Click "New Query" (SQL Editor)
-- 3. Paste this entire script and click "Run" (or press Ctrl + Enter / Cmd + Enter)
-- ============================================================================

-- 1. Disable Row Level Security (RLS) on ALL mobile and admin tables
ALTER TABLE IF EXISTS public.account_enforcer_mobile DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.account_passenger_mobile DISABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.franchise_records_tricycle_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.franchise_records_pedicab_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.franchise_records DISABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.system_qr_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_qr_codes_tricycle_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_qr_codes_pedicab_admin DISABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.passenger_complaints DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pending_reviews DISABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.franchise_renewals_tricycle_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.franchise_renewals_pedicab_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.franchise_renewals DISABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.violations_tricycle_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.violations_pedicab_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.violations DISABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.franchise_registrations DISABLE ROW LEVEL SECURITY;

-- 2. Drop all restrictive policies if any exist
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- 3. Grant full SELECT, INSERT, UPDATE, DELETE permissions to all roles (anon, authenticated, service_role)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 4. Ensure future tables created also have default permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
