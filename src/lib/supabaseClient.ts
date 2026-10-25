import type { FareMatrixItem, FranchiseRecord, VehicleCategory, ViolationRecord, PassengerComplaint, ComplaintChatMessage, PendingReview, AdminAccount } from '../types';
import { cleanFare, getDefaultFareMatrix, buildPermanentQrPayload, isRecordExpired, resolveFranchiseStatus } from '../utils/fareUtils';

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
 * Clean, role-partitioned active database table structure:
 * - records: franchise_records_${suffix}
 * - qrCodes: system_qr_codes_${suffix}
 * - renewals: franchise_renewals_${suffix}
 * - violations: violations_${suffix}
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

  // Normalize fare matrix items
  let mappedMatrix: FareMatrixItem[] = [];
  if (Array.isArray(row.fare_matrix) && row.fare_matrix.length > 0) {
    mappedMatrix = row.fare_matrix.map((item: any, idx: number) => {
      const fallback = category === 'Pedicab' ? '15.00' : '20.00';
      const reg = cleanFare(item.regularFare || item.regular_fare, fallback);
      const regNum = parseFloat(reg);
      const defaultDiscount = (regNum * 0.8).toFixed(2);
      const stu = cleanFare(item.studentFare || item.student_fare, defaultDiscount);
      const snr = cleanFare(item.seniorPwdFare || item.senior_fare || item.discountedFare || item.discounted_fare, defaultDiscount);
      return {
        id: item.id || `f-${idx + 1}`,
        destination: item.destination || (category === 'Pedicab' ? 'Poblacion to Market' : 'Short Distance (Base)'),
        regularFare: reg,
        studentFare: stu,
        seniorPwdFare: snr,
        discountedFare: snr,
      };
    });
  } else {
    mappedMatrix = getDefaultFareMatrix(category);
  }

  const baseFareVal = mappedMatrix[0]?.regularFare ? cleanFare(mappedMatrix[0].regularFare) : (category === 'Pedicab' ? '15.00' : '20.00');
  const resolvedStandardFare = row.standard_fare && !row.standard_fare.includes('50.00 Minimum')
    ? row.standard_fare
    : (row.standard_fare || `₱${baseFareVal} Minimum`);

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
    status: resolveFranchiseStatus(row.status, row.expiration_date),
    qrCodeData: '',
    violationsCount: row.violations_count || 0,
    documentsVerified: row.documents_verified ?? true,
    routeParada: row.route_parada || 'Sua-Igot 24 Tabaco',
    standardFare: resolvedStandardFare,
    fareMatrix: mappedMatrix,
    touristGuide: row.tourist_guide || 'Yes',
    availability: row.availability || 'Available / On-Duty',
    hasPermanentQr: row.has_permanent_qr ?? false,
    qrGeneratedDate: row.qr_generated_date,
  };

  record.qrCodeData = buildPermanentQrPayload(record);
  return record;
}

/** Convert frontend FranchiseRecord to Supabase snake_case format */
export function mapFranchiseRecordToDB(f: FranchiseRecord) {
  const plate = f.cityPlateNumber || f.mtopNumber;
  const isValidUuid = f.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(f.id);
  const payload: any = {
    application_no: f.applicationNo || `APP-2026-${Math.floor(100 + Math.random() * 900)}`,
    city_plate_number: plate,
    mtop_number: plate,
    vehicle_category: f.vehicleCategory,
    plate_number: f.plateNumber || (f.vehicleCategory === 'Pedicab' ? `${plate}-PED` : `${plate}-TR`),
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
    standard_fare: f.standardFare || (f.vehicleCategory === 'Pedicab' ? '₱15.00 Minimum' : '₱20.00 Minimum'),
    fare_matrix: f.fareMatrix || [],
    tourist_guide: f.touristGuide || 'Yes',
    availability: f.availability || 'Available / On-Duty',
    status: resolveFranchiseStatus(f.status, f.expirationDate),
    violations_count: f.violationsCount || 0,
    documents_verified: f.documentsVerified ?? true,
    has_permanent_qr: f.hasPermanentQr ?? false,
    qr_generated_date: f.qrGeneratedDate || null,
  };
  if (isValidUuid) {
    payload.id = f.id;
  }
  return payload;
}

