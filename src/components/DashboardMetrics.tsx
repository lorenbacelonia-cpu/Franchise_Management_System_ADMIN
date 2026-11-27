import React from 'react';
import { useFranchise } from '../context/FranchiseContext';

export const DashboardMetrics: React.FC = () => {
  const { 
    franchises, 
    pendingReviews, 
    setActiveModule
  } = useFranchise();

  // 1. Unified Tricycle & Pedicab records
  const categoryFranchises = franchises;
  const categoryReviews = pendingReviews;

  // 2. Metric 1: TOTAL FRANCHISES (Combined, Tricycle, Pedicab)
  const totalCount = categoryFranchises.length;
  const totalTricycle = categoryFranchises.filter(f => f.vehicleCategory === 'Tricycle').length;
  const totalPedicab = categoryFranchises.filter(f => f.vehicleCategory === 'Pedicab').length;

  // 3. Metric 2: TOTAL ACTIVE (Combined, Tricycle, Pedicab)
  const activeCount = categoryFranchises.filter(f => f.status === 'Active').length;
  const activeTricycle = categoryFranchises.filter(f => f.status === 'Active' && f.vehicleCategory === 'Tricycle').length;
  const activePedicab = categoryFranchises.filter(f => f.status === 'Active' && f.vehicleCategory === 'Pedicab').length;

  // 4. Metric 3: TOTAL PENDING (Combined, Tricycle, Pedicab)
  const pendingRenewalsTricycle = categoryFranchises.filter(f => f.status === 'Pending Renewal' && f.vehicleCategory === 'Tricycle').length;
  const pendingRenewalsPedicab = categoryFranchises.filter(f => f.status === 'Pending Renewal' && f.vehicleCategory === 'Pedicab').length;
  const pendingAppsTricycle = categoryReviews.filter(r => (r.status === 'Pending Document Review' || !r.status) && r.vehicleCategory === 'Tricycle').length;
  const pendingAppsPedicab = categoryReviews.filter(r => (r.status === 'Pending Document Review' || !r.status) && r.vehicleCategory === 'Pedicab').length;

  const pendingTricycle = pendingRenewalsTricycle + pendingAppsTricycle;
  const pendingPedicab = pendingRenewalsPedicab + pendingAppsPedicab;
  const totalPending = pendingTricycle + pendingPedicab;

  const allExpiredCount = categoryFranchises.filter(f => f.status === 'Expired').length;

  return (
    <div className="space-y-4 mb-8">
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
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                Official Registry
              </span>
            </div>

            {/* Combined Total */}
            <div className="mt-3 flex items-baseline space-x-2.5 flex-wrap">
              <span className="text-4xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                {totalCount}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                total registered units
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
              {allExpiredCount > 0 
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
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                Official Registry
              </span>
            </div>

            {/* Combined Active */}
            <div className="mt-3 flex items-baseline space-x-2.5 flex-wrap">
              <span className="text-4xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                {activeCount}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                of {totalCount} operational
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
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                Official Registry
              </span>
            </div>

            {/* Combined Pending */}
            <div className="mt-3 flex items-baseline space-x-2.5 flex-wrap">
              <span className="text-4xl font-black text-slate-900 group-hover:text-amber-700 transition-colors">
                {totalPending}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                waiting permit review
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
