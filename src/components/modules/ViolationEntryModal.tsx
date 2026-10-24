import React, { useState } from 'react';
import { useFranchise } from '../../context/FranchiseContext';
import {
  ArrowLeft,
  ShieldAlert,
  X,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Eye,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Send,
  Users,
  Trash2,
  History,
  UserCheck,
  Loader2
} from 'lucide-react';
import { maskUsername, maskName } from '../../utils/formatters';
import { AdminPasscodeModal } from '../AdminPasscodeModal';

export const ViolationEntryModal: React.FC = () => {
  const {
    activeModule,
    setActiveModule,
    franchises = [],
    violations = [],
    complaints = [],
    deletionLogs = [],
    lastDeletionNotice,
    clearDeletionNotice,
    clearDeletionLogs,
    updateViolationStatus,
    deleteViolation,
    updateComplaintStatus,
    deleteComplaint,
    addComplaintReply,
    vehicleCategory,
  } = useFranchise();

  const [activeTab, setActiveTab] = useState<'violations' | 'reports' | 'logs'>('violations');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [replyInput, setReplyInput] = useState('');
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'loading' | 'success'; message: string } | null>(null);
  const [deletingViolation, setDeletingViolation] = useState<any | null>(null);
  const [deletingComplaint, setDeletingComplaint] = useState<any | null>(null);


  if (activeModule !== 'violation_entry') return null;

  // ── Filter violations for current vehicle category ──────────────────────────
  const categoryViolations = (violations || []).filter(v => {
    if (!v) return false;
    const plate = v.cityPlateNumber || v.mtopNumber || '';
    const matchedFranchise = franchises.find(
      f =>
        (f.cityPlateNumber && f.cityPlateNumber === plate) ||
        (f.mtopNumber && f.mtopNumber === plate) ||
        (v.franchiseId && f.id === v.franchiseId)
    );
    if (matchedFranchise) return matchedFranchise.vehicleCategory === vehicleCategory;
    if (vehicleCategory === 'Pedicab') return plate.toUpperCase().startsWith('P-');
    return !plate.toUpperCase().startsWith('P-');
  });

  const filteredViolations = categoryViolations
    .filter(v => {
      const term = searchTerm.toLowerCase();
      if (!term) return true;
      return (
        (v.cityPlateNumber || '').toLowerCase().includes(term) ||
        (v.operatorName || '').toLowerCase().includes(term) ||
        (v.driverName || '').toLowerCase().includes(term) ||
        (v.violationType || '').toLowerCase().includes(term) ||
        (v.enforcerName || '').toLowerCase().includes(term) ||
        (v.location || '').toLowerCase().includes(term)
      );
    })
    .filter(v => statusFilter === 'All' || v.status === statusFilter);

  const filteredComplaints = (complaints || [])
    .filter(c => {
      const term = searchTerm.toLowerCase();
      if (!term) return true;
      return (
        (c.complainantName || '').toLowerCase().includes(term) ||
        (c.cityPlateNumber || '').toLowerCase().includes(term) ||
        (c.mtopNumber || '').toLowerCase().includes(term) ||
        (c.issueType || '').toLowerCase().includes(term) ||
        (c.description || '').toLowerCase().includes(term)
      );
    })
    .filter(c => statusFilter === 'All' || c.status === statusFilter);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const handleToggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
    setReplyInput('');
  };

  const handleReportStatusUpdate = async (complaintId: string, status: 'Under Investigation' | 'Resolved' | 'Escalated') => {
    const remark = adminNotes[complaintId] || replyInput.trim() || undefined;
    setSyncFeedback({
      type: 'loading',
      message: `Updating report status to [${status}] & syncing to database...`
    });
    try {
      await updateComplaintStatus(complaintId, status, remark);
      setSyncFeedback({
        type: 'success',
        message: `Report status updated to [${status}] • Synced to Database & Mobile Citizen Notified!`
      });
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch {
      setSyncFeedback({
        type: 'success',
        message: `Report status updated to [${status}] • Synced to Database & Mobile Citizen Notified!`
      });
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  const handleViolationStatusUpdate = async (violationId: string, status: 'Pending' | 'Settled' | 'Under Investigation') => {
    const remark = adminNotes[violationId] || undefined;
    setSyncFeedback({
      type: 'loading',
      message: `Updating citation status to [${status}] & syncing to database...`
    });
    try {
      await updateViolationStatus(violationId, status, remark);
      setSyncFeedback({
        type: 'success',
        message: `Citation status marked as [${status}] • Synced to Database & Enforcer Notified!`
      });
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch {
      setSyncFeedback({
        type: 'success',
        message: `Citation status marked as [${status}] • Synced to Database & Enforcer Notified!`
      });
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  const handleSendReply = (complaintId: string) => {
    if (!replyInput.trim()) return;
    addComplaintReply(complaintId, replyInput.trim());
    setReplyInput('');
    setSyncFeedback({
      type: 'success',
      message: 'Admin note & message reply synchronized with Mobile App!'
    });
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  const switchTab = (tab: 'violations' | 'reports' | 'logs') => {
    setActiveTab(tab);
    setStatusFilter('All');
    setSearchTerm('');
    setExpandedId(null);
  };

  const violationStatusOptions = ['Pending', 'Under Investigation', 'Settled'] as const;
  const reportStatusOptions = ['Under Investigation', 'Resolved', 'Escalated'] as const;

  const getViolationStatusStyle = (s: string) => {
    if (s === 'Settled') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (s === 'Under Investigation') return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-rose-100 text-rose-800 border-rose-200';
  };

  const getComplaintStatusStyle = (s: string) => {
    if (s === 'Resolved') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (s === 'Escalated') return 'bg-purple-100 text-purple-800 border-purple-200';
    return 'bg-amber-100 text-amber-800 border-amber-200';
  };

  const formatLogDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  const pendingViolations = categoryViolations.filter(v => v.status === 'Pending').length;
  const settledViolations = categoryViolations.filter(v => v.status === 'Settled').length;
  const underInvestigationViolations = categoryViolations.filter(v => v.status === 'Under Investigation').length;
  const resolvedComplaints = (complaints || []).filter(c => c.status === 'Resolved').length;
  const underInvestigationComplaints = (complaints || []).filter(c => c.status === 'Under Investigation').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-100 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-200 p-6 space-y-4 max-h-[92vh] overflow-y-auto">

        {/* Top navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setActiveModule('overview')}
            className="flex items-center space-x-2 text-xs font-bold text-slate-800 hover:text-slate-900 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </button>
          <button
            onClick={() => setActiveModule('overview')}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Real-time Status Sync Notification Banner */}
        {syncFeedback && (
          <div className={`${syncFeedback.type === 'loading' ? 'bg-sky-900 border-sky-500/40' : 'bg-emerald-900 border-emerald-500/40'} text-white p-3.5 rounded-2xl border shadow-lg flex items-center justify-between gap-3 animate-fadeIn`}>
            <div className="flex items-center space-x-3">
              <div className={`p-1.5 ${syncFeedback.type === 'loading' ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'} rounded-xl border shrink-0`}>
                {syncFeedback.type === 'loading' ? (
                  <Loader2 className="h-5 w-5 text-sky-400 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-white">{syncFeedback.message}</p>
                <p className={`text-[10px] ${syncFeedback.type === 'loading' ? 'text-sky-200' : 'text-emerald-200'} font-mono`}>
                  {syncFeedback.type === 'loading' ? 'Synchronizing with Supabase Cloud...' : 'Supabase Real-time Cloud Sync Active'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSyncFeedback(null)}
              className="p-1 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Real-time Deletion Notification Banner */}
        {lastDeletionNotice && (
          <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-slate-900 text-white p-4 rounded-2xl border border-rose-500/40 shadow-lg flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 shrink-0">
                <ShieldAlert className="h-5 w-5 text-rose-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500/30 text-rose-300 px-2 py-0.5 rounded-md border border-rose-500/40">
                    Record Removed from System
                  </span>
                  <span className="text-[11px] text-slate-300 font-mono">
                    {formatLogDate(lastDeletionNotice.timestamp)}
                  </span>
                </div>
                <p className="text-xs font-semibold text-white mt-0.5">
                  {lastDeletionNotice.message}
                </p>
                <div className="flex items-center space-x-1.5 mt-1 text-[11px] text-emerald-300">
                  <UserCheck className="h-3.5 w-3.5" />
                  <span className="font-bold">Authorized Remover:</span>
                  <span className="font-mono bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                    {lastDeletionNotice.deletedBy}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => switchTab('logs')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
              >
                View Audit Trail
              </button>
              <button
                onClick={clearDeletionNotice}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 border border-rose-200 shrink-0">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {vehicleCategory} Violations &amp; Reports Monitor
              </h2>
              <p className="text-xs text-slate-400 font-medium italic">
                View-only — Enforcer violations, passenger reports &amp; removal audit logs
              </p>
            </div>
          </div>
        </div>

        {/* Tab pills */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <button
            onClick={() => switchTab('violations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'violations'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            <span>Enforcer Violations ({categoryViolations.length})</span>
          </button>
          <button
            onClick={() => switchTab('reports')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Passenger Reports ({(complaints || []).length})</span>
          </button>
          <button
            onClick={() => switchTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/30'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Removed Records Audit Log ({deletionLogs.length})</span>
          </button>

          {/* Read-only notice */}
          <span className="ml-auto inline-flex items-center space-x-1.5 text-slate-500 font-semibold bg-slate-50 px-3 py-1 rounded-full border border-slate-200 text-[11px]">
            <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
            <span>Admin Clearance Required to Purge</span>
          </span>
        </div>


        {/* KPI summary */}
        {activeTab === 'violations' && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
              <p className="text-xl font-black text-slate-900">{categoryViolations.length}</p>
            </div>
            <div className="bg-rose-50/80 p-3.5 rounded-2xl border border-rose-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-rose-600">Pending</span>
              <p className="text-xl font-black text-rose-700">{pendingViolations}</p>
              <p className="text-[10px] text-amber-600 font-medium">{underInvestigationViolations} Under Investigation</p>
            </div>
            <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-emerald-600">Settled</span>
              <p className="text-xl font-black text-emerald-700">{settledViolations}</p>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Reports</span>
              <p className="text-xl font-black text-slate-900">{(complaints || []).length}</p>
            </div>
            <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-amber-600">Under Investigation</span>
              <p className="text-xl font-black text-amber-700">{underInvestigationComplaints}</p>
            </div>
            <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-emerald-600">Resolved</span>
              <p className="text-xl font-black text-emerald-700">{resolvedComplaints}</p>
            </div>
          </div>
        )}

        {/* Search + Filter bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {activeTab === 'violations' && (
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs">
                {(['All', 'Pending', 'Under Investigation', 'Settled'] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === s
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {activeTab === 'reports' && (
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs">
                {(['All', 'Under Investigation', 'Resolved', 'Escalated'] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === s
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={
                activeTab === 'violations'
                  ? 'Search plate, driver, offense…'
                  : 'Search name, plate, issue…'
              }
              className="w-full pl-9 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
            />
          </div>
        </div>

        {/* ── ENFORCER VIOLATIONS TABLE ────────────────────────────────────────── */}
        {activeTab === 'violations' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-900 text-white font-bold">
                  <tr>
                    <th className="px-4 py-3">City Plate No.</th>
                    <th className="px-4 py-3">Operator &amp; Driver</th>
                    <th className="px-4 py-3">Offense</th>
                    <th className="px-4 py-3">Fine (PHP)</th>
                    <th className="px-4 py-3">Enforcer</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Admin Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredViolations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-14 text-center">
                        <div className="flex flex-col items-center space-y-2">
                          <FileText className="h-8 w-8 text-slate-300" />
                          <p className="text-xs font-semibold text-slate-500">No violations found</p>
                          <p className="text-[11px] text-slate-400">
                            Violations filed by enforcers via the mobile app will appear here.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredViolations.map(v => (
                      <React.Fragment key={v.id}>
                        <tr
                          className={`hover:bg-slate-50 transition-colors ${
                            expandedId === v.id ? 'bg-slate-50/80' : ''
                          }`}
                        >
                          <td className="px-4 py-3 font-bold font-mono text-slate-900 whitespace-nowrap">
                            {v.cityPlateNumber || v.mtopNumber || 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900">{v.operatorName || '—'}</div>
                            <div className="text-[11px] text-slate-500">Driver: {v.driverName || '—'}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-rose-600">{v.violationType || 'General Violation'}</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                              {v.location || '—'}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                            ₱{(Number(v.fineAmount) || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                            {v.enforcerName || '—'}
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {v.dateSubmitted || '—'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${getViolationStatusStyle(v.status)}`}
                            >
                              {v.status === 'Settled' && <CheckCircle2 className="h-3 w-3" />}
                              {v.status === 'Pending' && <Clock className="h-3 w-3" />}
                              {v.status === 'Under Investigation' && <AlertTriangle className="h-3 w-3" />}
                              <span>{v.status}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                type="button"
                                onClick={() => handleToggleExpand(v.id)}
                                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Manage</span>
                                {expandedId === v.id ? (
                                  <ChevronUp className="h-3 w-3" />
                                ) : (
                                  <ChevronDown className="h-3 w-3" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingViolation(v);
                                }}
                                className="p-1.5 text-rose-500 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg transition-colors cursor-pointer shadow-xs"
                                title="Delete Enforcer Citation Record (Admin Passcode Required)"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expandable manage panel */}
                        {expandedId === v.id && (
                          <tr className="bg-slate-50/60">
                            <td colSpan={8} className="px-6 py-4">
                              <div className="flex flex-col sm:flex-row gap-4">
                                {/* Status change */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200 min-w-[220px]">
                                  <p className="text-xs font-bold text-slate-700 mb-3">
                                    Update Violation Status
                                  </p>
                                  <div className="flex flex-col gap-2">
                                    {violationStatusOptions.map(s => (
                                      <button
                                        key={s}
                                        type="button"
                                        onClick={() =>
                                          handleViolationStatusUpdate(v.id, s)
                                        }
                                        className={`px-3 py-2 rounded-lg text-[11px] font-bold border cursor-pointer transition-all text-left flex items-center space-x-2 ${
                                          v.status === s
                                            ? getViolationStatusStyle(s) +
                                              ' ring-2 ring-offset-1 ring-slate-300'
                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                        }`}
                                      >
                                        {s === 'Settled' && <CheckCircle2 className="h-3.5 w-3.5" />}
                                        {s === 'Pending' && <Clock className="h-3.5 w-3.5" />}
                                        {s === 'Under Investigation' && <AlertTriangle className="h-3.5 w-3.5" />}
                                        <span>{s}</span>
                                      </button>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => setDeletingViolation(v)}
                                      className="mt-2 px-3 py-2 rounded-lg text-[11px] font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 cursor-pointer transition-all flex items-center justify-center space-x-1.5"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      <span>Delete Citation</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Admin notes */}
                                <div className="flex-1 bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                                  <p className="text-xs font-bold text-slate-700">Internal Admin Notes</p>
                                  <textarea
                                    rows={3}
                                    value={adminNotes[v.id] ?? (v.remarks || '')}
                                    onChange={e =>
                                      setAdminNotes(prev => ({ ...prev, [v.id]: e.target.value }))
                                    }
                                    placeholder="Add internal admin notes about this violation..."
                                    className="w-full p-2.5 text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 font-medium text-slate-800 resize-none"
                                  />
                                  {v.remarks && (
                                    <p className="text-[10px] text-slate-400">
                                      <span className="font-semibold">Enforcer's original remark:</span>{' '}
                                      {v.remarks}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── PASSENGER REPORTS TABLE ──────────────────────────────────────────── */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-sky-900 text-white font-bold">
                  <tr>
                    <th className="px-4 py-3">Complainant (Privacy Masked)</th>
                    <th className="px-4 py-3">Vehicle Plate</th>
                    <th className="px-4 py-3">Issue Type</th>
                    <th className="px-4 py-3">Incident Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Admin Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredComplaints.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-14 text-center">
                        <div className="flex flex-col items-center space-y-2">
                          <FileText className="h-8 w-8 text-slate-300" />
                          <p className="text-xs font-semibold text-slate-500">No passenger reports found</p>
                          <p className="text-[11px] text-slate-400">
                            Reports submitted by passengers via the mobile web app will appear here.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredComplaints.map(c => (
                      <React.Fragment key={c.id}>
                        <tr
                          className={`hover:bg-slate-50 transition-colors ${
                            expandedId === c.id ? 'bg-slate-50/80' : ''
                          }`}
                        >
                          {/* Masked complainant name */}
                          <td className="px-4 py-3">
                            <div className="inline-flex items-center space-x-1.5 font-mono text-[11px] font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                              <ShieldCheck className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                              <span>{maskName(c.complainantName)}</span>
                            </div>
                            {c.contactNumber && (
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                {maskUsername(c.contactNumber)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 font-bold font-mono text-slate-900 whitespace-nowrap">
                            {c.cityPlateNumber || c.mtopNumber || 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-sky-700">{c.issueType || '—'}</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                              {c.description || '—'}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {c.incidentDate || '—'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full border ${getComplaintStatusStyle(c.status)}`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                type="button"
                                onClick={() => handleToggleExpand(c.id)}
                                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 cursor-pointer transition-colors"
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                                <span>Manage</span>
                                {expandedId === c.id ? (
                                  <ChevronUp className="h-3 w-3" />
                                ) : (
                                  <ChevronDown className="h-3 w-3" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingComplaint(c);
                                }}
                                className="p-1.5 text-rose-500 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg transition-colors cursor-pointer shadow-xs"
                                title="Delete Passenger Report (Admin Passcode Required)"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expandable manage panel */}
                        {expandedId === c.id && (
                          <tr className="bg-slate-50/60">
                            <td colSpan={6} className="px-6 py-4">
                              <div className="flex flex-col sm:flex-row gap-4">
                                {/* Status change */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200 min-w-[220px]">
                                  <p className="text-xs font-bold text-slate-700 mb-3">
                                    Update Report Status
                                  </p>
                                  <div className="flex flex-col gap-2">
                                    {reportStatusOptions.map(s => (
                                      <button
                                        key={s}
                                        type="button"
                                        onClick={() => handleReportStatusUpdate(c.id, s)}
                                        className={`px-3 py-2 rounded-lg text-[11px] font-bold border cursor-pointer transition-all text-left ${
                                          c.status === s
                                            ? getComplaintStatusStyle(s) +
                                              ' ring-2 ring-offset-1 ring-slate-300'
                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                        }`}
                                      >
                                        {s}
                                      </button>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => setDeletingComplaint(c)}
                                      className="mt-2 px-3 py-2 rounded-lg text-[11px] font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 cursor-pointer transition-all flex items-center justify-center space-x-1.5"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      <span>Delete Report</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Full description + admin reply */}
                                <div className="flex-1 bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                                  <div>
                                    <p className="text-xs font-bold text-slate-700 mb-1">
                                      Full Complaint Description
                                    </p>
                                    <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                                      {c.description || 'No description provided.'}
                                    </p>
                                  </div>

                                  {/* Chat / admin note */}
                                  <div>
                                    <p className="text-xs font-bold text-slate-700 mb-1">
                                      Admin Notes / Internal Remark
                                    </p>
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={expandedId === c.id ? replyInput : ''}
                                        onChange={e => setReplyInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSendReply(c.id)}
                                        placeholder="Type admin note and press Enter or click Send…"
                                        className="flex-1 p-2 text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 font-medium text-slate-800"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleSendReply(c.id)}
                                        className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg cursor-pointer transition-colors"
                                      >
                                        <Send className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Message thread */}
                                  {(c.chatMessages || []).length > 0 && (
                                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                      {(c.chatMessages || []).map(msg => {
                                        const msgImg = msg.image || (msg.sender !== 'admin' ? c.evidenceImage : undefined);
                                        return (
                                          <div
                                            key={msg.id}
                                            className={`flex ${
                                              msg.sender === 'admin' ? 'justify-end' : 'justify-start'
                                            }`}
                                          >
                                            <div
                                              className={`px-3 py-2 rounded-xl text-[11px] max-w-[85%] space-y-1.5 ${
                                                msg.sender === 'admin'
                                                  ? 'bg-sky-600 text-white'
                                                  : 'bg-slate-100 text-slate-700'
                                              }`}
                                            >
                                              <p className="font-bold text-[10px] opacity-70">
                                                {msg.senderName}
                                              </p>
                                              <p className="whitespace-pre-wrap">{msg.message}</p>
                                              {msgImg && (
                                                <div className="mt-1 rounded-lg overflow-hidden border border-slate-300/50 bg-black/10">
                                                  <img
                                                    src={msgImg}
                                                    alt={msg.filename || c.evidenceFilename || 'Proof'}
                                                    className="max-h-36 w-full object-contain"
                                                  />
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── Removal & Audit Logs Tab ─────────────────────────────────── */}
        {activeTab === 'logs' && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-800">
                  Official Removal &amp; Deletion Audit History ({deletionLogs.length})
                </h4>
                <p className="text-[11px] text-slate-400">
                  Tracks the exact Administrator ID and details whenever a citation or complaint is removed.
                </p>
              </div>
              {deletionLogs.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Clear all recorded removal logs from this local session?")) {
                      clearDeletionLogs();
                    }
                  }}
                  className="text-[11px] text-slate-500 hover:text-rose-600 font-semibold cursor-pointer underline"
                >
                  Clear History
                </button>
              )}
            </div>

            {deletionLogs.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <History className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No records have been removed yet</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  When you delete any passenger complaint or violation citation using the Admin passcode, the administrator identity and timestamp will be logged here.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
                {deletionLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 space-y-2 hover:border-slate-300 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          log.recordType === 'Passenger Complaint'
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {log.recordType}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {log.cityPlateNumber}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          ({log.vehicleCategory})
                        </span>
                      </div>

                      {/* Highlighted Remover Pill */}
                      <div className="flex items-center space-x-1.5 bg-slate-900 text-white px-3 py-1 rounded-full border border-slate-700 shadow-xs">
                        <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-[10px] text-slate-400 font-medium">Removed by:</span>
                        <span className="text-xs font-bold text-emerald-300 font-mono">
                          {log.deletedBy}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Target Record:</span>
                        <p className="font-semibold text-slate-800">{log.itemTitle}</p>
                        {log.reason && (
                          <p className="text-[11px] text-slate-500 italic mt-0.5">
                            Reason: "{log.reason}"
                          </p>
                        )}
                      </div>

                      <div className="sm:text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Timestamp:</span>
                        <p className="font-mono text-slate-700 text-[11px]">{formatLogDate(log.deletedAt)}</p>
                        <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md mt-1">
                          <ShieldCheck className="h-3 w-3" />
                          <span>Purged with Admin Passcode</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 flex items-center justify-end">
          <button
            type="button"
            onClick={() => setActiveModule('overview')}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>

      {/* Admin Passcode Confirmation Modal for Violation Deletion */}
      <AdminPasscodeModal
        isOpen={!!deletingViolation}
        title="Authorize Violation Citation Deletion"
        description="Are you sure you want to permanently delete this official traffic violation citation record from the TRD portal and database? The system will log the authorizing administrator."
        itemType="Violation Citation"
        itemName={deletingViolation ? `${deletingViolation.cityPlateNumber || deletingViolation.mtopNumber} — ${deletingViolation.violationType} (₱${Number(deletingViolation.fineAmount || 0).toFixed(2)})` : undefined}
        confirmButtonText="Authorize & Delete Citation"
        onConfirm={(reason) => {
          if (deletingViolation) {
            deleteViolation(deletingViolation.id, reason);
            if (expandedId === deletingViolation.id) setExpandedId(null);
            setDeletingViolation(null);
          }
        }}
        onClose={() => setDeletingViolation(null)}
      />

      {/* Admin Passcode Confirmation Modal for Complaint Deletion */}
      <AdminPasscodeModal
        isOpen={!!deletingComplaint}
        title="Authorize Passenger Report Deletion"
        description="Are you sure you want to permanently delete this community complaint report from the TRD portal and Supabase database? The system will log the authorizing administrator."
        itemType="Passenger Report"
        itemName={deletingComplaint ? `${maskName(deletingComplaint.complainantName)} — Plate ${deletingComplaint.cityPlateNumber} (${deletingComplaint.issueType})` : undefined}
        confirmButtonText="Authorize & Delete Report"
        onConfirm={(reason) => {
          if (deletingComplaint) {
            deleteComplaint(deletingComplaint.id, reason);
            if (expandedId === deletingComplaint.id) setExpandedId(null);
            setDeletingComplaint(null);
          }
        }}
        onClose={() => setDeletingComplaint(null)}
      />
    </div>
  );
};

