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
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatSentenceCase } from '../utils/formatters';

export const ReviewApprovalModal: React.FC = () => {
  const { selectedReview, setSelectedReview, approveReview, rejectReview } = useFranchise();
  const [rejectNotes, setRejectNotes] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!selectedReview) return null;

  const handleApprove = () => {
    approveReview(selectedReview.id);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
    setSelectedReview(null);
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    rejectReview(selectedReview.id, rejectNotes);
    setSelectedReview(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="gradient-header px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/30">
              <FileCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Document & Compliance Review</h3>
              <p className="text-xs text-slate-300">Application ID: {selectedReview.id} • {selectedReview.vehicleCategory}</p>
            </div>
          </div>
          <button 
            onClick={() => setSelectedReview(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">

          {/* Applicant Information Summary */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <User className="h-5 w-5 text-emerald-600 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-400">Applicant / Owner</p>
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
          </div>

          {/* Document Verification Checklist */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
              <span>Required Submissions Checklist</span>
              <span className="text-xs text-slate-500 font-normal">4 of 4 Verified</span>
            </h4>

            <div className="space-y-2">
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
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => setSelectedReview(null)}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Close
          </button>

          {!showRejectForm && (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowRejectForm(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors flex items-center space-x-1.5"
              >
                <XCircle className="h-4 w-4" />
                <span>Reject Application</span>
              </button>

              <button
                onClick={handleApprove}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 transition-all flex items-center space-x-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Approve & Issue Franchise</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
