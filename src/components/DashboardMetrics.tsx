import React from 'react';
import { useFranchise } from '../context/FranchiseContext';
import { Users, CheckCircle2, AlertTriangle } from 'lucide-react';

export const DashboardMetrics: React.FC = () => {
  const { vehicleCategory, franchises, pendingReviews } = useFranchise();

  const filteredFranchises = franchises.filter(f => f.vehicleCategory === vehicleCategory);
  const totalCount = filteredFranchises.length;
  const activeCount = filteredFranchises.filter(f => f.status === 'Active').length;
  const pendingCount = pendingReviews.filter(r => r.vehicleCategory === vehicleCategory).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      
      {/* 1. Total Franchise */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Total Franchise
            </h3>
            <div className="mt-4">
              <span className="text-4xl font-extrabold text-slate-900">
                {totalCount}
              </span>
            </div>
            <p className="mt-4 text-xs text-slate-400 italic">
              Registered in system
            </p>
          </div>

          <div className="text-slate-400 p-1">
            <Users className="w-8 h-8 text-slate-500" />
          </div>
        </div>
      </div>

      {/* 2. Active Franchise */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Active Franchise
            </h3>
            <div className="mt-4">
              <span className="text-4xl font-extrabold text-slate-900">
                {activeCount}
              </span>
            </div>
            <p className="mt-4 text-xs text-slate-400 italic">
              Currently operational
            </p>
          </div>

          <div className="text-emerald-500 p-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* 3. Pending Reviews */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Pending Reviews
            </h3>
            <div className="mt-4">
              <span className="text-4xl font-extrabold text-slate-900">
                {pendingCount}
              </span>
            </div>
            <p className="mt-4 text-xs text-slate-400 italic">
              Awaiting approval
            </p>
          </div>

          <div className="text-amber-500 p-1">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
        </div>
      </div>

    </div>
  );
};
