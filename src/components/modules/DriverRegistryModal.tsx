import React, { useState } from 'react';
import { useFranchise } from '../../context/FranchiseContext';
import type { FranchiseRecord, FranchiseStatus, VehicleCategory } from '../../types';
import {
  Search,
  Phone,
  MapPin,
  Building2,
  Users,
  Navigation,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Receipt,
  PlusCircle,
  Trash2,
  UserCheck,
  ShieldCheck,
  Printer,
  Camera,
  Upload
} from 'lucide-react';
import { formatTitleCase, formatCodeUpper } from '../../utils/formatters';
import { cleanFare, getDefaultFareMatrix } from '../../utils/fareUtils';
import { printDriverRegistryUpdateSlip } from '../../utils/printUtils';
import {
  validateContactNumber,
  validateName,
  validateAddress,
  cleanDigitsOnly,
  cleanName,
  cleanAddress
} from '../../utils/validation';

interface FareRow {
  id: string;
  destination: string;
  regularFare: string;
  studentFare: string;
  seniorPwdFare: string;
}

const splitFullName = (fullName?: string) => {
  if (!fullName) return { first: '', middle: '', last: '' };
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], middle: '', last: '' };
  if (parts.length === 2) return { first: parts[0], middle: '', last: parts[1] };
  const first = parts.slice(0, parts.length - 2).join(' ') || parts[0];
  const middle = parts[parts.length - 2];
  const last = parts[parts.length - 1];
  return { first, middle, last };
};

