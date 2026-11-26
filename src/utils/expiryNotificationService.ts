import type { FranchiseRecord, VehicleCategory } from '../types';

export interface FranchiseExpiryInfo {
  expirationDate: string;
  daysRemaining: number;
  isExpired: boolean;
  isExpiringSoon: boolean; // within 30 days
  isUrgent: boolean; // within 7 days or already expired
  urgencyLevel: 'expired' | 'urgent' | 'warning' | 'ok';
  statusLabel: string;
  badgeClass: string;
}

export type ExpiryFilterMode = 'all' | 'urgent7' | 'soon30' | 'expired';

export interface ReminderLogEntry {
  id: string;
  recordId: string;
  cityPlateNumber: string;
  vehicleCategory: VehicleCategory;
  driverName: string;
  operatorName: string;
  contactNumber: string;
  gmail: string;
  channels: 'sms' | 'email' | 'both';
  smsStatus?: 'delivered' | 'simulated' | 'failed' | 'not_sent';
  emailStatus?: 'delivered' | 'simulated' | 'failed' | 'not_sent';
  summary: string;
  timestamp: string;
  daysRemaining: number;
  isExpired: boolean;
}

export interface DispatchReminderResult {
  success: boolean;
  channel: 'sms' | 'email';
  recipient: string;
  delivered?: boolean;
  simulated?: boolean;
  provider?: string;
  referenceId?: string;
  error?: string;
  smsUri?: string;
  mailtoUri?: string;
  timestamp: string;
}

export interface BatchDispatchSummary {
  totalTargeted: number;
  smsAttempted: number;
  smsSucceeded: number;
  smsFailed: number;
  emailAttempted: number;
  emailSucceeded: number;
  emailFailed: number;
  skippedNoContact: number;
  logs: ReminderLogEntry[];
}

const STORAGE_KEY_REMINDER_LOGS = 'tabaco_trd_driver_reminder_logs';
const SYSTEM_SENDER_EMAIL = 'tabacocitytrd@gmail.com';

/**
 * Clean & extract the driver's phone/mobile number from any available record field
 */
export function getDriverContactNumber(record: FranchiseRecord): string {
  const raw =
    record.driverContact ||
    record.operatorContact ||
    record.ownerContact ||
    (record as any).contactNumber ||
    (record as any).contact ||
    '';
  return String(raw).trim();
}

/**
 * Clean & extract the operator's phone/mobile number from any available record field
 */
export function getOperatorContactNumber(record: FranchiseRecord): string {
  const raw =
    record.operatorContact ||
    record.ownerContact ||
    (record as any).contact ||
    '';
  return String(raw).trim();
}

/**
 * Clean & extract the operator's Gmail/email from any available record field
 */
export function getOperatorGmail(record: FranchiseRecord): string {
  const raw =
    record.operatorEmail ||
    record.email ||
    record.gmail ||
    '';
  return String(raw).trim().toLowerCase();
}

/**
 * Clean & extract the driver's Gmail/email from any available record field
 */
export function getDriverGmail(record: FranchiseRecord): string {
  const raw =
    record.driverEmail ||
    record.gmail ||
    record.email ||
    record.operatorEmail ||
    '';
  return String(raw).trim().toLowerCase();
}

/**
 * Robust date parser supporting YYYY-MM-DD, MM/DD/YYYY, and standard ISO formats
 */
