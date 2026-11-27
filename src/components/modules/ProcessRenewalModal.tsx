import React, { useState, useMemo, useEffect } from 'react';
import { useFranchise } from '../../context/FranchiseContext';
import type { FranchiseRecord } from '../../types';
import {
  X,
  RefreshCw,
  CheckCircle2,
  Calendar,
  Search,
  AlertCircle,
  FileText,
  Receipt,
  Bell,
  Send,
  Mail,
  Phone,
  History,
  RotateCcw,
  Plus,
  Check,
} from 'lucide-react';
import { isRecordExpired } from '../../utils/fareUtils';
import { DateBadge } from '../DateBadge';
import {
  filterExpiringDrivers,
  getFranchiseExpiryInfo,
  getDriverContactNumber,
  getDriverGmail,
  getOperatorContactNumber,
  getOperatorGmail,
  buildDriverSmsReminderText,
  sendFranchiseBothReminders,
  sendRenewalConfirmationNotice,
  sendBatchExpiryReminders,
  getReminderLogs,
  getLastReminderForRecord,
  clearReminderLogs,
  type ReminderLogEntry,
  type BatchDispatchSummary,
  type ExpiryFilterMode,
} from '../../utils/expiryNotificationService';

function computeDefaultNextExpiry(currentExpiry?: string): string {
  const today = new Date();
  const nextYear = today.getFullYear() + 1;
  if (currentExpiry && /^\d{4}-\d{2}-\d{2}$/.test(currentExpiry)) {
    const currentExpYear = parseInt(currentExpiry.substring(0, 4), 10);
    const monthDay = currentExpiry.substring(5);
    const targetYear = Math.max(nextYear, (isNaN(currentExpYear) ? today.getFullYear() : currentExpYear) + 1);
    let candidate = `${targetYear}-${monthDay}`;
    if (isRecordExpired(candidate)) {
      candidate = `${today.getFullYear() + 1}-${monthDay}`;
      if (isRecordExpired(candidate)) {
        candidate = `${today.getFullYear() + 2}-${monthDay}`;
      }
    }
    return candidate;
  }
  return `${nextYear}-01-15`;
}

function generateNewApplicationNo(): string {
  const year = new Date().getFullYear();
  return `APP-${year}-${Math.floor(100 + Math.random() * 900)}`;
}

