-- ==============================================================================
-- TABACO CITY TRD PORTAL - LATEST OFFICIAL CONSOLIDATED DATABASE SCHEMA (2026)
-- Transportation Regulation Division (TRD) - City Government of Tabaco, Albay
-- Compatible with Admin Panel & Mobile Web (Enforcer Citation & Passenger Portal)
-- 
-- Run this complete script directly in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ynyjkwcjjfswcfzwgumv/sql
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. AUTHENTICATION & ACCESS CONTROL (ADMINS & TRAFFIC ENFORCERS)
-- ==============================================================================

-- 1.1 Dedicated Administrator Accounts Table (Admin Portal Sign-In & Multi-admin)
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

-- Seed initial default TRD Administrators
INSERT INTO public.admin_accounts (admin_id, name, email, role, department, password)
VALUES 
    ('ADM-2026-001', 'TRD Chief Administrator', 'admin@franchise.gov.ph', 'Head Administrator', 'Transportation Regulation Division', 'admin'),
    ('ADM-2026-002', 'Maria Santos', 'licensing@tabaco.gov.ph', 'Staff', 'Franchise & Permits Section', 'admin')
ON CONFLICT (admin_id) DO UPDATE 
SET password = EXCLUDED.password,
    name = EXCLUDED.name,
    email = EXCLUDED.email;

-- 1.2 Mobile Web Traffic Enforcers Account Table (Exclusively Issued by Admin)
CREATE TABLE IF NOT EXISTS public.account_enforcer_mobile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE, -- Badge Number (e.g., ENF-2026-001)
    fullname TEXT NOT NULL,                -- Contains: Name [Email] (Patrol Area) {Contact}
    password VARCHAR(255) NOT NULL,        -- Mobile Web login password
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Seed initial default Traffic Enforcers
INSERT INTO public.account_enforcer_mobile (username, fullname, password)
VALUES
    ('ENF-2026-001', 'Officer Jaime Ramos [jaime.ramos@gmail.com] (Poblacion District) {0917-111-2233}', 'TRD-ENF-7731'),
    ('ENF-2026-002', 'Officer Ronald Santos [ronald.santos@gmail.com] (San Carlos & Terminal) {0918-222-3344}', 'TRD-ENF-8842'),
    ('ENF-2026-003', 'Officer Mark Anthony Lopez [mark.lopez@gmail.com] (Public Market & Port Area) {0920-333-4455}', 'TRD-ENF-9915')
ON CONFLICT (username) DO NOTHING;

-- 1.3 Mobile Web Passenger Accounts Table (Citizen Portal)
CREATE TABLE IF NOT EXISTS public.account_passenger_mobile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    fullname VARCHAR(150),
    contact_number VARCHAR(30),
    email VARCHAR(150),
    password VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 2. MASTER FRANCHISE RECORDS (TRICYCLE & PEDICAB)
-- ==============================================================================

-- 2.1 Tricycle Master Records Table
CREATE TABLE IF NOT EXISTS public.franchise_records_tricycle_admin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_no VARCHAR(50) NOT NULL DEFAULT 'APP-2026-001',
    city_plate_number VARCHAR(50) NOT NULL UNIQUE,
    mtop_number VARCHAR(50) NOT NULL,
    vehicle_category VARCHAR(20) DEFAULT 'Tricycle',
    plate_number VARCHAR(30),
    
    -- Owner / Operator Details
    owner_last_name VARCHAR(100),
    owner_first_name VARCHAR(100),
    owner_middle_name VARCHAR(100),
    owner_name VARCHAR(150),
    owner_contact VARCHAR(30),
    owner_address TEXT,
    age VARCHAR(10),
    beneficiary_name VARCHAR(150),
    beneficiary_address TEXT,
    color VARCHAR(50),
    make_model VARCHAR(100),
    engine_number VARCHAR(100),
    chassis_number VARCHAR(100),
    receipt_number VARCHAR(50),
    or_number VARCHAR(50),
    payment_date DATE,
    amount_paid DECIMAL(10,2),
    email VARCHAR(150),
    
    operator_last_name VARCHAR(100),
    operator_first_name VARCHAR(100),
    operator_middle_name VARCHAR(100),
    operator_name VARCHAR(150) NOT NULL,
    operator_contact VARCHAR(30),
    operator_address TEXT NOT NULL,
    residential_address TEXT NOT NULL,

    -- Driver Details
    driver_last_name VARCHAR(100),
    driver_first_name VARCHAR(100),
    driver_middle_name VARCHAR(100),
    driver_name VARCHAR(150) NOT NULL,
    driver_contact VARCHAR(30),
    driver_address TEXT,
    driver_license_no VARCHAR(50),
    license_expiry DATE,

    -- Franchise, Route & Status
    registration_date DATE DEFAULT CURRENT_DATE,
    expiration_date DATE NOT NULL,
    route_parada VARCHAR(100) DEFAULT 'Sua-Igot 24 Tabaco',
    tourist_guide VARCHAR(10) DEFAULT 'Yes',
    availability VARCHAR(50) DEFAULT 'Available / On-Duty',
    status VARCHAR(30) DEFAULT 'Active' CHECK (status IN ('Active', 'Pending Renewal', 'Deactivated', 'Under Review')),
    
    -- Fare Adjustment Matrix & Standard Fare
    fare_matrix JSONB DEFAULT '[]'::jsonb,
    standard_fare VARCHAR(50) DEFAULT '₱20.00 Minimum',

    -- System Tracking & Badges
    violations_count INT DEFAULT 0,
    documents_verified BOOLEAN DEFAULT TRUE,
    has_permanent_qr BOOLEAN DEFAULT FALSE,
    qr_generated_date DATE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ensure all columns exist for existing tables
