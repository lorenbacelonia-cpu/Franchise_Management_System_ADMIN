-- ============================================================================
-- TABACO CITY TRD PORTAL - DASHBOARD SUPABASE DATABASE SCHEMA
-- Exactly based on the Registration Form & Dashboard UI:
-- 
-- Left Column:
--  - Operator: Last Name, First Name, Middlename
--  - Residential Address
--  - Expiration Date
--  - Driver Availability (Available / On-Duty, Off-Duty, On Leave)
--  - Driver: Last Name, First Name, Middlename
--  - Address (Driver Address)
--
-- Right Column:
--  - Application No.
--  - Vehicle Type (Tricycle / Pedicab)
--  - Tourist Guide (Yes / No)
--  - Status (Active, Under Review, Pending Renewal, Deactivated)
--  - Parada/Route
--  - City Plate No.
--  - Fare Adjustment Matrix (Route/Distance, Regular Fare, Student Fare, Senior 20% Fare)
-- ============================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop old tables cleanly to ensure exact schema structure
DROP TABLE IF EXISTS public.system_qr_codes_tricycle_admin CASCADE;
DROP TABLE IF EXISTS public.franchise_renewals_tricycle_admin CASCADE;
DROP TABLE IF EXISTS public.violations_tricycle_admin CASCADE;
DROP TABLE IF EXISTS public.franchise_records_tricycle_admin CASCADE;

DROP TABLE IF EXISTS public.system_qr_codes_pedicab_admin CASCADE;
DROP TABLE IF EXISTS public.franchise_renewals_pedicab_admin CASCADE;
DROP TABLE IF EXISTS public.violations_pedicab_admin CASCADE;
DROP TABLE IF EXISTS public.franchise_records_pedicab_admin CASCADE;

DROP TABLE IF EXISTS public.pending_reviews CASCADE;

-- ============================================================================
-- 1. TRICYCLE TABLES
-- ============================================================================

-- 1.1 TRICYCLE MASTER RECORDS (Registration Form & Overview)
CREATE TABLE public.franchise_records_tricycle_admin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_no VARCHAR(50) NOT NULL DEFAULT 'APP-2026-210',
    city_plate_number VARCHAR(50) NOT NULL UNIQUE,
    mtop_number VARCHAR(50) NOT NULL,
    vehicle_category VARCHAR(20) DEFAULT 'Tricycle',
    plate_number VARCHAR(30),
    
    -- Operator details (from Form)
    operator_last_name VARCHAR(100),
    operator_first_name VARCHAR(100),
    operator_middle_name VARCHAR(100),
    operator_name VARCHAR(150) NOT NULL,
    operator_contact VARCHAR(30) DEFAULT '0917-882-1920',
    operator_address TEXT NOT NULL,
    residential_address TEXT NOT NULL,

    -- Driver details (from Form)
    driver_last_name VARCHAR(100),
    driver_first_name VARCHAR(100),
    driver_middle_name VARCHAR(100),
    driver_name VARCHAR(150) NOT NULL,
    driver_address TEXT,
    driver_license_no VARCHAR(50) DEFAULT 'N02-18-994820',
    license_expiry DATE DEFAULT '2028-11-20',

    -- Franchise, Route & Status (from Form)
    registration_date DATE DEFAULT CURRENT_DATE,
    expiration_date DATE NOT NULL DEFAULT '2027-01-15',
    route_parada VARCHAR(100) DEFAULT 'Sua-Igot 24 Tabaco',
    tourist_guide VARCHAR(10) DEFAULT 'Yes',
    availability VARCHAR(50) DEFAULT 'Available / On-Duty',
    status VARCHAR(30) DEFAULT 'Active' CHECK (status IN ('Active', 'Pending Renewal', 'Deactivated', 'Under Review')),
    
    -- Fare Adjustment Matrix (from Form)
    fare_matrix JSONB DEFAULT '[]'::jsonb,
    standard_fare VARCHAR(50) DEFAULT '₱50.00 Minimum',

    -- System tracking & Badges
    violations_count INT DEFAULT 0,
    documents_verified BOOLEAN DEFAULT TRUE,
    has_permanent_qr BOOLEAN DEFAULT FALSE,
    qr_generated_date DATE NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 TRICYCLE SYSTEM QR CODES (Permanent Locked Driver Badges)
