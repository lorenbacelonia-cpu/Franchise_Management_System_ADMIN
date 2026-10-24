import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { 
  VehicleCategory, 
  FranchiseRecord, 
  PendingReview, 
  ViolationRecord, 
  PassengerComplaint, 
  ComplaintChatMessage,
  ActiveModule,
  AdminUser,
  DeletionLog
} from '../types';
import { initialFranchises } from '../data/mockData';
import { buildPermanentQrPayload, cleanFare, getDefaultFareMatrix, resolveFranchiseStatus } from '../utils/fareUtils';
import { 
  fetchFranchiseRecordsFromSupabase, 
  saveFranchiseRecordInSupabase, 
  savePermanentQRCodeInSupabase,
  updateFranchiseQrInSupabase,
  saveFranchiseRenewalInSupabase,
  syncExpiredFranchiseRecordsInSupabase,
  saveViolationInSupabase,
  fetchViolationsFromSupabase,
  updateViolationStatusInSupabase,
  saveDriverRegistryUpdateInSupabase,
  saveDeactivationInSupabase,
  fetchPassengerComplaintsFromSupabase,
  updatePassengerComplaintStatusInSupabase,
  saveComplaintReplyInSupabase,
  deletePassengerComplaintFromSupabase,
  deleteViolationInSupabase,
  deleteFranchiseRecordInSupabase,
  fetchPendingReviewsFromSupabase,
  updatePendingReviewStatusInSupabase
} from '../lib/supabaseClient';

interface DeletionNotice {
  message: string;
  deletedBy: string;
  timestamp: string;
  recordType: string;
}

interface FranchiseContextType {
  vehicleCategory: VehicleCategory;
  setVehicleCategory: (cat: VehicleCategory) => void;
  activeModule: ActiveModule;
  setActiveModule: (mod: ActiveModule) => void;
  franchises: FranchiseRecord[];
  pendingReviews: PendingReview[];
  violations: ViolationRecord[];
  complaints: PassengerComplaint[];
  deletionLogs: DeletionLog[];
  currentAdmin: AdminUser;
  setCurrentAdmin: (admin: AdminUser) => void;
  lastDeletionNotice: DeletionNotice | null;
  clearDeletionNotice: () => void;
  clearDeletionLogs: () => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedReview: PendingReview | null;
  setSelectedReview: (review: PendingReview | null) => void;
  selectedFranchiseId: string | null;
  setSelectedFranchiseId: (id: string | null) => void;
  
  // Real-time Database Sync status & triggers
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  syncFromDatabase: () => Promise<void>;

  // Actions
  addFranchise: (newRecord: Omit<FranchiseRecord, 'id' | 'qrCodeData' | 'violationsCount' | 'status' | 'documentsVerified'>) => Promise<string>;
  deleteFranchise: (id: string, customReason?: string) => Promise<void>;
  generatePermanentQr: (id: string) => Promise<void>;
  generateAllPermanentQr: () => Promise<void>;
  renewFranchise: (id: string, renewalData?: { newExpiry?: string; orNumber?: string; amountPaid?: number }) => Promise<void>;
  deactivateFranchise: (id: string, reason?: string) => Promise<void>;
  addViolation: (newViol: Omit<ViolationRecord, 'id' | 'dateSubmitted' | 'status'>) => Promise<void>;
  updateViolationStatus: (id: string, status: 'Pending' | 'Settled' | 'Under Investigation', remarks?: string) => Promise<void>;
  deleteViolation: (id: string, customReason?: string) => Promise<void>;
  updateComplaintStatus: (id: string, status: 'Under Investigation' | 'Resolved' | 'Escalated', adminRemarks?: string) => Promise<void>;
  deleteComplaint: (id: string, customReason?: string) => Promise<void>;
  addComplaintReply: (complaintId: string, message: string) => Promise<void>;
  updateDriver: (mtopNumber: string, driverData: { driverName: string; licenseNo?: string; contact?: string; address?: string; availability?: string }) => Promise<void>;
  approveReview: (reviewId: string) => Promise<void>;
  rejectReview: (reviewId: string, notes: string) => Promise<void>;
}

const FranchiseContext = createContext<FranchiseContextType | undefined>(undefined);