/** Helper to post directly to active table with optional on_conflict */
async function postToTable(tableName: string, payload: any, onConflictColumn?: string) {
  try {
    const url = onConflictColumn 
      ? `${SUPABASE_URL}/rest/v1/${tableName}?on_conflict=${encodeURIComponent(onConflictColumn)}`
      : `${SUPABASE_URL}/rest/v1/${tableName}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...getHeaders(),
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
    const errText = await res.text();
    console.error(`[Supabase ERROR] Failed to save to ${tableName} (${res.status}):`, errText);
  } catch (err) {
    console.error(`[Supabase NETWORK ERROR] Posting to ${tableName}:`, err);
  }
  return null;
}

/** 1. Fetch franchise records for active role/category */
export async function fetchFranchiseRecordsFromSupabase(category: VehicleCategory = 'Tricycle'): Promise<FranchiseRecord[]> {
  const { records } = getTableNames(category);
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${records}?select=*&order=created_at.desc`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (!response.ok) {
      console.warn(`[Supabase] Table ${records} fetch returned status ${response.status}`);
      return [];
    }
    const data = await response.json();
    if (!Array.isArray(data)) return [];
    return data.map(mapDBToFranchiseRecord);
  } catch (error) {
    console.error(`Supabase Fetch Franchise Records (${records}) Error:`, error);
    return [];
  }
}

/** 2. Save master franchise record (Used for Register Franchise) */
export async function saveFranchiseRecordInSupabase(record: FranchiseRecord, category?: VehicleCategory) {
  const cat = category || record.vehicleCategory;
  const { records } = getTableNames(cat);
  const payload = mapFranchiseRecordToDB(record);
  return postToTable(records, payload, 'city_plate_number');
}

/** Alias for registration to save master franchise record */
export async function saveFranchiseRegistrationInSupabase(record: FranchiseRecord, category?: VehicleCategory) {
  return saveFranchiseRecordInSupabase(record, category);
}

/** 3. Save and lock a permanent QR code in system_qr_codes_${role}_admin table */
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
  const qrImageUrl = data.qr_code_image_url || `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(data.qr_payload)}`;

  // 1. Try updating existing QR code record by city_plate_number first
  try {
    const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/${qrCodes}?city_plate_number=eq.${encodeURIComponent(plate)}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({
        driver_name: data.driver_name,
        driver_license_no: data.driver_license_no || 'N02-18-994820',
        qr_payload: data.qr_payload,
        qr_code_image_url: qrImageUrl,
        is_permanent: true,
        is_locked: true,
        issued_by_admin: 'Admin Portal',
        generated_at: new Date().toISOString()
      })
    });
    if (patchRes.ok) {
      const pText = await patchRes.text();
      const pData = pText ? JSON.parse(pText) : [];
      if (Array.isArray(pData) && pData.length > 0) return pData;
    }
  } catch (err) {
    console.warn('Patch existing QR code error, proceeding to post:', err);
  }

  // 2. Insert new QR code if not previously registered
  const payload: any = {
    city_plate_number: plate,
    mtop_number: plate,
    driver_name: data.driver_name,
    driver_license_no: data.driver_license_no || 'N02-18-994820',
    qr_payload: data.qr_payload,
    qr_code_image_url: qrImageUrl,
    is_permanent: true,
    is_locked: true,
    issued_by_admin: 'Admin Portal'
  };

  if (isValidUuid) {
    payload.franchise_id = data.franchise_id;
  }

  return postToTable(qrCodes, payload, 'qr_payload');
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
  
  // 1. Insert into role renewals table
  const renewalPayload = {
    ...data,
    city_plate_number: plate,
    mtop_number: plate,
    amount_paid: data.amount_paid || (category === 'Pedicab' ? 250.00 : 450.00),
    or_number: data.or_number || `OR-2026-${Math.floor(10000 + Math.random() * 90000)}`
  };
  await postToTable(renewals, renewalPayload);

  // 2. Update expiration date & status in master records table
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/${records}?city_plate_number=eq.${encodeURIComponent(plate)}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({
        expiration_date: data.new_expiry,
        status: 'Active',
        updated_at: new Date().toISOString()
      })
    });
  } catch (e) {
    console.warn('Error patching renewal expiry in records:', e);
  }

  // 3. Update the permanent QR code payload & image in system_qr_codes to reflect Active status & new expiry
  try {
    const { qrCodes } = getTableNames(category);
    const renewedQrPayload = buildPermanentQrPayload({
      cityPlateNumber: plate,
      mtopNumber: plate,
      plateNumber: `${plate}-${category === 'Pedicab' ? 'PED' : 'TR'}`,
      vehicleCategory: category,
      operatorName: data.operator_name,
      driverName: data.driver_name,
      expirationDate: data.new_expiry,
      status: 'Active',
      qrCodeData: '',
      violationsCount: 0,
      hasPermanentQr: true
    } as any);

    const renewedQrImage = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(renewedQrPayload)}`;

    await fetch(`${SUPABASE_URL}/rest/v1/${qrCodes}?city_plate_number=eq.${encodeURIComponent(plate)}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({
        qr_payload: renewedQrPayload,
        qr_code_image_url: renewedQrImage,
        generated_at: new Date().toISOString()
      })
    });
  } catch (e) {
    console.warn('Error patching renewal in system_qr_codes:', e);
  }
}

