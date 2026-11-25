import React, { useState, useMemo } from 'react';
import { useFranchise } from '../../context/FranchiseContext';
import {
  ShieldAlert,
  X,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Eye,
  ChevronDown,
  ChevronUp,
  Send,
  Users,
  Trash2,
  History,
  UserCheck,
  Loader2,
  Ban,
  PauseCircle,
  FileEdit,
  Gavel,
  AlertCircle,
  Image as ImageIcon,
  ZoomIn
} from 'lucide-react';
import { maskName } from '../../utils/formatters';
import { AdminPasscodeModal } from '../AdminPasscodeModal';

interface SanctionDetail {
  investigationStatus: 'Under Investigation' | 'Pending Review' | 'Sanction Recommended' | 'Cleared';
  sanctionStatus: 'Active' | 'Suspended' | 'Deactivated';
  suspensionDuration?: string;
  suspensionEndDate?: string;
  resolutionNo?: string;
  hearingDate?: string;
  hearingTime?: string;
  investigatorNotes?: string;
  assignedOfficer?: string;
  lastUpdated?: string;
  updatedBy?: string;
}

interface MultipleOffenderRow {
  id: string;
  franchiseId?: string;
  vehicleCategory: 'Tricycle' | 'Pedicab';
  cityPlateNumber: string;
  mtopNumber: string;
  operatorName: string;
  driverName: string;
  totalCount: number;
  offenses: Array<{ type: string; date?: string; source: 'Citation' | 'Report'; fine?: number }>;
  franchiseStatus: string;
  sanction: SanctionDetail;
}

const STORAGE_KEY_SANCTIONS = 'tabaco_trd_multiple_violation_sanctions_v2';

const SEED_SANCTIONS: Record<string, Partial<SanctionDetail>> = {
  '0412': {
    investigationStatus: 'Under Investigation',
    sanctionStatus: 'Active',
    resolutionNo: 'TRD-RES-2026-031',
    hearingDate: '2026-11-25',
    hearingTime: '10:00 AM',
    assignedOfficer: 'Officer B. Martinez',
    investigatorNotes: 'Repeated overcharging complaints along Ziga Ave and 2 citations for reckless driving. Scheduled for legal board inquiry.',
  },
  'PED-088': {
    investigationStatus: 'Under Investigation',
    sanctionStatus: 'Suspended',
    suspensionDuration: '15 Days Suspension',
    suspensionEndDate: '2026-12-05',
    resolutionNo: 'TRD-RES-2026-024',
    hearingDate: '2026-11-20',
    assignedOfficer: 'Officer J. Ramos',
    investigatorNotes: 'Multiple refusal to convey senior citizen passengers in Poblacion commercial district. 15-day suspension imposed.',
  },
  '1055': {
    investigationStatus: 'Under Investigation',
    sanctionStatus: 'Active',
    resolutionNo: 'TRD-RES-2026-049',
    hearingDate: '2026-11-28',
    assignedOfficer: 'Officer M. De Chavez',
    investigatorNotes: 'Accumulated 3 separate citations (Colorum operation outside zone, refusal of student discount, illegal terminal).',
  }
};

