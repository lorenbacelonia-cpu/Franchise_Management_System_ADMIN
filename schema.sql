-- ============================================================================
-- TABACO CITY TRD PORTAL - FRANCHISE MANAGEMENT DATABASE SCHEMA
-- Exactly based on the Registration Form & Dashboard UI
-- ============================================================================

CREATE TABLE IF NOT EXISTS franchise_records_tricycle_admin (
    id VARCHAR(50) PRIMARY KEY,
    application_no VARCHAR(50) NOT NULL,
    city_plate_number VARCHAR(50) NOT NULL UNIQUE,
    mtop_number VARCHAR(50) NOT NULL,
    vehicle_category VARCHAR(20) DEFAULT 'Tricycle',
    owner_last_name VARCHAR(100),
    owner_first_name VARCHAR(100),
    owner_middle_name VARCHAR(100),
    owner_name VARCHAR(150),
    operator_last_name VARCHAR(100),
    operator_first_name VARCHAR(100),
    operator_middle_name VARCHAR(100),
    operator_name VARCHAR(150) NOT NULL,
    operator_contact VARCHAR(30),
    operator_address TEXT NOT NULL,
    residential_address TEXT NOT NULL,
    age VARCHAR(10),
    beneficiary_name VARCHAR(150),
    beneficiary_address TEXT,
    color VARCHAR(50),
    make_model VARCHAR(100),
    driver_last_name VARCHAR(100),
    driver_first_name VARCHAR(100),
    driver_middle_name VARCHAR(100),
    driver_name VARCHAR(150) NOT NULL,
    driver_address TEXT,
    expiration_date DATE NOT NULL,
    route_parada VARCHAR(100),
    tourist_guide VARCHAR(10) DEFAULT 'Yes',
    availability VARCHAR(50) DEFAULT 'Available / On-Duty',
    status VARCHAR(30) DEFAULT 'Active',
    fare_matrix JSON,
    standard_fare VARCHAR(50),
    violations_count INT DEFAULT 0,
    has_permanent_qr BOOLEAN DEFAULT FALSE,
    qr_generated_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS franchise_records_pedicab_admin (
    id VARCHAR(50) PRIMARY KEY,
    application_no VARCHAR(50) NOT NULL,
    city_plate_number VARCHAR(50) NOT NULL UNIQUE,
    mtop_number VARCHAR(50) NOT NULL,
    vehicle_category VARCHAR(20) DEFAULT 'Pedicab',
    owner_last_name VARCHAR(100),
    owner_first_name VARCHAR(100),
    owner_middle_name VARCHAR(100),
    owner_name VARCHAR(150),
    operator_last_name VARCHAR(100),
    operator_first_name VARCHAR(100),
    operator_middle_name VARCHAR(100),
    operator_name VARCHAR(150) NOT NULL,
    operator_contact VARCHAR(30),
    operator_address TEXT NOT NULL,
    residential_address TEXT NOT NULL,
    age VARCHAR(10),
    beneficiary_name VARCHAR(150),
    beneficiary_address TEXT,
    color VARCHAR(50),
    make_model VARCHAR(100),
    driver_last_name VARCHAR(100),
    driver_first_name VARCHAR(100),
    driver_middle_name VARCHAR(100),
    driver_name VARCHAR(150) NOT NULL,
    driver_address TEXT,
    expiration_date DATE NOT NULL,
    route_parada VARCHAR(100),
    tourist_guide VARCHAR(10) DEFAULT 'Yes',
    availability VARCHAR(50) DEFAULT 'Available / On-Duty',
    status VARCHAR(30) DEFAULT 'Active',
    fare_matrix JSON,
    standard_fare VARCHAR(50),
    violations_count INT DEFAULT 0,
    has_permanent_qr BOOLEAN DEFAULT FALSE,
    qr_generated_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migration commands for existing tables
ALTER TABLE franchise_records_tricycle_admin ADD COLUMN IF NOT EXISTS owner_last_name VARCHAR(100);
ALTER TABLE franchise_records_tricycle_admin ADD COLUMN IF NOT EXISTS owner_first_name VARCHAR(100);
ALTER TABLE franchise_records_tricycle_admin ADD COLUMN IF NOT EXISTS owner_middle_name VARCHAR(100);
ALTER TABLE franchise_records_tricycle_admin ADD COLUMN IF NOT EXISTS owner_name VARCHAR(150);
ALTER TABLE franchise_records_tricycle_admin ADD COLUMN IF NOT EXISTS age VARCHAR(10);
ALTER TABLE franchise_records_tricycle_admin ADD COLUMN IF NOT EXISTS beneficiary_name VARCHAR(150);
ALTER TABLE franchise_records_tricycle_admin ADD COLUMN IF NOT EXISTS beneficiary_address TEXT;
ALTER TABLE franchise_records_tricycle_admin ADD COLUMN IF NOT EXISTS color VARCHAR(50);
ALTER TABLE franchise_records_tricycle_admin ADD COLUMN IF NOT EXISTS make_model VARCHAR(100);

ALTER TABLE franchise_records_pedicab_admin ADD COLUMN IF NOT EXISTS owner_last_name VARCHAR(100);
ALTER TABLE franchise_records_pedicab_admin ADD COLUMN IF NOT EXISTS owner_first_name VARCHAR(100);
ALTER TABLE franchise_records_pedicab_admin ADD COLUMN IF NOT EXISTS owner_middle_name VARCHAR(100);
ALTER TABLE franchise_records_pedicab_admin ADD COLUMN IF NOT EXISTS owner_name VARCHAR(150);
ALTER TABLE franchise_records_pedicab_admin ADD COLUMN IF NOT EXISTS age VARCHAR(10);
ALTER TABLE franchise_records_pedicab_admin ADD COLUMN IF NOT EXISTS beneficiary_name VARCHAR(150);
ALTER TABLE franchise_records_pedicab_admin ADD COLUMN IF NOT EXISTS beneficiary_address TEXT;
ALTER TABLE franchise_records_pedicab_admin ADD COLUMN IF NOT EXISTS color VARCHAR(50);
ALTER TABLE franchise_records_pedicab_admin ADD COLUMN IF NOT EXISTS make_model VARCHAR(100);