/** 5.1 Auto-sync expired driver records and update QR codes to Status: Expired */
export async function syncExpiredFranchiseRecordsInSupabase(recordsList?: FranchiseRecord[], category: VehicleCategory = 'Tricycle') {
  const { records, qrCodes } = getTableNames(category);
  const targets = (recordsList && recordsList.length > 0)
    ? recordsList.filter(r => r.vehicleCategory === category && isRecordExpired(r.expirationDate))
    : [];

  if (targets.length === 0) return;

  for (const f of targets) {
    const plate = f.cityPlateNumber || f.mtopNumber;
    const expiredPayload = buildPermanentQrPayload({ ...f, status: 'Expired' });
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(expiredPayload)}`;

    // 1. Update QR code table (which mobile phone scanner reads and displays)
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/${qrCodes}?city_plate_number=eq.${encodeURIComponent(plate)}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
          qr_payload: expiredPayload,
          qr_code_image_url: qrImageUrl,
          generated_at: new Date().toISOString()
        })
      });
    } catch (e) {
      console.warn(`[Supabase] Could not update expired QR payload for ${plate}:`, e);
    }

    // 2. Update master franchise record status to Expired
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/${records}?city_plate_number=eq.${encodeURIComponent(plate)}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
          status: 'Expired',
          updated_at: new Date().toISOString()
        })
      });
    } catch (e) {
      console.warn(`[Supabase] Could not update expired status for ${plate}:`, e);
    }
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
  const res = await postToTable(violations, payload);

  // Also increment violation count on master record if present
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

/** 7. Fetch violations across active violation tables */
export async function fetchViolationsFromSupabase(_category: VehicleCategory = 'Tricycle'): Promise<ViolationRecord[]> {
  const targetTables = ['violations_tricycle_admin', 'violations_pedicab_admin'];
  const allViolations: ViolationRecord[] = [];
  const seenIds = new Set<string>();

  for (const table of targetTables) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&order=created_at.desc`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          const tblCategory = table.includes('tri') ? 'Tricycle' : 'Pedicab';
          data.forEach((v: any) => {
            if (v.id && !seenIds.has(v.id)) {
              seenIds.add(v.id);
              allViolations.push({
                id: v.id,
                franchiseId: v.franchise_id || '',
                cityPlateNumber: v.city_plate_number || v.mtop_number || '',
                mtopNumber: v.city_plate_number || v.mtop_number || '',
                plateNumber: v.plate_number || '',
                operatorName: v.operator_name || 'Registered Operator',
                driverName: v.driver_name || 'Designated Driver',
                violationType: v.violation_type || v.issue_type || 'Reported Infraction',
                location: v.location || 'Tabaco City',
                fineAmount: Number(v.fine_amount) || (tblCategory === 'Pedicab' ? 300 : 500),
                enforcerName: v.enforcer_name || 'Citizen Report / TRD Review',
                reportedBy: v.reported_by || v.complainant_name || 'andrie30311',
                dateSubmitted: v.date_submitted || (v.created_at ? v.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
                remarks: v.remarks || v.description || '',
                status: v.status || 'Pending'
              });
            }
          });
        }
      }
    } catch (e) {
      console.warn(`Error fetching ${table}:`, e);
    }
  }

  return allViolations;
}

