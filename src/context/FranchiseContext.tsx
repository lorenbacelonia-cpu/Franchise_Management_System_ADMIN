import React, { createContext, useContext, useState, useEffect } from 'react';
import type { 
  VehicleCategory, 
  FranchiseRecord, 
  PendingReview, 
  ViolationRecord, 
  PassengerComplaint, 
  ActiveModule 
} from '../types';
import { 
  initialFranchises, 
  initialPendingReviews, 
  initialViolations, 
  initialComplaints 
} from '../data/mockData';
import { buildPermanentQrPayload } from '../utils/fareUtils';
import { 
  fetchFranchiseRecordsFromSupabase, 
  saveFranchiseRegistrationInSupabase,
  saveFranchiseRecordInSupabase, 
  savePermanentQRCodeInSupabase,
  updateFranchiseQrInSupabase,
  saveFranchiseRenewalInSupabase,
  saveViolationInSupabase,
  fetchViolationsFromSupabase,
  updateViolationStatusInSupabase,
  saveDriverRegistryUpdateInSupabase,
  saveDeactivationInSupabase,
  fetchPassengerComplaintsFromSupabase,
  updatePassengerComplaintStatusInSupabase
} from '../lib/supabaseClient';

interface FranchiseContextType {
  vehicleCategory: VehicleCategory;
  setVehicleCategory: (cat: VehicleCategory) => void;
  activeModule: ActiveModule;
  setActiveModule: (mod: ActiveModule) => void;
  franchises: FranchiseRecord[];
  pendingReviews: PendingReview[];
  violations: ViolationRecord[];
  complaints: PassengerComplaint[];
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedReview: PendingReview | null;
  setSelectedReview: (review: PendingReview | null) => void;
  selectedFranchiseId: string | null;
  setSelectedFranchiseId: (id: string | null) => void;
  
  // Actions
  addFranchise: (newRecord: Omit<FranchiseRecord, 'id' | 'qrCodeData' | 'violationsCount' | 'status' | 'documentsVerified'>) => string;
  generatePermanentQr: (id: string) => void;
  generateAllPermanentQr: () => void;
  renewFranchise: (id: string, renewalData?: { newExpiry?: string; orNumber?: string; amountPaid?: number }) => void;
  deactivateFranchise: (id: string, reason?: string) => void;
  addViolation: (newViol: Omit<ViolationRecord, 'id' | 'dateSubmitted' | 'status'>) => void;
  updateViolationStatus: (id: string, status: 'Pending' | 'Settled' | 'Under Investigation') => void;
  updateComplaintStatus: (id: string, status: 'Under Investigation' | 'Resolved' | 'Escalated') => void;
  updateDriver: (mtopNumber: string, driverData: { driverName: string; licenseNo?: string; contact?: string; address?: string; availability?: string }) => void;
  approveReview: (reviewId: string) => void;
  rejectReview: (reviewId: string, notes: string) => void;
}

const FranchiseContext = createContext<FranchiseContextType | undefined>(undefined);

const STORAGE_KEY_FRANCHISES = 'tabaco_trd_franchises_v2';
const STORAGE_KEY_VIOLATIONS = 'tabaco_trd_violations_v2';