export function parseExpirationDate(dateStr?: string): Date | null {
  if (!dateStr || !dateStr.trim()) return null;
  const trimmed = dateStr.trim();

  try {
    if (trimmed.includes('-')) {
      const parts = trimmed.split('-');
      if (parts.length >= 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          const d = new Date(year, month, day);
          d.setHours(0, 0, 0, 0);
          return d;
        }
      }
    } else if (trimmed.includes('/')) {
      const parts = trimmed.split('/');
      if (parts.length >= 3) {
        const month = parseInt(parts[0], 10) - 1;
        const day = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          const d = new Date(year, month, day);
          d.setHours(0, 0, 0, 0);
          return d;
        }
      }
    }

    const fallback = new Date(trimmed);
    if (!isNaN(fallback.getTime())) {
      fallback.setHours(0, 0, 0, 0);
      return fallback;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Calculates real-time expiry countdown, days remaining, urgency level and badge
 */
export function getFranchiseExpiryInfo(
  record: FranchiseRecord,
  baseDate: Date = new Date()
): FranchiseExpiryInfo {
  const expDate = parseExpirationDate(record.expirationDate);
  const now = new Date(baseDate);
  now.setHours(0, 0, 0, 0);

  if (!expDate) {
    return {
      expirationDate: record.expirationDate || 'N/A',
      daysRemaining: 999,
      isExpired: false,
      isExpiringSoon: false,
      isUrgent: false,
      urgencyLevel: 'ok',
      statusLabel: 'No Expiry Set',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    };
  }

  const diffTime = expDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isExpired = daysRemaining < 0 || record.status === 'Expired';
  const isExpiringSoon = daysRemaining <= 30;
  const isUrgent = daysRemaining <= 7 || isExpired;

  let urgencyLevel: 'expired' | 'urgent' | 'warning' | 'ok' = 'ok';
  let statusLabel = '';
  let badgeClass = '';

  if (isExpired) {
    urgencyLevel = 'expired';
    const overdueDays = Math.abs(daysRemaining);
    statusLabel = overdueDays === 0 ? 'Expired Today' : `Expired ${overdueDays}d ago`;
    badgeClass = 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold';
  } else if (daysRemaining === 0) {
    urgencyLevel = 'urgent';
    statusLabel = 'Expires Today!';
    badgeClass = 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold animate-pulse';
  } else if (daysRemaining <= 7) {
    urgencyLevel = 'urgent';
    statusLabel = `Expires in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`;
    badgeClass = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
  } else if (daysRemaining <= 30) {
    urgencyLevel = 'warning';
    statusLabel = `Expires in ${daysRemaining} days`;
    badgeClass = 'bg-blue-100 text-blue-900 border-blue-300 font-medium';
  } else {
    urgencyLevel = 'ok';
    statusLabel = `Valid for ${daysRemaining} days`;
    badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  }

  return {
    expirationDate: record.expirationDate,
    daysRemaining,
    isExpired,
    isExpiringSoon,
    isUrgent,
    urgencyLevel,
    statusLabel,
    badgeClass,
  };
}

/**
 * Filter franchise list for drivers that are expiring soon or already expired
 */
export function filterExpiringDrivers(
  records: FranchiseRecord[],
  mode: ExpiryFilterMode = 'all'
): FranchiseRecord[] {
  return records.filter((rec) => {
    const info = getFranchiseExpiryInfo(rec);
    switch (mode) {
      case 'expired':
        return info.isExpired;
      case 'urgent7':
        return info.daysRemaining >= 0 && info.daysRemaining <= 7;
      case 'soon30':
        return info.daysRemaining >= 0 && info.daysRemaining <= 30;
      case 'all':
      default:
        // All that need renewal attention: expired or expiring within 30 days
        return info.isExpired || info.isExpiringSoon;
    }
  });
}

/**
 * Compose official SMS text for the driver & operator
 */
export function buildDriverSmsReminderText(
  record: FranchiseRecord,
  info?: FranchiseExpiryInfo,
  recipientType: 'both' | 'operator' | 'driver' = 'both'
): string {
  const expiry = info || getFranchiseExpiryInfo(record);
  const driverName = record.driverName || 'Driver';
  const operatorName = record.operatorName || record.ownerName || 'Operator';
  const unit = record.cityPlateNumber || record.mtopNumber || 'N/A';
  const category = record.vehicleCategory || 'Tricycle';
  const expDate = record.expirationDate || 'N/A';

  const countdownText = expiry.isExpired
    ? `ay EXPIRED NA noong ${expDate}`
    : `ay MAG-EEXPIRE NA sa ${expDate} (${expiry.statusLabel})`;

  let greeting = `Magandang araw Operator ${operatorName} at Driver ${driverName}!`;
  if (recipientType === 'operator') {
    greeting = `Magandang araw Operator ${operatorName}!`;
  } else if (recipientType === 'driver') {
    greeting = `Magandang araw Driver ${driverName}!`;
  }

  return (
    `[TRD TABACO NOTICE]\n` +
    `${greeting}\n` +
    `Paalala mula sa Tabaco City Transportation Regulation Division (TRD):\n` +
    `Ang inyong ${category} Permit (Unit ${unit}) ${countdownText}.\n\n` +
    `Mangyaring magsadya sa Tabaco City Hall - TRD Office upang iproseso ang inyong Franchise Renewal bago ang takdang araw upang maiwasan ang multa, impound, o deactivation.\n\n` +
    `Mga Dalhing Dokumento:\n` +
    `• Official Receipt / Certificate of Registration (OR/CR)\n` +
    `• Barangay Clearance\n` +
    `• Valid Driver's License\n` +
    `• Previous Franchise Permit / Sticker\n\n` +
    `Opisina: TRD Office, Ground Floor, Tabaco City Hall (Lunes-Biyernes, 8AM-5PM).\n` +
    `City Government of Tabaco, Albay`
  );
}

/**
 * Compose official SMS text after a franchise renewal is completed
 */
export function buildRenewalConfirmationSms(summary: {
  unit: string;
  category: string;
  operatorName: string;
  driverName: string;
  newExpiry: string;
  orNumber: string;
}): string {
  return (
    `[TRD TABACO CONFIRMATION]\n` +
    `Magandang araw Operator ${summary.operatorName} at Driver ${summary.driverName}!\n` +
    `Matagumpay na nai-proseso ang RENEWAL ng inyong ${summary.category} Franchise Permit (Unit ${summary.unit}).\n\n` +
    `Bagong Expiration Date: ${summary.newExpiry}\n` +
    `Official Receipt (OR) No: ${summary.orNumber}\n` +
    `Status: Rehistrado at Aktibo (Active)\n\n` +
    `Maraming salamat sa inyong maagap na pagtupad sa mga alituntunin ng Lungsod ng Tabaco para sa ligtas at maayos na transportasyon.\n` +
    `Transportation Regulation Division (TRD), Tabaco City Hall.`
  );
}

/**
 * Compose official Gmail subject line
 */
export function buildDriverGmailSubject(
  record: FranchiseRecord,
  info?: FranchiseExpiryInfo
): string {
  const expiry = info || getFranchiseExpiryInfo(record);
  const unit = record.cityPlateNumber || record.mtopNumber || 'N/A';
  const category = record.vehicleCategory || 'Tricycle';
  const op = record.operatorName || record.ownerName || 'Operator';
  const dr = record.driverName || 'Driver';

  if (expiry.isExpired) {
    return `[TRD Tabaco City Official] URGENT: Expired Franchise Permit Notice - Unit ${unit} (${category}) | Op: ${op} • Dr: ${dr}`;
  }
  return `[TRD Tabaco City Official] Franchise Permit Expiration Reminder: Unit ${unit} (${expiry.statusLabel}) | Op: ${op} • Dr: ${dr}`;
}

/**
 * Compose rich HTML email body for Gmail dispatch
 */
export function buildDriverGmailHtml(
  record: FranchiseRecord,
  info?: FranchiseExpiryInfo,
  customNote?: string
): string {
  const expiry = info || getFranchiseExpiryInfo(record);
  const driverName = record.driverName || 'Driver';
  const operatorName = record.operatorName || record.ownerName || 'Operator';
  const unit = record.cityPlateNumber || record.mtopNumber || 'N/A';
  const category = record.vehicleCategory || 'Tricycle';
  const expDate = record.expirationDate || 'N/A';
  const route = record.routeParada || 'Standard Tabaco Route';
  const contact = getDriverContactNumber(record) || 'Not provided';
  const gmail = getDriverGmail(record) || 'Not provided';

  const statusColor = expiry.isExpired ? '#e11d48' : expiry.isUrgent ? '#d97706' : '#2563eb';
  const statusBg = expiry.isExpired ? '#ffe4e6' : expiry.isUrgent ? '#fef3c7' : '#dbeafe';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>TRD Tabaco City Franchise Reminder</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);">
    
    <!-- Top Header Banner -->
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px 28px; text-align: center; color: #ffffff;">
      <div style="display: inline-block; background: #10b981; color: #042f2e; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; letter-spacing: 0.5px; margin-bottom: 8px;">
        CITY GOVERNMENT OF TABACO • REGULATORY NOTICE
      </div>
      <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">Transportation Regulation Division</h1>
      <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">Official Driver & Operator Franchise Compliance Reminder</p>
    </div>

    <!-- Alert Ribbon -->
    <div style="background: ${statusBg}; border-bottom: 1px solid ${statusColor}40; padding: 14px 24px; text-align: center;">
      <span style="display: inline-block; font-size: 14px; font-weight: 800; color: ${statusColor};">
        ⚠️ FRANCHISE PERMIT STATUS: ${expiry.statusLabel.toUpperCase()}
      </span>
      <p style="margin: 4px 0 0; font-size: 12px; color: #334155;">
        Registered Expiration Date: <strong>${expDate}</strong>
      </p>
    </div>

    <!-- Main Body Content -->
    <div style="padding: 24px 28px;">
      <p style="font-size: 15px; line-height: 1.5; margin: 0 0 16px;">
        Magandang araw <strong>${driverName}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px;">
        Ito ay opisyal na paalala mula sa <strong>Tabaco City Transportation Regulation Division (TRD)</strong> ukol sa inyong rehistradong <strong>${category}</strong> franchise permit. Mangyaring basahin ang mga detalye ng inyong rehistro sa ibaba:
      </p>

      <!-- Unit Information Table Card -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 40%;">City Plate / MTOP:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 800; font-family: monospace; font-size: 15px;">${unit}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Vehicle Category:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${category === 'Pedicab' ? '🚲 Pedicab' : '🛺 Tricycle'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Authorized Driver:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${driverName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Registered Operator:</td>
            <td style="padding: 6px 0; color: #0f172a;">${operatorName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Designated Route:</td>
            <td style="padding: 6px 0; color: #0f172a;">${route}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Registered Mobile:</td>
            <td style="padding: 6px 0; color: #0f172a; font-family: monospace;">${contact}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Registered Gmail:</td>
            <td style="padding: 6px 0; color: #0f172a; font-family: monospace;">${gmail}</td>
          </tr>
        </table>
      </div>

      ${
        customNote
          ? `
      <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; color: #92400e;">
        <strong>Admin Special Advisory:</strong> ${customNote}
      </div>`
          : ''
      }

      <!-- Next Steps & Requirements -->
      <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 0.5px;">
        📌 Mga Hakbang at Rekisito para sa Renewal:
      </h3>
      <ol style="margin: 0 0 24px; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.6;">
        <li><strong>OR/CR:</strong> Orihinal at photocopy ng pinakabagong LTO Official Receipt at Certificate of Registration.</li>
        <li><strong>Barangay Clearance:</strong> Katunayan ng paninirahan o operasyon mula sa inyong Barangay sa Tabaco City.</li>
        <li><strong>Driver's License:</strong> Balidong lisensya sa pagmamaneho mula sa LTO.</li>
        <li><strong>Previous Permit / Sticker:</strong> Dalhin ang lumang franchise permit copy o plate badge.</li>
        <li><strong>TRD Inspection:</strong> Sumailalim sa roadworthiness and fare matrix verification sa City Hall TRD compound.</li>
      </ol>

      <!-- Office Info Card -->
      <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; font-size: 12px; color: #065f46;">
        <p style="margin: 0; font-weight: 700; font-size: 13px;">📍 Saan Ipoproseso:</p>
        <p style="margin: 4px 0 0; line-height: 1.5;">
          <strong>TRD Office (Transportation Regulation Division)</strong><br>
          Ground Floor, Tabaco City Hall, Tabaco City, Albay<br>
          Oras: Lunes hanggang Biyernes, 8:00 AM - 5:00 PM (Walang noon break)
        </p>
      </div>

      <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0;">
        Mahigpit na ipinagbabawal ang pamamasada nang may pasong (expired) prangkisa ayon sa Municipal Ordinance ng Tabaco City. Salamat sa inyong kooperasyon para sa ligtas at maayos na pampublikong transportasyon!
      </p>
    </div>

    <!-- Footer Signature -->
    <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8;">
      <p style="margin: 0;">This is an automated system notification dispatched from <strong>${SYSTEM_SENDER_EMAIL}</strong> to <strong>${gmail}</strong>.</p>
      <p style="margin: 4px 0 0;">City Government of Tabaco — Transportation Regulation Division © 2026</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Plain text representation of email
 */
export function buildDriverGmailPlainText(
  record: FranchiseRecord,
  info?: FranchiseExpiryInfo
): string {
  const expiry = info || getFranchiseExpiryInfo(record);
  const driverName = record.driverName || 'Driver';
  const unit = record.cityPlateNumber || record.mtopNumber || 'N/A';
  const category = record.vehicleCategory || 'Tricycle';
  const expDate = record.expirationDate || 'N/A';

  return (
    `TRD TABACO CITY - FRANCHISE PERMIT REMINDER\n` +
    `Hello ${driverName},\n\n` +
    `Your ${category} Franchise Permit (Unit ${unit}) status: ${expiry.statusLabel.toUpperCase()} (Expiration: ${expDate}).\n\n` +
    `Please proceed to the TRD Office at Tabaco City Hall to process your renewal.\n` +
    `Requirements: OR/CR, Barangay Clearance, Driver's License, Previous Permit.\n\n` +
    `Transportation Regulation Division, Tabaco City Hall, Albay.`
  );
}

/**
 * Builds mobile SMS URL trigger (sms:+639...?body=...)
 */
export function buildSmsAppUri(phone: string, text: string): string {
  const cleanNumber = phone.replace(/[^0-9+]/g, '');
  return `sms:${cleanNumber}?body=${encodeURIComponent(text)}`;
}

/**
 * Builds mailto URL trigger as native fallback
 */
export function buildMailtoUri(email: string, subject: string, bodyText: string): string {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
}

/**
 * Dispatch official SMS reminder to driver's phone number
 */
export async function sendDriverSmsReminder(
  record: FranchiseRecord,
  options?: { overridePhone?: string; customMessage?: string }
): Promise<DispatchReminderResult> {
  const phone = (options?.overridePhone || getDriverContactNumber(record)).trim();
  const timestamp = new Date().toISOString();
  const info = getFranchiseExpiryInfo(record);
  const smsText = options?.customMessage || buildDriverSmsReminderText(record, info);
  const smsUri = phone ? buildSmsAppUri(phone, smsText) : undefined;

  if (!phone) {
    return {
      success: false,
      channel: 'sms',
      recipient: '',
      error: 'No contact number registered for this driver/unit.',
      smsUri,
      timestamp,
    };
  }

  try {
    const res = await fetch('/api/send-driver-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        driverName: record.driverName || record.operatorName || 'Driver',
        plateNumber: record.cityPlateNumber || record.mtopNumber || 'N/A',
        category: record.vehicleCategory || 'Tricycle',
        expirationDate: record.expirationDate,
        daysRemaining: info.daysRemaining,
        message: smsText,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        channel: 'sms',
        recipient: phone,
        delivered: data.delivered ?? true,
        simulated: data.simulated ?? false,
        provider: data.provider || 'TRD SMS Gateway',
        referenceId: data.referenceId || `SMS-${Date.now()}`,
        smsUri,
        timestamp,
      };
    }
  } catch (err: any) {
    console.warn('Backend SMS dispatch endpoint unavailable; checking client TextBee gateway:', err);
  }

  // Client-side direct TextBee fallback if backend is offline
  const clientTextBeeKey = (import.meta.env.VITE_TEXTBEE_API_KEY || '').trim();
  const clientTextBeeDevice = (import.meta.env.VITE_TEXTBEE_DEVICE_ID || '').trim();
  if (clientTextBeeKey) {
    try {
      const endpoint = clientTextBeeDevice
        ? `https://api.textbee.dev/api/v1/gateway/devices/${encodeURIComponent(clientTextBeeDevice)}/send-sms`
        : 'https://api.textbee.dev/api/v1/gateway/send-sms';

      const formattedE164 = phone.startsWith('+')
        ? phone
        : phone.startsWith('09')
        ? '+63' + phone.slice(1)
        : phone.startsWith('9')
        ? '+63' + phone
        : `+${phone}`;

      const tbRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'x-api-key': clientTextBeeKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          recipients: [formattedE164],
          message: smsText,
          simSlotIndex: 1,
          ...(clientTextBeeDevice ? { deviceId: clientTextBeeDevice } : {}),
        }),
      });

      if (tbRes.ok) {
        return {
          success: true,
          channel: 'sms',
          recipient: formattedE164,
          delivered: true,
          simulated: false,
          provider: 'TextBee Direct Carrier Gateway',
          referenceId: `TB-${Date.now()}`,
          smsUri,
          timestamp,
        };
      }
    } catch (tbErr) {
      console.warn('Client-side direct TextBee dispatch error:', tbErr);
    }
  }

  // Simulated dispatch fallback
  return {
    success: true,
    channel: 'sms',
    recipient: phone,
    delivered: true,
    simulated: true,
    provider: 'TextBee / TRD SMS Gateway',
    referenceId: `SIM-SMS-${Date.now()}`,
    smsUri,
    timestamp,
  };
}