export const DriverRegistryModal: React.FC = () => {
  const { activeModule, franchises = [], updateDriver } = useFranchise();
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Category Filter and Pagination states
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Tricycle' | 'Pedicab'>('All');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Floating Completion Card State
  const [completedUpdateSummary, setCompletedUpdateSummary] = useState<{
    plate: string;
    mtopNumber: string;
    previousDriver: string;
    newDriver: string;
    previousOperator: string;
    newOperator: string;
    routeParada: string;
    touristGuide: string;
    status: string;
    processedAt: string;
    driverPhoto?: string;
  } | null>(null);

  // Inline Edit State — Matches Register Franchise full fields
  const [editingUnit, setEditingUnit] = useState<FranchiseRecord | null>(null);
  const [ownerLastName, setOwnerLastName] = useState('');
  const [ownerFirstName, setOwnerFirstName] = useState('');
  const [ownerMiddleName, setOwnerMiddleName] = useState('');
  const [age, setAge] = useState('');
  const [ownerContact, setOwnerContact] = useState('');
  const [gmail, setGmail] = useState('');
  const [residentialAddress, setResidentialAddress] = useState('');

  const [driverLastName, setDriverLastName] = useState('');
  const [driverFirstName, setDriverFirstName] = useState('');
  const [driverMiddleName, setDriverMiddleName] = useState('');
  const [driverAddress, setDriverAddress] = useState('');
  const [driverPhoto, setDriverPhoto] = useState<string>('');

  const [applicationNo, setApplicationNo] = useState('');
  const [editVehicleCategory, setEditVehicleCategory] = useState<VehicleCategory>('Tricycle');
  const [modelMake, setModelMake] = useState('');
  const [color, setColor] = useState('');
  const [touristGuide, setTouristGuide] = useState<'Yes' | 'No'>('No');
  const [editStatus, setEditStatus] = useState<FranchiseStatus>('Active');
  const [paradaRoute, setParadaRoute] = useState('');
  const [cityPlateNo, setCityPlateNo] = useState('');
  const [expirationDate, setExpirationDate] = useState('');

  const [receiptNumber, setReceiptNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [fareMatrix, setFareMatrix] = useState<FareRow[]>([]);

  const [formError, setFormError] = useState<string | null>(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isConfirmedChecked, setIsConfirmedChecked] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  if (activeModule !== 'driver_registry') return null;

  const totalAll = franchises.length;
  const totalTricycles = franchises.filter(f => f.vehicleCategory === 'Tricycle').length;
  const totalPedicabs = franchises.filter(f => f.vehicleCategory === 'Pedicab').length;

  const filteredFranchises = franchises.filter(f => {
    if (categoryFilter !== 'All' && f.vehicleCategory !== categoryFilter) {
      return false;
    }
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      (f.operatorName || '').toLowerCase().includes(term) ||
      (f.driverName || '').toLowerCase().includes(term) ||
      (f.vehicleCategory || '').toLowerCase().includes(term) ||
      (f.cityPlateNumber || f.mtopNumber || '').toLowerCase().includes(term) ||
      (f.status || '').toLowerCase().includes(term) ||
      (f.operatorContact || '').toLowerCase().includes(term) ||
      (f.operatorAddress || f.residentialAddress || '').toLowerCase().includes(term) ||
      (f.driverAddress || '').toLowerCase().includes(term) ||
      (f.routeParada || '').toLowerCase().includes(term)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredFranchises.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredFranchises.length);
  const paginatedFranchises = filteredFranchises.slice(startIndex, endIndex);

  const handleOpenEditModal = (item: FranchiseRecord) => {
    setEditingUnit(item);
    const opParsed = splitFullName(item.operatorName || item.ownerName);
    const drvParsed = splitFullName(item.driverName || item.beneficiaryName);

    setOwnerLastName(item.ownerLastName || item.operatorLastName || opParsed.last);
    setOwnerFirstName(item.ownerFirstName || item.operatorFirstName || opParsed.first);
    setOwnerMiddleName(item.ownerMiddleName || item.operatorMiddleName || opParsed.middle);
    setAge(item.age || '');
    setOwnerContact(item.ownerContact || item.operatorContact || '');
    setGmail(item.gmail || item.email || item.operatorEmail || '');
    setResidentialAddress(item.residentialAddress || item.ownerAddress || item.operatorAddress || '');

    setDriverLastName(item.driverLastName || drvParsed.last);
    setDriverFirstName(item.driverFirstName || drvParsed.first);
    setDriverMiddleName(item.driverMiddleName || drvParsed.middle);
    setDriverAddress(item.driverAddress || item.beneficiaryAddress || '');
    setDriverPhoto(item.driverPhoto || '');

    setApplicationNo(item.applicationNo || '');
    setEditVehicleCategory(item.vehicleCategory || 'Tricycle');
    setModelMake(item.modelMake || item.makeModel || '');
    setColor(item.color || '');
    setTouristGuide((item.touristGuide as 'Yes' | 'No') || 'No');
    setEditStatus(item.status || 'Active');
    setParadaRoute(item.routeParada || '');
    setCityPlateNo(item.cityPlateNumber || item.mtopNumber || '');
    setExpirationDate(item.expirationDate || '');

    setReceiptNumber(item.receiptNumber || item.orNumber || '');
    setPaymentDate(item.paymentDate || new Date().toISOString().split('T')[0]);
    setAmountPaid(
      item.amountPaid !== undefined && item.amountPaid !== null
        ? String(item.amountPaid)
        : (item.vehicleCategory === 'Pedicab' ? '250.00' : '450.00')
    );

    if (item.fareMatrix && item.fareMatrix.length > 0) {
      setFareMatrix(item.fareMatrix.map((f, i) => ({
        id: f.id || `f-${i + 1}`,
        destination: f.destination,
        regularFare: f.regularFare,
        studentFare: f.studentFare,
        seniorPwdFare: f.seniorPwdFare || f.discountedFare || ''
      })));
    } else {
      setFareMatrix(getDefaultFareMatrix(item.vehicleCategory || 'Tricycle').map((f, i) => ({
        id: f.id || `f-${i + 1}`,
        destination: f.destination,
        regularFare: f.regularFare,
        studentFare: f.studentFare,
        seniorPwdFare: f.seniorPwdFare || f.discountedFare || ''
      })));
    }

    setShowConfirmationModal(false);
    setIsConfirmedChecked(true);
    setFormError(null);
  };

  const handleCloseEditModal = () => {
    setEditingUnit(null);
    setDriverPhoto('');
    setShowConfirmationModal(false);
    setIsConfirmedChecked(true);
    setFormError(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress to 280x280 square avatar for lightweight Supabase sync
        const canvas = document.createElement('canvas');
        const maxDim = 280;
        const width = img.width;
        const height = img.height;
        const minDim = Math.min(width, height);
        const startX = (width - minDim) / 2;
        const startY = (height - minDim) / 2;

        canvas.width = maxDim;
        canvas.height = maxDim;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, maxDim, maxDim);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          setDriverPhoto(compressed);
        }
      };
      img.onerror = () => {
        setFormError('Could not process the selected image file.');
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setFormError('Could not read the selected image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleAddFareRow = () => {
    const isPedicab = editVehicleCategory === 'Pedicab';
    const regFare = isPedicab ? '15.00' : '20.00';
    const discFare = isPedicab ? '12.00' : '16.00';
    setFareMatrix(prev => [
      ...prev,
      {
        id: `fare-${Date.now()}`,
        destination: '',
        regularFare: regFare,
        studentFare: discFare,
        seniorPwdFare: discFare,
      }
    ]);
  };

  const handleRemoveFareRow = (id: string) => {
    if (fareMatrix.length <= 1) return;
    setFareMatrix(prev => prev.filter(r => r.id !== id));
  };

  const handleUpdateFareRow = (id: string, field: keyof FareRow, value: string) => {
    const formattedValue = field === 'destination' ? formatTitleCase(value) : value;
    setFareMatrix(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: formattedValue };
      if (field === 'regularFare') {
        const cleanedStr = value.replace(/[₱Php\s,]/gi, '');
        const num = parseFloat(cleanedStr);
        if (!isNaN(num) && num > 0) {
          const discount = (num * 0.8).toFixed(2);
          updated.studentFare = discount;
          updated.seniorPwdFare = discount;
        }
      }
      return updated;
    }));
  };

  const handleInitiateSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnit) return;

    const opRes = validateName(ownerLastName, 'Operator Last Name', true);
    if (!opRes.isValid) {
      setFormError(opRes.error!);
      return;
    }

    const opFirstRes = validateName(ownerFirstName, 'Operator First Name', true);
    if (!opFirstRes.isValid) {
      setFormError(opFirstRes.error!);
      return;
    }

    const contactRes = validateContactNumber(ownerContact, false);
    if (!contactRes.isValid) {
      setFormError(contactRes.error!);
      return;
    }

    if (residentialAddress.trim()) {
      const addrRes = validateAddress(residentialAddress, 'Residential Address', false);
      if (!addrRes.isValid) {
        setFormError(addrRes.error!);
        return;
      }
    }

    if (!cityPlateNo.trim()) {
      setFormError('Franchise No. / City Plate No. is required.');
      return;
    }

    setFormError(null);
    setIsConfirmedChecked(true);
    setShowConfirmationModal(true);
  };

  const handleConfirmFinalSave = async () => {
    if (!editingUnit) return;
    setIsSaving(true);
    try {
      const targetPlate = editingUnit.cityPlateNumber || editingUnit.mtopNumber;
      const finalOwnerName = [ownerFirstName, ownerMiddleName, ownerLastName].map(s => s.trim()).filter(Boolean).join(' ');
      const finalDriverName = [driverFirstName, driverMiddleName, driverLastName].map(s => s.trim()).filter(Boolean).join(' ') || editingUnit.driverName || 'No Driver Assigned';

      await updateDriver(targetPlate, {
        ownerLastName: cleanName(ownerLastName),
        ownerFirstName: cleanName(ownerFirstName),
        ownerMiddleName: cleanName(ownerMiddleName),
        ownerName: finalOwnerName,
        ownerContact: ownerContact.trim(),
        gmail: gmail.trim(),
        email: gmail.trim(),
        ownerAddress: cleanAddress(residentialAddress),
        residentialAddress: cleanAddress(residentialAddress),
        age: age.trim(),
        beneficiaryName: cleanName(finalDriverName),
        beneficiaryAddress: cleanAddress(driverAddress),

        operatorLastName: cleanName(ownerLastName),
        operatorFirstName: cleanName(ownerFirstName),
        operatorMiddleName: cleanName(ownerMiddleName),
        operatorName: finalOwnerName,
        operatorContact: ownerContact.trim(),
        operatorAddress: cleanAddress(residentialAddress),

        driverLastName: cleanName(driverLastName),
        driverFirstName: cleanName(driverFirstName),
        driverMiddleName: cleanName(driverMiddleName),
        driverName: finalDriverName,
        driverAddress: cleanAddress(driverAddress),
        driverPhoto: driverPhoto || undefined,

        applicationNo: applicationNo.trim(),
        vehicleCategory: editVehicleCategory,
        modelMake: modelMake.trim(),
        makeModel: modelMake.trim(),
        color: color.trim(),
        touristGuide,
        status: editStatus,
        routeParada: paradaRoute.trim(),
        cityPlateNumber: cityPlateNo.trim() || targetPlate,
        expirationDate,

        receiptNumber: receiptNumber.trim(),
        orNumber: receiptNumber.trim(),
        paymentDate,
        amountPaid,

        fareMatrix: fareMatrix.map(row => ({
          id: row.id,
          destination: row.destination,
          regularFare: cleanFare(row.regularFare),
          studentFare: cleanFare(row.studentFare),
          seniorPwdFare: cleanFare(row.seniorPwdFare),
        }))
      });

      setCompletedUpdateSummary({
        plate: cityPlateNo.trim() || targetPlate,
        mtopNumber: editingUnit.mtopNumber,
        previousDriver: editingUnit.driverName || '—',
        newDriver: finalDriverName || '—',
        previousOperator: editingUnit.operatorName || editingUnit.ownerName || '—',
        newOperator: finalOwnerName || '—',
        routeParada: paradaRoute.trim(),
        touristGuide,
        status: editStatus,
        driverPhoto: driverPhoto || editingUnit.driverPhoto,
        processedAt: new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      });

      setNotification(
        `Franchise Record for Plate ${cityPlateNo.trim() || targetPlate} successfully updated!`
      );
      setTimeout(() => setNotification(null), 5000);
      handleCloseEditModal();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save franchise updates. Please try again.');
      setShowConfirmationModal(false);
    } finally {
      setIsSaving(false);
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

      {/* ── FLOATING PAGE: DRIVER & OPERATOR UPDATE COMPLETION CARD ── */}
      {completedUpdateSummary && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCompletedUpdateSummary(null);
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
                    Franchise Record Updated — Plate {completedUpdateSummary.plate}
                  </h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCompletedUpdateSummary(null)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close floating page"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Driver Assignment Change */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Driver Assignment
                  </span>
                  <div className="flex items-center space-x-3 mt-1.5">
                    {completedUpdateSummary.driverPhoto && (
                      <img
                        src={completedUpdateSummary.driverPhoto}
                        alt="Driver"
                        className="h-10 w-10 rounded-xl object-cover border-2 border-emerald-500 shadow-2xs shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-400 line-through truncate max-w-[130px]">
                          {completedUpdateSummary.previousDriver}
                        </span>
                        <span className="text-slate-400 font-bold">➔</span>
                        <span className="font-bold text-sm text-slate-900 bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-0.5 rounded-lg truncate">
                          {completedUpdateSummary.newDriver}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Operator Assignment Change */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Operator Assignment
                  </span>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-slate-400 line-through truncate max-w-[150px]">
                      {completedUpdateSummary.previousOperator}
                    </span>
                    <span className="text-slate-400 font-bold">➔</span>
                    <span className="font-bold text-sm text-slate-900 bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-0.5 rounded-lg truncate">
                      {completedUpdateSummary.newOperator}
                    </span>
                  </div>
                </div>
              </div>

              {/* Other Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-semibold text-[10px] uppercase block">Route / Parada</span>
                  <p className="font-bold text-slate-900 mt-1 truncate">{completedUpdateSummary.routeParada || 'Sua-Igot 24 Tabaco'}</p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-semibold text-[10px] uppercase block">Accredited Tourist Guide</span>
                  <p className="font-bold text-emerald-800 mt-1">{completedUpdateSummary.touristGuide || 'Yes'}</p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-semibold text-[10px] uppercase block">Status</span>
                  <p className="font-bold text-slate-900 mt-1">{completedUpdateSummary.status || 'Active'}</p>
                </div>
              </div>

              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200 text-center text-slate-500 text-[11px] italic">
                ✓ Recorded in TRD database &amp; operator/driver audit history at {completedUpdateSummary.processedAt}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3 shrink-0">
              <span className="text-[11px] text-slate-400 italic">
                Official Municipal Conveyance Registry • Tabaco City TRD
              </span>
              <div className="flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={() => printDriverRegistryUpdateSlip(completedUpdateSummary)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                >
                  <Printer className="h-4 w-4 text-slate-600" />
                  <span>Print Record</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCompletedUpdateSummary(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
                >
                  Done / Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline Edit Form Card — Layout Identical to Register Franchise */}
      {editingUnit && (
        <form onSubmit={handleInitiateSave} className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-indigo-500/50 shadow-md space-y-6 animate-fadeIn">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-200">
                <Edit3 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Edit Franchise Record &amp; Operator/Driver
                </h3>
                <p className="text-xs text-slate-400 font-medium italic mt-0.5">
                  Unit Plate: <span className="font-bold text-slate-800">{editingUnit.cityPlateNumber || editingUnit.mtopNumber}</span> • Update owner, driver, vehicle, official receipt, and fare matrix details
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                Editing Franchise
              </span>
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close Edit Form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {formError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* 2-Column Responsive Layout — Same as Register Franchise */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-5 items-start">
            {/* ================= LEFT COLUMN ================= */}
            <div className="space-y-4">
              {/* Operator: Last Name, First Name, Middlename */}
              <div>
                <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                  Operator
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    value={ownerLastName}
                    onChange={(e) => setOwnerLastName(cleanName(formatTitleCase(e.target.value)))}
                    placeholder="Last Name"
                    className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                  <input
                    type="text"
                    required
                    value={ownerFirstName}
                    onChange={(e) => setOwnerFirstName(cleanName(formatTitleCase(e.target.value)))}
                    placeholder="First Name"
                    className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                  <input
                    type="text"
                    value={ownerMiddleName}
                    onChange={(e) => setOwnerMiddleName(cleanName(formatTitleCase(e.target.value)))}
                    placeholder="Middle Name"
                    className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Age, Mobile Number & Gmail */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                    Age
                  </label>
                  <input
                    type="number"
                    min="18"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 42"
                    className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    value={ownerContact}
                    onChange={(e) => setOwnerContact(cleanDigitsOnly(e.target.value, 11))}
                    placeholder="e.g. 09178821920"
                    className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                    Gmail (Optional)
                  </label>
                  <input
                    type="email"
                    value={gmail}
                    onChange={(e) => setGmail(e.target.value.trim())}
                    placeholder="e.g. operator@gmail.com"
                    className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Residential Address */}
              <div>
                <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                  Residential Address
                </label>
                <input
                  type="text"
                  value={residentialAddress}
                  onChange={(e) => setResidentialAddress(cleanAddress(formatTitleCase(e.target.value)))}
                  placeholder="Zone 4, Poblacion, Tabaco City"
                  className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>


              {/* Driver */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-[13px] font-bold text-slate-800">
                    Driver Information &amp; Photo
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">Syncs with mobile web app</span>
                </div>

                {/* Driver Photo Upload & Preview Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-3 flex items-center space-x-3.5 shadow-2xs">
                  <div className="relative shrink-0">
                    {driverPhoto ? (
                      <div className="relative">
                        <img
                          src={driverPhoto}
                          alt="Driver"
                          className="h-16 w-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setDriverPhoto('')}
                          className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-1 hover:bg-rose-600 transition-colors shadow-xs cursor-pointer"
                          title="Remove photo"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                        <Camera className="h-5 w-5 mb-0.5 text-slate-400" />
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Photo</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-xs font-bold text-slate-800">
                      {driverPhoto ? 'Official Driver Photo Loaded' : 'Upload Driver Photo'}
                    </p>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      This photo is displayed on the public mobile web verification dashboard when commuters or enforcers scan the QR badge.
                    </p>
                    <div className="flex items-center space-x-2 pt-1">
                      <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-2xs transition-colors">
                        <Upload className="h-3.5 w-3.5" />
                        <span>{driverPhoto ? 'Change Photo' : 'Upload Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                      {driverPhoto && (
                        <button
                          type="button"
                          onClick={() => setDriverPhoto('')}
                          className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-rose-600 border border-slate-200 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={driverLastName}
                    onChange={(e) => setDriverLastName(cleanName(formatTitleCase(e.target.value)))}
                    placeholder="Last Name"
                    className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                  <input
                    type="text"
                    value={driverFirstName}
                    onChange={(e) => setDriverFirstName(cleanName(formatTitleCase(e.target.value)))}
                    placeholder="First Name"
                    className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                  <input
                    type="text"
                    value={driverMiddleName}
                    onChange={(e) => setDriverMiddleName(cleanName(formatTitleCase(e.target.value)))}
                    placeholder="Middle Name"
                    className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Driver Address */}
              <div>
                <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                  Driver Address
                </label>
                <input
                  type="text"
                  value={driverAddress}
                  onChange={(e) => setDriverAddress(cleanAddress(formatTitleCase(e.target.value)))}
                  placeholder="Zone 4, Poblacion, Tabaco City"
                  className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* ================= RIGHT COLUMN ================= */}
            <div className="space-y-4">
              {/* Application No. & Vehicle Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                    Application No.
                  </label>
                  <input
                    type="text"
                    value={applicationNo}
                    onChange={(e) => setApplicationNo(e.target.value)}
                    className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                    <span>Vehicle Type *</span>
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Select Category
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditVehicleCategory('Tricycle')}
                      className={`flex items-center justify-center space-x-1.5 rounded-lg px-3 py-2 text-xs font-extrabold border-2 transition-all cursor-pointer ${editVehicleCategory === 'Tricycle'
                        ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs'
                        : 'bg-[#d8dfe6] border-[#c6cfd8] text-slate-700 hover:bg-white'
                        }`}
                    >
                      <span>🛺</span>
                      <span>Tricycle</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditVehicleCategory('Pedicab')}
                      className={`flex items-center justify-center space-x-1.5 rounded-lg px-3 py-2 text-xs font-extrabold border-2 transition-all cursor-pointer ${editVehicleCategory === 'Pedicab'
                        ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-xs'
                        : 'bg-[#d8dfe6] border-[#c6cfd8] text-slate-700 hover:bg-white'
                        }`}
                    >
                      <span>🚲</span>
                      <span>Pedicab</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Model / Make & Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                    Model / Make
                  </label>
                  <input
                    type="text"
                    value={modelMake}
                    onChange={(e) => setModelMake(formatTitleCase(e.target.value))}
                    placeholder={editVehicleCategory === 'Tricycle' ? 'Kawasaki Barako 175' : 'Passenger Pedicab'}
                    className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                    Color
                  </label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(formatTitleCase(e.target.value))}
                    placeholder="e.g. Blue / Silver"
                    className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Tourist Guide & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                    Tourist Guide
                  </label>
                  <select
                    value={touristGuide}
                    onChange={(e) => setTouristGuide(e.target.value as 'Yes' | 'No')}
                    className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer text-center"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as FranchiseStatus)}
                    className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer text-center"
                  >
                    <option value="Active">Active</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Pending Renewal">Pending Renewal</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Deactivated">Deactivated</option>
                  </select>
                </div>
              </div>

              {/* Parada/Route & City Plate No. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                    Parada/Route
                  </label>
                  <input
                    type="text"
                    value={paradaRoute}
                    onChange={(e) => setParadaRoute(formatTitleCase(e.target.value))}
                    className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                    Franchise No. / City Plate No.
                  </label>
                  <input
                    type="text"
                    required
                    value={cityPlateNo}
                    onChange={(e) => setCityPlateNo(formatCodeUpper(e.target.value))}
                    className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Expiration Date */}
              <div>
                <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                />
              </div>

              {/* Official Receipt & Payment Details */}
              <div className="bg-[#d8dfe6] border border-[#c4ccd6] rounded-xl p-3.5 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-400/40">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900">
                    <Receipt className="h-4 w-4 text-emerald-700" />
                    <span>Official Receipt &amp; Payment Details</span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Paid / Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Receipt No. (OR No.)
                    </label>
                    <input
                      type="text"
                      value={receiptNumber}
                      onChange={(e) => setReceiptNumber(e.target.value.toUpperCase())}
                      placeholder="OR-2026-10492"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      Amount Paid (PHP)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-700">
                        ₱
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        placeholder={editVehicleCategory === 'Pedicab' ? '250.00' : '450.00'}
                        className="w-full pl-6 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Fare Adjustment Matrix */}
              <div className="bg-[#d8dfe6] border border-[#c4ccd6] rounded-xl p-3.5 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-bold text-slate-900">
                    Fare Adjustment Matrix
                  </span>
                  <button
                    type="button"
                    onClick={handleAddFareRow}
                    className="flex items-center space-x-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
                  >
                    <PlusCircle className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Add Route/Distance</span>
                  </button>
                </div>

                <div className="border-t border-slate-400/40 pt-2 space-y-2">
                  <div className="grid grid-cols-12 gap-1.5 text-[10px] sm:text-[11px] font-bold text-slate-800 px-1 items-center">
                    <div className="col-span-5 truncate">Route / Distance</div>
                    <div className="col-span-2 text-center truncate">Regular Fare</div>
                    <div className="col-span-2 text-center truncate">Student</div>
                    <div className="col-span-2 text-center truncate">Senior 20%</div>
                    <div className="col-span-1 text-center"></div>
                  </div>

                  <div className="space-y-2 max-h-36 overflow-y-auto pr-0.5">
                    {fareMatrix.map((row) => (
                      <div key={row.id} className="grid grid-cols-12 gap-1.5 items-center">
                        <div className="col-span-5">
                          <input
                            type="text"
                            value={row.destination}
                            onChange={(e) => handleUpdateFareRow(row.id, 'destination', e.target.value)}
                            placeholder="Route / Distance"
                            className="w-full bg-white border border-slate-300 rounded-md px-2 py-1.5 text-xs text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            value={row.regularFare}
                            onChange={(e) => handleUpdateFareRow(row.id, 'regularFare', e.target.value)}
                            placeholder="20.00"
                            className="w-full bg-white border border-slate-300 rounded-md px-1 py-1.5 text-xs text-center font-bold text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            value={row.studentFare}
                            onChange={(e) => handleUpdateFareRow(row.id, 'studentFare', e.target.value)}
                            placeholder="15.00"
                            className="w-full bg-white border border-slate-300 rounded-md px-1 py-1.5 text-xs text-center font-bold text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            value={row.seniorPwdFare}
                            onChange={(e) => handleUpdateFareRow(row.id, 'seniorPwdFare', e.target.value)}
                            placeholder="15.00"
                            className="w-full bg-white border border-slate-300 rounded-md px-1 py-1.5 text-xs text-center font-bold text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          {fareMatrix.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => handleRemoveFareRow(row.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                              title="Remove route"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <span className="w-3.5" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCloseEditModal}
              className="bg-slate-200 hover:bg-slate-300 active:scale-[0.98] text-slate-800 font-bold text-xs sm:text-sm px-8 py-2.5 rounded-full transition-all cursor-pointer"
            >
              Cancel Edit
            </button>

            <button
              type="submit"
              className="bg-[#00ba7c] hover:bg-[#00a36d] active:scale-[0.98] text-slate-950 font-bold text-xs sm:text-sm px-10 py-2.5 rounded-full shadow-md border border-emerald-600/50 transition-all cursor-pointer flex items-center space-x-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Save Changes &amp; Update Record</span>
            </button>
          </div>
        </form>
      )}

      {/* Confirmation Modal for Edit Franchise Record */}
      {showConfirmationModal && editingUnit && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSaving) setShowConfirmationModal(false);
          }}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-indigo-900/40">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30">
                  <ShieldCheck className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">
                    Confirm Franchise Record Update
                  </h3>
                  <p className="text-[11px] text-indigo-200/80 font-mono">
                    Unit Plate: {cityPlateNo.trim() || editingUnit.cityPlateNumber || editingUnit.mtopNumber} • {editVehicleCategory}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isSaving && setShowConfirmationModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-amber-900 flex items-start space-x-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Please Review Changes Before Saving</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Are you sure you want to update this franchise record? This action will save changes to the official TRD Franchise and Driver Registry.
                  </p>
                </div>
              </div>

              {/* Summary Breakdown Grid */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Field</span>
                  <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Updated Information</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-slate-500 flex items-center space-x-1 shrink-0">
                      <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Operator:</span>
                    </span>
                    <span className="font-bold text-slate-900 text-right truncate">
                      {[ownerFirstName, ownerMiddleName, ownerLastName].filter(Boolean).join(' ') || '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-slate-500 flex items-center space-x-1 shrink-0">
                      <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Authorized Driver:</span>
                    </span>
                    <div className="flex items-center space-x-2 text-right truncate">
                      {driverPhoto && (
                        <img
                          src={driverPhoto}
                          alt="Driver"
                          className="h-6 w-6 rounded-lg object-cover border border-emerald-400 shrink-0 shadow-2xs"
                        />
                      )}
                      <span className="font-bold text-slate-900 truncate">
                        {[driverFirstName, driverMiddleName, driverLastName].filter(Boolean).join(' ') || 'No Driver Assigned'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-slate-500 flex items-center space-x-1 shrink-0">
                      <Navigation className="h-3.5 w-3.5 text-slate-500" />
                      <span>Parada / Route:</span>
                    </span>
                    <span className="font-medium text-slate-800 text-right truncate">
                      {paradaRoute || '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500">Franchise Status:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${editStatus === 'Active'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : editStatus === 'Suspended'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300 font-extrabold'
                        : editStatus === 'Expired'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                      {editStatus}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500 flex items-center space-x-1">
                      <Receipt className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Official Receipt:</span>
                    </span>
                    <span className="font-mono font-bold text-slate-800 text-right">
                      {receiptNumber || '—'} {amountPaid ? `(₱${amountPaid})` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Confirmation Checkbox */}
              <label className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-100 border border-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isConfirmedChecked}
                  onChange={(e) => setIsConfirmedChecked(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-[11px] font-semibold text-slate-800 leading-snug">
                  I confirm that all updated details for Unit <strong>{cityPlateNo.trim() || editingUnit.cityPlateNumber || editingUnit.mtopNumber}</strong> have been verified and authorized for official saving.
                </span>
              </label>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmationModal(false)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Return to Edit
                </button>

                <button
                  type="button"
                  onClick={handleConfirmFinalSave}
                  disabled={!isConfirmedChecked || isSaving}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all inline-flex items-center space-x-1.5 cursor-pointer ${isConfirmedChecked && !isSaving
                    ? 'bg-[#00ba7c] hover:bg-[#00a36d] text-slate-950 font-black active:scale-[0.98]'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isSaving ? 'Saving Changes...' : 'Yes, Confirm & Update'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Registry Grid Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="sticky top-[72px] z-20 bg-white/95 backdrop-blur-md -mx-5 sm:-mx-6 px-5 sm:px-6 py-3.5 -mt-5 sm:-mt-6 rounded-t-3xl border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
              <Users className="h-4 w-4 text-indigo-600 shrink-0" />
              <span>Driver &amp; Operator Directory</span>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter('All');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${categoryFilter === 'All'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                All ({totalAll})
              </button>
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter('Tricycle');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${categoryFilter === 'Tricycle'
                  ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Tricycle ({totalTricycles})
              </button>
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter('Pedicab');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${categoryFilter === 'Pedicab'
                  ? 'bg-white text-amber-900 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Pedicab ({totalPedicabs})
              </button>
            </div>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, plate, contact, route..."
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>
        </div>

        {/* Directory Cards Grid */}
        {filteredFranchises.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No driver or operator records found matching &ldquo;{searchTerm}&rdquo;
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedFranchises.map((item) => {
              const isEditingThis = editingUnit?.id === item.id;
              const operatorInitial = (item.operatorName || item.ownerName || 'O').charAt(0).toUpperCase();
              const driverInitial = (item.driverName || 'D').charAt(0).toUpperCase();

              return (
                <div
                  key={item.id}
                  className={`bg-slate-50 rounded-2xl p-4 border transition-all space-y-3 ${isEditingThis
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20'
                    : 'border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
                    }`}
                >
                  {/* Card Header: Plate & Category */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                        {item.cityPlateNumber || item.mtopNumber}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${item.vehicleCategory === 'Pedicab'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                        {item.vehicleCategory === 'Pedicab' ? 'Pedicab' : 'Tricycle'}
                      </span>
                    </div>

                    {item.routeParada && (
                      <span className="text-[10px] text-slate-500 font-semibold truncate max-w-[140px] flex items-center">
                        <Navigation className="h-3 w-3 mr-1 text-slate-400 shrink-0" />
                        <span className="truncate">{item.routeParada}</span>
                      </span>
                    )}
                  </div>

                  {/* Body: Two distinct columns for Operator vs Driver */}
                  <div className="space-y-2.5 text-xs">
                    {/* Operator Box */}
                    <div className="bg-white p-3 rounded-xl border border-indigo-100 space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 text-[11px] font-bold text-indigo-700 uppercase tracking-wide">
                          <Building2 className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                          <span>Franchise Operator</span>
                        </div>
                        {item.operatorContact && (
                          <span className="text-[10px] font-mono text-slate-500 flex items-center">
                            <Phone className="h-3 w-3 mr-1 text-slate-400" />
                            {item.operatorContact}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2.5 pt-0.5">
                        <div className="h-8 w-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 font-black text-xs flex items-center justify-center shrink-0">
                          {operatorInitial}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {item.operatorName || item.ownerName || 'Unassigned Operator'}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {item.residentialAddress || item.operatorAddress || 'No address specified'}
                          </p>
                        </div>
                      </div>
                      {item.operatorAddress && (
                        <p className="text-[10px] text-slate-500 truncate flex items-center pt-1 border-t border-slate-100 mt-1">
                          <MapPin className="h-3 w-3 mr-1 text-slate-400 shrink-0" />
                          <span className="truncate">{item.operatorAddress}</span>
                        </p>
                      )}
                    </div>

                    {/* Driver Box */}
                    <div className="bg-white p-3 rounded-xl border border-emerald-100 space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 text-[11px] font-bold text-emerald-700 uppercase tracking-wide">
                          <UserCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>Authorized Driver</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2.5 pt-0.5">
                        {item.driverPhoto ? (
                          <img
                            src={item.driverPhoto}
                            alt={item.driverName}
                            className="h-8 w-8 rounded-xl object-cover border border-emerald-300 shadow-2xs shrink-0"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0">
                            {driverInitial}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {item.driverName || 'No Driver Assigned'}
                          </p>
                          <div className="flex items-center space-x-1.5 text-[11px] mt-0.5">
                            <span className="font-semibold text-slate-500">Status:</span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase font-mono ${item.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : item.status === 'Suspended'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300 font-extrabold'
                                : item.status === 'Expired'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}>
                              {item.status || 'Active'}
                            </span>
                          </div>
                        </div>
                      </div>
                      {item.driverAddress && (
                        <p className="text-[10px] text-slate-500 truncate flex items-center pt-1 border-t border-slate-100 mt-1">
                          <MapPin className="h-3 w-3 mr-1 text-slate-400 shrink-0" />
                          <span className="truncate">{item.driverAddress}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-2 border-t border-slate-200/80 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(item)}
                      className={`w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-[0.98] ${isEditingThis
                        ? 'bg-slate-900 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>{isEditingThis ? 'Editing Above' : 'Edit Franchise Record'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls — Matching Franchise Records */}
        {filteredFranchises.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-900">{filteredFranchises.length === 0 ? 0 : startIndex + 1}</span> to{' '}
              <span className="font-bold text-slate-900">{endIndex}</span> of{' '}
              <span className="font-bold text-slate-900">{filteredFranchises.length}</span> units
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center space-x-1.5 text-slate-600 font-medium mr-2">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value={6}>6 (Compact)</option>
                  <option value={10}>10 (Standard - No Scroll)</option>
                  <option value={16}>16 (Medium)</option>
                  <option value={20}>20 (Extended)</option>
                </select>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center space-x-1 text-xs font-bold"
                  title="First Page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center space-x-1 text-xs font-bold shadow-2xs"
                  title="Previous Page"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Prev</span>
                </button>

                {/* Direct Numbered Page Buttons for Page-by-Page navigation */}
                <div className="flex items-center space-x-1 px-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                    .map((pageNum, idx, arr) => {
                      const prevPage = arr[idx - 1];
                      return (
                        <React.Fragment key={pageNum}>
                          {prevPage && pageNum - prevPage > 1 && (
                            <span className="px-1 text-slate-400 font-bold text-xs select-none">...</span>
                          )}
                          <button
                            type="button"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`min-w-8 h-8 px-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${currentPage === pageNum
                              ? 'bg-slate-900 text-white shadow-xs scale-105'
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400'
                              }`}
                          >
                            {pageNum}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center space-x-1 text-xs font-bold shadow-2xs"
                  title="Next Page"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center space-x-1 text-xs font-bold"
                  title="Last Page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
