import React from 'react';
import { useFranchise } from '../context/FranchiseContext';
import { 
  Calendar, 
  CalendarDays, 
  X, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { 
  getTodayYMD, 
  getYesterdayYMD, 
  getFilterDisplayLabel, 
  type DateFilterPreset 
} from '../utils/dateFilter';

export const DashboardDateFilter: React.FC = () => {
  const { dateFilter, setDateFilter, resetDateFilter } = useFranchise();

  const handlePresetSelect = (preset: DateFilterPreset) => {
    if (preset === 'all') {
      resetDateFilter();
    } else if (preset === 'today') {
      setDateFilter({ preset: 'today', selectedDate: getTodayYMD() });
    } else if (preset === 'yesterday') {
      setDateFilter({ preset: 'yesterday', selectedDate: getYesterdayYMD() });
    } else {
      setDateFilter({ preset, selectedDate: '' });
    }
  };

  const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      setDateFilter({
        preset: 'custom',
        selectedDate: val
      });
    } else {
      resetDateFilter();
    }
  };

  const isFiltered = dateFilter.preset !== 'all';
  const filterLabel = getFilterDisplayLabel(dateFilter);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-xs transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left Side: Header & Presets */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
          <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs sm:text-sm shrink-0">
            <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
            <span>Filter by Date / Day:</span>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handlePresetSelect('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                dateFilter.preset === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              All Time
            </button>

            <button
              type="button"
              onClick={() => handlePresetSelect('today')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                dateFilter.preset === 'today'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Today</span>
            </button>

            <button
              type="button"
              onClick={() => handlePresetSelect('yesterday')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                dateFilter.preset === 'yesterday'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Yesterday
            </button>

            <button
              type="button"
              onClick={() => handlePresetSelect('week')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                dateFilter.preset === 'week'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              This Week
            </button>

            <button
              type="button"
              onClick={() => handlePresetSelect('month')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                dateFilter.preset === 'month'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              This Month
            </button>
          </div>
        </div>

        {/* Right Side: Specific Day Picker & Active Filter Chip */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <CalendarDays className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-slate-500 font-medium text-[11px] hidden sm:inline">Pick Day:</span>
            <input
              type="date"
              value={dateFilter.preset === 'custom' || dateFilter.selectedDate ? dateFilter.selectedDate : ''}
              onChange={handleCustomDateChange}
              className="bg-transparent text-slate-800 font-bold text-xs outline-none cursor-pointer"
              title="Filter by specific day"
            />
          </div>

          {isFiltered && (
            <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-xl text-xs font-bold animate-fadeIn">
              <span className="text-[11px] truncate max-w-[170px] sm:max-w-none">
                {filterLabel}
              </span>
              <button
                type="button"
                onClick={resetDateFilter}
                className="text-emerald-700 hover:text-emerald-900 p-0.5 rounded-full hover:bg-emerald-100 transition-colors cursor-pointer"
                title="Reset date filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {isFiltered && (
            <button
              type="button"
              onClick={resetDateFilter}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer text-xs flex items-center space-x-1"
              title="Clear date filter"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold hidden md:inline">Reset</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
