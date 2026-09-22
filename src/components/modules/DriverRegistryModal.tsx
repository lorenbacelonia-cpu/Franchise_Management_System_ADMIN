import React, { useState } from 'react';
import { useFranchise } from '../../context/FranchiseContext';
import { ArrowLeft, UserCheck, Search, Phone, MapPin } from 'lucide-react';

export const DriverRegistryModal: React.FC = () => {
  const { activeModule, setActiveModule, franchises, vehicleCategory } = useFranchise();
  const [searchTerm, setSearchTerm] = useState('');

  if (activeModule !== 'driver_registry') return null;

  const categoryFranchises = franchises.filter(f =>
    f.vehicleCategory === vehicleCategory &&
    (!searchTerm ||
      f.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.operatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.mtopNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-100 rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 p-6 space-y-4">

        {/* Top Back Navigation */}
        <div>
          <button
            onClick={() => setActiveModule('overview')}
            className="flex items-center space-x-2 text-xs font-bold text-slate-800 hover:text-slate-900 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Header Banner Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{vehicleCategory} Driver & Operator Registry</h2>
            <p className="text-xs text-slate-400 font-medium italic">Management</p>
          </div>
        </div>

        {/* Content Container */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 max-h-[65vh] overflow-y-auto">

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search driver name, license number, or operator..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-full text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryFranchises.map((item) => (
              <div key={item.id} className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm border border-emerald-200">
                      {item.driverName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{item.driverName}</h4>
                      <p className="text-xs text-emerald-700 font-medium">City Plate No.: {item.mtopNumber}</p>
                    </div>
                  </div>
                  <span className="badge-active text-[10px]">
                    Active Driver
                  </span>
                </div>

                <div className="space-y-1.5 text-xs border-t border-slate-200 pt-3">
                  <div className="flex items-center text-slate-600">
                    <UserCheck className="h-3.5 w-3.5 mr-2 text-slate-400" />
                    <span className="font-semibold mr-1">License No.:</span>
                    <span className="font-mono text-slate-800">{item.driverLicenseNo}</span>
                  </div>

                  <div className="flex items-center text-slate-600">
                    <Phone className="h-3.5 w-3.5 mr-2 text-slate-400" />
                    <span className="font-semibold mr-1">Contact:</span>
                    <span>{item.operatorContact}</span>
                  </div>

                  <div className="flex items-center text-slate-600">
                    <MapPin className="h-3.5 w-3.5 mr-2 text-slate-400" />
                    <span className="font-semibold mr-1">Address:</span>
                    <span className="truncate">{item.operatorAddress}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};
