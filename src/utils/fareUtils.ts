import type { FareMatrixItem, FranchiseRecord, VehicleCategory, FranchiseStatus } from '../types';

/**
 * Clean and normalize fare amounts (removes ₱, PHP, Php, extra spaces)
 */
export function cleanFare(val: string | number | undefined, fallback: string = '20.00'): string {
  if (val === undefined || val === null || val === '') return fallback;
  const str = String(val).replace(/[₱Php\s,]/gi, '').trim();
  const num = parseFloat(str);
  if (isNaN(num) || num <= 0) return fallback;
  return num.toFixed(2);
}

/**
 * Calculate mandatory 20% discount for Students, Senior Citizens & PWDs based on regular fare
 */
export function calculate20PercentDiscount(regularVal: string | number | undefined, fallbackRegular: string = '20.00'): string {
  const regStr = cleanFare(regularVal, fallbackRegular);
  const regNum = parseFloat(regStr);
  if (isNaN(regNum) || regNum <= 0) return '16.00';
  return (regNum * 0.8).toFixed(2);
}

/**
 * Format expiration date to MM/DD/YYYY or human friendly date
 */
export function formatExpDate(dateStr?: string): string {
  if (!dateStr) return '12/31/2026';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[1]}/${parts[2]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Checks if a driver's record expiration date has passed today's date
 */
export function isRecordExpired(dateStr?: string): boolean {
  if (!dateStr || !dateStr.trim()) return false;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let expYear: number;
    let expMonth: number;
    let expDay: number;

    const trimmed = dateStr.trim();
    if (trimmed.includes('-')) {
      const parts = trimmed.split('-');
      if (parts.length >= 3) {
        expYear = parseInt(parts[0], 10);
        expMonth = parseInt(parts[1], 10) - 1;
        expDay = parseInt(parts[2], 10);
      } else {
        return false;
      }
    } else if (trimmed.includes('/')) {
      const parts = trimmed.split('/');
      if (parts.length >= 3) {
        expMonth = parseInt(parts[0], 10) - 1;
        expDay = parseInt(parts[1], 10);
        expYear = parseInt(parts[2], 10);
      } else {
        return false;
      }
    } else {
      const d = new Date(trimmed);
      if (isNaN(d.getTime())) return false;
      d.setHours(0, 0, 0, 0);
      return d.getTime() < today.getTime();
    }

    const expDate = new Date(expYear, expMonth, expDay);
    expDate.setHours(0, 0, 0, 0);
    return expDate.getTime() < today.getTime();
  } catch {
    return false;
  }
}

/**
 * Resolves the real-time franchise status based on expiration date and record state
 */
export function resolveFranchiseStatus(status?: string, expirationDate?: string): FranchiseStatus {
  if (status === 'Deactivated') return 'Deactivated';
  if (isRecordExpired(expirationDate)) return 'Expired';
  if (status === 'Under Review' || status === 'Pending Renewal' || status === 'Active') {
    return status as FranchiseStatus;
  }
  return 'Active';
}

/**
 * Default standard municipal fare matrices per vehicle category
 */
export function getDefaultFareMatrix(category: VehicleCategory = 'Tricycle'): FareMatrixItem[] {
  if (category === 'Pedicab') {
    return [
      { id: 'f-1', destination: 'Poblacion to Market', regularFare: '15.00', studentFare: '12.00', seniorPwdFare: '12.00', discountedFare: '12.00' },
      { id: 'f-2', destination: 'Centro to Public Market', regularFare: '15.00', studentFare: '12.00', seniorPwdFare: '12.00', discountedFare: '12.00' },
      { id: 'f-3', destination: 'Special Trip (Pakyaw)', regularFare: '25.00', studentFare: '20.00', seniorPwdFare: '20.00', discountedFare: '20.00' }
    ];
  }
  return [
    { id: 'f-1', destination: 'Short Distance (Base)', regularFare: '20.00', studentFare: '16.00', seniorPwdFare: '16.00', discountedFare: '16.00' },
    { id: 'f-2', destination: 'Poblacion to Miss pina', regularFare: '50.00', studentFare: '40.00', seniorPwdFare: '40.00', discountedFare: '40.00' },
    { id: 'f-3', destination: 'Longer Distance (Inter-Brgy)', regularFare: '25.00', studentFare: '20.00', seniorPwdFare: '20.00', discountedFare: '20.00' },
    { id: 'f-4', destination: 'Special Trip (Pakyaw)', regularFare: '35.00', studentFare: '28.00', seniorPwdFare: '28.00', discountedFare: '28.00' }
  ];
}

/**
 * Formats the Official Fare Matrix breakdown into clean plain text for QR Code encoding and decoders
 */
export function formatFareMatrixPayload(matrix?: FareMatrixItem[], category: VehicleCategory = 'Tricycle'): string {
  const items = matrix && matrix.length > 0 ? matrix : getDefaultFareMatrix(category);
  const fallback = category === 'Pedicab' ? '15.00' : '20.00';
  
  return items.map(f => {
    const reg = cleanFare(f.regularFare, fallback);
    const regNum = parseFloat(reg);
    const default20Discount = (regNum * 0.8).toFixed(2);
    const stu = cleanFare(f.studentFare, default20Discount);
    const snr = cleanFare(f.seniorPwdFare || f.discountedFare, default20Discount);
    return `• ${f.destination}:\n  Regular: ₱${reg} | Student: ₱${stu} | Senior 20%: ₱${snr} | Senior/PWD: ₱${snr} | Discounted: ₱${snr}`;
  }).join('\n');
}

