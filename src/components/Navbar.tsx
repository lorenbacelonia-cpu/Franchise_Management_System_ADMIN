import React from 'react';
import { useFranchise } from '../context/FranchiseContext';
import { LogOut } from 'lucide-react';
import { VehicleSwitcher } from './VehicleSwitcher';

export const Navbar: React.FC = () => {
  const { setIsAuthenticated, vehicleCategory } = useFranchise();

  return (
    <header className="bg-transparent py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          
          {/* Admin Dashboard Title - Adapts cleanly to selected vehicle category (as in Figma artboard names) */}
          <div className="flex items-center space-x-3">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Admin {vehicleCategory} Dashboard
            </h1>
            <span className={`hidden md:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
              vehicleCategory === 'Tricycle' 
                ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}>
              <span>{vehicleCategory === 'Tricycle' ? '🛺' : '🚲'}</span>
              <span>{vehicleCategory} Mode</span>
            </span>
          </div>

          {/* Vehicle Type Dropdown [ Vehicle Type: Tricycle / Pedicab ▾ ] */}
          <div className="flex items-center justify-center">
            <VehicleSwitcher />
          </div>

          {/* Log Out Pill Button */}
          <div className="flex-shrink-0">
            <button
              onClick={() => setIsAuthenticated(false)}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-full px-5 py-2.5 shadow-sm transition-all flex items-center space-x-2 cursor-pointer"
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
