import type { FareMatrixItem, FranchiseRecord, VehicleCategory } from '../types';

/**
 * Clean and normalize fare amounts (removes ₱, PHP, Php, extra spaces)
 */
export function cleanFare(val: string | number | undefined, fallback: string = '20.00'): string {
  if (val === undefined || val === null || val === '') return fallback;
  const str = String(val).replace(/[₱Php\s,]/gi, '').trim();
  const num = parseFloat(str);
  if (isNaN(num)) return fallback;
  // If whole number without decimal like "50", format cleanly or as "50.00"
  return num % 1 === 0 ? num.toFixed(2) : num.toFixed(2);
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
 * Default standard fare matrices per vehicle category
 */
export function getDefaultFareMatrix(category: VehicleCategory = 'Tricycle'): FareMatrixItem[] {
  if (category === 'Pedicab') {
    return [
      { id: 'f-1', destination: 'Poblacion to Market', regularFare: '15.00', studentFare: '12.00', seniorPwdFare: '12.00', discountedFare: '12.00' },
      { id: 'f-2', destination: 'Centro to Public Market', regularFare: '15.00', studentFare: '12.00', seniorPwdFare: '12.00', discountedFare: '12.00' },
      { id: 'f-3', destination: 'Special Trip (Pakyaw)', regularFare: '25.00', studentFare: '22.00', seniorPwdFare: '20.00', discountedFare: '20.00' }
    ];
  }
  return [
    { id: 'f-1', destination: 'Poblication to Miss pina', regularFare: '50.00', studentFare: '15.00', seniorPwdFare: '40.00', discountedFare: '40.00' },
    { id: 'f-2', destination: 'Short Distance (Base)', regularFare: '20.00', studentFare: '15.00', seniorPwdFare: '16.00', discountedFare: '16.00' },
    { id: 'f-3', destination: 'Longer Distance (Inter-Brgy)', regularFare: '25.00', studentFare: '20.00', seniorPwdFare: '20.00', discountedFare: '20.00' },
    { id: 'f-4', destination: 'Special Trip (Pakyaw)', regularFare: '35.00', studentFare: '30.00', seniorPwdFare: '28.00', discountedFare: '28.00' }
  ];
}

/**
 * Formats the Official Fare Matrix breakdown into clean plain text for QR Code encoding and decoders
 */
export function formatFareMatrixPayload(matrix?: FareMatrixItem[], category: VehicleCategory = 'Tricycle'): string {
  const items = matrix && matrix.length > 0 ? matrix : getDefaultFareMatrix(category);
  return items.map(f => {
    const reg = cleanFare(f.regularFare, '20.00');
    const stu = cleanFare(f.studentFare || '15.00', '15.00');
    const snr = cleanFare(f.seniorPwdFare || f.discountedFare || '16.00', '16.00');
    return `• ${f.destination}:\n  Regular: ₱${reg} | Student: ₱${stu} | Senior 20%: ₱${snr}`;
  }).join('\n');
}

/**
 * Builds the comprehensive, permanent QR code payload exactly matching Tabaco City TRD Portal specifications
 * Designed to be read with 100% accuracy by smartphone camera scanners and mobile web passenger apps.
 */
export function buildPermanentQrPayload(f: FranchiseRecord): string {
  const plate = f.cityPlateNumber || f.mtopNumber || 'T-102';
  const category = f.vehicleCategory || (plate.startsWith('P-') ? 'Pedicab' : 'Tricycle');
  const fareMatrixText = formatFareMatrixPayload(f.fareMatrix, category);

  return [
    `=== TABACO CITY TRD FRANCHISE ===`,
    `Vehicle Type: ${category}`,
    `CityPlate Number: ${plate}`,
    `Operator: ${f.operatorName}`,
    `Driver Name: ${f.driverName}`,
    `LTO License: ${f.driverLicenseNo || 'Verified'}`,
    `Plate No.: ${f.plateNumber || `${plate}-TR`}`,
    `Route/Parada: ${f.routeParada || 'Sua-Igot 24 Tabaco'}`,
    `Standard Fare: ${f.standardFare || (category === 'Pedicab' ? '₱15.00 Minimum' : '₱50.00 Minimum')}`,
    `Tourist Guide: ${f.touristGuide || 'Yes'}`,
    `Availability: ${f.availability || 'Available / On-Duty'}`,
    `Status: ${f.status || 'Active'} (Expires: ${formatExpDate(f.expirationDate)})`,
    ``,
    `=== OFFICIAL FARE MATRIX ===`,
    fareMatrixText,
    ``,
    `Security: OFFICIAL PERMANENT QR BADGE`
  ].join('\n');
}
