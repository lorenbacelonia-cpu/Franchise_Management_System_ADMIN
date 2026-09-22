import type { FareMatrixItem, FranchiseRecord, VehicleCategory, ViolationRecord, PassengerComplaint } from '../types';
import { cleanFare, getDefaultFareMatrix, buildPermanentQrPayload } from '../utils/fareUtils';

// Supabase configuration from environment variables
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://ynyjkwcjjfswcfzwgumv.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlueWprd2NqamZzd2NmendndW12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NjQyOTMsImV4cCI6MjEwMjA0MDI5M30.ICWF8vCJ_8xJVzXS5yQkhUNF4h_oHjeSMsRmaaX5XdU';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Prefer': 'return=representation'
});

/** Return role suffix for database tables based on vehicle category */
export function getRoleSuffix(category: VehicleCategory = 'Tricycle'): 'tricycle_admin' | 'pedicab_admin' {
  return category === 'Pedicab' ? 'pedicab_admin' : 'tricycle_admin';
}

/** 
 * Clean, non-redundant table structure:
 * - records: Master table for Registration, Records, Driver Registry, and Deactivation
 * - qrCodes: Permanent locked QR Code security registry
 * - renewals: Official renewal audit trail & receipts
 * - violations: Citations and enforcement history
 */
export function getTableNames(category: VehicleCategory = 'Tricycle') {
  const suffix = getRoleSuffix(category);
  return {
    records: `franchise_records_${suffix}`,
    qrCodes: `system_qr_codes_${suffix}`,
    renewals: `franchise_renewals_${suffix}`,
    violations: `violations_${suffix}`,
  };
}

/** Convert Supabase snake_case record to frontend FranchiseRecord */
export function mapDBToFranchiseRecord(row: any): FranchiseRecord {
  const plate = row.city_plate_number || row.mtop_number || '';
  const category: VehicleCategory = row.vehicle_category || (plate.startsWith('P-') ? 'Pedicab' : 'Tricycle');

  // Normalize fare matrix items so each item has regularFare, studentFare, seniorPwdFare / discountedFare
  let mappedMatrix: FareMatrixItem[] = [];
  if (Array.isArray(row.fare_matrix) && row.fare_matrix.length > 0) {
    mappedMatrix = row.fare_matrix.map((item: any, idx: number) => ({
      id: item.id || `f-${idx + 1}`,
      destination: item.destination || 'Short Distance (Base)',
      regularFare: cleanFare(item.regularFare || item.regular_fare, '20.00'),
      studentFare: cleanFare(item.studentFare || item.student_fare || '15.00', '15.00'),
      seniorPwdFare: cleanFare(item.seniorPwdFare || item.senior_fare || item.discountedFare || item.discounted_fare || '16.00', '16.00'),
      discountedFare: cleanFare(item.discountedFare || item.discounted_fare || item.seniorPwdFare, '16.00'),
    }));
  } else {
    mappedMatrix = getDefaultFareMatrix(category);
  }

  const record: FranchiseRecord = {
    id: row.id,
    applicationNo: row.application_no || '',
    cityPlateNumber: plate,
    mtopNumber: plate,
    plateNumber: row.plate_number || `${plate}-TR`,
    vehicleCategory: category,
    operatorLastName: row.operator_last_name || '',
    operatorFirstName: row.operator_first_name || '',
    operatorMiddleName: row.operator_middle_name || '',
    operatorName: row.operator_name || `${row.operator_first_name || ''} ${row.operator_last_name || ''}`.trim(),
    operatorContact: row.operator_contact || '0917-882-1920',
    operatorAddress: row.operator_address || row.residential_address || '',
    residentialAddress: row.residential_address || row.operator_address || '',
    driverLastName: row.driver_last_name || '',
    driverFirstName: row.driver_first_name || '',
    driverMiddleName: row.driver_middle_name || '',
    driverName: row.driver_name || `${row.driver_first_name || ''} ${row.driver_last_name || ''}`.trim(),
    driverAddress: row.driver_address || row.residential_address || '',
    driverLicenseNo: row.driver_license_no || 'N02-18-994820',
    licenseExpiry: row.license_expiry || '2028-11-20',
    registrationDate: row.registration_date,
    expirationDate: row.expiration_date || '2026-12-31',
    status: row.status || 'Active',
    qrCodeData: '',
    violationsCount: row.violations_count || 0,
    documentsVerified: row.documents_verified ?? true,
    routeParada: row.route_parada || 'Sua-Igot 24 Tabaco',
    standardFare: row.standard_fare || (category === 'Pedicab' ? '₱15.00 Minimum' : '₱50.00 Minimum'),
    fareMatrix: mappedMatrix,
    touristGuide: row.tourist_guide || 'Yes',
    availability: row.availability || 'Available / On-Duty',
    hasPermanentQr: row.has_permanent_qr ?? false,
    qrGeneratedDate: row.qr_generated_date,
  };

  record.qrCodeData = buildPermanentQrPayload(record);
  return record;
}

