export type VehicleCategory = 'Tricycle' | 'Pedicab';

export type FranchiseStatus = 'Active' | 'Pending Renewal' | 'Deactivated' | 'Under Review';

export interface FareMatrixItem {
  id?: string;
  destination: string;
  regularFare: string;
  studentFare: string;
  seniorPwdFare: string;
  discountedFare?: string;
}

export interface FranchiseRecord {
  id: string;
  applicationNo?: string;
  cityPlateNumber: string;
  mtopNumber: string; // alias
  plateNumber: string;
  vehicleCategory: VehicleCategory;
  
  // Operator fields from form
  operatorLastName?: string;
  operatorFirstName?: string;
  operatorMiddleName?: string;
  operatorName: string;
  operatorContact?: string;
  operatorAddress?: string;
  residentialAddress?: string;

  // Driver fields from form
  driverLastName?: string;
  driverFirstName?: string;
  driverMiddleName?: string;
  driverName: string;
  driverAddress?: string;
  driverLicenseNo?: string;
  licenseExpiry?: string;

  // Legacy vehicle unit fields (optional)
  makeModel?: string;
  engineNumber?: string;
  chassisNumber?: string;

  // Franchise & route details
  registrationDate?: string;
  expirationDate: string;
  status: FranchiseStatus;
  routeParada?: string;
  touristGuide?: string;
  availability?: string;
  fareMatrix?: FareMatrixItem[];
  standardFare?: string;

  // Badge & tracking
  qrCodeData: string;
  violationsCount: number;
  documentsVerified?: boolean;
  hasPermanentQr?: boolean;
  qrGeneratedDate?: string;
}

export interface ViolationRecord {
  id: string;
  franchiseId: string;
  cityPlateNumber: string;
  mtopNumber: string;
  plateNumber: string;
  operatorName: string;
  driverName: string;
  violationType: string;
  location: string;
  fineAmount: number;
  enforcerName: string;
  reportedBy?: string; // Citizen reporter username e.g. "andrie30311"
  dateSubmitted: string;
  remarks: string;
  status: 'Pending' | 'Settled' | 'Under Investigation';
}

export interface DocumentItem {
  id: string;
  title: string;
  type: string;
  verified: boolean;
}

export interface PendingReview {
  id: string;
  applicantName: string;
  vehicleCategory: VehicleCategory;
  dateSubmitted: string;
  applicationType: 'New Registration' | 'Renewal' | 'Ownership Transfer';
  contactNumber: string;
  address: string;
  cityPlateAssigned: string;
  mtopAssigned: string;
  documents: DocumentItem[];
  status: 'Pending Document Review' | 'Approved' | 'Rejected';
  reviewNotes?: string;
}

export interface PassengerComplaint {
  id: string;
  complainantName: string;
  contactNumber: string;
  cityPlateNumber: string;
  mtopNumber: string;
  vehicleCategory?: VehicleCategory;
  incidentDate: string;
  issueType: string;
  description: string;
  status: 'Under Investigation' | 'Resolved' | 'Escalated';
}

export type ActiveModule = 
  | 'overview'
  | 'register'
  | 'renewal'
  | 'qr_scanner'
  | 'driver_registry'
  | 'franchise_records'
  | 'reports'
  | 'violation_entry'
  | 'deactivation';
