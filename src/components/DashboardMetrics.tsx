import React from 'react';
import { useFranchise } from '../context/FranchiseContext';
import { 
  CalendarDays,
  X
} from 'lucide-react';
import { 
  isDateMatchingFilter, 
  getFilterDisplayLabel,
  getTodayYMD,
  getYesterdayYMD
} from '../utils/dateFilter';

export const DashboardMetrics: React.FC = () => {
  const { 
    franchises, 
    pendingReviews, 
    dateFilter,
    setDateFilter,
    resetDateFilter,
    setActiveModule
  } = useFranchise();

  // 1. Unified Tricycle & Pedicab records
  const categoryFranchises = franchises;
  const categoryReviews = pendingReviews;

  const isFiltered = dateFilter.preset !== 'all';
  const filterLabel = getFilterDisplayLabel(dateFilter);

  // 2. Date-filtered subsets
  const dateFilteredFranchises = categoryFranchises.filter(f => 
    isDateMatchingFilter(f.registrationDate || f.paymentDate, dateFilter)
  );

  const dateFilteredReviews = categoryReviews.filter(r => 
    isDateMatchingFilter(r.dateSubmitted, dateFilter)
  );

  const activeFranchisesPool = isFiltered ? dateFilteredFranchises : categoryFranchises;
  const activeReviewsPool = isFiltered ? dateFilteredReviews : categoryReviews;

  // 3. Metric 1: TOTAL FRANCHISES (Combined, Tricycle, Pedicab)
  const totalCount = activeFranchisesPool.length;
  const totalTricycle = activeFranchisesPool.filter(f => f.vehicleCategory === 'Tricycle').length;
  const totalPedicab = activeFranchisesPool.filter(f => f.vehicleCategory === 'Pedicab').length;

  // 4. Metric 2: TOTAL ACTIVE (Combined, Tricycle, Pedicab)
  const activeCount = activeFranchisesPool.filter(f => f.status === 'Active').length;
  const activeTricycle = activeFranchisesPool.filter(f => f.status === 'Active' && f.vehicleCategory === 'Tricycle').length;
  const activePedicab = activeFranchisesPool.filter(f => f.status === 'Active' && f.vehicleCategory === 'Pedicab').length;

  // 5. Metric 3: TOTAL PENDING (Combined, Tricycle, Pedicab)
  const pendingRenewalsTricycle = activeFranchisesPool.filter(f => f.status === 'Pending Renewal' && f.vehicleCategory === 'Tricycle').length;
  const pendingRenewalsPedicab = activeFranchisesPool.filter(f => f.status === 'Pending Renewal' && f.vehicleCategory === 'Pedicab').length;
  const pendingAppsTricycle = activeReviewsPool.filter(r => (r.status === 'Pending Document Review' || !r.status) && r.vehicleCategory === 'Tricycle').length;
  const pendingAppsPedicab = activeReviewsPool.filter(r => (r.status === 'Pending Document Review' || !r.status) && r.vehicleCategory === 'Pedicab').length;

  const pendingTricycle = pendingRenewalsTricycle + pendingAppsTricycle;
  const pendingPedicab = pendingRenewalsPedicab + pendingAppsPedicab;
  const totalPending = pendingTricycle + pendingPedicab;

  const allExpiredCount = activeFranchisesPool.filter(f => f.status === 'Expired').length;

  return (
    <div className="space-y-4 mb-8">
      {/* Date / Day Filter Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Presets Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-wrap">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs sm:text-sm shrink-0">
              <span className="tracking-tight">Date / Day Filter:</span>
            </div>

            <div className="flex items-center flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => resetDateFilter()}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  dateFilter.preset === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                All Time
              </button>

              <button
                type="button"
                onClick={() => setDateFilter({ preset: 'today', selectedDate: getTodayYMD() })}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  dateFilter.preset === 'today'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600'
                }`}
              >
                Today
              </button>

              <button
                type="button"
                onClick={() => setDateFilter({ preset: 'yesterday', selectedDate: getYesterdayYMD() })}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  dateFilter.preset === 'yesterday'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                Yesterday
              </button>

              <button
                type="button"
                onClick={() => setDateFilter({ preset: 'week', selectedDate: '' })}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  dateFilter.preset === 'week'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                This Week
              </button>

              <button
                type="button"
                onClick={() => setDateFilter({ preset: 'month', selectedDate: '' })}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  dateFilter.preset === 'month'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                This Month
              </button>
            </div>
          </div>

          {/* Specific Day Picker & Active Badge */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
              <CalendarDays className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="text-slate-500 font-medium text-[11px] hidden sm:inline">Pick Day:</span>
              <input
                type="date"
                value={dateFilter.preset === 'custom' || dateFilter.selectedDate ? dateFilter.selectedDate : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    setDateFilter({ preset: 'custom', selectedDate: val });
                  } else {
                    resetDateFilter();
                  }
                }}
                className="bg-transparent text-slate-800 font-bold text-xs outline-none cursor-pointer"
                title="Filter metrics by specific day"
              />
            </div>

            {isFiltered && (
              <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-xl text-xs font-bold animate-fadeIn">
                <span className="text-[11px]">{filterLabel}</span>
                <button
                  type="button"
                  onClick={resetDateFilter}
                  className="text-emerald-700 hover:text-emerald-950 p-0.5 rounded-full hover:bg-emerald-100 transition-colors cursor-pointer"
                  title="Clear date filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid of 3 Main Metrics Cards: Total, Active, Pending */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD 1: TOTAL FRANCHISES */}
        <div 
          onClick={() => setActiveModule('franchise_records')}
          className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-indigo-300 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-500 rounded-t-3xl" />
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Total Franchises
              </h3>
              {isFiltered ? (
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                  {filterLabel}
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  All Time
                </span>
              )}
            </div>

            {/* Combined Total */}
            <div className="mt-3 flex items-baseline space-x-2.5 flex-wrap">
              <span className="text-4xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                {totalCount}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {isFiltered ? `records for ${filterLabel}` : 'total registered units'}
              </span>
            </div>

            {/* DUAL BREAKDOWN: TRICYCLE & PEDICAB */}
            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
              {/* Tricycle */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-2.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-900">
                    Tricycle
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded-full">
                    {totalCount > 0 ? `${Math.round((totalTricycle / totalCount) * 100)}%` : '0%'}
                  </span>
                </div>
                <div className="mt-1 flex items-baseline space-x-1">
                  <span className="text-xl font-black text-emerald-800">{totalTricycle}</span>
                  <span className="text-[10px] text-emerald-600 font-medium">units</span>
                </div>
              </div>

              {/* Pedicab */}
              <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-2.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-sky-900">
                    Pedicab
                  </span>
                  <span className="text-[10px] font-semibold text-sky-700 bg-sky-100/80 px-1.5 py-0.2 rounded-full">
                    {totalCount > 0 ? `${Math.round((totalPedicab / totalCount) * 100)}%` : '0%'}
                  </span>
                </div>
                <div className="mt-1 flex items-baseline space-x-1">
                  <span className="text-xl font-black text-sky-800">{totalPedicab}</span>
                  <span className="text-[10px] text-sky-600 font-medium">units</span>
                </div>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-slate-400 italic">
              {allExpiredCount > 0 && !isFiltered 
                ? `Includes ${allExpiredCount} expired unit(s) requiring renewal` 
                : `Complete combined fleet in the Tabaco City registry`}
            </p>
          </div>
        </div>

        {/* CARD 2: TOTAL ACTIVE */}
        <div 
          onClick={() => setActiveModule('franchise_records')}
          className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-emerald-300 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500 rounded-t-3xl" />
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Total Active
              </h3>
              {isFiltered ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {filterLabel}
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  All Time
                </span>
              )}
            </div>

            {/* Combined Active */}
            <div className="mt-3 flex items-baseline space-x-2.5 flex-wrap">
              <span className="text-4xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                {activeCount}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {isFiltered ? `active in ${filterLabel}` : `of ${totalCount} operational`}
              </span>
            </div>

            {/* DUAL BREAKDOWN: TRICYCLE & PEDICAB */}
            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
              {/* Active Tricycle */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-2.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-900">
                    Tricycle
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded-full">
                    Active
                  </span>
                </div>
                <div className="mt-1 flex items-baseline space-x-1">
                  <span className="text-xl font-black text-emerald-800">{activeTricycle}</span>
                  <span className="text-[10px] text-emerald-600 font-medium">of {totalTricycle}</span>
                </div>
              </div>

              {/* Active Pedicab */}
              <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-2.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-sky-900">
                    Pedicab
                  </span>
                  <span className="text-[10px] font-bold text-sky-700 bg-sky-100/80 px-1.5 py-0.2 rounded-full">
                    Active
                  </span>
                </div>
                <div className="mt-1 flex items-baseline space-x-1">
                  <span className="text-xl font-black text-sky-800">{activePedicab}</span>
                  <span className="text-[10px] text-sky-600 font-medium">of {totalPedicab}</span>
                </div>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-slate-400 italic">
              Verified, non-expired units permitted on Tabaco City routes
            </p>
          </div>
        </div>

        {/* CARD 3: TOTAL PENDING */}
        <div 
          onClick={() => {
            const el = document.getElementById('pending-reviews-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-amber-300 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500 rounded-t-3xl" />
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Total Pending
              </h3>
              {isFiltered ? (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {filterLabel}
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  All Time
                </span>
              )}
            </div>

            {/* Combined Pending */}
            <div className="mt-3 flex items-baseline space-x-2.5 flex-wrap">
              <span className="text-4xl font-black text-slate-900 group-hover:text-amber-700 transition-colors">
                {totalPending}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                requiring action
              </span>
            </div>

            {/* DUAL BREAKDOWN: TRICYCLE & PEDICAB */}
            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
              {/* Pending Tricycle */}
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-2.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-900">
                    Tricycle
                  </span>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded-full">
                    Pending
                  </span>
                </div>
                <div className="mt-1 flex items-baseline space-x-1">
                  <span className="text-xl font-black text-amber-900">{pendingTricycle}</span>
                  <span className="text-[10px] text-amber-700 font-medium">
                    ({pendingRenewalsTricycle} ren / {pendingAppsTricycle} app)
                  </span>
                </div>
              </div>

              {/* Pending Pedicab */}
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-2.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-900">
                    Pedicab
                  </span>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded-full">
                    Pending
                  </span>
                </div>
                <div className="mt-1 flex items-baseline space-x-1">
                  <span className="text-xl font-black text-amber-900">{pendingPedicab}</span>
                  <span className="text-[10px] text-amber-700 font-medium">
                    ({pendingRenewalsPedicab} ren / {pendingAppsPedicab} app)
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-slate-400 italic">
              Awaiting renewal processing or new applicant document inspection
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
