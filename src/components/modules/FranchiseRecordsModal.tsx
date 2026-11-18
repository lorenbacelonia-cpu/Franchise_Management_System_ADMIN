import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useFranchise } from '../../context/FranchiseContext';
import type { FranchiseRecord } from '../../types';
import {
  Users,
  Search,
  QrCode,
  Lock,
  Sparkles,
  CheckCircle2,
  Check,
  Trash2,
  RefreshCw,
  Calendar,
  FileText,
  X,
  Printer,
  FileDown,
  ExternalLink,
  Globe,
  Edit3,
  Receipt
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AdminPasscodeModal } from '../AdminPasscodeModal';
import { isRecordExpired, buildPermanentQrPayload, formatExpDate } from '../../utils/fareUtils';
import { downloadFranchiseDocx } from '../../utils/docxExport';
import { formatTitleCase } from '../../utils/formatters';

function computeDefaultNextExpiry(currentExpiry?: string): string {
  const today = new Date();
  const nextYear = today.getFullYear() + 1;
  if (currentExpiry && /^\d{4}-\d{2}-\d{2}$/.test(currentExpiry)) {
    const currentExpYear = parseInt(currentExpiry.substring(0, 4), 10);
    const monthDay = currentExpiry.substring(5);
    const targetYear = Math.max(nextYear, (isNaN(currentExpYear) ? today.getFullYear() : currentExpYear) + 1);
    let candidate = `${targetYear}-${monthDay}`;
    if (isRecordExpired(candidate)) {
      candidate = `${today.getFullYear() + 1}-${monthDay}`;
      if (isRecordExpired(candidate)) {
        candidate = `${today.getFullYear() + 2}-${monthDay}`;
      }
    }
    return candidate;
  }
  return `${nextYear}-01-15`;
}

function generateNewApplicationNo(): string {
  const year = new Date().getFullYear();
  return `APP-${year}-${Math.floor(100 + Math.random() * 900)}`;
}