export const ProcessRenewalModal: React.FC = () => {
  const { activeModule, franchises, renewFranchise, updateDriver } = useFranchise();

  // Search & Filtering
  const [filterText, setFilterText] = useState('');

  // Renewal Form State
  const [selectedForRenewal, setSelectedForRenewal] = useState<FranchiseRecord | null>(null);
  const [renewalExpiryDate, setRenewalExpiryDate] = useState('');
  const [renewalApplicationNo, setRenewalApplicationNo] = useState('');
  const [renewalOrNumber, setRenewalOrNumber] = useState('');
  const [renewalPaymentDate, setRenewalPaymentDate] = useState('');
  const [renewalAmountPaid, setRenewalAmountPaid] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Floating Completion Card State
  const [completedRenewalSummary, setCompletedRenewalSummary] = useState<{
    mtopNumber: string;
    cityPlateNumber?: string;
    vehicleCategory?: string;
    operatorName: string;
    driverName: string;
    previousExpiry: string;
    newExpiry: string;
    applicationNo: string;
    orNumber: string;
    amountPaid: string;
    paymentDate: string;
    processedAt: string;
  } | null>(null);

  // Inline Single Reminder State (No separate portal) - Dedicated to Operator & Driver
  const [selectedForReminder, setSelectedForReminder] = useState<FranchiseRecord | null>(null);
  const [reminderOperatorPhone, setReminderOperatorPhone] = useState('');
  const [reminderOperatorGmail, setReminderOperatorGmail] = useState('');
  const [isAddingOperatorEmail, setIsAddingOperatorEmail] = useState(false);
  const [isSavingEmailDirectly, setIsSavingEmailDirectly] = useState(false);
  const [reminderDriverPhone, setReminderDriverPhone] = useState('');
  const [reminderDriverGmail, setReminderDriverGmail] = useState('');
  const [isAddingDriverEmail, setIsAddingDriverEmail] = useState(false);
  const [isSavingDriverEmailDirectly, setIsSavingDriverEmailDirectly] = useState(false);
  const [customNote, setCustomNote] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [reminderFeedback, setReminderFeedback] = useState<string | null>(null);

  // Floating Completion Card Renewal Confirmation State
  const [isSendingRenewalConfirmation, setIsSendingRenewalConfirmation] = useState(false);
  const [renewalConfirmationFeedback, setRenewalConfirmationFeedback] = useState<string | null>(null);

  // Inline Batch Reminder Dispatcher State (Inside the page)
  const [showReminderCenter, setShowReminderCenter] = useState(false);
  const [reminderFilter, setReminderFilter] = useState<ExpiryFilterMode>('all');
  const [batchSendSms, setBatchSendSms] = useState(true);
  const [batchSendGmail, setBatchSendGmail] = useState(true);
  const [isBatchSending, setIsBatchSending] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; name?: string } | null>(null);
  const [batchSummary, setBatchSummary] = useState<BatchDispatchSummary | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [reminderLogs, setReminderLogs] = useState<ReminderLogEntry[]>([]);

  useEffect(() => {
    setReminderLogs(getReminderLogs());
  }, []);

  const expiringDrivers = useMemo(() => {
    return filterExpiringDrivers(franchises, 'all');
  }, [franchises]);

  const targetedDrivers = useMemo(() => {
    return filterExpiringDrivers(franchises, reminderFilter);
  }, [franchises, reminderFilter]);

  if (activeModule !== 'renewal') return null;

  const categoryFranchises = franchises
    .filter(f =>
      !filterText ||
      f.mtopNumber.toLowerCase().includes(filterText.toLowerCase()) ||
      (f.vehicleCategory || '').toLowerCase().includes(filterText.toLowerCase()) ||
      (f.applicationNo || '').toLowerCase().includes(filterText.toLowerCase()) ||
      f.operatorName.toLowerCase().includes(filterText.toLowerCase()) ||
      f.driverName.toLowerCase().includes(filterText.toLowerCase()) ||
      f.status.toLowerCase().includes(filterText.toLowerCase())
    )
    .sort((a, b) => {
      const aExp = a.status === 'Expired' || isRecordExpired(a.expirationDate);
      const bExp = b.status === 'Expired' || isRecordExpired(b.expirationDate);
      if (aExp && !bExp) return -1;
      if (bExp && !aExp) return 1;
      return 0;
    });

  // Open Renewal Form
  const handleOpenRenewalDialog = (item: FranchiseRecord) => {
    setSelectedForReminder(null); // dismiss reminder if open
    setSelectedForRenewal(item);
    setRenewalExpiryDate(computeDefaultNextExpiry(item.expirationDate));
    setRenewalApplicationNo(item.applicationNo || generateNewApplicationNo());
    setRenewalOrNumber(item.orNumber || item.receiptNumber || `OR-2026-${Math.floor(10000 + Math.random() * 90000)}`);
    setRenewalPaymentDate(new Date().toISOString().split('T')[0]);
    setRenewalAmountPaid(item.vehicleCategory === 'Pedicab' ? '250.00' : '450.00');
  };

  // Confirm Renewal
  const handleConfirmRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForRenewal || !renewalExpiryDate || !renewalApplicationNo.trim()) return;

    const prevExp = selectedForRenewal.expirationDate || 'N/A';
    const mtop = selectedForRenewal.mtopNumber;
    const plate = selectedForRenewal.cityPlateNumber || selectedForRenewal.mtopNumber;
    const cat = selectedForRenewal.vehicleCategory || 'Tricycle';
    const op = selectedForRenewal.operatorName || selectedForRenewal.ownerName || '—';
    const dr = selectedForRenewal.driverName || '—';
    const appNo = renewalApplicationNo.trim().toUpperCase();
    const orNo = renewalOrNumber.trim().toUpperCase();
    const amt = parseFloat(renewalAmountPaid || '0').toFixed(2);
    const payDate = renewalPaymentDate || new Date().toISOString().split('T')[0];

    await renewFranchise(selectedForRenewal.id, {
      newExpiry: renewalExpiryDate,
      applicationNo: appNo,
      orNumber: orNo,
      amountPaid: renewalAmountPaid ? parseFloat(renewalAmountPaid) : undefined,
    });

    setCompletedRenewalSummary({
      mtopNumber: mtop,
      cityPlateNumber: plate,
      vehicleCategory: cat,
      operatorName: op,
      driverName: dr,
      previousExpiry: prevExp,
      newExpiry: renewalExpiryDate,
      applicationNo: appNo,
      orNumber: orNo,
      amountPaid: amt,
      paymentDate: payDate,
      processedAt: new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    });

    setNotification(
      `Renewed unit ${mtop} (${dr}) • OR No: ${orNo} • Paid: ₱${amt} • Next Expiry: ${renewalExpiryDate}`
    );
    setSelectedForRenewal(null);
  };

  // Open Inline Single Reminder (Inside page, NOT a portal) - Dedicated to Operator & Driver
  const handleOpenReminder = (item: FranchiseRecord) => {
    setSelectedForRenewal(null); // dismiss renewal form to focus on reminder
    setSelectedForReminder(item);
    const opPhone = getOperatorContactNumber(item);
    const opGmail = getOperatorGmail(item);
    const drvPhone = getDriverContactNumber(item);
    const drvGmail = getDriverGmail(item);

    setReminderOperatorPhone(opPhone);
    setReminderOperatorGmail(opGmail);
    setReminderDriverPhone(drvPhone);
    setReminderDriverGmail(drvGmail);
    setIsAddingOperatorEmail(!opGmail);
    setIsAddingDriverEmail(!drvGmail);
    const defaultNotice = buildDriverSmsReminderText(item, getFranchiseExpiryInfo(item), 'both');
    setCustomNote(defaultNotice);
    setReminderFeedback(null);
  };

  // Quick save driver email directly to the record
  const handleSaveDriverEmail = async () => {
    if (!selectedForReminder) return;
    const emailClean = reminderDriverGmail.trim().toLowerCase();
    if (!emailClean || !emailClean.includes('@')) {
      setReminderFeedback('Please enter a valid driver email address (e.g. driver@gmail.com).');
      return;
    }
    setIsSavingDriverEmailDirectly(true);
    try {
      const plate = selectedForReminder.cityPlateNumber || selectedForReminder.mtopNumber;
      await updateDriver(plate, {
        driverName: selectedForReminder.driverName,
        contact: reminderDriverPhone.trim(),
        gmail: emailClean,
        email: emailClean,
      });
      setReminderFeedback(`Driver email saved successfully: ${emailClean}`);
      setNotification(`Saved driver email for Unit ${plate} (${emailClean})`);
      setTimeout(() => setNotification(null), 5000);
      setIsAddingDriverEmail(false);
    } catch (err: any) {
      setReminderFeedback(`Failed to save driver email: ${err?.message || 'Error occurred'}`);
    } finally {
      setIsSavingDriverEmailDirectly(false);
    }
  };

  // Quick save operator email directly to the record
  const handleSaveOperatorEmail = async () => {
    if (!selectedForReminder) return;
    const emailClean = reminderOperatorGmail.trim().toLowerCase();
    if (!emailClean || !emailClean.includes('@')) {
      setReminderFeedback('Please enter a valid operator email address (e.g. operator@gmail.com).');
      return;
    }
    setIsSavingEmailDirectly(true);
    try {
      const plate = selectedForReminder.cityPlateNumber || selectedForReminder.mtopNumber;
      await updateDriver(plate, {
        driverName: selectedForReminder.driverName,
        operatorContact: reminderOperatorPhone.trim(),
        gmail: emailClean,
        email: emailClean,
      });
      setReminderFeedback(`Operator email saved successfully: ${emailClean}`);
      setNotification(`Saved operator email for Unit ${plate} (${emailClean})`);
      setTimeout(() => setNotification(null), 5000);
      setIsAddingOperatorEmail(false);
    } catch (err: any) {
      setReminderFeedback(`Failed to save email: ${err?.message || 'Error occurred'}`);
    } finally {
      setIsSavingEmailDirectly(false);
    }
  };

  // Dispatch Single Reminder to both Operator & Driver
  const handleSendSingleReminder = async () => {
    if (!selectedForReminder) return;
    setIsDispatching(true);
    setReminderFeedback(null);

    try {
      const plate = selectedForReminder.cityPlateNumber || selectedForReminder.mtopNumber;
      const opPhone = reminderOperatorPhone.trim();
      const opEmail = reminderOperatorGmail.trim();
      const drvPhone = reminderDriverPhone.trim();
      const drvEmail = reminderDriverGmail.trim();

      // If user corrected phone or email, persist inline to record
      await updateDriver(plate, {
        driverName: selectedForReminder.driverName,
        contact: drvPhone || opPhone,
        operatorContact: opPhone,
        gmail: opEmail || drvEmail,
        email: opEmail || drvEmail,
      });

      const res = await sendFranchiseBothReminders(selectedForReminder, {
        operatorPhone: opPhone,
        operatorEmail: opEmail,
        driverPhone: drvPhone,
        driverEmail: drvEmail,
        targetRecipient: 'both',
        channel: 'both',
        customNote,
      });

      setReminderFeedback(res.summaryText);
      setNotification(res.summaryText);
      setTimeout(() => setNotification(null), 6000);
      setReminderLogs(getReminderLogs());
    } catch (err: any) {
      setReminderFeedback(`Dispatch failed: ${err?.message || 'Error occurred'}`);
    } finally {
      setIsDispatching(false);
    }
  };

  // Dispatch Renewal Confirmation Notice (SMS & Email) to Operator & Driver
  const handleSendRenewalConfirmationNotice = async () => {
    if (!completedRenewalSummary) return;
    setIsSendingRenewalConfirmation(true);
    setRenewalConfirmationFeedback(null);

    try {
      const matchingRecord = franchises.find((f) => f.mtopNumber === completedRenewalSummary.mtopNumber);
      const drvPhone = matchingRecord ? getDriverContactNumber(matchingRecord) : '';
      const drvEmail = matchingRecord ? getDriverGmail(matchingRecord) : '';
      const opPhone = matchingRecord ? getOperatorContactNumber(matchingRecord) : '';
      const opEmail = matchingRecord ? getOperatorGmail(matchingRecord) : '';

      const result = await sendRenewalConfirmationNotice(completedRenewalSummary, {
        driverPhone: drvPhone,
        driverEmail: drvEmail,
        operatorPhone: opPhone,
        operatorEmail: opEmail,
      });

      const msg = result.message || `Renewal Confirmation dispatched! (SMS: ${result.smsCount} sent, Email: ${result.emailCount} sent)`;
      setRenewalConfirmationFeedback(msg);
      setNotification(msg);
      setTimeout(() => setNotification(null), 6000);
      setReminderLogs(getReminderLogs());
    } catch (err: any) {
      setRenewalConfirmationFeedback(`Confirmation dispatch failed: ${err?.message || 'Error occurred'}`);
    } finally {
      setIsSendingRenewalConfirmation(false);
    }
  };

  // Batch Send Reminders (Inside page)
  const handleBatchSend = async () => {
    if (targetedDrivers.length === 0) return;
    setIsBatchSending(true);
    setBatchSummary(null);

    try {
      const summary = await sendBatchExpiryReminders(targetedDrivers, {
        sendSms: batchSendSms,
        sendGmail: batchSendGmail,
        onProgress: (p) => {
          setBatchProgress({ current: p.current, total: p.total, name: p.currentItem.driverName });
        },
      });

      setBatchSummary(summary);
      setReminderLogs(getReminderLogs());
      setNotification(
        `Batch Reminders Dispatched! Targeted ${summary.totalTargeted} drivers: ${summary.smsSucceeded} SMS delivered, ${summary.emailSucceeded} Gmail delivered.`
      );
      setTimeout(() => setNotification(null), 6000);
    } catch (err: any) {
      setNotification(`Batch dispatch encountered an issue: ${err?.message || 'Error occurred'}`);
    } finally {
      setIsBatchSending(false);
      setBatchProgress(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {notification && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold px-4 py-3 rounded-2xl flex items-center space-x-2 shadow-sm animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* INLINE OPERATOR EXPIRATION REMINDER CARD (Rendered inside the page — NO PORTAL) */}
      {selectedForReminder && (
        <div className="bg-white rounded-3xl shadow-md border-2 border-amber-400 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-xs">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2 flex-wrap">
                  <h4 className="text-sm font-bold text-white">
                    Send Franchise Expiration Notice to Operator &amp; Driver (SMS &amp; Email)
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-400 text-slate-950">
                    Unit {selectedForReminder.cityPlateNumber || selectedForReminder.mtopNumber}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Franchise Holder: <strong>{selectedForReminder.operatorName}</strong> • Driver: {selectedForReminder.driverName} • Expiration: {selectedForReminder.expirationDate}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedForReminder(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Reminder Panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Feedback notification inside panel */}
            {reminderFeedback && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{reminderFeedback}</span>
              </div>
            )}

            {/* Contact Information & Delivery Destination (Operator & Driver) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Operator Card */}
              <div className="p-4 rounded-2xl border-2 border-amber-400 bg-amber-50/40 shadow-2xs space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                  <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <span>👤 Operator:</span>
                    <strong className="text-amber-950">{selectedForReminder.operatorName}</strong>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black uppercase shadow-2xs">
                    Franchise Holder
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Operator Mobile Number */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      <span className="inline-flex items-center space-x-1.5">
                        <Phone className="w-3.5 h-3.5 text-amber-600" />
                        <span>Operator Mobile (SMS / Messenger)</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={reminderOperatorPhone}
                      onChange={(e) => setReminderOperatorPhone(e.target.value)}
                      placeholder="09171234567 or +639171234567"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Delivered directly via TextBee Android SMS Gateway.
                    </p>
                  </div>

                  {/* Operator Gmail / Email with + Add Email Button */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 inline-flex items-center space-x-1.5">
                        <Mail className="w-3.5 h-3.5 text-amber-600" />
                        <span>Operator Email / Gmail</span>
                      </label>
                      {reminderOperatorGmail && (
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded-md border border-emerald-300">
                            ✓ On File
                          </span>
                          {!isAddingOperatorEmail && (
                            <button
                              type="button"
                              onClick={() => setIsAddingOperatorEmail(true)}
                              className="text-[10px] text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {!reminderOperatorGmail && !isAddingOperatorEmail ? (
                      /* If operator DOES NOT have an email, show dedicated + Add Email button */
                      <div className="p-3 bg-white border border-amber-300 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
                        <div className="flex items-center space-x-2 min-w-0">
                          <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="text-xs text-slate-600 italic truncate">
                            No email registered for Operator
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsAddingOperatorEmail(true)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-xs transition-all flex items-center space-x-1 shrink-0 cursor-pointer active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add Email</span>
                        </button>
                      </div>
                    ) : (
                      /* Email Input Field with Save Action */
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-2">
                          <input
                            type="email"
                            value={reminderOperatorGmail}
                            onChange={(e) => setReminderOperatorGmail(e.target.value)}
                            placeholder="e.g. operator@gmail.com"
                            className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            autoFocus={isAddingOperatorEmail && !reminderOperatorGmail}
                          />
                          <button
                            type="button"
                            disabled={isSavingEmailDirectly || !reminderOperatorGmail.trim()}
                            onClick={handleSaveOperatorEmail}
                            className="px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center space-x-1 shrink-0 cursor-pointer disabled:opacity-40"
                            title="Save email to operator record"
                          >
                            {isSavingEmailDirectly ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>Save Email</span>
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Official City Hall renewal notice dispatched from tabacocitytrd@gmail.com.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Driver Card */}
              <div className="p-4 rounded-2xl border-2 border-emerald-400 bg-emerald-50/30 shadow-2xs space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                  <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <span>🛺 Driver:</span>
                    <strong className="text-emerald-950">{selectedForReminder.driverName}</strong>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-black uppercase shadow-2xs">
                    Assigned Driver
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Driver Mobile Number */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      <span className="inline-flex items-center space-x-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Driver Mobile (SMS)</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={reminderDriverPhone}
                      onChange={(e) => setReminderDriverPhone(e.target.value)}
                      placeholder="09171234567 or +639171234567"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Delivered directly via TextBee Android SMS Gateway.
                    </p>
                  </div>

                  {/* Driver Gmail / Email with + Add Email Button */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 inline-flex items-center space-x-1.5">
                        <Mail className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Driver Email / Gmail</span>
                      </label>
                      {reminderDriverGmail && (
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded-md border border-emerald-300">
                            ✓ On File
                          </span>
                          {!isAddingDriverEmail && (
                            <button
                              type="button"
                              onClick={() => setIsAddingDriverEmail(true)}
                              className="text-[10px] text-emerald-800 hover:text-emerald-950 font-bold underline cursor-pointer"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {!reminderDriverGmail && !isAddingDriverEmail ? (
                      /* If driver DOES NOT have an email, show dedicated + Add Email button */
                      <div className="p-3 bg-white border border-emerald-300 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
                        <div className="flex items-center space-x-2 min-w-0">
                          <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-xs text-slate-600 italic truncate">
                            No email registered for Driver
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsAddingDriverEmail(true)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition-all flex items-center space-x-1 shrink-0 cursor-pointer active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add Email</span>
                        </button>
                      </div>
                    ) : (
                      /* Driver Email Input Field with Save Action */
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-2">
                          <input
                            type="email"
                            value={reminderDriverGmail}
                            onChange={(e) => setReminderDriverGmail(e.target.value)}
                            placeholder="e.g. driver@gmail.com"
                            className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            autoFocus={isAddingDriverEmail && !reminderDriverGmail}
                          />
                          <button
                            type="button"
                            disabled={isSavingDriverEmailDirectly || !reminderDriverGmail.trim()}
                            onClick={handleSaveDriverEmail}
                            className="px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center space-x-1 shrink-0 cursor-pointer disabled:opacity-40"
                            title="Save email to driver record"
                          >
                            {isSavingDriverEmailDirectly ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>Save Email</span>
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Official City Hall renewal notice dispatched from tabacocitytrd@gmail.com.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Official Notice Content Preview */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-slate-800 inline-flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  <span>Official Notice Content Preview</span>
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono text-slate-500">
                    Unit: {selectedForReminder.cityPlateNumber || selectedForReminder.mtopNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const suggested = buildDriverSmsReminderText(
                        selectedForReminder,
                        getFranchiseExpiryInfo(selectedForReminder),
                        'both'
                      );
                      setCustomNote(suggested);
                    }}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                    title="Restore standard official template"
                  >
                    <RotateCcw className="w-3 h-3 text-slate-500" />
                    <span>Reset to Suggested</span>
                  </button>
                </div>
              </div>

              {/* Editable Textarea */}
              <div className="space-y-1">
                <textarea
                  rows={6}
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Type or customize your official notice here..."
                  className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 leading-relaxed focus:ring-2 focus:ring-amber-500 focus:outline-none resize-y shadow-2xs"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>Editable notice dispatched via SMS &amp; Gmail directly to Operator &amp; Driver.</span>
                  <span>{customNote.length} characters</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSelectedForReminder(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDispatching}
                onClick={handleSendSingleReminder}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isDispatching ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Dispatching Notice...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Expiration Notice to Operator &amp; Driver (SMS &amp; Email)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FLOATING PAGE: RENEWAL COMPLETION CARD ── */}
      {completedRenewalSummary && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCompletedRenewalSummary(null);
          }}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border-2 border-emerald-500/60 max-w-2xl w-full overflow-hidden animate-scaleUp max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-700 to-teal-800 px-6 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-xl text-white">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200 block">
                    Process Completed • Completion Card
                  </span>
                  <h4 className="text-base sm:text-lg font-black text-white">
                    Franchise Permit Renewed — Unit {completedRenewalSummary.mtopNumber}
                  </h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCompletedRenewalSummary(null)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close floating page"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Renewal Confirmation Feedback Banner */}
              {renewalConfirmationFeedback && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-bold p-3.5 rounded-2xl flex items-center space-x-2.5 animate-fadeIn shadow-2xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{renewalConfirmationFeedback}</span>
                </div>
              )}

              {/* Validity Extension Highlight Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Validity Extension Applied</span>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="font-mono text-xs text-slate-400 line-through">{completedRenewalSummary.previousExpiry}</span>
                      <span className="text-slate-400 font-bold">➔</span>
                      <span className="font-mono text-sm font-extrabold text-emerald-800 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-300 shadow-2xs">
                        {completedRenewalSummary.newExpiry}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full shadow-2xs">
                    Status: Active
                  </span>
                </div>
              </div>

              {/* Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-semibold text-[10px] uppercase block">Unit &amp; Category</span>
                  <p className="font-bold text-slate-900 mt-1 text-sm">MTOP {completedRenewalSummary.mtopNumber}</p>
                  <p className="text-slate-500 text-[11px]">{completedRenewalSummary.vehicleCategory || 'Tricycle'}</p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-semibold text-[10px] uppercase block">Operator &amp; Driver</span>
                  <p className="font-bold text-slate-900 mt-1 truncate">Op: {completedRenewalSummary.operatorName}</p>
                  <p className="text-slate-600 truncate text-[11px]">Dr: {completedRenewalSummary.driverName}</p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-semibold text-[10px] uppercase block">Official Receipt (OR)</span>
                  <p className="font-mono font-bold text-slate-900 mt-1 truncate">{completedRenewalSummary.orNumber}</p>
                  <p className="text-slate-500 text-[11px]">App: {completedRenewalSummary.applicationNo}</p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-semibold text-[10px] uppercase block">Renewal Fee Paid</span>
                  <p className="font-mono font-black text-emerald-700 mt-1 text-sm">₱{completedRenewalSummary.amountPaid}</p>
                  <p className="text-slate-500 text-[11px]">{completedRenewalSummary.paymentDate}</p>
                </div>
              </div>

              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200 text-center text-slate-500 text-[11px] italic">
                ✓ System verification updated in Supabase cloud database &amp; recorded to Audit Trail at {completedRenewalSummary.processedAt}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3 shrink-0">
              <span className="text-[11px] text-slate-400 italic">
                Official Municipal Conveyance Permit • Tabaco City TRD
              </span>
              <div className="flex items-center space-x-2.5">
                {/* 1-Click Send Renewal Confirmation SMS & Email to Operator & Driver */}
                <button
                  type="button"
                  disabled={isSendingRenewalConfirmation}
                  onClick={handleSendRenewalConfirmationNotice}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                  title="Send official SMS & Email confirmation to Operator"
                >
                  {isSendingRenewalConfirmation ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Sending Confirmation...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Send Notice to Operator (SMS &amp; Email)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                >
                  <Receipt className="h-4 w-4 text-slate-600" />
                  <span>Print Receipt / Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCompletedRenewalSummary(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
                >
                  Done / Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline Renewal Form Card (when a unit is selected for renewal) */}
      {selectedForRenewal && (
        <div className="bg-white rounded-3xl shadow-md border-2 border-blue-500/40 overflow-hidden animate-fadeIn">
          <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <RefreshCw className="h-5 w-5 text-blue-400" />
              <div>
                <h4 className="text-sm font-bold">
                  Inline Renewal Processing — Unit {selectedForRenewal.mtopNumber}
                </h4>
                <p className="text-[11px] text-slate-300">
                  Operator: {selectedForRenewal.operatorName} • Driver: {selectedForRenewal.driverName} • Current Expiry: {selectedForRenewal.expirationDate}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedForRenewal(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleConfirmRenewal} className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Application No.
                </label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <FileText className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={renewalApplicationNo}
                      onChange={(e) => setRenewalApplicationNo(e.target.value.toUpperCase())}
                      placeholder="e.g. APP-2026-105"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setRenewalApplicationNo(generateNewApplicationNo())}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Next Expiration Date
                </label>
                <div className="relative">
                  <Calendar className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={renewalExpiryDate}
                    onChange={(e) => setRenewalExpiryDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Official Receipt & Payment Details */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                  <Receipt className="h-4 w-4 text-blue-600" />
                  <span>Official Receipt &amp; Payment</span>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Renewal Fee
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Receipt Number (OR No.)
                  </label>
                  <input
                    type="text"
                    required
                    value={renewalOrNumber}
                    onChange={(e) => setRenewalOrNumber(e.target.value.toUpperCase())}
                    placeholder="OR-2026-10492"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Payment Date
                    </label>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      Auto UTC
                    </span>
                  </div>
                  <input
                    type="date"
                    required
                    value={renewalPaymentDate}
                    onChange={(e) => setRenewalPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Amount Paid (PHP)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                      ₱
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={renewalAmountPaid}
                      onChange={(e) => setRenewalAmountPaid(e.target.value)}
                      placeholder={selectedForRenewal?.vehicleCategory === 'Pedicab' ? '250.00' : '450.00'}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedForRenewal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirm &amp; Save Renewal</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Search & Units Table Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        {/* Top Control Bar: Total count & Reminder Dispatcher toggle */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-1 border-b border-slate-100">
          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl">
            {categoryFranchises.length} Registered Units
          </span>
          <button
            type="button"
            onClick={() => setShowReminderCenter(!showReminderCenter)}
            className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>{showReminderCenter ? 'Hide Reminder Dispatcher' : 'Reminder Dispatcher'}</span>
            {expiringDrivers.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                {expiringDrivers.length}
              </span>
            )}
          </button>
        </div>

        {/* INLINE EXPANDABLE DISPATCHER (Toggled from the header button) */}
        {showReminderCenter && (
          <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-300 shadow-2xs space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-700">Filter Target Drivers:</span>
                <div className="flex items-center space-x-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setReminderFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${reminderFilter === 'all'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    All Expiring ({filterExpiringDrivers(franchises, 'all').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReminderFilter('urgent7')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${reminderFilter === 'urgent7'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    Urgent ≤7 Days ({filterExpiringDrivers(franchises, 'urgent7').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReminderFilter('soon30')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${reminderFilter === 'soon30'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    Within 30 Days ({filterExpiringDrivers(franchises, 'soon30').length})
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowLogs(!showLogs)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  <span>{showLogs ? 'Hide Logs' : 'Dispatch Audit Logs'}</span>
                </button>
              </div>
            </div>

            {/* Batch Dispatch Trigger */}
            <div className="bg-amber-50/70 rounded-xl p-3.5 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-900">
                    Batch Notice Dispatch ({targetedDrivers.length} Target Drivers Selected)
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-xs text-slate-600">
                  <label className="inline-flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={batchSendSms}
                      onChange={(e) => setBatchSendSms(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-medium">SMS Mobile Dispatch</span>
                  </label>
                  <label className="inline-flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={batchSendGmail}
                      onChange={(e) => setBatchSendGmail(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-medium">Gmail Address Dispatch</span>
                  </label>
                </div>
              </div>

              <button
                type="button"
                disabled={isBatchSending || targetedDrivers.length === 0 || (!batchSendSms && !batchSendGmail)}
                onClick={handleBatchSend}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isBatchSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending {batchProgress ? `${batchProgress.current}/${batchProgress.total}` : '...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Batch Reminders to All ({targetedDrivers.length})</span>
                  </>
                )}
              </button>
            </div>

            {/* Progress Bar when Sending */}
            {isBatchSending && batchProgress && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Dispatching: {batchProgress.name || 'Driver'}</span>
                  <span>{Math.round((batchProgress.current / (batchProgress.total || 1)) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full transition-all duration-300"
                    style={{ width: `${(batchProgress.current / (batchProgress.total || 1)) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Batch Summary Report */}
            {batchSummary && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center justify-between">
                <span>
                  Batch Complete! Targeted: {batchSummary.totalTargeted} • SMS: {batchSummary.smsSucceeded} sent • Gmail: {batchSummary.emailSucceeded} sent
                </span>
                <button
                  type="button"
                  onClick={() => setBatchSummary(null)}
                  className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Audit Logs Table */}
            {showLogs && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Recent Reminder Logs</span>
                  {reminderLogs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        clearReminderLogs();
                        setReminderLogs([]);
                      }}
                      className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
                    >
                      Clear History
                    </button>
                  )}
                </div>

                {reminderLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No reminder activity recorded yet.</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2">Time</th>
                          <th className="px-3 py-2">Unit</th>
                          <th className="px-3 py-2">Driver</th>
                          <th className="px-3 py-2">Channel</th>
                          <th className="px-3 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reminderLogs.slice(0, 15).map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/60">
                            <td className="px-3 py-1.5 font-mono text-[11px] text-slate-500">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-3 py-1.5 font-mono font-bold text-slate-800">
                              {log.cityPlateNumber}
                            </td>
                            <td className="px-3 py-1.5 font-semibold text-slate-700">
                              {log.driverName}
                            </td>
                            <td className="px-3 py-1.5 text-slate-600 uppercase font-bold text-[10px]">
                              {log.channels}
                            </td>
                            <td className="px-3 py-1.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Sent
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Search bar & Live System Date (Fixed Position) */}
        <div className="sticky top-[72px] z-20 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search City Plate No., Application No., operator, driver, or status..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <DateBadge className="hidden sm:inline-flex py-1 text-[11px]" />
        </div>

        {/* Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-900 text-white font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">City Plate No.</th>
                <th className="px-4 py-3">Application No.</th>
                <th className="px-4 py-3">Operator / Driver</th>
                <th className="px-4 py-3">Current Expiration</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categoryFranchises.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    <p className="text-sm font-semibold text-slate-600">No Franchise Records Available for Renewal</p>
                    <p className="text-xs text-slate-400 mt-1">There are currently 0 records matching your query.</p>
                  </td>
                </tr>
              ) : (
                categoryFranchises.map((item) => {
                  const isExpired = item.status === 'Expired' || isRecordExpired(item.expirationDate);
                  const isSelectedRenewal = selectedForRenewal?.id === item.id;
                  const isSelectedReminder = selectedForReminder?.id === item.id;
                  const lastLog = getLastReminderForRecord(item.cityPlateNumber || item.mtopNumber);

                  return (
                    <tr
                      key={item.id}
                      className={
                        isSelectedReminder
                          ? 'bg-amber-50/80 border-l-4 border-amber-500'
                          : isSelectedRenewal
                            ? 'bg-blue-50/70 border-l-4 border-blue-500'
                            : isExpired
                              ? 'bg-rose-50/40 hover:bg-rose-50/70 transition-colors'
                              : 'hover:bg-slate-50/80 transition-colors'
                      }
                    >
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        <div className="flex items-center space-x-1.5">
                          <span>{item.mtopNumber}</span>
                          <span
                            className={`text-[10px] font-sans font-bold px-1.5 py-0.5 rounded-md border ${item.vehicleCategory === 'Pedicab'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}
                          >
                            {item.vehicleCategory === 'Pedicab' ? '🚲 Pedicab' : '🛺 Tricycle'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                        {item.applicationNo || '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {item.operatorName}
                        <p className="text-[11px] text-slate-500 font-normal">
                          Driver: {item.driverName}
                          {lastLog && (
                            <span className="ml-2 text-[10px] text-amber-700 font-medium">
                              • Reminded {new Date(lastLog.timestamp).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span className={isExpired ? 'font-bold text-rose-700' : 'font-medium'}>
                            {item.expirationDate}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center space-x-1 ${item.status === 'Active' && !isExpired
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                        >
                          {isExpired && <AlertCircle className="h-3 w-3 mr-1 text-rose-600" />}
                          <span>{isExpired ? 'Expired' : item.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* REMIND BUTTON (EXCLUSIVELY IN PROCESS RENEWAL, DIRECTLY ON PAGE) */}
                          <button
                            type="button"
                            onClick={() => handleOpenReminder(item)}
                            className={`px-2.5 py-1.5 rounded-lg font-bold text-xs transition-all inline-flex items-center space-x-1 cursor-pointer ${isSelectedReminder
                              ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                              : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
                              }`}
                            title={`Send SMS & Gmail Expiration Reminder to ${item.driverName}`}
                          >
                            <Send className="h-3 w-3 text-amber-600" />
                            <span className="hidden sm:inline">{isSelectedReminder ? 'Reminding...' : 'Remind'}</span>
                          </button>

                          {/* RENEW / UPDATE BUTTON */}
                          <button
                            type="button"
                            onClick={() => handleOpenRenewalDialog(item)}
                            className={`px-4 py-1.5 rounded-lg font-bold text-xs shadow-sm transition-all inline-flex items-center space-x-1.5 cursor-pointer ${isSelectedRenewal
                              ? 'bg-slate-900 text-white'
                              : isExpired
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                              }`}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>{isSelectedRenewal ? 'Editing Above' : isExpired ? 'Renew Permit' : 'Renew / Update'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