/** Resilient PATCH with column fallback */
export async function patchWithFallback(table: string, idQuery: string, payload: Record<string, any>) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${idQuery}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const text = await res.text();
      return text ? JSON.parse(text) : [{ success: true, ...payload }];
    }

    console.warn(`[Supabase PATCH Failed] Table ${table} (${idQuery}): status ${res.status}`);

    // If 400, 401, or 403 (e.g. column missing or database trigger RLS failure on mobile_notifications):
    // Fallback 1: Try admin_decision if present (bypasses notification trigger on passenger_complaints)
    if ((res.status === 400 || res.status === 401 || res.status === 403) && payload.admin_decision) {
      try {
        const decisionRes = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${idQuery}`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify({
            admin_decision: payload.admin_decision,
            updated_at: payload.updated_at || new Date().toISOString()
          })
        });
        if (decisionRes.ok) {
          const dText = await decisionRes.text();
          return dText ? JSON.parse(dText) : [{ success: true, admin_decision: payload.admin_decision }];
        }
      } catch (decErr) {
        console.warn('Fallback admin_decision patch error:', decErr);
      }
    }

    // Fallback 2: Retry with core minimal fields
    if (res.status === 400 && payload.status) {
      const minimalPayload: any = { status: payload.status };
      if (payload.remarks) minimalPayload.remarks = payload.remarks;
      if (payload.updated_at) minimalPayload.updated_at = payload.updated_at;
      
      const retryRes = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${idQuery}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(minimalPayload)
      });
      if (retryRes.ok) {
        const rText = await retryRes.text();
        return rText ? JSON.parse(rText) : [{ success: true, ...minimalPayload }];
      }

      // Final fallback with only status
      const statusOnlyRes = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${idQuery}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: payload.status })
      });
      if (statusOnlyRes.ok) {
        const sText = await statusOnlyRes.text();
        return sText ? JSON.parse(sText) : [{ success: true, status: payload.status }];
      }
    }
  } catch (err) {
    console.error(`[Supabase Network Error] PATCH on ${table}:`, err);
  }
  return null;
}

/** Helper to broadcast mobile notification in Supabase */
export async function sendMobileNotificationInSupabase(data: {
  recipient_type: 'passenger' | 'enforcer' | 'all';
  recipient_username?: string;
  title: string;
  message: string;
  record_type: 'violation' | 'complaint' | 'review' | 'general';
  record_id?: string;
  plate_number?: string;
  status: string;
}) {
  const payload = {
    recipient_type: data.recipient_type,
    recipient_username: data.recipient_username || 'all',
    title: data.title,
    message: data.message,
    record_type: data.record_type,
    record_id: data.record_id,
    plate_number: data.plate_number,
    status: data.status,
    is_read: false,
    created_at: new Date().toISOString()
  };

  try {
    await postToTable('mobile_notifications', payload);
  } catch (e) {
    console.warn('Could not post to mobile_notifications:', e);
  }
}

/** Update violation status in Supabase and sync with mobile */
export async function updateViolationStatusInSupabase(
  violationId: string, 
  status: 'Pending' | 'Settled' | 'Under Investigation',
  category: VehicleCategory = 'Tricycle',
  details?: { enforcerName?: string; reportedBy?: string; plateNumber?: string; violationType?: string; remarks?: string }
) {
  const targetTables = category === 'Pedicab'
    ? ['violations_pedicab_admin', 'violations_tricycle_admin', 'enforcer_violations']
    : ['violations_tricycle_admin', 'violations_pedicab_admin', 'enforcer_violations'];

  const updatePayload: any = {
    status,
    updated_at: new Date().toISOString()
  };
  if (details?.remarks) {
    updatePayload.remarks = details.remarks;
  }
  if (status === 'Settled') {
    updatePayload.settled_date = new Date().toISOString().split('T')[0];
  }

  let res: any = null;
  let patched = false;

  for (const tbl of targetTables) {
    try {
      const r = await patchWithFallback(tbl, `id=eq.${encodeURIComponent(violationId)}`, updatePayload);
      if (r && (!Array.isArray(r) || r.length > 0)) {
        res = r;
        patched = true;
        break;
      }
    } catch (e) {
      console.warn(`Could not update violation in ${tbl}:`, e);
    }
  }

  // Fallback to match by plate number if ID did not match
  if (!patched && details?.plateNumber) {
    for (const tbl of targetTables) {
      try {
        const r = await patchWithFallback(tbl, `city_plate_number=eq.${encodeURIComponent(details.plateNumber)}&status=eq.Pending`, updatePayload);
        if (r && (!Array.isArray(r) || r.length > 0)) {
          res = r;
          patched = true;
          break;
        }
      } catch {}
    }
  }

  try {
    // Send real-time notification to Enforcer and Reporter Mobile System
    const title = `Citation Decision: ${status}`;
    const msg = `Violation citation (${details?.violationType || 'Infraction'}) for plate ${details?.plateNumber || ''} has been marked as [${status}].`;

    await sendMobileNotificationInSupabase({
      recipient_type: 'enforcer',
      recipient_username: details?.enforcerName || details?.reportedBy,
      title,
      message: msg,
      record_type: 'violation',
      record_id: violationId,
      plate_number: details?.plateNumber,
      status
    });

    if (details?.reportedBy) {
      await sendMobileNotificationInSupabase({
        recipient_type: 'passenger',
        recipient_username: details.reportedBy,
        title: `Report Status: ${status}`,
        message: `Your violation report for plate ${details?.plateNumber || ''} is now marked as [${status}].`,
        record_type: 'violation',
        record_id: violationId,
        plate_number: details?.plateNumber,
        status
      });
    }
  } catch (e) {
    console.warn('Mobile notification notice:', e);
  }

  return res;
}

/** Delete violation in Supabase */
export async function deleteViolationInSupabase(
  violationId: string,
  category: VehicleCategory = 'Tricycle',
  evidenceImageUrl?: string
) {
  const { violations } = getTableNames(category);
  try {
    // Purge from storage if uploaded to bucket
    if (evidenceImageUrl && evidenceImageUrl.includes('/storage/v1/object/public/complaint_evidence/')) {
      const storagePath = evidenceImageUrl.split('/storage/v1/object/public/complaint_evidence/')[1];
      if (storagePath) {
        try {
          await fetch(`${SUPABASE_URL}/storage/v1/object/complaint_evidence/${storagePath}`, {
            method: 'DELETE',
            headers: getHeaders()
          });
        } catch {}
      }
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/${violations}?id=eq.${encodeURIComponent(violationId)}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.ok;
  } catch (e) {
    console.warn('Could not delete violation in Supabase:', e);
    return false;
  }
}

/** Delete franchise master record and associated QR code in Supabase */
export async function deleteFranchiseRecordInSupabase(
  id: string,
  plateNumber: string,
  category: VehicleCategory = 'Tricycle'
) {
  const { records, qrCodes } = getTableNames(category);
  const plate = plateNumber.trim();
  const isValidUuid = id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  try {
    // 1. Delete associated QR code
    if (isValidUuid) {
      await fetch(`${SUPABASE_URL}/rest/v1/${qrCodes}?franchise_id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getHeaders()
      }).catch(() => {});
    }
    if (plate) {
      await fetch(`${SUPABASE_URL}/rest/v1/${qrCodes}?city_plate_number=eq.${encodeURIComponent(plate)}`, {
        method: 'DELETE',
        headers: getHeaders()
      }).catch(() => {});
    }

    // 2. Delete master franchise record
    if (isValidUuid) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${records}?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) return true;
    }

    if (plate) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${records}?city_plate_number=eq.${encodeURIComponent(plate)}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return res.ok;
    }
  } catch (e) {
    console.warn(`Could not delete franchise record ${id} / ${plateNumber} in Supabase:`, e);
  }
  return false;
}

