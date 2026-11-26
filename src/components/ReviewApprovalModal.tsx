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

  // Floating Completion Card State
  const [reviewCompletedSummary, setReviewCompletedSummary] = useState<{
    id: string;
    applicantName: string;
    mtopAssigned: string;
    vehicleCategory: string;
    contactNumber: string;
    address: string;
    status: 'Approved' | 'Rejected';
    notes?: string;
    orNumber?: string;
    timestamp: string;
  } | null>(null);

  const handleApprove = () => {
    if (!selectedReview) return;
    setReviewCompletedSummary({
      id: selectedReview.id,
      applicantName: selectedReview.applicantName,
      mtopAssigned: selectedReview.mtopAssigned,
      vehicleCategory: selectedReview.vehicleCategory,
      contactNumber: selectedReview.contactNumber,
      address: selectedReview.address,
      status: 'Approved',
      orNumber: selectedReview.orNumber || selectedReview.receiptNumber || `OR-2026-${selectedReview.mtopAssigned || '10492'}`,
      timestamp: new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    });
    approveReview(selectedReview.id);
    setSelectedReview(null);
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;
    setReviewCompletedSummary({
      id: selectedReview.id,
      applicantName: selectedReview.applicantName,
      mtopAssigned: selectedReview.mtopAssigned,
      vehicleCategory: selectedReview.vehicleCategory,
      contactNumber: selectedReview.contactNumber,
      address: selectedReview.address,
      status: 'Rejected',
      notes: rejectNotes.trim() || undefined,
      orNumber: selectedReview.orNumber || selectedReview.receiptNumber || `OR-2026-${selectedReview.mtopAssigned || '10492'}`,
      timestamp: new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    });
    rejectReview(selectedReview.id, rejectNotes);
    setSelectedReview(null);
  };

  if (!selectedReview && !reviewCompletedSummary) return null;

  if (reviewCompletedSummary) {
    const isApproved = reviewCompletedSummary.status === 'Approved';
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
        onClick={(e) => {
          if (e.target === e.currentTarget) setReviewCompletedSummary(null);
        }}
      >
        <div
          className={`bg-white rounded-3xl shadow-2xl border-2 ${isApproved ? 'border-emerald-500/60' : 'border-rose-500/60'} max-w-2xl w-full overflow-hidden animate-scaleUp max-h-[92vh] flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`px-6 py-4 text-white flex items-center justify-between shrink-0 ${isApproved ? 'bg-gradient-to-r from-emerald-700 to-teal-800' : 'bg-gradient-to-r from-rose-700 to-red-800'}`}>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-xl text-white">
                {isApproved ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200 block">
                  Process Completed • Completion Card
                </span>
                <h3 className="text-base sm:text-lg font-black text-white">
                  Application {isApproved ? 'Approved' : 'Rejected'} — Unit {reviewCompletedSummary.mtopAssigned}
                </h3>
              </div>
            </div>
            <button
              onClick={() => setReviewCompletedSummary(null)}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close floating page"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            <div className={`p-4 rounded-2xl border flex items-center justify-between flex-wrap gap-3 ${isApproved ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Review Decision Stamped</span>
                <p className={`text-base font-black ${isApproved ? 'text-emerald-800' : 'text-rose-800'}`}>
                  {isApproved ? 'Status: Approved & Updated to Registry' : 'Status: Rejected'}
                </p>
                {reviewCompletedSummary.notes && (
                  <p className="text-xs text-rose-700 mt-1">Remarks: {reviewCompletedSummary.notes}</p>
                )}
              </div>
              <span className="text-xs text-slate-500 italic">
                Processed at {reviewCompletedSummary.timestamp}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-semibold text-[10px] uppercase block">Applicant / Operator</span>
                <p className="font-bold text-slate-900 mt-1 truncate">{reviewCompletedSummary.applicantName}</p>
                <p className="text-slate-500 text-[11px]">{reviewCompletedSummary.contactNumber}</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-semibold text-[10px] uppercase block">City Plate / MTOP</span>
                <p className="font-mono font-bold text-slate-900 mt-1 text-sm">{reviewCompletedSummary.mtopAssigned}</p>
                <p className="text-slate-500 text-[11px]">{reviewCompletedSummary.vehicleCategory}</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-semibold text-[10px] uppercase block">Official Receipt (OR)</span>
                <p className="font-mono font-bold text-slate-900 mt-1 truncate">{reviewCompletedSummary.orNumber}</p>
                <p className="text-slate-500 text-[11px]">Ref ID: {reviewCompletedSummary.id}</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-semibold text-[10px] uppercase block">Registered Address</span>
                <p className="font-medium text-slate-800 mt-1 line-clamp-2 text-[11px]">{reviewCompletedSummary.address}</p>
              </div>
            </div>

            <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200 text-center text-slate-500 text-[11px] italic">
              ✓ Record synced in cloud database • Passenger &amp; Operator notified
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
            <button
              type="button"
              onClick={() => setReviewCompletedSummary(null)}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
            >
              Done / Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedReview) return null;

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