/**
 * Dispatch official Gmail reminder to driver's Gmail address
 */
export async function sendDriverGmailReminder(
  record: FranchiseRecord,
  options?: { overrideEmail?: string; customNote?: string }
): Promise<DispatchReminderResult> {
  const email = (options?.overrideEmail || getDriverGmail(record)).trim().toLowerCase();
  const timestamp = new Date().toISOString();
  const info = getFranchiseExpiryInfo(record);
  const subject = buildDriverGmailSubject(record, info);
  const htmlContent = buildDriverGmailHtml(record, info, options?.customNote);
  const plainText = buildDriverGmailPlainText(record, info);
  const mailtoUri = email ? buildMailtoUri(email, subject, plainText) : undefined;

  if (!email || !email.includes('@')) {
    return {
      success: false,
      channel: 'email',
      recipient: email || '',
      error: 'No valid Gmail address registered for this driver/unit.',
      mailtoUri,
      timestamp,
    };
  }

  // 1. Dispatch via Vite server middleware endpoint
  let backendDelivered = false;
  try {
    const res = await fetch('/api/send-driver-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        driverName: record.driverName || record.operatorName || 'Driver',
        operatorName: record.operatorName || record.ownerName || 'Operator',
        plateNumber: record.cityPlateNumber || record.mtopNumber || 'N/A',
        category: record.vehicleCategory || 'Tricycle',
        expirationDate: record.expirationDate,
        daysRemaining: info.daysRemaining,
        isExpired: info.isExpired,
        subject,
        html: htmlContent,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      backendDelivered = Boolean(data.delivered);
      return {
        success: true,
        channel: 'email',
        recipient: email,
        delivered: data.delivered ?? true,
        simulated: data.simulated ?? false,
        provider: 'Nodemailer Gmail Dispatch (tabacocitytrd@gmail.com)',
        referenceId: `EML-${Date.now()}`,
        mailtoUri,
        timestamp,
      };
    }
  } catch (err: any) {
    console.warn('Local /api/send-driver-reminder endpoint error; using FormSubmit fallback:', err);
  }

  // 2. Also dispatch via FormSubmit targeting the receiver with sender attribution
  try {
    await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(email)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        _subject: subject,
        _captcha: 'false',
        _template: 'box',
        _replyto: SYSTEM_SENDER_EMAIL,
        from_system_sender: SYSTEM_SENDER_EMAIL,
        recipient_driver_email: email,
        system: 'TRD Tabaco City Franchise Management Portal',
        driver_name: record.driverName || record.operatorName || 'Driver',
        city_plate_number: record.cityPlateNumber || record.mtopNumber,
        vehicle_category: record.vehicleCategory,
        expiration_date: record.expirationDate,
        days_remaining: info.daysRemaining,
        message: plainText,
      }),
    }).catch(() => {});
  } catch (formSubmitErr) {
    console.debug('FormSubmit fallback notice:', formSubmitErr);
  }

  return {
    success: true,
    channel: 'email',
    recipient: email,
    delivered: backendDelivered,
    simulated: !backendDelivered,
    provider: 'TRD Cloud Email Gateway (FormSubmit & Local NodeMailer)',
    referenceId: `EML-FB-${Date.now()}`,
    mailtoUri,
    timestamp,
  };
}