const STORAGE_KEY_FRANCHISES = 'tabaco_trd_franchises_v5';
const STORAGE_KEY_DELETION_LOGS = 'tabaco_trd_deletion_logs_v2';
const STORAGE_KEY_ADMIN_USER = 'tabaco_trd_admin_user_v2';

const LEGACY_MOCK_IDS = new Set(['fr-101', 'fr-102', 'fr-103', 'fr-201', 'fr-202']);

export const FranchiseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategory>('Tricycle');
  const [activeModule, setActiveModule] = useState<ActiveModule>('overview');

  // Purge any stale local mock storage from previous versions
  useEffect(() => {
    try {
      localStorage.removeItem('tabaco_trd_franchises_v2');
      localStorage.removeItem('tabaco_trd_franchises_v3');
      localStorage.removeItem('tabaco_trd_violations_v2');
      localStorage.removeItem('tabaco_trd_franchises_v4');
      localStorage.removeItem('tabaco_trd_deletion_logs_v2');
    } catch {}
  }, []);

  // Franchise records with local persistence + cloud sync (empty by default, strictly submitted drivers)
  const [franchises, setFranchises] = useState<FranchiseRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_FRANCHISES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const realOnly = parsed.filter(f => !LEGACY_MOCK_IDS.has(f.id)).map(f => {
            const resolvedStatus = resolveFranchiseStatus(f.status, f.expirationDate);
            const updated = { ...f, status: resolvedStatus };
            return { ...updated, qrCodeData: buildPermanentQrPayload(updated) };
          });
          return realOnly;
        }
      }
    } catch (e) {
      console.warn('Error reading franchises from localStorage:', e);
    }
    return []; // Clean slate
    return initialFranchises.map(f => {
      const resolvedStatus = resolveFranchiseStatus(f.status, f.expirationDate);
      const updated = { ...f, status: resolvedStatus };
      return { ...updated, qrCodeData: buildPermanentQrPayload(updated) };
    });
  });

  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [violations, setViolations] = useState<ViolationRecord[]>([]);
  const [complaints, setComplaints] = useState<PassengerComplaint[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true); // Default logged in
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReview, setSelectedReview] = useState<PendingReview | null>(null);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string | null>(null);

  const defaultAdminUser: AdminUser = {
    adminId: 'ADM-2026-001',
    name: 'TRD Chief Administrator',
    email: 'admin@franchise.gov.ph',
    role: 'System Administrator',
  };

  const [currentAdmin, setCurrentAdmin] = useState<AdminUser>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ADMIN_USER);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Error reading admin user from localStorage:', e);
    }
    return defaultAdminUser;
  });

  const [deletionLogs, setDeletionLogs] = useState<DeletionLog[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DELETION_LOGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading deletion logs from localStorage:', e);
    }
    return [];
  });

  const [lastDeletionNotice, setLastDeletionNotice] = useState<DeletionNotice | null>(null);

  const clearDeletionNotice = () => setLastDeletionNotice(null);
  const clearDeletionLogs = () => {
    setDeletionLogs([]);
    try {
      localStorage.removeItem(STORAGE_KEY_DELETION_LOGS);
    } catch {}
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FRANCHISES, JSON.stringify(franchises));
    } catch (e) {
      console.warn('Error saving franchises to localStorage:', e);
    }
  }, [franchises]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DELETION_LOGS, JSON.stringify(deletionLogs));
    } catch (e) {
      console.warn('Error saving deletion logs to localStorage:', e);
    }
  }, [deletionLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ADMIN_USER, JSON.stringify(currentAdmin));
    } catch (e) {
      console.warn('Error saving current admin to localStorage:', e);
    }
  }, [currentAdmin]);

  // Master Synchronizer with Supabase Database (non-destructive merge)
  const syncFromDatabase = useCallback(async () => {
    setIsSyncing(true);
    try {
      const [dbRecords, dbViolations, dbComplaints, dbReviews] = await Promise.all([
        fetchFranchiseRecordsFromSupabase(vehicleCategory),
        fetchViolationsFromSupabase(vehicleCategory),
        fetchPassengerComplaintsFromSupabase(),
        fetchPendingReviewsFromSupabase()
      ]);

      // Synchronize live database records with state
      if (Array.isArray(dbRecords)) {
        if (dbRecords.length > 0) {
          syncExpiredFranchiseRecordsInSupabase(dbRecords, vehicleCategory).catch(err => {
            console.warn('Auto-sync expired records notice:', err);
          });
          setFranchises(prev => {
            const otherCategory = prev.filter(p => p.vehicleCategory !== vehicleCategory);
            return [...dbRecords, ...otherCategory];
          });
        } else {
          setFranchises(prev => prev.filter(p => p.vehicleCategory !== vehicleCategory));
        }
      }

      if (Array.isArray(dbViolations)) {
        setViolations(dbViolations);
      }
      if (Array.isArray(dbReviews)) {
        setPendingReviews(dbReviews);
      }
      if (Array.isArray(dbComplaints)) {
        setComplaints(dbComplaints);
      }

      // For complaints, preserve local chat replies if present
      if (false && dbComplaints && dbComplaints.length > 0) {
        setComplaints(prev => {
          const incomingComplaints = dbComplaints;
          return incomingComplaints.map(incoming => {
            const existing = prev.find(p => p.id === incoming.id);
            if (existing) {
              const existingIds = new Set((existing.chatMessages || []).map(m => m.id));
              const newMsgs = (incoming.chatMessages || []).filter(m => !existingIds.has(m.id));
              // Ensure an active Escalated or Resolved admin decision is NEVER overwritten with stale Under Investigation
              const resolvedStatus = (incoming.status === 'Under Investigation' && (existing.status === 'Resolved' || existing.status === 'Escalated'))
                ? existing.status
                : (incoming.status || existing.status);

              return {
                ...incoming,
                status: resolvedStatus,
                adminRemarks: incoming.adminRemarks || existing.adminRemarks,
                evidenceImage: incoming.evidenceImage || existing.evidenceImage,
                evidenceFilename: incoming.evidenceFilename || existing.evidenceFilename,
                chatMessages: [
                  ...(existing.chatMessages || []).map(m => {
                    const matchedIncoming = (incoming.chatMessages || []).find(im => im.id === m.id);
                    return matchedIncoming?.image ? { ...m, image: matchedIncoming.image, filename: matchedIncoming.filename || m.filename } : m;
                  }),
                  ...newMsgs
                ],
              };
            }
            return incoming;
          });
        });
      }

      setLastSyncedAt(new Date());
    } catch (error) {
      console.error('Error synchronizing with Supabase database:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [vehicleCategory]);

  // Sync live records from Supabase tables on mount, when vehicleCategory changes, and every 5 seconds
  useEffect(() => {
    syncFromDatabase();
    const intervalId = setInterval(syncFromDatabase, 5000);
    return () => clearInterval(intervalId);
  }, [syncFromDatabase]);

  const addFranchise = async (data: Omit<FranchiseRecord, 'id' | 'qrCodeData' | 'violationsCount' | 'status' | 'documentsVerified'>): Promise<string> => {
    let id = `fr-${Date.now()}`;
    const targetCategory = data.vehicleCategory || vehicleCategory;
    const catDefaultMatrix = getDefaultFareMatrix(targetCategory);
    const resolvedMatrix = data.fareMatrix && data.fareMatrix.length > 0 ? data.fareMatrix : catDefaultMatrix;
    const baseFare = resolvedMatrix[0]?.regularFare 
      ? cleanFare(resolvedMatrix[0].regularFare, targetCategory === 'Pedicab' ? '15.00' : '20.00') 
      : (targetCategory === 'Pedicab' ? '15.00' : '20.00');
    const resolvedStandardFare = data.standardFare && !data.standardFare.includes('50.00 Minimum')
      ? data.standardFare 
      : `₱${baseFare} Minimum`;

    const initialStatus = resolveFranchiseStatus('Active', data.expirationDate);

    let newRecord: FranchiseRecord = {
      ...data,
      id,
      vehicleCategory: targetCategory,
      fareMatrix: resolvedMatrix,
      standardFare: resolvedStandardFare,
      qrCodeData: '',
      violationsCount: 0,
      status: initialStatus,
      documentsVerified: true,
      hasPermanentQr: false,
    };
    newRecord.qrCodeData = buildPermanentQrPayload(newRecord);

    // Save to Supabase (and obtain true UUID if returned)
    try {
      const saved = await saveFranchiseRecordInSupabase(newRecord, data.vehicleCategory);
      if (Array.isArray(saved) && saved.length > 0 && saved[0]?.id) {
        id = saved[0].id;
        newRecord.id = id;
        newRecord.qrCodeData = buildPermanentQrPayload(newRecord);
      }
    } catch (err) {
      console.warn('Could not post franchise to remote Supabase, saved securely in local system registry:', err);
    }

    // Immediately store in local state & localStorage so it appears in records right away
    setFranchises(prev => {
      const plate = (newRecord.cityPlateNumber || newRecord.mtopNumber).toLowerCase();
      const filtered = prev.filter(f => f.id !== id && (f.cityPlateNumber || f.mtopNumber).toLowerCase() !== plate);
      return [newRecord, ...filtered];
    });
    setSelectedFranchiseId(id);

    return id;
  };

  const deleteFranchise = async (id: string, customReason?: string) => {
    const target = franchises.find(f => f.id === id);
    if (!target) return;

    const removerLabel = `${currentAdmin.name} (${currentAdmin.adminId})`;
    const todayIso = new Date().toISOString();
    const plate = target.cityPlateNumber || target.mtopNumber || 'N/A';

    const newLog: DeletionLog = {
      id: `del-fran-${Date.now()}`,
      recordType: 'Franchise Record',
      itemTitle: `${plate} — ${target.driverName} (Operator: ${target.operatorName})`,
      cityPlateNumber: plate,
      vehicleCategory: target.vehicleCategory,
      issueOrViolationType: 'Franchise Record Removal',
      deletedBy: removerLabel,
      deletedByEmail: currentAdmin.email,
      deletedAt: todayIso,
      originalRecordDetails: target,
      reason: customReason || 'Authorized administrator franchise record removal'
    };

    setDeletionLogs(prev => [newLog, ...prev]);
    setLastDeletionNotice({
      message: `Franchise Record for ${plate} (${target.driverName}) has been permanently removed by ${removerLabel}.`,
      deletedBy: removerLabel,
      timestamp: todayIso,
      recordType: 'Franchise Record'
    });

    setFranchises(prev => prev.filter(f => f.id !== id && f.mtopNumber !== plate && f.cityPlateNumber !== plate));
    await deleteFranchiseRecordInSupabase(id, plate, target.vehicleCategory);
  };

  const generatePermanentQr = async (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    const target = franchises.find(f => f.id === id);
    if (target) {
      const updatedTarget: FranchiseRecord = {
        ...target,
        hasPermanentQr: true,
        qrGeneratedDate: today,
      };
      const fullQrPayload = buildPermanentQrPayload(updatedTarget);
      
      await savePermanentQRCodeInSupabase({
        franchise_id: target.id,
        mtop_number: target.mtopNumber,
        city_plate_number: target.cityPlateNumber || target.mtopNumber,
        driver_name: target.driverName,
        driver_license_no: target.driverLicenseNo || 'N02-18-994820',
        qr_payload: fullQrPayload,
      }, target.vehicleCategory);
      await updateFranchiseQrInSupabase(target.mtopNumber, today, target.vehicleCategory);
    }
    setFranchises(prev => prev.map(item => {
      if (item.id === id) {
        const updated = {
          ...item,
          hasPermanentQr: true,
          qrGeneratedDate: today,
        };
        return {
          ...updated,
          qrCodeData: buildPermanentQrPayload(updated),
        };
      }
      return item;
    }));
  };

  const generateAllPermanentQr = async () => {
    const today = new Date().toISOString().split('T')[0];
    for (const target of franchises) {
      const updatedTarget: FranchiseRecord = {
        ...target,
        hasPermanentQr: true,
        qrGeneratedDate: target.qrGeneratedDate || today,
      };
      const fullQrPayload = buildPermanentQrPayload(updatedTarget);

      await savePermanentQRCodeInSupabase({
        franchise_id: target.id,
        mtop_number: target.mtopNumber,
        city_plate_number: target.cityPlateNumber || target.mtopNumber,
        driver_name: target.driverName,
        driver_license_no: target.driverLicenseNo || 'N02-18-994820',
        qr_payload: fullQrPayload,
      }, target.vehicleCategory);
      await updateFranchiseQrInSupabase(target.mtopNumber, today, target.vehicleCategory);
    }
    setFranchises(prev => prev.map(item => {
      const updated = {
        ...item,
        hasPermanentQr: true,
        qrGeneratedDate: item.qrGeneratedDate || today,
      };
      return {
        ...updated,
        qrCodeData: buildPermanentQrPayload(updated),
      };
    }));
  };

  const renewFranchise = async (id: string, renewalData?: { newExpiry?: string; orNumber?: string; amountPaid?: number }) => {
    const target = franchises.find(f => f.id === id);
    const newExpiry = renewalData?.newExpiry || '2027-01-15';
    if (target) {
      await saveFranchiseRenewalInSupabase({
        mtop_number: target.mtopNumber,
        city_plate_number: target.cityPlateNumber || target.mtopNumber,
        operator_name: target.operatorName,
        driver_name: target.driverName,
        previous_expiry: target.expirationDate,
        new_expiry: newExpiry,
        amount_paid: renewalData?.amountPaid,
        or_number: renewalData?.orNumber
      }, target.vehicleCategory);
    }

    setFranchises(prev => prev.map(item => {
      if (item.id === id) {
        const updated = {
          ...item,
          status: 'Active' as const,
          expirationDate: newExpiry,
        };
        return {
          ...updated,
          qrCodeData: buildPermanentQrPayload(updated),
        };
      }
      return item;
    }));
  };

  const deactivateFranchise = async (id: string, reason: string = 'Administrative Deactivation') => {
    const target = franchises.find(f => f.id === id);
    if (target) {
      await saveDeactivationInSupabase({
        mtop_number: target.mtopNumber,
        operator_name: target.operatorName,
        driver_name: target.driverName,
        reason: reason,
      }, target.vehicleCategory);
    }

    setFranchises(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'Deactivated',
        };
      }
      return item;
    }));
  };

  const addViolation = async (data: Omit<ViolationRecord, 'id' | 'dateSubmitted' | 'status'>) => {
    const newViol: ViolationRecord = {
      ...data,
      id: `viol-${Date.now()}`,
      dateSubmitted: new Date().toISOString().split('T')[0],
      status: 'Pending',
    };
    setViolations(prev => [newViol, ...prev]);

    const target = franchises.find(f => f.id === data.franchiseId || f.mtopNumber === data.mtopNumber);
    const cat = target?.vehicleCategory || vehicleCategory;
    await saveViolationInSupabase(newViol, cat);

    setFranchises(prev => prev.map(item => {
      if (item.id === data.franchiseId || item.mtopNumber === data.mtopNumber) {
        return {
          ...item,
          violationsCount: item.violationsCount + 1,
        };
      }
      return item;
    }));
  };

  const updateViolationStatus = async (id: string, status: 'Pending' | 'Settled' | 'Under Investigation', remarks?: string) => {
    const targetViol = violations.find(v => v.id === id);
    if (targetViol) {
      const targetFranchise = franchises.find(f => f.mtopNumber === targetViol.cityPlateNumber || f.id === targetViol.franchiseId);
      const cat = targetFranchise?.vehicleCategory || (targetViol.cityPlateNumber.startsWith('P-') ? 'Pedicab' : 'Tricycle');
      await updateViolationStatusInSupabase(id, status, cat, {
        enforcerName: targetViol.enforcerName,
        reportedBy: targetViol.reportedBy,
        plateNumber: targetViol.cityPlateNumber || targetViol.mtopNumber,
        violationType: targetViol.violationType,
        remarks: remarks || targetViol.remarks
      });
    }
    setViolations(prev => prev.map(v => v.id === id ? { ...v, status, remarks: remarks || v.remarks } : v));
  };

  const updateDriver = async (mtopNumber: string, driverData: { driverName: string; licenseNo?: string; contact?: string; address?: string; availability?: string }) => {
    const target = franchises.find(f => f.mtopNumber === mtopNumber);
    const cat = target?.vehicleCategory || vehicleCategory;
    await saveDriverRegistryUpdateInSupabase({
      mtop_number: mtopNumber,
      driver_name: driverData.driverName,
      license_no: driverData.licenseNo,
      contact_number: driverData.contact,
      residential_address: driverData.address,
      availability: driverData.availability
    }, cat);

    setFranchises(prev => prev.map(item => {
      if (item.mtopNumber === mtopNumber) {
        return {
          ...item,
          driverName: driverData.driverName || item.driverName,
          driverLicenseNo: driverData.licenseNo || item.driverLicenseNo,
          operatorContact: driverData.contact || item.operatorContact,
          availability: driverData.availability || item.availability
        };
      }
      return item;
    }));
  };

  const approveReview = async (reviewId: string) => {
    const target = pendingReviews.find(r => r.id === reviewId);
    if (!target) return;

    setPendingReviews(prev => prev.map(r => 
      r.id === reviewId ? { ...r, status: 'Approved' as const } : r
    ));

    const plate = target.cityPlateAssigned || target.mtopAssigned || '1243';
    const newId = await addFranchise({
      cityPlateNumber: plate,
      mtopNumber: plate,
      plateNumber: target.vehicleCategory === 'Tricycle' ? `${plate}-TR` : `${plate}-PED`,
      vehicleCategory: target.vehicleCategory,
      makeModel: target.vehicleCategory === 'Tricycle' ? 'Kawasaki Barako 175' : 'Custom Passenger Pedicab',
      engineNumber: 'ENG-AUTO-01',
      chassisNumber: 'CHS-AUTO-01',
      operatorName: target.applicantName,
      operatorContact: target.contactNumber,
      operatorAddress: target.address,
      driverName: target.applicantName,
      driverLicenseNo: 'N01-20-998811',
      licenseExpiry: '2028-12-31',
      registrationDate: new Date().toISOString().split('T')[0],
      expirationDate: '2027-01-15',
    });

    setSelectedFranchiseId(newId);

    // Sync approval and notify mobile applicant
    await updatePendingReviewStatusInSupabase(reviewId, 'Approved', 'Franchise application approved and license issued.', {
      applicantName: target.applicantName,
      cityPlateAssigned: plate,
      vehicleCategory: target.vehicleCategory
    });
  };

  const rejectReview = async (reviewId: string, notes: string) => {
    const target = pendingReviews.find(r => r.id === reviewId);
    setPendingReviews(prev => prev.map(r => 
      r.id === reviewId ? { ...r, status: 'Rejected' as const, reviewNotes: notes } : r
    ));

    // Sync rejection and notify mobile applicant
    await updatePendingReviewStatusInSupabase(reviewId, 'Rejected', notes, {
      applicantName: target?.applicantName,
      cityPlateAssigned: target?.cityPlateAssigned || target?.mtopAssigned,
      vehicleCategory: target?.vehicleCategory
    });
  };

  const deleteViolation = async (id: string, customReason?: string) => {
    const target = violations.find(v => v.id === id);
    if (!target) return;

    const removerLabel = `${currentAdmin.name} (${currentAdmin.adminId})`;
    const todayIso = new Date().toISOString();

    const newLog: DeletionLog = {
      id: `del-viol-${Date.now()}`,
      recordType: 'Violation Citation',
      itemTitle: `${target.cityPlateNumber || target.mtopNumber} — ${target.violationType} (Fine: ₱${Number(target.fineAmount || 0).toLocaleString()})`,
      cityPlateNumber: target.cityPlateNumber || target.mtopNumber || 'N/A',
      vehicleCategory: (target.cityPlateNumber?.startsWith('P-') ? 'Pedicab' : vehicleCategory),
      issueOrViolationType: target.violationType,
      deletedBy: removerLabel,
      deletedByEmail: currentAdmin.email,
      deletedAt: todayIso,
      originalRecordDetails: target,
      reason: customReason || 'Authorized administrator citation removal'
    };

    setDeletionLogs(prev => [newLog, ...prev]);
    setLastDeletionNotice({
      message: `Violation Citation "${target.violationType}" for ${target.cityPlateNumber} has been removed from the active system by ${removerLabel}.`,
      deletedBy: removerLabel,
      timestamp: todayIso,
      recordType: 'Violation Citation'
    });

    setViolations(prev => prev.filter(v => v.id !== id));
    await deleteViolationInSupabase(id, vehicleCategory, (target as any)?.evidenceImage || (target as any)?.evidence_image);
  };

  const updateComplaintStatus = async (
    id: string, 
    status: 'Under Investigation' | 'Resolved' | 'Escalated', 
    adminRemarks?: string
  ) => {
    const target = complaints.find(c => c.id === id);
    setComplaints(prev => prev.map(c => 
      c.id === id ? { ...c, status, adminRemarks: adminRemarks || c.adminRemarks } : c
    ));
    await updatePassengerComplaintStatusInSupabase(id, status, {
      complainantName: target?.complainantName,
      cityPlateNumber: target?.cityPlateNumber,
      issueType: target?.issueType,
      adminRemarks: adminRemarks || target?.adminRemarks
    });
  };

  const deleteComplaint = async (id: string, customReason?: string) => {
    const target = complaints.find(c => c.id === id);
    if (!target) return;

    const removerLabel = `${currentAdmin.name} (${currentAdmin.adminId})`;
    const todayIso = new Date().toISOString();

    const newLog: DeletionLog = {
      id: `del-comp-${Date.now()}`,
      recordType: 'Passenger Complaint',
      itemTitle: `Complaint on Plate ${target.cityPlateNumber} — ${target.issueType} (Complainant: ${target.complainantName})`,
      cityPlateNumber: target.cityPlateNumber || target.mtopNumber || 'N/A',
      vehicleCategory: target.vehicleCategory || vehicleCategory,
      issueOrViolationType: target.issueType,
      deletedBy: removerLabel,
      deletedByEmail: currentAdmin.email,
      deletedAt: todayIso,
      originalRecordDetails: target,
      reason: customReason || 'Authorized administrator complaint removal'
    };

    setDeletionLogs(prev => [newLog, ...prev]);
    setLastDeletionNotice({
      message: `Passenger Report "${target.issueType}" on ${target.cityPlateNumber} has been removed from the active system by ${removerLabel}.`,
      deletedBy: removerLabel,
      timestamp: todayIso,
      recordType: 'Passenger Complaint'
    });

    setComplaints(prev => prev.filter(c => c.id !== id));
    await deletePassengerComplaintFromSupabase(id, target?.evidenceImage);
  };

  const addComplaintReply = async (complaintId: string, message: string) => {
    const target = complaints.find(c => c.id === complaintId);
    const newMsg: ComplaintChatMessage = {
      id: `msg-admin-${Date.now()}`,
      sender: 'admin',
      senderName: currentAdmin.name || 'TRD Admin',
      message,
      timestamp: new Date().toISOString(),
    };
    setComplaints(prev => prev.map(c =>
      c.id === complaintId
        ? { ...c, chatMessages: [...(c.chatMessages || []), newMsg] }
        : c
    ));

    await saveComplaintReplyInSupabase(complaintId, message, currentAdmin.name || 'TRD Admin', {
      complainantName: target?.complainantName,
      cityPlateNumber: target?.cityPlateNumber
    });
  };

  return (
    <FranchiseContext.Provider
      value={{
        vehicleCategory,
        setVehicleCategory,
        activeModule,
        setActiveModule,
        franchises,
        pendingReviews,
        violations,
        complaints,
        deletionLogs,
        currentAdmin,
        setCurrentAdmin,
        lastDeletionNotice,
        clearDeletionNotice,
        clearDeletionLogs,
        isAuthenticated,
        setIsAuthenticated,
        searchQuery,
        setSearchQuery,
        selectedReview,
        setSelectedReview,
        selectedFranchiseId,
        setSelectedFranchiseId,
        isSyncing,
        lastSyncedAt,
        syncFromDatabase,
        addFranchise,
        deleteFranchise,
        generatePermanentQr,
        generateAllPermanentQr,
        renewFranchise,
        deactivateFranchise,
        addViolation,
        updateViolationStatus,
        deleteViolation,
        updateComplaintStatus,
        deleteComplaint,
        addComplaintReply,
        updateDriver,
        approveReview,
        rejectReview,
      }}
    >
      {children}
    </FranchiseContext.Provider>
  );
};

export const useFranchise = () => {
  const context = useContext(FranchiseContext);
  if (!context) {
    throw new Error('useFranchise must be used within a FranchiseProvider');
  }
  return context;
};
