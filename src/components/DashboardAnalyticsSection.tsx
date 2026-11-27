import React, { useState, useMemo } from 'react';
import { useFranchise } from '../context/FranchiseContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export const DashboardAnalyticsSection: React.FC = () => {
  const { franchises } = useFranchise();

  // Category filter for analytics
  const [vehicleFilter, setVehicleFilter] = useState<'all' | 'Tricycle' | 'Pedicab'>('all');
  const [pieMode, setPieMode] = useState<'fleet' | 'status'>('fleet');

  // Filtered dataset
  const targetFranchises = useMemo(() => {
    if (vehicleFilter === 'all') return franchises;
    return franchises.filter(f => f.vehicleCategory === vehicleFilter);
  }, [franchises, vehicleFilter]);

  // Total counts
  const totalUnits = targetFranchises.length;
  const activeUnits = targetFranchises.filter(f => f.status === 'Active').length;
  const expiredUnits = targetFranchises.filter(f => f.status === 'Expired').length;
  const pendingUnits = targetFranchises.filter(f => f.status === 'Pending Renewal').length;
  const complianceRate = totalUnits > 0 ? ((activeUnits / totalUnits) * 100).toFixed(1) : '100.0';

  // Tricycle & Pedicab breakdown
  const tricycleCount = franchises.filter(f => f.vehicleCategory === 'Tricycle').length;
  const pedicabCount = franchises.filter(f => f.vehicleCategory === 'Pedicab').length;

  // Monthly Trend Data for Bar Chart (Jan - Dec)
  const monthlyTrendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return months.map((month, idx) => {
      let tricycleReg = 0;
      let pedicabReg = 0;
      let renewals = 0;

      franchises.forEach(f => {
        const regDate = f.registrationDate || f.paymentDate;
        if (regDate) {
          const d = new Date(regDate);
          if (!isNaN(d.getTime()) && d.getMonth() === idx) {
            if (f.vehicleCategory === 'Pedicab') {
              pedicabReg++;
            } else {
              tricycleReg++;
            }
          }
        }

        if (f.expirationDate && (f.status === 'Active' || f.status === 'Pending Renewal')) {
          const d = new Date(f.expirationDate);
          if (!isNaN(d.getTime()) && d.getMonth() === idx) {
            renewals++;
          }
        }
      });

      return {
        month,
        'Tricycle Reg': tricycleReg,
        'Pedicab Reg': pedicabReg,
        'Total Reg': tricycleReg + pedicabReg,
        'Renewals': renewals,
      };
    });
  }, [franchises]);

  // Pie Chart Data
  const fleetPieData = useMemo(() => {
    const total = tricycleCount + pedicabCount;
    if (total === 0) {
      return [
        { name: 'Tricycle Units', value: 1, count: 0, color: '#10b981' },
        { name: 'Pedicab Units', value: 1, count: 0, color: '#0ea5e9' },
      ];
    }
    return [
      {
        name: 'Tricycles',
        count: tricycleCount,
        value: tricycleCount,
        color: '#10b981', // emerald-500
      },
      {
        name: 'Pedicabs',
        count: pedicabCount,
        value: pedicabCount,
        color: '#0ea5e9', // sky-500
      },
    ];
  }, [tricycleCount, pedicabCount]);

  const statusPieData = useMemo(() => {
    if (totalUnits === 0) {
      return [{ name: 'No Units', value: 1, count: 0, color: '#94a3b8' }];
    }
    return [
      { name: 'Active', count: activeUnits, value: activeUnits, color: '#10b981' },
      { name: 'Pending Renewal', count: pendingUnits, value: pendingUnits, color: '#f59e0b' },
      { name: 'Expired', count: expiredUnits, value: expiredUnits, color: '#ef4444' },
      {
        name: 'Under Review',
        count: targetFranchises.filter(f => f.status === 'Under Review').length,
        value: targetFranchises.filter(f => f.status === 'Under Review').length,
        color: '#6366f1',
      },
    ].filter(item => item.value > 0);
  }, [totalUnits, activeUnits, pendingUnits, expiredUnits, targetFranchises]);

  const currentPieData = pieMode === 'fleet' ? fleetPieData : statusPieData;

  // Custom Bar Chart Tooltip
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700 min-w-[170px]">
          <p className="font-bold text-slate-300 border-b border-slate-800 pb-1 mb-2">
            Month: {label}
          </p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={`item-${index}`} className="flex items-center justify-between space-x-2">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-slate-300">{entry.name}:</span>
                </span>
                <span className="font-bold text-white font-mono">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Pie Chart Tooltip
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const total = currentPieData.reduce((acc, curr) => acc + curr.value, 0);
      const pct = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
      return (
        <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-xs border border-slate-700">
          <p className="font-bold text-slate-200">{data.name}</p>
          <p className="font-mono text-emerald-400 font-bold mt-0.5">
            {data.value} units ({pct}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            Reports &amp; Analytics
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Comparative visual trends and record distribution for Tricycles &amp; Pedicabs
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {/* Vehicle Category Filter */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setVehicleFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                vehicleFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unified (Both)
            </button>
            <button
              type="button"
              onClick={() => setVehicleFilter('Tricycle')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                vehicleFilter === 'Tricycle'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Tricycle
            </button>
            <button
              type="button"
              onClick={() => setVehicleFilter('Pedicab')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                vehicleFilter === 'Pedicab'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-sky-700'
              }`}
            >
              Pedicab
            </button>
          </div>
        </div>
      </div>

      {/* Quick Analytics Summary Strip (Interactive) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 my-6">
        <div
          onClick={() => {
            setVehicleFilter('all');
            setPieMode('fleet');
          }}
          className={`bg-slate-50 border rounded-2xl p-3.5 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-98 select-none ${
            vehicleFilter === 'all' && pieMode === 'fleet'
              ? 'border-slate-800 ring-2 ring-slate-400/30 shadow-xs'
              : 'border-slate-200/80 hover:border-slate-400'
          }`}
          title="Click to view full fleet analytics"
        >
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Total Reg. Fleet
          </p>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{totalUnits}</span>
            <span className="text-[11px] font-semibold text-slate-500">units</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            {tricycleCount} Tricycle / {pedicabCount} Pedicab
          </p>
        </div>

        <div
          onClick={() => setPieMode('status')}
          className={`bg-emerald-50/60 border rounded-2xl p-3.5 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-98 select-none ${
            pieMode === 'status'
              ? 'border-emerald-600 ring-2 ring-emerald-500/30 shadow-xs'
              : 'border-emerald-200/80 hover:border-emerald-400'
          }`}
          title="Click to inspect active compliance breakdown"
        >
          <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
            Compliance Rate
          </p>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-800">{complianceRate}%</span>
            <span className="text-[11px] font-semibold text-emerald-700">active</span>
          </div>
          <p className="text-[10px] text-emerald-700 mt-1">
            {activeUnits} operational units on route
          </p>
        </div>

        <div
          onClick={() => setPieMode('status')}
          className="bg-amber-50/60 border border-amber-200/80 hover:border-amber-400 rounded-2xl p-3.5 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-98 select-none"
          title="Click to inspect status breakdown for pending renewals"
        >
          <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
            Pending Renewals
          </p>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-amber-900">{pendingUnits}</span>
            <span className="text-[11px] font-semibold text-amber-700">units</span>
          </div>
          <p className="text-[10px] text-amber-700 mt-1">
            Permits requiring renewal
          </p>
        </div>

        <div
          onClick={() => setPieMode('status')}
          className="bg-rose-50/60 border border-rose-200/80 hover:border-rose-400 rounded-2xl p-3.5 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-98 select-none"
          title="Click to inspect status breakdown for expired permits"
        >
          <p className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">
            Expired Permits
          </p>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-rose-900">{expiredUnits}</span>
            <span className="text-[11px] font-semibold text-rose-700">units</span>
          </div>
          <p className="text-[10px] text-rose-700 mt-1">
            Past permit expiration date
          </p>
        </div>
      </div>

      {/* Middle Charts: Bar Chart & Pie Chart side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* 1. BAR CHART: Monthly Registrations & Renewals (7 cols) */}
        <div className="lg:col-span-7 bg-slate-50/70 border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                Monthly Registrations &amp; Renewals
              </h3>
              <p className="text-[11px] text-slate-500">
                Annual record trends comparing Tricycle vs Pedicab
              </p>
            </div>

            <div className="flex items-center space-x-2 text-[10px] font-bold">
              <span className="inline-flex items-center gap-1 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Tricycle Reg
              </span>
              <span className="inline-flex items-center gap-1 text-sky-700">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                Pedicab Reg
              </span>
              <span className="inline-flex items-center gap-1 text-amber-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Renewals
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="Tricycle Reg" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="Pedicab Reg" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="Renewals" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>Aggregated across Tabaco City registration dates</span>
            <span className="font-semibold text-slate-700">Jan – Dec 2026</span>
          </div>
        </div>

        {/* 2. PIE CHART: Fleet & Status Distribution (5 cols) */}
        <div className="lg:col-span-5 bg-slate-50/70 border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                Fleet &amp; Status Breakdown
              </h3>
              <p className="text-[11px] text-slate-500">
                {pieMode === 'fleet' ? 'Tricycle vs Pedicab proportion' : 'Compliance status distribution'}
              </p>
            </div>

            {/* Switch Pie Mode */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setPieMode('fleet')}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                  pieMode === 'fleet' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Fleet
              </button>
              <button
                type="button"
                onClick={() => setPieMode('status')}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                  pieMode === 'status' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Status
              </button>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={currentPieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {currentPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(val, entry: any) => (
                    <span className="text-[11px] font-semibold text-slate-700">
                      {val} ({entry.payload.value})
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              {pieMode === 'fleet'
                ? `${tricycleCount} Tricycles • ${pedicabCount} Pedicabs`
                : `${activeUnits} Active • ${pendingUnits} Pending • ${expiredUnits} Expired`}
            </span>
            <span className="font-bold text-slate-700">{totalUnits} Total</span>
          </div>
        </div>

      </div>
    </div>
  );
};
