import React, { useState, useEffect } from 'react';
import { useFranchise } from '../../context/FranchiseContext';
import { X, UserX, AlertTriangle, Lock } from 'lucide-react';

export const FranchiseDeactivationModal: React.FC = () => {
  const { activeModule, setActiveModule, franchises, deactivateFranchise, vehicleCategory } = useFranchise();

  const categoryFranchises = franchises.filter(f => f.vehicleCategory === vehicleCategory);

  const [selectedFranchiseId, setSelectedFranchiseId] = useState(categoryFranchises[0]?.id || '');
  const [deactivationReason, setDeactivationReason] = useState('Multiple Unsettled Fare Overcharging Citations');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  useEffect(() => {
    const first = franchises.find(f => f.vehicleCategory === vehicleCategory);
    if (first) {
      setSelectedFranchiseId(first.id);
    }
  }, [vehicleCategory, franchises]);

  if (activeModule !== 'deactivation') return null;

  const targetFranchise = categoryFranchises.find(f => f.id === selectedFranchiseId) || categoryFranchises[0];

  const handleConfirmDeactivation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFranchise) return;

    if (adminPassword !== '01012005' && adminPassword !== 'admin' && adminPassword !== '123456') {
      alert("Invalid Administrator Password.");
      return;
    }

    deactivateFranchise(targetFranchise.id, deactivationReason);
    alert(`Franchise Permit ${targetFranchise.mtopNumber} has been officially REVOKED & DEACTIVATED.`);
    setActiveModule('overview');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="gradient-header px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500/20 text-red-300 rounded-xl border border-red-500/30">
              <UserX className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{vehicleCategory} Revocation & Deactivation Portal</h3>
              <p className="text-xs text-slate-300">Administrative permit cancellation for flagged {vehicleCategory} units</p>
            </div>
          </div>
          <button 
            onClick={() => setActiveModule('overview')}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-sm">
          {categoryFranchises.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <UserX className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No {vehicleCategory} Units Registered</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                There are currently no active {vehicleCategory} units to revoke or deactivate.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModule('overview')}
                  className="px-5 py-2 rounded-full text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Franchise Unit to Revoke *</label>
                <select
                  value={selectedFranchiseId}
                  onChange={(e) => setSelectedFranchiseId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                >
                  {categoryFranchises.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.mtopNumber} — {f.operatorName} ({f.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Unit Summary Card */}
              {targetFranchise && (
                <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-900 text-xs">Target Record Summary</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      targetFranchise.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {targetFranchise.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                    <p><span className="font-semibold text-slate-500">Operator:</span> {targetFranchise.operatorName}</p>
                    <p><span className="font-semibold text-slate-500">Driver:</span> {targetFranchise.driverName}</p>
                    <p><span className="font-semibold text-slate-500">City Plate No.:</span> {targetFranchise.mtopNumber}</p>
                    <p><span className="font-semibold text-slate-500">Violations:</span> {targetFranchise.violationsCount} recorded</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Revocation Grounds *</label>
                <select
                  value={deactivationReason}
                  onChange={(e) => setDeactivationReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                >
                  <option value="Multiple Unsettled Fare Overcharging Citations">Multiple Unsettled Fare Overcharging Citations</option>
                  <option value="Colorum / Illegal Transfer of Unit">Colorum / Illegal Transfer of Unit</option>
                  <option value="Severe Public Safety Infraction">Severe Public Safety Infraction</option>
                  <option value="Expired Permit & Failure to Renew">Expired Permit & Failure to Renew</option>
                  <option value="Voluntary Operator Surrender">Voluntary Operator Surrender</option>
                </select>
              </div>

              {/* Security Password Confirm */}
              {showPasswordConfirm ? (
                <form onSubmit={handleConfirmDeactivation} className="bg-slate-900 text-white p-4 rounded-xl space-y-3">
                  <div className="flex items-center space-x-2 text-rose-400">
                    <Lock className="h-4 w-4" />
                    <span className="text-xs font-bold">Admin Password Authorization Required</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Please type administrator password to authorize official permit revocation (Demo pass: <code className="text-emerald-400">admin</code>).
                  </p>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirm(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                    >
                      Authorize Revocation
                    </button>
                  </div>
                </form>
              ) : (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveModule('overview')}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(true)}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/30 flex items-center space-x-1.5"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <span>Proceed to Deactivation</span>
                  </button>
                </div>
              )}
            </>
          )}

        </div>

      </div>
    </div>
  );
};
