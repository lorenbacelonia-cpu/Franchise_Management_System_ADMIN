import React from 'react';
import { useFranchise } from '../context/FranchiseContext';
import { 
  CheckCircle2, 
  Clock, 
  FileCheck2, 
  Sparkles,
  Calendar,
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
    vehicleCategory, 
    franchises, 
    pendingReviews, 
    complaints,
    dateFilter,
    setDateFilter,
    resetDateFilter,
    setActiveModule
  } = useFranchise();

  // 1. Vehicle category matching
  const categoryFranchises = franchises.filter(f => f.vehicleCategory === vehicleCategory);
  const categoryReviews = pendingReviews.filter(r => r.vehicleCategory === vehicleCategory);
  const categoryComplaints = complaints.filter(c => c.vehicleCategory === vehicleCategory);

  const isFiltered = dateFilter.preset !== 'all';
  const filterLabel = getFilterDisplayLabel(dateFilter);

  // 2. All-time baseline counts
  const allTotalCount = categoryFranchises.length;
  const allActiveCount = categoryFranchises.filter(f => f.status === 'Active').length;
  const allExpiredCount = categoryFranchises.filter(f => f.status === 'Expired').length;
  const allPendingRenewals = categoryFranchises.filter(f => f.status === 'Pending Renewal').length;
  const allUnderReviewFranchises = categoryFranchises.filter(f => f.status === 'Under Review').length;
  const allPendingReviewApps = categoryReviews.filter(
    r => r.status === 'Pending Document Review' || !r.status
  ).length;

  // 3. Date-filtered subsets
  const dateFilteredFranchises = categoryFranchises.filter(f => 
    isDateMatchingFilter(f.registrationDate || f.paymentDate, dateFilter)
  );

  const dateFilteredReviews = categoryReviews.filter(r => 
    isDateMatchingFilter(r.dateSubmitted, dateFilter)
  );

  const dateFilteredComplaints = categoryComplaints.filter(c => 
    isDateMatchingFilter(c.incidentDate, dateFilter)
  );

  // 4. Metric 1: Total Active
  // When date filter is active, show active registered on that date, or operational active
  const activeCount = isFiltered 
    ? dateFilteredFranchises.filter(f => f.status === 'Active').length
    : allActiveCount;

  // 5. Metric 2: Pending
  // Includes franchises pending renewal + new pending applications
  const pendingRenewalsCount = isFiltered
    ? dateFilteredFranchises.filter(f => f.status === 'Pending Renewal').length
    : allPendingRenewals;

  const pendingAppsCount = isFiltered
    ? dateFilteredReviews.filter(r => r.status === 'Pending Document Review' || !r.status).length
    : allPendingReviewApps;

  const totalPending = pendingRenewalsCount + pendingAppsCount;

  // 6. Metric 3: Review
  // Includes franchises under review + review applications awaiting verification
  const underReviewFranchisesCount = isFiltered
    ? dateFilteredFranchises.filter(f => f.status === 'Under Review').length
    : allUnderReviewFranchises;

  const reviewAppsCount = isFiltered
    ? dateFilteredReviews.filter(r => r.status === 'Pending Document Review' || !r.status).length
    : allPendingReviewApps;

  const underInvestigationComplaints = isFiltered
    ? dateFilteredComplaints.filter(c => c.status === 'Under Investigation').length
    : categoryComplaints.filter(c => c.status === 'Under Investigation').length;

  const totalReview = underReviewFranchisesCount + reviewAppsCount;

  return (
    <div className="space-y-4 mb-8">
      {/* Date / Day Filter Header specifically for Total Active, Pending, and Review */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Presets Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-wrap">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs sm:text-sm shrink-0">
              <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                <Calendar className="w-4 h-4" />
              </div>
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
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
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

      {/* Grid of 3 Sections: Total Active, Pending, Review */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1. Total Active */}
        <div 
          onClick={() => setActiveModule('franchise_records')}
          className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-emerald-200 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 rounded-t-2xl" />
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-800">
                  Total Active
                </h3>
                {isFiltered ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>{filterLabel}</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    All Time
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-baseline space-x-2.5 flex-wrap">
                <span className="text-4xl font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {activeCount}
                </span>

                {isFiltered ? (
                  <span className="text-xs font-semibold text-slate-500">
                    of {allActiveCount} total active
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-slate-500">
                    of {allTotalCount} registered
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                {allExpiredCount > 0 && !isFiltered && (
                  <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                    {allExpiredCount} Expired
                  </span>
                )}
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Operational {vehicleCategory}s
                </span>
              </div>

              <p className="mt-3 text-xs text-slate-400 italic">
                {isFiltered 
                  ? `Active records filtered by ${filterLabel}` 
                  : `Currently active & verified ${vehicleCategory} units`}
              </p>
            </div>

            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:bg-emerald-100 transition-colors">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* 2. Pending */}
        <div 
          onClick={() => {
            const el = document.getElementById('pending-reviews-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-amber-200 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500 rounded-t-2xl" />
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-800">
                  Pending
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

              <div className="mt-4 flex items-baseline space-x-2.5 flex-wrap">
                <span className="text-4xl font-extrabold text-slate-900 group-hover:text-amber-700 transition-colors">
                  {totalPending}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  requiring action
                </span>
              </div>

              <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                {pendingRenewalsCount > 0 && (
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    {pendingRenewalsCount} Renewal{pendingRenewalsCount > 1 ? 's' : ''}
                  </span>
                )}
                {pendingAppsCount > 0 && (
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    {pendingAppsCount} Application{pendingAppsCount > 1 ? 's' : ''}
                  </span>
                )}
                {totalPending === 0 && (
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                    All caught up
                  </span>
                )}
              </div>

              <p className="mt-3 text-xs text-slate-400 italic">
                {isFiltered 
                  ? `Pending renewals & applications for ${filterLabel}` 
                  : `Awaiting franchise renewal or intake processing`}
              </p>
            </div>

            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 group-hover:bg-amber-100 transition-colors">
              <Clock className="w-7 h-7 text-amber-600" />
            </div>
          </div>
        </div>

        {/* 3. Review */}
        <div 
          onClick={() => {
            const el = document.getElementById('pending-reviews-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-sky-200 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-sky-500 rounded-t-2xl" />
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-800">
                  Review
                </h3>
                {isFiltered ? (
                  <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                    {filterLabel}
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    All Time
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-baseline space-x-2.5 flex-wrap">
                <span className="text-4xl font-extrabold text-slate-900 group-hover:text-sky-700 transition-colors">
                  {totalReview}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  in review
                </span>
              </div>

              <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                {reviewAppsCount > 0 && (
                  <span className="text-[11px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                    {reviewAppsCount} Doc Review{reviewAppsCount > 1 ? 's' : ''}
                  </span>
                )}
                {underReviewFranchisesCount > 0 && (
                  <span className="text-[11px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                    {underReviewFranchisesCount} Franchise{underReviewFranchisesCount > 1 ? 's' : ''}
                  </span>
                )}
                {underInvestigationComplaints > 0 && (
                  <span className="text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                    {underInvestigationComplaints} Complaint{underInvestigationComplaints > 1 ? 's' : ''}
                  </span>
                )}
                {totalReview === 0 && (
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                    No pending evaluations
                  </span>
                )}
              </div>

              <p className="mt-3 text-xs text-slate-400 italic">
                {isFiltered 
                  ? `Evaluations & complaints submitted on ${filterLabel}` 
                  : `Awaiting document verification & compliance approval`}
              </p>
            </div>

            <div className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 group-hover:bg-sky-100 transition-colors">
              <FileCheck2 className="w-7 h-7 text-sky-600" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
