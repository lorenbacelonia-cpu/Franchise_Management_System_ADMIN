-- ============================================================================
-- TABACO CITY TRD - RENAME MTOP_NUMBER TO CITY_PLATE_NUMBER
-- Copy and run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ynyjkwcjjfswcfzwgumv/sql
-- ============================================================================

-- 1. Rename column mtop_number to city_plate_number in all tables
ALTER TABLE IF EXISTS public.franchise_records_tricycle_admin 
  RENAME COLUMN mtop_number TO city_plate_number;

ALTER TABLE IF EXISTS public.franchise_records_pedicab_admin 
  RENAME COLUMN mtop_number TO city_plate_number;

ALTER TABLE IF EXISTS public.system_qr_codes_tricycle_admin 
  RENAME COLUMN mtop_number TO city_plate_number;

ALTER TABLE IF EXISTS public.system_qr_codes_pedicab_admin 
  RENAME COLUMN mtop_number TO city_plate_number;

ALTER TABLE IF EXISTS public.franchise_renewals_tricycle_admin 
  RENAME COLUMN mtop_number TO city_plate_number;

ALTER TABLE IF EXISTS public.franchise_renewals_pedicab_admin 
  RENAME COLUMN mtop_number TO city_plate_number;

ALTER TABLE IF EXISTS public.violations_tricycle_admin 
  RENAME COLUMN mtop_number TO city_plate_number;

ALTER TABLE IF EXISTS public.violations_pedicab_admin 
  RENAME COLUMN mtop_number TO city_plate_number;

-- 2. Ensure RLS is disabled so the web app can read and save data
ALTER TABLE IF EXISTS public.franchise_records_tricycle_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.franchise_records_pedicab_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_qr_codes_tricycle_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_qr_codes_pedicab_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.franchise_renewals_tricycle_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.franchise_renewals_pedicab_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.violations_tricycle_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.violations_pedicab_admin DISABLE ROW LEVEL SECURITY;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
