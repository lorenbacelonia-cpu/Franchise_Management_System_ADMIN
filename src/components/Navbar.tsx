import React from 'react';
import { useFranchise } from '../context/FranchiseContext';
import { LogOut, ShieldCheck } from 'lucide-react';
import { VehicleSwitcher } from './VehicleSwitcher';

export const Navbar: React.FC = () => {
  const { setIsAuthenticated, vehicleCategory, currentAdmin } = useFranchise();

  return (
    <header className="bg-transparent py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          
          {/* Admin Dashboard Title - Adapts cleanly to selected vehicle category */}
          <div className="flex items-center space-x-3">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Admin {vehicleCategory} Dashboard
            </h1>
            <span className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
              vehicleCategory === 'Tricycle' 
                ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}>
              <span>{vehicleCategory === 'Tricycle' ? '🛺' : '🚲'}</span>
              <span>{vehicleCategory} Mode</span>
            </span>
          </div>

          {/* Center & Right Actions */}
          <div className="flex items-center space-x-3 ml-auto">
            {/* Vehicle Type Dropdown */}
            <VehicleSwitcher />

            {/* Current Active Admin Pill */}
            <div className="hidden md:flex items-center space-x-2 bg-slate-900 text-white px-3.5 py-1.5 rounded-full border border-slate-700 shadow-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <div className="text-left">
                <p className="text-[10px] font-mono font-bold text-slate-200 leading-none">{currentAdmin.adminId}</p>
                <p className="text-[9px] text-emerald-400 font-semibold leading-none mt-0.5">Admin In-Charge</p>
              </div>
            </div>

            {/* Log Out Pill Button */}
            <button
              onClick={() => setIsAuthenticated(false)}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-full px-4 py-2 sm:px-5 sm:py-2.5 shadow-sm transition-all flex items-center space-x-2 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
