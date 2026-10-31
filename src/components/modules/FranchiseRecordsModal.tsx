import React, { useState } from 'react';
import { useFranchise } from '../../context/FranchiseContext';
import type { FranchiseRecord } from '../../types';
import { ArrowLeft, Users, Search, QrCode, Lock, Sparkles, CheckCircle2, Check, Trash2, RefreshCw, Calendar, FileText, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AdminPasscodeModal } from '../AdminPasscodeModal';
import { isRecordExpired } from '../../utils/fareUtils';

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
    setActiveModule, 
    franchises, 
    vehicleCategory, 
    setSelectedFranchiseId,
    generatePermanentQr,
    generateAllPermanentQr,
    renewFranchise,
    deleteFranchise
  } = useFranchise();
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [franchiseToDelete, setFranchiseToDelete] = useState<FranchiseRecord | null>(null);
  const [franchiseToRenew, setFranchiseToRenew] = useState<FranchiseRecord | null>(null);
  const [renewalExpiryDate, setRenewalExpiryDate] = useState('');
  const [renewalApplicationNo, setRenewalApplicationNo] = useState('');

  if (activeModule !== 'franchise_records') return null;

  const filtered = franchises.filter(f => {
    const matchesCategory = f.vehicleCategory === vehicleCategory;
    const matchesSearch = !search || 
      f.mtopNumber.toLowerCase().includes(search.toLowerCase()) ||
      (f.applicationNo || '').toLowerCase().includes(search.toLowerCase()) ||
      f.operatorName.toLowerCase().includes(search.toLowerCase()) ||
      f.driverName.toLowerCase().includes(search.toLowerCase()) ||
      (f.status || '').toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const pendingQrCount = franchises.filter(f => !f.hasPermanentQr).length;
  const allGenerated = pendingQrCount === 0;

  const handleGenerateAllQrCodes = () => {
    generateAllPermanentQr();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#05b875', '#10b981', '#049d63']
    });
    setNotification('Success! Unique Permanent QR Codes have been generated and locked for all registered franchises.');
    setTimeout(() => setNotification(null), 5000);
  };

  const handleGenerateSingleQr = (franchiseId: string, mtopNumber: string) => {
    generatePermanentQr(franchiseId);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#05b875', '#10b981', '#049d63']
    });
    setNotification(`Success! Unique Permanent QR Code generated & locked for unit ${mtopNumber}.`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenQrGenerator = (franchiseId: string) => {
    setSelectedFranchiseId(franchiseId);
    setActiveModule('qr_scanner');
  };

  const handleOpenRenewModal = (item: FranchiseRecord) => {
    setFranchiseToRenew(item);
    setRenewalExpiryDate(computeDefaultNextExpiry(item.expirationDate));
    setRenewalApplicationNo(item.applicationNo || generateNewApplicationNo());
  };

  const handleConfirmRenewFranchise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!franchiseToRenew || !renewalExpiryDate || !renewalApplicationNo.trim()) return;

    const cleanAppNo = renewalApplicationNo.trim().toUpperCase();
    await renewFranchise(franchiseToRenew.id, {
      newExpiry: renewalExpiryDate,
      applicationNo: cleanAppNo,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-100 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 p-6 space-y-4">
        
        {/* Top Back Navigation */}
        <div className="shrink-0">
          <button 
            onClick={() => setActiveModule('overview')}
            className="flex items-center space-x-2 text-xs font-bold text-slate-800 hover:text-slate-900 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Header Banner Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center space-x-4 shrink-0">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{vehicleCategory} Franchise Records</h2>
            <p className="text-xs text-slate-400 font-medium italic">Batch generate permanent QR codes and manage registered units</p>
          </div>
        </div>

        {/* Toast / Notification banner if active */}
        {notification && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold px-4 py-3 rounded-2xl flex items-center space-x-2 shadow-sm animate-fadeIn shrink-0">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Content Container */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 flex-1 min-h-0 flex flex-col">
          
          {/* Section Header & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Registered Franchise Data</h3>
              <p className="text-xs text-slate-400 font-medium italic">
                {allGenerated 
                  ? 'All units have permanent QR codes active' 
                  : `${pendingQrCount} unit(s) awaiting QR generation • Batch generate below`}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Batch Action: Generate All QR Codes */}
              <button
                type="button"
                onClick={handleGenerateAllQrCodes}
                className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap ${
                  allGenerated
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                    : 'bg-[#05b875] hover:bg-[#049d63] text-white shadow-emerald-600/25 active:scale-[0.98]'
                }`}
                title="Generate permanent QR codes for all registered units"
              >
                {allGenerated ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                    <span>All QR Codes Generated</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                    <span>Generate All QR Codes</span>
                  </>
                )}
              </button>

              {/* Search Bar (Rounded Grey Pill) */}
              <div className="relative w-full sm:w-60">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search franchise............"
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-full text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Data Table with Dark Header (Scrollable) */}
          <div className="border border-slate-200 rounded-xl overflow-y-auto overflow-x-auto flex-1 min-h-0">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-900 text-white font-bold border-b border-slate-900 sticky top-0 z-10">
                <tr className="whitespace-nowrap">
                  <th className="px-4 py-3">City Plate No.</th>
                  <th className="px-4 py-3">Operator Name</th>
                  <th className="px-4 py-3">Driver Name</th>
                  <th className="px-4 py-3">Route/Parada</th>
                  <th className="px-4 py-3">Permit Status</th>
                  <th className="px-4 py-3">QR Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Users className="h-8 w-8 text-slate-300" />
                        <p className="text-sm font-semibold text-slate-600">No {vehicleCategory} Records Found</p>
                        <p className="text-xs text-slate-400">The database table has 0 records. Use "Register Franchise" to add new units.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                      <div>{item.mtopNumber}</div>
                      {item.applicationNo && (
                        <div className="text-[10px] text-slate-400 font-mono font-medium">
                          {item.applicationNo}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">{item.operatorName}</td>
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
                      <div className="inline-flex items-center justify-center gap-1.5">
                        {item.hasPermanentQr ? (
                          <button
                            type="button"
                            onClick={() => handleOpenQrGenerator(item.id)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-2xs bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 whitespace-nowrap active:scale-[0.98]"
                            title="View permanent QR code"
                          >
                            <QrCode className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                            <span>View QR</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleGenerateSingleQr(item.id, item.mtopNumber)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-xs bg-[#05b875] hover:bg-[#049d63] text-white shadow-emerald-600/20 whitespace-nowrap active:scale-[0.98]"
                            title="Generate permanent QR code for this unit"
                          >
                            <QrCode className="h-3.5 w-3.5 text-white shrink-0" />
                            <span>Generate QR</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenRenewModal(item)}
                          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-2xs whitespace-nowrap active:scale-[0.98] ${
                            item.status === 'Expired' || item.status === 'Pending Renewal' || isRecordExpired(item.expirationDate)
                              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                              : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                          }`}
                          title="Renew franchise permit (set next expiration date and application number)"
                        >
                          <RefreshCw className="h-3.5 w-3.5 shrink-0" />
                          <span>Renew</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFranchiseToDelete(item)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-2xs bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 whitespace-nowrap active:scale-[0.98]"
                          title="Delete franchise record (Admin authorization required)"
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

      </div>

      {/* Renew Franchise Permit Modal (Set Next Expiration Date & Application No.) */}
      {franchiseToRenew && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <RefreshCw className="h-5 w-5 text-blue-400" />
                <div>
                  <h4 className="text-sm font-bold">Renew Franchise Permit</h4>
                  <p className="text-[11px] text-slate-300">
                    Unit {franchiseToRenew.mtopNumber} • {franchiseToRenew.driverName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFranchiseToRenew(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmRenewFranchise} className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">City Plate No.:</span>
                  <span className="font-bold text-slate-900">{franchiseToRenew.mtopNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Operator:</span>
                  <span className="font-semibold text-slate-800">{franchiseToRenew.operatorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Driver:</span>
                  <span className="font-semibold text-slate-800">{franchiseToRenew.driverName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Current Expiry:</span>
                  <span className="font-mono font-bold text-rose-600">{franchiseToRenew.expirationDate}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Application No.
                </label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <FileText className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={renewalApplicationNo}
                      onChange={(e) => setRenewalApplicationNo(e.target.value.toUpperCase())}
                      placeholder="e.g. APP-2026-105"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setRenewalApplicationNo(generateNewApplicationNo())}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    title="Generate new Application Number"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Next Expiration Date
                </label>
                <div className="relative">
                  <Calendar className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={renewalExpiryDate}
                    onChange={(e) => setRenewalExpiryDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
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
        </div>
      )}

      {/* Admin Passcode Authorization Modal for Franchise Deletion */}
      <AdminPasscodeModal
        isOpen={!!franchiseToDelete}
        title={`Delete ${vehicleCategory} Franchise Record`}
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
    </div>
  );
};
