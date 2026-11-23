import React, { useState, useMemo, useEffect } from 'react';
import { useFranchise } from '../context/FranchiseContext';
import type { FranchiseRecord } from '../types';
import {
  X,
  Bell,
  Mail,
  MessageSquare,
  Send,
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Smartphone,
  RefreshCw,
  Search,
  Check,
  Eye,
  History,
  Trash2,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getFranchiseExpiryInfo,
  getDriverContactNumber,
  getDriverGmail,
  filterExpiringDrivers,
  buildDriverSmsReminderText,
  buildDriverGmailSubject,
  sendDriverSmsReminder,
  sendDriverGmailReminder,
  sendDriverBothReminders,
  sendBatchExpiryReminders,
  getReminderLogs,
  getLastReminderForRecord,
  clearReminderLogs,
  type ExpiryFilterMode,
  type ReminderLogEntry,
  type BatchDispatchSummary
} from '../utils/expiryNotificationService';

interface ExpiryReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRecord?: FranchiseRecord | null;
}

export const ExpiryReminderModal: React.FC<ExpiryReminderModalProps> = ({
  isOpen,
  onClose,
  targetRecord
}) => {
  const { franchises, updateDriver } = useFranchise();

  // Filters & Search
  const [filterMode, setFilterMode] = useState<ExpiryFilterMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'drivers' | 'logs'>('drivers');

  // Preview Drawer
  const [previewDriver, setPreviewDriver] = useState<FranchiseRecord | null>(null);
  const [customNote, setCustomNote] = useState('');
  const [previewChannel, setPreviewChannel] = useState<'both' | 'sms' | 'email'>('both');

  // Inline Quick Contact Edit
  const [editingContactRecord, setEditingContactRecord] = useState<FranchiseRecord | null>(null);
  const [inputPhone, setInputPhone] = useState('');
  const [inputGmail, setInputGmail] = useState('');
  const [isSavingContact, setIsSavingContact] = useState(false);

  // Sending States
  const [sendingRecordId, setSendingRecordId] = useState<string | null>(null);
  const [sendingChannel, setSendingChannel] = useState<'sms' | 'email' | 'both' | null>(null);

  // Batch Sending States
  const [isBatchSending, setIsBatchSending] = useState(false);
  const [batchSendSms, setBatchSendSms] = useState(true);
  const [batchSendGmail, setBatchSendGmail] = useState(true);
  const [batchProgress, setBatchProgress] = useState<{
    current: number;
    total: number;
    currentDriverName?: string;
  } | null>(null);
  const [batchSummary, setBatchSummary] = useState<BatchDispatchSummary | null>(null);

  // Notification Banner
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    details?: string;
  } | null>(null);

  // Live Audit Logs
  const [logs, setLogs] = useState<ReminderLogEntry[]>([]);

  // Refresh logs on open or action
  const refreshLogs = () => {
    setLogs(getReminderLogs());
  };

  useEffect(() => {
    if (isOpen) {
      refreshLogs();
      if (targetRecord) {
        setPreviewDriver(targetRecord);
        setSearchQuery(targetRecord.cityPlateNumber || targetRecord.mtopNumber);
      }
    }
  }, [isOpen, targetRecord]);

  // Expiring and expired records pool
  const allExpiringDrivers = useMemo(() => {
    return filterExpiringDrivers(franchises, 'all');
  }, [franchises]);

  const urgent7Drivers = useMemo(() => {
    return filterExpiringDrivers(franchises, 'urgent7');
  }, [franchises]);

  const soon30Drivers = useMemo(() => {
    return filterExpiringDrivers(franchises, 'soon30');
  }, [franchises]);

  const expiredDrivers = useMemo(() => {
    return filterExpiringDrivers(franchises, 'expired');
  }, [franchises]);

  // Current filtered list based on tab & search query
  const displayedDrivers = useMemo(() => {
    const base = filterExpiringDrivers(franchises, filterMode);
    if (!searchQuery.trim()) return base;

    const q = searchQuery.toLowerCase().trim();
    return base.filter((item) => {
      const plate = (item.cityPlateNumber || item.mtopNumber || '').toLowerCase();
      const driver = (item.driverName || '').toLowerCase();
      const operator = (item.operatorName || item.ownerName || '').toLowerCase();
      const phone = getDriverContactNumber(item).toLowerCase();
      const gmail = getDriverGmail(item).toLowerCase();
      return (
        plate.includes(q) ||
        driver.includes(q) ||
        operator.includes(q) ||
        phone.includes(q) ||
        gmail.includes(q)
      );
    });
  }, [franchises, filterMode, searchQuery]);

  if (!isOpen) return null;

  // Handler: Open Inline Edit Contact
  const handleOpenEditContact = (rec: FranchiseRecord) => {
    setEditingContactRecord(rec);
    setInputPhone(getDriverContactNumber(rec));
    setInputGmail(getDriverGmail(rec));
  };

  // Handler: Save Contact Updates
  const handleSaveContact = async () => {
    if (!editingContactRecord) return;
    setIsSavingContact(true);
    try {
      const plate = editingContactRecord.cityPlateNumber || editingContactRecord.mtopNumber;
      await updateDriver(plate, {
        driverName: editingContactRecord.driverName,
        contact: inputPhone.trim(),
        operatorContact: inputPhone.trim(),
        email: inputGmail.trim().toLowerCase(),
        gmail: inputGmail.trim().toLowerCase(),
      });
      setFeedback({
        type: 'success',
        message: `Updated contact information for Unit ${plate} (${editingContactRecord.driverName})`,
      });
      setEditingContactRecord(null);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Failed to update contact: ${err?.message || 'Error occurred'}`,
      });
    } finally {
      setIsSavingContact(false);
    }
  };

  // Handler: Single Driver Reminder Dispatch
  const handleSendSingleReminder = async (
    rec: FranchiseRecord,
    channel: 'sms' | 'email' | 'both'
  ) => {
    setSendingRecordId(rec.id);
    setSendingChannel(channel);
    setFeedback(null);

    const plate = rec.cityPlateNumber || rec.mtopNumber;
    const driverName = rec.driverName || 'Driver';

    try {
      if (channel === 'sms') {
        const result = await sendDriverSmsReminder(rec, {
          customMessage: customNote || undefined,
        });
        if (result.success) {
          setFeedback({
            type: 'success',
            message: `SMS reminder dispatched to ${driverName} (${result.recipient})`,
            details: result.simulated
              ? 'Simulated SMS dispatch recorded. Message logged to console and device SMS link ready.'
              : 'Direct SMS delivery submitted via gateway.',
          });
          confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
        } else {
          setFeedback({
            type: 'error',
            message: `Could not send SMS: ${result.error}`,
          });
        }
      } else if (channel === 'email') {
        const result = await sendDriverGmailReminder(rec, {
          customNote: customNote || undefined,
        });
        if (result.success) {
          setFeedback({
            type: 'success',
            message: `Gmail reminder dispatched to ${driverName} (${result.recipient})`,
            details: result.delivered
              ? 'Official email delivered via lorenbacelonia@gmail.com.'
              : 'Dispatched through system cloud notification gateway.',
          });
          confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
        } else {
          setFeedback({
            type: 'error',
            message: `Could not send Gmail: ${result.error}`,
          });
        }
      } else {
        const { sms, email, overallSuccess } = await sendDriverBothReminders(rec, {
          customNote: customNote || undefined,
        });
        if (overallSuccess) {
          setFeedback({
            type: 'success',
            message: `Dispatched SMS & Gmail reminder to ${driverName} for Unit ${plate}!`,
            details: `SMS: ${sms.success ? 'Delivered' : sms.error} • Gmail: ${email.success ? 'Delivered' : email.error}`,
          });
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        } else {
          setFeedback({
            type: 'error',
            message: `Failed to dispatch reminder to ${driverName}. Missing both valid phone and Gmail.`,
          });
        }
      }
      refreshLogs();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Dispatch failed: ${err?.message || 'Network error'}`,
      });
    } finally {
      setSendingRecordId(null);
      setSendingChannel(null);
    }
  };

  // Handler: Batch Send Reminders to All Target Drivers
  const handleStartBatchSending = async () => {
    if (!batchSendSms && !batchSendGmail) {
      setFeedback({
        type: 'error',
        message: 'Please select at least one dispatch channel (SMS or Gmail).',
      });
      return;
    }

    if (displayedDrivers.length === 0) {
      setFeedback({
        type: 'info',
        message: 'No drivers found under current filter to dispatch reminders to.',
      });
      return;
    }

    setIsBatchSending(true);
    setBatchSummary(null);
    setFeedback(null);

    try {
      const summary = await sendBatchExpiryReminders(displayedDrivers, {
        sendSms: batchSendSms,
        sendGmail: batchSendGmail,
        customNote: customNote || undefined,
        onProgress: (progress) => {
          setBatchProgress({
            current: progress.current,
            total: progress.total,
            currentDriverName: progress.currentItem.driverName || 'Driver',
          });
        },
      });

      setBatchSummary(summary);
      refreshLogs();

      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.5 },
      });

      setFeedback({
        type: 'success',
        message: `Batch complete! Targeted ${summary.totalTargeted} drivers: ${summary.smsSucceeded} SMS delivered, ${summary.emailSucceeded} Gmail delivered.`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Batch dispatch encountered an issue: ${err?.message || 'Error occurred'}`,
      });
    } finally {
      setIsBatchSending(false);
      setBatchProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 px-6 py-5 text-white flex items-center justify-between flex-wrap gap-3 shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <Bell className="w-6 h-6 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h2 className="text-lg font-black tracking-tight">
                  Driver Franchise Expiration Reminder Center
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  SMS &amp; Gmail Dispatch
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Automatically notifies drivers when franchise permits are expiring soon or overdue via registered phone number and Gmail
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={refreshLogs}
              title="Refresh status"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('drivers');
              setFilterMode('all');
            }}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              filterMode === 'all' && activeTab === 'drivers'
                ? 'bg-white border-indigo-600 shadow-sm ring-2 ring-indigo-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Needing Reminder
              </span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {allExpiringDrivers.length}
            </p>
            <span className="text-[10px] text-slate-400 font-medium">
              ≤ 30 days &amp; expired
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('drivers');
              setFilterMode('urgent7');
            }}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              filterMode === 'urgent7' && activeTab === 'drivers'
                ? 'bg-white border-amber-600 shadow-sm ring-2 ring-amber-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">
                Critical (≤ 7 Days)
              </span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-amber-700 mt-1">
              {urgent7Drivers.length}
            </p>
            <span className="text-[10px] text-amber-600 font-medium">
              Urgent renewal action
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('drivers');
              setFilterMode('soon30');
            }}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              filterMode === 'soon30' && activeTab === 'drivers'
                ? 'bg-white border-blue-600 shadow-sm ring-2 ring-blue-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wide">
                Expiring Soon
              </span>
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-blue-700 mt-1">
              {soon30Drivers.length}
            </p>
            <span className="text-[10px] text-blue-600 font-medium">
              Within 30 days
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('drivers');
              setFilterMode('expired');
            }}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              filterMode === 'expired' && activeTab === 'drivers'
                ? 'bg-white border-rose-600 shadow-sm ring-2 ring-rose-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wide">
                Already Expired
              </span>
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-black text-rose-700 mt-1">
              {expiredDrivers.length}
            </p>
            <span className="text-[10px] text-rose-600 font-medium">
              Deactivated / Inactive
            </span>
          </button>
        </div>

        {/* Feedback Alert Banner */}
        {feedback && (
          <div
            className={`mx-5 mt-3.5 p-3.5 rounded-2xl border text-xs font-medium flex items-start justify-between gap-3 shadow-xs animate-fadeIn ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : feedback.type === 'error'
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : 'bg-blue-50 border-blue-300 text-blue-900'
            }`}
          >
            <div className="flex items-start space-x-2.5">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : feedback.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <Bell className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold">{feedback.message}</p>
                {feedback.details && (
                  <p className="text-[11px] opacity-80 mt-0.5">{feedback.details}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Batch Dispatch Summary Card */}
        {batchSummary && (
          <div className="mx-5 mt-3.5 p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 flex items-center justify-between gap-3 shadow-xs animate-fadeIn">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <p className="font-bold">
                  Batch Dispatch Summary: {batchSummary.totalTargeted} drivers processed
                </p>
                <p className="text-[11px] text-indigo-800 mt-0.5">
                  SMS: {batchSummary.smsSucceeded} succeeded ({batchSummary.smsFailed} failed) • Gmail: {batchSummary.emailSucceeded} delivered ({batchSummary.emailFailed} failed)
                  {batchSummary.skippedNoContact > 0 && ` • ${batchSummary.skippedNoContact} lacked contact details`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setBatchSummary(null)}
              className="text-indigo-400 hover:text-indigo-700 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Action & Filter Bar */}
        <div className="px-5 py-3 border-b border-slate-200 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          {/* Left: Tab Switcher & Search */}
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setActiveTab('drivers')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'drivers'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                Drivers List ({displayedDrivers.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('logs')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'logs'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Audit Logs ({logs.length})</span>
              </button>
            </div>

            {activeTab === 'drivers' && (
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search driver, plate, phone, gmail..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            )}
          </div>

          {/* Right: Batch Reminder Trigger */}
          {activeTab === 'drivers' && (
            <div className="flex items-center space-x-2.5 flex-wrap">
              <div className="flex items-center space-x-3 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={batchSendSms}
                    onChange={(e) => setBatchSendSms(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>SMS</span>
                </label>
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={batchSendGmail}
                    onChange={(e) => setBatchSendGmail(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Gmail</span>
                </label>
              </div>

              <button
                type="button"
                disabled={isBatchSending || displayedDrivers.length === 0}
                onClick={handleStartBatchSending}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-extrabold shadow-sm transition-all disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {isBatchSending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending ({batchProgress?.current}/{batchProgress?.total})...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Notify All ({displayedDrivers.length}) Drivers</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Live Batch Progress Indicator */}
        {isBatchSending && batchProgress && (
          <div className="bg-indigo-50 border-b border-indigo-200 px-5 py-2.5 flex items-center justify-between text-xs text-indigo-900 shrink-0">
            <div className="flex items-center space-x-2.5">
              <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
              <span>
                Dispatching reminder <strong>{batchProgress.current}</strong> of <strong>{batchProgress.total}</strong>: to <strong>{batchProgress.currentDriverName}</strong>...
              </span>
            </div>
            <div className="w-36 bg-indigo-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-full transition-all duration-200"
                style={{
                  width: `${Math.round((batchProgress.current / batchProgress.total) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Main Content Area (Split: Drivers Table / Logs Tab + Side Preview Drawer) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Main List Column */}
          <div className="flex-1 overflow-y-auto p-5">
            {activeTab === 'drivers' ? (
              displayedDrivers.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
                  <h4 className="text-base font-bold text-slate-700">All Driver Franchises in Good Standing</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    No registered franchise units are currently expired or expiring within the selected timeframe.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedDrivers.map((rec) => {
                    const info = getFranchiseExpiryInfo(rec);
                    const phone = getDriverContactNumber(rec);
                    const gmail = getDriverGmail(rec);
                    const lastLog = getLastReminderForRecord(rec.cityPlateNumber || rec.mtopNumber);
                    const isSelectedForPreview = previewDriver?.id === rec.id;
                    const isSendingThis = sendingRecordId === rec.id;

                    return (
                      <div
                        key={rec.id}
                        className={`rounded-2xl border p-4 transition-all ${
                          isSelectedForPreview
                            ? 'bg-indigo-50/50 border-indigo-500 ring-2 ring-indigo-500/20'
                            : info.isExpired
                            ? 'bg-rose-50/30 border-rose-200 hover:border-rose-300'
                            : info.isUrgent
                            ? 'bg-amber-50/30 border-amber-200 hover:border-amber-300'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                          
                          {/* Driver & Unit Details */}
                          <div className="flex items-start space-x-3.5 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0 ${
                                rec.vehicleCategory === 'Pedicab'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              }`}
                            >
                              {rec.vehicleCategory === 'Pedicab' ? '🚲' : '🛺'}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                <span className="font-mono font-black text-sm text-slate-900">
                                  {rec.cityPlateNumber || rec.mtopNumber}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${info.badgeClass}`}
                                >
                                  {info.statusLabel}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  Expires: <strong className="text-slate-700">{info.expirationDate}</strong>
                                </span>
                              </div>

                              <div className="mt-1 flex items-center space-x-3 text-xs text-slate-600 flex-wrap gap-y-1">
                                <div>
                                  <span className="font-semibold text-slate-900">
                                    Driver: {rec.driverName}
                                  </span>
                                  {rec.operatorName && rec.operatorName !== rec.driverName && (
                                    <span className="text-slate-400 text-[11px] ml-1.5">
                                      (Op: {rec.operatorName})
                                    </span>
                                  )}
                                </div>
                                <span className="text-slate-300 hidden sm:inline">•</span>
                                <div className="text-[11px] text-slate-500">
                                  Route: {rec.routeParada || 'Standard'}
                                </div>
                              </div>

                              {/* Registered Contact & Gmail Badges */}
                              <div className="mt-2 flex items-center space-x-2 flex-wrap gap-y-1.5 text-xs">
                                {/* Mobile Phone Badge */}
                                {phone ? (
                                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[11px]">
                                    <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>{phone}</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                                    <AlertCircle className="w-3 h-3 text-rose-600" />
                                    <span>No Phone Registered</span>
                                  </span>
                                )}

                                {/* Gmail Badge */}
                                {gmail ? (
                                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[11px]">
                                    <Mail className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>{gmail}</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                                    <AlertCircle className="w-3 h-3 text-amber-600" />
                                    <span>No Gmail Registered</span>
                                  </span>
                                )}

                                {/* Quick Edit Contact Button */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditContact(rec)}
                                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer ml-1"
                                >
                                  Edit Contact
                                </button>

                                {/* Last Reminder Status */}
                                {lastLog && (
                                  <span className="text-[10px] text-slate-400 italic">
                                    • Last reminded:{' '}
                                    {new Date(lastLog.timestamp).toLocaleDateString([], {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-1.5 self-end lg:self-center shrink-0 flex-wrap">
                            {/* Preview Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewDriver(rec);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1"
                              title="Preview SMS & Gmail message"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span className="hidden sm:inline">Preview</span>
                            </button>

                            {/* Send SMS Button */}
                            <button
                              type="button"
                              disabled={!phone || (isSendingThis && sendingChannel === 'sms')}
                              onClick={() => handleSendSingleReminder(rec, 'sms')}
                              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center space-x-1.5 active:scale-95"
                              title={phone ? `Send SMS to ${phone}` : 'No phone number available'}
                            >
                              {isSendingThis && sendingChannel === 'sms' ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                              )}
                              <span>SMS</span>
                            </button>

                            {/* Send Gmail Button */}
                            <button
                              type="button"
                              disabled={!gmail || (isSendingThis && sendingChannel === 'email')}
                              onClick={() => handleSendSingleReminder(rec, 'email')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center space-x-1.5 active:scale-95"
                              title={gmail ? `Send Gmail to ${gmail}` : 'No Gmail available'}
                            >
                              {isSendingThis && sendingChannel === 'email' ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Mail className="w-3.5 h-3.5 text-emerald-600" />
                              )}
                              <span>Gmail</span>
                            </button>

                            {/* Send Both Button */}
                            <button
                              type="button"
                              disabled={(!phone && !gmail) || (isSendingThis && sendingChannel === 'both')}
                              onClick={() => handleSendSingleReminder(rec, 'both')}
                              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm transition-all disabled:opacity-40 cursor-pointer flex items-center space-x-1.5 active:scale-95"
                              title="Send both SMS and Gmail simultaneously"
                            >
                              {isSendingThis && sendingChannel === 'both' ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5 text-amber-400" />
                              )}
                              <span>Send Both</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              /* Audit Logs View */
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Reminder Dispatch Audit Trail
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Historical record of all SMS &amp; Gmail reminders sent to drivers
                    </p>
                  </div>
                  {logs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        clearReminderLogs();
                        refreshLogs();
                      }}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Logs</span>
                    </button>
                  )}
                </div>

                {logs.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-medium">No reminder history logged yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 bg-white border border-slate-200 rounded-xl flex items-start justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className="font-mono font-bold text-slate-900">
                              {log.cityPlateNumber}
                            </span>
                            <span className="font-semibold text-slate-700">
                              {log.driverName}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold uppercase">
                              {log.channels}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                            Phone: {log.contactNumber} • Gmail: {log.gmail}
                          </p>
                          <p className="text-[11px] text-slate-600 mt-1">{log.summary}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Live Message Preview & Customization Drawer */}
          {previewDriver && (
            <div className="w-full sm:w-96 border-l border-slate-200 bg-slate-50 flex flex-col shrink-0 overflow-y-auto">
              <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    Dispatch Preview: Unit {previewDriver.cityPlateNumber || previewDriver.mtopNumber}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Driver: {previewDriver.driverName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewDriver(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Preview Channel Tabs */}
              <div className="p-3 border-b border-slate-200 bg-slate-100/80 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setPreviewChannel('sms')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                    previewChannel === 'sms'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>SMS View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewChannel('email')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                    previewChannel === 'email'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Gmail View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewChannel('both')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                    previewChannel === 'both'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Both</span>
                </button>
              </div>

              {/* Preview Content Body */}
              <div className="p-4 space-y-4 flex-1">
                {/* Optional Custom Note Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Custom Admin Advisory / Notice (Optional):
                  </label>
                  <textarea
                    rows={2}
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="e.g. Please bring your 2026 Barangay clearance before Friday."
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                {/* SMS Text Preview */}
                {(previewChannel === 'sms' || previewChannel === 'both') && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-indigo-900 flex items-center space-x-1">
                        <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                        <span>SMS Text to {getDriverContactNumber(previewDriver) || '(No Phone)'}</span>
                      </span>
                    </div>
                    <div className="p-3 bg-white border border-indigo-200 rounded-2xl text-[11px] font-mono text-slate-800 whitespace-pre-wrap leading-relaxed shadow-xs">
                      {buildDriverSmsReminderText(previewDriver)}
                      {customNote && `\n\nAdvisory: ${customNote}`}
                    </div>
                  </div>
                )}

                {/* Gmail Subject & HTML Preview */}
                {(previewChannel === 'email' || previewChannel === 'both') && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-emerald-900 flex items-center space-x-1">
                        <Mail className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Gmail to {getDriverGmail(previewDriver) || '(No Gmail)'}</span>
                      </span>
                    </div>
                    <div className="p-2.5 bg-white border border-emerald-200 rounded-xl text-xs space-y-2 shadow-xs">
                      <p className="text-[11px] font-bold text-slate-900 border-b border-slate-100 pb-1.5">
                        Subject:{' '}
                        <span className="text-emerald-700 font-normal">
                          {buildDriverGmailSubject(previewDriver)}
                        </span>
                      </p>
                      <div className="text-[11px] text-slate-600 line-clamp-6 leading-relaxed">
                        Magandang araw {previewDriver.driverName}, ito ay opisyal na paalala mula sa Tabaco City TRD ukol sa inyong {previewDriver.vehicleCategory} franchise permit (Unit {previewDriver.cityPlateNumber || previewDriver.mtopNumber}). Valid until {previewDriver.expirationDate}. Mangyaring magsadya sa Tabaco City Hall TRD Office...
                      </div>
                    </div>
                  </div>
                )}

                {/* Dispatch Now Button from Drawer */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={
                      sendingRecordId === previewDriver.id ||
                      (!getDriverContactNumber(previewDriver) && !getDriverGmail(previewDriver))
                    }
                    onClick={() => handleSendSingleReminder(previewDriver, previewChannel)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white text-xs font-black shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {sendingRecordId === previewDriver.id ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Dispatching...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Dispatch Reminder to {previewDriver.driverName}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Inline Edit Contact Dialog Modal */}
        {editingContactRecord && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Update Contact Info — Unit {editingContactRecord.cityPlateNumber || editingContactRecord.mtopNumber}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Driver: {editingContactRecord.driverName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingContactRecord(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Phone Number (for SMS):
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={inputPhone}
                      onChange={(e) => setInputPhone(e.target.value)}
                      placeholder="e.g. 09171234567"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Gmail Address (for Official Email Notice):
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={inputGmail}
                      onChange={(e) => setInputGmail(e.target.value)}
                      placeholder="e.g. driver@gmail.com"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingContactRecord(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSavingContact}
                  onClick={handleSaveContact}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingContact ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Save Contact Details</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