/** Convert frontend FranchiseRecord to Supabase snake_case format (Strictly Dashboard Form Based) */
export function mapFranchiseRecordToDB(f: FranchiseRecord) {
  const plate = f.cityPlateNumber || f.mtopNumber;
  return {
    application_no: f.applicationNo || `APP-2026-${Math.floor(100 + Math.random() * 900)}`,
    city_plate_number: plate,
    mtop_number: plate,
    vehicle_category: f.vehicleCategory,
    plate_number: f.plateNumber || `${plate}-TR`,
    operator_last_name: f.operatorLastName || '',
    operator_first_name: f.operatorFirstName || '',
    operator_middle_name: f.operatorMiddleName || '',
    operator_name: f.operatorName,
    operator_contact: f.operatorContact || '0917-882-1920',
    operator_address: f.operatorAddress || f.residentialAddress || '',
    residential_address: f.residentialAddress || f.operatorAddress || '',
    driver_last_name: f.driverLastName || '',
    driver_first_name: f.driverFirstName || '',
    driver_middle_name: f.driverMiddleName || '',
    driver_name: f.driverName,
    driver_address: f.driverAddress || f.residentialAddress || '',
    driver_license_no: f.driverLicenseNo || 'N02-18-994820',
    license_expiry: f.licenseExpiry || '2028-11-20',
    registration_date: f.registrationDate || new Date().toISOString().split('T')[0],
    expiration_date: f.expirationDate || '2027-01-15',
    route_parada: f.routeParada || 'Sua-Igot 24 Tabaco',
    standard_fare: f.standardFare || '₱20.00 Minimum',
    fare_matrix: f.fareMatrix || [],
    tourist_guide: f.touristGuide || 'Yes',
    availability: f.availability || 'Available / On-Duty',
    status: f.status || 'Active',
    violations_count: f.violationsCount || 0,
    documents_verified: f.documentsVerified ?? true,
    has_permanent_qr: f.hasPermanentQr ?? false,
    qr_generated_date: f.qrGeneratedDate || null,
  };
}

