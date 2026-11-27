import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  VehicleCategory,
  FranchiseStatus,
  FareMatrixItem,
  FranchiseRecord,
  PendingReview,
  ViolationRecord,
  PassengerComplaint,
  ComplaintChatMessage,
  ActiveModule,
  AdminUser,
  AdminAccount,
  EnforcerAccount,
  PassengerAccount,
  DeletionLog,
  AdminActivityLog
} from '../types';
import { buildPermanentQrPayload, cleanFare, getDefaultFareMatrix, resolveFranchiseStatus, isRecordExpired } from '../utils/fareUtils';
import type { DateFilterState } from '../utils/dateFilter';
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
  updateFranchiseStatusInSupabase,
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
  saveAdminAccountInSupabase,
  deleteAdminAccountInSupabase,
  fetchEnforcersFromSupabase,
  saveEnforcerAccountInSupabase,
  deleteEnforcerAccountInSupabase,
  fetchPassengerAccountsFromSupabase,
  fetchAdminActivityLogsFromSupabase,
  saveAdminActivityLogInSupabase
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
  registerAdmin: (account: Omit<AdminAccount, 'createdAt'>, options?: { switchSession?: boolean }) => Promise<{ success: boolean; error?: string }>;
  deleteAdmin: (adminId: string, options?: { adminPasscode?: string }) => Promise<{ success: boolean; error?: string }>;
  enforcers: EnforcerAccount[];
  registerEnforcer: (account: Omit<EnforcerAccount, 'createdAt'>, options?: { adminPasscode?: string }) => Promise<{ success: boolean; error?: string }>;
  deleteEnforcer: (badgeNumber: string, options?: { adminPasscode?: string }) => Promise<{ success: boolean; error?: string }>;
  syncEnforcersFromDatabase: () => Promise<void>;
  passengerAccounts: PassengerAccount[];
  syncPassengerAccountsFromDatabase: () => Promise<void>;
  loginAdmin: (identifier: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string; admin?: AdminUser }>;
  loginWithEmailVerification: (emailOrId: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string; admin?: AdminUser }>;
  logoutAdmin: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedReview: PendingReview | null;
  setSelectedReview: (review: PendingReview | null) => void;
  selectedFranchiseId: string | null;
  setSelectedFranchiseId: (id: string | null) => void;

  // Dashboard Date Filter
  dateFilter: DateFilterState;
  setDateFilter: React.Dispatch<React.SetStateAction<DateFilterState>>;
  resetDateFilter: () => void;

  // Real-time Database Sync status & triggers
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  syncFromDatabase: () => Promise<void>;

  // Notification Badges per Module
  moduleBadges: Record<ActiveModule, number>;
  moduleNotificationsList: {
    module: ActiveModule;
    moduleTitle: string;
    count: number;
    description: string;
    isPersistent: boolean;
    badgeStyle: string;
  }[];
  clearModuleBadge: (mod: ActiveModule) => void;

  // Actions
  addFranchise: (newRecord: Omit<FranchiseRecord, 'id' | 'qrCodeData' | 'violationsCount' | 'status' | 'documentsVerified'>) => Promise<string>;
  deleteFranchise: (id: string, customReason?: string) => Promise<void>;
  generatePermanentQr: (id: string) => Promise<void>;
  generateAllPermanentQr: () => Promise<void>;
  renewFranchise: (id: string, renewalData?: { newExpiry?: string; applicationNo?: string; orNumber?: string; amountPaid?: number }) => Promise<void>;
  deactivateFranchise: (id: string, reason?: string) => Promise<void>;
  updateFranchiseStatus: (plateOrMtop: string, status: FranchiseStatus, reason?: string) => Promise<boolean>;
  addViolation: (newViol: Omit<ViolationRecord, 'id' | 'dateSubmitted' | 'status'>) => Promise<void>;
  updateViolationStatus: (id: string, status: 'Pending' | 'Settled', remarks?: string) => Promise<void>;
  deleteViolation: (id: string, customReason?: string) => Promise<void>;
  updateComplaintStatus: (id: string, status: 'Pending' | 'Resolved' | 'Escalated', adminRemarks?: string) => Promise<void>;
  deleteComplaint: (id: string, customReason?: string) => Promise<void>;
  addComplaintReply: (complaintId: string, message: string) => Promise<void>;
  updateDriver: (
    mtopNumber: string,
    driverData: {
      ownerLastName?: string;
      ownerFirstName?: string;
      ownerMiddleName?: string;
      ownerName?: string;
      ownerContact?: string;
      ownerAddress?: string;
      residentialAddress?: string;
      age?: string;
      beneficiaryName?: string;
      beneficiaryAddress?: string;

      operatorLastName?: string;
      operatorFirstName?: string;
      operatorMiddleName?: string;
      operatorName?: string;
      operatorContact?: string;
      operatorAddress?: string;

      driverLastName?: string;
      driverFirstName?: string;
      driverMiddleName?: string;
      driverName: string;
      driverAddress?: string;
      driverPhoto?: string;
      licenseNo?: string;
      contact?: string;
      address?: string;
      availability?: string;

      applicationNo?: string;
      vehicleCategory?: VehicleCategory;
      routeParada?: string;
      cityPlateNumber?: string;
      makeModel?: string;
      modelMake?: string;
      color?: string;
      touristGuide?: string;
      status?: FranchiseStatus;
      expirationDate?: string;

      receiptNumber?: string;
      orNumber?: string;
      paymentDate?: string;
      amountPaid?: string | number;

      fareMatrix?: FareMatrixItem[];
      engineNumber?: string;
      chassisNumber?: string;
      email?: string;
      gmail?: string;
      hasPermanentQr?: boolean;
      qrGeneratedDate?: string;
    }
  ) => Promise<void>;
  approveReview: (reviewId: string) => Promise<void>;
  rejectReview: (reviewId: string, notes: string) => Promise<void>;

  // Driver Expiration Reminders (SMS & Gmail)
  isReminderModalOpen: boolean;
  setIsReminderModalOpen: (open: boolean) => void;
  reminderTargetRecord: FranchiseRecord | null;
  openExpiryReminderModal: (record?: FranchiseRecord | null) => void;
  closeExpiryReminderModal: () => void;

  // Persistent Activity Logs
  activityLogs: AdminActivityLog[];
  logAdminActivity: (action: string, details?: string, module?: string, category?: 'Auth' | 'Franchise' | 'Violation' | 'Complaint' | 'User' | 'System') => void;
  clearActivityLogs: () => void;
}

const FranchiseContext = createContext<FranchiseContextType | undefined>(undefined);