ALTER TABLE public.franchise_records_tricycle_admin 
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

-- 2.2 Pedicab Master Records Table
CREATE TABLE IF NOT EXISTS public.franchise_records_pedicab_admin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_no VARCHAR(50) NOT NULL DEFAULT 'APP-2026-P01',
    city_plate_number VARCHAR(50) NOT NULL UNIQUE,
    mtop_number VARCHAR(50) NOT NULL,
    vehicle_category VARCHAR(20) DEFAULT 'Pedicab',
    plate_number VARCHAR(30),
    
    -- Owner / Operator Details
    owner_last_name VARCHAR(100),
    owner_first_name VARCHAR(100),
    owner_middle_name VARCHAR(100),
    owner_name VARCHAR(150),
    owner_contact VARCHAR(30),
    owner_address TEXT,
    age VARCHAR(10),
    beneficiary_name VARCHAR(150),
    beneficiary_address TEXT,
    color VARCHAR(50),
    make_model VARCHAR(100),
    engine_number VARCHAR(100),
    chassis_number VARCHAR(100),
    receipt_number VARCHAR(50),
    or_number VARCHAR(50),
    payment_date DATE,
    amount_paid DECIMAL(10,2),
    email VARCHAR(150),
    
    operator_last_name VARCHAR(100),
    operator_first_name VARCHAR(100),
    operator_middle_name VARCHAR(100),
    operator_name VARCHAR(150) NOT NULL,
    operator_contact VARCHAR(30),
    operator_address TEXT NOT NULL,
    residential_address TEXT NOT NULL,

    -- Driver Details
    driver_last_name VARCHAR(100),
    driver_first_name VARCHAR(100),
    driver_middle_name VARCHAR(100),
    driver_name VARCHAR(150) NOT NULL,
    driver_contact VARCHAR(30),
    driver_address TEXT,
    driver_license_no VARCHAR(50),
    license_expiry DATE,

    -- Franchise, Route & Status
    registration_date DATE DEFAULT CURRENT_DATE,
    expiration_date DATE NOT NULL,
    route_parada VARCHAR(100) DEFAULT 'Centro - Public Market',
    tourist_guide VARCHAR(10) DEFAULT 'Yes',
    availability VARCHAR(50) DEFAULT 'Available / On-Duty',
    status VARCHAR(30) DEFAULT 'Active' CHECK (status IN ('Active', 'Pending Renewal', 'Deactivated', 'Under Review')),
    
    -- Fare Adjustment Matrix & Standard Fare
    fare_matrix JSONB DEFAULT '[]'::jsonb,
    standard_fare VARCHAR(50) DEFAULT '₱15.00 Minimum',

    -- System Tracking & Badges
    violations_count INT DEFAULT 0,
    documents_verified BOOLEAN DEFAULT TRUE,
    has_permanent_qr BOOLEAN DEFAULT FALSE,
    qr_generated_date DATE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ensure all columns exist for existing pedicab table