/** 8. Update driver info directly on the master franchise record */
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

/** 9. Mark status Deactivated directly on the master franchise record */
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
    return data.map((c: any) => {
      const evidenceImg = c.evidence_image || c.evidence_url || c.attachment_url || undefined;
      const evidenceFile = c.evidence_filename || c.attachment_name || undefined;

      const descriptionMsg: ComplaintChatMessage = {
        id: `msg-desc-${c.id}`,
        sender: 'complainant',
        senderName: c.complainant_name || 'Anonymous Citizen',
        message: c.description || 'Passenger report submitted from mobile web',
        timestamp: c.created_at || new Date().toISOString(),
        image: evidenceImg,
        filename: evidenceFile,
      };
      // Resolve status: if admin_decision or status is Escalated or Resolved, honor it
      const rawStatus = (c.admin_decision || c.status || 'Under Investigation').toString().trim();
      const resolvedStatus = (
        rawStatus.toLowerCase().includes('resolve') ? 'Resolved' :
        rawStatus.toLowerCase().includes('escalat') ? 'Escalated' :
        'Under Investigation'
      );

      return {
        id: c.id,
        complainantName: c.complainant_name || 'Anonymous Citizen',
        contactNumber: c.contact_number || '—',
        cityPlateNumber: c.city_plate_number || c.mtop_number || '—',
        mtopNumber: c.mtop_number || c.city_plate_number || '—',
        vehicleCategory: c.vehicle_category || (c.city_plate_number?.startsWith('P-') ? 'Pedicab' : 'Tricycle'),
        incidentDate: c.incident_date || (c.created_at ? c.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
        issueType: c.issue_type || 'Report Overcharging',
        description: c.description || 'Passenger report submitted from mobile web',
        evidenceImage: evidenceImg,
        evidenceFilename: evidenceFile,
        adminRemarks: c.admin_response || (c.admin_decision && c.admin_decision !== resolvedStatus ? c.admin_decision : undefined) || undefined,
        status: resolvedStatus as any,
        chatMessages: [descriptionMsg],
      } as PassengerComplaint;
    });
  } catch (e) {
    console.error('Supabase Fetch Passenger Complaints Error:', e);
    return [];
  }
}

