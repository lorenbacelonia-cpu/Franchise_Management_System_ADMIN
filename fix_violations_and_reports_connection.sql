-- ==============================================================================
-- TABACO CITY TRD PORTAL - FIX ENFORCER VIOLATIONS & PASSENGER REPORTS CONNECTION
-- 
-- Instructions:
-- 1. Open your Supabase Dashboard SQL Editor:
--    https://supabase.com/dashboard/project/ynyjkwcjjfswcfzwgumv/sql
-- 2. Click "New query", paste this entire script, and click "Run" (or Ctrl + Enter)
-- 3. All citations & reports will connect instantly between Enforcer & Admin!
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Ensure all violation and complaint tables exist with full column schemas

-- 2.1 Tricycle Admin Violations Table
CREATE TABLE IF NOT EXISTS public.violations_tricycle_admin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_plate_number VARCHAR(50) NOT NULL,
    mtop_number VARCHAR(50) NOT NULL,
    plate_number VARCHAR(50),
    vehicle_category VARCHAR(20) DEFAULT 'Tricycle',
    operator_name VARCHAR(150),
    driver_name VARCHAR(150),
    officer_name VARCHAR(150),
    violation_type VARCHAR(150) NOT NULL,
    location VARCHAR(200) NOT NULL,
    fine_amount DECIMAL(10,2) NOT NULL DEFAULT 500.00,
    enforcer_name VARCHAR(150) NOT NULL,
    reported_by VARCHAR(150),
    remarks TEXT,
    status VARCHAR(30) DEFAULT 'Pending',
    date_submitted DATE DEFAULT CURRENT_DATE,
    settled_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.violations_tricycle_admin
    ADD COLUMN IF NOT EXISTS city_plate_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS mtop_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS plate_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS vehicle_category VARCHAR(20) DEFAULT 'Tricycle',
    ADD COLUMN IF NOT EXISTS operator_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS driver_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS officer_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS violation_type VARCHAR(150),
    ADD COLUMN IF NOT EXISTS location VARCHAR(200),
    ADD COLUMN IF NOT EXISTS fine_amount DECIMAL(10,2) DEFAULT 500.00,
    ADD COLUMN IF NOT EXISTS enforcer_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS reported_by VARCHAR(150),
    ADD COLUMN IF NOT EXISTS remarks TEXT,
    ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'Pending',
    ADD COLUMN IF NOT EXISTS date_submitted DATE DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS settled_date DATE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 2.2 Pedicab Admin Violations Table
CREATE TABLE IF NOT EXISTS public.violations_pedicab_admin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_plate_number VARCHAR(50) NOT NULL,
    mtop_number VARCHAR(50) NOT NULL,
    plate_number VARCHAR(50),
    vehicle_category VARCHAR(20) DEFAULT 'Pedicab',
    operator_name VARCHAR(150),
    driver_name VARCHAR(150),
    officer_name VARCHAR(150),
    violation_type VARCHAR(150) NOT NULL,
    location VARCHAR(200) NOT NULL,
    fine_amount DECIMAL(10,2) NOT NULL DEFAULT 300.00,
    enforcer_name VARCHAR(150) NOT NULL,
    reported_by VARCHAR(150),
    remarks TEXT,
    status VARCHAR(30) DEFAULT 'Pending',
    date_submitted DATE DEFAULT CURRENT_DATE,
    settled_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.violations_pedicab_admin
    ADD COLUMN IF NOT EXISTS city_plate_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS mtop_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS plate_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS vehicle_category VARCHAR(20) DEFAULT 'Pedicab',
    ADD COLUMN IF NOT EXISTS operator_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS driver_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS officer_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS violation_type VARCHAR(150),
    ADD COLUMN IF NOT EXISTS location VARCHAR(200),
    ADD COLUMN IF NOT EXISTS fine_amount DECIMAL(10,2) DEFAULT 300.00,
    ADD COLUMN IF NOT EXISTS enforcer_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS reported_by VARCHAR(150),
    ADD COLUMN IF NOT EXISTS remarks TEXT,
    ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'Pending',
    ADD COLUMN IF NOT EXISTS date_submitted DATE DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS settled_date DATE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 2.3 Unified Violations Table
CREATE TABLE IF NOT EXISTS public.violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_plate_number VARCHAR(50) NOT NULL,
    mtop_number VARCHAR(50) NOT NULL,
    plate_number VARCHAR(50),
    vehicle_category VARCHAR(20) DEFAULT 'Tricycle',
    operator_name VARCHAR(150),
    driver_name VARCHAR(150),
    violation_type VARCHAR(150) NOT NULL,
    location VARCHAR(200) NOT NULL,
    fine_amount DECIMAL(10,2) NOT NULL DEFAULT 500.00,
    enforcer_name VARCHAR(150) NOT NULL,
    reported_by VARCHAR(150),
    remarks TEXT,
    status VARCHAR(30) DEFAULT 'Pending',
    date_submitted DATE DEFAULT CURRENT_DATE,
    settled_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.violations
    ADD COLUMN IF NOT EXISTS city_plate_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS mtop_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS plate_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS vehicle_category VARCHAR(20) DEFAULT 'Tricycle',
    ADD COLUMN IF NOT EXISTS operator_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS driver_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS violation_type VARCHAR(150),
    ADD COLUMN IF NOT EXISTS location VARCHAR(200),
    ADD COLUMN IF NOT EXISTS fine_amount DECIMAL(10,2) DEFAULT 500.00,
    ADD COLUMN IF NOT EXISTS enforcer_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS reported_by VARCHAR(150),
    ADD COLUMN IF NOT EXISTS remarks TEXT,
    ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'Pending',
    ADD COLUMN IF NOT EXISTS date_submitted DATE DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS settled_date DATE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 2.4 Dedicated Enforcer Violations Table
