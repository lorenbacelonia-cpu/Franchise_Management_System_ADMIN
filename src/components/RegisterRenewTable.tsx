import React, { useState, useMemo } from 'react';
import { useFranchise } from '../context/FranchiseContext';
import {
  FileText,
  RotateCw,
  Search,
  X,
  CheckCircle2,
  QrCode
} from 'lucide-react';
import type { FranchiseRecord } from '../types';
import { isRecordExpired } from '../utils/fareUtils';

export const RegisterRenewTable: React.FC = () => {
  const {
    franchises,
    searchQuery: globalSearchQuery,
    setSelectedFranchiseId,
    setActiveModule,
  } = useFranchise();

  const [localSearch, setLocalSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Tricycle' | 'Pedicab'>('all');
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'registered' | 'renewed'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Expired'>('all');

  const query = (localSearch || globalSearchQuery || '').toLowerCase().trim();

  // Determine whether record is a renewal or new registration
  const isRecordRenewed = (f: FranchiseRecord) => {
    return Boolean(
      f.status === 'Pending Renewal' ||
      (f.applicationNo && f.applicationNo.toLowerCase().includes('ren')) ||
      (f.nameChangeHistory && f.nameChangeHistory.length > 0)
    );
  };

  // Filtered dataset
  const filteredRecords = useMemo(() => {
    return franchises.filter(f => {
      // Category filter
      if (categoryFilter !== 'all' && f.vehicleCategory !== categoryFilter) return false;

      // Transaction filter
      const renewed = isRecordRenewed(f);
      if (transactionFilter === 'registered' && renewed) return false;
      if (transactionFilter === 'renewed' && !renewed) return false;

      // Status filter
      if (statusFilter !== 'all') {
        const resolvedExpired = f.status === 'Expired' || isRecordExpired(f.expirationDate);
        if (statusFilter === 'Expired' && !resolvedExpired) return false;
        if (statusFilter === 'Active' && (f.status !== 'Active' || resolvedExpired)) return false;
      }

      // Search match
      if (query) {
        const plate = (f.cityPlateNumber || '').toLowerCase();
        const mtop = (f.mtopNumber || '').toLowerCase();
        const operator = (f.operatorName || f.ownerName || '').toLowerCase();
        const driver = (f.driverName || '').toLowerCase();
        const orNo = (f.orNumber || f.receiptNumber || '').toLowerCase();
        const route = (f.routeParada || '').toLowerCase();
        const appNo = (f.applicationNo || '').toLowerCase();

        return (
          plate.includes(query) ||
          mtop.includes(query) ||
          operator.includes(query) ||
          driver.includes(query) ||
          orNo.includes(query) ||
          route.includes(query) ||
          appNo.includes(query)
        );
      }

      return true;
    });
  }, [franchises, categoryFilter, transactionFilter, statusFilter, query]);

  // Overall counts for both Tricycle and Pedicab
  const stats = useMemo(() => {
    const tricycles = franchises.filter(f => f.vehicleCategory === 'Tricycle');
    const pedicabs = franchises.filter(f => f.vehicleCategory === 'Pedicab');

    const tricycleRegistered = tricycles.filter(f => !isRecordRenewed(f)).length;
    const tricycleRenewed = tricycles.filter(f => isRecordRenewed(f)).length;

    const pedicabRegistered = pedicabs.filter(f => !isRecordRenewed(f)).length;
    const pedicabRenewed = pedicabs.filter(f => isRecordRenewed(f)).length;

    return {
      tricycleTotal: tricycles.length,
      tricycleRegistered,
      tricycleRenewed,
      pedicabTotal: pedicabs.length,
      pedicabRegistered,
      pedicabRenewed,
      combinedTotal: franchises.length,
      combinedRegistered: tricycleRegistered + pedicabRegistered,
      combinedRenewed: tricycleRenewed + pedicabRenewed,
    };
  }, [franchises]);

  const handleRowClick = (record: FranchiseRecord) => {
    setSelectedFranchiseId(record.id);
    setActiveModule('franchise_records');
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            Franchise Registration &amp; Renewal Records
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Detailed table breakdown of registered and renewed units for both Tricycle &amp; Pedicab
          </p>
        </div>

        {/* Quick Module Shortcut Button */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setActiveModule('register')}
            className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer flex items-center space-x-1.5"
          >
            <span>+ New Franchise</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveModule('renewal')}
            className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer flex items-center space-x-1.5"
          >
            <span>Process Renewal</span>
          </button>
        </div>
      </div>

      {/* SUMMARY TOTALS: Clickable Filter Cards for both Tricycle and Pedicab */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 my-6">
        {/* Tricycle Registered */}
        <div
          onClick={() => {
            setCategoryFilter('Tricycle');
            setTransactionFilter('registered');
          }}
          className={`bg-emerald-50/70 border rounded-2xl p-3.5 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-98 select-none ${categoryFilter === 'Tricycle' && transactionFilter === 'registered'
            ? 'border-emerald-600 ring-2 ring-emerald-500/30 shadow-xs'
            : 'border-emerald-200/80 hover:border-emerald-400'
            }`}
          title="Click to filter by Newly Registered Tricycles"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-900">
              Tricycle Reg.
            </span>
            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
              New
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-emerald-900">{stats.tricycleRegistered}</span>
            <span className="text-[11px] text-emerald-700 font-semibold">units</span>
          </div>
          <p className="text-[10px] text-emerald-700 mt-0.5">Enrolled into registry</p>
        </div>

        {/* Tricycle Renewed */}
        <div
          onClick={() => {
            setCategoryFilter('Tricycle');
            setTransactionFilter('renewed');
          }}
          className={`bg-blue-50/70 border rounded-2xl p-3.5 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-98 select-none ${categoryFilter === 'Tricycle' && transactionFilter === 'renewed'
            ? 'border-blue-600 ring-2 ring-blue-500/30 shadow-xs'
            : 'border-blue-200/80 hover:border-blue-400'
            }`}
          title="Click to filter by Renewed Tricycles"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-900">
              Tricycle Renewed
            </span>
            <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full">
              Renewal
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-blue-900">{stats.tricycleRenewed}</span>
            <span className="text-[11px] text-blue-700 font-semibold">units</span>
          </div>
          <p className="text-[10px] text-blue-700 mt-0.5">Renewed permits</p>
        </div>

        {/* Pedicab Registered */}
        <div
          onClick={() => {
            setCategoryFilter('Pedicab');
            setTransactionFilter('registered');
          }}
          className={`bg-sky-50/70 border rounded-2xl p-3.5 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-98 select-none ${categoryFilter === 'Pedicab' && transactionFilter === 'registered'
            ? 'border-sky-600 ring-2 ring-sky-500/30 shadow-xs'
            : 'border-sky-200/80 hover:border-sky-400'
            }`}
          title="Click to filter by Newly Registered Pedicabs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-sky-900">
              Pedicab Reg.
            </span>
            <span className="text-[9px] font-bold bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded-full">
              New
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-sky-900">{stats.pedicabRegistered}</span>
            <span className="text-[11px] text-sky-700 font-semibold">units</span>
          </div>
          <p className="text-[10px] text-sky-700 mt-0.5">Enrolled into registry</p>
        </div>

        {/* Pedicab Renewed */}
        <div
          onClick={() => {
            setCategoryFilter('Pedicab');
            setTransactionFilter('renewed');
          }}
          className={`bg-indigo-50/70 border rounded-2xl p-3.5 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-98 select-none ${categoryFilter === 'Pedicab' && transactionFilter === 'renewed'
            ? 'border-indigo-600 ring-2 ring-indigo-500/30 shadow-xs'
            : 'border-indigo-200/80 hover:border-indigo-400'
            }`}
          title="Click to filter by Renewed Pedicabs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-indigo-900">
              Pedicab Renewed
            </span>
            <span className="text-[9px] font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded-full">
              Renewal
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-indigo-900">{stats.pedicabRenewed}</span>
            <span className="text-[11px] text-indigo-700 font-semibold">units</span>
          </div>
          <p className="text-[10px] text-indigo-700 mt-0.5">Renewed permits</p>
        </div>

        {/* Overall Total */}
        <div
          onClick={() => {
            setCategoryFilter('all');
            setTransactionFilter('all');
          }}
          className={`bg-slate-900 text-white rounded-2xl p-3.5 col-span-2 lg:col-span-1 shadow-xs cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-98 select-none ${categoryFilter === 'all' && transactionFilter === 'all'
            ? 'ring-2 ring-emerald-400 shadow-md'
            : 'hover:bg-slate-800'
            }`}
          title="Click to view all units"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
              Combined Total
            </span>
            <span className="text-[9px] font-bold bg-emerald-500/30 text-emerald-300 px-1.5 py-0.2 rounded-full">
              All Units
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-white">{stats.combinedTotal}</span>
            <span className="text-[11px] text-slate-400 font-semibold">total</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {stats.combinedRegistered} new • {stats.combinedRenewed} renewed
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        {/* Category Pills & Transaction Type */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Category */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${categoryFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              All ({franchises.length})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('Tricycle')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${categoryFilter === 'Tricycle' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-700'
                }`}
            >
              Tricycle ({stats.tricycleTotal})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('Pedicab')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${categoryFilter === 'Pedicab' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-sky-700'
                }`}
            >
              Pedicab ({stats.pedicabTotal})
            </button>
          </div>

          {/* Transaction Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setTransactionFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${transactionFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              All Types
            </button>
            <button
              type="button"
              onClick={() => setTransactionFilter('registered')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${transactionFilter === 'registered' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              New Register ({stats.combinedRegistered})
            </button>
            <button
              type="button"
              onClick={() => setTransactionFilter('renewed')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${transactionFilter === 'renewed' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Renewed ({stats.combinedRenewed})
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              All Status
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Active')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${statusFilter === 'Active' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Expired')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${statusFilter === 'Expired' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Expired
            </button>
          </div>
        </div>

        {/* Local Search Input */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search in table..."
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl outline-none transition-all placeholder:text-slate-400 font-medium"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => setLocalSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Table: Registered & Renewed Franchises */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/90 shadow-2xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
              <th className="py-3 px-4">Vehicle Category</th>
              <th className="py-3 px-4">City Plate / MTOP</th>
              <th className="py-3 px-4">Operator</th>
              <th className="py-3 px-4">Assigned Driver</th>
              <th className="py-3 px-4">Transaction Type</th>
              <th className="py-3 px-4">Reg / Renewal Date</th>
              <th className="py-3 px-4">OR Number</th>
              <th className="py-3 px-4">Expiry Date</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-700">No matching franchise records found</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Try adjusting your category, transaction filter, or search keywords.
                  </p>
                </td>
              </tr>
            ) : (
              filteredRecords.map(record => {
                const renewed = isRecordRenewed(record);
                const isExpired = record.status === 'Expired' || isRecordExpired(record.expirationDate);

                return (
                  <tr
                    key={record.id}
                    onClick={() => handleRowClick(record)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Vehicle Category */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${record.vehicleCategory === 'Pedicab'
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                        {record.vehicleCategory}
                      </span>
                    </td>

                    {/* Plate / MTOP */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {record.cityPlateNumber || record.mtopNumber}
                      </div>
                      {record.applicationNo && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          App: {record.applicationNo}
                        </div>
                      )}
                    </td>

                    {/* Operator */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">
                        {record.operatorName || record.ownerName || '—'}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                        {record.operatorContact || record.ownerContact || record.operatorAddress || 'N/A'}
                      </div>
                    </td>

                    {/* Driver */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">
                        {record.driverName || '—'}
                      </div>
                    </td>

                    {/* Transaction Type */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {renewed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                          <RotateCw className="w-3 h-3 text-blue-600" />
                          <span>Renewal</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>New Register</span>
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-medium">
                      {record.registrationDate || record.paymentDate || '—'}
                    </td>

                    {/* OR Number */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-800">
                        {record.orNumber || record.receiptNumber || '—'}
                      </span>
                      {record.amountPaid && (
                        <span className="block text-[10px] text-emerald-700 font-semibold">
                          ₱{Number(record.amountPaid).toLocaleString()}
                        </span>
                      )}
                    </td>

                    {/* Expiry Date */}
                    <td className="py-3 px-4 whitespace-nowrap font-medium">
                      <span className={isExpired ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                        {record.expirationDate || 'N/A'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${isExpired
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : record.status === 'Pending Renewal'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                        {isExpired ? 'Expired' : record.status}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(record);
                        }}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
        <span>
          Showing <strong className="text-slate-800">{filteredRecords.length}</strong> of{' '}
          <strong className="text-slate-800">{franchises.length}</strong> total units
        </span>
        <span className="text-slate-400">
          Click any row to open full franchise record, generate QR badge, or edit details
        </span>
      </div>
    </div>
  );
};
