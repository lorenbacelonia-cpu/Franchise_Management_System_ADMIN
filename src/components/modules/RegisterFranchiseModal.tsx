import React, { useState, useEffect, useRef } from 'react';
import { useFranchise } from '../../context/FranchiseContext';
import type { FranchiseStatus } from '../../types';
import { 
  ArrowLeft, 
  UserPlus, 
  CheckCircle2, 
  QrCode, 
  Users, 
  Lock, 
  Sparkles, 
  PlusCircle, 
  Trash2,
  Receipt,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatTitleCase } from '../../utils/formatters';
import { cleanFare, getDefaultFareMatrix } from '../../utils/fareUtils';
import {
  validateContactNumber,
  validateName,
  validateAddress,
  validateAge,
  validateCode,
  validateRoute,
  validateModelOrColor,
  validateAmount,
  validateDate,
  preventNonDigits,
  preventSpecialCharsForName,
  preventSpecialCharsForAddress,
  preventSpecialCharsForCode,
  preventSpecialCharsForRoute,
  cleanDigitsOnly,
  cleanName,
  cleanAddress,
  cleanCode,
  cleanRoute,
  cleanModelOrColor
} from '../../utils/validation';

interface FareRow {
  id: string;
  destination: string;
  regularFare: string;
  studentFare: string;
  seniorPwdFare: string;
}