export const FranchiseRecordsModal: React.FC = () => {
  const {
    activeModule,
    franchises,
    generatePermanentQr,
    generateAllPermanentQr,
    renewFranchise,
    updateDriver,
    deleteFranchise
  } = useFranchise();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Tricycle' | 'Pedicab'>('All');
  const [notification, setNotification] = useState<string | null>(null);
  const [franchiseToDelete, setFranchiseToDelete] = useState<FranchiseRecord | null>(null);

  // Inline Action States (all actions happen right on this page without moving to another portal)
  const [inlineQrUnitId, setInlineQrUnitId] = useState<string | null>(null);
  const [isExportingDocx, setIsExportingDocx] = useState(false);

  const [franchiseToRenew, setFranchiseToRenew] = useState<FranchiseRecord | null>(null);
  const [renewalExpiryDate, setRenewalExpiryDate] = useState('');
  const [renewalApplicationNo, setRenewalApplicationNo] = useState('');
  const [renewalOrNumber, setRenewalOrNumber] = useState('');
  const [renewalAmountPaid, setRenewalAmountPaid] = useState('');

  const [franchiseToEdit, setFranchiseToEdit] = useState<FranchiseRecord | null>(null);
  const [editOperatorName, setEditOperatorName] = useState('');
  const [editDriverName, setEditDriverName] = useState('');
  const [editContact, setEditContact] = useState('');

  if (activeModule !== 'franchise_records') return null;

  // ── Totals Calculation: Total of all units, separated for Pedicab and Tricycle ──
  const totalAll = franchises.length;
  const totalTricycles = franchises.filter(f => f.vehicleCategory === 'Tricycle').length;
  const totalPedicabs = franchises.filter(f => f.vehicleCategory === 'Pedicab').length;

  const activeTricycles = franchises.filter(f => f.vehicleCategory === 'Tricycle' && f.status === 'Active').length;
  const activePedicabs = franchises.filter(f => f.vehicleCategory === 'Pedicab' && f.status === 'Active').length;
  const pendingTricycles = franchises.filter(f => f.vehicleCategory === 'Tricycle' && (f.status === 'Pending Renewal' || f.status === 'Under Review')).length;
  const pendingPedicabs = franchises.filter(f => f.vehicleCategory === 'Pedicab' && (f.status === 'Pending Renewal' || f.status === 'Under Review')).length;
  const expiredTricycles = franchises.filter(f => f.vehicleCategory === 'Tricycle' && f.status === 'Expired').length;
  const expiredPedicabs = franchises.filter(f => f.vehicleCategory === 'Pedicab' && f.status === 'Expired').length;

  const filtered = franchises.filter(f => {
    if (categoryFilter !== 'All' && f.vehicleCategory !== categoryFilter) {
      return false;
    }
    const matchesSearch = !search ||
      f.mtopNumber.toLowerCase().includes(search.toLowerCase()) ||
      (f.cityPlateNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.vehicleCategory || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.applicationNo || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.ownerName || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.operatorName || '').toLowerCase().includes(search.toLowerCase()) ||
      f.driverName.toLowerCase().includes(search.toLowerCase()) ||
      (f.status || '').toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const pendingQrCount = franchises.filter(f => !f.hasPermanentQr).length;
  const allGenerated = pendingQrCount === 0;

  const inlineQrUnit = franchises.find(f => f.id === inlineQrUnitId) || null;
  const inlineQrPayload = inlineQrUnit ? buildPermanentQrPayload(inlineQrUnit) : '';
  const inlineQrDataUrl = inlineQrUnit
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(inlineQrPayload)}`
    : '';

  // ── Print Feature: Pure Plain Text Table Layout Only (No Design) ──
  const handlePrintFranchiseRecords = () => {
    const reportDate = new Date().toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the official franchise records.');
      return;
    }

    const tricycleRecords = franchises.filter(f => f.vehicleCategory === 'Tricycle');
    const pedicabRecords = franchises.filter(f => f.vehicleCategory === 'Pedicab');

    // Pure plain text table row with all driver registration fields
    const formatTableRow = (f: FranchiseRecord, index: number) => {
      const driverFullName = [f.driverFirstName, f.driverMiddleName, f.driverLastName].filter(Boolean).join(' ') || f.driverName || '—';
      const ownerFullName = [f.ownerFirstName, f.ownerMiddleName, f.ownerLastName].filter(Boolean).join(' ') || f.operatorName || f.ownerName || '—';
      const driverAddr = f.driverAddress || 'Tabaco City';
      const licenseNo = f.driverLicenseNo || 'On File';
      const contact = f.ownerContact || f.operatorContact || '—';
      const ownerAddr = f.residentialAddress || f.operatorAddress || f.ownerAddress || 'Tabaco City';
      const modelColor = `${f.modelMake || f.makeModel || (f.vehicleCategory === 'Pedicab' ? 'Pedicab' : 'TMX 125')} / ${f.color || 'Standard'}`;
      const route = f.routeParada || 'Tabaco City Line';
      const orNo = f.receiptNumber || f.orNumber || '—';
      const fee = f.amountPaid ? (typeof f.amountPaid === 'number' ? `₱${f.amountPaid.toFixed(2)}` : `₱${f.amountPaid}`) : (f.vehicleCategory === 'Pedicab' ? '₱250.00' : '₱450.00');
      const regDate = f.registrationDate || f.paymentDate || '—';
      const expDate = f.expirationDate || 'N/A';
      const status = f.status || 'Active';

      return `
        <tr>
          <td style="border: 1px solid #000; padding: 2px; text-align: center;">${index + 1}</td>
          <td style="border: 1px solid #000; padding: 2px; font-weight: bold; font-family: monospace;">${f.cityPlateNumber || f.mtopNumber}</td>
          <td style="border: 1px solid #000; padding: 2px; text-align: center; font-family: monospace;">${f.applicationNo || '—'}</td>
          <td style="border: 1px solid #000; padding: 2px; font-weight: bold;">${driverFullName}</td>
          <td style="border: 1px solid #000; padding: 2px;">${driverAddr}</td>
          <td style="border: 1px solid #000; padding: 2px; font-family: monospace; text-align: center;">${licenseNo}</td>
          <td style="border: 1px solid #000; padding: 2px;">${ownerFullName}</td>
          <td style="border: 1px solid #000; padding: 2px; font-family: monospace;">${contact}</td>
          <td style="border: 1px solid #000; padding: 2px;">${ownerAddr}</td>
          <td style="border: 1px solid #000; padding: 2px;">${modelColor}</td>
          <td style="border: 1px solid #000; padding: 2px;">${route}</td>
          <td style="border: 1px solid #000; padding: 2px; font-family: monospace; text-align: center;">${orNo}</td>
          <td style="border: 1px solid #000; padding: 2px; font-family: monospace; text-align: right;">${fee}</td>
          <td style="border: 1px solid #000; padding: 2px; font-family: monospace; text-align: center;">${regDate}</td>
          <td style="border: 1px solid #000; padding: 2px; font-family: monospace; text-align: center;">${expDate}</td>
          <td style="border: 1px solid #000; padding: 2px; text-align: center; font-weight: bold;">${status}</td>
        </tr>
      `;
    };

    const tricycleTableHtml = tricycleRecords.length > 0
      ? tricycleRecords.map((f, i) => formatTableRow(f, i)).join('')
      : `<tr><td colspan="16" style="border: 1px solid #000; padding: 8px; text-align: center;">No registered Tricycle units on record.</td></tr>`;

    const pedicabTableHtml = pedicabRecords.length > 0
      ? pedicabRecords.map((f, i) => formatTableRow(f, i)).join('')
      : `<tr><td colspan="16" style="border: 1px solid #000; padding: 8px; text-align: center;">No registered Pedicab units on record.</td></tr>`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Franchise & Driver Registry Table Printout - Tabaco City TRD</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 6mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
            color: #000000;
            background: #ffffff;
            margin: 0;
            padding: 4px;
            font-size: 7.5px;
            line-height: 1.25;
          }
          h1, h2, h3, p {
            margin: 0;
            padding: 0;
          }
          .title-header {
            text-align: center;
            border-bottom: 2px solid #000000;
            padding-bottom: 4px;
            margin-bottom: 6px;
          }
          .title-header h1 {
            font-size: 12px;
            text-transform: uppercase;
            font-weight: bold;
          }
          .title-header h2 {
            font-size: 10px;
            font-weight: bold;
            margin-top: 1px;
          }
          .title-header p {
            font-size: 8px;
            margin-top: 1px;
          }
          
          /* TOTAL OF ALL UNITS BUT SEPARATE FOR TRICYCLE AND PEDICAB */
          .totals-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
            font-size: 8px;
          }
          .totals-table th, .totals-table td {
            border: 1px solid #000000;
            padding: 2.5px 5px;
            text-align: left;
          }
          .totals-table th {
            background: #ffffff;
            font-weight: bold;
          }
          
          .section-title {
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 1px solid #000000;
            padding-bottom: 2px;
            margin: 6px 0 3px 0;
            display: flex;
            justify-content: space-between;
          }
          
          table.registry-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
            font-size: 6.8px;
            table-layout: fixed;
          }
          table.registry-table th, table.registry-table td {
            border: 1px solid #000000;
            padding: 2px 2px;
            text-align: left;
            vertical-align: top;
            word-break: break-word;
            overflow-wrap: break-word;
          }
          table.registry-table th {
            background: #ffffff;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 6.5px;
          }

          .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-top: 14px;
            page-break-inside: avoid;
          }
          .sign-box {
            text-align: center;
            border-top: 1px solid #000000;
            padding-top: 3px;
            font-size: 8px;
          }
        </style>
      </head>
      <body>
        <div class="title-header">
          <h1>Republic of the Philippines</h1>
          <h2>City Government of Tabaco • Transportation Regulation Division (TRD)</h2>
          <p><strong>Official Franchise &amp; Driver Master Registry Table</strong></p>
          <p>Date Printed: ${reportDate}</p>
        </div>

        <!-- TOTAL OF ALL BUT SEPARATE FOR TRICYCLE AND PEDICAB TABLE -->
        <table class="totals-table">
          <tr>
            <th style="width: 25%;">TOTAL OF ALL UNITS:</th>
            <td style="font-weight: bold;" colspan="3">${totalAll} Registered Units</td>
          </tr>
          <tr>
            <th style="width: 25%;">TOTAL TRICYCLES:</th>
            <td style="width: 25%; font-weight: bold;">${totalTricycles} (Active: ${activeTricycles}, Pending: ${pendingTricycles}, Expired: ${expiredTricycles})</td>
            <th style="width: 25%;">TOTAL PEDICABS:</th>
            <td style="width: 25%; font-weight: bold;">${totalPedicabs} (Active: ${activePedicabs}, Pending: ${pendingPedicabs}, Expired: ${expiredPedicabs})</td>
          </tr>
        </table>

        <!-- ════════ SECTION 1: TRICYCLE REGISTRY TABLE ════════ -->
        <div class="section-title">
          <span>I. TRICYCLE MASTER REGISTRY TABLE</span>
          <span>TOTAL: ${totalTricycles} UNITS</span>
        </div>
        <table class="registry-table">
          <thead>
            <tr>
              <th style="width: 2%; text-align: center;">#</th>
              <th style="width: 7%;">Plate/MTOP</th>
              <th style="width: 7%; text-align: center;">App No.</th>
              <th style="width: 10%;">Driver Name</th>
              <th style="width: 9%;">Driver Address</th>
              <th style="width: 7%; text-align: center;">License</th>
              <th style="width: 10%;">Operator/Owner</th>
              <th style="width: 7%;">Contact</th>
              <th style="width: 9%;">Operator Address</th>
              <th style="width: 8%;">Make/Model/Color</th>
              <th style="width: 7%;">Route</th>
              <th style="width: 5%; text-align: center;">OR No.</th>
              <th style="width: 4%; text-align: right;">Fee</th>
              <th style="width: 4%; text-align: center;">Reg Date</th>
              <th style="width: 5%; text-align: center;">Permit Expiry</th>
              <th style="width: 5%; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${tricycleTableHtml}
          </tbody>
        </table>

        <!-- ════════ SECTION 2: PEDICAB REGISTRY TABLE ════════ -->
        <div class="section-title">
          <span>II. PEDICAB MASTER REGISTRY TABLE</span>
          <span>TOTAL: ${totalPedicabs} UNITS</span>
        </div>
        <table class="registry-table">
          <thead>
            <tr>
              <th style="width: 2%; text-align: center;">#</th>
              <th style="width: 7%;">Body No.</th>
              <th style="width: 7%; text-align: center;">App No.</th>
              <th style="width: 10%;">Driver Name</th>
              <th style="width: 9%;">Driver Address</th>
              <th style="width: 7%; text-align: center;">License</th>
              <th style="width: 10%;">Operator/Owner</th>
              <th style="width: 7%;">Contact</th>
              <th style="width: 9%;">Operator Address</th>
              <th style="width: 8%;">Make/Model/Color</th>
              <th style="width: 7%;">Route</th>
              <th style="width: 5%; text-align: center;">OR No.</th>
              <th style="width: 4%; text-align: right;">Fee</th>
              <th style="width: 4%; text-align: center;">Reg Date</th>
              <th style="width: 5%; text-align: center;">Permit Expiry</th>
              <th style="width: 5%; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${pedicabTableHtml}
          </tbody>
        </table>

        <!-- Official Signatures -->
        <div class="signatures">
          <div class="sign-box">
            <strong>TRD Chief Records Officer</strong><br/>
            <span>Transportation Regulation Division</span>
          </div>
          <div class="sign-box">
            <strong>Hon. City Mayor</strong><br/>
            <span>City Government of Tabaco</span>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  const handleGenerateAllQrCodes = async () => {
    try {
      await generateAllPermanentQr();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#05b875', '#10b981', '#049d63']
      });
      setNotification('Success! Unique Permanent QR Codes have been generated and locked for all registered franchises.');
    } catch (err: any) {
      setNotification(`Error generating QR codes: ${err?.message || 'Please retry.'}`);
    } finally {
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleGenerateSingleQr = async (franchiseId: string, mtopNumber: string) => {
    try {
      await generatePermanentQr(franchiseId);
      setInlineQrUnitId(franchiseId);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#05b875', '#10b981', '#049d63']
      });
      setNotification(`Success! Unique Permanent QR Code generated & locked for unit ${mtopNumber}.`);
    } catch (err: any) {
      setNotification(`Error generating QR code for unit ${mtopNumber}: ${err?.message || 'Please retry.'}`);
    } finally {
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleToggleInlineQr = (franchiseId: string) => {
    setFranchiseToRenew(null);
    setFranchiseToEdit(null);
    setInlineQrUnitId(prev => (prev === franchiseId ? null : franchiseId));
  };

  const handleDownloadDocx = async () => {
    if (!inlineQrUnit) return;
    setIsExportingDocx(true);
    try {
      await downloadFranchiseDocx(inlineQrUnit, inlineQrDataUrl);
      setNotification(`Downloaded Word document badge for unit ${inlineQrUnit.mtopNumber}.`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification(`Error exporting Word: ${err?.message || 'Please retry.'}`);
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleOpenRenewInline = (item: FranchiseRecord) => {
    setInlineQrUnitId(null);
    setFranchiseToEdit(null);
    setFranchiseToRenew(item);
    setRenewalExpiryDate(computeDefaultNextExpiry(item.expirationDate));
    setRenewalApplicationNo(item.applicationNo || generateNewApplicationNo());
    setRenewalOrNumber(item.orNumber || item.receiptNumber || generateNewApplicationNo());
    setRenewalAmountPaid(item.amountPaid ? String(item.amountPaid) : '450.00');
  };

  const handleConfirmRenewFranchise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!franchiseToRenew) return;

    const cleanAppNo = renewalApplicationNo.trim() || generateNewApplicationNo();
    await renewFranchise(franchiseToRenew.id, {
      newExpiry: renewalExpiryDate,
      applicationNo: cleanAppNo,
      orNumber: renewalOrNumber.trim() || cleanAppNo,
      amountPaid: renewalAmountPaid ? parseFloat(renewalAmountPaid) : undefined,
    });

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#2563eb', '#10b981', '#3b82f6']
    });
    setNotification(
      `Success! Franchise permit for unit ${franchiseToRenew.mtopNumber} (${franchiseToRenew.driverName}) renewed • App No: ${cleanAppNo} • Next Expiry: ${renewalExpiryDate}.`
    );
    setTimeout(() => setNotification(null), 4500);
    setFranchiseToRenew(null);
  };

  const handleOpenEditInline = (item: FranchiseRecord) => {
    setInlineQrUnitId(null);
    setFranchiseToRenew(null);
    setFranchiseToEdit(item);
    setEditOperatorName(item.operatorName || '');
    setEditDriverName(item.driverName || '');
    setEditContact(item.operatorContact || '');
  };

  const handleConfirmEditInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!franchiseToEdit || !editOperatorName.trim() || !editDriverName.trim()) return;
    await updateDriver(franchiseToEdit.cityPlateNumber || franchiseToEdit.mtopNumber, {
      operatorName: editOperatorName.trim(),
      driverName: editDriverName.trim(),
      contact: editContact.trim(),
    });
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    setNotification(`Updated Operator & Driver for Unit ${franchiseToEdit.mtopNumber}.`);
    setTimeout(() => setNotification(null), 4000);
    setFranchiseToEdit(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner Card with Totals (Total of All, Separated for Pedicab and Tricycle) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="h-11 w-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Franchise Records (Tricycle &amp; Pedicab)</h2>
            <p className="text-xs text-slate-500 font-medium">
              All unit actions — QR generation, live QR preview &amp; print, permit renewal, name editing, and deletion
            </p>
          </div>
        </div>

        {/* Feature Total of All But Separate From Pedicab and Tricycle */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center space-x-1.5 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800">
            <span className="text-[10px] text-slate-500 uppercase">Total All:</span>
            <span className="font-mono text-slate-950 font-black">{totalAll}</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800">
            <span className="text-[10px] text-emerald-600 uppercase">Tricycle:</span>
            <span className="font-mono text-emerald-950 font-black">{totalTricycles}</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-800">
            <span className="text-[10px] text-sky-600 uppercase">Pedicab:</span>
            <span className="font-mono text-sky-950 font-black">{totalPedicabs}</span>
          </div>
          <button
            type="button"
            onClick={handlePrintFranchiseRecords}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
            title="Print Official Master Franchise Directory (Total of All and Separated Pedicab & Tricycle)"
          >
            <Printer className="h-4 w-4 text-emerald-400" />
            <span>Print Records</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold px-4 py-3 rounded-2xl flex items-center space-x-2 shadow-sm animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* INLINE PANEL 1: Live QR Preview, Download Word & Print 1-Page Badge (No moving to QR Scanner portal!) */}
      {inlineQrUnit && (
        <div className="bg-white rounded-3xl p-6 border-2 border-emerald-500/40 shadow-md space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <QrCode className="h-5 w-5 text-emerald-600" />
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">
                  Inline QR Code Badge Preview — Unit {inlineQrUnit.mtopNumber}
                </h4>
                <p className="text-[11px] text-slate-500">
                  Operator: {inlineQrUnit.operatorName} • Driver: {inlineQrUnit.driverName} • Route: {inlineQrUnit.routeParada}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setInlineQrUnitId(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="flex flex-col items-center justify-center bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <img
                src={inlineQrDataUrl}
                alt="Official QR Badge"
                className="w-44 h-44 object-contain bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs"
              />
              <span className="text-xs font-mono font-bold text-slate-900">
                UNIT ID: {inlineQrUnit.mtopNumber}
              </span>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center space-x-1.5 text-emerald-800 font-bold">
                  <Globe className="h-4 w-4 text-emerald-600" />
                  <span>Universal Google Lens &amp; Camera Scan Link</span>
                </div>
                <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-slate-200">
                  <input
                    type="text"
                    readOnly
                    value={inlineQrPayload}
                    className="text-[10px] font-mono text-slate-700 bg-transparent flex-1 outline-none"
                  />
                  <a
                    href={inlineQrPayload}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shrink-0"
                  >
                    <span>Test Link</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isExportingDocx}
                  onClick={handleDownloadDocx}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
                >
                  <FileDown className="h-4 w-4" />
                  <span>{isExportingDocx ? 'Generating...' : 'Download Word (.docx)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print / Save PDF (1-Page)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INLINE PANEL 2: Renew Permit Form right on this page */}
      {franchiseToRenew && (
        <div className="bg-white rounded-3xl shadow-md border-2 border-blue-500/40 overflow-hidden animate-fadeIn">
          <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <RefreshCw className="h-5 w-5 text-blue-400" />
              <div>
                <h4 className="text-sm font-bold">
                  Inline Renew Franchise Permit — Unit {franchiseToRenew.mtopNumber}
                </h4>
                <p className="text-[11px] text-slate-300">
                  Owner: {franchiseToRenew.ownerName || franchiseToRenew.operatorName} • Driver: {franchiseToRenew.driverName} • Current Expiry: {franchiseToRenew.expirationDate}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFranchiseToRenew(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleConfirmRenewFranchise} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Application No.
                </label>
                <div className="flex items-center space-x-1.5">
                  <div className="relative flex-1">
                    <FileText className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={renewalApplicationNo}
                      onChange={(e) => setRenewalApplicationNo(e.target.value.toUpperCase())}
                      className="w-full pl-8 pr-2 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setRenewalApplicationNo(generateNewApplicationNo())}
                    className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-[11px] font-bold cursor-pointer"
                  >
                    New
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Next Expiration Date
                </label>
                <div className="relative">
                  <Calendar className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={renewalExpiryDate}
                    onChange={(e) => setRenewalExpiryDate(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Receipt No. (OR No.)
                </label>
                <div className="relative">
                  <Receipt className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={renewalOrNumber}
                    onChange={(e) => setRenewalOrNumber(e.target.value.toUpperCase())}
                    className="w-full pl-8 pr-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Amount Paid (PHP)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={renewalAmountPaid}
                  onChange={(e) => setRenewalAmountPaid(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setFranchiseToRenew(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirm Renewal</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* INLINE PANEL 3: Quick Edit Operator & Driver right on this page */}
      {franchiseToEdit && (
        <div className="bg-white rounded-3xl shadow-md border-2 border-indigo-500/40 overflow-hidden animate-fadeIn">
          <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Edit3 className="h-5 w-5 text-indigo-400" />
              <div>
                <h4 className="text-sm font-bold">
                  Inline Edit Operator &amp; Driver — Unit {franchiseToEdit.mtopNumber}
                </h4>
                <p className="text-[11px] text-slate-300">
                  Update operator name, authorized driver name, and contact number directly here
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFranchiseToEdit(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleConfirmEditInline} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Operator / Owner Name *
                </label>
                <input
                  type="text"
                  required
                  value={editOperatorName}
                  onChange={(e) => setEditOperatorName(formatTitleCase(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Authorized Driver Name *
                </label>
                <input
                  type="text"
                  required
                  value={editDriverName}
                  onChange={(e) => setEditDriverName(formatTitleCase(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contact Number
                </label>
                <input
                  type="tel"
                  maxLength={11}
                  value={editContact}
                  onChange={(e) => setEditContact(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder="09..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setFranchiseToEdit(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Save Updated Names</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Content Container */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Registered Franchise Data</h3>
            <p className="text-xs text-slate-400 font-medium italic">
              {allGenerated
                ? 'All units have permanent QR codes active'
                : `${pendingQrCount} unit(s) awaiting QR generation • Batch generate below`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-wrap">
            {/* Category Filter Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setCategoryFilter('All')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${categoryFilter === 'All'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                All ({totalAll})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('Tricycle')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${categoryFilter === 'Tricycle'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Tricycle ({totalTricycles})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('Pedicab')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${categoryFilter === 'Pedicab'
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Pedicab ({totalPedicabs})
              </button>
            </div>

            <button
              type="button"
              onClick={handleGenerateAllQrCodes}
              className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap ${allGenerated
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                : 'bg-[#05b875] hover:bg-[#049d63] text-white active:scale-[0.98]'
                }`}
            >
              {allGenerated ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                  <span>All QR Generated</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 shrink-0" />
                  <span>Generate All QR</span>
                </>
              )}
            </button>

            <div className="relative w-full sm:w-60">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search plate, MTOP, driver..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden overflow-x-auto shadow-2xs">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-900 text-white font-bold border-b border-slate-900">
              <tr className="whitespace-nowrap">
                <th className="px-4 py-3">City Plate No.</th>
                <th className="px-4 py-3">Owner / Operator</th>
                <th className="px-4 py-3">Driver Name</th>
                <th className="px-4 py-3">Route/Parada</th>
                <th className="px-4 py-3">Permit Status</th>
                <th className="px-4 py-3">QR Status</th>
                <th className="px-4 py-3 text-center">All-in-One Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="h-8 w-8 text-slate-300" />
                      <p className="text-sm font-semibold text-slate-600">No Franchise Records Found</p>
                      <p className="text-xs text-slate-400">Use &ldquo;Register Franchise&rdquo; in the sidebar to add new units.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition-colors ${inlineQrUnitId === item.id || franchiseToRenew?.id === item.id || franchiseToEdit?.id === item.id
                      ? 'bg-emerald-50/40'
                      : 'hover:bg-slate-50'
                      }`}
                  >
                    <td className="px-4 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono">{item.cityPlateNumber || item.mtopNumber}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${item.vehicleCategory === 'Pedicab'
                            ? 'bg-sky-50 text-sky-800 border-sky-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                        >
                          {item.vehicleCategory}
                        </span>
                      </div>
                      {item.applicationNo && (
                        <div className="text-[10px] text-slate-400 font-mono font-medium">
                          {item.applicationNo}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">{item.ownerName || item.operatorName}</td>
                    <td className="px-4 py-3.5 text-slate-700">{item.driverName}</td>
                    <td className="px-4 py-3.5 text-slate-600 font-medium">{item.routeParada || 'Sua-Igot 24 Tabaco'}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={
                        item.status === 'Active' ? 'badge-active' :
                          item.status === 'Pending Renewal' || item.status === 'Under Review' ? 'badge-pending' : 'badge-expired'
                      }>
                        {item.status}
                      </span>
                      {item.expirationDate && (
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                          Exp: {item.expirationDate}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {item.hasPermanentQr ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200 whitespace-nowrap">
                          <Lock className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span>Permanent QR Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200 whitespace-nowrap">
                          <QrCode className="h-3 w-3 text-amber-600 shrink-0" />
                          <span>Ready for QR</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <div className="inline-flex items-center justify-center gap-1.5 flex-wrap">
                        {item.hasPermanentQr ? (
                          <button
                            type="button"
                            onClick={() => handleToggleInlineQr(item.id)}
                            className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer border whitespace-nowrap ${inlineQrUnitId === item.id
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                              }`}
                            title="Preview, download Word, or print QR code right on this page"
                          >
                            <QrCode className="h-3.5 w-3.5 shrink-0" />
                            <span>{inlineQrUnitId === item.id ? 'Hide QR' : 'View / Print QR'}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleGenerateSingleQr(item.id, item.mtopNumber)}
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer bg-[#05b875] hover:bg-[#049d63] text-white whitespace-nowrap"
                          >
                            <QrCode className="h-3.5 w-3.5 text-white shrink-0" />
                            <span>Generate QR</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenRenewInline(item)}
                          className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${franchiseToRenew?.id === item.id
                            ? 'bg-slate-900 text-white'
                            : item.status === 'Expired' || item.status === 'Pending Renewal' || isRecordExpired(item.expirationDate)
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                            }`}
                        >
                          <RefreshCw className="h-3.5 w-3.5 shrink-0" />
                          <span>Renew</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditInline(item)}
                          className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${franchiseToEdit?.id === item.id
                            ? 'bg-slate-900 text-white'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                            }`}
                        >
                          <Edit3 className="h-3.5 w-3.5 shrink-0" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFranchiseToDelete(item)}
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 whitespace-nowrap"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Passcode Authorization Modal for Franchise Deletion */}
      <AdminPasscodeModal
        isOpen={!!franchiseToDelete}
        title={`Delete ${franchiseToDelete?.vehicleCategory || 'Franchise'} Record`}
        description={`You are about to permanently delete the master franchise record, registered driver details, and permanent QR code badge for unit ${franchiseToDelete?.mtopNumber} (${franchiseToDelete?.driverName}). This action is recorded in audit logs and cannot be undone.`}
        itemType="Franchise Record"
        itemName={`${franchiseToDelete?.mtopNumber} — ${franchiseToDelete?.driverName}`}
        confirmButtonText="Authorize & Delete Record"
        onClose={() => setFranchiseToDelete(null)}
        onConfirm={(reason) => {
          if (franchiseToDelete) {
            deleteFranchise(franchiseToDelete.id, reason);
            setNotification(`Franchise record ${franchiseToDelete.mtopNumber} (${franchiseToDelete.driverName}) has been permanently deleted.`);
            setTimeout(() => setNotification(null), 5000);
            setFranchiseToDelete(null);
          }
        }}
      />

      {/* Printable 1-Page QR Certificate when printing a single unit badge from Franchise Records */}
      {inlineQrUnit && typeof document !== 'undefined' && createPortal(
        <div
          id="printable-qr-certificate"
          className="hidden print:flex flex-col items-center justify-between font-sans text-slate-900 bg-white h-full max-h-[96vh] p-4 sm:p-5 border-2 border-slate-900 rounded-xl box-border overflow-hidden"
        >
          <div className="w-full text-center pb-2 border-b-2 border-slate-900">
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-600">
              Republic of the Philippines
            </p>
            <p className="text-xs uppercase font-extrabold tracking-wider text-slate-800">
              Province of Albay • City of Tabaco
            </p>
            <h1 className="text-sm uppercase font-black tracking-tight text-emerald-800 mt-0.5">
              Office of the Transportation Regulation Division (TRD)
            </h1>
            <div className="inline-block bg-slate-900 text-white font-black text-[11px] uppercase tracking-wider px-4 py-0.5 rounded-md mt-1 shadow-sm">
              Official {(inlineQrUnit.vehicleCategory || 'Tricycle').toUpperCase()} System QR Badge
            </div>
          </div>

          <div className="w-full bg-slate-100 border border-slate-900 rounded-lg py-2 px-5 my-2 flex items-center justify-between text-center">
            <div className="text-left">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">City Plate Number</span>
              <span className="text-2xl font-black font-mono text-slate-950 tracking-wider">
                {inlineQrUnit.cityPlateNumber || inlineQrUnit.mtopNumber}
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Permit Status</span>
              <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border ${inlineQrUnit.status === 'Active'
                ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                : 'bg-rose-100 text-rose-900 border-rose-400'
                }`}>
                {inlineQrUnit.status}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center my-1 text-center">
            <div className="p-3 bg-white border-2 border-slate-900 rounded-2xl shadow-xs">
              <img
                src={inlineQrDataUrl}
                alt="Official System QR Code"
                className="w-52 h-52 sm:w-56 sm:h-56 object-contain"
              />
            </div>
            <p className="text-[10px] font-bold text-slate-700 mt-1 max-w-sm">
              Scan via Google Lens or mobile camera for real-time cloud franchise credentials &amp; official fare matrix
            </p>
          </div>

          <div className="w-full grid grid-cols-2 gap-2 text-xs my-1">
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-300">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Authorized Driver</span>
              <span className="font-black text-slate-900 text-xs truncate block">{inlineQrUnit.driverName || '—'}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-300">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Franchise Owner / Operator</span>
              <span className="font-bold text-slate-900 text-xs truncate block">{inlineQrUnit.ownerName || inlineQrUnit.operatorName || '—'}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-300">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Authorized Route / Parada</span>
              <span className="font-bold text-slate-900 text-[11px] truncate block">{inlineQrUnit.routeParada || 'Sua-Igot 24 Tabaco'}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-300">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Permit Expiration Date</span>
              <span className="font-mono font-bold text-slate-900 text-[11px] block">{formatExpDate(inlineQrUnit.expirationDate)}</span>
            </div>
          </div>

          <div className="w-full text-center pt-2 border-t border-slate-300 text-[9px] text-slate-500 italic">
            Official Municipal Conveyance Permit • City Government of Tabaco • Scannable by citizens, enforcers, and passengers
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