CREATE TABLE public.system_qr_codes_tricycle_admin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    franchise_id UUID REFERENCES public.franchise_records_tricycle_admin(id) ON DELETE CASCADE,
    city_plate_number VARCHAR(50) NOT NULL,
    mtop_number VARCHAR(50) NOT NULL,
    driver_name VARCHAR(150) NOT NULL,
    driver_license_no VARCHAR(50) NOT NULL,
    qr_payload TEXT NOT NULL UNIQUE,
    qr_code_image_url TEXT,
    is_permanent BOOLEAN DEFAULT TRUE,
    is_locked BOOLEAN DEFAULT TRUE,
    issued_by_admin VARCHAR(100) DEFAULT 'Admin Portal',
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    last_scanned_at TIMESTAMPTZ NULL
);

-- 1.3 TRICYCLE FRANCHISE RENEWALS
CREATE TABLE public.franchise_renewals_tricycle_admin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_plate_number VARCHAR(50) NOT NULL,
    mtop_number VARCHAR(50) NOT NULL,
    operator_name VARCHAR(150) NOT NULL,
    driver_name VARCHAR(150) NOT NULL,
    previous_expiry DATE NOT NULL,
    new_expiry DATE NOT NULL,
    amount_paid NUMERIC(10, 2) DEFAULT 450.00,
    or_number VARCHAR(50) NOT NULL,
    processed_by VARCHAR(100) DEFAULT 'TRD Officer',
    renewal_date TIMESTAMPTZ DEFAULT NOW()
);

-- 1.4 TRICYCLE VIOLATIONS
CREATE TABLE public.violations_tricycle_admin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    franchise_id VARCHAR(50),
    city_plate_number VARCHAR(50) NOT NULL,
    mtop_number VARCHAR(50) NOT NULL,
    plate_number VARCHAR(30),
    operator_name VARCHAR(150),
    driver_name VARCHAR(150) NOT NULL,
    violation_type VARCHAR(150) NOT NULL,
    location VARCHAR(150) NOT NULL,
    fine_amount NUMERIC(10, 2) DEFAULT 500.00,
    enforcer_name VARCHAR(150) NOT NULL,
    reported_by VARCHAR(100) DEFAULT 'andrie30311',
    remarks TEXT,
    status VARCHAR(30) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Settled', 'Under Investigation')),
    date_submitted DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. PEDICAB TABLES
-- ============================================================================

-- 2.1 PEDICAB MASTER RECORDS (Registration Form & Overview)
CREATE TABLE public.franchise_records_pedicab_admin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_no VARCHAR(50) NOT NULL DEFAULT 'APP-2026-301',
    city_plate_number VARCHAR(50) NOT NULL UNIQUE,
    mtop_number VARCHAR(50) NOT NULL,
    vehicle_category VARCHAR(20) DEFAULT 'Pedicab',
    plate_number VARCHAR(30),

    -- Operator details (from Form)
    operator_last_name VARCHAR(100),
    operator_first_name VARCHAR(100),
    operator_middle_name VARCHAR(100),
    operator_name VARCHAR(150) NOT NULL,
    operator_contact VARCHAR(30) DEFAULT '0929-334-1122',
    operator_address TEXT NOT NULL,
    residential_address TEXT NOT NULL,

    -- Driver details (from Form)
    driver_last_name VARCHAR(100),
    driver_first_name VARCHAR(100),
    driver_middle_name VARCHAR(100),
    driver_name VARCHAR(150) NOT NULL,
    driver_address TEXT,
    driver_license_no VARCHAR(50) DEFAULT 'PED-BRGY-0012',
    license_expiry DATE DEFAULT '2028-04-15',

    -- Franchise, Route & Status (from Form)
    registration_date DATE DEFAULT CURRENT_DATE,
    expiration_date DATE NOT NULL DEFAULT '2027-01-15',
    route_parada VARCHAR(100) DEFAULT 'Centro - Public Market',
    tourist_guide VARCHAR(10) DEFAULT 'Yes',
    availability VARCHAR(50) DEFAULT 'Available / On-Duty',
    status VARCHAR(30) DEFAULT 'Active' CHECK (status IN ('Active', 'Pending Renewal', 'Deactivated', 'Under Review')),

    -- Fare Adjustment Matrix (from Form)
    fare_matrix JSONB DEFAULT '[]'::jsonb,
    standard_fare VARCHAR(50) DEFAULT '₱15.00 Minimum',

    -- System tracking & Badges
    violations_count INT DEFAULT 0,
    documents_verified BOOLEAN DEFAULT TRUE,
    has_permanent_qr BOOLEAN DEFAULT FALSE,
    qr_generated_date DATE NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 PEDICAB SYSTEM QR CODES