export const RegisterFranchiseModal: React.FC = () => {
  const { 
    activeModule, 
    setActiveModule, 
    addFranchise, 
    vehicleCategory, 
    setSelectedFranchiseId,
    franchises,
    generatePermanentQr
  } = useFranchise();

  const formContainerRef = useRef<HTMLDivElement>(null);

  // Left Column - Owner Details
  const [ownerLastName, setOwnerLastName] = useState('');
  const [ownerFirstName, setOwnerFirstName] = useState('');
  const [ownerMiddleName, setOwnerMiddleName] = useState('');
  const [age, setAge] = useState('');
  const [ownerContact, setOwnerContact] = useState('');
  const [residentialAddress, setResidentialAddress] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryAddress, setBeneficiaryAddress] = useState('');

  // Left Column - Driver Details
  const [driverLastName, setDriverLastName] = useState('');
  const [driverFirstName, setDriverFirstName] = useState('');
  const [driverMiddleName, setDriverMiddleName] = useState('');
  const [driverAddress, setDriverAddress] = useState('');

  // Right Column - Franchise & Unit Details
  const [applicationNo, setApplicationNo] = useState(`APP-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [modelMake, setModelMake] = useState('');
  const [color, setColor] = useState('');
  const [touristGuide, setTouristGuide] = useState<'Yes' | 'No'>('Yes');
  const [status, setStatus] = useState<FranchiseStatus>('Active');
  const [paradaRoute, setParadaRoute] = useState('Sua-Igot 24 Tabaco');
  const [cityPlateNo, setCityPlateNo] = useState(vehicleCategory === 'Tricycle' ? 'T-106' : 'P-106');
  const [expirationDate, setExpirationDate] = useState('2027-01-15');

  // Official Receipt & Payment Details
  const [receiptNumber, setReceiptNumber] = useState(`OR-2026-${Math.floor(10000 + Math.random() * 90000)}`);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [amountPaid, setAmountPaid] = useState(vehicleCategory === 'Pedicab' ? '250.00' : '450.00');

  // Validation & Error Tracking State
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Fare Adjustment Matrix (per Destination / Route) - Separate Student & Senior 20%
  const [fareMatrix, setFareMatrix] = useState<FareRow[]>([
    {
      id: 'fare-1',
      destination: 'Short Distance (Base)',
      regularFare: '20.00',
      studentFare: '16.00',
      seniorPwdFare: '16.00',
    },
    {
      id: 'fare-2',
      destination: 'Poblacion to Miss pina',
      regularFare: '50.00',
      studentFare: '40.00',
      seniorPwdFare: '40.00',
    },
    {
      id: 'fare-3',
      destination: 'Longer Distance (Inter-Brgy)',
      regularFare: '25.00',
      studentFare: '20.00',
      seniorPwdFare: '20.00',
    }
  ]);

  // Sync category and default fare matrix when switching vehicle mode from dashboard
  useEffect(() => {
    if (vehicleCategory) {
      setCityPlateNo(vehicleCategory === 'Tricycle' ? 'T-106' : 'P-106');
      setAmountPaid(vehicleCategory === 'Pedicab' ? '250.00' : '450.00');
      const defaultRows = getDefaultFareMatrix(vehicleCategory).map(f => {
        const fallback = vehicleCategory === 'Pedicab' ? '15.00' : '20.00';
        const reg = cleanFare(f.regularFare, fallback);
        const regNum = parseFloat(reg);
        const discount = (regNum * 0.8).toFixed(2);
        return {
          id: f.id || `fare-${Math.random()}`,
          destination: f.destination,
          regularFare: reg,
          studentFare: cleanFare(f.studentFare, discount),
          seniorPwdFare: cleanFare(f.seniorPwdFare || f.discountedFare, discount),
        };
      });
      setFareMatrix(defaultRows);
    }
  }, [vehicleCategory]);

  const [createdId, setCreatedId] = useState<string | null>(null);

  if (activeModule !== 'register') return null;

  const clearFieldError = (field: string) => {
    setFieldErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    if (formError) setFormError(null);
  };

  const handleAddFareRow = () => {
    const defaultReg = vehicleCategory === 'Pedicab' ? '15.00' : '20.00';
    const defaultDiscount = vehicleCategory === 'Pedicab' ? '12.00' : '16.00';
    setFareMatrix(prev => [
      ...prev,
      {
        id: `fare-${Date.now()}`,
        destination: '',
        regularFare: defaultReg,
        studentFare: defaultDiscount,
        seniorPwdFare: defaultDiscount,
      }
    ]);
  };

  const handleRemoveFareRow = (id: string) => {
    if (fareMatrix.length <= 1) return;
    setFareMatrix(prev => prev.filter(r => r.id !== id));
  };

  const handleUpdateFareRow = (id: string, field: keyof FareRow, value: string) => {
    let formattedValue = value;
    if (field === 'destination') {
      formattedValue = cleanRoute(formatTitleCase(value));
      clearFieldError(`fare_${id}_destination`);
    } else {
      formattedValue = value.replace(/[^0-9.]/g, '');
      clearFieldError(`fare_${id}_regular`);
    }

    setFareMatrix(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: formattedValue };
      if (field === 'regularFare') {
        const cleanedStr = formattedValue.replace(/[₱Php\s,]/gi, '');
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

  const trimmedPlate = cityPlateNo.trim().toUpperCase();
  const duplicateFranchise = franchises.find(f => {
    if (!trimmedPlate) return false;
    const p = (f.cityPlateNumber || '').trim().toUpperCase();
    const m = (f.mtopNumber || '').trim().toUpperCase();
    return (p === trimmedPlate || m === trimmedPlate) && f.vehicleCategory?.toLowerCase() === vehicleCategory?.toLowerCase();
  });

  const handleReset = () => {
    setCreatedId(null);
    setFormError(null);
    setFieldErrors({});
    setOwnerLastName('');
    setOwnerFirstName('');
    setOwnerMiddleName('');
    setAge('');
    setOwnerContact('');
    setResidentialAddress('');
    setBeneficiaryName('');
    setBeneficiaryAddress('');
    setDriverLastName('');
    setDriverFirstName('');
    setDriverMiddleName('');
    setDriverAddress('');
    setModelMake('');
    setColor('');
    setCityPlateNo(vehicleCategory === 'Tricycle' ? 'T-106' : 'P-106');
    setApplicationNo(`APP-2026-${Math.floor(100 + Math.random() * 900)}`);
    setReceiptNumber(`OR-2026-${Math.floor(10000 + Math.random() * 90000)}`);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setAmountPaid(vehicleCategory === 'Pedicab' ? '250.00' : '450.00');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const errors: Record<string, string> = {};

    // 1. Owner Details Validation
    const ownerLastRes = validateName(ownerLastName, 'Owner Last Name', true);
    if (!ownerLastRes.isValid) errors.ownerLastName = ownerLastRes.error!;

    const ownerFirstRes = validateName(ownerFirstName, 'Owner First Name', true);
    if (!ownerFirstRes.isValid) errors.ownerFirstName = ownerFirstRes.error!;

    if (ownerMiddleName.trim()) {
      const ownerMidRes = validateName(ownerMiddleName, 'Owner Middle Name', false);
      if (!ownerMidRes.isValid) errors.ownerMiddleName = ownerMidRes.error!;
    }

    const ageRes = validateAge(age, true);
    if (!ageRes.isValid) errors.age = ageRes.error!;

    // Contact Number: Numbers only, no letters, no special characters, 11 digits
    const contactRes = validateContactNumber(ownerContact, true);
    if (!contactRes.isValid) errors.ownerContact = contactRes.error!;

    const addressRes = validateAddress(residentialAddress, 'Residential Address', true);
    if (!addressRes.isValid) errors.residentialAddress = addressRes.error!;

    if (beneficiaryName.trim()) {
      const benNameRes = validateName(beneficiaryName, 'Beneficiary Name', false);
      if (!benNameRes.isValid) errors.beneficiaryName = benNameRes.error!;
    }

    if (beneficiaryAddress.trim()) {
      const benAddrRes = validateAddress(beneficiaryAddress, 'Beneficiary Address', false);
      if (!benAddrRes.isValid) errors.beneficiaryAddress = benAddrRes.error!;
    }

    // 2. Driver Details Validation (if entered)
    if (driverLastName.trim()) {
      const drvLastRes = validateName(driverLastName, 'Driver Last Name', false);
      if (!drvLastRes.isValid) errors.driverLastName = drvLastRes.error!;
    }

    if (driverFirstName.trim()) {
      const drvFirstRes = validateName(driverFirstName, 'Driver First Name', false);
      if (!drvFirstRes.isValid) errors.driverFirstName = drvFirstRes.error!;
    }

    if (driverMiddleName.trim()) {
      const drvMidRes = validateName(driverMiddleName, 'Driver Middle Name', false);
      if (!drvMidRes.isValid) errors.driverMiddleName = drvMidRes.error!;
    }

    if (driverAddress.trim()) {
      const drvAddrRes = validateAddress(driverAddress, 'Driver Address', false);
      if (!drvAddrRes.isValid) errors.driverAddress = drvAddrRes.error!;
    }

    // 3. Franchise & Unit Details Validation
    const appNoRes = validateCode(applicationNo, 'Application No.', true);
    if (!appNoRes.isValid) errors.applicationNo = appNoRes.error!;

    const modelRes = validateModelOrColor(modelMake, 'Model / Make', true);
    if (!modelRes.isValid) errors.modelMake = modelRes.error!;

    const colorRes = validateModelOrColor(color, 'Color', true);
    if (!colorRes.isValid) errors.color = colorRes.error!;

    const routeRes = validateRoute(paradaRoute, 'Parada/Route', true);
    if (!routeRes.isValid) errors.paradaRoute = routeRes.error!;

    const plateRes = validateCode(cityPlateNo, 'City Plate No.', true);
    if (!plateRes.isValid) {
      errors.cityPlateNo = plateRes.error!;
    } else if (duplicateFranchise) {
      errors.cityPlateNo = `City Plate "${trimmedPlate}" is already registered to ${duplicateFranchise.ownerName || duplicateFranchise.driverName}.`;
    }

    const expRes = validateDate(expirationDate, 'Expiration Date', true);
    if (!expRes.isValid) errors.expirationDate = expRes.error!;

    // 4. Official Receipt & Payment Details Validation
    const receiptRes = validateCode(receiptNumber, 'Receipt No. (OR No.)', true);
    if (!receiptRes.isValid) errors.receiptNumber = receiptRes.error!;

    const payDateRes = validateDate(paymentDate, 'Payment Date', true);
    if (!payDateRes.isValid) errors.paymentDate = payDateRes.error!;

    const amountRes = validateAmount(amountPaid, 'Amount Paid', true);
    if (!amountRes.isValid) errors.amountPaid = amountRes.error!;

    // 5. Fare Matrix Validation
    fareMatrix.forEach((row, idx) => {
      if (!row.destination.trim()) {
        errors[`fare_${row.id}_destination`] = `Route/Distance row ${idx + 1} is required.`;
      } else if (/[!@#$%^*_+=~`={}[\];:"<>?|\\]/.test(row.destination)) {
        errors[`fare_${row.id}_destination`] = `Special characters are not allowed in Route/Distance.`;
      }
      const regCheck = validateAmount(row.regularFare, `Regular Fare row ${idx + 1}`, true);
      if (!regCheck.isValid) errors[`fare_${row.id}_regular`] = regCheck.error!;
    });

    // CRITICAL: If input is incorrect or required fields are missing, DO NOT submit or register!
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError('Submission Blocked: Required field validation failed. For contact numbers, only numbers are allowed—no letters or special characters. Special characters are not allowed in other fields.');
      formContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setFieldErrors({});
    setFormError(null);

    const ownerFullName = [ownerFirstName, ownerMiddleName, ownerLastName]
      .map(s => s.trim())
      .filter(Boolean)
      .join(' ');

    const driverFullName = [driverFirstName, driverMiddleName, driverLastName]
      .map(s => s.trim())
      .filter(Boolean)
      .join(' ') || ownerFullName;

    const baseFareAmount = fareMatrix[0] 
      ? cleanFare(fareMatrix[0].regularFare, vehicleCategory === 'Pedicab' ? '15.00' : '20.00') 
      : (vehicleCategory === 'Pedicab' ? '15.00' : '20.00');
    const primaryFare = `₱${baseFareAmount} Minimum`;
    const targetPlate = cityPlateNo.trim();

    const sanitizedFareMatrix = fareMatrix.map(row => {
      const fallback = vehicleCategory === 'Pedicab' ? '15.00' : '20.00';
      const reg = cleanFare(row.regularFare, fallback);
      const regNum = parseFloat(reg);
      const defaultDiscount = (regNum * 0.8).toFixed(2);
      const stu = cleanFare(row.studentFare, defaultDiscount);
      const snr = cleanFare(row.seniorPwdFare, defaultDiscount);
      return {
        id: row.id,
        destination: row.destination.trim() || (vehicleCategory === 'Pedicab' ? 'Poblacion to Market' : 'Short Distance (Base)'),
        regularFare: reg,
        studentFare: stu,
        seniorPwdFare: snr,
        discountedFare: snr,
      };
    });

    const newId = await addFranchise({
      applicationNo: applicationNo.trim(),
      cityPlateNumber: targetPlate,
      mtopNumber: targetPlate,
      plateNumber: vehicleCategory === 'Tricycle' ? `${targetPlate}-TR` : `${targetPlate}-PED`,
      vehicleCategory: vehicleCategory,
      
      // Owner fields
      ownerLastName: ownerLastName.trim(),
      ownerFirstName: ownerFirstName.trim(),
      ownerMiddleName: ownerMiddleName.trim(),
      ownerName: ownerFullName,
      ownerContact: cleanDigitsOnly(ownerContact, 11),
      ownerAddress: residentialAddress.trim(),
      age: age.trim(),
      beneficiaryName: beneficiaryName.trim(),
      beneficiaryAddress: beneficiaryAddress.trim(),

      // Synced operator fields for system compatibility
      operatorLastName: ownerLastName.trim(),
      operatorFirstName: ownerFirstName.trim(),
      operatorMiddleName: ownerMiddleName.trim(),
      operatorName: ownerFullName,
      operatorContact: cleanDigitsOnly(ownerContact, 11),
      operatorAddress: residentialAddress.trim(),
      residentialAddress: residentialAddress.trim(),

      // Driver fields
      driverLastName: driverLastName.trim() || ownerLastName.trim(),
      driverFirstName: driverFirstName.trim() || ownerFirstName.trim(),
      driverMiddleName: driverMiddleName.trim() || ownerMiddleName.trim(),
      driverName: driverFullName,
      driverAddress: driverAddress.trim() || residentialAddress.trim(),
      driverLicenseNo: 'Verified',
      licenseExpiry: '2028-11-20',

      // Vehicle & Model
      makeModel: modelMake.trim(),
      modelMake: modelMake.trim(),
      color: color.trim(),

      registrationDate: new Date().toISOString().split('T')[0],
      expirationDate: expirationDate,
      routeParada: paradaRoute.trim(),
      standardFare: primaryFare,
      fareMatrix: sanitizedFareMatrix,
      touristGuide: touristGuide,
      availability: 'Available / On-Duty',
      receiptNumber: receiptNumber.trim(),
      orNumber: receiptNumber.trim(),
      paymentDate: paymentDate,
      amountPaid: parseFloat(amountPaid),
    });

    setCreatedId(newId);
    setSelectedFranchiseId(newId);

    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.5 }
    });
  };

  const createdFranchise = franchises.find(f => f.id === createdId);
  const isPermanentActive = createdFranchise?.hasPermanentQr === true;

  const handleGenerateOrViewQr = () => {
    if (!createdId) return;
    if (!isPermanentActive) {
      generatePermanentQr(createdId);
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#05b875', '#10b981', '#049d63']
      });
    } else {
      setSelectedFranchiseId(createdId);
      handleReset();
      setActiveModule('qr_scanner');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="max-w-6xl w-full my-auto space-y-2">
        
        {/* Top title text */}
        <div className="text-[13px] font-bold text-slate-400 select-none pl-2">
          Register {vehicleCategory} Franchise
        </div>

        {/* Outer White / Light Container */}
        <div 
          ref={formContainerRef}
          className="bg-[#f7f8fa] rounded-[32px] border border-slate-300 shadow-2xl p-6 sm:p-9 space-y-6 max-h-[92vh] overflow-y-auto"
        >
          
          {/* Card 1: Top Navigation Card */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-300/80 shadow-sm space-y-4">
            <div>
              <button 
                type="button"
                onClick={() => {
                  handleReset();
                  setActiveModule('overview');
                }}
                className="flex items-center space-x-2 text-sm font-bold text-slate-800 hover:text-slate-950 cursor-pointer transition-colors"
              >
                <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
                <span>Back to Dashboard</span>
              </button>
            </div>

            <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
              <UserPlus className="h-6 w-6 text-slate-700 stroke-[2]" />
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  Register {vehicleCategory} Franchise
                </h2>
                <p className="text-xs text-slate-400 font-medium italic mt-0.5">
                  Add new franchise to the system
                </p>
              </div>
            </div>
          </div>

          {/* If registration success step */}
          {createdId ? (
            <div className="bg-white rounded-2xl p-8 sm:p-10 border border-slate-300/80 shadow-sm text-center space-y-6 animate-fadeIn">
              <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Franchise Registration Completed!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  City Plate No. <span className="font-mono font-bold text-slate-900">{cityPlateNo}</span> has been officially enrolled into the system registry.
                </p>
              </div>

              {/* Official Receipt & Payment Summary Card */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 max-w-lg mx-auto text-left shadow-xs">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-200/80">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-950">
                    <Receipt className="h-4 w-4 text-emerald-700" />
                    <span>Official Receipt & Payment Summary</span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Paid & Verified
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-500">Receipt No.</span>
                    <span className="font-mono font-bold text-emerald-800">{receiptNumber}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-500">Date Paid</span>
                    <span className="font-semibold text-slate-800">{paymentDate}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-500">Amount Paid</span>
                    <span className="font-mono font-extrabold text-emerald-700">
                      ₱{parseFloat(amountPaid || '0').toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Next Steps Buttons */}
              <div className="bg-[#f5f7f9] p-6 rounded-2xl border border-slate-200 space-y-4 max-w-md mx-auto">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Next Step:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      handleReset();
                      setActiveModule('franchise_records');
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Users className="h-4 w-4" />
                    <span>Go to Franchise Records</span>
                  </button>

                  {isPermanentActive ? (
                    <button
                      type="button"
                      onClick={handleGenerateOrViewQr}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer"
                      title="View official permanent QR code"
                    >
                      <QrCode className="h-4 w-4 text-emerald-600" />
                      <span>View QR Code</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGenerateOrViewQr}
                      className="w-full bg-[#00ba7c] hover:bg-[#009b67] text-slate-950 font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer animate-pulse"
                      title="Generate permanent QR code for this unit"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Generate QR Code</span>
                    </button>
                  )}
                </div>

                {isPermanentActive && (
                  <div className="flex items-center justify-center space-x-1.5 text-emerald-800 text-[11px] font-bold bg-emerald-50 border border-emerald-200 py-2 px-3 rounded-xl animate-fadeIn">
                    <Lock className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Permanent QR Code Locked • Cannot be modified</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Card 2: Main Registration Form Card */
            <form onSubmit={handleSubmit} noValidate className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-300/80 shadow-sm space-y-6">
              
              {/* Form Title & Subtitle */}
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  {vehicleCategory} Registration Form
                </h3>
                <p className="text-xs text-slate-400 font-medium italic mt-0.5">
                  Enter franchise details for registration. Required fields must be completed.
                </p>
              </div>

              {/* Form Error Banner */}
              {formError && (
                <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-start space-x-3 text-rose-900 animate-fadeIn shadow-sm">
                  <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 text-xs">
                    <p className="font-extrabold text-rose-800 text-sm">Registration Form Error</p>
                    <p className="font-semibold text-rose-700 mt-1">{formError}</p>
                    <p className="text-[11px] text-rose-600 italic mt-0.5">
                      Please check the highlighted fields below. Numbers only for contact number; special characters are strictly forbidden.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormError(null)}
                    className="text-rose-500 hover:text-rose-800 text-xs font-bold px-2 py-1 bg-rose-100 rounded-md cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* 2-Column Responsive Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-5 items-start">
                
                {/* ================= LEFT COLUMN ================= */}
                <div className="space-y-4">
                  
                  {/* Owner: Last Name, First Name, Middlename */}
                  <div>
                    <label className="block text-[13px] font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span>Owner Name <span className="text-rose-500">*</span></span>
                      <span className="text-[10px] text-slate-500 font-semibold">Letters & spaces only</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <input
                          type="text"
                          value={ownerLastName}
                          onKeyDown={preventSpecialCharsForName}
                          onChange={(e) => {
                            setOwnerLastName(cleanName(formatTitleCase(e.target.value)));
                            clearFieldError('ownerLastName');
                          }}
                          placeholder="{Last Name} *"
                          className={`w-full bg-[#d8dfe6] border rounded-lg px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                            fieldErrors.ownerLastName ? 'border-rose-500 ring-2 ring-rose-300 bg-rose-50/40' : 'border-[#c6cfd8] focus:ring-emerald-500'
                          }`}
                        />
                        {fieldErrors.ownerLastName && (
                          <p className="text-[10px] font-bold text-rose-600 mt-1 flex items-center space-x-1">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            <span>{fieldErrors.ownerLastName}</span>
                          </p>
                        )}
                      </div>
                      <div>
                        <input
                          type="text"
                          value={ownerFirstName}
                          onKeyDown={preventSpecialCharsForName}
                          onChange={(e) => {
                            setOwnerFirstName(cleanName(formatTitleCase(e.target.value)));
                            clearFieldError('ownerFirstName');
                          }}
                          placeholder="{First Name} *"
                          className={`w-full bg-[#d8dfe6] border rounded-lg px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                            fieldErrors.ownerFirstName ? 'border-rose-500 ring-2 ring-rose-300 bg-rose-50/40' : 'border-[#c6cfd8] focus:ring-emerald-500'
                          }`}
                        />
                        {fieldErrors.ownerFirstName && (
                          <p className="text-[10px] font-bold text-rose-600 mt-1 flex items-center space-x-1">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            <span>{fieldErrors.ownerFirstName}</span>
                          </p>
                        )}
                      </div>
                      <div>
                        <input
                          type="text"
                          value={ownerMiddleName}
                          onKeyDown={preventSpecialCharsForName}
                          onChange={(e) => {
                            setOwnerMiddleName(cleanName(formatTitleCase(e.target.value)));
                            clearFieldError('ownerMiddleName');
                          }}
                          placeholder="{Middlename}"
                          className={`w-full bg-[#d8dfe6] border rounded-lg px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                            fieldErrors.ownerMiddleName ? 'border-rose-500 ring-2 ring-rose-300 bg-rose-50/40' : 'border-[#c6cfd8] focus:ring-emerald-500'
                          }`}
                        />
                        {fieldErrors.ownerMiddleName && (
                          <p className="text-[10px] font-bold text-rose-600 mt-1 flex items-center space-x-1">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            <span>{fieldErrors.ownerMiddleName}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Age & Contact / Mobile Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[13px] font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                        <span>Age <span className="text-rose-500">*</span></span>
                        <span className="text-[10px] text-slate-500 font-semibold">18-100 (Numbers only)</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={3}
                        value={age}
                        onKeyDown={preventNonDigits}
                        onChange={(e) => {
                          setAge(cleanDigitsOnly(e.target.value, 3));
                          clearFieldError('age');
                        }}
                        placeholder="e.g. 42"
                        className={`w-full bg-[#d8dfe6] border rounded-lg px-3 py-2 text-xs font-medium text-slate-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                          fieldErrors.age ? 'border-rose-500 ring-2 ring-rose-300 bg-rose-50/40' : 'border-[#c6cfd8] focus:ring-emerald-500'
                        }`}
                      />
                      {fieldErrors.age && (
                        <p className="text-[10px] font-bold text-rose-600 mt-1 flex items-center space-x-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>{fieldErrors.age}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[13px] font-bold text-slate-800">
                          Mobile Number <span className="text-rose-500">*</span>
                        </label>
                        {ownerContact.length === 11 && !fieldErrors.ownerContact ? (
                          <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded">
                            ✓ 11 Digits (Numbers only)
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-500">
                            Numbers only • {ownerContact.length}/11
                          </span>
                        )}
                      </div>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={11}
                        value={ownerContact}
                        onKeyDown={preventNonDigits}
                        onChange={(e) => {
                          setOwnerContact(cleanDigitsOnly(e.target.value, 11));
                          clearFieldError('ownerContact');
                        }}
                        placeholder="e.g. 09178821920"
                        className={`w-full bg-[#d8dfe6] border rounded-lg px-3 py-2 text-xs font-medium text-slate-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                          fieldErrors.ownerContact ? 'border-rose-500 ring-2 ring-rose-300 bg-rose-50/40' : 'border-[#c6cfd8] focus:ring-emerald-500'
                        }`}
                      />
                      {fieldErrors.ownerContact && (
                        <p className="text-[10px] font-bold text-rose-600 mt-1 flex items-center space-x-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>{fieldErrors.ownerContact}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Residential Address */}
                  <div>
                    <label className="block text-[13px] font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span>Residential Address <span className="text-rose-500">*</span></span>
                      <span className="text-[10px] text-slate-500 font-semibold">No special characters</span>
                    </label>
                    <input
                      type="text"
                      value={residentialAddress}
                      onKeyDown={preventSpecialCharsForAddress}
                      onChange={(e) => {
                        setResidentialAddress(cleanAddress(formatTitleCase(e.target.value)));
                        clearFieldError('residentialAddress');
                      }}
                      placeholder="Zone 4, Poblacion, Tabaco City"
                      className={`w-full bg-[#d8dfe6] border rounded-lg px-3 py-2 text-xs font-medium text-slate-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.residentialAddress ? 'border-rose-500 ring-2 ring-rose-300 bg-rose-50/40' : 'border-[#c6cfd8] focus:ring-emerald-500'
                      }`}
                    />
                    {fieldErrors.residentialAddress && (
                      <p className="text-[10px] font-bold text-rose-600 mt-1 flex items-center space-x-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{fieldErrors.residentialAddress}</span>
                      </p>
                    )}
                  </div>

                  {/* Beneficiary Details: Beneficiary Name & Beneficiary Address */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                        Beneficiary Name
                      </label>
                      <input
                        type="text"
                        value={beneficiaryName}
                        onKeyDown={preventSpecialCharsForName}
                        onChange={(e) => {
                          setBeneficiaryName(cleanName(formatTitleCase(e.target.value)));
                          clearFieldError('beneficiaryName');
                        }}
                        placeholder="Full name (letters only)"
                        className={`w-full bg-[#d8dfe6] border rounded-lg px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                          fieldErrors.beneficiaryName ? 'border-rose-500 ring-2 ring-rose-300 bg-rose-50/40' : 'border-[#c6cfd8] focus:ring-emerald-500'
                        }`}
                      />
                      {fieldErrors.beneficiaryName && (
                        <p className="text-[10px] font-bold text-rose-600 mt-1 flex items-center space-x-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>{fieldErrors.beneficiaryName}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                        Beneficiary Address
                      </label>
                      <input
                        type="text"
                        value={beneficiaryAddress}
                        onKeyDown={preventSpecialCharsForAddress}
                        onChange={(e) => {
                          setBeneficiaryAddress(cleanAddress(formatTitleCase(e.target.value)));
                          clearFieldError('beneficiaryAddress');
                        }}
                        placeholder="Address (no special chars)"
                        className={`w-full bg-[#d8dfe6] border rounded-lg px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                          fieldErrors.beneficiaryAddress ? 'border-rose-500 ring-2 ring-rose-300 bg-rose-50/40' : 'border-[#c6cfd8] focus:ring-emerald-500'
                        }`}
                      />
                      {fieldErrors.beneficiaryAddress && (
                        <p className="text-[10px] font-bold text-rose-600 mt-1 flex items-center space-x-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>{fieldErrors.beneficiaryAddress}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Driver: Last Name, First Name, Middlename */}
                  <div>
                    <label className="block text-[13px] font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span>Driver (Defaults to Owner if left blank)</span>
                      <span className="text-[10px] text-slate-500 font-semibold">Letters & spaces only</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <input
                          type="text"
                          value={driverLastName}
                          onKeyDown={preventSpecialCharsForName}
                          onChange={(e) => {
                            setDriverLastName(cleanName(formatTitleCase(e.target.value)));
                            clearFieldError('driverLastName');
                          }}
                          placeholder="{Last Name}"
                          className={`w-full bg-[#d8dfe6] border rounded-lg px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                            fieldErrors.driverLastName ? 'border-rose-500 ring-2 ring-rose-300 bg-rose-50/40' : 'border-[#c6cfd8] focus:ring-emerald-500'
                          }`}
                        />
                        {fieldErrors.driverLastName && (
                          <p className="text-[10px] font-bold text-rose-600 mt-1">{fieldErrors.driverLastName}</p>
                        )}
                      </div>
                      <div>
                        <input
                          type="text"
                          value={driverFirstName}
                          onKeyDown={preventSpecialCharsForName}
                          onChange={(e) => {
                            setDriverFirstName(cleanName(formatTitleCase(e.target.value)));
                            clearFieldError('driverFirstName');
                          }}
                          placeholder="{First Name}"
                          className={`w-full bg-[#d8dfe6] border rounded-lg px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                            fieldErrors.driverFirstName ? 'border-rose-500 ring-2 ring-rose-300 bg-rose-50/40' : 'border-[#c6cfd8] focus:ring-emerald-500'
                          }`}
                        />
                        {fieldErrors.driverFirstName && (
                          <p className="text-[10px] font-bold text-rose-600 mt-1">{fieldErrors.driverFirstName}</p>
                        )}
                      </div>
                      <div>
                        <input
                          type="text"
                          value={driverMiddleName}
                          onKeyDown={preventSpecialCharsForName}
                          onChange={(e) => {
                            setDriverMiddleName(cleanName(formatTitleCase(e.target.value)));
                            clearFieldError('driverMiddleName');
                          }}
                          placeholder="{Middlename}"
                          className={`w-full bg-[#d8dfe6] border rounded-lg px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                            fieldErrors.driverMiddleName ? 'border-rose-500 ring-2 ring-rose-300 bg-rose-50/40' : 'border-[#c6cfd8] focus:ring-emerald-500'
                          }`}
                        />
                        {fieldErrors.driverMiddleName && (
                          <p className="text-[10px] font-bold text-rose-600 mt-1">{fieldErrors.driverMiddleName}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Driver Address */}
                  <div>
                    <label className="block text-[13px] font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span>Driver Address</span>
                      <span className="text-[10px] text-slate-500 font-semibold">No special characters</span>
                    </label>
                    <input
                      type="text"
                      value={driverAddress}
                      onKeyDown={preventSpecialCharsForAddress}
                      onChange={(e) => {
                        setDriverAddress(cleanAddress(formatTitleCase(e.target.value)));
                        clearFieldError('driverAddress');
                      }}
                      placeholder="Zone 4, Poblacion, Tabaco City"
                      className={`w-full bg-[#d8dfe6] border rounded-lg px-3 py-2 text-xs font-medium text-slate-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.driverAddress ? 'border-rose-500 ring-2 ring-rose-300 bg-rose-50/40' : 'border-[#c6cfd8] focus:ring-emerald-500'
                      }`}
                    />
                    {fieldErrors.driverAddress && (
                      <p className="text-[10px] font-bold text-rose-600 mt-1 flex items-center space-x-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{fieldErrors.driverAddress}</span>
                      </p>
                    )}
                  </div>

                </div>

                {/* ================= RIGHT COLUMN ================= */}
                <div className="space-y-4">
                  
                  {/* Application No. & Vehicle Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[13px] font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                        <span>Application No. <span className="text-rose-500">*</span></span>
                        <span className="text-[10px] text-slate-500 font-semibold">Letters & Numbers only</span>
                      </label>
                      <input
                        type="text"
                        value={applicationNo}
                        onKeyDown={preventSpecialCharsForCode}
                        onChange={(e) => {
                          setApplicationNo(cleanCode(e.target.value));
                          clearFieldError('applicationNo');
                        }}
                        className={`w-full bg-[#d8dfe6] border rounded-lg px-3 py-2 text-xs font-medium text-slate-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                          fieldErrors.applicationNo ? 'border-rose-500 ring-2 ring-rose-300 bg-rose-50/40' : 'border-[#c6cfd8] focus:ring-emerald-500'
                        }`}
                      />
                      {fieldErrors.applicationNo && (
                        <p className="text-[10px] font-bold text-rose-600 mt-1 flex items-center space-x-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>{fieldErrors.applicationNo}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[13px] font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                        <span>Vehicle Type</span>
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                          Auto-Selected
                        </span>
                      </label>
                      <div className={`w-full flex items-center justify-center space-x-2 rounded-lg px-3 py-2 text-xs font-black shadow-sm border-2 transition-all select-none ${
                        vehicleCategory === 'Pedicab'
                          ? 'bg-amber-100/90 border-amber-500 text-amber-950 ring-2 ring-amber-400/30'
                          : 'bg-emerald-100/90 border-emerald-600 text-emerald-950 ring-2 ring-emerald-500/30'
                      }`}>
                        <span className="text-base">{vehicleCategory === 'Pedicab' ? '🚲' : '🛺'}</span>
                        <span className="text-[13px] tracking-wide uppercase font-black">{vehicleCategory}</span>
                      </div>
                    </div>
                  </div>

                  {/* Model / Make & Color */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[13px] font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                        <span>Model / Make <span className="text-rose-500">*</span></span>
                        <span className="text-[10px] text-slate-500 font-semibold">No special chars</span>
                      </label>
                      <input
                        type="text"
                        value={modelMake}
                        onChange={(e) => {
                          setModelMake(cleanModelOrColor(formatTitleCase(e.target.value)));
                          clearFieldError('modelMake');
                        }}
                        placeholder={vehicleCategory === 'Tricycle' ? 'Kawasaki Barako 175' : 'Passenger Pedicab'}
                        className={`w-full bg-[#d8dfe6] border rounded-lg px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                          fieldErrors.modelMake ? 'border-rose-500 ring-2 ring-rose-300 bg-rose-50/40' : 'border-[#c6cfd8] focus:ring-emerald-500'
                        }`}
                      />
                      {fieldErrors.modelMake && (
                        <p className="text-[10px] font-bold text-rose-600 mt-1 flex items-center space-x-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>{fieldErrors.modelMake}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[13px] font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                        <span>Color <span className="text-rose-500">*</span></span>
                        <span className="text-[10px] text-slate-500 font-semibold">No special chars</span>
                      </label>
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => {
                          setColor(cleanModelOrColor(formatTitleCase(e.target.value)));
                          clearFieldError('color');
                        }}
                        placeholder="e.g. Blue / Silver"
                        className={`w-full bg-[#d8dfe6] border rounded-lg px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                          fieldErrors.color ? 'border-rose-500 ring-2 ring-rose-300 bg-rose-50/40' : 'border-[#c6cfd8] focus:ring-emerald-500'
                        }`}
                      />
                      {fieldErrors.color && (
                        <p className="text-[10px] font-bold text-rose-600 mt-1 flex items-center space-x-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>{fieldErrors.color}</span>
                        </p>
                      )}
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
                        className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer text-center"
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
                        value={status}
                        onChange={(e) => setStatus(e.target.value as FranchiseStatus)}
                        className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer text-center"
                      >
                        <option value="Active">Active</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Pending Renewal">Pending Renewal</option>
                        <option value="Deactivated">Deactivated</option>
                      </select>
                    </div>
                  </div>

                  {/* Parada/Route & City Plate No. */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[13px] font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                        <span>Parada/Route <span className="text-rose-500">*</span></span>
                        <span className="text-[10px] text-slate-500 font-semibold">No special chars</span>
                      </label>
                      <input
                        type="text"
                        value={paradaRoute}
                        onKeyDown={preventSpecialCharsForRoute}
                        onChange={(e) => {
                          setParadaRoute(cleanRoute(formatTitleCase(e.target.value)));
                          clearFieldError('paradaRoute');
                        }}
                        className={`w-full bg-[#d8dfe6] border rounded-lg px-3 py-2 text-xs font-medium text-slate-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                          fieldErrors.paradaRoute ? 'border-rose-500 ring-2 ring-rose-300 bg-rose-50/40' : 'border-[#c6cfd8] focus:ring-emerald-500'
                        }`}
                      />
                      {fieldErrors.paradaRoute && (
                        <p className="text-[10px] font-bold text-rose-600 mt-1 flex items-center space-x-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>{fieldErrors.paradaRoute}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[13px] font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                        <span>City Plate No. <span className="text-rose-500">*</span></span>
                        <span className="text-[10px] text-slate-500 font-semibold">Letters & Numbers only</span>
                      </label>
                      <input
                        type="text"
                        value={cityPlateNo}
                        onKeyDown={preventSpecialCharsForCode}
                        onChange={(e) => {
                          setCityPlateNo(cleanCode(e.target.value));
                          clearFieldError('cityPlateNo');
                        }}
                        className={`w-full bg-[#d8dfe6] border rounded-lg px-3 py-2 text-xs font-medium text-slate-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                          fieldErrors.cityPlateNo ? 'border-rose-500 ring-2 ring-rose-300 bg-rose-50/40' : 'border-[#c6cfd8] focus:ring-emerald-500'
                        }`}
                      />
                      {fieldErrors.cityPlateNo && (
                        <p className="text-[10px] font-bold text-rose-600 mt-1 flex items-center space-x-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>{fieldErrors.cityPlateNo}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Expiration Date */}
                  <div>
                    <label className="block text-[13px] font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span>Expiration Date <span className="text-rose-500">*</span></span>
                      <span className="text-[10px] text-slate-500 font-semibold">Valid Date</span>
                    </label>
                    <input
                      type="date"
                      value={expirationDate}
                      onChange={(e) => {
                        setExpirationDate(e.target.value);
                        clearFieldError('expirationDate');
                      }}
                      className={`w-full bg-[#d8dfe6] border rounded-lg px-3 py-2 text-xs font-medium text-slate-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                        fieldErrors.expirationDate ? 'border-rose-500 ring-2 ring-rose-300 bg-rose-50/40' : 'border-[#c6cfd8] focus:ring-emerald-500'
                      }`}
                    />
                    {fieldErrors.expirationDate && (
                      <p className="text-[10px] font-bold text-rose-600 mt-1 flex items-center space-x-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        <span>{fieldErrors.expirationDate}</span>
                      </p>
                    )}
                  </div>

                  {/* Official Receipt & Payment Details */}
                  <div className="bg-[#d8dfe6] border border-[#c4ccd6] rounded-xl p-3.5 space-y-2.5 shadow-sm">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-400/40">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900">
                        <Receipt className="h-4 w-4 text-emerald-700" />
                        <span>Official Receipt & Payment Details</span>
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Paid / Verified
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Receipt Number */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-800 mb-1 flex items-center justify-between">
                          <span>Receipt No. <span className="text-rose-500">*</span></span>
                        </label>
                        <input
                          type="text"
                          value={receiptNumber}
                          onKeyDown={preventSpecialCharsForCode}
                          onChange={(e) => {
                            setReceiptNumber(cleanCode(e.target.value));
                            clearFieldError('receiptNumber');
                          }}
                          placeholder="OR-2026-10492"
                          className={`w-full bg-white border rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 shadow-sm focus:outline-none focus:ring-2 transition-all ${
                            fieldErrors.receiptNumber ? 'border-rose-500 ring-2 ring-rose-300 bg-rose-50/40' : 'border-slate-300 focus:ring-emerald-500'
                          }`}
                        />
                        {fieldErrors.receiptNumber && (
                          <p className="text-[10px] font-bold text-rose-600 mt-1">{fieldErrors.receiptNumber}</p>
                        )}
                      </div>

                      {/* Payment Date */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-800 mb-1 flex items-center justify-between">
                          <span>Payment Date <span className="text-rose-500">*</span></span>
                        </label>
                        <input
                          type="date"
                          value={paymentDate}
                          onChange={(e) => {
                            setPaymentDate(e.target.value);
                            clearFieldError('paymentDate');
                          }}
                          className={`w-full bg-white border rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 shadow-sm focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                            fieldErrors.paymentDate ? 'border-rose-500 ring-2 ring-rose-300 bg-rose-50/40' : 'border-slate-300 focus:ring-emerald-500'
                          }`}
                        />
                        {fieldErrors.paymentDate && (
                          <p className="text-[10px] font-bold text-rose-600 mt-1">{fieldErrors.paymentDate}</p>
                        )}
                      </div>

                      {/* Amount Paid */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-800 mb-1 flex items-center justify-between">
                          <span>Amount Paid <span className="text-rose-500">*</span></span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-700">
                            ₱
                          </span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={amountPaid}
                            onKeyDown={(e) => {
                              if (
                                !/[0-9.]/.test(e.key) &&
                                !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key) &&
                                !e.ctrlKey &&
                                !e.metaKey
                              ) {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => {
                              setAmountPaid(e.target.value.replace(/[^0-9.]/g, ''));
                              clearFieldError('amountPaid');
                            }}
                            placeholder={vehicleCategory === 'Pedicab' ? '250.00' : '450.00'}
                            className={`w-full pl-6 pr-2.5 py-1.5 bg-white border rounded-lg text-xs font-mono font-bold text-slate-900 shadow-sm focus:outline-none focus:ring-2 transition-all ${
                              fieldErrors.amountPaid ? 'border-rose-500 ring-2 ring-rose-300 bg-rose-50/40' : 'border-slate-300 focus:ring-emerald-500'
                            }`}
                          />
                        </div>
                        {fieldErrors.amountPaid && (
                          <p className="text-[10px] font-bold text-rose-600 mt-1">{fieldErrors.amountPaid}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Fare Adjustment Matrix (per Destination / Distance) */}
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

                    {/* Matrix Table */}
                    <div className="border-t border-slate-400/40 pt-2 space-y-2">
                      <div className="grid grid-cols-12 gap-1.5 text-[10px] sm:text-[11px] font-bold text-slate-800 px-1 items-center">
                        <div className="col-span-5 truncate">Route / Distance <span className="text-rose-500">*</span></div>
                        <div className="col-span-2 text-center truncate">Regular <span className="text-rose-500">*</span></div>
                        <div className="col-span-2 text-center truncate">Student</div>
                        <div className="col-span-2 text-center truncate">Senior 20%</div>
                        <div className="col-span-1 text-center"></div>
                      </div>

                      <div className="space-y-2 max-h-36 overflow-y-auto pr-0.5">
                        {fareMatrix.map((row) => (
                          <div key={row.id} className="space-y-1">
                            <div className="grid grid-cols-12 gap-1.5 items-center">
                              <div className="col-span-5">
                                <input
                                  type="text"
                                  value={row.destination}
                                  onKeyDown={preventSpecialCharsForRoute}
                                  onChange={(e) => handleUpdateFareRow(row.id, 'destination', e.target.value)}
                                  placeholder="Route / Distance"
                                  className={`w-full bg-white border rounded-md px-2 py-1.5 text-xs text-slate-900 shadow-sm focus:outline-none focus:ring-2 ${
                                    fieldErrors[`fare_${row.id}_destination`] ? 'border-rose-500 ring-2 ring-rose-300' : 'border-slate-300 focus:ring-emerald-500'
                                  }`}
                                />
                              </div>
                              <div className="col-span-2">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={row.regularFare}
                                  onChange={(e) => handleUpdateFareRow(row.id, 'regularFare', e.target.value)}
                                  placeholder="20.00"
                                  className={`w-full bg-white border rounded-md px-1 py-1.5 text-xs text-center font-bold text-slate-900 shadow-sm focus:outline-none focus:ring-2 ${
                                    fieldErrors[`fare_${row.id}_regular`] ? 'border-rose-500 ring-2 ring-rose-300' : 'border-slate-300 focus:ring-emerald-500'
                                  }`}
                                />
                              </div>
                              <div className="col-span-2">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={row.studentFare}
                                  onChange={(e) => handleUpdateFareRow(row.id, 'studentFare', e.target.value)}
                                  placeholder="15.00"
                                  className="w-full bg-white border border-slate-300 rounded-md px-1 py-1.5 text-xs text-center font-bold text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                              </div>
                              <div className="col-span-2">
                                <input
                                  type="text"
                                  inputMode="decimal"
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
                            {(fieldErrors[`fare_${row.id}_destination`] || fieldErrors[`fare_${row.id}_regular`]) && (
                              <p className="text-[10px] font-bold text-rose-600 px-1">
                                {fieldErrors[`fare_${row.id}_destination`] || fieldErrors[`fare_${row.id}_regular`]}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {/* Bottom Actions: Cancel (Grey) & Submit (Green) */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    handleReset();
                    setActiveModule('overview');
                  }}
                  className="bg-[#8ca0b3] hover:bg-[#7a8f9f] active:scale-[0.98] text-slate-950 font-bold text-xs sm:text-sm px-9 py-2 rounded-full shadow-[0_3px_5px_rgba(0,0,0,0.15)] border border-slate-400/50 transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!!duplicateFranchise}
                  title={duplicateFranchise ? `City Plate ${trimmedPlate} is already registered` : 'Submit franchise registration'}
                  className={`font-bold text-xs sm:text-sm px-10 py-2 rounded-full shadow-[0_3px_5px_rgba(0,0,0,0.2)] border transition-all ${
                    duplicateFranchise
                      ? 'bg-slate-300 text-slate-500 border-slate-400 cursor-not-allowed opacity-75'
                      : 'bg-[#00ba7c] hover:bg-[#00a36d] active:scale-[0.98] text-slate-950 border-emerald-600/50 cursor-pointer'
                  }`}
                >
                  Submit
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
