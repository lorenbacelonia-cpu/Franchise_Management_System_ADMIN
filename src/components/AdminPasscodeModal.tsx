import React, { useState, useEffect, useRef } from 'react';
import { Lock, Eye, EyeOff, ShieldAlert, X, AlertTriangle, UserCheck, Trash2, CheckCircle2 } from 'lucide-react';
import { useFranchise } from '../context/FranchiseContext';

interface AdminPasscodeModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  itemType?: string;
  itemName?: string;
  confirmButtonText?: string;
  onConfirm: (reason?: string) => void;
  onClose: () => void;
}

export const AdminPasscodeModal: React.FC<AdminPasscodeModalProps> = ({
  isOpen,
  title = 'Administrator Authorization Required',
  description = 'Please enter your administrator passcode to confirm permanent deletion of this record.',
  itemType = 'Record',
  itemName,
  confirmButtonText = 'Authorize & Delete',
  onConfirm,
  onClose,
}) => {
  const { currentAdmin } = useFranchise();
  const [passcode, setPasscode] = useState('');
  const [deletionReason, setDeletionReason] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [completedSummary, setCompletedSummary] = useState<{
    itemName?: string;
    itemType?: string;
    reason?: string;
    adminName: string;
    adminId: string;
    timestamp: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPasscode('');
      setDeletionReason('');
      setError(null);
      setIsSubmitting(false);
      setIsDeleted(false);
      setCompletedSummary(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen && !isDeleted) return null;

  const validPasscodes = ['01012005', 'admin', '123456', 'admin123', 'trdadmin', '2004', 'trd2026', 'admin2026'];

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPass = passcode.trim();
    if (!cleanPass) {
      setError('Please enter the administrator passcode.');
      return;
    }

    const isAuthed = validPasscodes.includes(cleanPass.toLowerCase()) ||
      (currentAdmin?.password && currentAdmin.password.toLowerCase() === cleanPass.toLowerCase());

    if (!isAuthed) {
      setError("Invalid administrator passcode. Please try again.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const reasonClean = deletionReason.trim() || undefined;
    onConfirm(reasonClean);

    // Transform dialog into Deletion Completion Card!
    setCompletedSummary({
      itemName: itemName || itemType,
      itemType: itemType || 'Record',
      reason: reasonClean,
      adminName: currentAdmin?.name || 'Administrator',
      adminId: currentAdmin?.adminId || 'ADM-2026-001',
      timestamp: new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    });
    setIsDeleted(true);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    setIsDeleted(false);
    setCompletedSummary(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      {/* ── 1. DELETION COMPLETION CARD (Shows after successful deletion) ── */}
      {isDeleted && completedSummary ? (
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-2 border-rose-500/50 animate-scaleUp"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-rose-900/50">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
                <Trash2 className="h-5 w-5 text-rose-400" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-300 block">
                  Process Completed • Deletion Summary
                </span>
                <h3 className="text-sm font-bold text-white leading-tight">Record Successfully Purged</h3>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-6 space-y-4 text-xs">
            {/* Status Alert Banner */}
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-bold text-rose-900 block">Permanent Record Removal Confirmed</span>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  The target record has been completely removed from active views and archived to the audit trail.
                </p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="space-y-2.5">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-semibold text-[10px] uppercase block">Purged Item / Reference</span>
                <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">{completedSummary.itemName}</p>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{completedSummary.itemType}</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-semibold text-[10px] uppercase block">Authorized Remover</span>
                  <p className="font-bold text-slate-900 truncate mt-0.5">{completedSummary.adminName}</p>
                  <p className="text-slate-500 font-mono text-[10px]">{completedSummary.adminId}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-semibold text-[10px] uppercase block">Audit Timestamp</span>
                  <p className="font-mono font-bold text-slate-800 mt-0.5">{completedSummary.timestamp}</p>
                  <p className="text-emerald-700 font-semibold text-[10px]">Logged to Cloud</p>
                </div>
              </div>

              {completedSummary.reason && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-semibold text-[10px] uppercase block">Reason / Remarks Recorded</span>
                  <p className="text-slate-800 italic mt-0.5">"{completedSummary.reason}"</p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all cursor-pointer"
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ── 2. PASSCODE AUTHORIZATION PROMPT FORM ── */
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-scaleUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-rose-900/50">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
                <ShieldAlert className="h-5 w-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">{title}</h3>
                <p className="text-[11px] text-rose-200/80 font-medium">Security Clearance Required</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            
            {/* Active Admin executing deletion */}
            <div className="bg-slate-900 text-slate-100 rounded-xl p-3 flex items-center justify-between border border-slate-700 shadow-xs">
              <div className="flex items-center space-x-2.5">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Authorizing Official:</span>
                  <p className="font-bold text-white text-xs">{currentAdmin.name}</p>
                </div>
              </div>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                {currentAdmin.adminId}
              </span>
            </div>

            {itemName && (
              <div className="bg-rose-50 border border-rose-200/80 rounded-xl p-3 flex items-start space-x-2.5">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-rose-700 tracking-wider">
                    Target {itemType} to be permanently deleted:
                  </span>
                  <p className="font-bold font-mono text-slate-900 truncate text-xs mt-0.5">{itemName}</p>
                </div>
              </div>
            )}

            <p className="text-slate-600 leading-relaxed">
              {description}
            </p>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700">
                Reason / Remarks for Removal (Optional)
              </label>
              <input
                type="text"
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                placeholder="e.g. False report / Resolved privately / Settled by enforcer..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700">
                Administrator Passcode <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  ref={inputRef}
                  type={showPasscode ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter confidential administrator passcode..."
                  className={`w-full pl-9 pr-10 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-900 font-medium focus:outline-none transition-all ${
                    error
                      ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/30'
                      : 'border-slate-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPasscode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {error && (
                <p className="text-[11px] font-semibold text-rose-600 flex items-center space-x-1 animate-fadeIn">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  <span>{error}</span>
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !passcode.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>{confirmButtonText}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