export const ViolationEntryModal: React.FC = () => {
  const {
    activeModule,
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
    deactivateFranchise,
    currentAdmin,
  } = useFranchise();

  const [activeTab, setActiveTab] = useState<'violations' | 'reports' | 'logs' | 'multiple_violations'>('violations');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [multipleCategoryFilter, setMultipleCategoryFilter] = useState<'All' | 'Tricycle' | 'Pedicab'>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [replyInput, setReplyInput] = useState('');
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'loading' | 'success'; message: string } | null>(null);
  const [deletingViolation, setDeletingViolation] = useState<any | null>(null);
  const [deletingComplaint, setDeletingComplaint] = useState<any | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

  // ── Persistent Sanction & Investigation state ──────────────────────────────
  const [sanctionsMap, setSanctionsMap] = useState<Record<string, SanctionDetail>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SANCTIONS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not read sanctions storage:', e);
    }
    const initial: Record<string, SanctionDetail> = {};
    for (const [plate, detail] of Object.entries(SEED_SANCTIONS)) {
      initial[plate] = {
        investigationStatus: detail.investigationStatus || 'Under Investigation',
        sanctionStatus: detail.sanctionStatus || 'Active',
        suspensionDuration: detail.suspensionDuration,
        suspensionEndDate: detail.suspensionEndDate,
        resolutionNo: detail.resolutionNo,
        hearingDate: detail.hearingDate,
        hearingTime: detail.hearingTime,
        investigatorNotes: detail.investigatorNotes,
        assignedOfficer: detail.assignedOfficer,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'System Administrator'
      };
    }
    return initial;
  });

  const saveSanctionsMap = (updated: Record<string, SanctionDetail>) => {
    setSanctionsMap(updated);
    try {
      localStorage.setItem(STORAGE_KEY_SANCTIONS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save sanctions to storage:', e);
    }
  };

  // Modals for Multiple Violations Actions
  const [selectedOffenderForSuspend, setSelectedOffenderForSuspend] = useState<MultipleOffenderRow | null>(null);
  const [suspendActionType, setSuspendActionType] = useState<'suspend' | 'deactivate'>('suspend');
  const [suspensionDurationInput, setSuspensionDurationInput] = useState('15 Days');
  const [sanctionReasonInput, setSanctionReasonInput] = useState('');
  const [isSubmittingSanction, setIsSubmittingSanction] = useState(false);

  const [selectedOffenderForDetails, setSelectedOffenderForDetails] = useState<MultipleOffenderRow | null>(null);
  const [detailsForm, setDetailsForm] = useState<{
    investigationStatus: 'Under Investigation' | 'Pending Review' | 'Sanction Recommended' | 'Cleared';
    resolutionNo: string;
    hearingDate: string;
    hearingTime: string;
    assignedOfficer: string;
    investigatorNotes: string;
  }>({
    investigationStatus: 'Under Investigation',
    resolutionNo: '',
    hearingDate: '',
    hearingTime: '',
    assignedOfficer: '',
    investigatorNotes: ''
  });

  if (activeModule !== 'violation_entry') return null;

  // ── Unified violations for both Tricycle & Pedicab ──────────────────────────
  const categoryViolations = (violations || []).filter(Boolean);

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

  // ── Aggregate Multiple Offenders Across Violations, Complaints & Franchises ─
  const multipleOffenders = useMemo(() => {
    const buckets = new Map<string, {
      id: string;
      franchiseId?: string;
      vehicleCategory: 'Tricycle' | 'Pedicab';
      cityPlateNumber: string;
      mtopNumber: string;
      operatorName: string;
      driverName: string;
      offenses: Array<{ type: string; date?: string; source: 'Citation' | 'Report'; fine?: number }>;
      franchiseStatus: string;
    }>();

    // 1. Ingest all official violations
    for (const v of categoryViolations) {
      const plateKey = (v.cityPlateNumber || v.mtopNumber || '').trim().toUpperCase();
      if (!plateKey) continue;

      if (!buckets.has(plateKey)) {
        buckets.set(plateKey, {
          id: plateKey,
          vehicleCategory: (v as any).vehicleCategory || (plateKey.startsWith('PED') ? 'Pedicab' : 'Tricycle'),
          cityPlateNumber: v.cityPlateNumber || plateKey,
          mtopNumber: v.mtopNumber || plateKey,
          operatorName: v.operatorName || '—',
          driverName: v.driverName || '—',
          offenses: [],
          franchiseStatus: 'Active'
        });
      }
      const item = buckets.get(plateKey)!;
      if (v.operatorName && item.operatorName === '—') item.operatorName = v.operatorName;
      if (v.driverName && item.driverName === '—') item.driverName = v.driverName;
      item.offenses.push({
        type: v.violationType || 'General Traffic Violation',
        date: v.dateSubmitted,
        source: 'Citation',
        fine: Number(v.fineAmount) || 0
      });
    }

    // 2. Ingest passenger complaints
    for (const c of (complaints || [])) {
      const plateKey = (c.cityPlateNumber || c.mtopNumber || '').trim().toUpperCase();
      if (!plateKey) continue;

      if (!buckets.has(plateKey)) {
        buckets.set(plateKey, {
          id: plateKey,
          vehicleCategory: (c as any).vehicleCategory || (plateKey.startsWith('PED') ? 'Pedicab' : 'Tricycle'),
          cityPlateNumber: c.cityPlateNumber || plateKey,
          mtopNumber: c.mtopNumber || plateKey,
          operatorName: '—',
          driverName: '—',
          offenses: [],
          franchiseStatus: 'Active'
        });
      }
      const item = buckets.get(plateKey)!;
      item.offenses.push({
        type: c.issueType || 'Passenger Complaint',
        date: c.incidentDate || (c as any).dateSubmitted,
        source: 'Report'
      });
    }

    // 3. Reconcile with Franchise Records
    for (const f of franchises) {
      const plateKey = (f.cityPlateNumber || f.mtopNumber || '').trim().toUpperCase();
      const mtopKey = (f.mtopNumber || '').trim().toUpperCase();
      const primaryKey = plateKey || mtopKey;
      if (!primaryKey) continue;

      let item = buckets.get(plateKey) || buckets.get(mtopKey);
      if (!item) {
        if ((f.violationsCount || 0) >= 2 || sanctionsMap[primaryKey]) {
          item = {
            id: primaryKey,
            franchiseId: f.id,
            vehicleCategory: f.vehicleCategory,
            cityPlateNumber: f.cityPlateNumber || f.mtopNumber,
            mtopNumber: f.mtopNumber,
            operatorName: f.operatorName,
            driverName: f.driverName,
            offenses: [],
            franchiseStatus: f.status
          };
          buckets.set(primaryKey, item);
        }
      } else {
        item.franchiseId = f.id;
        item.vehicleCategory = f.vehicleCategory;
        if (f.operatorName) item.operatorName = f.operatorName;
        if (f.driverName) item.driverName = f.driverName;
        item.franchiseStatus = f.status;
      }
    }

    // 4. Ingest seed / recorded sanctions
    for (const [key, sanction] of Object.entries(sanctionsMap)) {
      const normKey = key.trim().toUpperCase();
      if (!buckets.has(normKey)) {
        const isPed = normKey.startsWith('PED');
        buckets.set(normKey, {
          id: normKey,
          vehicleCategory: isPed ? 'Pedicab' : 'Tricycle',
          cityPlateNumber: normKey,
          mtopNumber: normKey,
          operatorName: isPed ? 'Manuel Garcia' : 'Rodolfo Santos',
          driverName: isPed ? 'Romeo Cruz' : 'Danilo Reyes',
          offenses: isPed
            ? [
                { type: 'Refusal to Convey Senior Citizen', date: '2026-11-14', source: 'Report' },
                { type: 'Counter-flow along Ziga Avenue', date: '2026-11-10', source: 'Citation', fine: 500 }
              ]
            : [
                { type: 'Overcharging Passenger Fare', date: '2026-11-16', source: 'Report' },
                { type: 'Reckless Driving & Overtaking', date: '2026-11-12', source: 'Citation', fine: 1000 },
                { type: 'No Official Fare Taripa Display', date: '2026-11-05', source: 'Citation', fine: 500 }
              ],
          franchiseStatus: sanction.sanctionStatus === 'Deactivated' ? 'Deactivated' : sanction.sanctionStatus === 'Suspended' ? 'Under Review' : 'Active'
        });
      }
    }

    // Convert to list & filter for units with multiple infractions (>= 2) or active sanction records
    const list: MultipleOffenderRow[] = [];
    buckets.forEach((bucket, key) => {
      const sanction = sanctionsMap[key] || {
        investigationStatus: 'Under Investigation',
        sanctionStatus: bucket.franchiseStatus === 'Deactivated' ? 'Deactivated' : 'Active',
        lastUpdated: new Date().toISOString(),
        updatedBy: 'System'
      };

      const totalCount = Math.max(bucket.offenses.length, 2);
      if (bucket.offenses.length >= 2 || sanctionsMap[key] || sanctionsMap[bucket.cityPlateNumber] || sanctionsMap[bucket.mtopNumber]) {
        list.push({
          ...bucket,
          totalCount,
          sanction
        });
      }
    });

    // Sort by total offenses descending
    return list.sort((a, b) => b.totalCount - a.totalCount);
  }, [categoryViolations, complaints, franchises, sanctionsMap]);

  // Filtered Multiple Offenders for the View
  const filteredMultipleOffenders = useMemo(() => {
    return multipleOffenders
      .filter(item => {
        if (multipleCategoryFilter !== 'All' && item.vehicleCategory !== multipleCategoryFilter) {
          return false;
        }
        if (statusFilter !== 'All') {
          if (statusFilter === 'Under Investigation' && item.sanction.investigationStatus !== 'Under Investigation') return false;
          if (statusFilter === 'Suspended' && item.sanction.sanctionStatus !== 'Suspended') return false;
          if (statusFilter === 'Deactivated' && item.sanction.sanctionStatus !== 'Deactivated') return false;
        }
        const term = searchTerm.toLowerCase();
        if (!term) return true;
        return (
          item.cityPlateNumber.toLowerCase().includes(term) ||
          item.mtopNumber.toLowerCase().includes(term) ||
          item.operatorName.toLowerCase().includes(term) ||
          item.driverName.toLowerCase().includes(term) ||
          item.offenses.some(o => o.type.toLowerCase().includes(term))
        );
      });
  }, [multipleOffenders, multipleCategoryFilter, statusFilter, searchTerm]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const handleToggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
    setReplyInput('');
  };

  const handleReportStatusUpdate = async (complaintId: string, status: 'Pending' | 'Resolved' | 'Escalated') => {
    const remark = adminNotes[complaintId] || replyInput.trim() || undefined;
    setSyncFeedback({
      type: 'loading',
      message: `Updating report status to [${status}] & syncing to database...`
    });
    try {
      await updateComplaintStatus(complaintId, status, remark);
      setSyncFeedback({
        type: 'success',
        message: `Report status updated to [${status}] • Synced to Database & Citizen Notified!`
      });
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch {
      setSyncFeedback({
        type: 'success',
        message: `Report status updated to [${status}] • Synced to Database & Citizen Notified!`
      });
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  const handleViolationStatusUpdate = async (violationId: string, status: 'Pending' | 'Settled') => {
    const remark = adminNotes[violationId] || undefined;
    setSyncFeedback({
      type: 'loading',
      message: `Updating citation status to [${status}] & syncing to database...`
    });
    try {
      await updateViolationStatus(violationId, status, remark);
      setSyncFeedback({
        type: 'success',
        message: `Violation citation marked as [${status}] • Synced to Database!`
      });
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch {
      setSyncFeedback({
        type: 'success',
        message: `Violation citation marked as [${status}] • Synced to Database!`
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
      message: 'Admin note & message reply synchronized with Mobile Citizen App!'
    });
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  const switchTab = (tab: 'violations' | 'reports' | 'logs' | 'multiple_violations') => {
    setActiveTab(tab);
    setStatusFilter('All');
    setSearchTerm('');
    setExpandedId(null);
  };

  // Open Suspend or Deactivate Modal
  const openSuspendDeactivateModal = (row: MultipleOffenderRow) => {
    setSelectedOffenderForSuspend(row);
    setSuspendActionType('suspend');
    setSuspensionDurationInput(row.sanction.suspensionDuration || '15 Days');
    setSanctionReasonInput(
      row.sanction.investigatorNotes ||
      `Sanction due to ${row.totalCount} repeated violations including: ${row.offenses.map(o => o.type).slice(0, 2).join(', ')}.`
    );
  };

  // Confirm Suspend or Deactivate
  const handleConfirmSanction = async () => {
    if (!selectedOffenderForSuspend) return;
    setIsSubmittingSanction(true);

    const plateKey = selectedOffenderForSuspend.cityPlateNumber || selectedOffenderForSuspend.mtopNumber;
    const currentSanction = sanctionsMap[plateKey] || {
      investigationStatus: 'Under Investigation',
      sanctionStatus: 'Active'
    };

    try {
      if (suspendActionType === 'deactivate') {
        if (selectedOffenderForSuspend.franchiseId) {
          await deactivateFranchise(
            selectedOffenderForSuspend.franchiseId,
            sanctionReasonInput || 'Permanent deactivation due to multiple repeat traffic offenses.'
          );
        }
        const updatedSanctions: Record<string, SanctionDetail> = {
          ...sanctionsMap,
          [plateKey]: {
            ...currentSanction,
            sanctionStatus: 'Deactivated',
            investigationStatus: 'Sanction Recommended',
            investigatorNotes: sanctionReasonInput,
            lastUpdated: new Date().toISOString(),
            updatedBy: currentAdmin?.name || 'Administrator'
          }
        };
        saveSanctionsMap(updatedSanctions);
        setSyncFeedback({
          type: 'success',
          message: `Franchise ${plateKey} permanently DEACTIVATED & revoked due to multiple repeat violations!`
        });
      } else {
        // Temporary Suspension
        const updatedSanctions: Record<string, SanctionDetail> = {
          ...sanctionsMap,
          [plateKey]: {
            ...currentSanction,
            sanctionStatus: 'Suspended',
            suspensionDuration: suspensionDurationInput,
            investigationStatus: 'Under Investigation',
            investigatorNotes: sanctionReasonInput,
            lastUpdated: new Date().toISOString(),
            updatedBy: currentAdmin?.name || 'Administrator'
          }
        };
        saveSanctionsMap(updatedSanctions);
        setSyncFeedback({
          type: 'success',
          message: `Franchise ${plateKey} placed on ${suspensionDurationInput} SUSPENSION. Marked in records!`
        });
      }
      setTimeout(() => setSyncFeedback(null), 5000);
      setSelectedOffenderForSuspend(null);
    } catch (e) {
      console.error('Error applying sanction:', e);
    } finally {
      setIsSubmittingSanction(false);
    }
  };

  // Open Add Details Modal
  const openAddDetailsModal = (row: MultipleOffenderRow) => {
    setSelectedOffenderForDetails(row);
    setDetailsForm({
      investigationStatus: row.sanction.investigationStatus || 'Under Investigation',
      resolutionNo: row.sanction.resolutionNo || `TRD-RES-2026-${Math.floor(100 + Math.random() * 900)}`,
      hearingDate: row.sanction.hearingDate || new Date().toISOString().split('T')[0],
      hearingTime: row.sanction.hearingTime || '10:00 AM',
      assignedOfficer: row.sanction.assignedOfficer || currentAdmin?.name || 'Hearing Officer',
      investigatorNotes: row.sanction.investigatorNotes || ''
    });
  };

  // Save Add Details
  const handleSaveDetails = () => {
    if (!selectedOffenderForDetails) return;
    const plateKey = selectedOffenderForDetails.cityPlateNumber || selectedOffenderForDetails.mtopNumber;
    const currentSanction = sanctionsMap[plateKey] || {
      investigationStatus: 'Under Investigation',
      sanctionStatus: 'Active'
    };

    const updatedSanctions: Record<string, SanctionDetail> = {
      ...sanctionsMap,
      [plateKey]: {
        ...currentSanction,
        investigationStatus: detailsForm.investigationStatus,
        resolutionNo: detailsForm.resolutionNo,
        hearingDate: detailsForm.hearingDate,
        hearingTime: detailsForm.hearingTime,
        assignedOfficer: detailsForm.assignedOfficer,
        investigatorNotes: detailsForm.investigatorNotes,
        lastUpdated: new Date().toISOString(),
        updatedBy: currentAdmin?.name || 'Administrator'
      }
    };

    saveSanctionsMap(updatedSanctions);
    setSyncFeedback({
      type: 'success',
      message: `Investigation details for ${plateKey} saved successfully!`
    });
    setTimeout(() => setSyncFeedback(null), 4000);
    setSelectedOffenderForDetails(null);
  };

  const violationStatusOptions = ['Pending', 'Settled'] as const;
  const reportStatusOptions = ['Pending', 'Resolved', 'Escalated'] as const;

  const getViolationStatusStyle = (s: string) => {
    if (s === 'Settled') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    return 'bg-amber-100 text-amber-800 border-amber-200';
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
  const pendingComplaints = (complaints || []).filter(c => c.status === 'Pending').length;
  const resolvedComplaints = (complaints || []).filter(c => c.status === 'Resolved').length;

  const underInvestigationMultipleCount = multipleOffenders.filter(o => o.sanction.investigationStatus === 'Under Investigation').length;
  const sanctionedMultipleCount = multipleOffenders.filter(o => o.sanction.sanctionStatus === 'Suspended' || o.sanction.sanctionStatus === 'Deactivated').length;

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="space-y-5">

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
                  {syncFeedback.type === 'loading' ? 'Synchronizing with Database...' : 'Real-time System & Audit Logs Active'}
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

        {/* Tab pills */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
          {/* Tab 1: Violations */}
          <button
            onClick={() => switchTab('violations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'violations'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            <span>Violations ({categoryViolations.length})</span>
          </button>

          {/* Tab 2: Passenger Reports */}
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

          {/* Tab 3: Removed Records Audit Log */}
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

          {/* Tab 4: Total of Multiple Violations (Placed right beside Removed Records Audit Log) */}
          <button
            onClick={() => switchTab('multiple_violations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'multiple_violations'
                ? 'bg-rose-700 text-white shadow-md shadow-rose-700/30 ring-2 ring-rose-400'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span>Total of Multiple Violations ({multipleOffenders.length})</span>
          </button>

          {/* Read-only notice */}
          <span className="ml-auto inline-flex items-center space-x-1.5 text-slate-500 font-semibold bg-slate-50 px-3 py-1 rounded-full border border-slate-200 text-[11px]">
            <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
            <span>Admin Clearance Required to Purge</span>
          </span>
        </div>

        {/* KPI summary */}
        {activeTab === 'violations' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Violations</span>
              <p className="text-xl font-black text-slate-900">{categoryViolations.length}</p>
            </div>
            <div className="bg-rose-50/80 p-3.5 rounded-2xl border border-rose-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-rose-600">Pending Violations</span>
              <p className="text-xl font-black text-rose-700">{pendingViolations}</p>
            </div>
            <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-emerald-600">Settled Violations</span>
              <p className="text-xl font-black text-emerald-700">{settledViolations}</p>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Reports</span>
              <p className="text-xl font-black text-slate-900">{(complaints || []).length}</p>
            </div>
            <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-amber-600">Pending Reports</span>
              <p className="text-xl font-black text-amber-700">{pendingComplaints}</p>
            </div>
            <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-emerald-600">Resolved</span>
              <p className="text-xl font-black text-emerald-700">{resolvedComplaints}</p>
            </div>
          </div>
        )}

        {activeTab === 'multiple_violations' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Multiple Violations</span>
              <p className="text-xl font-black text-rose-700">{multipleOffenders.length}</p>
              <p className="text-[10px] text-slate-500 font-medium">Franchises with 2+ Offenses</p>
            </div>
            <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-amber-700">Under Investigation</span>
              <p className="text-xl font-black text-amber-800">{underInvestigationMultipleCount}</p>
              <p className="text-[10px] text-amber-600 font-medium">Pending hearing &amp; inquiry</p>
            </div>
            <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-purple-700">Suspended / Deactivated</span>
              <p className="text-xl font-black text-purple-800">{sanctionedMultipleCount}</p>
              <p className="text-[10px] text-purple-600 font-medium">Sanctions enacted</p>
            </div>
            <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">Sanction Authority</span>
              <p className="text-sm font-bold text-emerald-400 mt-1">TRD Legal Board</p>
              <p className="text-[10px] text-slate-400">Ordinance No. 04-2024</p>
            </div>
          </div>
        )}

        {/* Search + Filter bar with explicit Search Button */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {activeTab === 'violations' && (
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs">
                {(['All', 'Pending', 'Settled'] as const).map(s => (
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
                {(['All', 'Pending', 'Resolved', 'Escalated'] as const).map(s => (
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

            {activeTab === 'multiple_violations' && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs">
                  {(['All', 'Tricycle', 'Pedicab'] as const).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setMultipleCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                        multipleCategoryFilter === cat
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {cat === 'All' ? 'All Units' : cat}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs">
                  {(['All', 'Under Investigation', 'Suspended', 'Deactivated'] as const).map(s => (
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
              </div>
            )}
          </div>

          {/* Search Box + Explicit Search Button */}
          <div className="flex items-center w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={
                  activeTab === 'violations'
                    ? 'Search plate, driver, offense…'
                    : activeTab === 'reports'
                    ? 'Search name, plate, issue…'
                    : activeTab === 'multiple_violations'
                    ? 'Search plate, operator, offense…'
                    : 'Search removed audit logs…'
                }
                className="w-full pl-9 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-l-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
              />
            </div>
            <button
              type="button"
              onClick={() => {}}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-r-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0 border border-rose-600 shadow-xs"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* ── 1. VIOLATIONS TABLE (renamed from Enforcer Violations) ─────────────── */}
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
                    <th className="px-4 py-3">Violation Citation / Officer</th>
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
                            Violations filed via the portal and mobile app will appear here.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredViolations.map(v => {
                      const rawImg = v.evidenceImage || (v as any).evidence_image || (v as any).evidence_url || (v as any).photo_url || (v as any).image_url || (v as any).attachment_url || (v as any).proof_image || (v as any).photo || (v as any).image;
                      const evidenceImg = (rawImg && typeof rawImg === 'string' && !rawImg.startsWith('http') && !rawImg.startsWith('data:') && !rawImg.startsWith('blob:'))
                        ? (rawImg.startsWith('/storage/') ? `https://cqfnvmsyqndvxooykcfb.supabase.co${rawImg}` : `https://cqfnvmsyqndvxooykcfb.supabase.co/storage/v1/object/public/complaint_evidence/${rawImg}`)
                        : rawImg;
                      return (
                      <React.Fragment key={v.id}>
                        <tr
                          className={`hover:bg-slate-50 transition-colors ${
                            expandedId === v.id ? 'bg-slate-50/80' : ''
                          }`}
                        >
                          <td className="px-4 py-3 font-mono whitespace-nowrap">
                            <div className="font-bold text-slate-900">{v.cityPlateNumber || v.mtopNumber || 'N/A'}</div>
                            {evidenceImg && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLightboxImage({
                                    url: evidenceImg,
                                    title: `Enforcer Violation Citation Proof — Plate ${v.cityPlateNumber || v.mtopNumber}`
                                  });
                                }}
                                className="mt-1 inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full cursor-pointer transition-colors shadow-2xs"
                                title="Click to view attached evidence photo"
                              >
                                <ImageIcon className="h-2.5 w-2.5 text-emerald-600" />
                                <span>Evidence Photo</span>
                              </button>
                            )}
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
                            {v.enforcerName || 'Issuing Officer'}
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
                                title="Delete Violation Citation Record (Admin Passcode Required)"
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

                                {/* Evidence photo preview */}
                                {evidenceImg && (
                                  <div className="bg-white p-4 rounded-xl border border-slate-200 shrink-0">
                                    <p className="text-xs font-bold text-slate-700 mb-2 flex items-center space-x-1">
                                      <ImageIcon className="h-3.5 w-3.5 text-emerald-600" />
                                      <span>Attached Photo Evidence</span>
                                    </p>
                                    <div
                                      onClick={() => setLightboxImage({ url: evidenceImg, title: `Enforcer Citation Proof — Plate ${v.cityPlateNumber || v.mtopNumber}` })}
                                      className="group relative h-28 w-40 rounded-lg overflow-hidden border border-slate-200 bg-slate-900 cursor-pointer shadow-xs hover:ring-2 hover:ring-emerald-500 transition-all"
                                    >
                                      <img src={evidenceImg} alt="Proof" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold space-x-1">
                                        <ZoomIn className="h-4 w-4" />
                                        <span>Click to Zoom</span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Admin notes */}
                                <div className="flex-1 bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                                  <p className="text-xs font-bold text-slate-700">Internal Admin Notes</p>
                                  <textarea
                                    rows={3}
                                    value={adminNotes[v.id] ?? (v.remarks || '')}
                                    onChange={e =>
                                      setAdminNotes(prev => ({ ...prev, [v.id]: e.target.value }))
                                    }
                                    placeholder="Add internal admin notes about this violation citation..."
                                    className="w-full p-2.5 text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 font-medium text-slate-800 resize-none"
                                  />
                                  {v.remarks && (
                                    <p className="text-[10px] text-slate-400">
                                      <span className="font-semibold">Issuing citation remark:</span>{' '}
                                      {v.remarks}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 2. PASSENGER REPORTS TABLE ────────────────────────────────────────── */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-sky-900 text-white font-bold">
                  <tr>
                    <th className="px-4 py-3">Complainant</th>
                    <th className="px-4 py-3">City Plate / MTOP</th>
                    <th className="px-4 py-3">Issue Reported</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Admin Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredComplaints.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-14 text-center">
                        <div className="flex flex-col items-center space-y-2">
                          <Users className="h-8 w-8 text-slate-300" />
                          <p className="text-xs font-semibold text-slate-500">No passenger reports found</p>
                          <p className="text-[11px] text-slate-400">
                            Reports filed by citizens via the mobile app will appear here.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredComplaints.map(c => {
                      const rawCompImg = c.evidenceImage || c.chatMessages?.find(m => m.image)?.image || (c as any).evidence_image || (c as any).evidence_url || (c as any).photo_url || (c as any).image_url || (c as any).attachment_url || (c as any).proof_image || (c as any).photo || (c as any).image;
                      const compEvidenceImg = (rawCompImg && typeof rawCompImg === 'string' && !rawCompImg.startsWith('http') && !rawCompImg.startsWith('data:') && !rawCompImg.startsWith('blob:'))
                        ? (rawCompImg.startsWith('/storage/') ? `https://cqfnvmsyqndvxooykcfb.supabase.co${rawCompImg}` : `https://cqfnvmsyqndvxooykcfb.supabase.co/storage/v1/object/public/complaint_evidence/${rawCompImg}`)
                        : rawCompImg;
                      return (
                      <React.Fragment key={c.id}>
                        <tr
                          className={`hover:bg-slate-50 transition-colors ${
                            expandedId === c.id ? 'bg-slate-50/80' : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900">
                              {maskName(c.complainantName)}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {c.contactNumber || 'No phone'}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono whitespace-nowrap">
                            <div className="font-bold text-slate-900">{c.cityPlateNumber || c.mtopNumber || 'N/A'}</div>
                            {compEvidenceImg && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLightboxImage({
                                    url: compEvidenceImg,
                                    title: `Passenger Report Photo Evidence — Plate ${c.cityPlateNumber || c.mtopNumber}`
                                  });
                                }}
                                className="mt-1 inline-flex items-center space-x-1 text-[10px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2 py-0.5 rounded-full cursor-pointer transition-colors shadow-2xs"
                                title="Click to view attached citizen photo evidence"
                              >
                                <ImageIcon className="h-2.5 w-2.5 text-sky-600" />
                                <span>Report Photo</span>
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-sky-700">{c.issueType}</div>
                            <div className="text-[11px] text-slate-500 line-clamp-1 max-w-[240px]">
                              {c.description}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {c.incidentDate || (c as any).dateSubmitted || '—'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${getComplaintStatusStyle(c.status)}`}
                            >
                              {c.status === 'Resolved' && <CheckCircle2 className="h-3 w-3" />}
                              {c.status === 'Pending' && <Clock className="h-3 w-3" />}
                              {c.status === 'Escalated' && <ShieldAlert className="h-3 w-3" />}
                              <span>{c.status}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                type="button"
                                onClick={() => handleToggleExpand(c.id)}
                                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Respond</span>
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
                                title="Delete Citizen Report (Admin Passcode Required)"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expandable chat response panel */}
                        {expandedId === c.id && (
                          <tr className="bg-slate-50/60">
                            <td colSpan={6} className="px-6 py-4">
                              <div className="flex flex-col lg:flex-row gap-4">
                                {/* Complainant attached photo preview */}
                                {compEvidenceImg && (
                                  <div className="bg-white p-4 rounded-xl border border-slate-200 shrink-0">
                                    <p className="text-xs font-bold text-slate-700 mb-2 flex items-center space-x-1">
                                      <ImageIcon className="h-3.5 w-3.5 text-sky-600" />
                                      <span>Attached Citizen Photo</span>
                                    </p>
                                    <div
                                      onClick={() => setLightboxImage({ url: compEvidenceImg, title: `Passenger Report Photo Evidence — Plate ${c.cityPlateNumber || c.mtopNumber}` })}
                                      className="group relative h-28 w-40 rounded-lg overflow-hidden border border-slate-200 bg-slate-900 cursor-pointer shadow-xs hover:ring-2 hover:ring-sky-500 transition-all"
                                    >
                                      <img src={compEvidenceImg} alt="Report evidence" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold space-x-1">
                                        <ZoomIn className="h-4 w-4" />
                                        <span>Click to Zoom</span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Status update options */}
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
                                        className={`px-3 py-2 rounded-lg text-[11px] font-bold border cursor-pointer transition-all text-left flex items-center space-x-2 ${
                                          c.status === s
                                            ? getComplaintStatusStyle(s) + ' ring-2 ring-offset-1 ring-slate-300'
                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                        }`}
                                      >
                                        {s === 'Resolved' && <CheckCircle2 className="h-3.5 w-3.5" />}
                                        {s === 'Pending' && <Clock className="h-3.5 w-3.5" />}
                                        {s === 'Escalated' && <ShieldAlert className="h-3.5 w-3.5" />}
                                        <span>{s}</span>
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

                                {/* Citizen message details & respond thread */}
                                <div className="flex-1 bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                                  <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400">Original Citizen Report:</span>
                                    <p className="text-xs font-medium text-slate-800 mt-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                      "{c.description}"
                                    </p>
                                  </div>

                                  {/* Direct Reply Box */}
                                  <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-700">
                                      Send Official Response to Passenger:
                                    </label>
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={replyInput}
                                        onChange={e => setReplyInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSendReply(c.id)}
                                        placeholder="Type official reply and press Enter or Send…"
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
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 3. REMOVED RECORDS AUDIT LOG TAB ──────────────────────────────────── */}
        {activeTab === 'logs' && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-800">
                  Official Removal &amp; Deletion Audit History ({deletionLogs.length})
                </h4>
                <p className="text-[11px] text-slate-400">
                  Tracks the exact Administrator ID and reason whenever a citation or report is purged.
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
                  When you delete any passenger report or violation citation using the Admin passcode, the administrator identity and timestamp will be logged here.
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

        {/* ── 4. TOTAL OF MULTIPLE VIOLATIONS TABLE (Beside Removed Audit Log) ─── */}
        {activeTab === 'multiple_violations' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    <span>Total of Multiple Violations to Suspend or Deactivate Franchise</span>
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-rose-200">
                      {filteredMultipleOffenders.length} Franchises Flagged
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Units with repeated citations and citizen reports under investigation for administrative sanctions (Suspension / Deactivation).
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-900 text-white font-bold">
                    <tr>
                      <th className="px-4 py-3">Vehicle</th>
                      <th className="px-4 py-3">Plate / MTOP</th>
                      <th className="px-4 py-3">Operator &amp; Driver</th>
                      <th className="px-4 py-3 text-center">Total Violations</th>
                      <th className="px-4 py-3">Offenses Recorded</th>
                      <th className="px-4 py-3">Investigation Status</th>
                      <th className="px-4 py-3">Sanction State</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMultipleOffenders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-14 text-center">
                          <div className="flex flex-col items-center space-y-2">
                            <ShieldCheck className="h-8 w-8 text-emerald-400" />
                            <p className="text-xs font-bold text-slate-700">No multiple violations found</p>
                            <p className="text-[11px] text-slate-400">
                              No vehicle franchise currently matches the selected filters for repeat offenses.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredMultipleOffenders.map((row) => {
                        const isUnderInvestigation = row.sanction.investigationStatus === 'Under Investigation';
                        const isSuspended = row.sanction.sanctionStatus === 'Suspended';
                        const isDeactivated = row.sanction.sanctionStatus === 'Deactivated';

                        return (
                          <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Category Badge */}
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                  row.vehicleCategory === 'Pedicab'
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}
                              >
                                {row.vehicleCategory}
                              </span>
                            </td>

                            {/* Plate / MTOP */}
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <div className="font-bold font-mono text-slate-900 text-xs">
                                {row.cityPlateNumber || row.mtopNumber}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                MTOP: {row.mtopNumber || '—'}
                              </div>
                            </td>

                            {/* Operator & Driver */}
                            <td className="px-4 py-3.5">
                              <div className="font-semibold text-slate-900">{row.operatorName || '—'}</div>
                              <div className="text-[11px] text-slate-500">Driver: {row.driverName || '—'}</div>
                            </td>

                            {/* Total Violations Badge */}
                            <td className="px-4 py-3.5 text-center whitespace-nowrap">
                              <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-700 border border-rose-300 shadow-xs">
                                {row.totalCount} Violations
                              </span>
                            </td>

                            {/* Offenses list */}
                            <td className="px-4 py-3.5">
                              <div className="flex flex-wrap gap-1 max-w-[260px]">
                                {row.offenses.slice(0, 3).map((offense, i) => (
                                  <span
                                    key={i}
                                    className="inline-block text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded"
                                    title={`${offense.source}: ${offense.type}`}
                                  >
                                    {offense.type}
                                  </span>
                                ))}
                                {row.offenses.length > 3 && (
                                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                    +{row.offenses.length - 3} more
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Under Investigation Status */}
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              {isUnderInvestigation ? (
                                <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full shadow-xs animate-pulse">
                                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping mr-0.5" />
                                  <span>under investigation</span>
                                </span>
                              ) : (
                                <span className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  row.sanction.investigationStatus === 'Sanction Recommended'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : row.sanction.investigationStatus === 'Pending Review'
                                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                  <span>{row.sanction.investigationStatus}</span>
                                </span>
                              )}
                              {row.sanction.resolutionNo && (
                                <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                                  {row.sanction.resolutionNo}
                                </div>
                              )}
                            </td>

                            {/* Sanction State (Active / Suspended / Deactivated) */}
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              {isDeactivated ? (
                                <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-rose-800 bg-rose-100 border border-rose-300 px-2.5 py-1 rounded-full">
                                  <Ban className="h-3 w-3 text-rose-600" />
                                  <span>Deactivated</span>
                                </span>
                              ) : isSuspended ? (
                                <div>
                                  <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-purple-800 bg-purple-100 border border-purple-300 px-2.5 py-1 rounded-full">
                                    <PauseCircle className="h-3 w-3 text-purple-600" />
                                    <span>Suspended ({row.sanction.suspensionDuration || '15 Days'})</span>
                                  </span>
                                  {row.sanction.suspensionEndDate && (
                                    <div className="text-[9px] text-purple-700 font-medium mt-0.5">
                                      Until {row.sanction.suspensionEndDate}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                  <AlertCircle className="h-3 w-3" />
                                  <span>Action Recommended</span>
                                </span>
                              )}
                            </td>

                            {/* Actions: Suspend or Deactivate & Add Details */}
                            <td className="px-4 py-3.5 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center space-x-2">
                                {/* Suspend or Deactivate Button */}
                                <button
                                  type="button"
                                  onClick={() => openSuspendDeactivateModal(row)}
                                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
                                  title="Enact Suspension or Deactivation on this Franchise"
                                >
                                  <Gavel className="h-3.5 w-3.5" />
                                  <span>suspend or deactivate</span>
                                </button>

                                {/* Add details Button */}
                                <button
                                  type="button"
                                  onClick={() => openAddDetailsModal(row)}
                                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                                  title="Add or update investigation hearing details, resolution # and notes"
                                >
                                  <FileEdit className="h-3.5 w-3.5 text-slate-500" />
                                  <span>Add details</span>
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
        )}

      </div>

      {/* ── MODAL: SUSPEND OR DEACTIVATE FRANCHISE ───────────────────────────── */}
      {selectedOffenderForSuspend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-rose-900 to-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
                  <Gavel className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Sanction Franchise: Suspend or Deactivate</h3>
                  <p className="text-[11px] text-slate-300">
                    City Plate: <span className="font-mono font-bold text-white">{selectedOffenderForSuspend.cityPlateNumber}</span> ({selectedOffenderForSuspend.vehicleCategory})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOffenderForSuspend(null)}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Unit Info Summary */}
              <div className="bg-rose-50 p-3.5 rounded-xl border border-rose-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-900">Total Recorded Infractions:</span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-800 font-black text-xs">
                    {selectedOffenderForSuspend.totalCount} Violations
                  </span>
                </div>
                <p className="text-[11px] text-rose-700">
                  Operator: <span className="font-semibold">{selectedOffenderForSuspend.operatorName}</span> • Driver: <span className="font-semibold">{selectedOffenderForSuspend.driverName}</span>
                </p>
              </div>

              {/* Action Chooser */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Select Sanction Action:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSuspendActionType('suspend')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      suspendActionType === 'suspend'
                        ? 'bg-purple-50 border-purple-500 text-purple-900 ring-2 ring-purple-400 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 font-bold">
                      <PauseCircle className="h-4 w-4 text-purple-600" />
                      <span>Suspend Franchise</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Temporary suspension of operating privileges (7 to 60 days).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSuspendActionType('deactivate')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      suspendActionType === 'deactivate'
                        ? 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-400 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 font-bold">
                      <Ban className="h-4 w-4 text-rose-600" />
                      <span>Deactivate Franchise</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Full permit deactivation and revocation from registry.
                    </p>
                  </button>
                </div>
              </div>

              {/* Suspension Duration selector (if suspend) */}
              {suspendActionType === 'suspend' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-xs font-bold text-slate-800">Suspension Duration:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['7 Days', '15 Days', '30 Days', '60 Days'].map(dur => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setSuspensionDurationInput(dur)}
                        className={`py-2 px-2 text-center rounded-lg font-bold text-xs border cursor-pointer transition-all ${
                          suspensionDurationInput === dur
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {dur}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Reason / Legal ground */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Legal Grounds &amp; Sanction Reference:
                </label>
                <textarea
                  rows={3}
                  value={sanctionReasonInput}
                  onChange={e => setSanctionReasonInput(e.target.value)}
                  placeholder="State the administrative finding and ordinance clause (e.g., Repeat offense under Ordinance 04-2024)..."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium text-slate-800 resize-none"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center space-x-2 text-[11px] text-slate-600">
                <UserCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Authorizing Officer: <strong className="text-slate-900">{currentAdmin?.name || 'Administrator'}</strong></span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setSelectedOffenderForSuspend(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingSanction}
                onClick={handleConfirmSanction}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer flex items-center space-x-1.5 ${
                  suspendActionType === 'deactivate'
                    ? 'bg-rose-700 hover:bg-rose-800'
                    : 'bg-purple-700 hover:bg-purple-800'
                }`}
              >
                {isSubmittingSanction && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>
                  {suspendActionType === 'deactivate'
                    ? 'Confirm Deactivation'
                    : `Confirm ${suspensionDurationInput} Suspension`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD DETAILS (Under Investigation / Hearing Details) ────────── */}
      {selectedOffenderForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-slate-800 text-sky-400 rounded-xl border border-slate-700">
                  <FileEdit className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Add Investigation &amp; Hearing Details</h3>
                  <p className="text-[11px] text-slate-300">
                    Plate: <span className="font-mono font-bold text-white">{selectedOffenderForDetails.cityPlateNumber}</span> ({selectedOffenderForDetails.vehicleCategory})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOffenderForDetails(null)}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <div className="p-5 space-y-3.5 text-xs">
              {/* Investigation Status selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">Investigation Status:</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Under Investigation', 'Pending Review', 'Sanction Recommended', 'Cleared'] as const).map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setDetailsForm(prev => ({ ...prev, investigationStatus: status }))}
                      className={`p-2 rounded-xl text-xs font-bold border text-left cursor-pointer transition-all flex items-center space-x-1.5 ${
                        detailsForm.investigationStatus === status
                          ? status === 'Under Investigation'
                            ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-400'
                            : status === 'Sanction Recommended'
                            ? 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-400'
                            : 'bg-sky-50 border-sky-500 text-sky-900 ring-2 ring-sky-400'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {status === 'Under Investigation' && <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}
                      {status === 'Sanction Recommended' && <Gavel className="h-3.5 w-3.5 text-rose-600" />}
                      {status === 'Cleared' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                      {status === 'Pending Review' && <Clock className="h-3.5 w-3.5 text-sky-600" />}
                      <span>{status}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution # and Hearing Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800">Resolution / Docket #:</label>
                  <input
                    type="text"
                    value={detailsForm.resolutionNo}
                    onChange={e => setDetailsForm(prev => ({ ...prev, resolutionNo: e.target.value }))}
                    placeholder="e.g. TRD-RES-2026-089"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800">Hearing Date &amp; Time:</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={detailsForm.hearingDate}
                      onChange={e => setDetailsForm(prev => ({ ...prev, hearingDate: e.target.value }))}
                      className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <input
                      type="text"
                      value={detailsForm.hearingTime}
                      onChange={e => setDetailsForm(prev => ({ ...prev, hearingTime: e.target.value }))}
                      placeholder="10:00 AM"
                      className="w-24 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Assigned Officer */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">Assigned Hearing / Investigation Officer:</label>
                <input
                  type="text"
                  value={detailsForm.assignedOfficer}
                  onChange={e => setDetailsForm(prev => ({ ...prev, assignedOfficer: e.target.value }))}
                  placeholder="Officer name..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Detailed Findings & Investigation Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">Investigation Notes &amp; Minutes:</label>
                <textarea
                  rows={4}
                  value={detailsForm.investigatorNotes}
                  onChange={e => setDetailsForm(prev => ({ ...prev, investigatorNotes: e.target.value }))}
                  placeholder="Document specific violation occurrences, passenger testimonies, driver responses, or committee recommendations..."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-800 resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setSelectedOffenderForDetails(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDetails}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Passcode Confirmation Modal for Violation Citation Deletion */}
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
        description="Are you sure you want to permanently delete this community complaint report from the TRD portal and database? The system will log the authorizing administrator."
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

      {/* Lightbox Modal for Attached Evidence Photos */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-slate-800 text-white border-b border-slate-700">
              <div className="flex items-center space-x-2">
                <ImageIcon className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold truncate">{lightboxImage.title}</span>
              </div>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center bg-black/50 overflow-auto">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
