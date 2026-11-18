import React, { useState } from 'react';
import { useFranchise } from '../../context/FranchiseContext';
import type { FranchiseRecord } from '../../types';
import { X, RefreshCw, CheckCircle2, Calendar, Search, AlertCircle, FileText, Receipt } from 'lucide-react';
import confetti from 'canvas-confetti';
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

export const ProcessRenewalModal: React.FC = () => {
  const { activeModule, franchises, renewFranchise } = useFranchise();
  const [filterText, setFilterText] = useState('');
  const [selectedForRenewal, setSelectedForRenewal] = useState<FranchiseRecord | null>(null);
  const [renewalExpiryDate, setRenewalExpiryDate] = useState('');
  const [renewalApplicationNo, setRenewalApplicationNo] = useState('');
  const [renewalOrNumber, setRenewalOrNumber] = useState('');
  const [renewalPaymentDate, setRenewalPaymentDate] = useState('');
  const [renewalAmountPaid, setRenewalAmountPaid] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  if (activeModule !== 'renewal') return null;

  const categoryFranchises = franchises
    .filter(f =>
      !filterText ||
      f.mtopNumber.toLowerCase().includes(filterText.toLowerCase()) ||
      (f.vehicleCategory || '').toLowerCase().includes(filterText.toLowerCase()) ||
      (f.applicationNo || '').toLowerCase().includes(filterText.toLowerCase()) ||
      f.operatorName.toLowerCase().includes(filterText.toLowerCase()) ||
      f.driverName.toLowerCase().includes(filterText.toLowerCase()) ||
      f.status.toLowerCase().includes(filterText.toLowerCase())
    )
    .sort((a, b) => {
      const aExp = a.status === 'Expired' || isRecordExpired(a.expirationDate);
      const bExp = b.status === 'Expired' || isRecordExpired(b.expirationDate);
      if (aExp && !bExp) return -1;
      if (bExp && !aExp) return 1;
      return 0;
    });

  const handleOpenRenewalDialog = (item: FranchiseRecord) => {
    setSelectedForRenewal(item);
    setRenewalExpiryDate(computeDefaultNextExpiry(item.expirationDate));
    setRenewalApplicationNo(item.applicationNo || generateNewApplicationNo());
    setRenewalOrNumber(item.orNumber || item.receiptNumber || `OR-2026-${Math.floor(10000 + Math.random() * 90000)}`);
    setRenewalPaymentDate(new Date().toISOString().split('T')[0]);
    setRenewalAmountPaid(item.vehicleCategory === 'Pedicab' ? '250.00' : '450.00');
  };

  const handleConfirmRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForRenewal || !renewalExpiryDate || !renewalApplicationNo.trim()) return;

    await renewFranchise(selectedForRenewal.id, {
      newExpiry: renewalExpiryDate,
      applicationNo: renewalApplicationNo.trim().toUpperCase(),
      orNumber: renewalOrNumber.trim().toUpperCase(),
      amountPaid: renewalAmountPaid ? parseFloat(renewalAmountPaid) : undefined,
    });

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });

    setNotification(
      `Renewed unit ${selectedForRenewal.mtopNumber} (${selectedForRenewal.driverName}) • OR No: ${renewalOrNumber.trim().toUpperCase()} • Paid: ₱${parseFloat(renewalAmountPaid || '0').toFixed(2)} • Next Expiry: ${renewalExpiryDate}`
    );
    setTimeout(() => setNotification(null), 5000);
    setSelectedForRenewal(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="h-11 w-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
            <RefreshCw className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Process Franchise Renewal (Tricycle &amp; Pedicab)
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Select any unit below to update its next expiration date, application number, and official receipt right on this page
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl shrink-0">
          {categoryFranchises.length} Registered Units
        </span>
      </div>

      {notification && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold px-4 py-3 rounded-2xl flex items-center space-x-2 shadow-sm animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Inline Renewal Form Card (when a unit is selected) */}
      {selectedForRenewal && (
        <div className="bg-white rounded-3xl shadow-md border-2 border-blue-500/40 overflow-hidden animate-fadeIn">
          <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <RefreshCw className="h-5 w-5 text-blue-400" />
              <div>
                <h4 className="text-sm font-bold">
                  Inline Renewal Processing — Unit {selectedForRenewal.mtopNumber}
                </h4>
                <p className="text-[11px] text-slate-300">
                  Operator: {selectedForRenewal.operatorName} • Driver: {selectedForRenewal.driverName} • Current Expiry: {selectedForRenewal.expirationDate}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedForRenewal(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleConfirmRenewal} className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            {/* Official Receipt & Payment Details */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                  <Receipt className="h-4 w-4 text-blue-600" />
                  <span>Official Receipt &amp; Payment</span>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Renewal Fee
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Receipt Number (OR No.)
                  </label>
                  <input
                    type="text"
                    required
                    value={renewalOrNumber}
                    onChange={(e) => setRenewalOrNumber(e.target.value.toUpperCase())}
                    placeholder="OR-2026-10492"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    required
                    value={renewalPaymentDate}
                    onChange={(e) => setRenewalPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Amount Paid (PHP)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                      ₱
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={renewalAmountPaid}
                      onChange={(e) => setRenewalAmountPaid(e.target.value)}
                      placeholder={selectedForRenewal?.vehicleCategory === 'Pedicab' ? '250.00' : '450.00'}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedForRenewal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirm &amp; Save Renewal</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Search & Units Table Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        {/* Search bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search City Plate No., Application No., operator, driver, or status..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-900 text-white font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">City Plate No.</th>
                <th className="px-4 py-3">Application No.</th>
                <th className="px-4 py-3">Operator / Driver</th>
                <th className="px-4 py-3">Current Expiration</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categoryFranchises.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    <p className="text-sm font-semibold text-slate-600">No Franchise Records Available for Renewal</p>
                    <p className="text-xs text-slate-400 mt-1">There are currently 0 records matching your query.</p>
                  </td>
                </tr>
              ) : (
                categoryFranchises.map((item) => {
                  const isExpired = item.status === 'Expired' || isRecordExpired(item.expirationDate);
                  const isSelected = selectedForRenewal?.id === item.id;

                  return (
                    <tr
                      key={item.id}
                      className={
                        isSelected
                          ? 'bg-blue-50/70'
                          : isExpired
                          ? 'bg-rose-50/40 hover:bg-rose-50/70 transition-colors'
                          : 'hover:bg-slate-50/80 transition-colors'
                      }
                    >
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        <div className="flex items-center space-x-1.5">
                          <span>{item.mtopNumber}</span>
                          <span
                            className={`text-[10px] font-sans font-bold px-1.5 py-0.5 rounded-md border ${
                              item.vehicleCategory === 'Pedicab'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {item.vehicleCategory === 'Pedicab' ? '🚲 Pedicab' : '🛺 Tricycle'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                        {item.applicationNo || '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {item.operatorName}
                        <p className="text-[11px] text-slate-500 font-normal">Driver: {item.driverName}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span className={isExpired ? 'font-bold text-rose-700' : 'font-medium'}>
                            {item.expirationDate}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center space-x-1 ${
                            item.status === 'Active' && !isExpired
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {isExpired && <AlertCircle className="h-3 w-3 mr-1 text-rose-600" />}
                          <span>{isExpired ? 'Expired' : item.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleOpenRenewalDialog(item)}
                          className={`px-4 py-1.5 rounded-lg font-bold text-xs shadow-sm transition-all inline-flex items-center space-x-1.5 ml-auto cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 text-white'
                              : isExpired
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                          }`}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>{isSelected ? 'Editing Above' : isExpired ? 'Renew Permit' : 'Renew / Update'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
