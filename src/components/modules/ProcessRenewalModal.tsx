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
  const { activeModule, setActiveModule, franchises, renewFranchise, vehicleCategory } = useFranchise();
  const [filterText, setFilterText] = useState('');
  const [selectedForRenewal, setSelectedForRenewal] = useState<FranchiseRecord | null>(null);
  const [renewalExpiryDate, setRenewalExpiryDate] = useState('');
  const [renewalApplicationNo, setRenewalApplicationNo] = useState('');
  const [renewalOrNumber, setRenewalOrNumber] = useState('');
  const [renewalPaymentDate, setRenewalPaymentDate] = useState('');
  const [renewalAmountPaid, setRenewalAmountPaid] = useState('');
  const [renewalError, setRenewalError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  if (activeModule !== 'renewal') return null;

  const categoryFranchises = franchises
    .filter(f => 
      f.vehicleCategory === vehicleCategory &&
      (!filterText || 
        f.mtopNumber.toLowerCase().includes(filterText.toLowerCase()) ||
        (f.applicationNo || '').toLowerCase().includes(filterText.toLowerCase()) ||
        f.operatorName.toLowerCase().includes(filterText.toLowerCase()) ||
        f.driverName.toLowerCase().includes(filterText.toLowerCase()) ||
        f.status.toLowerCase().includes(filterText.toLowerCase()))
    )
    .sort((a, b) => {
      // Prioritize expired units at top
      const aExp = a.status === 'Expired' || isRecordExpired(a.expirationDate);
      const bExp = b.status === 'Expired' || isRecordExpired(b.expirationDate);
      if (aExp && !bExp) return -1;
      if (bExp && !aExp) return 1;
      return 0;
    });

  const handleOpenRenewalDialog = (item: FranchiseRecord) => {
    setSelectedForRenewal(item);
    setRenewalError(null);
    setRenewalExpiryDate(computeDefaultNextExpiry(item.expirationDate));
    setRenewalApplicationNo(item.applicationNo || generateNewApplicationNo());
    setRenewalOrNumber(item.orNumber || item.receiptNumber || `OR-2026-${Math.floor(10000 + Math.random() * 90000)}`);
    setRenewalPaymentDate(new Date().toISOString().split('T')[0]);
    setRenewalAmountPaid(vehicleCategory === 'Pedicab' ? '250.00' : '450.00');
  };

  const handleConfirmRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForRenewal) return;

    // Validation 1: Application Number
    if (!renewalApplicationNo.trim()) {
      setRenewalError('Application Number is required.');
      return;
    }

    // Validation 2: Expiration Date must be later than current expiry
    if (!renewalExpiryDate) {
      setRenewalError('Please select a valid Next Expiration Date.');
      return;
    }
    if (selectedForRenewal.expirationDate && renewalExpiryDate <= selectedForRenewal.expirationDate) {
      setRenewalError(
        `Next Expiration Date (${renewalExpiryDate}) must be later than the current expiration date (${selectedForRenewal.expirationDate}).`
      );
      return;
    }

    // Validation 3: Official Receipt (OR No.)
    if (!renewalOrNumber.trim()) {
      setRenewalError('Official Receipt (OR No.) is required to process renewal.');
      return;
    }

    // Validation 4: Payment Date
    if (!renewalPaymentDate) {
      setRenewalError('Payment date is required.');
      return;
    }

    // Validation 5: Amount Paid
    const parsedAmount = parseFloat(renewalAmountPaid);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setRenewalError('Amount Paid must be a valid positive amount greater than ₱0.00.');
      return;
    }

    setRenewalError(null);
    await renewFranchise(selectedForRenewal.id, {
      newExpiry: renewalExpiryDate,
      applicationNo: renewalApplicationNo.trim().toUpperCase(),
      orNumber: renewalOrNumber.trim().toUpperCase(),
      amountPaid: parsedAmount,
    });

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });

    setNotification(
      `Renewed unit ${selectedForRenewal.mtopNumber} (${selectedForRenewal.driverName}) • OR No: ${renewalOrNumber.trim().toUpperCase()} • Paid: ₱${parsedAmount.toFixed(2)} • Next Expiry: ${renewalExpiryDate}`
    );
    setTimeout(() => setNotification(null), 5000);
    setSelectedForRenewal(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="gradient-header px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-500/30">
              <RefreshCw className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Process {vehicleCategory} Renewal</h3>
              <p className="text-xs text-slate-300">Set next expiration date and application number for registered {vehicleCategory} units</p>
            </div>
          </div>
          <button 
            onClick={() => setActiveModule('overview')}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {notification && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold px-4 py-3 rounded-xl flex items-center space-x-2 shadow-sm animate-fadeIn">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{notification}</span>
            </div>
          )}

          {/* Search bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search City Plate No., Application No., operator, driver, or status..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
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
                      <p className="text-sm font-semibold text-slate-600">No {vehicleCategory} Records Available for Renewal</p>
                      <p className="text-xs text-slate-400 mt-1">There are currently 0 records matching your query.</p>
                    </td>
                  </tr>
                ) : (
                  categoryFranchises.map((item) => {
                  const isExpired = item.status === 'Expired' || isRecordExpired(item.expirationDate);

                  return (
                    <tr key={item.id} className={isExpired ? "bg-rose-50/40 hover:bg-rose-50/70 transition-colors" : "hover:bg-slate-50/80 transition-colors"}>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{item.mtopNumber}</td>
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
                          <span className={isExpired ? "font-bold text-rose-700" : "font-medium"}>{item.expirationDate}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center space-x-1 ${
                          item.status === 'Active' && !isExpired
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {isExpired && <AlertCircle className="h-3 w-3 mr-1 text-rose-600" />}
                          <span>{isExpired ? 'Expired' : item.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleOpenRenewalDialog(item)}
                          className={`px-4 py-1.5 rounded-lg font-bold text-xs shadow-sm transition-all inline-flex items-center space-x-1.5 ml-auto cursor-pointer ${
                            isExpired
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                          }`}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>{isExpired ? 'Renew Permit' : 'Renew / Update'}</span>
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

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Showing {categoryFranchises.length} {vehicleCategory} units
          </span>
          <button
            onClick={() => setActiveModule('overview')}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
          >
            Close Portal
          </button>
        </div>

      </div>

      {/* Set Next Expiration Date & Application No. Modal */}
      {selectedForRenewal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <RefreshCw className="h-5 w-5 text-blue-400" />
                <div>
                  <h4 className="text-sm font-bold">Renew Franchise Permit</h4>
                  <p className="text-[11px] text-slate-300">
                    Unit {selectedForRenewal.mtopNumber} • {selectedForRenewal.driverName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedForRenewal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmRenewal} className="p-6 space-y-4">
              {/* Validation Error Banner */}
              {renewalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-800 animate-fadeIn">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-bold">Renewal Validation Error</p>
                    <p className="text-xs text-rose-700 mt-0.5">{renewalError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRenewalError(null)}
                    className="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">City Plate No.:</span>
                  <span className="font-bold text-slate-900">{selectedForRenewal.mtopNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Operator:</span>
                  <span className="font-semibold text-slate-800">{selectedForRenewal.operatorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Driver:</span>
                  <span className="font-semibold text-slate-800">{selectedForRenewal.driverName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Current Expiry:</span>
                  <span className="font-mono font-bold text-rose-600">{selectedForRenewal.expirationDate}</span>
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Next Expiration Date
                  </label>
                  {selectedForRenewal.expirationDate && renewalExpiryDate && renewalExpiryDate <= selectedForRenewal.expirationDate ? (
                    <span className="text-[10px] font-extrabold text-rose-800 bg-rose-100 border border-rose-300 px-1.5 py-0.5 rounded">
                      ⚠️ Must be after {selectedForRenewal.expirationDate}
                    </span>
                  ) : renewalExpiryDate ? (
                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded">
                      ✓ Valid Extension
                    </span>
                  ) : null}
                </div>
                <div className="relative">
                  <Calendar className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={renewalExpiryDate}
                    onChange={(e) => {
                      setRenewalExpiryDate(e.target.value);
                      if (renewalError) setRenewalError(null);
                    }}
                    className={`w-full pl-9 pr-3 py-2 bg-white border rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                      selectedForRenewal.expirationDate && renewalExpiryDate && renewalExpiryDate <= selectedForRenewal.expirationDate
                        ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/30'
                        : 'border-slate-300 focus:ring-blue-500'
                    }`}
                  />
                </div>
                {selectedForRenewal.expirationDate && renewalExpiryDate && renewalExpiryDate <= selectedForRenewal.expirationDate && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">
                    ⚠️ The new expiration date must be after current expiration date ({selectedForRenewal.expirationDate}).
                  </p>
                )}
              </div>

              {/* Official Receipt & Payment Details */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                    <Receipt className="h-4 w-4 text-blue-600" />
                    <span>Official Receipt & Payment</span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    Renewal Fee
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Amount Paid (PHP)
                      </label>
                      {parseFloat(renewalAmountPaid) > 0 ? (
                        <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1 py-0.2 rounded">
                          ✓ Valid
                        </span>
                      ) : renewalAmountPaid ? (
                        <span className="text-[9px] font-bold text-rose-800 bg-rose-100 border border-rose-300 px-1 py-0.2 rounded">
                          Invalid
                        </span>
                      ) : null}
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                        ₱
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={renewalAmountPaid}
                        onChange={(e) => {
                          setRenewalAmountPaid(e.target.value);
                          if (renewalError) setRenewalError(null);
                        }}
                        placeholder={vehicleCategory === 'Pedicab' ? '250.00' : '450.00'}
                        className={`w-full pl-6 pr-2.5 py-1.5 bg-white border rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                          renewalAmountPaid && (parseFloat(renewalAmountPaid) <= 0 || isNaN(parseFloat(renewalAmountPaid)))
                            ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/30'
                            : 'border-slate-300 focus:ring-blue-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
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
                  <span>Confirm Renewal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
