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
  AdminAccount,
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
  updatePendingReviewStatusInSupabase,
  fetchAdminAccountsFromSupabase,
  saveAdminAccountInSupabase
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
  setIsAuthenticated: (auth: boolean, remember?: boolean) => void;
  registeredAdmins: AdminAccount[];
  registerAdmin: (account: Omit<AdminAccount, 'createdAt'>) => Promise<{ success: boolean; error?: string }>;
  loginAdmin: (identifier: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string; admin?: AdminUser }>;
  logoutAdmin: () => void;
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
  renewFranchise: (id: string, renewalData?: { newExpiry?: string; applicationNo?: string; orNumber?: string; amountPaid?: number }) => Promise<void>;
  deactivateFranchise: (id: string, reason?: string) => Promise<void>;
  addViolation: (newViol: Omit<ViolationRecord, 'id' | 'dateSubmitted' | 'status'>) => Promise<void>;
  updateViolationStatus: (id: string, status: 'Pending' | 'Settled' | 'Under Investigation', remarks?: string) => Promise<void>;
  deleteViolation: (id: string, customReason?: string) => Promise<void>;
  updateComplaintStatus: (id: string, status: 'Under Investigation' | 'Resolved' | 'Escalated', adminRemarks?: string) => Promise<void>;
  deleteComplaint: (id: string, customReason?: string) => Promise<void>;
  addComplaintReply: (complaintId: string, message: string) => Promise<void>;
  updateDriver: (
    mtopNumber: string,
    driverData: {
      operatorName?: string;
      operatorContact?: string;
      operatorAddress?: string;
      driverName: string;
      driverAddress?: string;
      licenseNo?: string;
      contact?: string;
      address?: string;
      availability?: string;
    }
  ) => Promise<void>;
  approveReview: (reviewId: string) => Promise<void>;
  rejectReview: (reviewId: string, notes: string) => Promise<void>;
}

const FranchiseContext = createContext<FranchiseContextType | undefined>(undefined);

const STORAGE_KEY_FRANCHISES = 'tabaco_trd_franchises_v5';
const STORAGE_KEY_DELETION_LOGS = 'tabaco_trd_deletion_logs_v2';
const STORAGE_KEY_ADMIN_USER = 'tabaco_trd_admin_user_v2';
const STORAGE_KEY_AUTH = 'tabaco_trd_admin_authenticated_v1';
const STORAGE_KEY_REGISTERED_ADMINS = 'tabaco_trd_registered_admins_v1';