/** Helper to try role-specific table with base-table fallback */
async function postWithFallback(roleTable: string, baseTable: string, payload: any) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${roleTable}`, {
      method: 'POST',
      headers: {
        ...getHeaders(),
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      console.log(`[Supabase SUCCESS] Saved to ${roleTable}:`, data);
      return data;
    }
    const errText = await res.text();
    console.error(`[Supabase ERROR] Failed to save to ${roleTable} (${res.status}):`, errText);
    
    if (res.status === 404 && baseTable !== roleTable) {
      const fallbackRes = await fetch(`${SUPABASE_URL}/rest/v1/${baseTable}`, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify(payload)
      });
      if (fallbackRes.ok) return await fallbackRes.json();
    }
  } catch (err) {
    console.error(`[Supabase NETWORK ERROR] Posting to ${roleTable}:`, err);
  }
  return null;
}

/** 1. Fetch franchise records for active role/category */
export async function fetchFranchiseRecordsFromSupabase(category: VehicleCategory = 'Tricycle'): Promise<FranchiseRecord[]> {
  const { records } = getTableNames(category);
  try {
    let response = await fetch(`${SUPABASE_URL}/rest/v1/${records}?select=*&order=created_at.desc`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    // Fallback to base franchise_records if role table doesn't exist yet
    if (!response.ok && response.status === 404) {
      response = await fetch(`${SUPABASE_URL}/rest/v1/franchise_records?select=*&order=created_at.desc`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
    }

    if (!response.ok) return [];
    const data = await response.json();
    if (!Array.isArray(data)) return [];
    return data.map(mapDBToFranchiseRecord);
  } catch (error) {
    console.error('Supabase Fetch Franchise Records Error:', error);
    return [];
  }
}

/** 2. Save master franchise record (Used directly for Register Franchise) */
export async function saveFranchiseRecordInSupabase(record: FranchiseRecord, category?: VehicleCategory) {
  const cat = category || record.vehicleCategory;
  const { records } = getTableNames(cat);
  const payload = mapFranchiseRecordToDB(record);
  return postWithFallback(records, 'franchise_records', payload);
}

/** Alias for registration to save master franchise record */
export async function saveFranchiseRegistrationInSupabase(record: FranchiseRecord, category?: VehicleCategory) {
  return saveFranchiseRecordInSupabase(record, category);
}

/** 3. Save and lock a permanent QR code in system_qr_codes and role-specific tables */
export async function savePermanentQRCodeInSupabase(data: {
  franchise_id?: string;
  mtop_number: string;
  city_plate_number?: string;
  driver_name: string;
  driver_license_no: string;
  qr_payload: string;
  qr_code_image_url?: string;
}, category: VehicleCategory = 'Tricycle') {
  const { qrCodes } = getTableNames(category);
  const plate = data.city_plate_number || data.mtop_number;

  const isValidUuid = data.franchise_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.franchise_id);
  const payload: any = {
    city_plate_number: plate,
    mtop_number: plate,
    driver_name: data.driver_name,
    driver_license_no: data.driver_license_no || 'N02-18-994820',
    qr_payload: data.qr_payload,
    qr_code_image_url: data.qr_code_image_url || `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(data.qr_payload)}`,
    is_permanent: true,
    is_locked: true,
    issued_by_admin: 'Admin Portal'
  };

  if (isValidUuid) {
    payload.franchise_id = data.franchise_id;
  }

  // 1. Post to base table `system_qr_codes`
  const baseResult = await postWithFallback('system_qr_codes', 'system_qr_codes', payload);

  // 2. Also save to role-specific partition table if different
  if (qrCodes !== 'system_qr_codes') {
    await postWithFallback(qrCodes, 'system_qr_codes', payload);
  }

  return baseResult || payload;
}

/** 4. Update franchise QR status in franchise_records_${role}_admin */
export async function updateFranchiseQrInSupabase(mtopNumber: string, qrDate: string, category: VehicleCategory = 'Tricycle') {
  const { records } = getTableNames(category);
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${records}?city_plate_number=eq.${encodeURIComponent(mtopNumber)}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({
        has_permanent_qr: true,
        qr_generated_date: qrDate
      })
    });
    if (response.ok) return await response.json();
    // Fallback to mtop_number query or base table
    const fallbackRes = await fetch(`${SUPABASE_URL}/rest/v1/${records}?mtop_number=eq.${encodeURIComponent(mtopNumber)}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({
        has_permanent_qr: true,
        qr_generated_date: qrDate
      })
    });
    if (fallbackRes.ok) return await fallbackRes.json();
  } catch (error) {
    console.error('Supabase Update Franchise QR Error:', error);
  }
  return null;
}

/** 5. Save a renewal in franchise_renewals_${role}_admin and update master record expiry */
export async function saveFranchiseRenewalInSupabase(data: {
  mtop_number: string;
  city_plate_number?: string;
  operator_name: string;
  driver_name: string;
  previous_expiry: string;
  new_expiry: string;
  amount_paid?: number;
  or_number?: string;
}, category: VehicleCategory = 'Tricycle') {
  const { renewals, records } = getTableNames(category);
  const plate = data.city_plate_number || data.mtop_number;
  
  // 1. Insert into renewals table
  const renewalPayload = {
    ...data,
    city_plate_number: plate,
    mtop_number: plate,
    amount_paid: data.amount_paid || (category === 'Pedicab' ? 250.00 : 450.00),
    or_number: data.or_number || `OR-2026-${Math.floor(10000 + Math.random() * 90000)}`
  };
  await postWithFallback(renewals, 'franchise_renewals', renewalPayload);

  // 2. Update expiration date in master records table
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/${records}?city_plate_number=eq.${encodeURIComponent(plate)}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({
        expiration_date: data.new_expiry,
        status: 'Active'
      })
    });
  } catch (e) {
    console.warn('Error patching renewal expiry in records:', e);
  }
}

