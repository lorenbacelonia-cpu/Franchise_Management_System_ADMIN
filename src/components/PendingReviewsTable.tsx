import React, { useState } from 'react';
import { useFranchise } from '../context/FranchiseContext';

export const PendingReviewsTable: React.FC = () => {
  const {
    vehicleCategory,
    pendingReviews,
    complaints,
    setVehicleCategory,
    setSelectedReview,
  } = useFranchise();

  const [activeTab, setActiveTab] = useState<'reviews' | 'complaints'>('reviews');
  const [filterOption, setFilterOption] = useState<'All' | 'Tricycle' | 'Pedicab'>(vehicleCategory);

  // Filter reviews
  const filteredReviews = pendingReviews.filter(r => {
    if (filterOption !== 'All' && r.vehicleCategory !== filterOption) return false;
    return true;
  });

  // Filter complaints
  const filteredComplaints = complaints.filter(c => {
    if (filterOption !== 'All' && c.vehicleCategory !== filterOption) return false;
    return true;
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-10">

      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">

        {/* Dual Tab Switcher */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'reviews'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-700 bg-transparent'
            }`}
          >
            Pending Reviews
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('complaints')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'complaints'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-700 bg-transparent'
            }`}
          >
            Passenger Complaints
          </button>
        </div>

        {/* Filter by Radio Options */}
        <div className="flex items-center space-x-4 text-xs text-slate-700 font-medium">
          <span className="text-slate-600">Filter by:</span>
          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input
              type="radio"
              name="filterBy"
              checked={filterOption === 'All'}
              onChange={() => setFilterOption('All')}
              className="accent-emerald-600"
            />
            <span>All</span>
          </label>

          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input
              type="radio"
              name="filterBy"
              checked={filterOption === 'Tricycle'}
              onChange={() => {
                setFilterOption('Tricycle');
                setVehicleCategory('Tricycle');
              }}
              className="accent-emerald-600"
            />
            <span>Tricycle</span>
          </label>

          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input
              type="radio"
              name="filterBy"
              checked={filterOption === 'Pedicab'}
              onChange={() => {
                setFilterOption('Pedicab');
                setVehicleCategory('Pedicab');
              }}
              className="accent-emerald-600"
            />
            <span>Pedicab</span>
          </label>
        </div>

      </div>

      {/* Subtitle */}
      <p className="text-xs text-slate-400 mb-6">
        {activeTab === 'reviews'
          ? 'Franchise waiting document review and approval'
          : 'Recent community reports submitted via QR code scan.'
        }
      </p>

      {/* Table Container */}
      <div className="bg-slate-100 border border-slate-200 rounded-2xl p-3 sm:p-4">
        {activeTab === 'reviews' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-800 font-bold">
                  <th className="px-6 py-3">Operator Name</th>
                  <th className="px-6 py-3">Vehicle Type</th>
                  <th className="px-6 py-3">City Plate No.</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                {filteredReviews.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400 italic">
                      No pending reviews available.
                    </td>
                  </tr>
                ) : (
                  filteredReviews.map((review) => (
                    <tr 
                      key={review.id} 
                      className="bg-white rounded-xl shadow-xs border border-slate-200/80 hover:border-slate-300 transition-all my-1.5"
                    >
                      <td className="px-6 py-3.5 font-semibold text-slate-900 rounded-l-xl">
                        {review.applicantName}
                      </td>
                      <td className="px-6 py-3.5 text-slate-700">
                        {review.vehicleCategory}
                      </td>
                      <td className="px-6 py-3.5 text-slate-800 font-medium">
                        {review.mtopAssigned || '1243'}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className="bg-amber-100 text-amber-700 font-semibold px-4 py-1 rounded-full text-[11px]">
                          Pending
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center rounded-r-xl">
                        <button
                          onClick={() => setSelectedReview(review)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-1.5 rounded-full text-xs transition-colors cursor-pointer shadow-sm"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-800 font-bold">
                  <th className="px-6 py-3">Ticket ID</th>
                  <th className="px-6 py-3">Operator Name</th>
                  <th className="px-6 py-3">Vehicle Type</th>
                  <th className="px-6 py-3">City Plate No.</th>
                  <th className="px-6 py-3">Complaint</th>
                  <th className="px-6 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                {filteredComplaints.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 italic">
                      No passenger complaints recorded.
                    </td>
                  </tr>
                ) : (
                  filteredComplaints.map((c, idx) => (
                    <tr 
                      key={c.id} 
                      className="bg-white rounded-xl shadow-xs border border-slate-200/80 hover:border-slate-300 transition-all my-1.5"
                    >
                      <td className="px-6 py-3.5 font-bold text-slate-800 rounded-l-xl">
                        #C-00{idx + 1}
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-slate-900">
                        {c.complainantName}
                      </td>
                      <td className="px-6 py-3.5 text-slate-700">
                        {c.vehicleCategory}
                      </td>
                      <td className="px-6 py-3.5 text-slate-800 font-medium">
                        {c.mtopNumber}
                      </td>
                      <td className="px-6 py-3.5 text-slate-700">
                        {c.issueType}
                      </td>
                      <td className="px-6 py-3.5 text-center rounded-r-xl">
                        <button
                          onClick={() => alert(`Reviewing Complaint Ticket #C-00${idx + 1}`)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-1.5 rounded-full text-xs transition-colors cursor-pointer shadow-sm"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
