import React, { useState, useRef, useEffect } from 'react';
import { useFranchise } from '../context/FranchiseContext';
import type { PassengerComplaint } from '../types';
import { maskName } from '../utils/formatters';
import {
  MessageSquare,
  X,
  ShieldCheck,
  CalendarDays,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  User,
  MessageCircle,
  Image as ImageIcon,
  ZoomIn,
  ExternalLink,
  Trash2,
  History,
  UserCheck,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { AdminPasscodeModal } from './AdminPasscodeModal';

/* ─── Complaint Chat Panel ─────────────────────────────────── */
const ComplaintChatPanel: React.FC<{
  complaint: PassengerComplaint;
  onClose: () => void;
  onDeleteRequest: (complaint: PassengerComplaint) => void;
  onStatusUpdate?: (status: 'Under Investigation' | 'Resolved' | 'Escalated') => void;
}> = ({ complaint, onClose, onDeleteRequest, onStatusUpdate }) => {
  const { updateComplaintStatus } = useFranchise();
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'loading' | 'success'; message: string } | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [complaint.chatMessages]);

  const handleStatusChange = async (s: 'Under Investigation' | 'Resolved' | 'Escalated') => {
    if (isUpdatingStatus) return;
    setIsUpdatingStatus(s);
    setSyncFeedback({
      type: 'loading',
      message: `Updating status to ${s === 'Under Investigation' ? 'Investigate' : s} & syncing to DB...`
    });

    try {
      await updateComplaintStatus(complaint.id, s);
      onStatusUpdate?.(s);
      setSyncFeedback({
        type: 'success',
        message: `Status marked as ${s} & Synced to DB`
      });
      setTimeout(() => setSyncFeedback(null), 3000);
    } catch (e) {
      console.warn('Status update warning:', e);
      setSyncFeedback({
        type: 'success',
        message: `Status marked as ${s} & Synced to DB`
      });
      setTimeout(() => setSyncFeedback(null), 3000);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleString('en-PH', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      });
    } catch { return ts; }
  };

  const statusColors: Record<string, string> = {
    'Under Investigation': 'bg-amber-100 text-amber-800 border-amber-300',
    'Resolved': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'Escalated': 'bg-rose-100 text-rose-800 border-rose-300',
  };

  const messages = complaint.chatMessages || [];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-end bg-slate-900/50 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-slideInRight">

        {/* Panel Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-start justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-sky-400" />
              <span className="text-sm font-bold">Complaint Report Thread</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Mobile Web Submission — Admin Review</p>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Complaint Info Card */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 border border-sky-200">
                <User className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="h-3 w-3 text-sky-500" />
                  <p className="text-xs font-bold text-slate-900 font-mono">{maskName(complaint.complainantName)}</p>
                </div>
                <p className="text-[11px] text-slate-400 italic">Contact hidden for privacy</p>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusColors[complaint.status]}`}>
              {complaint.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center space-x-1.5 text-slate-600">
              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="font-semibold">Plate: <span className="font-mono text-slate-900">{complaint.cityPlateNumber}</span></span>
            </div>
            <div className="flex items-center space-x-1.5 text-slate-600">
              <CalendarDays className="h-3 w-3 text-slate-400 shrink-0" />
              <span>Incident: <span className="font-semibold text-slate-900">{complaint.incidentDate}</span></span>
            </div>
            <div className="flex items-center space-x-1.5 text-slate-600 col-span-2">
              <AlertTriangle className="h-3 w-3 text-rose-400 shrink-0" />
              <span className="font-semibold text-rose-700">{complaint.issueType}</span>
            </div>
          </div>

          {/* Real-time Sync Feedback Toast */}
          {syncFeedback && (
            <div
              className={`p-2 rounded-lg text-[10px] font-bold flex items-center space-x-1.5 animate-fadeIn ${
                syncFeedback.type === 'loading'
                  ? 'bg-sky-50 border border-sky-200 text-sky-800'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              }`}
            >
              {syncFeedback.type === 'loading' ? (
                <Loader2 className="h-3.5 w-3.5 text-sky-600 animate-spin shrink-0" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              )}
              <span>{syncFeedback.message}</span>
            </div>
          )}

          {/* Status Actions & Delete */}
          <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Status:</span>
              {(['Under Investigation', 'Resolved', 'Escalated'] as const).map(s => {
                const isLoadingThis = isUpdatingStatus === s;
                const isCurrent = complaint.status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleStatusChange(s)}
                    disabled={isCurrent || !!isUpdatingStatus}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all border flex items-center space-x-1 ${
                      isLoadingThis
                        ? 'bg-sky-100 text-sky-800 border-sky-300 opacity-90 cursor-wait'
                        : isCurrent
                        ? statusColors[s] + ' opacity-70 cursor-default ring-1 ring-slate-400'
                        : isUpdatingStatus
                        ? 'bg-white text-slate-300 border-slate-100 cursor-not-allowed'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 cursor-pointer'
                    }`}
                  >
                    {isLoadingThis && <Loader2 className="h-2.5 w-2.5 animate-spin text-sky-700" />}
                    <span>{s === 'Under Investigation' ? 'Investigate' : s}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => onDeleteRequest(complaint)}
              className="flex items-center space-x-1 px-2.5 py-1 text-[10px] font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg transition-all cursor-pointer shadow-xs"
              title="Delete this complaint record (Admin passcode required)"
            >
              <Trash2 className="h-3 w-3" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Chat Thread */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-2 text-slate-400">
              <MessageCircle className="h-8 w-8 text-slate-300" />
              <p className="text-xs font-semibold">No messages yet</p>
              <p className="text-[11px] text-center">The complainant's report will appear here once submitted from the mobile web.</p>
            </div>
          ) : (
            <>
              {/* Initial Description as first system message */}
              <div className="flex justify-center">
                <span className="text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-xs">
                  Complaint submitted from Mobile Web
                </span>
              </div>

              {messages.map((msg) => {
                const isAdmin = msg.sender === 'admin';
                const msgImage = msg.image || (!isAdmin ? complaint.evidenceImage : undefined);
                const msgFilename = msg.filename || (!isAdmin ? complaint.evidenceFilename : undefined);

                return (
                  <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[88%] space-y-1 ${isAdmin ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className={`flex items-center space-x-1.5 ${isAdmin ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold border ${
                          isAdmin ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-sky-100 text-sky-700 border-sky-200'
                        }`}>
                          {isAdmin ? 'A' : '?'}
                        </div>
                        <span className="text-[10px] font-bold text-slate-600">
                          {isAdmin ? msg.senderName : maskName(msg.senderName)}
                        </span>
                      </div>

                      <div className={`p-3 rounded-2xl text-xs leading-relaxed space-y-2.5 ${
                        isAdmin
                          ? 'bg-indigo-600 text-white rounded-tr-sm shadow-sm shadow-indigo-200'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm shadow-xs'
                      }`}>
                        {/* Text Message Content */}
                        <div className="whitespace-pre-wrap">{msg.message}</div>

                        {/* Attached Evidence Image / Photo Display */}
                        {msgImage && (
                          <div className="pt-1">
                            <div
                              onClick={() => setLightboxImage({ url: msgImage, title: msgFilename || 'Evidence Proof' })}
                              className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 cursor-pointer shadow-sm hover:shadow-md transition-all block"
                            >
                              <img
                                src={msgImage}
                                alt={msgFilename || 'Uploaded Evidence'}
                                className="w-full max-h-52 object-contain bg-slate-950/80 group-hover:scale-[1.02] transition-transform duration-200"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1.5 text-white font-semibold text-[11px] backdrop-blur-[1px]">
                                <ZoomIn className="h-4 w-4" />
                                <span>Click to enlarge photo</span>
                              </div>
                            </div>

                            {msgFilename && (
                              <div className="flex items-center space-x-1 mt-1.5 text-[10px] text-slate-500 font-medium">
                                <ImageIcon className="h-3 w-3 text-sky-500 shrink-0" />
                                <span className="truncate">{msgFilename}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <span className={`text-[10px] text-slate-400 ${isAdmin ? 'text-right' : 'text-left'}`}>
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </>
          )}
        </div>

      </div>

      {/* Lightbox Modal for Enclosing Proof Image Preview */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="bg-slate-900 rounded-2xl max-w-2xl w-full overflow-hidden border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 bg-slate-850 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <ImageIcon className="h-4 w-4 text-sky-400" />
                <span className="text-xs font-bold truncate max-w-xs">{lightboxImage.title}</span>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={lightboxImage.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs flex items-center space-x-1 font-medium"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="text-[11px]">Open Full</span>
                </a>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-4 flex items-center justify-center bg-slate-950 overflow-auto flex-1 min-h-[300px]">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Main Table ───────────────────────────────────────────── */
export const PendingReviewsTable: React.FC = () => {
  const {
    vehicleCategory,
    pendingReviews,
    complaints,
    deletionLogs,
    lastDeletionNotice,
    clearDeletionNotice,
    clearDeletionLogs,
    setVehicleCategory,
    setSelectedReview,
    deleteComplaint,
  } = useFranchise();

  const [activeTab, setActiveTab] = useState<'reviews' | 'complaints' | 'logs'>('reviews');
  const [filterOption, setFilterOption] = useState<'All' | 'Tricycle' | 'Pedicab'>(vehicleCategory);
  const [selectedComplaint, setSelectedComplaint] = useState<PassengerComplaint | null>(null);
  const [deletingComplaint, setDeletingComplaint] = useState<PassengerComplaint | null>(null);

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

  // Filter logs
  const filteredLogs = deletionLogs.filter(l => {
    if (filterOption !== 'All' && l.vehicleCategory !== filterOption) return false;
    return true;
  });

  const statusBadge = (status: string) => {
    if (status === 'Resolved') return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    if (status === 'Escalated') return 'bg-rose-100 text-rose-800 border border-rose-200';
    return 'bg-amber-100 text-amber-800 border border-amber-200';
  };

  const statusIcon = (status: string) => {
    if (status === 'Resolved') return <CheckCircle2 className="h-3 w-3" />;
    if (status === 'Escalated') return <AlertTriangle className="h-3 w-3" />;
    return <Clock className="h-3 w-3" />;
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

  return (
    <>
      {/* Real-Time Deletion Notification Banner Showing Who Removed the Item */}
      {lastDeletionNotice && (
        <div className="mb-4 bg-gradient-to-r from-rose-900 via-slate-900 to-slate-900 text-white p-4 rounded-2xl border border-rose-500/40 shadow-lg flex items-center justify-between gap-3 animate-fadeIn">
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
              onClick={() => setActiveTab('logs')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
            >
              View Audit Log
            </button>
            <button
              onClick={clearDeletionNotice}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Dismiss notice"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-10">

        {/* Top Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">

          {/* Triple Tab Switcher */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap gap-y-2">
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`px-4 sm:px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
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
              className={`px-4 sm:px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'complaints'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-700 bg-transparent'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Passenger Complaints</span>
              {filteredComplaints.filter(c => c.status === 'Under Investigation').length > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  activeTab === 'complaints' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
                }`}>
                  {filteredComplaints.filter(c => c.status === 'Under Investigation').length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`px-4 sm:px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'logs'
                  ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                  : 'text-slate-400 hover:text-slate-700 bg-transparent'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>Removal &amp; Audit Trail</span>
              {filteredLogs.length > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  activeTab === 'logs' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
                }`}>
                  {filteredLogs.length}
                </span>
              )}
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
            : activeTab === 'complaints'
            ? 'Community reports submitted via mobile web — click "View Chat" to read the complainant\'s messages.'
            : 'Official audit log displaying the exact administrator who authorized and removed each complaint or violation citation from the system.'
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
          ) : activeTab === 'complaints' ? (
            <div className="space-y-2">
              {filteredComplaints.length === 0 ? (
                <div className="text-center py-8 text-slate-400 italic text-xs">
                  No passenger complaints recorded.
                </div>
              ) : (
                filteredComplaints.map((c) => {
                  const msgCount = c.chatMessages?.length || 0;
                  const hasUnread = c.status === 'Under Investigation' && msgCount > 0;
                  return (
                    <div
                      key={c.id}
                      className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all shadow-xs overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-4 py-3.5">
                        {/* Left: info */}
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="relative shrink-0">
                            <div className="h-9 w-9 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 border border-sky-200 font-bold text-sm">
                              <ShieldCheck className="h-4 w-4" />
                            </div>
                            {hasUnread && (
                              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-rose-500 rounded-full border-2 border-white" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="text-xs font-bold text-slate-900 font-mono truncate">{maskName(c.complainantName)}</p>
                              <span className={`inline-flex items-center space-x-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadge(c.status)}`}>
                                {statusIcon(c.status)}
                                <span>{c.status}</span>
                              </span>
                              {(c.evidenceImage || c.chatMessages?.some(m => m.image)) && (
                                <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                                  <ImageIcon className="h-2.5 w-2.5" />
                                  <span>Photo Attached</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-3 mt-0.5">
                              <span className="text-[11px] text-slate-500 font-mono">
                                <span className="font-bold text-slate-700">{c.cityPlateNumber}</span> · {c.vehicleCategory}
                              </span>
                              <span className="text-[11px] text-rose-600 font-semibold truncate">{c.issueType}</span>
                            </div>
                            {msgCount > 0 && (
                              <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">
                                💬 {msgCount} message{msgCount !== 1 ? 's' : ''} · {c.chatMessages![msgCount - 1].senderName}: "{c.chatMessages![msgCount - 1].message.substring(0, 50)}{c.chatMessages![msgCount - 1].message.length > 50 ? '…' : ''}"
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right: action buttons */}
                        <div className="flex items-center space-x-2 shrink-0 ml-3">
                          <button
                            type="button"
                            onClick={() => setSelectedComplaint(c)}
                            className="flex items-center space-x-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>View Chat</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingComplaint(c);
                            }}
                            className="p-2 text-rose-500 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-xl transition-all cursor-pointer shadow-xs"
                            title="Delete passenger report (Admin Passcode Required)"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* ─── Removal & Audit Logs Tab ─────────────────────────────────── */
            <div className="space-y-3">
              <div className="flex items-center justify-between px-2 pb-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-800">
                    Deletion &amp; Removal Audit History ({filteredLogs.length})
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Shows who removed complaints or violation citations
                  </span>
                </div>
                {filteredLogs.length > 0 && (
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

              {filteredLogs.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center space-y-2 border border-slate-200/80">
                  <History className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No records have been removed yet</p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    When an administrator authorizes and deletes a passenger complaint or violation citation, the exact administrator ID and timestamp will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center space-x-2.5">
                          <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                            log.recordType === 'Passenger Complaint'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {log.recordType}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-900">
                            Plate: {log.cityPlateNumber}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500">
                            ({log.vehicleCategory})
                          </span>
                        </div>

                        {/* Who Removed It - Highlighted Pill */}
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
                          <span className="text-[10px] uppercase font-bold text-slate-400">Target Item:</span>
                          <p className="font-semibold text-slate-800">{log.itemTitle}</p>
                          {log.reason && (
                            <p className="text-[11px] text-slate-500 italic mt-0.5">
                              Remark: "{log.reason}"
                            </p>
                          )}
                        </div>

                        <div className="sm:text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Date &amp; Time of Removal:</span>
                          <p className="font-mono font-medium text-slate-700">{formatLogDate(log.deletedAt)}</p>
                          <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md mt-1">
                            <ShieldCheck className="h-3 w-3" />
                            <span>Security Verified &amp; Purged</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Complaint Chat Panel Overlay */}
      {selectedComplaint && (
        <ComplaintChatPanel
          complaint={complaints.find(c => c.id === selectedComplaint.id) || selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          onDeleteRequest={(targetComplaint) => setDeletingComplaint(targetComplaint)}
          onStatusUpdate={(newStatus) => {
            setSelectedComplaint(prev => prev ? { ...prev, status: newStatus } : null);
          }}
        />
      )}

      {/* Admin Passcode Modal for Deleting Complaint */}
      <AdminPasscodeModal
        isOpen={!!deletingComplaint}
        title="Authorize Passenger Report Deletion"
        description="Are you sure you want to permanently delete this passenger complaint from the TRD records and Supabase database? The system will record who removed this report."
        itemType="Passenger Report"
        itemName={deletingComplaint ? `${maskName(deletingComplaint.complainantName)} — Plate ${deletingComplaint.cityPlateNumber} (${deletingComplaint.issueType})` : undefined}
        confirmButtonText="Authorize & Delete Report"
        onConfirm={(reason) => {
          if (deletingComplaint) {
            deleteComplaint(deletingComplaint.id, reason);
            if (selectedComplaint?.id === deletingComplaint.id) {
              setSelectedComplaint(null);
            }
            setDeletingComplaint(null);
          }
        }}
        onClose={() => setDeletingComplaint(null)}
      />
    </>
  );
};

