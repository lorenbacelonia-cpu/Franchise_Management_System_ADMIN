import React, { useState, useEffect, useRef } from 'react';
import { Lock, Eye, EyeOff, ShieldAlert, X, AlertTriangle, UserCheck } from 'lucide-react';
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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPasscode('');
      setDeletionReason('');
      setError(null);
      setIsSubmitting(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);


  if (!isOpen) return null;

  const validPasscodes = ['01012005', 'admin', '123456', 'admin123', 'trdadmin'];

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPass = passcode.trim();
    if (!cleanPass) {
      setError('Please enter the administrator passcode.');
      return;
    }

    if (!validPasscodes.includes(cleanPass)) {
      setError("Invalid administrator passcode. Please try again.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    onConfirm(deletionReason.trim() || undefined);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
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
            onClick={onClose}
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
              onClick={onClose}
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
    </div>
  );
};