CREATE TABLE IF NOT EXISTS public.enforcer_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    citation_no VARCHAR(100),
    enforcer_name VARCHAR(150),
    enforcer_badge VARCHAR(100),
    city_plate_number VARCHAR(50),
    mtop_number VARCHAR(50),
    vehicle_category VARCHAR(50) DEFAULT 'Tricycle',
    driver_name VARCHAR(150),
    violation_type VARCHAR(200),
    remarks TEXT,
    description TEXT,
    incident_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'Pending TRD Review',
    evidence_image TEXT,
    evidence_filename VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.enforcer_violations
    ADD COLUMN IF NOT EXISTS citation_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS enforcer_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS enforcer_badge VARCHAR(100),
    ADD COLUMN IF NOT EXISTS city_plate_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS mtop_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS vehicle_category VARCHAR(50) DEFAULT 'Tricycle',
    ADD COLUMN IF NOT EXISTS driver_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS violation_type VARCHAR(200),
    ADD COLUMN IF NOT EXISTS remarks TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS incident_date DATE DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pending TRD Review',
    ADD COLUMN IF NOT EXISTS evidence_image TEXT,
    ADD COLUMN IF NOT EXISTS evidence_filename VARCHAR(255);

-- 2.5 Passenger Complaints Table
CREATE TABLE IF NOT EXISTS public.passenger_complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_number VARCHAR(50),
    complainant_name VARCHAR(150) NOT NULL,
    contact_number VARCHAR(30),
    email VARCHAR(150),
    city_plate_number VARCHAR(50) NOT NULL,
    mtop_number VARCHAR(50),
    vehicle_category VARCHAR(20) DEFAULT 'Tricycle',
    driver_name VARCHAR(150),
    operator_name VARCHAR(150),
    incident_date DATE DEFAULT CURRENT_DATE,
    incident_time VARCHAR(20),
    incident_location TEXT,
    issue_type VARCHAR(150),
    complaint_type VARCHAR(100),
    description TEXT NOT NULL,
    evidence_image TEXT,
    evidence_filename VARCHAR(255),
    evidence_url TEXT,
    status VARCHAR(50) DEFAULT 'Under Investigation',
    admin_response TEXT,
    admin_decision TEXT,
    admin_remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.passenger_complaints
    ADD COLUMN IF NOT EXISTS issue_type VARCHAR(150),
    ADD COLUMN IF NOT EXISTS evidence_image TEXT,
    ADD COLUMN IF NOT EXISTS evidence_filename VARCHAR(255),
    ADD COLUMN IF NOT EXISTS admin_response TEXT,
    ADD COLUMN IF NOT EXISTS admin_decision TEXT,
    ADD COLUMN IF NOT EXISTS admin_remarks TEXT;

-- 2.6 Mobile Push Notifications Table
CREATE TABLE IF NOT EXISTS public.mobile_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_type VARCHAR(50) NOT NULL,
    recipient_username VARCHAR(100) DEFAULT 'all',
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    record_type VARCHAR(50) DEFAULT 'general',
    record_id VARCHAR(100),
    plate_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Pending',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2.7 Complaint Real-Time Messages Table
CREATE TABLE IF NOT EXISTS public.complaint_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id VARCHAR(100) NOT NULL,
    sender VARCHAR(20) NOT NULL DEFAULT 'admin',
    sender_name VARCHAR(150) NOT NULL,
    sender_role VARCHAR(50) DEFAULT 'admin',
    message TEXT NOT NULL,
    attachment_url TEXT,
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. DISABLE ROW LEVEL SECURITY (RLS) ON ALL OPERATIONAL TABLES
ALTER TABLE IF EXISTS public.violations_tricycle_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.violations_pedicab_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.violations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.enforcer_violations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.passenger_complaints DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.complaint_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mobile_notifications DISABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.franchise_records_tricycle_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.franchise_records_pedicab_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.franchise_records DISABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.system_qr_codes_tricycle_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_qr_codes_pedicab_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_qr_codes DISABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.franchise_renewals_tricycle_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.franchise_renewals_pedicab_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.franchise_renewals DISABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.admin_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.account_enforcer_mobile DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.account_passenger_mobile DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pending_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.deletion_logs DISABLE ROW LEVEL SECURITY;

-- 4. DROP ALL RESTRICTIVE POLICIES
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

-- 5. GRANT UNRESTRICTED PERMISSIONS TO anon, authenticated, AND service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