export const FranchiseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategory>('Tricycle');
  const [activeModule, setActiveModule] = useState<ActiveModule>('overview');

  // Initialize franchises from localStorage if available to survive page reloads permanently
  const [franchises, setFranchises] = useState<FranchiseRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_FRANCHISES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading franchises from localStorage:', e);
    }
    return initialFranchises;
  });

  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>(initialPendingReviews);
  
  const [violations, setViolations] = useState<ViolationRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_VIOLATIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading violations from localStorage:', e);
    }
    return initialViolations;
  });

  const [complaints, setComplaints] = useState<PassengerComplaint[]>(initialComplaints);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true); // Default logged in
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReview, setSelectedReview] = useState<PendingReview | null>(null);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string | null>('fr-102');

  // Always keep localStorage synchronized with state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FRANCHISES, JSON.stringify(franchises));
    } catch (e) {
      console.warn('Error saving franchises to localStorage:', e);
    }
  }, [franchises]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_VIOLATIONS, JSON.stringify(violations));
    } catch (e) {
      console.warn('Error saving violations to localStorage:', e);
    }
  }, [violations]);

  // Sync live records from role-partitioned Supabase tables when category changes or on mount & live interval
  useEffect(() => {
    const syncData = () => {
      fetchFranchiseRecordsFromSupabase(vehicleCategory).then((dbRecords) => {
        if (dbRecords && dbRecords.length > 0) {
          setFranchises(prev => {
            const combined = [...dbRecords];
            // Preserve any newly registered records from local session that might still be syncing
            prev.forEach(localItem => {
              if (localItem.vehicleCategory === vehicleCategory && !combined.some(dbItem => dbItem.mtopNumber === localItem.mtopNumber)) {
                combined.unshift(localItem);
              }
            });
            return combined.map(item => {
              const localMatch = prev.find(p => p.mtopNumber === item.mtopNumber);
              if (localMatch && localMatch.hasPermanentQr) {
                return {
                  ...item,
                  hasPermanentQr: true,
                  qrGeneratedDate: item.qrGeneratedDate || localMatch.qrGeneratedDate
                };
              }
              return item;
            });
          });
        }
      });

      fetchViolationsFromSupabase(vehicleCategory).then((dbViolations) => {
        if (dbViolations && dbViolations.length > 0) {
          setViolations(prev => {
            const combined = [...dbViolations];
            (prev || []).forEach(localItem => {
              if (!combined.some(dbItem => dbItem.id === localItem.id || (dbItem.cityPlateNumber === localItem.cityPlateNumber && dbItem.dateSubmitted === localItem.dateSubmitted && dbItem.violationType === localItem.violationType))) {
                combined.push(localItem);
              }
            });
            return combined;
          });
        }
      });

      // Sync mobile passenger complaints in real-time
      fetchPassengerComplaintsFromSupabase().then((dbComplaints) => {
        if (dbComplaints && dbComplaints.length > 0) {
          setComplaints(dbComplaints);
        }
      });
    };

    // Initial sync
    syncData();

    // Auto-poll every 3.5 seconds to instantly pick up reports sent from mobile web
    const intervalId = setInterval(syncData, 3500);
    return () => clearInterval(intervalId);
  }, [vehicleCategory]);

  const addFranchise = (data: Omit<FranchiseRecord, 'id' | 'qrCodeData' | 'violationsCount' | 'status' | 'documentsVerified'>): string => {
    const id = `fr-${Date.now()}`;
    const newRecord: FranchiseRecord = {
      ...data,
      id,
      qrCodeData: '',
      violationsCount: 0,
      status: 'Active',
      documentsVerified: true,
      hasPermanentQr: false, // Starts false until permanent QR code is generated by Admin
    };
    newRecord.qrCodeData = buildPermanentQrPayload(newRecord);

    setFranchises(prev => [newRecord, ...prev]);
    setSelectedFranchiseId(id);

    // Save to both role-partitioned tables
    saveFranchiseRegistrationInSupabase(newRecord, data.vehicleCategory);
    saveFranchiseRecordInSupabase(newRecord, data.vehicleCategory);

    return id;
  };

  const generatePermanentQr = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    const target = franchises.find(f => f.id === id);
    if (target) {
      const updatedTarget: FranchiseRecord = {
        ...target,
        hasPermanentQr: true,
        qrGeneratedDate: today,
      };
      const fullQrPayload = buildPermanentQrPayload(updatedTarget);
      
      savePermanentQRCodeInSupabase({
        franchise_id: target.id,
        mtop_number: target.mtopNumber,
        city_plate_number: target.cityPlateNumber || target.mtopNumber,
        driver_name: target.driverName,
        driver_license_no: target.driverLicenseNo || 'N02-18-994820',
        qr_payload: fullQrPayload,
      }, target.vehicleCategory);
      updateFranchiseQrInSupabase(target.mtopNumber, today, target.vehicleCategory);
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

  const generateAllPermanentQr = () => {
    const today = new Date().toISOString().split('T')[0];
    franchises.forEach(target => {
      const updatedTarget: FranchiseRecord = {
        ...target,
        hasPermanentQr: true,
        qrGeneratedDate: target.qrGeneratedDate || today,
      };
      const fullQrPayload = buildPermanentQrPayload(updatedTarget);

      savePermanentQRCodeInSupabase({
        franchise_id: target.id,
        mtop_number: target.mtopNumber,
        city_plate_number: target.cityPlateNumber || target.mtopNumber,
        driver_name: target.driverName,
        driver_license_no: target.driverLicenseNo || 'N02-18-994820',
        qr_payload: fullQrPayload,
      }, target.vehicleCategory);
      updateFranchiseQrInSupabase(target.mtopNumber, today, target.vehicleCategory);
    });
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

  const renewFranchise = (id: string, renewalData?: { newExpiry?: string; orNumber?: string; amountPaid?: number }) => {
    const target = franchises.find(f => f.id === id);
    const newExpiry = renewalData?.newExpiry || '2027-01-15';
    if (target) {
      saveFranchiseRenewalInSupabase({
        mtop_number: target.mtopNumber,
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
        return {
          ...item,
          status: 'Active',
          expirationDate: newExpiry,
        };
      }
      return item;
    }));
  };

  const deactivateFranchise = (id: string, reason: string = 'Administrative Deactivation') => {
    const target = franchises.find(f => f.id === id);
    if (target) {
      saveDeactivationInSupabase({
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

  const addViolation = (data: Omit<ViolationRecord, 'id' | 'dateSubmitted' | 'status'>) => {
    const newViol: ViolationRecord = {
      ...data,
      id: `viol-${Date.now()}`,
      dateSubmitted: new Date().toISOString().split('T')[0],
      status: 'Pending',
    };
    setViolations(prev => [newViol, ...prev]);

    const target = franchises.find(f => f.id === data.franchiseId || f.mtopNumber === data.mtopNumber);
    const cat = target?.vehicleCategory || vehicleCategory;
    saveViolationInSupabase(newViol, cat);

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

  const updateViolationStatus = (id: string, status: 'Pending' | 'Settled' | 'Under Investigation') => {
    const targetViol = violations.find(v => v.id === id);
    if (targetViol) {
      const targetFranchise = franchises.find(f => f.mtopNumber === targetViol.cityPlateNumber || f.id === targetViol.franchiseId);
      const cat = targetFranchise?.vehicleCategory || (targetViol.cityPlateNumber.startsWith('P-') ? 'Pedicab' : 'Tricycle');
      updateViolationStatusInSupabase(id, status, cat);
    }
    setViolations(prev => prev.map(v => v.id === id ? { ...v, status } : v));
  };

  const updateDriver = (mtopNumber: string, driverData: { driverName: string; licenseNo?: string; contact?: string; address?: string; availability?: string }) => {
    const target = franchises.find(f => f.mtopNumber === mtopNumber);
    const cat = target?.vehicleCategory || vehicleCategory;
    saveDriverRegistryUpdateInSupabase({
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

  const approveReview = (reviewId: string) => {
    const target = pendingReviews.find(r => r.id === reviewId);
    if (!target) return;

    setPendingReviews(prev => prev.map(r => 
      r.id === reviewId ? { ...r, status: 'Approved' as const } : r
    ));

    const plate = target.cityPlateAssigned || target.mtopAssigned || '1243';
    const newId = addFranchise({
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
  };

  const rejectReview = (reviewId: string, notes: string) => {
    setPendingReviews(prev => prev.map(r => 
      r.id === reviewId ? { ...r, status: 'Rejected' as const, reviewNotes: notes } : r
    ));
  };

  const updateComplaintStatus = (id: string, status: 'Under Investigation' | 'Resolved' | 'Escalated') => {
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    updatePassengerComplaintStatusInSupabase(id, status);
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
        isAuthenticated,
        setIsAuthenticated,
        searchQuery,
        setSearchQuery,
        selectedReview,
        setSelectedReview,
        selectedFranchiseId,
        setSelectedFranchiseId,
        addFranchise,
        generatePermanentQr,
        generateAllPermanentQr,
        renewFranchise,
        deactivateFranchise,
        addViolation,
        updateViolationStatus,
        updateComplaintStatus,
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
