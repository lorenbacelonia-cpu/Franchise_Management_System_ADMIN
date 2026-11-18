import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFranchise } from '../../context/FranchiseContext';
import type { FranchiseStatus } from '../../types';
import {
  UserPlus,
  CheckCircle2,
  QrCode,
  Lock,
  Sparkles,
  PlusCircle,
  Trash2,
  Receipt,
  Printer,
  FileDown,
  Globe,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatTitleCase, formatCodeUpper, formatDigitsOnly } from '../../utils/formatters';
import { cleanFare, getDefaultFareMatrix, buildPermanentQrPayload, formatExpDate } from '../../utils/fareUtils';
import { downloadFranchiseDocx } from '../../utils/docxExport';

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
    addFranchise,
    vehicleCategory,
    setVehicleCategory,
    setSelectedFranchiseId,
    franchises,
    generatePermanentQr
  } = useFranchise();

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

  const [createdId, setCreatedId] = useState<string | null>(null);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  if (activeModule !== 'register') return null;

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

  const handleReset = () => {
    setCreatedId(null);
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

    const ownerFullName = [ownerFirstName, ownerMiddleName, ownerLastName]
      .map(s => s.trim())
      .filter(Boolean)
      .join(' ') || 'Andrie B. Barosana';

    const driverFullName = [driverFirstName, driverMiddleName, driverLastName]
      .map(s => s.trim())
      .filter(Boolean)
      .join(' ') || ownerFullName;

    const baseFareAmount = fareMatrix[0]
      ? cleanFare(fareMatrix[0].regularFare, vehicleCategory === 'Pedicab' ? '15.00' : '20.00')
      : (vehicleCategory === 'Pedicab' ? '15.00' : '20.00');
    const primaryFare = `₱${baseFareAmount} Minimum`;
    const targetPlate = cityPlateNo.trim() || (vehicleCategory === 'Tricycle' ? 'T-106' : 'P-106');

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
      applicationNo: applicationNo || `APP-2026-${Math.floor(100 + Math.random() * 900)}`,
      cityPlateNumber: targetPlate,
      mtopNumber: targetPlate,
      plateNumber: vehicleCategory === 'Tricycle' ? `${targetPlate}-TR` : `${targetPlate}-PED`,
      vehicleCategory: vehicleCategory,

      ownerLastName,
      ownerFirstName,
      ownerMiddleName,
      ownerName: ownerFullName,
      ownerContact: formatDigitsOnly(ownerContact),
      ownerAddress: residentialAddress || 'Zone 4, Barangay Poblacion, Tabaco City',
      age: age.trim(),
      beneficiaryName: beneficiaryName.trim(),
      beneficiaryAddress: beneficiaryAddress.trim(),

      operatorLastName: ownerLastName,
      operatorFirstName: ownerFirstName,
      operatorMiddleName: ownerMiddleName,
      operatorName: ownerFullName,
      operatorContact: formatDigitsOnly(ownerContact),
      operatorAddress: residentialAddress || 'Zone 4, Barangay Poblacion, Tabaco City',
      residentialAddress: residentialAddress || 'Zone 4, Barangay Poblacion, Tabaco City',

      driverLastName,
      driverFirstName,
      driverMiddleName,
      driverName: driverFullName,
      driverAddress: driverAddress || residentialAddress || 'Zone 4, Barangay Poblacion, Tabaco City',
      driverLicenseNo: 'Verified',
      licenseExpiry: '2028-11-20',

      makeModel: modelMake.trim() || (vehicleCategory === 'Tricycle' ? 'Kawasaki Barako 175' : 'Standard Pedicab'),
      modelMake: modelMake.trim() || (vehicleCategory === 'Tricycle' ? 'Kawasaki Barako 175' : 'Standard Pedicab'),
      color: color.trim() || 'Blue / Silver',

      registrationDate: new Date().toISOString().split('T')[0],
      expirationDate: expirationDate || '2027-01-15',
      routeParada: paradaRoute || 'Sua-Igot 24 Tabaco',
      standardFare: primaryFare,
      fareMatrix: sanitizedFareMatrix,
      touristGuide: touristGuide,
      availability: 'Available / On-Duty',
      receiptNumber: receiptNumber.trim() || `OR-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      orNumber: receiptNumber.trim() || `OR-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      paymentDate: paymentDate || new Date().toISOString().split('T')[0],
      amountPaid: amountPaid ? parseFloat(amountPaid) : (vehicleCategory === 'Pedicab' ? 250 : 450),
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
  const permanentQrPayload = createdFranchise ? buildPermanentQrPayload(createdFranchise) : '';
  const qrDataUrl = createdFranchise
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(permanentQrPayload)}`
    : '';

  const handleGenerateQrInline = async () => {
    if (!createdId) return;
    await generatePermanentQr(createdId);
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#05b875', '#10b981', '#049d63']
    });
    setToastMessage('Unique Permanent QR Code generated and locked on this page!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDownloadDocx = async () => {
    if (!createdFranchise) return;
    setIsExportingDocx(true);
    try {
      await downloadFranchiseDocx(createdFranchise, qrDataUrl);
      setToastMessage(`Downloaded Word (.docx) for Unit ${createdFranchise.mtopNumber}.`);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handlePrintBadge = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Module Top Header Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="h-11 w-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Register {vehicleCategory} Franchise
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Complete registration, generate permanent QR badge, and download/print all on this single page
            </p>
          </div>
        </div>

        {createdId && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Register Another {vehicleCategory}</span>
          </button>
        )}
      </div>

      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold px-4 py-3 rounded-2xl flex items-center space-x-2 shadow-sm animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* If Registration Completed: Show Inline Summary + Inline QR Generator & Print on the SAME page */}
      {createdId && createdFranchise && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-500/40 shadow-md space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Franchise Registration Completed — Unit {createdFranchise.mtopNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  Enrolled in system registry • Generate and print the permanent QR badge right below without leaving this page
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer shrink-0"
            >
              + New Registration Form
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Left: Enrolled Record & Official Receipt Summary */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Enrolled Franchise Details
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {createdFranchise.status}
                  </span>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-200 text-xs space-y-2 divide-y divide-slate-100">
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500 font-medium">City Plate No.:</span>
                    <span className="font-mono font-bold text-slate-900">{createdFranchise.mtopNumber}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-500 font-medium">Application No.:</span>
                    <span className="font-mono font-semibold text-slate-800">{createdFranchise.applicationNo}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-500 font-medium">Owner / Operator:</span>
                    <span className="font-bold text-slate-900">{createdFranchise.operatorName}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-500 font-medium">Authorized Driver:</span>
                    <span className="font-bold text-slate-900">{createdFranchise.driverName}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-500 font-medium">Route / Parada:</span>
                    <span className="font-semibold text-slate-800">{createdFranchise.routeParada}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-500 font-medium">Expiration Date:</span>
                    <span className="font-mono font-bold text-emerald-700">{createdFranchise.expirationDate}</span>
                  </div>
                </div>

                {/* Official Receipt Summary */}
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950 flex items-center space-x-1.5">
                      <Receipt className="h-4 w-4 text-emerald-700" />
                      <span>Official Receipt &amp; Payment</span>
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Paid &amp; Verified
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1">
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
              </div>

              {/* Generate QR Button */}
              {isPermanentActive ? (
                <div className="w-full bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center space-x-2">
                  <Lock className="h-4 w-4 text-emerald-700" />
                  <span>Permanent QR Code Generated &amp; Locked</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleGenerateQrInline}
                  className="w-full bg-[#05b875] hover:bg-[#049d63] text-white font-bold text-xs py-3.5 px-6 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Permanent QR Code Now</span>
                </button>
              )}
            </div>

            {/* Right: Inline QR Code Preview, Word Download & 1-Page Print */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col items-center justify-center flex-1 space-y-3">
                {isPermanentActive ? (
                  <>
                    <div className="flex items-center space-x-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <Globe className="h-3 w-3 text-emerald-600" />
                      <span>UNIVERSAL QR LINK • READY TO SCAN OR PRINT</span>
                    </div>
                    <img
                      src={qrDataUrl}
                      alt="System QR Code"
                      className="w-44 h-44 object-contain p-2 border border-slate-200 rounded-xl"
                    />
                    <div className="flex items-center space-x-2 w-full bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <input
                        type="text"
                        readOnly
                        value={permanentQrPayload}
                        className="text-[10px] font-mono text-slate-700 bg-transparent flex-1 outline-none"
                      />
                      <a
                        href={permanentQrPayload}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shrink-0"
                      >
                        <span>Test Link</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 space-y-2">
                    <QrCode className="h-12 w-12 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">QR Badge Ready to Issue</p>
                    <p className="text-[11px] text-slate-400 max-w-xs">
                      Click &ldquo;Generate Permanent QR Code Now&rdquo; on the left to preview, download Word (.docx), or print the 1-page badge right here.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={!isPermanentActive || isExportingDocx}
                  onClick={handleDownloadDocx}
                  className={`w-full font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all ${
                    isPermanentActive && !isExportingDocx
                      ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <FileDown className="h-4 w-4" />
                  <span>{isExportingDocx ? 'Generating...' : 'Download Word (.docx)'}</span>
                </button>

                <button
                  type="button"
                  disabled={!isPermanentActive}
                  onClick={handlePrintBadge}
                  className={`w-full font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all ${
                    isPermanentActive
                      ? 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shadow-xs'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Printer className="h-4 w-4" />
                  <span>Print / Save PDF (1-Page)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Registration Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {vehicleCategory} Registration Form
            </h3>
            <p className="text-xs text-slate-400 font-medium italic mt-0.5">
              Enter owner, driver, vehicle, official receipt, and fare matrix details
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            All-in-One Registration Page
          </span>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-5 items-start">
          {/* ================= LEFT COLUMN ================= */}
          <div className="space-y-4">
            {/* Owner: Last Name, First Name, Middlename */}
            <div>
              <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                Owner
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  value={ownerLastName}
                  onChange={(e) => setOwnerLastName(formatTitleCase(e.target.value))}
                  placeholder="Last Name"
                  className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
                <input
                  type="text"
                  required
                  value={ownerFirstName}
                  onChange={(e) => setOwnerFirstName(formatTitleCase(e.target.value))}
                  placeholder="First Name"
                  className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
                <input
                  type="text"
                  value={ownerMiddleName}
                  onChange={(e) => setOwnerMiddleName(formatTitleCase(e.target.value))}
                  placeholder="Middle Name"
                  className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Age & Mobile Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={11}
                  required
                  value={ownerContact}
                  onKeyDown={(e) => {
                    if (
                      !/[0-9]/.test(e.key) &&
                      !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key) &&
                      !e.ctrlKey &&
                      !e.metaKey
                    ) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => setOwnerContact(formatDigitsOnly(e.target.value, 11))}
                  placeholder="e.g. 09178821920"
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
                required
                value={residentialAddress}
                onChange={(e) => setResidentialAddress(formatTitleCase(e.target.value))}
                placeholder="Zone 4, Poblacion, Tabaco City"
                className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>

            {/* Beneficiary Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                  Beneficiary Name
                </label>
                <input
                  type="text"
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(formatTitleCase(e.target.value))}
                  placeholder="Full name of beneficiary"
                  className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                  Beneficiary Address
                </label>
                <input
                  type="text"
                  value={beneficiaryAddress}
                  onChange={(e) => setBeneficiaryAddress(formatTitleCase(e.target.value))}
                  placeholder="Address of beneficiary"
                  className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Driver */}
            <div>
              <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                Driver
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={driverLastName}
                  onChange={(e) => setDriverLastName(formatTitleCase(e.target.value))}
                  placeholder="Last Name"
                  className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
                <input
                  type="text"
                  value={driverFirstName}
                  onChange={(e) => setDriverFirstName(formatTitleCase(e.target.value))}
                  placeholder="First Name"
                  className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
                <input
                  type="text"
                  value={driverMiddleName}
                  onChange={(e) => setDriverMiddleName(formatTitleCase(e.target.value))}
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
                onChange={(e) => setDriverAddress(formatTitleCase(e.target.value))}
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
                    onClick={() => setVehicleCategory('Tricycle')}
                    className={`flex items-center justify-center space-x-1.5 rounded-lg px-3 py-2 text-xs font-extrabold border-2 transition-all cursor-pointer ${
                      vehicleCategory === 'Tricycle'
                        ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs'
                        : 'bg-[#d8dfe6] border-[#c6cfd8] text-slate-700 hover:bg-white'
                    }`}
                  >
                    <span>🛺</span>
                    <span>Tricycle</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVehicleCategory('Pedicab')}
                    className={`flex items-center justify-center space-x-1.5 rounded-lg px-3 py-2 text-xs font-extrabold border-2 transition-all cursor-pointer ${
                      vehicleCategory === 'Pedicab'
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
                  placeholder={vehicleCategory === 'Tricycle' ? 'Kawasaki Barako 175' : 'Passenger Pedicab'}
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
                  value={status}
                  onChange={(e) => setStatus(e.target.value as FranchiseStatus)}
                  className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer text-center"
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
                <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                  Parada/Route
                </label>
                <input
                  type="text"
                  required
                  value={paradaRoute}
                  onChange={(e) => setParadaRoute(formatTitleCase(e.target.value))}
                  className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                  City Plate No.
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
                    required
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
                    required
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
                      required
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      placeholder={vehicleCategory === 'Pedicab' ? '250.00' : '450.00'}
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
            onClick={handleReset}
            className="bg-slate-200 hover:bg-slate-300 active:scale-[0.98] text-slate-800 font-bold text-xs sm:text-sm px-8 py-2.5 rounded-full transition-all cursor-pointer"
          >
            Reset Form
          </button>

          <button
            type="submit"
            className="bg-[#00ba7c] hover:bg-[#00a36d] active:scale-[0.98] text-slate-950 font-bold text-xs sm:text-sm px-10 py-2.5 rounded-full shadow-md border border-emerald-600/50 transition-all cursor-pointer"
          >
            Submit &amp; Enroll Franchise
          </button>
        </div>
      </form>

      {/* Printable 1-Page QR Certificate Portal */}
      {createdFranchise && typeof document !== 'undefined' && createPortal(
        <div
          id="printable-qr-certificate"
          className="hidden print:flex flex-col items-center justify-between font-sans text-slate-900 bg-white h-full max-h-[96vh] p-4 sm:p-5 border-2 border-slate-900 rounded-xl box-border overflow-hidden"
        >
          <div className="w-full text-center pb-2 border-b-2 border-slate-900">
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-600">
              Republic of the Philippines
            </p>
            <p className="text-xs uppercase font-extrabold tracking-wider text-slate-800">
              Province of Albay • City of Tabaco
            </p>
            <h1 className="text-sm uppercase font-black tracking-tight text-emerald-800 mt-0.5">
              Office of the Transportation Regulation Division (TRD)
            </h1>
            <div className="inline-block bg-slate-900 text-white font-black text-[11px] uppercase tracking-wider px-4 py-0.5 rounded-md mt-1 shadow-sm">
              Official {vehicleCategory.toUpperCase()} System QR Badge
            </div>
          </div>

          <div className="w-full bg-slate-100 border border-slate-900 rounded-lg py-2 px-5 my-2 flex items-center justify-between text-center">
            <div className="text-left">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">City Plate Number</span>
              <span className="text-2xl font-black font-mono text-slate-950 tracking-wider">
                {createdFranchise.cityPlateNumber || createdFranchise.mtopNumber}
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Permit Status</span>
              <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border bg-emerald-100 text-emerald-900 border-emerald-400">
                {createdFranchise.status}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center my-1 text-center">
            <div className="p-3 bg-white border-2 border-slate-900 rounded-2xl shadow-xs">
              <img
                src={qrDataUrl}
                alt="Official System QR Code"
                className="w-52 h-52 sm:w-56 sm:h-56 object-contain"
              />
            </div>
            <p className="text-[10px] font-bold text-slate-700 mt-1 max-w-sm">
              Scan via Google Lens or mobile camera for real-time cloud franchise credentials &amp; official fare matrix
            </p>
          </div>

          <div className="w-full grid grid-cols-2 gap-2 text-xs my-1">
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-300">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Authorized Driver</span>
              <span className="font-black text-slate-900 text-xs truncate block">{createdFranchise.driverName || '—'}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-300">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Franchise Owner / Operator</span>
              <span className="font-bold text-slate-900 text-xs truncate block">{createdFranchise.ownerName || createdFranchise.operatorName || '—'}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-300">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Authorized Route / Parada</span>
              <span className="font-bold text-slate-900 text-[11px] truncate block">{createdFranchise.routeParada || 'Sua-Igot 24 Tabaco'}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-300">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Permit Expiration Date</span>
              <span className="font-mono font-bold text-slate-900 text-[11px] block">{formatExpDate(createdFranchise.expirationDate)}</span>
            </div>
          </div>

          <div className="w-full text-center pt-2 border-t border-slate-300 text-[9px] text-slate-500 italic">
            Official Municipal Conveyance Permit • City Government of Tabaco • Scannable by citizens, enforcers, and passengers
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