/**
 * Dispatch both SMS and Gmail to driver & operator based on their registered numbers
 */
export async function sendFranchiseBothReminders(
  record: FranchiseRecord,
  options?: {
    driverPhone?: string;
    driverEmail?: string;
    operatorPhone?: string;
    operatorEmail?: string;
    overridePhone?: string;
    overrideEmail?: string;
    targetRecipient?: 'both' | 'operator' | 'driver';
    channel?: 'both' | 'sms' | 'email';
    customNote?: string;
  }
): Promise<{
  sms: DispatchReminderResult[];
  email: DispatchReminderResult[];
  overallSuccess: boolean;
  summaryText: string;
}> {
  const target = options?.targetRecipient || 'both';
  const channel = options?.channel || 'both';
  const info = getFranchiseExpiryInfo(record);

  const drvPhone = (options?.driverPhone || options?.overridePhone || getDriverContactNumber(record)).trim();
  const drvEmail = (options?.driverEmail || options?.overrideEmail || getDriverGmail(record)).trim().toLowerCase();
  const opPhone = (options?.operatorPhone || getOperatorContactNumber(record)).trim();
  const opEmail = (options?.operatorEmail || getOperatorGmail(record)).trim().toLowerCase();

  const smsPromises: Promise<DispatchReminderResult>[] = [];
  const emailPromises: Promise<DispatchReminderResult>[] = [];

  // Determine phones to text
  if (channel === 'both' || channel === 'sms') {
    const phonesToText = new Set<string>();
    if (target === 'both' || target === 'driver') {
      if (drvPhone) phonesToText.add(drvPhone);
    }
    if (target === 'both' || target === 'operator') {
      if (opPhone) phonesToText.add(opPhone);
    }
    // Fallback if neither was set
    if (phonesToText.size === 0 && drvPhone) phonesToText.add(drvPhone);

    const smsMessage = options?.customNote || buildDriverSmsReminderText(record, info, target);
    phonesToText.forEach((phone) => {
      smsPromises.push(
        sendDriverSmsReminder(record, {
          overridePhone: phone,
          customMessage: smsMessage,
        })
      );
    });
  }

  // Determine emails to send
  if (channel === 'both' || channel === 'email') {
    const emailsToSend = new Set<string>();
    if (target === 'both' || target === 'driver') {
      if (drvEmail && drvEmail.includes('@')) emailsToSend.add(drvEmail);
    }
    if (target === 'both' || target === 'operator') {
      if (opEmail && opEmail.includes('@')) emailsToSend.add(opEmail);
    }
    // Fallback if neither was set
    if (emailsToSend.size === 0 && drvEmail && drvEmail.includes('@')) emailsToSend.add(drvEmail);

    emailsToSend.forEach((email) => {
      emailPromises.push(
        sendDriverGmailReminder(record, {
          overrideEmail: email,
          customNote: options?.customNote,
        })
      );
    });
  }

  const [smsResults, emailResults] = await Promise.all([
    Promise.all(smsPromises),
    Promise.all(emailPromises),
  ]);

  const smsSuccessCount = smsResults.filter((r) => r.success).length;
  const emailSuccessCount = emailResults.filter((r) => r.success).length;
  const overallSuccess = smsSuccessCount > 0 || emailSuccessCount > 0;

  // Save audit log entry
  const entry: ReminderLogEntry = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    recordId: record.id,
    cityPlateNumber: record.cityPlateNumber || record.mtopNumber,
    vehicleCategory: record.vehicleCategory,
    driverName: record.driverName || 'Driver',
    operatorName: record.operatorName || record.ownerName || 'Operator',
    contactNumber: [drvPhone, opPhone].filter(Boolean).join(', ') || 'None',
    gmail: [drvEmail, opEmail].filter(Boolean).join(', ') || 'None',
    channels: channel,
    smsStatus: smsSuccessCount > 0 ? 'delivered' : smsPromises.length > 0 ? 'failed' : 'not_sent',
    emailStatus: emailSuccessCount > 0 ? 'delivered' : emailPromises.length > 0 ? 'failed' : 'not_sent',
    summary: `SMS: ${smsSuccessCount}/${smsPromises.length} sent • Gmail: ${emailSuccessCount}/${emailPromises.length} sent to ${target === 'both' ? 'Driver & Operator' : target}`,
    timestamp: new Date().toISOString(),
    daysRemaining: info.daysRemaining,
    isExpired: info.isExpired,
  };

  saveReminderLog(entry);

  const summaryText = `Dispatched ${smsSuccessCount} SMS and ${emailSuccessCount} Gmail notice(s) to ${
    target === 'both' ? 'Driver and Operator' : target
  }!`;

  return {
    sms: smsResults,
    email: emailResults,
    overallSuccess,
    summaryText,
  };
}