ALTER TABLE public.franchise_records_pedicab_admin 
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

-- ==============================================================================
-- 3. PERMANENT SYSTEM QR CODES (MOBILE SCAN VERIFICATION)
-- ==============================================================================

-- 3.1 Tricycle System QR Codes
CREATE TABLE IF NOT EXISTS public.system_qr_codes_tricycle_admin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    franchise_id VARCHAR(100),
    city_plate_number VARCHAR(50) NOT NULL UNIQUE,
    mtop_number VARCHAR(50) NOT NULL,
    driver_name VARCHAR(150) NOT NULL,
    driver_license_no VARCHAR(50),
    qr_payload TEXT NOT NULL,
    qr_code_image_url TEXT,
    is_locked BOOLEAN DEFAULT TRUE,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3.2 Pedicab System QR Codes
CREATE TABLE IF NOT EXISTS public.system_qr_codes_pedicab_admin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    franchise_id VARCHAR(100),
    city_plate_number VARCHAR(50) NOT NULL UNIQUE,
    mtop_number VARCHAR(50) NOT NULL,
    driver_name VARCHAR(150) NOT NULL,
    driver_license_no VARCHAR(50),
    qr_payload TEXT NOT NULL,
    qr_code_image_url TEXT,
    is_locked BOOLEAN DEFAULT TRUE,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 4. TRAFFIC VIOLATIONS & CITATIONS (ENFORCER & CITIZEN REPORTS)
-- ==============================================================================

-- 4.1 Tricycle Violations Table
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
    status VARCHAR(30) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Settled', 'Under Investigation', 'Dismissed')),
    date_submitted DATE DEFAULT CURRENT_DATE,
    settled_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4.2 Pedicab Violations Table
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
    status VARCHAR(30) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Settled', 'Under Investigation', 'Dismissed')),
    date_submitted DATE DEFAULT CURRENT_DATE,
    settled_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4.3 General Violations Fallback View / Table (Used by Mobile Portal)
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

-- ==============================================================================
-- 5. PASSENGER COMPLAINTS, LIVE CHAT & DISPUTES
-- ==============================================================================

-- 5.1 Passenger Complaints Master Table
CREATE TABLE IF NOT EXISTS public.passenger_complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_number VARCHAR(50) UNIQUE,
    complainant_name VARCHAR(150) NOT NULL,
    contact_number VARCHAR(30),
    email VARCHAR(150),
    city_plate_number VARCHAR(50) NOT NULL,
    mtop_number VARCHAR(50),
    vehicle_category VARCHAR(20) DEFAULT 'Tricycle',
    driver_name VARCHAR(150),
    operator_name VARCHAR(150),
    incident_date DATE NOT NULL,
    incident_time VARCHAR(20),
    incident_location TEXT,
    complaint_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    evidence_url TEXT,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Under Investigation', 'Resolved', 'Dismissed')),
    admin_response TEXT,
    admin_decision TEXT,
    admin_remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5.2 Complaint Messages (Admin & Citizen Real-Time Conversation Log)
CREATE TABLE IF NOT EXISTS public.complaint_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id VARCHAR(100) NOT NULL,
    sender VARCHAR(20) NOT NULL DEFAULT 'admin', -- 'admin', 'complainant', 'citizen'
    sender_name VARCHAR(150) NOT NULL,
    sender_role VARCHAR(50) DEFAULT 'admin',
    message TEXT NOT NULL,
    attachment_url TEXT,
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_complaint_messages_complaint 
    ON public.complaint_messages (complaint_id, created_at ASC);