/** 6. Save a violation in violations_${role}_admin & increment master record count */
export async function saveViolationInSupabase(violation: ViolationRecord, category: VehicleCategory = 'Tricycle') {
  const { violations, records } = getTableNames(category);
  const plate = violation.cityPlateNumber || violation.mtopNumber;
  const payload = {
    franchise_id: violation.franchiseId,
    city_plate_number: plate,
    mtop_number: plate,
    plate_number: violation.plateNumber,
    operator_name: violation.operatorName,
    driver_name: violation.driverName,
    violation_type: violation.violationType,
    location: violation.location,
    fine_amount: violation.fineAmount,
    enforcer_name: violation.enforcerName,
    reported_by: violation.reportedBy || 'Citizen Reporter',
    remarks: violation.remarks,
    status: violation.status,
    date_submitted: violation.dateSubmitted,
  };
  const res = await postWithFallback(violations, 'violations', payload);

  // Also increment violation count on master record
  try {
    const fetchRes = await fetch(`${SUPABASE_URL}/rest/v1/${records}?city_plate_number=eq.${encodeURIComponent(plate)}&select=violations_count`, {
      headers: getHeaders()
    });
    if (fetchRes.ok) {
      const rows = await fetchRes.json();
      if (rows && rows[0]) {
        const currentCount = rows[0].violations_count || 0;
        await fetch(`${SUPABASE_URL}/rest/v1/${records}?city_plate_number=eq.${encodeURIComponent(plate)}`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify({ violations_count: currentCount + 1 })
        });
      }
    }
  } catch (e) {
    console.warn('Could not increment violation count on record:', e);
  }

  return res;
}

/** 7. Fetch violations for role */
export async function fetchViolationsFromSupabase(category: VehicleCategory = 'Tricycle'): Promise<ViolationRecord[]> {
  const { violations } = getTableNames(category);
  try {
    let response = await fetch(`${SUPABASE_URL}/rest/v1/${violations}?select=*&order=date_submitted.desc`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    if (!response.ok && response.status === 404) {
      response = await fetch(`${SUPABASE_URL}/rest/v1/violations?select=*&order=date_submitted.desc`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
    }
    if (!response.ok) return [];
    const data = await response.json();
    if (!Array.isArray(data)) return [];
    return data.map((v: any) => ({
      id: v.id,
      franchiseId: v.franchise_id || '',
      cityPlateNumber: v.city_plate_number || v.mtop_number || '',
      mtopNumber: v.city_plate_number || v.mtop_number || '',
      plateNumber: v.plate_number || '',
      operatorName: v.operator_name || 'Registered Operator',
      driverName: v.driver_name || 'Designated Driver',
      violationType: v.violation_type || v.issue_type || 'Reported Infraction',
      location: v.location || 'Tabaco City',
      fineAmount: Number(v.fine_amount) || (category === 'Pedicab' ? 300 : 500),
      enforcerName: v.enforcer_name || 'Citizen Report / TRD Review',
      reportedBy: v.reported_by || v.complainant_name || 'andrie30311',
      dateSubmitted: v.date_submitted || (v.created_at ? v.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
      remarks: v.remarks || v.description || '',
      status: v.status || 'Pending'
    }));
  } catch (error) {
    console.error('Supabase Fetch Violations Error:', error);
    return [];
  }
}

/** Update violation status in Supabase (e.g. Settle / Resolve) */
export async function updateViolationStatusInSupabase(
  violationId: string, 
  status: 'Pending' | 'Settled' | 'Under Investigation',
  category: VehicleCategory = 'Tricycle'
) {
  const { violations } = getTableNames(category);
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${violations}?id=eq.${encodeURIComponent(violationId)}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('Could not update violation status in Supabase:', e);
  }
  return null;
}

/** 8. Update driver info directly on the master franchise record (No duplicate driver table) */
export async function saveDriverRegistryUpdateInSupabase(data: {
  mtop_number: string;
  city_plate_number?: string;
  driver_name: string;
  license_no?: string;
  contact_number?: string;
  residential_address?: string;
  availability?: string;
}, category: VehicleCategory = 'Tricycle') {
  const { records } = getTableNames(category);
  const plate = data.city_plate_number || data.mtop_number;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${records}?city_plate_number=eq.${encodeURIComponent(plate)}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({
        driver_name: data.driver_name,
        driver_license_no: data.license_no,
        operator_contact: data.contact_number,
        availability: data.availability
      })
    });
    if (!res.ok) {
      await fetch(`${SUPABASE_URL}/rest/v1/${records}?mtop_number=eq.${encodeURIComponent(plate)}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
          driver_name: data.driver_name,
          driver_license_no: data.license_no,
          operator_contact: data.contact_number,
          availability: data.availability
        })
      });
    }
  } catch (e) {
    console.warn('Could not update driver in master franchise records:', e);
  }
}

/** 9. Mark status Deactivated directly on the master franchise record (No duplicate deactivation table) */
export async function saveDeactivationInSupabase(data: {
  mtop_number: string;
  city_plate_number?: string;
  operator_name?: string;
  driver_name?: string;
  reason: string;
  deactivated_by?: string;
  effective_date?: string;
}, category: VehicleCategory = 'Tricycle') {
  const { records } = getTableNames(category);
  const plate = data.city_plate_number || data.mtop_number;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${records}?city_plate_number=eq.${encodeURIComponent(plate)}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({
        status: 'Deactivated',
      })
    });
    if (!res.ok) {
      await fetch(`${SUPABASE_URL}/rest/v1/${records}?mtop_number=eq.${encodeURIComponent(plate)}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
          status: 'Deactivated',
        })
      });
    }
  } catch (e) {
    console.warn('Could not set status to Deactivated in master franchise records:', e);
  }
}