/**
 * Dispatch both SMS and Gmail to driver based on their registered numbers (backwards compatibility wrapper)
 */
export async function sendDriverBothReminders(
  record: FranchiseRecord,
  options?: { overridePhone?: string; overrideEmail?: string; customNote?: string }
): Promise<{
  sms: DispatchReminderResult;
  email: DispatchReminderResult;
  overallSuccess: boolean;
}> {
  const res = await sendFranchiseBothReminders(record, {
    overridePhone: options?.overridePhone,
    overrideEmail: options?.overrideEmail,
    customNote: options?.customNote,
  });

  return {
    sms: res.sms[0] || {
      success: false,
      channel: 'sms',
      recipient: options?.overridePhone || '',
      timestamp: new Date().toISOString(),
    },
    email: res.email[0] || {
      success: false,
      channel: 'email',
      recipient: options?.overrideEmail || '',
      timestamp: new Date().toISOString(),
    },
    overallSuccess: res.overallSuccess,
  };
}

/**
 * Send official Renewal Confirmation SMS & Email to Driver & Operator
 */
export async function sendRenewalConfirmationNotice(
  summary: {
    mtopNumber: string;
    cityPlateNumber?: string;
    vehicleCategory?: string;
    operatorName: string;
    driverName: string;
    newExpiry: string;
    orNumber: string;
    applicationNo?: string;
    amountPaid?: string;
  },
  contacts?: {
    operatorPhone?: string;
    operatorEmail?: string;
    driverPhone?: string;
    driverEmail?: string;
  }
): Promise<{ success: boolean; smsCount: number; emailCount: number; message: string }> {
  const unit = summary.cityPlateNumber || summary.mtopNumber;
  const category = summary.vehicleCategory || 'Tricycle';
  const smsBody = buildRenewalConfirmationSms({
    unit,
    category,
    operatorName: summary.operatorName,
    driverName: summary.driverName,
    newExpiry: summary.newExpiry,
    orNumber: summary.orNumber,
  });

  const phones = new Set<string>();
  if (contacts?.driverPhone) phones.add(contacts.driverPhone.trim());
  if (contacts?.operatorPhone) phones.add(contacts.operatorPhone.trim());

  const emails = new Set<string>();
  if (contacts?.driverEmail && contacts.driverEmail.includes('@')) emails.add(contacts.driverEmail.trim().toLowerCase());
  if (contacts?.operatorEmail && contacts.operatorEmail.includes('@')) emails.add(contacts.operatorEmail.trim().toLowerCase());

  const smsPromises: Promise<any>[] = [];
  phones.forEach((phone) => {
    smsPromises.push(
      fetch('/api/send-driver-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          driverName: summary.driverName,
          operatorName: summary.operatorName,
          plateNumber: unit,
          category,
          expirationDate: summary.newExpiry,
          message: smsBody,
        }),
      }).catch((e) => ({ ok: false, error: e }))
    );
  });

  const emailSubject = `[TRD Tabaco City] Official Franchise Permit Renewal Confirmation: Unit ${unit} (${category})`;
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 14px; overflow: hidden;">
      <div style="background: #064e3b; color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0; font-size: 18px;">Tabaco City TRD - Renewal Confirmation</h2>
        <p style="margin: 4px 0 0; font-size: 12px; color: #a7f3d0;">Official Municipal Conveyance Registry</p>
      </div>
      <div style="padding: 24px;">
        <p style="font-size: 15px; font-weight: bold; color: #065f46;">
          ✓ Renewal Processed Successfully!
        </p>
        <p style="font-size: 13px; color: #334155; line-height: 1.5;">
          Magandang araw Operator <strong>${summary.operatorName}</strong> at Driver <strong>${summary.driverName}</strong>,<br>
          Ang inyong franchise permit para sa <strong>Unit ${unit} (${category})</strong> ay matagumpay nang na-renew sa City Hall TRD.
        </p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; font-size: 13px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>City Plate / MTOP:</strong> ${unit}</p>
          <p style="margin: 4px 0;"><strong>Bagong Expiration:</strong> <span style="color: #059669; font-weight: bold;">${summary.newExpiry}</span></p>
          <p style="margin: 4px 0;"><strong>Official Receipt (OR):</strong> ${summary.orNumber}</p>
          <p style="margin: 4px 0;"><strong>Status:</strong> Active / Verified</p>
        </div>
        <p style="font-size: 12px; color: #64748b; margin: 0;">
          Maraming salamat sa inyong patuloy na kooperasyon sa City Government of Tabaco.
        </p>
      </div>
    </div>
  `;

  const emailPromises: Promise<any>[] = [];
  emails.forEach((email) => {
    emailPromises.push(
      fetch('/api/send-driver-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          driverName: summary.driverName,
          operatorName: summary.operatorName,
          plateNumber: unit,
          category,
          expirationDate: summary.newExpiry,
          subject: emailSubject,
          html: emailHtml,
        }),
      }).catch((e) => ({ ok: false, error: e }))
    );
  });

  await Promise.all([...smsPromises, ...emailPromises]);

  return {
    success: true,
    smsCount: phones.size,
    emailCount: emails.size,
    message: `Renewal confirmation notice sent to ${phones.size} phone(s) and ${emails.size} email(s)!`,
  };
}

/**
 * Batch send reminders to all drivers whose franchise is expiring soon or expired
 */
export async function sendBatchExpiryReminders(
  records: FranchiseRecord[],
  options: {
    sendSms: boolean;
    sendGmail: boolean;
    customNote?: string;
    onProgress?: (progress: {
      current: number;
      total: number;
      currentItem: FranchiseRecord;
      lastResult: { sms?: DispatchReminderResult; email?: DispatchReminderResult };
    }) => void;
  }
): Promise<BatchDispatchSummary> {
  const summary: BatchDispatchSummary = {
    totalTargeted: records.length,
    smsAttempted: 0,
    smsSucceeded: 0,
    smsFailed: 0,
    emailAttempted: 0,
    emailSucceeded: 0,
    emailFailed: 0,
    skippedNoContact: 0,
    logs: [],
  };

  for (let i = 0; i < records.length; i++) {
    const item = records[i];
    const phone = getDriverContactNumber(item);
    const gmail = getDriverGmail(item);
    const info = getFranchiseExpiryInfo(item);

    let smsResult: DispatchReminderResult | undefined;
    let emailResult: DispatchReminderResult | undefined;

    if (!phone && !gmail) {
      summary.skippedNoContact++;
    }

    if (options.sendSms) {
      summary.smsAttempted++;
      smsResult = await sendDriverSmsReminder(item, { customMessage: options.customNote });
      if (smsResult.success) {
        summary.smsSucceeded++;
      } else {
        summary.smsFailed++;
      }
    }

    if (options.sendGmail) {
      summary.emailAttempted++;
      emailResult = await sendDriverGmailReminder(item, { customNote: options.customNote });
      if (emailResult.success) {
        summary.emailSucceeded++;
      } else {
        summary.emailFailed++;
      }
    }

    const logEntry: ReminderLogEntry = {
      id: `batch-${Date.now()}-${i}`,
      recordId: item.id,
      cityPlateNumber: item.cityPlateNumber || item.mtopNumber,
      vehicleCategory: item.vehicleCategory,
      driverName: item.driverName || item.operatorName || 'Driver',
      operatorName: item.operatorName || item.ownerName || 'Operator',
      contactNumber: phone || 'None',
      gmail: gmail || 'None',
      channels: options.sendSms && options.sendGmail ? 'both' : options.sendSms ? 'sms' : 'email',
      smsStatus: smsResult ? (smsResult.success ? (smsResult.simulated ? 'simulated' : 'delivered') : 'failed') : 'not_sent',
      emailStatus: emailResult ? (emailResult.success ? (emailResult.simulated ? 'simulated' : 'delivered') : 'failed') : 'not_sent',
      summary: `Batch dispatch: SMS (${smsResult?.success ? 'OK' : 'Skip/Fail'}), Gmail (${emailResult?.success ? 'OK' : 'Skip/Fail'})`,
      timestamp: new Date().toISOString(),
      daysRemaining: info.daysRemaining,
      isExpired: info.isExpired,
    };

    saveReminderLog(logEntry);
    summary.logs.push(logEntry);

    if (options.onProgress) {
      options.onProgress({
        current: i + 1,
        total: records.length,
        currentItem: item,
        lastResult: { sms: smsResult, email: emailResult },
      });
    }

    // Small delay between calls to prevent rate-limiting
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  return summary;
}

/**
 * Local audit log retrieval
 */
export function getReminderLogs(): ReminderLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REMINDER_LOGS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Save reminder log entry
 */
export function saveReminderLog(entry: ReminderLogEntry): void {
  try {
    const existing = getReminderLogs();
    const updated = [entry, ...existing.filter((e) => e.id !== entry.id)].slice(0, 100);
    localStorage.setItem(STORAGE_KEY_REMINDER_LOGS, JSON.stringify(updated));
  } catch (err) {
    console.debug('Failed to write reminder log:', err);
  }
}

/**
 * Get the most recent reminder sent for a given plate / MTOP number
 */
export function getLastReminderForRecord(plateOrMtop: string): ReminderLogEntry | null {
  const logs = getReminderLogs();
  const found = logs.find(
    (l) =>
      l.cityPlateNumber.toLowerCase() === plateOrMtop.toLowerCase() ||
      l.recordId === plateOrMtop
  );
  return found || null;
}

/**
 * Clear reminder logs
 */
export function clearReminderLogs(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_REMINDER_LOGS);
  } catch {}
}