CREATE TABLE public.system_qr_codes_pedicab_admin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    franchise_id UUID REFERENCES public.franchise_records_pedicab_admin(id) ON DELETE CASCADE,
    city_plate_number VARCHAR(50) NOT NULL,
    mtop_number VARCHAR(50) NOT NULL,
    driver_name VARCHAR(150) NOT NULL,
    driver_license_no VARCHAR(50) NOT NULL,
    qr_payload TEXT NOT NULL UNIQUE,
    qr_code_image_url TEXT,
    is_permanent BOOLEAN DEFAULT TRUE,
    is_locked BOOLEAN DEFAULT TRUE,
    issued_by_admin VARCHAR(100) DEFAULT 'Admin Portal',
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    last_scanned_at TIMESTAMPTZ NULL
);

-- 2.3 PEDICAB FRANCHISE RENEWALS
CREATE TABLE public.franchise_renewals_pedicab_admin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_plate_number VARCHAR(50) NOT NULL,
    mtop_number VARCHAR(50) NOT NULL,
    operator_name VARCHAR(150) NOT NULL,
    driver_name VARCHAR(150) NOT NULL,
    previous_expiry DATE NOT NULL,
    new_expiry DATE NOT NULL,
    amount_paid NUMERIC(10, 2) DEFAULT 250.00,
    or_number VARCHAR(50) NOT NULL,
    processed_by VARCHAR(100) DEFAULT 'TRD Officer',
    renewal_date TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4 PEDICAB VIOLATIONS
CREATE TABLE public.violations_pedicab_admin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    franchise_id VARCHAR(50),
    city_plate_number VARCHAR(50) NOT NULL,
    mtop_number VARCHAR(50) NOT NULL,
    plate_number VARCHAR(30),
    operator_name VARCHAR(150),
    driver_name VARCHAR(150) NOT NULL,
    violation_type VARCHAR(150) NOT NULL,
    location VARCHAR(150) NOT NULL,
    fine_amount NUMERIC(10, 2) DEFAULT 300.00,
    enforcer_name VARCHAR(150) NOT NULL,
    reported_by VARCHAR(100) DEFAULT 'andrie30311',
    remarks TEXT,
    status VARCHAR(30) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Settled', 'Under Investigation')),
    date_submitted DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. PENDING APPLICATION REVIEWS (Queue)
-- ============================================================================
CREATE TABLE public.pending_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    applicant_name VARCHAR(150) NOT NULL,
    vehicle_category VARCHAR(20) NOT NULL CHECK (vehicle_category IN ('Tricycle', 'Pedicab')),
    date_submitted DATE DEFAULT CURRENT_DATE,
    application_type VARCHAR(50) NOT NULL CHECK (application_type IN ('New Registration', 'Renewal', 'Ownership Transfer')),
    contact_number VARCHAR(30) NOT NULL,
    address TEXT NOT NULL,
    city_plate_assigned VARCHAR(50) NOT NULL,
    mtop_assigned VARCHAR(50) NOT NULL,
    documents JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'Pending Document Review' CHECK (status IN ('Pending Document Review', 'Approved', 'Rejected')),
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX idx_tri_rec_plate ON public.franchise_records_tricycle_admin(city_plate_number);
CREATE INDEX idx_tri_rec_driver ON public.franchise_records_tricycle_admin(driver_name);
CREATE INDEX idx_tri_qr_plate ON public.system_qr_codes_tricycle_admin(city_plate_number);
CREATE INDEX idx_tri_viol_plate ON public.violations_tricycle_admin(city_plate_number);

CREATE INDEX idx_ped_rec_plate ON public.franchise_records_pedicab_admin(city_plate_number);
CREATE INDEX idx_ped_rec_driver ON public.franchise_records_pedicab_admin(driver_name);
CREATE INDEX idx_ped_qr_plate ON public.system_qr_codes_pedicab_admin(city_plate_number);
CREATE INDEX idx_ped_viol_plate ON public.violations_pedicab_admin(city_plate_number);