/** 10. Fetch passenger complaints submitted from mobile web */
export async function fetchPassengerComplaintsFromSupabase(): Promise<PassengerComplaint[]> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/passenger_complaints?select=*&order=created_at.desc`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((c: any) => ({
      id: c.id,
      complainantName: c.complainant_name || 'Anonymous Citizen',
      contactNumber: c.contact_number || '0917-882-1920',
      cityPlateNumber: c.city_plate_number || c.mtop_number || '—',
      mtopNumber: c.mtop_number || c.city_plate_number || '—',
      vehicleCategory: c.vehicle_category || (c.city_plate_number?.startsWith('P-') ? 'Pedicab' : 'Tricycle'),
      incidentDate: c.incident_date || (c.created_at ? c.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
      issueType: c.issue_type || 'Report Overcharging',
      description: c.description || 'Passenger report submitted from mobile web',
      status: (c.status === 'Resolved' ? 'Resolved' : c.status === 'Escalated' ? 'Escalated' : 'Under Investigation') as any
    }));
  } catch (e) {
    console.error('Supabase Fetch Passenger Complaints Error:', e);
    return [];
  }
}

/** 11. Update status of passenger complaint in Supabase */
export async function updatePassengerComplaintStatusInSupabase(
  id: string, 
  status: 'Under Investigation' | 'Resolved' | 'Escalated'
) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/passenger_complaints?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status, updated_at: new Date().toISOString() })
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('Could not update passenger complaint in Supabase:', e);
  }
  return null;
}

/** 12. Fetch pending reviews submitted for admin approval */
export async function fetchPendingReviewsFromSupabase(): Promise<any[]> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/pending_reviews?select=*&order=created_at.desc`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data;
  } catch (e) {
    console.error('Supabase Fetch Pending Reviews Error:', e);
    return [];
  }
}

/** 13. Fetch mobile accounts (Enforcers and Passengers) */
export async function fetchMobileAccountsFromSupabase() {
  const result = { enforcers: [] as any[], passengers: [] as any[] };
  try {
    const [enfRes, passRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/account_enforcer_mobile?select=id,username,fullname,created_at`, { headers: getHeaders() }),
      fetch(`${SUPABASE_URL}/rest/v1/account_passenger_mobile?select=id,username,fullname,created_at`, { headers: getHeaders() })
    ]);
    if (enfRes.ok) result.enforcers = await enfRes.json();
    if (passRes.ok) result.passengers = await passRes.json();
  } catch (e) {
    console.warn('Could not fetch mobile accounts:', e);
  }
  return result;
}
