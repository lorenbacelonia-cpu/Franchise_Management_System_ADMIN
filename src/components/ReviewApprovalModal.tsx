import React, { useState } from 'react';
import { useFranchise } from '../context/FranchiseContext';
import {
  X,
  CheckCircle2,
  XCircle,
  FileCheck,
  User,
  Phone,
  MapPin,
  Award,
  AlertCircle,
  Receipt
} from 'lucide-react';
import { formatSentenceCase } from '../utils/formatters';

export const ReviewApprovalModal: React.FC = () => {
  const { selectedReview, setSelectedReview, approveReview, rejectReview } = useFranchise();
  const [rejectNotes, setRejectNotes] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!selectedReview) return null;

  const handleApprove = () => {
    approveReview(selectedReview.id);
    setSelectedReview(null);
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    rejectReview(selectedReview.id, rejectNotes);
    setSelectedReview(null);
  };

  return (
    <div className="bg-white rounded-3xl shadow-md w-full overflow-hidden border-2 border-emerald-500/40 mb-6 animate-fadeIn">
      {/* Inline Section Header */}
      <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/30">
            <FileCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold">Inline Document &amp; Compliance Review</h3>
            <p className="text-xs text-slate-300">
              Application ID: {selectedReview.id} • {selectedReview.vehicleCategory}
            </p>
          </div>
        </div>
        <button
          onClick={() => setSelectedReview(null)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Close review panel"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Inline Body */}
      <div className="p-6 space-y-6">
        {/* Applicant Information Summary */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-start space-x-3">
            <User className="h-5 w-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-400">Applicant / Operator</p>
              <p className="text-sm font-bold text-slate-900">{selectedReview.applicantName}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Award className="h-5 w-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-400">City Plate No.</p>
              <p className="text-sm font-mono font-bold text-emerald-700">{selectedReview.mtopAssigned}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Phone className="h-5 w-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-400">Contact Number</p>
              <p className="text-sm font-medium text-slate-800">{selectedReview.contactNumber}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-400">Registered Address</p>
              <p className="text-xs font-medium text-slate-800">{selectedReview.address}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Receipt className="h-5 w-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-400">Receipt No. (OR No.)</p>
              <p className="text-sm font-mono font-bold text-slate-800">
                {selectedReview.orNumber || selectedReview.receiptNumber || `OR-2026-${selectedReview.mtopAssigned || '10492'}`}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-400">Payment Date &amp; Amount Paid</p>
              <p className="text-xs font-bold text-emerald-700">
                {selectedReview.dateSubmitted} • ₱{selectedReview.vehicleCategory === 'Pedicab' ? '250.00' : '450.00'} Paid
              </p>
            </div>
          </div>
        </div>

        {/* Document Verification Checklist */}
        <div>
          <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
            <span>Required Submissions Checklist</span>
            <span className="text-xs text-slate-500 font-normal">4 of 4 Verified</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {selectedReview.documents.map((doc) => (
              <div key={doc.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between hover:border-emerald-200 transition-colors">
                <div className="flex items-center space-x-3">
                  <FileCheck className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">{doc.title}</p>
                    <p className="text-[10px] text-slate-400">{doc.type}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {doc.verified ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Pending Audit
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reject Notes Form if clicked */}
        {showRejectForm && (
          <form onSubmit={handleRejectSubmit} className="bg-rose-50 p-4 rounded-xl border border-rose-200 space-y-3">
            <label className="block text-xs font-bold text-rose-900">
              Reason for Rejection / Required Re-submissions:
            </label>
            <textarea
              required
              rows={3}
              value={rejectNotes}
              onChange={(e) => setRejectNotes(formatSentenceCase(e.target.value))}
              placeholder="Specify missing OR/CR details, expired clearance, or improper vehicle specs..."
              className="w-full p-2.5 bg-white border border-rose-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowRejectForm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Inline Footer Actions */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <button
          onClick={() => setSelectedReview(null)}
          className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
        >
          Collapse Review
        </button>

        {!showRejectForm && (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowRejectForm(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <XCircle className="h-4 w-4" />
              <span>Reject Application</span>
            </button>

            <button
              onClick={handleApprove}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Approve &amp; Issue Franchise</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
