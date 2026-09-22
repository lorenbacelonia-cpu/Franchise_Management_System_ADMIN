import React, { useState, useRef, useEffect } from 'react';
import { useFranchise } from '../context/FranchiseContext';
import { ChevronDown, Check } from 'lucide-react';

export const VehicleSwitcher: React.FC = () => {
  const { vehicleCategory, setVehicleCategory } = useFranchise();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold text-slate-800 transition-colors cursor-pointer shadow-sm"
      >
        <span className="text-base">{vehicleCategory === 'Tricycle' ? '🛺' : '🚲'}</span>
        <span>Vehicle Type: {vehicleCategory}</span>
        <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100">
            Select Vehicle Section
          </div>
          <button
            type="button"
            onClick={() => {
              setVehicleCategory('Tricycle');
              setIsOpen(false);
            }}
            className={`w-full text-left px-3.5 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors ${
              vehicleCategory === 'Tricycle' ? 'text-emerald-700 bg-emerald-50/70' : 'text-slate-700'
            }`}
          >
            <span className="flex items-center space-x-2">
              <span>🛺</span>
              <span>Tricycle</span>
            </span>
            {vehicleCategory === 'Tricycle' && <Check className="w-4 h-4 text-emerald-600" />}
          </button>
          <button
            type="button"
            onClick={() => {
              setVehicleCategory('Pedicab');
              setIsOpen(false);
            }}
            className={`w-full text-left px-3.5 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors ${
              vehicleCategory === 'Pedicab' ? 'text-emerald-700 bg-emerald-50/70' : 'text-slate-700'
            }`}
          >
            <span className="flex items-center space-x-2">
              <span>🚲</span>
              <span>Pedicab</span>
            </span>
            {vehicleCategory === 'Pedicab' && <Check className="w-4 h-4 text-emerald-600" />}
          </button>
        </div>
      )}
    </div>
  );
};
