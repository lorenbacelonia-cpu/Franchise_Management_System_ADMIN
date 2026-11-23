-- ==============================================================================
-- TABACO CITY TRD - FIX ENFORCER DATABASE ACCESS & SEED ACCOUNTS
-- Execute this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ynyjkwcjjfswcfzwgumv/sql
-- ==============================================================================

-- 1. Ensure table structure has all required columns
CREATE TABLE IF NOT EXISTS public.account_enforcer_mobile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    fullname TEXT NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE IF EXISTS public.account_enforcer_mobile 
    ADD COLUMN IF NOT EXISTS email VARCHAR(150);

ALTER TABLE IF EXISTS public.account_enforcer_mobile 
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 2. DISABLE Row Level Security (RLS) so Mobile & Admin apps can read and write enforcer accounts
ALTER TABLE IF EXISTS public.account_enforcer_mobile DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.account_passenger_mobile DISABLE ROW LEVEL SECURITY;

-- 3. Grant full permissions to anon, authenticated, and service_role
GRANT ALL ON TABLE public.account_enforcer_mobile TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.account_passenger_mobile TO anon, authenticated, service_role;

-- 4. Seed and upsert all official Traffic Enforcer Accounts
INSERT INTO public.account_enforcer_mobile (username, fullname, email, password)
VALUES
    ('ENF-2026-001', 'Officer Jaime Ramos [jaime.ramos@gmail.com] (Poblacion District) {0917-111-2233}', 'jaime.ramos@gmail.com', 'enforcer123'),
    ('ENF-2026-002', 'Officer Ronald Santos [ronald.santos@gmail.com] (San Carlos & Terminal) {0918-222-3344}', 'ronald.santos@gmail.com', 'enforcer123'),
    ('ENF-2026-003', 'Officer Mark Anthony Lopez [mark.lopez@gmail.com] (Public Market & Port Area) {0920-333-4455}', 'mark.lopez@gmail.com', 'enforcer123'),
    ('ENF-2026-101', 'Officer Roberto Gomez [roberto.gomez@tabaco.gov.ph] (Poblacion / Centro District) {09171234567}', 'roberto.gomez@tabaco.gov.ph', 'enforcer123'),
    ('ENF-2026-102', 'Officer Manuel Reyes [manuel.reyes@tabaco.gov.ph] (Tabaco Port & Ferry Terminal) {09289876543}', 'manuel.reyes@tabaco.gov.ph', 'enforcer123'),
    ('enforcer', 'Officer Juan Dela Cruz [enforcer@trd.tabacocity.gov.ph] (HQ Special Operations)', 'enforcer@trd.tabacocity.gov.ph', 'enforcer123'),
    ('andrie', 'Andrie Barasona [andrie@trd.tabacocity.gov.ph] (Mobile Patrol Division)', 'andrie@trd.tabacocity.gov.ph', 'andrie123'),
    ('admin', 'TRD Admin Officer [admin@trd.tabacocity.gov.ph] (Enforcement Operations Bureau)', 'admin@trd.tabacocity.gov.ph', 'admin123')
ON CONFLICT (username) DO UPDATE 
SET fullname = EXCLUDED.fullname,
    email = EXCLUDED.email,
    password = EXCLUDED.password;

-- 5. Verification query to confirm all records are active
SELECT id, username, email, fullname, password, created_at FROM public.account_enforcer_mobile;