-- ============================================================================
-- 5. RLS SECURITY & UNRESTRICTED ACCESS
-- ============================================================================
ALTER TABLE public.franchise_records_tricycle_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_qr_codes_tricycle_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.franchise_renewals_tricycle_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.violations_tricycle_admin DISABLE ROW LEVEL SECURITY;

ALTER TABLE public.franchise_records_pedicab_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_qr_codes_pedicab_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.franchise_renewals_pedicab_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.violations_pedicab_admin DISABLE ROW LEVEL SECURITY;

ALTER TABLE public.pending_reviews DISABLE ROW LEVEL SECURITY;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- Universal fallback RLS policies
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "allow_all_operations" ON public.%I', tbl);
        EXECUTE format('CREATE POLICY "allow_all_operations" ON public.%I FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true)', tbl);
    END LOOP;
END $$;

-- ============================================================================
-- 6. REALTIME REPLICATION
-- ============================================================================
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE 
        public.franchise_records_tricycle_admin,
        public.system_qr_codes_tricycle_admin,
        public.violations_tricycle_admin,
        public.franchise_records_pedicab_admin,
        public.system_qr_codes_pedicab_admin,
        public.violations_pedicab_admin,
        public.pending_reviews;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- ============================================================================
-- 7. INITIAL SEED DATA
-- ============================================================================

-- 7.1 Tricycle Initial Seed
INSERT INTO public.franchise_records_tricycle_admin (
    application_no, city_plate_number, mtop_number, vehicle_category, plate_number,
    operator_last_name, operator_first_name, operator_middle_name, operator_name,
    operator_contact, operator_address, residential_address,
    driver_last_name, driver_first_name, driver_middle_name, driver_name,
    driver_address, driver_license_no, license_expiry,
    registration_date, expiration_date, route_parada, tourist_guide, availability,
    status, fare_matrix, standard_fare, violations_count, documents_verified, has_permanent_qr, qr_generated_date
) VALUES 
(
    'APP-2026-102', 'T-102', 'T-102', 'Tricycle', '1234-TR',
    'Barosana', 'Andrie', 'B.', 'Andrie B. Barosana',
    '0917-882-1920', 'Zone 4, Poblacion, Tabaco City', 'Zone 4, Poblacion, Tabaco City',
    'Bacelonia', 'Salvador', 'B.', 'Salvador B. Bacelonia',
    'Zone 4, Poblacion, Tabaco City', 'N02-18-994820', '2027-11-20',
    '2023-01-15', '2026-12-31', 'Sua-Igot 24 Tabaco', 'Yes', 'Available / On-Duty',
    'Active', '[{"destination": "Poblication to Miss pina", "regularFare": "50", "discountedFare": "40"}]'::jsonb, '₱50.00 Minimum',
    1, true, true, '2024-01-15'
),
(
    'APP-2026-103', 'T-103', 'T-103', 'Tricycle', '5678-TR',
    'Bacelonia', 'Salvador', 'B.', 'Salvador B. Bacelonia',
    '0917-882-1920', 'Zone 4, Poblacion, Tabaco City', 'Zone 4, Poblacion, Tabaco City',
    'Bacelonia', 'Salvador', 'B.', 'Salvador B. Bacelonia',
    'Zone 4, Poblacion, Tabaco City', 'N02-15-443910', '2026-08-30',
    '2022-05-10', '2026-01-15', 'Sua-Igot 24 Tabaco', 'Yes', 'Available / On-Duty',
    'Active', '[{"destination": "Poblacion to San Carlos", "regularFare": "25", "discountedFare": "20"}]'::jsonb, '₱25.00 Minimum',
    0, true, false, NULL
),
(
    'APP-2026-101', 'T-101', 'T-101', 'Tricycle', '9102-TR',
    'Dela Cruz', 'Juan', '', 'Juan Dela Cruz',
    '0918-223-4455', 'Barangay San Jose, Tabaco City', 'Barangay San Jose, Tabaco City',
    'Dela Cruz', 'Juan', '', 'Juan Dela Cruz',
    'Barangay San Jose, Tabaco City', 'N01-12-887341', '2025-12-10',
    '2021-03-20', '2026-01-15', 'Sua-Igot 24 Tabaco', 'Yes', 'Available / On-Duty',
    'Active', '[{"destination": "San Jose to Public Market", "regularFare": "20", "discountedFare": "16"}]'::jsonb, '₱20.00 Minimum',
    2, true, false, NULL
);

