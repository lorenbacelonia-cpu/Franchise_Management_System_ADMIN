import React, { useState } from 'react';
import { useFranchise } from '../../context/FranchiseContext';
import {
  ArrowLeft,
  UserCheck,
  Search,
  Phone,
  MapPin,
  Building2,
  Users,
  Navigation
} from 'lucide-react';

export const DriverRegistryModal: React.FC = () => {
  const { activeModule, setActiveModule, franchises = [], vehicleCategory } = useFranchise();
  const [searchTerm, setSearchTerm] = useState('');

  if (activeModule !== 'driver_registry') return null;

  // Filter for the active vehicle category (Tricycle or Pedicab)
  const categoryFranchises = franchises.filter(f => f.vehicleCategory === vehicleCategory);

  // Filter with search term
  const filteredFranchises = categoryFranchises.filter(f => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      (f.operatorName || '').toLowerCase().includes(term) ||
      (f.driverName || '').toLowerCase().includes(term) ||
      (f.cityPlateNumber || f.mtopNumber || '').toLowerCase().includes(term) ||
      (f.status || '').toLowerCase().includes(term) ||
      (f.operatorContact || '').toLowerCase().includes(term) ||
      (f.operatorAddress || f.residentialAddress || '').toLowerCase().includes(term) ||
      (f.driverAddress || '').toLowerCase().includes(term) ||
      (f.routeParada || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-100 rounded-3xl shadow-2xl max-w-5xl w-full overflow-hidden border border-slate-200 p-6 space-y-4 max-h-[92vh] flex flex-col">

        {/* Top Back Navigation */}
        <div className="flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => setActiveModule('overview')}
            className="flex items-center space-x-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </button>

          <span className="text-[11px] font-mono text-slate-500 bg-slate-200/70 px-2.5 py-1 rounded-full font-semibold">
            {vehicleCategory} Registry • {categoryFranchises.length} Total Units
          </span>
        </div>

        {/* Header Banner Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="h-11 w-11 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 shadow-xs">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {vehicleCategory} Driver &amp; Operator Registry
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Official directory of registered operators, franchise grantees &amp; authorized drivers
              </p>
            </div>
          </div>

          {/* Unified Combined Metric Box (In One) */}
          <div className="bg-indigo-50/70 border border-indigo-200/80 px-4 py-2 rounded-2xl text-center shrink-0 shadow-2xs">
            <span className="block text-[10px] uppercase font-bold text-indigo-700 tracking-wider">
              Operators &amp; Drivers
            </span>
            <span className="text-base font-black text-slate-900 font-mono">
              {categoryFranchises.length}
            </span>
          </div>
        </div>

        {/* Controls Bar: Unified Header & Search Bar (In One) */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
            <Users className="h-4 w-4 text-indigo-600 shrink-0" />
            <span>Driver &amp; Operator Registry ({filteredFranchises.length})</span>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search operator, driver, plate, or status…"
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
            />
          </div>
        </div>

        {/* Content Container (Scrollable) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex-1 overflow-y-auto space-y-4 min-h-0">

          {filteredFranchises.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <Users className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">
                {searchTerm
                  ? `No matching records found for "${searchTerm}"`
                  : `No Registered ${vehicleCategory} Records Found`}
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchTerm
                  ? 'Try searching with another operator name, driver name, or city plate number.'
                  : 'Registered franchise units and their assigned drivers and operators will appear in this registry.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFranchises.map((item) => {
                const plate = item.cityPlateNumber || item.mtopNumber || '—';
                const operatorInitial = (item.operatorName || 'O').trim().charAt(0).toUpperCase();
                const driverInitial = (item.driverName || 'D').trim().charAt(0).toUpperCase();

                return (
                  <div
                    key={item.id}
                    className="bg-slate-50/90 hover:bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 hover:border-slate-300 transition-all space-y-3.5 shadow-xs"
                  >
                    {/* Unit Top Bar */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-1 bg-slate-900 text-white font-mono font-bold text-xs rounded-lg shadow-xs">
                          Plate {plate}
                        </span>
                        {item.routeParada && (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            <Navigation className="h-2.5 w-2.5 text-slate-400" />
                            <span className="truncate max-w-[140px]">{item.routeParada}</span>
                          </span>
                        )}
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : item.status === 'Expired'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {item.status || 'Active'}
                      </span>
                    </div>

                    {/* Operator Box */}
                    <div className="bg-white p-3 rounded-xl border border-indigo-100 space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 text-[11px] font-bold text-indigo-700 uppercase tracking-wide">
                          <Building2 className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                          <span>Franchise Operator</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">Owner</span>
                      </div>
                      <div className="flex items-center space-x-2.5 pt-0.5">
                        <div className="h-8 w-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 font-black text-xs flex items-center justify-center shrink-0">
                          {operatorInitial}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {item.operatorName || 'No Operator Recorded'}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono truncate flex items-center">
                            <Phone className="h-3 w-3 mr-1 text-slate-400 shrink-0" />
                            <span>{item.operatorContact || 'No contact number'}</span>
                          </p>
                        </div>
                      </div>
                      {item.operatorAddress && (
                        <p className="text-[10px] text-slate-500 truncate flex items-center pt-1 border-t border-slate-100 mt-1">
                          <MapPin className="h-3 w-3 mr-1 text-slate-400 shrink-0" />
                          <span className="truncate">{item.operatorAddress}</span>
                        </p>
                      )}
                    </div>

                    {/* Driver Box */}
                    <div className="bg-white p-3 rounded-xl border border-emerald-100 space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 text-[11px] font-bold text-emerald-700 uppercase tracking-wide">
                          <UserCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>Authorized Driver</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Active
                        </span>
                      </div>
                      <div className="flex items-center space-x-2.5 pt-0.5">
                        <div className="h-8 w-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0">
                          {driverInitial}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {item.driverName || 'No Driver Assigned'}
                          </p>
                          <div className="flex items-center space-x-1.5 text-[11px] mt-0.5">
                            <span className="font-semibold text-slate-500">Status:</span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase font-mono ${
                              item.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : item.status === 'Expired'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                              {item.status || 'Active'}
                            </span>
                          </div>
                        </div>
                      </div>
                      {item.driverAddress && (
                        <p className="text-[10px] text-slate-500 truncate flex items-center pt-1 border-t border-slate-100 mt-1">
                          <MapPin className="h-3 w-3 mr-1 text-slate-400 shrink-0" />
                          <span className="truncate">{item.driverAddress}</span>
                        </p>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
