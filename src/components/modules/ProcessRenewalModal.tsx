import React, { useState } from 'react';
import { useFranchise } from '../../context/FranchiseContext';
import { X, RefreshCw, CheckCircle2, Calendar, Search, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { isRecordExpired } from '../../utils/fareUtils';

export const ProcessRenewalModal: React.FC = () => {
  const { activeModule, setActiveModule, franchises, renewFranchise, vehicleCategory } = useFranchise();
  const [filterText, setFilterText] = useState('');

  if (activeModule !== 'renewal') return null;

  const categoryFranchises = franchises
    .filter(f => 
      f.vehicleCategory === vehicleCategory &&
      (!filterText || 
        f.mtopNumber.toLowerCase().includes(filterText.toLowerCase()) ||
        f.operatorName.toLowerCase().includes(filterText.toLowerCase()) ||
        f.driverName.toLowerCase().includes(filterText.toLowerCase()) ||
        f.status.toLowerCase().includes(filterText.toLowerCase()))
    )
    .sort((a, b) => {
      // Prioritize expired units at top
      if (a.status === 'Expired' && b.status !== 'Expired') return -1;
      if (b.status === 'Expired' && a.status !== 'Expired') return 1;
      return 0;
    });

  const handleRenew = (id: string) => {
    // Generate next year's renewal expiry date (1 year from now)
    const nextYear = new Date().getFullYear() + 1;
    const newExpiryDate = `${nextYear}-01-15`;
    renewFranchise(id, { newExpiry: newExpiryDate });
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="gradient-header px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-500/30">
              <RefreshCw className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Process {vehicleCategory} Renewal</h3>
              <p className="text-xs text-slate-300">Extend permit validity for registered {vehicleCategory} units</p>
            </div>
          </div>
          <button 
            onClick={() => setActiveModule('overview')}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Search bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search City Plate No., operator, driver, or status..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">City Plate No.</th>
                  <th className="px-5 py-3">Operator Name</th>
                  <th className="px-5 py-3">Vehicle Plate No.</th>
                  <th className="px-5 py-3">Current Expiration</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
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
                  const isRenewed = item.status === 'Active' && !isExpired;

                  return (
                    <tr key={item.id} className={isExpired ? "bg-rose-50/40 hover:bg-rose-50/70 transition-colors" : "hover:bg-slate-50/80 transition-colors"}>
                      <td className="px-5 py-3 font-mono font-bold text-slate-900">{item.mtopNumber}</td>
                      <td className="px-5 py-3 font-semibold text-slate-800">
                        {item.operatorName}
                        <p className="text-[11px] text-slate-400 font-normal">{item.operatorContact}</p>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-600">{item.plateNumber}</td>
                      <td className="px-5 py-3 text-xs text-slate-600 flex items-center space-x-1 mt-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span className={isExpired ? "font-bold text-rose-700" : ""}>{item.expirationDate}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center space-x-1 ${
                          item.status === 'Active' && !isExpired
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {isExpired && <AlertCircle className="h-3 w-3 mr-1 text-rose-600" />}
                          <span>{isExpired ? 'Expired' : item.status}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {isRenewed ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Valid ({item.expirationDate})
                          </span>
                        ) : (
                          <button
                            onClick={() => handleRenew(item.id)}
                            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-1 ml-auto cursor-pointer"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>Renew Permit</span>
                          </button>
                        )}
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
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
          >
            Close Portal
          </button>
        </div>

      </div>
    </div>
  );
};
