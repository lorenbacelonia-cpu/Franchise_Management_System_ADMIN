-- ============================================================================
-- SUPABASE FIX PERMISSIONS & SEED RECORDS SCRIPT
-- Paste and Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ynyjkwcjjfswcfzwgumv/sql
-- ============================================================================

-- 1. Grant public/anon read and write permissions to all tables & disable RLS
ALTER TABLE IF EXISTS public.account_enforcer_mobile DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.account_passenger_mobile DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.franchise_records_tricycle_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.franchise_records_pedicab_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_qr_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_qr_codes_tricycle_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_qr_codes_pedicab_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.passenger_complaints DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pending_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.franchise_renewals_tricycle_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.franchise_renewals_pedicab_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.violations_tricycle_admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.violations_pedicab_admin DISABLE ROW LEVEL SECURITY;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 2. Seed Initial Records into Tricycle Admin Table (matching Dashboard)
INSERT INTO public.franchise_records_tricycle_admin (
    mtop_number,
    vehicle_category,
    plate_number,
    make_model,
    engine_number,
    chassis_number,
    operator_name,
    operator_contact,
    operator_address,
    driver_name,
    driver_license_no,
    license_expiry,
    registration_date,
    expiration_date,
    route_parada,
    standard_fare,
    status,
    violations_count,
    documents_verified,
    has_permanent_qr
) VALUES 
(
    '1243',
    'Tricycle',
    '1243-TR',
    'Kawasaki Barako 175',
    'ENG-994821',
    'CHS-8839201',
    'Eric C. Bobis',
    '0929-334-1122',
    'Market Site, Barangay 2, Tabaco City',
    'Eric C. Bobis',
    'N03-20-112094',
    '2028-04-15',
    '2024-02-01',
    '2026-12-31',
    'Sua-Igot 24',
    '₱20.00 Minimum',
    'Active',
    0,
    true,
    true
),
(
    '1453',
    'Tricycle',
    '1453-TR',
    'Honda TMX 125 Alpha',
    'ENG-443910',
    'CHS-1102938',
    'Juan Dela Cruz',
    '0918-223-4455',
    'Barangay San Jose, Tabaco City',
    'Juan Dela Cruz',
    'N01-12-887341',
    '2027-10-10',
    '2023-05-10',
    '2026-12-31',
    'Sua-Igot 24',
    '₱20.00 Minimum',
    'Active',
    0,
    true,
    false
),
(
    'T-102',
    'Tricycle',
    '1234-TR',
    'Kawasaki Barako 175',
    'ENG-332910',
    'CHS-9920192',
    'Andrie B. Barosana',
    '0917-882-1920',
    'Zone 4, Poblacion, Tabaco City',
    'Salvador B. Bacelonia',
    'N02-18-994820',
    '2027-11-20',
    '2023-01-15',
    '2026-12-31',
    'Sua-Igot 24',
    '₱20.00 Minimum',
    'Active',
    1,
    true,
    true
)
ON CONFLICT (mtop_number) DO UPDATE 
SET operator_name = EXCLUDED.operator_name,
    driver_name = EXCLUDED.driver_name,
    status = EXCLUDED.status;

-- 3. Seed Initial Records into Pedicab Admin Table (matching Dashboard)
INSERT INTO public.franchise_records_pedicab_admin (
    mtop_number,
    vehicle_category,
    plate_number,
    make_model,
    engine_number,
    chassis_number,
    operator_name,
    operator_contact,
    operator_address,
    driver_name,
    driver_license_no,
    license_expiry,
    registration_date,
    expiration_date,
    route_parada,
    standard_fare,
    status,
    violations_count,
    documents_verified,
    has_permanent_qr
) VALUES 
(
    'P-102',
    'Pedicab',
    'PED-002',
    'Standard Passenger Pedicab',
    'N/A',
    'PED-CHS-0092',
    'Salvador B. Bacelonia',
    '0917-882-1920',
    'Zone 4, Poblacion, Tabaco City',
    'Salvador B. Bacelonia',
    'PED-BRGY-0042',
    '2027-11-20',
    '2023-08-12',
    '2026-12-31',
    'Centro - Public Market',
    '₱15.00 Minimum',
    'Active',
    1,
    true,
    true
),
(
    'P-234',
    'Pedicab',
    'PED-234',
    'Custom Pedicab Heavy Duty',
    'N/A',
    'PED-CHS-0234',
    'Juan Dela Cruz',
    '0918-223-4455',
    'Barangay San Jose, Tabaco City',
    'Juan Dela Cruz',
    'PED-BRGY-0089',
    '2028-02-15',
    '2024-03-01',
    '2026-12-31',
    'Centro - Public Market',
    '₱15.00 Minimum',
    'Active',
    0,
    true,
    false
),
(
    'P-101',
    'Pedicab',
    'PED-001',
    'Passenger Pedicab Classic',
    'N/A',
    'PED-CHS-0001',
    'Eric C. Bobis',
    '0929-334-1122',
    'Market Site, Barangay 2, Tabaco City',
    'Eric C. Bobis',
    'PED-BRGY-0012',
    '2028-04-15',
    '2024-01-10',
    '2026-12-31',
    'Centro - Public Market',
    '₱15.00 Minimum',
    'Active',
    0,
    true,
    true
)
ON CONFLICT (mtop_number) DO UPDATE 
SET operator_name = EXCLUDED.operator_name,
    driver_name = EXCLUDED.driver_name,
    status = EXCLUDED.status;

-- 4. Seed Initial Records into Tricycle Violations Table (Citizen Reports)
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

-- 5. Seed Initial Records into Pedicab Violations Table (Citizen Reports)
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

