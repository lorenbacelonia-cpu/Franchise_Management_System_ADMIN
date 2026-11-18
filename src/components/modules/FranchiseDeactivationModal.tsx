import React, { useState, useEffect } from 'react';
import { useFranchise } from '../../context/FranchiseContext';
import { UserX, AlertTriangle, Lock, CheckCircle2 } from 'lucide-react';

export const FranchiseDeactivationModal: React.FC = () => {
  const { activeModule, franchises, deactivateFranchise } = useFranchise();

  const categoryFranchises = franchises;

  const [selectedFranchiseId, setSelectedFranchiseId] = useState(categoryFranchises[0]?.id || '');
  const [deactivationReason, setDeactivationReason] = useState('Multiple Unsettled Fare Overcharging Citations');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (franchises[0] && !selectedFranchiseId) {
      setSelectedFranchiseId(franchises[0].id);
    }
  }, [franchises, selectedFranchiseId]);

  if (activeModule !== 'deactivation') return null;

  const targetFranchise = categoryFranchises.find(f => f.id === selectedFranchiseId) || categoryFranchises[0];

  const handleConfirmDeactivation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFranchise) return;

    if (adminPassword !== '01012005' && adminPassword !== 'admin' && adminPassword !== '123456') {
      setErrorMsg('Invalid Administrator Password. Please try again.');
      return;
    }

    setErrorMsg(null);
    deactivateFranchise(targetFranchise.id, deactivationReason);
    setNotification(`Franchise Permit ${targetFranchise.mtopNumber} (${targetFranchise.operatorName}) has been officially REVOKED & DEACTIVATED.`);
    setShowPasswordConfirm(false);
    setAdminPassword('');
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center space-x-3.5">
        <div className="h-11 w-11 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
          <UserX className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Franchise Revocation &amp; Deactivation (Tricycle &amp; Pedicab)
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Administrative permit cancellation for flagged units — all actions on this single page
          </p>
        </div>
      </div>

      {notification && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold px-4 py-3 rounded-2xl flex items-center space-x-2 shadow-sm animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Content Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5 text-sm">
        {categoryFranchises.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <UserX className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No Units Registered</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              There are currently no active units to revoke or deactivate.
            </p>
          </div>
        ) : (
          <div className="max-w-3xl space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Select Franchise Unit to Revoke *
              </label>
              <select
                value={selectedFranchiseId}
                onChange={(e) => {
                  setSelectedFranchiseId(e.target.value);
                  setShowPasswordConfirm(false);
                  setErrorMsg(null);
                }}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none cursor-pointer"
              >
                {categoryFranchises.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.mtopNumber} ({f.vehicleCategory}) — {f.operatorName} ({f.status})
                  </option>
                ))}
              </select>
            </div>

            {targetFranchise && (
              <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-900 text-xs">Target Record Summary</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    targetFranchise.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {targetFranchise.status}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                  <p><span className="font-semibold text-slate-500">Operator:</span> {targetFranchise.operatorName}</p>
                  <p><span className="font-semibold text-slate-500">Driver:</span> {targetFranchise.driverName}</p>
                  <p><span className="font-semibold text-slate-500">City Plate No.:</span> {targetFranchise.mtopNumber}</p>
                  <p><span className="font-semibold text-slate-500">Violations:</span> {targetFranchise.violationsCount} recorded</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Official Revocation Grounds *
              </label>
              <select
                value={deactivationReason}
                onChange={(e) => setDeactivationReason(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-500 focus:outline-none cursor-pointer"
              >
                <option value="Multiple Unsettled Fare Overcharging Citations">Multiple Unsettled Fare Overcharging Citations</option>
                <option value="Colorum / Illegal Transfer of Unit">Colorum / Illegal Transfer of Unit</option>
                <option value="Severe Public Safety Infraction">Severe Public Safety Infraction</option>
                <option value="Expired Permit & Failure to Renew">Expired Permit &amp; Failure to Renew</option>
                <option value="Voluntary Operator Surrender">Voluntary Operator Surrender</option>
              </select>
            </div>

            {showPasswordConfirm ? (
              <form onSubmit={handleConfirmDeactivation} className="bg-slate-900 text-white p-5 rounded-2xl space-y-3 animate-fadeIn">
                <div className="flex items-center space-x-2 text-rose-400">
                  <Lock className="h-4 w-4" />
                  <span className="text-xs font-bold">Admin Password Authorization Required</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Please type administrator password to authorize official permit revocation (Demo pass: <code className="text-emerald-400">admin</code>).
                </p>
                {errorMsg && (
                  <p className="text-xs font-bold text-rose-400">{errorMsg}</p>
                )}
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter password..."
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordConfirm(false);
                      setErrorMsg(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm cursor-pointer"
                  >
                    Authorize Revocation
                  </button>
                </div>
              </form>
            ) : (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(true)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/30 flex items-center space-x-1.5 cursor-pointer"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>Proceed to Deactivation</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