/** 11. Update status of passenger complaint in Supabase and notify the reporter */
export async function updatePassengerComplaintStatusInSupabase(
  id: string, 
  status: 'Under Investigation' | 'Resolved' | 'Escalated',
  details?: { complainantName?: string; cityPlateNumber?: string; issueType?: string; adminRemarks?: string }
) {
  try {
    const patchPayload: any = {
      status,
      admin_decision: status,
      updated_at: new Date().toISOString(),
      admin_response: details?.adminRemarks || `Status updated to ${status} by TRD Administration.`
    };

    let res = await patchWithFallback('passenger_complaints', `id=eq.${encodeURIComponent(id)}`, patchPayload);

    // If primary patch failed (e.g. database trigger crash on status/admin_response due to mobile_notifications RLS),
    // immediately patch admin_decision which doesn't fire the problematic trigger
    if (!res) {
      console.warn(`[Supabase Status Fallback] Primary update failed for complaint ${id}. Retrying with admin_decision...`);
      res = await patchWithFallback('passenger_complaints', `id=eq.${encodeURIComponent(id)}`, {
        admin_decision: status,
        updated_at: new Date().toISOString()
      });
    }

    if (details?.adminRemarks) {
      await postToTable('complaint_messages', {
        complaint_id: id,
        sender: 'admin',
        sender_name: 'TRD Administration',
        message: details.adminRemarks,
        created_at: new Date().toISOString()
      }).catch((e) => console.warn('Could not post complaint message:', e));
    }

    // Send real-time notification to Passenger Mobile App
    const title = `Report Decision: ${status}`;
    const msg = details?.adminRemarks
      ? `TRD Decision [${status}]: ${details.adminRemarks}`
      : `Your passenger report regarding Plate ${details?.cityPlateNumber || ''} (${details?.issueType || 'Report'}) is now marked as [${status}].`;

    await sendMobileNotificationInSupabase({
      recipient_type: 'passenger',
      recipient_username: details?.complainantName,
      title,
      message: msg,
      record_type: 'complaint',
      record_id: id,
      plate_number: details?.cityPlateNumber,
      status
    }).catch(() => {});

    return res;
  } catch (e) {
    console.warn('Could not update passenger complaint in Supabase:', e);
  }
  return null;
}