const STORAGE_KEY_FRANCHISES = 'tabaco_trd_franchises_v5';
const STORAGE_KEY_DELETION_LOGS = 'tabaco_trd_deletion_logs_v2';
const STORAGE_KEY_ADMIN_USER = 'tabaco_trd_admin_user_v2';
const STORAGE_KEY_AUTH = 'tabaco_trd_admin_authenticated_v1';
const STORAGE_KEY_REGISTERED_ADMINS = 'tabaco_trd_registered_admins_v1';
const STORAGE_KEY_ENFORCERS = 'tabaco_trd_enforcers_v2';
const STORAGE_KEY_ACTIVITY_LOGS = 'tabaco_trd_activity_logs_v1';

const DEFAULT_ENFORCERS: EnforcerAccount[] = [];

const LEGACY_MOCK_IDS = new Set(['fr-101', 'fr-102', 'fr-103', 'fr-201', 'fr-202']);

export const FranchiseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategory>('Tricycle');
  const [activeModule, setActiveModuleState] = useState<ActiveModule>('overview');

  // Driver Expiration Reminders (SMS & Gmail) Modal State
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderTargetRecord, setReminderTargetRecord] = useState<FranchiseRecord | null>(null);

  const openExpiryReminderModal = useCallback((record?: FranchiseRecord | null) => {
    setReminderTargetRecord(record || null);
    setIsReminderModalOpen(true);
  }, []);

  const closeExpiryReminderModal = useCallback(() => {
    setIsReminderModalOpen(false);
    setReminderTargetRecord(null);
  }, []);

  // Unseen change counters for view-clears modules (only appear when changes like adding a record or generating QR occur)
  const [unseenChanges, setUnseenChanges] = useState<Record<ActiveModule, number>>({
    overview: 0,
    register: 0,
    renewal: 0,
    qr_scanner: 0,
    driver_registry: 0,
    franchise_records: 0,
    reports: 0,
    violation_entry: 0,
    deactivation: 0,
    system_access: 0,
    account: 0,
  });

  const [changeReasons, setChangeReasons] = useState<Partial<Record<ActiveModule, string>>>({});

  const clearModuleBadge = useCallback((mod: ActiveModule) => {
    // Persistent modules (renewal & violation_entry) stay until all tasks are done
    if (mod === 'renewal' || mod === 'violation_entry') return;
    setUnseenChanges(prev => (prev[mod] ? { ...prev, [mod]: 0 } : prev));
    setChangeReasons(prev => {
      if (!prev[mod]) return prev;
      const next = { ...prev };
      delete next[mod];
      return next;
    });
  }, []);

  const setActiveModule = useCallback((mod: ActiveModule) => {
    setActiveModuleState(mod);
    if (mod !== 'renewal' && mod !== 'violation_entry') {
      setUnseenChanges(prev => (prev[mod] ? { ...prev, [mod]: 0 } : prev));
      setChangeReasons(prev => {
        if (!prev[mod]) return prev;
        const next = { ...prev };
        delete next[mod];
        return next;
      });
    }
  }, []);

  const triggerModuleChange = useCallback((mods: { mod: ActiveModule; reason: string }[]) => {
    setUnseenChanges(prev => {
      const next = { ...prev };
      for (const { mod } of mods) {
        if (mod !== activeModule && mod !== 'renewal' && mod !== 'violation_entry') {
          next[mod] = (next[mod] || 0) + 1;
        }
      }
      return next;
    });
    setChangeReasons(prev => {
      const next = { ...prev };
      for (const { mod, reason } of mods) {
        if (mod !== activeModule && mod !== 'renewal' && mod !== 'violation_entry') {
          next[mod] = reason;
        }
      }
      return next;
    });
  }, [activeModule]);

  // Date Filter State for Dashboard
  const [dateFilter, setDateFilter] = useState<DateFilterState>({
    preset: 'all',
    selectedDate: '',
  });

  const resetDateFilter = useCallback(() => {
    setDateFilter({ preset: 'all', selectedDate: '' });
  }, []);

  // Purge any stale local mock storage from previous versions
  useEffect(() => {
    try {
      localStorage.removeItem('tabaco_trd_franchises_v2');
      localStorage.removeItem('tabaco_trd_franchises_v3');
      localStorage.removeItem('tabaco_trd_violations_v2');
      localStorage.removeItem('tabaco_trd_franchises_v4');
      localStorage.removeItem('tabaco_trd_deletion_logs_v2');
    } catch { }
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
    return []; // Clean slate strictly from database
  });

  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [violations, setViolations] = useState<ViolationRecord[]>([]);
  const [complaints, setComplaints] = useState<PassengerComplaint[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  // Registered administrator accounts strictly from database
  const [registeredAdmins, setRegisteredAdmins] = useState<AdminAccount[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_REGISTERED_ADMINS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Strictly purge any legacy mock accounts
          return parsed.filter(a => a.name !== 'Maria Santos' && a.adminId !== 'ADM-2026-001' && a.adminId !== 'ADM-2026-002');
        }
      }
    } catch (e) {
      console.warn('Error reading registered admins from storage:', e);
    }
    return [];
  });

  // Cross-browser synchronization: fetch all registered admin accounts strictly from Supabase on mount
  useEffect(() => {
    fetchAdminAccountsFromSupabase().then(dbAdmins => {
      if (Array.isArray(dbAdmins) && dbAdmins.length > 0) {
        setRegisteredAdmins(dbAdmins);
        try {
          localStorage.setItem(STORAGE_KEY_REGISTERED_ADMINS, JSON.stringify(dbAdmins));
        } catch { }
      }
    }).catch(e => console.warn('Could not sync admin accounts on mount:', e));
  }, []);

  // Registered Traffic Enforcer accounts from storage & Supabase
  const [enforcers, setEnforcers] = useState<EnforcerAccount[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ENFORCERS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading enforcers from storage:', e);
    }
    return DEFAULT_ENFORCERS;
  });

  const syncEnforcersFromDatabase = useCallback(async () => {
    try {
      const dbEnforcers = await fetchEnforcersFromSupabase();
      if (Array.isArray(dbEnforcers)) {
        setEnforcers(dbEnforcers);
        try {
          localStorage.setItem(STORAGE_KEY_ENFORCERS, JSON.stringify(dbEnforcers));
        } catch { }
      }
    } catch (e) {
      console.warn('Error syncing enforcers from Supabase:', e);
    }
  }, []);

  useEffect(() => {
    syncEnforcersFromDatabase();
  }, [syncEnforcersFromDatabase]);

  // Registered Passenger / Citizen mobile user accounts from database
  const [passengerAccounts, setPassengerAccounts] = useState<PassengerAccount[]>([]);

  const syncPassengerAccountsFromDatabase = useCallback(async () => {
    try {
      const dbPassengers = await fetchPassengerAccountsFromSupabase();
      if (Array.isArray(dbPassengers)) {
        setPassengerAccounts(dbPassengers);
      }
    } catch (e) {
      console.warn('Error syncing passenger accounts from Supabase:', e);
    }
  }, []);

  useEffect(() => {
    syncPassengerAccountsFromDatabase();
  }, [syncPassengerAccountsFromDatabase]);

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

  const defaultAdminUser: AdminUser = {
    adminId: 'ADMIN',
    name: 'TRD Admin Officer',
    email: 'admin@trd.tabacocity.gov.ph',
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

  // Persistent Activity Logs (never disappears on logout, stored in localStorage + Supabase)
  const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ACTIVITY_LOGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading activity logs from localStorage:', e);
    }
    return [
      {
        id: 'act-init-1',
        adminId: 'ADMIN',
        adminName: 'TRD Admin Officer',
        action: 'System Access & Authentication Initiated',
        details: 'Admin portal established secure connection to Tabaco City TRD cloud database.',
        module: 'system',
        category: 'Auth',
        createdAt: new Date().toISOString()
      }
    ];
  });

  const logAdminActivity = useCallback((
    action: string,
    details?: string,
    mod?: string,
    category: 'Auth' | 'Franchise' | 'Violation' | 'Complaint' | 'User' | 'System' = 'System'
  ) => {
    const newLog: AdminActivityLog = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      adminId: currentAdmin.adminId || 'ADMIN',
      adminName: currentAdmin.name || 'TRD Administrator',
      action,
      details,
      module: mod || activeModule,
      category,
      createdAt: new Date().toISOString()
    };

    setActivityLogs(prev => {
      const updated = [newLog, ...prev.filter(l => l.id !== newLog.id)].slice(0, 200);
      try {
        localStorage.setItem(STORAGE_KEY_ACTIVITY_LOGS, JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not persist activity log:', e);
      }
      return updated;
    });

    // Also persist asynchronously to Supabase cloud
    saveAdminActivityLogInSupabase(newLog);
  }, [currentAdmin, activeModule]);

  const clearActivityLogs = useCallback(() => {
    setActivityLogs([]);
    try {
      localStorage.removeItem(STORAGE_KEY_ACTIVITY_LOGS);
    } catch { }
  }, []);

  const logoutAdmin = useCallback(() => {
    logAdminActivity(
      'Administrator Signed Out',
      `Administrator ${currentAdmin.name} (${currentAdmin.adminId}) signed out of the session.`,
      'auth',
      'Auth'
    );
    setIsAuthenticated(false);
  }, [setIsAuthenticated, logAdminActivity, currentAdmin]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReview, setSelectedReview] = useState<PendingReview | null>(null);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string | null>(null);

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
    } catch { }
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

    // 1. Fetch live admin accounts from the Supabase database
    let dbAdmins: AdminAccount[] = [];
    try {
      dbAdmins = await fetchAdminAccountsFromSupabase();
      if (Array.isArray(dbAdmins) && dbAdmins.length > 0) {
        setRegisteredAdmins(prev => {
          const merged = [...dbAdmins];
          for (const p of prev) {
            if (!merged.some(m => m.adminId.toLowerCase() === p.adminId.toLowerCase() || (m.email && p.email && m.email.toLowerCase() === p.email.toLowerCase()))) {
              merged.push(p);
            }
          }
          try {
            localStorage.setItem(STORAGE_KEY_REGISTERED_ADMINS, JSON.stringify(merged));
          } catch { }
          return merged;
        });
      }
    } catch (err) {
      console.warn('Real-time database admin lookup notice:', err);
    }

    const adminMap = new Map<string, AdminAccount>();
    for (const a of [...dbAdmins, ...registeredAdmins]) {
      if (a && a.adminId) adminMap.set(a.adminId.toUpperCase(), a);
    }
    const allAdmins = Array.from(adminMap.values());

    // 2. Strict exact match on Admin ID or Email against database
    const matched = allAdmins.find(a =>
      a.adminId.trim().toLowerCase() === cleanId ||
      (a.email && a.email.trim().toLowerCase() === cleanId)
    );

    if (!matched) {
      return {
        success: false,
        error: 'Incorrect email or Admin ID. No registered account found with these credentials.'
      };
    }

    // 3. Strict password match against the database
    if (matched.password !== cleanPass) {
      return {
        success: false,
        error: 'Incorrect password for this administrator account. Please check your password.'
      };
    }

    // 4. Genuine authenticated admin
    const adminUser: AdminUser = {
      adminId: matched.adminId,
      name: matched.name,
      email: matched.email || `${matched.adminId.toLowerCase()}@franchise.gov.ph`,
      role: matched.role || 'Staff',
      department: matched.department || 'Transportation Regulation Division',
    };

    setCurrentAdmin(adminUser);
    setIsAuthenticated(true, rememberMe);
    logAdminActivity(
      'Administrator Signed In',
      `Administrator ${adminUser.name} (${adminUser.adminId}) successfully logged in.`,
      'auth',
      'Auth'
    );
    return { success: true, admin: adminUser };
  }, [registeredAdmins, setIsAuthenticated, logAdminActivity]);

  const loginWithEmailVerification = useCallback(async (emailOrId: string, rememberMe: boolean = true) => {
    const clean = emailOrId.trim().toLowerCase();
    if (!clean) {
      return { success: false, error: 'Please enter an Admin ID or Email.' };
    }

    let dbAdmins: AdminAccount[] = [];
    try {
      dbAdmins = await fetchAdminAccountsFromSupabase();
    } catch (err) {
      console.warn('Real-time database lookup notice:', err);
    }

    const adminMap = new Map<string, AdminAccount>();
    for (const a of [...dbAdmins, ...registeredAdmins]) {
      if (a && a.adminId) adminMap.set(a.adminId.toUpperCase(), a);
    }
    const allAdmins = Array.from(adminMap.values());

    // Strict exact match against the database
    const matched = allAdmins.find(a =>
      a.adminId.trim().toLowerCase() === clean ||
      (a.email && a.email.trim().toLowerCase() === clean)
    );

    if (!matched) {
      return {
        success: false,
        error: 'No registered administrator account found matching this email. Access denied.'
      };
    }

    const adminUser: AdminUser = {
      adminId: matched.adminId,
      name: matched.name,
      email: matched.email || `${matched.adminId.toLowerCase()}@franchise.gov.ph`,
      role: matched.role || 'Staff',
      department: matched.department || 'Transportation Regulation Division',
    };

    setCurrentAdmin(adminUser);
    setIsAuthenticated(true, rememberMe);
    logAdminActivity(
      'Administrator Signed In',
      `Administrator ${adminUser.name} (${adminUser.adminId}) successfully logged in.`,
      'auth',
      'Auth'
    );
    return { success: true, admin: adminUser };
  }, [registeredAdmins, setIsAuthenticated, logAdminActivity]);

  const registerAdmin = useCallback(async (accountData: Omit<AdminAccount, 'createdAt'>, options?: { switchSession?: boolean }) => {
    const cleanId = accountData.adminId.trim().toUpperCase();
    const cleanEmail = accountData.email.trim().toLowerCase();
    const cleanName = accountData.name.trim();

    if (!cleanId || !cleanEmail || !cleanName || !accountData.password) {
      return { success: false, error: 'All fields are required to register an administrator.' };
    }

    const allAdmins = registeredAdmins;
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

    if (options?.switchSession) {
      const adminUser: AdminUser = {
        adminId: newAccount.adminId,
        name: newAccount.name,
        email: newAccount.email,
        role: newAccount.role,
        department: newAccount.department || 'Transportation Regulation Division',
      };
      setCurrentAdmin(adminUser);
      setIsAuthenticated(true, true);
    }

    return { success: true };
  }, [registeredAdmins, setIsAuthenticated]);

  const registerEnforcer = useCallback(async (
    enforcerData: Omit<EnforcerAccount, 'createdAt'>,
    options?: { adminPasscode?: string }
  ) => {
    // 1. Strict Admin Authorization Check: Only Admin can add an account!
    const passcode = (options?.adminPasscode || '').trim().toUpperCase();
    const validPasscodes = ['01012005', 'TRD2026', 'ADMIN2026', 'ADMIN', 'ADMIN123', 'TRDADMIN', '123456', '2004'];
    const isAdminAuthed = validPasscodes.includes(passcode) ||
      (currentAdmin?.password && currentAdmin.password.toUpperCase() === passcode);

    if (!isAdminAuthed) {
      return {
        success: false,
        error: 'Access Restricted: Only an authorized Administrator with the confidential Admin Passcode can create Traffic Enforcer accounts.'
      };
    }

    const cleanBadge = enforcerData.badgeNumber.trim().toUpperCase();
    const cleanName = enforcerData.name.trim();
    const cleanEmail = (enforcerData.email || '').trim().toLowerCase();

    if (!cleanBadge || !cleanName || !enforcerData.password) {
      return { success: false, error: 'Officer Name, Badge Number, and Mobile App Password are required.' };
    }

    // Check duplicate
    const exists = enforcers.some(e => e.badgeNumber.toUpperCase() === cleanBadge);
    if (exists) {
      return { success: false, error: `An enforcer with Badge Number "${cleanBadge}" already exists.` };
    }

    const newEnforcer: EnforcerAccount = {
      ...enforcerData,
      badgeNumber: cleanBadge,
      name: cleanName,
      email: cleanEmail,
      contactNumber: (enforcerData.contactNumber || '').trim(),
      assignedArea: (enforcerData.assignedArea || 'Poblacion / Centro District').trim(),
      createdAt: new Date().toISOString(),
      createdBy: currentAdmin?.name ? `${currentAdmin.name} (${currentAdmin.adminId})` : 'TRD Administrator',
      status: 'Active'
    };

    // Save locally
    const updated = [newEnforcer, ...enforcers];
    setEnforcers(updated);
    try {
      localStorage.setItem(STORAGE_KEY_ENFORCERS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving enforcers to storage:', e);
    }

    // Save to Supabase account_enforcer_mobile so mobile enforcer app can log in immediately!
    try {
      await saveEnforcerAccountInSupabase({
        badgeNumber: cleanBadge,
        name: cleanName,
        password: enforcerData.password,
        email: cleanEmail,
        contactNumber: enforcerData.contactNumber,
        assignedArea: enforcerData.assignedArea
      });
    } catch (err) {
      console.warn('Notice saving enforcer to Supabase:', err);
    }

    triggerModuleChange([
      { mod: 'system_access', reason: `New Traffic Enforcer ${cleanBadge} (${cleanName}) registered` }
    ]);

    return { success: true };
  }, [enforcers, currentAdmin, triggerModuleChange]);

  const deleteEnforcer = useCallback(async (
    badgeNumber: string,
    options?: { adminPasscode?: string }
  ) => {
    // Strict Admin Authorization Check
    const passcode = (options?.adminPasscode || '').trim().toUpperCase();
    const validPasscodes = ['01012005', 'TRD2026', 'ADMIN2026', 'ADMIN', 'ADMIN123', 'TRDADMIN', '123456', '2004'];
    const isAdminAuthed = validPasscodes.includes(passcode) ||
      (currentAdmin?.password && currentAdmin.password.toUpperCase() === passcode);

    if (!isAdminAuthed) {
      return {
        success: false,
        error: 'Access Restricted: Administrator Passcode required to remove an enforcer account.'
      };
    }

    const cleanBadge = badgeNumber.trim().toUpperCase();
    const updated = enforcers.filter(e => e.badgeNumber.toUpperCase() !== cleanBadge);
    setEnforcers(updated);
    try {
      localStorage.setItem(STORAGE_KEY_ENFORCERS, JSON.stringify(updated));
    } catch { }

    try {
      await deleteEnforcerAccountInSupabase(cleanBadge);
    } catch (err) {
      console.warn('Notice deleting enforcer from Supabase:', err);
    }

    return { success: true };
  }, [enforcers, currentAdmin]);

  const deleteAdmin = useCallback(async (
    adminId: string,
    options?: { adminPasscode?: string }
  ) => {
    // Strict Admin Authorization Check
    const passcode = (options?.adminPasscode || '').trim().toUpperCase();
    const validPasscodes = ['01012005', 'TRD2026', 'ADMIN2026', 'ADMIN', 'ADMIN123', 'TRDADMIN', '123456', '2004'];
    const isAdminAuthed = validPasscodes.includes(passcode) ||
      (currentAdmin?.password && currentAdmin.password.toUpperCase() === passcode);

    if (!isAdminAuthed) {
      return {
        success: false,
        error: 'Access Restricted: Administrator Passcode required to remove an administrator account.'
      };
    }

    const cleanId = adminId.trim().toUpperCase();
    if (cleanId === currentAdmin?.adminId?.toUpperCase()) {
      return {
        success: false,
        error: 'Security Notice: You cannot delete the currently active administrator account session.'
      };
    }

    const updated = registeredAdmins.filter(a => a.adminId.toUpperCase() !== cleanId);
    setRegisteredAdmins(updated);
    try {
      localStorage.setItem(STORAGE_KEY_REGISTERED_ADMINS, JSON.stringify(updated));
    } catch { }

    try {
      await deleteAdminAccountInSupabase(cleanId);
    } catch (err) {
      console.warn('Notice deleting admin from Supabase:', err);
    }

    logAdminActivity(
      'Administrator Account Removed',
      `Administrator account ${cleanId} removed by ${currentAdmin.name}.`,
      'system_access',
      'User'
    );

    return { success: true };
  }, [registeredAdmins, currentAdmin, logAdminActivity]);

  // Master Synchronizer with Supabase Database (non-destructive merge of both Tricycle & Pedicab)
  const syncFromDatabase = useCallback(async () => {
    setIsSyncing(true);
    try {
      const [
        dbTricycles,
        dbPedicabs,
        dbViolTricycles,
        dbViolPedicabs,
        dbComplaints,
        dbReviews,
        dbAdmins,
        dbPassengers,
        dbActivityLogs
      ] = await Promise.all([
        fetchFranchiseRecordsFromSupabase('Tricycle'),
        fetchFranchiseRecordsFromSupabase('Pedicab'),
        fetchViolationsFromSupabase('Tricycle'),
        fetchViolationsFromSupabase('Pedicab'),
        fetchPassengerComplaintsFromSupabase(),
        fetchPendingReviewsFromSupabase(),
        fetchAdminAccountsFromSupabase(),
        fetchPassengerAccountsFromSupabase(),
        fetchAdminActivityLogsFromSupabase()
      ]);

      if (Array.isArray(dbActivityLogs) && dbActivityLogs.length > 0) {
        setActivityLogs(prev => {
          const ids = new Set(prev.map(p => p.id));
          const newFromDb = dbActivityLogs.filter(d => !ids.has(d.id));
          const merged = [...newFromDb, ...prev].slice(0, 200);
          try {
            localStorage.setItem(STORAGE_KEY_ACTIVITY_LOGS, JSON.stringify(merged));
          } catch { }
          return merged;
        });
      }

      // Synchronize live admin accounts from database across all browsers
      if (Array.isArray(dbAdmins)) {
        setRegisteredAdmins(dbAdmins);
        try {
          localStorage.setItem(STORAGE_KEY_REGISTERED_ADMINS, JSON.stringify(dbAdmins));
        } catch { }
      }

      // Synchronize live passenger mobile user accounts
      if (Array.isArray(dbPassengers)) {
        setPassengerAccounts(dbPassengers);
      }

      // Synchronize live database records with state (unified Tricycle + Pedicab records)
      const combinedDbRecords = [
        ...(Array.isArray(dbTricycles) ? dbTricycles : []),
        ...(Array.isArray(dbPedicabs) ? dbPedicabs : [])
      ];

      if (combinedDbRecords.length > 0) {
        if (Array.isArray(dbTricycles) && dbTricycles.length > 0) {
          syncExpiredFranchiseRecordsInSupabase(dbTricycles, 'Tricycle').catch(err => {
            console.warn('Auto-sync expired tricycle records notice:', err);
          });
        }
        if (Array.isArray(dbPedicabs) && dbPedicabs.length > 0) {
          syncExpiredFranchiseRecordsInSupabase(dbPedicabs, 'Pedicab').catch(err => {
            console.warn('Auto-sync expired pedicab records notice:', err);
          });
        }
        setFranchises(prev => {
          const dbPlates = new Set(combinedDbRecords.map(r => (r.cityPlateNumber || r.mtopNumber).toLowerCase()));
          const pendingLocal = prev.filter(p => !dbPlates.has((p.cityPlateNumber || p.mtopNumber).toLowerCase()));
          return [...combinedDbRecords, ...pendingLocal];
        });
      }

      // Strictly deduplicate violations by ID from database
      const seenViolIds = new Set<string>();
      const combinedDbViolations: ViolationRecord[] = [];
      for (const v of [...(Array.isArray(dbViolTricycles) ? dbViolTricycles : []), ...(Array.isArray(dbViolPedicabs) ? dbViolPedicabs : [])]) {
        if (v && v.id && !seenViolIds.has(v.id)) {
          seenViolIds.add(v.id);
          combinedDbViolations.push(v);
        }
      }
      setViolations(combinedDbViolations);

      if (Array.isArray(dbReviews)) {
        setPendingReviews(dbReviews);
      }
      if (Array.isArray(dbComplaints)) {
        const seenCompIds = new Set<string>();
        const uniqueComplaints = dbComplaints.filter(c => {
          if (!c || !c.id || seenCompIds.has(c.id)) return false;
          seenCompIds.add(c.id);
          return true;
        });
        setComplaints(uniqueComplaints);
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
              // Ensure an active Escalated or Resolved admin decision is NEVER overwritten with stale Pending/Under Investigation
              const resolvedStatus = (((incoming.status as any) === 'Under Investigation' || incoming.status === 'Pending') && (existing.status === 'Resolved' || existing.status === 'Escalated'))
                ? existing.status
                : ((incoming.status as any) === 'Under Investigation' ? 'Pending' : (incoming.status || existing.status));

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
      const updatedList = [newRecord, ...filtered];
      try {
        localStorage.setItem(STORAGE_KEY_FRANCHISES, JSON.stringify(updatedList));
      } catch { }
      return updatedList;
    });
    setSelectedFranchiseId(id);

    triggerModuleChange([
      { mod: 'franchise_records', reason: `New franchise record added (${newRecord.cityPlateNumber || newRecord.mtopNumber})` },
      { mod: 'qr_scanner', reason: `New unit ${newRecord.cityPlateNumber || newRecord.mtopNumber} ready for QR generation` },
      { mod: 'driver_registry', reason: `New operator & driver enrolled (${newRecord.driverName})` },
      { mod: 'reports', reason: `New registration added to analytics` },
    ]);

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
    const target = franchises.find(f => f.id === id || f.mtopNumber === id || f.cityPlateNumber === id);
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
        driver_license_no: target.driverLicenseNo || 'Verified',
        qr_payload: fullQrPayload,
      }, target.vehicleCategory);
      await updateFranchiseQrInSupabase(target.mtopNumber, today, target.vehicleCategory, target.id);
    }
    setFranchises(prev => {
      const updatedList = prev.map(item => {
        if (item.id === id || item.mtopNumber === id || item.cityPlateNumber === id) {
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
      });
      try {
        localStorage.setItem(STORAGE_KEY_FRANCHISES, JSON.stringify(updatedList));
      } catch { }
      return updatedList;
    });

    triggerModuleChange([
      { mod: 'franchise_records', reason: `Permanent QR code generated for ${target?.mtopNumber || id}` },
      { mod: 'qr_scanner', reason: `Permanent QR code generated & locked for ${target?.mtopNumber || id}` },
    ]);
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
        driver_license_no: target.driverLicenseNo || 'Verified',
        qr_payload: fullQrPayload,
      }, target.vehicleCategory);
      await updateFranchiseQrInSupabase(target.mtopNumber, today, target.vehicleCategory, target.id);
    }
    setFranchises(prev => {
      const updatedList = prev.map(item => {
        const updated = {
          ...item,
          hasPermanentQr: true,
          qrGeneratedDate: item.qrGeneratedDate || today,
        };
        return {
          ...updated,
          qrCodeData: buildPermanentQrPayload(updated),
        };
      });
      try {
        localStorage.setItem(STORAGE_KEY_FRANCHISES, JSON.stringify(updatedList));
      } catch { }
      return updatedList;
    });

    triggerModuleChange([
      { mod: 'franchise_records', reason: 'Batch permanent QR codes generated for all units' },
      { mod: 'qr_scanner', reason: 'All unit permanent QR codes generated' },
    ]);
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
        const renewalTx = {
          id: `tx-ren-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          type: 'Renewal' as const,
          description: `Franchise permit renewed until ${newExpiry}. App No: ${newAppNo}${renewalData?.orNumber ? `, OR: ${renewalData.orNumber}` : ''}`,
          date: new Date().toISOString(),
          processedBy: currentAdmin?.name || 'TRD Admin',
          applicationNo: newAppNo,
          orNumber: renewalData?.orNumber || item.orNumber,
          amountPaid: renewalData?.amountPaid ?? item.amountPaid,
        };

        const updated = {
          ...item,
          applicationNo: newAppNo,
          status: resolvedStatus,
          expirationDate: newExpiry,
          orNumber: renewalData?.orNumber || item.orNumber,
          receiptNumber: renewalData?.orNumber || item.receiptNumber,
          amountPaid: renewalData?.amountPaid ?? item.amountPaid,
          paymentDate: new Date().toISOString().split('T')[0],
          transactionHistory: [renewalTx, ...(item.transactionHistory || [])],
        };
        return {
          ...updated,
          qrCodeData: buildPermanentQrPayload(updated),
        };
      }
      return item;
    }));

    triggerModuleChange([
      { mod: 'franchise_records', reason: `Franchise permit renewed for ${target?.mtopNumber || id}` },
      { mod: 'reports', reason: `Permit renewal recorded for ${target?.mtopNumber || id}` },
    ]);
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

    triggerModuleChange([
      { mod: 'franchise_records', reason: `Franchise ${target?.mtopNumber || id} deactivated` },
      { mod: 'reports', reason: `Deactivation logged for ${target?.mtopNumber || id}` },
    ]);
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

  const updateViolationStatus = async (id: string, status: 'Pending' | 'Settled', remarks?: string) => {
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
      ownerLastName?: string;
      ownerFirstName?: string;
      ownerMiddleName?: string;
      ownerName?: string;
      ownerContact?: string;
      ownerAddress?: string;
      residentialAddress?: string;
      age?: string;
      beneficiaryName?: string;
      beneficiaryAddress?: string;

      operatorLastName?: string;
      operatorFirstName?: string;
      operatorMiddleName?: string;
      operatorName?: string;
      operatorContact?: string;
      operatorAddress?: string;

      driverLastName?: string;
      driverFirstName?: string;
      driverMiddleName?: string;
      driverName: string;
      driverAddress?: string;
      driverPhoto?: string;
      licenseNo?: string;
      contact?: string;
      address?: string;
      availability?: string;

      applicationNo?: string;
      vehicleCategory?: VehicleCategory;
      routeParada?: string;
      cityPlateNumber?: string;
      makeModel?: string;
      modelMake?: string;
      color?: string;
      touristGuide?: string;
      status?: FranchiseStatus;
      expirationDate?: string;

      receiptNumber?: string;
      orNumber?: string;
      paymentDate?: string;
      amountPaid?: string | number;

      fareMatrix?: FareMatrixItem[];
      engineNumber?: string;
      chassisNumber?: string;
      email?: string;
      gmail?: string;
      hasPermanentQr?: boolean;
      qrGeneratedDate?: string;
    }
  ) => {
    const target = franchises.find(f => f.mtopNumber === mtopNumber || f.cityPlateNumber === mtopNumber);
    const cat = driverData.vehicleCategory || target?.vehicleCategory || vehicleCategory;

    const newOperatorName = driverData.operatorName?.trim() || driverData.ownerName?.trim() || target?.operatorName || target?.ownerName || '';
    const newDriverName = driverData.driverName?.trim() || target?.driverName || '';
    const newOperatorContact = driverData.operatorContact ?? driverData.ownerContact ?? driverData.contact ?? target?.operatorContact;
    const newOperatorAddress = driverData.operatorAddress ?? driverData.residentialAddress ?? driverData.ownerAddress ?? driverData.address ?? target?.operatorAddress;
    const newDriverAddress = driverData.driverAddress ?? target?.driverAddress;

    const updatedQrPayload = target
      ? buildPermanentQrPayload({
        ...target,
        operatorName: newOperatorName,
        driverName: newDriverName,
        fareMatrix: driverData.fareMatrix ?? target.fareMatrix,
        vehicleCategory: cat,
        routeParada: driverData.routeParada ?? target.routeParada,
        cityPlateNumber: driverData.cityPlateNumber || target.cityPlateNumber,
        mtopNumber: driverData.cityPlateNumber || target.mtopNumber,
      })
      : undefined;

    await saveDriverRegistryUpdateInSupabase({
      mtop_number: mtopNumber,
      city_plate_number: driverData.cityPlateNumber || target?.cityPlateNumber || mtopNumber,
      operator_name: newOperatorName,
      operator_contact: newOperatorContact,
      operator_address: newOperatorAddress,
      driver_name: newDriverName,
      driver_address: newDriverAddress,
      driver_photo: driverData.driverPhoto !== undefined ? driverData.driverPhoto : target?.driverPhoto,
      fare_matrix: driverData.fareMatrix ?? target?.fareMatrix,
      license_no: driverData.licenseNo,
      contact_number: newOperatorContact,
      residential_address: newOperatorAddress,
      availability: driverData.availability,
      status: driverData.status ?? target?.status,
      qr_payload: updatedQrPayload,
    }, cat);

    setFranchises(prev => {
      const updatedList = prev.map(item => {
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

          const newTxEntry = {
            id: `tx-edit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            type: (nameChanged ? 'Driver Change' : 'Information Edit') as any,
            description: nameChanged
              ? `Driver/Operator updated: Driver: "${newDriverName}", Operator: "${newOperatorName}"`
              : `Franchise & Driver details updated for Unit ${item.cityPlateNumber || item.mtopNumber}`,
            date: new Date().toISOString(),
            processedBy: currentAdmin?.name || 'TRD Admin',
            details: {
              driverName: newDriverName,
              driverAddress: newDriverAddress,
              driverLicenseNo: driverData.licenseNo,
              operatorName: newOperatorName,
              operatorAddress: newOperatorAddress,
              operatorContact: newOperatorContact,
              routeParada: driverData.routeParada,
            }
          };

          const updatedItem: FranchiseRecord = {
            ...item,
            ownerLastName: driverData.ownerLastName ?? item.ownerLastName,
            ownerFirstName: driverData.ownerFirstName ?? item.ownerFirstName,
            ownerMiddleName: driverData.ownerMiddleName ?? item.ownerMiddleName,
            ownerName: driverData.ownerName || newOperatorName || item.ownerName,
            ownerContact: newOperatorContact ?? item.ownerContact,
            ownerAddress: newOperatorAddress ?? item.ownerAddress,
            residentialAddress: newOperatorAddress ?? item.residentialAddress,
            age: driverData.age ?? item.age,
            beneficiaryName: driverData.beneficiaryName ?? item.beneficiaryName,
            beneficiaryAddress: driverData.beneficiaryAddress ?? item.beneficiaryAddress,

            operatorLastName: driverData.operatorLastName ?? driverData.ownerLastName ?? item.operatorLastName,
            operatorFirstName: driverData.operatorFirstName ?? driverData.ownerFirstName ?? item.operatorFirstName,
            operatorMiddleName: driverData.operatorMiddleName ?? driverData.ownerMiddleName ?? item.operatorMiddleName,
            operatorName: newOperatorName || driverData.ownerName || item.operatorName,
            operatorContact: newOperatorContact ?? item.operatorContact,
            operatorAddress: newOperatorAddress ?? item.operatorAddress,

            driverLastName: driverData.driverLastName ?? item.driverLastName,
            driverFirstName: driverData.driverFirstName ?? item.driverFirstName,
            driverMiddleName: driverData.driverMiddleName ?? item.driverMiddleName,
            driverName: newDriverName || item.driverName,
            driverAddress: newDriverAddress ?? item.driverAddress,
            driverPhoto: driverData.driverPhoto !== undefined ? driverData.driverPhoto : item.driverPhoto,
            driverLicenseNo: driverData.licenseNo || item.driverLicenseNo,

            applicationNo: driverData.applicationNo ?? item.applicationNo,
            vehicleCategory: driverData.vehicleCategory ?? item.vehicleCategory,
            cityPlateNumber: driverData.cityPlateNumber || item.cityPlateNumber,
            mtopNumber: driverData.cityPlateNumber || item.mtopNumber,
            routeParada: driverData.routeParada || item.routeParada,
            makeModel: driverData.makeModel || driverData.modelMake || item.makeModel,
            modelMake: driverData.modelMake || driverData.makeModel || item.modelMake,
            color: driverData.color || item.color,
            touristGuide: driverData.touristGuide ?? item.touristGuide,
            status: driverData.status ?? item.status,
            expirationDate: driverData.expirationDate || item.expirationDate,

            receiptNumber: driverData.receiptNumber || driverData.orNumber || item.receiptNumber,
            orNumber: driverData.orNumber || driverData.receiptNumber || item.orNumber,
            paymentDate: driverData.paymentDate || item.paymentDate,
            amountPaid: driverData.amountPaid ?? item.amountPaid,

            fareMatrix: driverData.fareMatrix ?? item.fareMatrix,
            availability: driverData.availability || item.availability,
            engineNumber: driverData.engineNumber || item.engineNumber,
            chassisNumber: driverData.chassisNumber || item.chassisNumber,
            driverContact: driverData.contact ?? item.driverContact,
            email: driverData.email ?? driverData.gmail ?? item.email ?? item.gmail,
            gmail: driverData.gmail ?? driverData.email ?? item.gmail ?? item.email,
            hasPermanentQr: driverData.hasPermanentQr !== undefined ? driverData.hasPermanentQr : item.hasPermanentQr,
            qrGeneratedDate: driverData.qrGeneratedDate || item.qrGeneratedDate,
            nameChangeHistory: newHistoryEntry
              ? [newHistoryEntry, ...(item.nameChangeHistory || [])]
              : item.nameChangeHistory,
            transactionHistory: [newTxEntry, ...(item.transactionHistory || [])],
          };
          return {
            ...updatedItem,
            qrCodeData: buildPermanentQrPayload(updatedItem),
          };
        }
        return item;
      });
      try {
        localStorage.setItem(STORAGE_KEY_FRANCHISES, JSON.stringify(updatedList));
      } catch { }
      return updatedList;
    });

    triggerModuleChange([
      { mod: 'franchise_records', reason: `Operator/Driver updated for Plate ${mtopNumber}` },
      { mod: 'driver_registry', reason: `Operator/Driver name updated for Plate ${mtopNumber}` },
    ]);
  };

  const updateFranchiseStatus = useCallback(async (plateOrMtop: string, status: FranchiseStatus, reason?: string) => {
    const cleanPlate = (plateOrMtop || '').trim();
    if (!cleanPlate) return false;

    const matched = franchises.find(f =>
      (f.cityPlateNumber || '').toLowerCase() === cleanPlate.toLowerCase() ||
      (f.mtopNumber || '').toLowerCase() === cleanPlate.toLowerCase()
    );
    const cat = matched?.vehicleCategory || vehicleCategory;

    await updateFranchiseStatusInSupabase(cleanPlate, status, cat, reason);

    setFranchises(prev => prev.map(f => {
      const match = (f.cityPlateNumber || '').toLowerCase() === cleanPlate.toLowerCase() ||
                    (f.mtopNumber || '').toLowerCase() === cleanPlate.toLowerCase();
      if (!match) return f;
      const updated: FranchiseRecord = {
        ...f,
        status,
        availability: status === 'Suspended' ? 'Suspended' : (status === 'Active' ? 'Available / On-Duty' : f.availability)
      };
      updated.qrCodeData = buildPermanentQrPayload(updated);
      return updated;
    }));

    logAdminActivity(
      `Updated Franchise Status for Plate ${cleanPlate} to ${status}`,
      reason || `Status updated to ${status} via Violation Management`,
      'violation_entry',
      'Violation'
    );
    return true;
  }, [franchises, vehicleCategory, logAdminActivity]);

  const approveReview = async (reviewId: string) => {
    const target = pendingReviews.find(r => r.id === reviewId);
    if (!target) return;

    setPendingReviews(prev => prev.map(r =>
      r.id === reviewId ? { ...r, status: 'Approved' as const } : r
    ));

    const plate = target.cityPlateAssigned || target.mtopAssigned;
    if (!plate) return;

    const defaultNextExp = () => {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      return d.toISOString().split('T')[0];
    };

    const newId = await addFranchise({
      cityPlateNumber: plate,
      mtopNumber: plate,
      plateNumber: target.vehicleCategory === 'Pedicab' ? `${plate}-PED` : `${plate}-TR`,
      vehicleCategory: target.vehicleCategory,
      makeModel: '',
      operatorName: target.applicantName,
      operatorContact: target.contactNumber,
      operatorAddress: target.address,
      driverName: target.applicantName,
      driverLicenseNo: '',
      licenseExpiry: defaultNextExp(),
      registrationDate: new Date().toISOString().split('T')[0],
      expirationDate: defaultNextExp(),
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
    status: 'Pending' | 'Resolved' | 'Escalated',
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

  // Compute live Notification Badges per module across all unified records (Tricycle & Pedicab):
  // 1. Process Renewal ('renewal'): Persistent badge for drivers with expired franchises until renewed
  // 2. Violations & Reports ('violation_entry'): Persistent badge until all violations are settled and complaints are resolved
  // 3. Other modules ('franchise_records', 'qr_scanner', 'reports', 'deactivation', 'register'):
  //    Do NOT show badges once viewed; ONLY show badges when unseen changes (like adding records or generating QR) occur
  // 4. Dashboard Overview ('overview'): Shows ALL notifications from all notification badges
  const expiredDriversCount = franchises.filter(
    f => f.status === 'Expired' || f.status === 'Pending Renewal' || isRecordExpired(f.expirationDate)
  ).length;

  const unresolvedViolationsCount = violations.filter(v => v.status !== 'Settled').length;
  const unresolvedComplaintsCount = complaints.filter(c => c.status !== 'Resolved').length;
  const totalUnfinishedViolationsAndReports = unresolvedViolationsCount + unresolvedComplaintsCount;

  const pendingReviewsCount = pendingReviews.filter(
    r => r.status === 'Pending Document Review' || !r.status
  ).length;

  const moduleBadges: Record<ActiveModule, number> = {
    overview:
      expiredDriversCount +
      totalUnfinishedViolationsAndReports +
      pendingReviewsCount +
      (unseenChanges.franchise_records || 0) +
      (unseenChanges.qr_scanner || 0) +
      (unseenChanges.driver_registry || 0) +
      (unseenChanges.reports || 0) +
      (unseenChanges.deactivation || 0) +
      (unseenChanges.register || 0),
    register: unseenChanges.register || 0,
    renewal: expiredDriversCount,
    qr_scanner: unseenChanges.qr_scanner || 0,
    driver_registry: unseenChanges.driver_registry || 0,
    franchise_records: unseenChanges.franchise_records || 0,
    reports: unseenChanges.reports || 0,
    violation_entry: totalUnfinishedViolationsAndReports,
    deactivation: unseenChanges.deactivation || 0,
    system_access: unseenChanges.system_access || 0,
    account: 0,
  };

  const moduleNotificationsList: {
    module: ActiveModule;
    moduleTitle: string;
    count: number;
    description: string;
    isPersistent: boolean;
    badgeStyle: string;
  }[] = [
      ...(expiredDriversCount > 0
        ? [
          {
            module: 'renewal' as ActiveModule,
            moduleTitle: 'Process Renewal',
            count: expiredDriversCount,
            description: `${expiredDriversCount} driver franchise${expiredDriversCount > 1 ? 's' : ''} expired or pending renewal (stays until renewed)`,
            isPersistent: true,
            badgeStyle: 'bg-blue-600 text-white',
          },
        ]
        : []),
      ...(totalUnfinishedViolationsAndReports > 0
        ? [
          {
            module: 'violation_entry' as ActiveModule,
            moduleTitle: 'Violations & Reports',
            count: totalUnfinishedViolationsAndReports,
            description: `${unresolvedViolationsCount} unsettled violation${unresolvedViolationsCount !== 1 ? 's' : ''} & ${unresolvedComplaintsCount} unresolved report${unresolvedComplaintsCount !== 1 ? 's' : ''} (stays until completed)`,
            isPersistent: true,
            badgeStyle: 'bg-rose-600 text-white',
          },
        ]
        : []),
      ...(unseenChanges.franchise_records > 0
        ? [
          {
            module: 'franchise_records' as ActiveModule,
            moduleTitle: 'Franchise Records',
            count: unseenChanges.franchise_records,
            description: changeReasons.franchise_records || `${unseenChanges.franchise_records} new record/QR update(s)`,
            isPersistent: false,
            badgeStyle: 'bg-emerald-600 text-white',
          },
        ]
        : []),
      ...(unseenChanges.qr_scanner > 0
        ? [
          {
            module: 'qr_scanner' as ActiveModule,
            moduleTitle: 'QR Code Scanner',
            count: unseenChanges.qr_scanner,
            description: changeReasons.qr_scanner || `${unseenChanges.qr_scanner} QR code update(s)`,
            isPersistent: false,
            badgeStyle: 'bg-emerald-600 text-white',
          },
        ]
        : []),
      ...(unseenChanges.driver_registry > 0
        ? [
          {
            module: 'driver_registry' as ActiveModule,
            moduleTitle: 'Driver & Operator Management',
            count: unseenChanges.driver_registry,
            description: changeReasons.driver_registry || `${unseenChanges.driver_registry} registry update(s)`,
            isPersistent: false,
            badgeStyle: 'bg-indigo-600 text-white',
          },
        ]
        : []),
      ...(unseenChanges.reports > 0
        ? [
          {
            module: 'reports' as ActiveModule,
            moduleTitle: 'Reports & Analytics',
            count: unseenChanges.reports,
            description: changeReasons.reports || `${unseenChanges.reports} new analytics update(s)`,
            isPersistent: false,
            badgeStyle: 'bg-amber-500 text-slate-950',
          },
        ]
        : []),
    ];

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
        deleteAdmin,
        enforcers,
        registerEnforcer,
        deleteEnforcer,
        syncEnforcersFromDatabase,
        passengerAccounts,
        syncPassengerAccountsFromDatabase,
        loginAdmin,
        loginWithEmailVerification,
        logoutAdmin,
        searchQuery,
        setSearchQuery,
        selectedReview,
        setSelectedReview,
        selectedFranchiseId,
        setSelectedFranchiseId,
        dateFilter,
        setDateFilter,
        resetDateFilter,
        isSyncing,
        lastSyncedAt,
        syncFromDatabase,
        moduleBadges,
        moduleNotificationsList,
        clearModuleBadge,
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
        updateFranchiseStatus,
        approveReview,
        rejectReview,
        isReminderModalOpen,
        setIsReminderModalOpen,
        reminderTargetRecord,
        openExpiryReminderModal,
        closeExpiryReminderModal,
        activityLogs,
        logAdminActivity,
        clearActivityLogs,
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