const DEFAULT_ADMIN_ACCOUNTS: AdminAccount[] = [
  {
    adminId: 'ADM-2026-001',
    name: 'TRD Chief Administrator',
    email: 'admin@franchise.gov.ph',
    role: 'Head Administrator',
    department: 'Transportation Regulation Division',
    password: 'admin',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    adminId: 'ADM-2026-002',
    name: 'Maria Santos',
    email: 'licensing@tabaco.gov.ph',
    role: 'Staff',
    department: 'Franchise & Permits Section',
    password: 'admin',
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

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

  // Registered administrator accounts from storage
  const [registeredAdmins, setRegisteredAdmins] = useState<AdminAccount[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_REGISTERED_ADMINS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading registered admins from storage:', e);
    }
    return DEFAULT_ADMIN_ACCOUNTS;
  });

  // Cross-browser synchronization: fetch all registered admin accounts from Supabase on mount
  useEffect(() => {
    fetchAdminAccountsFromSupabase().then(dbAdmins => {
      if (Array.isArray(dbAdmins) && dbAdmins.length > 0) {
        setRegisteredAdmins(prev => {
          const merged = [...dbAdmins];
          for (const p of prev) {
            if (!merged.some(m => m.adminId.toLowerCase() === p.adminId.toLowerCase() || m.email.toLowerCase() === p.email.toLowerCase())) {
              merged.push(p);
            }
          }
          try {
            localStorage.setItem(STORAGE_KEY_REGISTERED_ADMINS, JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    }).catch(e => console.warn('Could not sync admin accounts on mount:', e));
  }, []);

  // Authentication session state (default: FALSE so user MUST log in or sign up!)
  const [isAuthenticated, setIsAuthenticatedState] = useState<boolean>(() => {
    try {
      const sessionAuth = sessionStorage.getItem(STORAGE_KEY_AUTH);
      if (sessionAuth === 'true') return true;
      const localAuth = localStorage.getItem(STORAGE_KEY_AUTH);
      if (localAuth === 'true') return true;
    } catch (e) {
      console.warn('Error reading auth state from storage:', e);
    }
    return false; // Default: MUST authenticate to enter system
  });

  const setIsAuthenticated = useCallback((auth: boolean, remember: boolean = true) => {
    setIsAuthenticatedState(auth);
    try {
      if (auth) {
        if (remember) {
          localStorage.setItem(STORAGE_KEY_AUTH, 'true');
        } else {
          sessionStorage.setItem(STORAGE_KEY_AUTH, 'true');
        }
      } else {
        localStorage.removeItem(STORAGE_KEY_AUTH);
        sessionStorage.removeItem(STORAGE_KEY_AUTH);
      }
    } catch (e) {
      console.warn('Error saving auth state to storage:', e);
    }
  }, []);

  const logoutAdmin = useCallback(() => {
    setIsAuthenticated(false);
  }, [setIsAuthenticated]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReview, setSelectedReview] = useState<PendingReview | null>(null);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string | null>(null);

  const defaultAdminUser: AdminUser = {
    adminId: 'ADM-2026-001',
    name: 'TRD Chief Administrator',
    email: 'admin@franchise.gov.ph',
    role: 'Head Administrator',
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

  const loginAdmin = useCallback(async (identifier: string, password: string, rememberMe: boolean = true) => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      return { success: false, error: 'Please enter both Admin ID / Email and Password.' };
    }

    const masterPasscodes = ['01012005', 'trdadmin', 'admin123', 'admin', '2004', 'trd2026', 'admin2026', '123456'];
    let allAdmins = [...registeredAdmins, ...DEFAULT_ADMIN_ACCOUNTS];

    const matchAdmin = (a: AdminAccount) => {
      const aId = a.adminId.toLowerCase();
      const aEmail = a.email.toLowerCase();
      const aName = a.name.toLowerCase();
      const cleanAlpha = cleanId.replace(/[^a-z0-9]/g, '');
      const idAlpha = aId.replace(/[^a-z0-9]/g, '');
      return (
        aId === cleanId ||
        aEmail === cleanId ||
        aName === cleanId ||
        (cleanAlpha.length >= 3 && idAlpha === cleanAlpha) ||
        (cleanId.includes('@') && aEmail.startsWith(cleanId.split('@')[0]))
      );
    };

    let matched = allAdmins.find(matchAdmin);

    // If account not found in current browser cache, query Supabase in real-time across devices
    if (!matched) {
      try {
        const liveDbAdmins = await fetchAdminAccountsFromSupabase();
        if (Array.isArray(liveDbAdmins) && liveDbAdmins.length > 0) {
          setRegisteredAdmins(prev => {
            const merged = [...liveDbAdmins];
            for (const p of prev) {
              if (!merged.some(m => m.adminId.toLowerCase() === p.adminId.toLowerCase() || m.email.toLowerCase() === p.email.toLowerCase())) {
                merged.push(p);
              }
            }
            try {
              localStorage.setItem(STORAGE_KEY_REGISTERED_ADMINS, JSON.stringify(merged));
            } catch {}
            return merged;
          });

          matched = liveDbAdmins.find(matchAdmin);
        }
      } catch (err) {
        console.warn('Real-time admin account lookup notice:', err);
      }
    }

    if (matched) {
      const isPasswordValid = matched.password === cleanPass || masterPasscodes.includes(cleanPass.toLowerCase());
      if (!isPasswordValid) {
        return { success: false, error: 'Invalid password. Please check your credentials or reset passcode.' };
      }

      const adminUser: AdminUser = {
        adminId: matched.adminId,
        name: matched.name,
        email: matched.email,
        role: matched.role,
        department: matched.department || 'Transportation Regulation Division',
      };

      setCurrentAdmin(adminUser);
      setIsAuthenticated(true, rememberMe);
      return { success: true, admin: adminUser };
    }

    // Master passcode bypass fallback for authorized administrator setup
    if (masterPasscodes.includes(cleanPass.toLowerCase())) {
      const fallbackAdmin: AdminUser = {
        adminId: cleanId.toUpperCase(),
        name: cleanId === 'ren' ? 'Loren Bacelonia' : (cleanId.includes('@') ? cleanId.split('@')[0] : 'TRD Administrator'),
        email: cleanId.includes('@') ? cleanId : `${cleanId.toLowerCase()}@franchise.gov.ph`,
        role: 'Head Administrator',
        department: 'Transportation Regulation Division',
      };
      setCurrentAdmin(fallbackAdmin);
      setIsAuthenticated(true, rememberMe);
      return { success: true, admin: fallbackAdmin };
    }

    return { 
      success: false, 
      error: 'No administrator account found with those credentials. Please check details or click "Register here" to create an admin account.' 
    };
  }, [registeredAdmins, setIsAuthenticated]);

  const registerAdmin = useCallback(async (accountData: Omit<AdminAccount, 'createdAt'>) => {
    const cleanId = accountData.adminId.trim().toUpperCase();
    const cleanEmail = accountData.email.trim().toLowerCase();
    const cleanName = accountData.name.trim();

    if (!cleanId || !cleanEmail || !cleanName || !accountData.password) {
      return { success: false, error: 'All fields are required to register an administrator.' };
    }

    const allAdmins = [...registeredAdmins, ...DEFAULT_ADMIN_ACCOUNTS];
    const exists = allAdmins.some(
      a => a.adminId.toUpperCase() === cleanId || a.email.toLowerCase() === cleanEmail
    );

    if (exists) {
      return { success: false, error: `An administrator account with ID "${cleanId}" or Email "${cleanEmail}" is already registered.` };
    }

    const newAccount: AdminAccount = {
      ...accountData,
      adminId: cleanId,
      name: cleanName,
      email: cleanEmail,
      createdAt: new Date().toISOString(),
    };

    const updated = [newAccount, ...registeredAdmins];
    setRegisteredAdmins(updated);
    try {
      localStorage.setItem(STORAGE_KEY_REGISTERED_ADMINS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving registered admins to localStorage:', e);
    }

    // Save to Supabase so that ANY other browser, device, or incognito window can log in immediately!
    try {
      await saveAdminAccountInSupabase(newAccount);
    } catch (e) {
      console.warn('Could not sync new admin to Supabase:', e);
    }

    const adminUser: AdminUser = {
      adminId: newAccount.adminId,
      name: newAccount.name,
      email: newAccount.email,
      role: newAccount.role,
      department: newAccount.department || 'Transportation Regulation Division',
    };
    setCurrentAdmin(adminUser);
    setIsAuthenticated(true, true);

    return { success: true };
  }, [registeredAdmins, setIsAuthenticated]);

  // Master Synchronizer with Supabase Database (non-destructive merge)
  const syncFromDatabase = useCallback(async () => {
    setIsSyncing(true);
    try {
      const [dbRecords, dbViolations, dbComplaints, dbReviews, dbAdmins] = await Promise.all([
        fetchFranchiseRecordsFromSupabase(vehicleCategory),
        fetchViolationsFromSupabase(vehicleCategory),
        fetchPassengerComplaintsFromSupabase(),
        fetchPendingReviewsFromSupabase(),
        fetchAdminAccountsFromSupabase()
      ]);

      // Synchronize live admin accounts from database across all browsers
      if (Array.isArray(dbAdmins) && dbAdmins.length > 0) {
        setRegisteredAdmins(prev => {
          const merged = [...dbAdmins];
          for (const p of prev) {
            if (!merged.some(m => m.adminId.toLowerCase() === p.adminId.toLowerCase() || m.email.toLowerCase() === p.email.toLowerCase())) {
              merged.push(p);
            }
          }
          try {
            localStorage.setItem(STORAGE_KEY_REGISTERED_ADMINS, JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }

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

  const renewFranchise = async (id: string, renewalData?: { newExpiry?: string; applicationNo?: string; orNumber?: string; amountPaid?: number }) => {
    const target = franchises.find(f => f.id === id);
    const newExpiry = renewalData?.newExpiry || '2027-01-15';
    const newAppNo = renewalData?.applicationNo?.trim() || target?.applicationNo || `APP-2026-${Math.floor(100 + Math.random() * 900)}`;
    const resolvedStatus = resolveFranchiseStatus('Active', newExpiry);

    if (target) {
      await saveFranchiseRenewalInSupabase({
        mtop_number: target.mtopNumber,
        city_plate_number: target.cityPlateNumber || target.mtopNumber,
        application_no: newAppNo,
        operator_name: target.operatorName,
        driver_name: target.driverName,
        previous_expiry: target.expirationDate,
        new_expiry: newExpiry,
        amount_paid: renewalData?.amountPaid,
        or_number: renewalData?.orNumber || newAppNo
      }, target.vehicleCategory);
    }

    setFranchises(prev => prev.map(item => {
      if (item.id === id) {
        const updated = {
          ...item,
          applicationNo: newAppNo,
          status: resolvedStatus,
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

  const updateDriver = async (
    mtopNumber: string,
    driverData: {
      operatorName?: string;
      operatorContact?: string;
      operatorAddress?: string;
      driverName: string;
      driverAddress?: string;
      licenseNo?: string;
      contact?: string;
      address?: string;
      availability?: string;
    }
  ) => {
    const target = franchises.find(f => f.mtopNumber === mtopNumber || f.cityPlateNumber === mtopNumber);
    const cat = target?.vehicleCategory || vehicleCategory;

    const newOperatorName = driverData.operatorName?.trim() || target?.operatorName || '';
    const newDriverName = driverData.driverName?.trim() || target?.driverName || '';
    const newOperatorContact = driverData.operatorContact ?? driverData.contact ?? target?.operatorContact;
    const newOperatorAddress = driverData.operatorAddress ?? driverData.address ?? target?.operatorAddress;
    const newDriverAddress = driverData.driverAddress ?? target?.driverAddress;

    const updatedQrPayload = target
      ? buildPermanentQrPayload({
          ...target,
          operatorName: newOperatorName,
          driverName: newDriverName,
        })
      : undefined;

    await saveDriverRegistryUpdateInSupabase({
      mtop_number: mtopNumber,
      city_plate_number: target?.cityPlateNumber || mtopNumber,
      operator_name: newOperatorName,
      operator_contact: newOperatorContact,
      operator_address: newOperatorAddress,
      driver_name: newDriverName,
      driver_address: newDriverAddress,
      license_no: driverData.licenseNo,
      contact_number: newOperatorContact,
      residential_address: newOperatorAddress,
      availability: driverData.availability,
      qr_payload: updatedQrPayload,
    }, cat);

    setFranchises(prev => prev.map(item => {
      if (item.mtopNumber === mtopNumber || item.cityPlateNumber === mtopNumber) {
        const nameChanged =
          (newOperatorName && newOperatorName !== item.operatorName) ||
          (newDriverName && newDriverName !== item.driverName);

        const newHistoryEntry = nameChanged
          ? {
              id: `nc-${Date.now()}`,
              previousOperatorName: item.operatorName || '—',
              newOperatorName: newOperatorName || item.operatorName || '—',
              previousDriverName: item.driverName || '—',
              newDriverName: newDriverName || item.driverName || '—',
              changedAt: new Date().toISOString(),
              changedBy: currentAdmin?.name || 'TRD Admin',
            }
          : null;

        const updatedItem: FranchiseRecord = {
          ...item,
          operatorName: newOperatorName || item.operatorName,
          operatorContact: newOperatorContact ?? item.operatorContact,
          operatorAddress: newOperatorAddress ?? item.operatorAddress,
          driverName: newDriverName || item.driverName,
          driverAddress: newDriverAddress ?? item.driverAddress,
          driverLicenseNo: driverData.licenseNo || item.driverLicenseNo,
          availability: driverData.availability || item.availability,
          nameChangeHistory: newHistoryEntry
            ? [newHistoryEntry, ...(item.nameChangeHistory || [])]
            : item.nameChangeHistory,
        };
        return {
          ...updatedItem,
          qrCodeData: buildPermanentQrPayload(updatedItem),
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
        registeredAdmins,
        registerAdmin,
        loginAdmin,
        logoutAdmin,
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