-- ==============================================================================
-- 6. MOBILE PUSH NOTIFICATIONS (CROSS-PORTAL SYNC)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.mobile_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_type VARCHAR(20) NOT NULL DEFAULT 'all', -- 'passenger', 'enforcer', or 'all'
    recipient_username VARCHAR(150),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    record_type VARCHAR(50), -- 'violation', 'complaint', 'review', 'general'
    record_id VARCHAR(100),
    plate_number VARCHAR(50),
    status VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_mobile_notifications_recipient 
    ON public.mobile_notifications (recipient_username, recipient_type, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mobile_notifications_record 
    ON public.mobile_notifications (record_id, record_type);

-- ==============================================================================
-- 7. PENDING REVIEWS, AUDIT LOGS & NAME CHANGE HISTORY
-- ==============================================================================

-- 7.1 Pending Reviews Queue (For Flagged Units)
CREATE TABLE IF NOT EXISTS public.pending_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_plate_number VARCHAR(50) NOT NULL,
    mtop_number VARCHAR(50) NOT NULL,
    driver_name VARCHAR(150) NOT NULL,
    operator_name VARCHAR(150) NOT NULL,
    vehicle_category VARCHAR(20) DEFAULT 'Tricycle',
    submitted_date DATE DEFAULT CURRENT_DATE,
    reason TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'Pending Review',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7.2 Permanent Deletion Security Audit Logs Table
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

-- 7.3 Driver / Operator Name Change Audit Trail Table
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

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) & PUBLIC ACCESS PERMISSIONS
-- ==============================================================================
-- Disable RLS on all operational tables to allow instant synchronization between
-- the Admin Panel and the Vercel Mobile Web without blocking anonymous requests.

ALTER TABLE IF EXISTS public.admin_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.account_enforcer_mobile DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.account_passenger_mobile DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.franchise_records_tricycle_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.franchise_records_pedicab_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_qr_codes_tricycle_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_qr_codes_pedicab_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.violations_tricycle_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.violations_pedicab_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.violations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.passenger_complaints DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.complaint_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mobile_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pending_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.deletion_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.name_change_history DISABLE ROW LEVEL SECURITY;

-- Grant broad schema permissions to standard Supabase roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- ==============================================================================
-- 9. REAL-TIME REPLICATION SUBSCRIPTIONS
-- ==============================================================================
-- Enables instant live WebSocket updates across Admin and Mobile Web

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE 
        public.franchise_records_tricycle_admin,
        public.franchise_records_pedicab_admin,
        public.system_qr_codes_tricycle_admin,
        public.system_qr_codes_pedicab_admin,
        public.violations_tricycle_admin,
        public.violations_pedicab_admin,
        public.passenger_complaints,
        public.complaint_messages,
        public.mobile_notifications,
        public.account_enforcer_mobile,
        public.pending_reviews;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- ==============================================================================
-- 10. INITIAL SEED DATA FOR TESTING & IMMEDIATE OPERATION
-- ==============================================================================

-- 10.1 Seed Tricycle Master Record
INSERT INTO public.franchise_records_tricycle_admin (
    id, application_no, city_plate_number, mtop_number, vehicle_category, plate_number,
    owner_name, operator_name, operator_contact, operator_address, residential_address,
    driver_name, driver_license_no, license_expiry,
    registration_date, expiration_date, route_parada, tourist_guide, availability,
    status, standard_fare, violations_count, has_permanent_qr
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'APP-2026-102', 'T-102', 'T-102', 'Tricycle', '1234-TR',
    'Andrie B. Barosana', 'Andrie B. Barosana', '0917-882-1920', 'Zone 4, Poblacion, Tabaco City', 'Zone 4, Poblacion, Tabaco City',
    'Salvador B. Bacelonia', 'N02-18-994820', '2027-11-20',
    '2023-01-15', '2026-12-31', 'Sua-Igot 24 Tabaco', 'Yes', 'Available / On-Duty',
    'Active', '₱20.00 Minimum', 0, true
) ON CONFLICT (city_plate_number) DO NOTHING;

-- 10.2 Seed Pedicab Master Record
INSERT INTO public.franchise_records_pedicab_admin (
    id, application_no, city_plate_number, mtop_number, vehicle_category, plate_number,
    owner_name, operator_name, operator_contact, operator_address, residential_address,
    driver_name, driver_license_no, license_expiry,
    registration_date, expiration_date, route_parada, tourist_guide, availability,
    status, standard_fare, violations_count, has_permanent_qr
) VALUES (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'APP-2026-201', 'P-101', 'P-101', 'Pedicab', 'PED-001',
    'Eric C. Bobis', 'Eric C. Bobis', '0929-334-1122', 'Market Site, Barangay 2, Tabaco City', 'Market Site, Barangay 2, Tabaco City',
    'Eric C. Bobis', 'PED-BRGY-0012', '2028-04-15',
    '2024-01-10', '2026-12-31', 'Centro - Public Market', 'Yes', 'Available / On-Duty',
    'Active', '₱15.00 Minimum', 0, true
) ON CONFLICT (city_plate_number) DO NOTHING;