/** Save admin reply message to passenger complaint in Supabase and notify mobile app */
export async function saveComplaintReplyInSupabase(
  complaintId: string, 
  message: string, 
  adminName: string = 'TRD Admin',
  details?: { complainantName?: string; cityPlateNumber?: string }
) {
  try {
    await patchWithFallback('passenger_complaints', `id=eq.${encodeURIComponent(complaintId)}`, {
      admin_response: message,
      updated_at: new Date().toISOString()
    });

    await postToTable('complaint_messages', {
      complaint_id: complaintId,
      sender: 'admin',
      sender_name: adminName,
      message: message,
      created_at: new Date().toISOString()
    });

    await sendMobileNotificationInSupabase({
      recipient_type: 'passenger',
      recipient_username: details?.complainantName,
      title: 'New Reply from TRD Admin',
      message: `${adminName}: "${message.substring(0, 80)}${message.length > 80 ? '...' : ''}"`,
      record_type: 'complaint',
      record_id: complaintId,
      plate_number: details?.cityPlateNumber,
      status: 'Reply'
    });
  } catch (e) {
    console.warn('Could not save complaint reply in Supabase:', e);
  }
}

/** 11.5 Update status of pending application review in Supabase and notify applicant */
export async function updatePendingReviewStatusInSupabase(
  reviewId: string,
  status: 'Approved' | 'Rejected',
  notes?: string,
  details?: { applicantName?: string; cityPlateAssigned?: string; vehicleCategory?: string }
) {
  try {
    const payload = {
      status,
      review_notes: notes || `Application marked as ${status} by TRD Administration.`,
      updated_at: new Date().toISOString()
    };
    await patchWithFallback('pending_reviews', `id=eq.${encodeURIComponent(reviewId)}`, payload);

    await sendMobileNotificationInSupabase({
      recipient_type: 'passenger',
      recipient_username: details?.applicantName,
      title: `Application ${status}`,
      message: `Your franchise application for ${details?.vehicleCategory || 'Vehicle'} (Plate ${details?.cityPlateAssigned || ''}) was ${status}.${notes ? ` Remarks: ${notes}` : ''}`,
      record_type: 'review',
      record_id: reviewId,
      plate_number: details?.cityPlateAssigned,
      status
    });
  } catch (e) {
    console.warn('Could not update pending review in Supabase:', e);
  }
}

