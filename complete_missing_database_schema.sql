-- ==============================================================================
-- TABACO CITY TRD PORTAL - COMPLETE DATABASE SCHEMA SYNC & FIX
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ynyjkwcjjfswcfzwgumv/sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. CREATE MISSING TABLES
-- ------------------------------------------------------------------------------

-- 1.1 Dedicated Admin Accounts Table (for cross-device admin sign-in & registration)
CREATE TABLE IF NOT EXISTS public.admin_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    role VARCHAR(50) DEFAULT 'Staff',
    department VARCHAR(100) DEFAULT 'Transportation Regulation Division',
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Seed default initial admin accounts if not already present
INSERT INTO public.admin_accounts (admin_id, name, email, role, department, password)
VALUES 
  ('ADM-2026-001', 'TRD Chief Administrator', 'admin@franchise.gov.ph', 'Head Administrator', 'Transportation Regulation Division', 'admin'),
  ('ADM-2026-002', 'Maria Santos', 'licensing@tabaco.gov.ph', 'Staff', 'Franchise & Permits Section', 'admin')
ON CONFLICT (admin_id) DO NOTHING;

-- 1.2 Permanent Deletion Security Audit Logs Table
CREATE TABLE IF NOT EXISTS public.deletion_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id VARCHAR(100) NOT NULL,
    record_type VARCHAR(50) NOT NULL, -- 'Franchise Record', 'Violation', 'Complaint'
    item_name VARCHAR(150),
    mtop_number VARCHAR(50),
    reason TEXT,
    deleted_by VARCHAR(150) NOT NULL DEFAULT 'Admin',
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 1.3 Driver / Operator Name Change History Table
CREATE TABLE IF NOT EXISTS public.name_change_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    franchise_id VARCHAR(100) NOT NULL,
    mtop_number VARCHAR(50) NOT NULL,
    previous_operator_name VARCHAR(150),
    new_operator_name VARCHAR(150),
    previous_driver_name VARCHAR(150),
    new_driver_name VARCHAR(150),
    changed_by VARCHAR(100) DEFAULT 'TRD Admin',
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 2. ADD MISSING COLUMNS TO FRANCHISE MASTER RECORDS (TRICYCLE & PEDICAB)
-- ------------------------------------------------------------------------------

-- Tricycle Records
ALTER TABLE IF EXISTS public.franchise_records_tricycle_admin 
    ADD COLUMN IF NOT EXISTS owner_last_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS owner_first_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS owner_middle_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS owner_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS owner_contact VARCHAR(30),
    ADD COLUMN IF NOT EXISTS owner_address TEXT,
    ADD COLUMN IF NOT EXISTS age VARCHAR(10),
    ADD COLUMN IF NOT EXISTS beneficiary_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS beneficiary_address TEXT,
    ADD COLUMN IF NOT EXISTS color VARCHAR(50),
    ADD COLUMN IF NOT EXISTS make_model VARCHAR(100),
    ADD COLUMN IF NOT EXISTS engine_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS chassis_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS or_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS payment_date DATE,
    ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS email VARCHAR(150),
    ADD COLUMN IF NOT EXISTS driver_contact VARCHAR(30);

-- Pedicab Records
ALTER TABLE IF EXISTS public.franchise_records_pedicab_admin 
    ADD COLUMN IF NOT EXISTS owner_last_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS owner_first_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS owner_middle_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS owner_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS owner_contact VARCHAR(30),
    ADD COLUMN IF NOT EXISTS owner_address TEXT,
    ADD COLUMN IF NOT EXISTS age VARCHAR(10),
    ADD COLUMN IF NOT EXISTS beneficiary_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS beneficiary_address TEXT,
    ADD COLUMN IF NOT EXISTS color VARCHAR(50),
    ADD COLUMN IF NOT EXISTS make_model VARCHAR(100),
    ADD COLUMN IF NOT EXISTS engine_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS chassis_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS or_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS payment_date DATE,
    ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2),
    ADD COLUMN IF NOT EXISTS email VARCHAR(150),
    ADD COLUMN IF NOT EXISTS driver_contact VARCHAR(30);

-- ------------------------------------------------------------------------------
-- 3. ADD MISSING COLUMNS TO PASSENGER COMPLAINTS & MESSAGES
-- ------------------------------------------------------------------------------

ALTER TABLE IF EXISTS public.passenger_complaints 
    ADD COLUMN IF NOT EXISTS contact_number VARCHAR(30),
    ADD COLUMN IF NOT EXISTS incident_time VARCHAR(20),
    ADD COLUMN IF NOT EXISTS incident_location TEXT,
    ADD COLUMN IF NOT EXISTS driver_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS operator_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS admin_remarks TEXT;

ALTER TABLE IF EXISTS public.complaint_messages 
    ADD COLUMN IF NOT EXISTS sender_role VARCHAR(50) DEFAULT 'admin',
    ADD COLUMN IF NOT EXISTS attachment_url TEXT,
    ADD COLUMN IF NOT EXISTS is_internal BOOLEAN DEFAULT FALSE;

-- ------------------------------------------------------------------------------
-- 4. ADD MISSING COLUMNS TO VIOLATIONS TABLES
-- ------------------------------------------------------------------------------

ALTER TABLE IF EXISTS public.violations_tricycle_admin 
    ADD COLUMN IF NOT EXISTS vehicle_category VARCHAR(20) DEFAULT 'Tricycle',
    ADD COLUMN IF NOT EXISTS officer_name VARCHAR(150);

ALTER TABLE IF EXISTS public.violations_pedicab_admin 
    ADD COLUMN IF NOT EXISTS vehicle_category VARCHAR(20) DEFAULT 'Pedicab',
    ADD COLUMN IF NOT EXISTS officer_name VARCHAR(150);

-- ------------------------------------------------------------------------------
-- 5. DISABLE RLS & GRANT ACCESS TO ALL OPERATIONAL TABLES
-- ------------------------------------------------------------------------------

ALTER TABLE IF EXISTS public.admin_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.deletion_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.name_change_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mobile_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.complaint_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.passenger_complaints DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.violations_tricycle_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.violations_pedicab_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pending_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.franchise_records_tricycle_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.franchise_records_pedicab_admin DISABLE ROW LEVEL SECURITY;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