-- 7.2 Pedicab Initial Seed
INSERT INTO public.franchise_records_pedicab_admin (
    application_no, city_plate_number, mtop_number, vehicle_category, plate_number,
    operator_last_name, operator_first_name, operator_middle_name, operator_name,
    operator_contact, operator_address, residential_address,
    driver_last_name, driver_first_name, driver_middle_name, driver_name,
    driver_address, driver_license_no, license_expiry,
    registration_date, expiration_date, route_parada, tourist_guide, availability,
    status, fare_matrix, standard_fare, violations_count, documents_verified, has_permanent_qr, qr_generated_date
) VALUES 
(
    'APP-2026-201', 'P-101', 'P-101', 'Pedicab', 'PED-001',
    'Bobis', 'Eric', 'C.', 'Eric C. Bobis',
    '0929-334-1122', 'Market Site, Barangay 2, Tabaco City', 'Market Site, Barangay 2, Tabaco City',
    'Bobis', 'Eric', 'C.', 'Eric C. Bobis',
    'Market Site, Barangay 2, Tabaco City', 'PED-BRGY-0012', '2028-04-15',
    '2024-01-10', '2026-12-31', 'Centro - Public Market', 'Yes', 'Available / On-Duty',
    'Active', '[{"destination": "Centro to Public Market", "regularFare": "15", "discountedFare": "12"}]'::jsonb, '₱15.00 Minimum',
    0, true, true, '2024-01-10'
),
(
    'APP-2026-202', 'P-102', 'P-102', 'Pedicab', 'PED-002',
    'Barosana', 'Andrie', 'B.', 'Andrie B. Barosana',
    '0917-882-1920', 'Zone 4, Poblacion, Tabaco City', 'Zone 4, Poblacion, Tabaco City',
    'Bacelonia', 'Salvador', 'B.', 'Salvador B. Bacelonia',
    'Zone 4, Poblacion, Tabaco City', 'PED-BRGY-0042', '2027-11-20',
    '2023-08-12', '2025-11-30', 'Centro - Public Market', 'Yes', 'Available / On-Duty',
    'Under Review', '[{"destination": "Poblacion to Market", "regularFare": "15", "discountedFare": "12"}]'::jsonb, '₱15.00 Minimum',
    1, false, true, '2023-08-12'
);

-- 7.3 Tricycle Violations Seed (Citizen Reports)
INSERT INTO public.violations_tricycle_admin (
    city_plate_number, mtop_number, plate_number,
    operator_name, driver_name,
    violation_type, location, fine_amount,
    enforcer_name, reported_by, remarks, status, date_submitted
) VALUES
(
    'T-102', 'T-102', '1234-TR',
    'Andrie B. Barosana', 'Salvador B. Bacelonia',
    'Fare Overcharging', 'Public Market Main Terminal', 500.00,
    'Officer J. Ramos (TMG)', 'andrie30311', 'Charged passenger ₱50 over approved municipal fare matrix.', 'Pending', '2026-08-12'
),
(
    'T-101', 'T-101', '9102-TR',
    'Juan Dela Cruz', 'Juan Dela Cruz',
    'Refusal of Passenger Trip', 'Central Plaza Bus Stop', 500.00,
    'Enforcer R. Santos', 'maria_santos99', 'Refused senior citizen passenger destination without valid cause.', 'Settled', '2026-07-28'
),
(
    'T-101', 'T-101', '9102-TR',
    'Juan Dela Cruz', 'Juan Dela Cruz',
    'No Driver License', 'Zone 4 Poblacion Highway', 1000.00,
    'Officer J. Ramos (TMG)', 'juan_commuter08', 'Operating unit with expired LTO driver credentials.', 'Pending', '2026-08-05'
);

-- 7.4 Pedicab Violations Seed (Citizen Reports)
INSERT INTO public.violations_pedicab_admin (
    city_plate_number, mtop_number, plate_number,
    operator_name, driver_name,
    violation_type, location, fine_amount,
    enforcer_name, reported_by, remarks, status, date_submitted
) VALUES
(
    'P-102', 'P-102', 'PED-002',
    'Andrie B. Barosana', 'Salvador B. Bacelonia',
    'Operating Outside Route Boundary', 'Market Site Perimeter', 300.00,
    'Officer M. Lopez (Traffic Bureau)', 'andrie30311', 'Pedicab unit apprehended operating outside designated barangay route boundary.', 'Pending', '2026-08-14'
);