/** Delete passenger complaint in Supabase */
export async function deletePassengerComplaintFromSupabase(id: string, evidenceImageUrl?: string) {
  try {
    if (evidenceImageUrl && evidenceImageUrl.includes('/storage/v1/object/public/complaint_evidence/')) {
      const storagePath = evidenceImageUrl.split('/storage/v1/object/public/complaint_evidence/')[1];
      if (storagePath) {
        try {
          await fetch(`${SUPABASE_URL}/storage/v1/object/complaint_evidence/${storagePath}`, {
            method: 'DELETE',
            headers: getHeaders()
          });
        } catch (storageErr) {
          console.warn('Storage purge notice:', storageErr);
        }
      }
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/passenger_complaints?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.ok;
  } catch (e) {
    console.warn('Could not delete passenger complaint in Supabase:', e);
    return false;
  }
}

/** 12. Fetch pending reviews submitted for admin approval */
export async function fetchPendingReviewsFromSupabase(): Promise<PendingReview[]> {
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
    return data.map((row: any): PendingReview => ({
      id: row.id,
      applicantName: row.applicant_name || row.operator_name || 'Applicant',
      vehicleCategory: row.vehicle_category || (row.city_plate_assigned?.startsWith('P-') ? 'Pedicab' : 'Tricycle'),
      dateSubmitted: row.date_submitted || (row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
      applicationType: row.application_type || 'New Registration',
      contactNumber: row.contact_number || row.operator_contact || '—',
      address: row.address || row.residential_address || '—',
      cityPlateAssigned: row.city_plate_assigned || row.city_plate_number || row.mtop_number || '',
      mtopAssigned: row.mtop_assigned || row.mtop_number || row.city_plate_number || '',
      documents: Array.isArray(row.documents) ? row.documents : [
        { id: 'doc-1', title: 'Barangay Clearance', type: 'PDF / Image', verified: true },
        { id: 'doc-2', title: "Driver's Professional License", type: 'Image', verified: true },
        { id: 'doc-3', title: 'LTO Official Receipt / Certificate of Registration', type: 'PDF', verified: true }
      ],
      status: row.status || 'Pending Document Review',
      reviewNotes: row.review_notes || undefined,
    }));
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

/** 14. Fetch registered administrator accounts across browsers from Supabase */
export async function fetchAdminAccountsFromSupabase(): Promise<AdminAccount[]> {
  const accounts: AdminAccount[] = [];

  // 1. Try fetching from dedicated admin_accounts table
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/admin_accounts?select=*`, { headers: getHeaders() });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        for (const row of data) {
          accounts.push({
            adminId: row.admin_id || row.adminId,
            name: row.name || row.fullname,
            email: row.email || `${(row.admin_id || 'admin').toLowerCase()}@tabaco.gov.ph`,
            role: row.role || 'Administrator',
            department: row.department || 'Transportation Regulation Division',
            password: row.password,
            createdAt: row.created_at || new Date().toISOString()
          });
        }
        return accounts;
      }
    }
  } catch {}

  // 2. Also check account_enforcer_mobile where enforcer/admin accounts are stored in Supabase
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/account_enforcer_mobile?select=*`, { headers: getHeaders() });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        for (const row of data) {
          const uname = String(row.username || '').trim();
          const rawName = String(row.fullname || uname).trim();
          let parsedName = rawName;
          let parsedEmail = `${uname.toLowerCase()}@tabaco.gov.ph`;
          const emailMatch = rawName.match(/\[(.*?)\]/);
          if (emailMatch && emailMatch[1]) {
            parsedEmail = emailMatch[1].trim().toLowerCase();
            parsedName = rawName.replace(/\[(.*?)\]/, '').trim();
          }

          accounts.push({
            adminId: uname.toUpperCase(),
            name: parsedName || uname,
            email: parsedEmail,
            role: 'Traffic Enforcer / Administrator',
            department: 'Transportation Regulation Division',
            password: row.password,
            createdAt: row.created_at || new Date().toISOString()
          });
        }
      }
    }
  } catch {}

  // 3. Also check account_passenger_mobile so any registered user can be recognized
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/account_passenger_mobile?select=*`, { headers: getHeaders() });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        for (const row of data) {
          const uname = String(row.username || '').trim();
          const rawName = String(row.fullname || uname).trim();
          let parsedName = rawName;
          let parsedEmail = `${uname.toLowerCase()}@passenger.tabaco.gov.ph`;
          const emailMatch = rawName.match(/\[(.*?)\]/);
          if (emailMatch && emailMatch[1]) {
            parsedEmail = emailMatch[1].trim().toLowerCase();
            parsedName = rawName.replace(/\[(.*?)\]/, '').trim();
          }

          accounts.push({
            adminId: uname.toUpperCase(),
            name: parsedName || uname,
            email: parsedEmail,
            role: 'Registered User',
            department: 'Citizen & Commuter Portal',
            password: row.password,
            createdAt: row.created_at || new Date().toISOString()
          });
        }
      }
    }
  } catch {}

  return accounts;
}

/** 15. Save registered administrator account into Supabase for global multi-browser access */
export async function saveAdminAccountInSupabase(account: AdminAccount): Promise<boolean> {
  const cleanId = account.adminId.trim().toUpperCase();
  const cleanName = account.name.trim();
  const cleanEmail = account.email ? account.email.trim().toLowerCase() : '';
  const storedFullname = cleanEmail ? `${cleanName} [${cleanEmail}]` : cleanName;

  // 1. Try saving to admin_accounts table
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/admin_accounts`, {
      method: 'POST',
      headers: {
        ...getHeaders(),
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify({
        admin_id: cleanId,
        name: cleanName,
        email: cleanEmail,
        role: account.role || 'Administrator',
        department: account.department || 'Transportation Regulation Division',
        password: account.password
      })
    });
    if (res.ok) return true;
  } catch {}

  // 2. Also save to account_enforcer_mobile so it is immediately accessible from ANY browser or device!
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/account_enforcer_mobile`, {
      method: 'POST',
      headers: {
        ...getHeaders(),
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify({
        username: cleanId,
        fullname: storedFullname,
        password: account.password
      })
    });
    if (res.ok) return true;
  } catch (err) {
    console.warn('Failed to save admin to account_enforcer_mobile:', err);
  }

  return false;
}

