/**
 * Tabaco City TRD Portal - Database Schema Type Definitions
 */

// 1. Database Table: franchise_registrations (Register Franchise)
export interface DBFranchiseRegistration {
  id: string; // Primary Key (e.g. REG-2026-001)
  mtop_number: string; // Unique MTOP City Plate No.
  vehicle_category: 'Tricycle' | 'Pedicab';
  operator_name: string;
  operator_contact: string;
  operator_address: string;
  driver_name: string;
  driver_license_no: string;
  license_expiry: string; // YYYY-MM-DD
  plate_number: string;
  make_model?: string;
  engine_number?: string;
  chassis_number?: string;
  registration_status: 'Pending' | 'Approved' | 'Rejected';
  registration_date: string; // ISO Timestamp
}

// 2. Database Table: franchise_records (Franchise Records)
export interface DBFranchiseRecord {
  id: string; // Primary Key (e.g. fr-102)
  registration_id?: string; // Foreign Key -> franchise_registrations.id
  mtop_number: string; // Unique MTOP City Plate No.
  vehicle_category: 'Tricycle' | 'Pedicab';
  plate_number: string;
  make_model: string;
  engine_number: string;
  chassis_number: string;
  operator_name: string;
  operator_contact: string;
  operator_address: string;
  driver_name: string;
  driver_license_no: string;
  license_expiry: string;
  registration_date: string;
  expiration_date: string;
  route_parada: string;
  standard_fare: string;
  tourist_guide: 'Yes' | 'No';
  availability: string;
  status: 'Active' | 'Pending Renewal' | 'Deactivated' | 'Under Review';
  violations_count: number;
  documents_verified: boolean;
  created_at: string;
  updated_at: string;
}

// 3. Database Table: system_qr_codes (Generate System QR Code)
export interface DBSystemQRCode {
  id: string; // Primary Key (e.g. qr-t102)
  franchise_id: string; // Foreign Key -> franchise_records.id (UNIQUE)
  mtop_number: string;
  driver_name: string;
  driver_license_no: string;
  qr_payload: string; // Encoded permanent driver payload
  qr_code_image_url?: string;
  is_permanent: boolean; // Flag ensuring code cannot be replaced
  is_locked: boolean; // Security lock flag
  issued_by_admin: string;
  generated_at: string; // Timestamp of issuance
  last_scanned_at?: string | null;
}