export const DEFAULT_MOBILE_VERIFIER_URL = 'https://franchise-management-system-mobile.vercel.app';

export function getMobileVerifierBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('tabaco_trd_mobile_verifier_url');
    if (custom && custom.trim()) return custom.trim();
  }
  return (import.meta as any).env?.VITE_MOBILE_VERIFIER_URL || DEFAULT_MOBILE_VERIFIER_URL;
}

export function setMobileVerifierBaseUrl(url: string): void {
  if (typeof window !== 'undefined') {
    if (url && url.trim()) {
      localStorage.setItem('tabaco_trd_mobile_verifier_url', url.trim());
    } else {
      localStorage.removeItem('tabaco_trd_mobile_verifier_url');
    }
  }
}

/**
 * Builds the permanent QR code payload as a direct HTTPS Web URL.
 * When scanned by Google Lens, Samsung Camera, iPhone Camera, or any built-in mobile camera scanner,
 * the mobile phone instantly detects a valid web link, prompts "Open in browser",
 * and automatically displays the verified franchise record page (Pedicab / Tricycle Verified Unit).
 */
export function buildPermanentQrPayload(f: FranchiseRecord): string {
  const plate = f.cityPlateNumber || f.mtopNumber || 'T-102';
  const category = f.vehicleCategory || (plate.startsWith('P-') ? 'Pedicab' : 'Tricycle');
  const matrix = f.fareMatrix && f.fareMatrix.length > 0 ? f.fareMatrix : getDefaultFareMatrix(category);
  const expDateStr = f.expirationDate || '2027-01-15';
  const resolvedStatus = resolveFranchiseStatus(f.status, expDateStr);

  const defaultBaseFare = category === 'Pedicab' ? '15.00' : '20.00';
  const firstRouteFare = matrix[0]?.regularFare ? cleanFare(matrix[0].regularFare, defaultBaseFare) : defaultBaseFare;
  const standardFareText = f.standardFare && !f.standardFare.includes('50.00 Minimum')
    ? f.standardFare 
    : `₱${firstRouteFare} Minimum`;

  try {
    const baseUrl = getMobileVerifierBaseUrl().replace(/\/+$/, '');
    const url = new URL(baseUrl);
    url.searchParams.set('plate', plate);
    url.searchParams.set('type', category);
    url.searchParams.set('driver', f.driverName || '');
    url.searchParams.set('operator', f.operatorName || '');
    url.searchParams.set('route', f.routeParada || 'Sua-Igot 24 Tabaco');
    url.searchParams.set('exp', expDateStr);
    url.searchParams.set('status', resolvedStatus);
    url.searchParams.set('tg', f.touristGuide || 'Yes');
    url.searchParams.set('avail', f.availability || 'Available');
    url.searchParams.set('fare', standardFareText);
    return url.toString();
  } catch (err) {
    console.warn('Failed to build QR URL, falling back to clean URL string:', err);
    return `${DEFAULT_MOBILE_VERIFIER_URL}/?plate=${encodeURIComponent(plate)}&type=${encodeURIComponent(category)}`;
  }
}

/**
 * Builds legacy plain-text payload for reference or plain-text badge printing
 */
export function buildLegacyTextQrPayload(f: FranchiseRecord): string {
  const plate = f.cityPlateNumber || f.mtopNumber || 'T-102';
  const category = f.vehicleCategory || (plate.startsWith('P-') ? 'Pedicab' : 'Tricycle');
  const matrix = f.fareMatrix && f.fareMatrix.length > 0 ? f.fareMatrix : getDefaultFareMatrix(category);
  const fareMatrixText = formatFareMatrixPayload(matrix, category);
  const expDateStr = f.expirationDate || '2027-01-15';
  const resolvedStatus = resolveFranchiseStatus(f.status, expDateStr);

  const defaultBaseFare = category === 'Pedicab' ? '15.00' : '20.00';
  const firstRouteFare = matrix[0]?.regularFare ? cleanFare(matrix[0].regularFare, defaultBaseFare) : defaultBaseFare;
  const standardFareText = f.standardFare && !f.standardFare.includes('50.00 Minimum')
    ? f.standardFare 
    : `₱${firstRouteFare} Minimum`;

  return [
    `=== TABACO CITY TRD FRANCHISE ===`,
    `Vehicle Type: ${category}`,
    `City Plate Number: ${plate}`,
    `City Plate no.: ${plate}`,
    `CityPlate Number: ${plate}`,
    `Operator: ${f.operatorName}`,
    `Driver Name: ${f.driverName}`,
    `Plate No.: ${f.plateNumber || (category === 'Pedicab' ? `${plate}-PED` : `${plate}-TR`)}`,
    `Parada/Route: ${f.routeParada || 'Sua-Igot 24 Tabaco'}`,
    `Route/Parada: ${f.routeParada || 'Sua-Igot 24 Tabaco'}`,
    `Standard Fare: ${standardFareText}`,
    `Base Fare: ₱${firstRouteFare}`,
    `Tourist Guide: ${f.touristGuide || 'Yes'}`,
    `Availability: ${f.availability || 'Available / On-Duty'}`,
    `Status: ${resolvedStatus}`,
    `Expiry Date: ${expDateStr}`,
    `Expiration Date: ${expDateStr}`,
    ``,
    `=== OFFICIAL FARE MATRIX ===`,
    fareMatrixText,
    ``,
    `Security: OFFICIAL PERMANENT QR BADGE`
  ].join('\n');
}
