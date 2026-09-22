import React, { useState, useEffect } from 'react';
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
  Trash2 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatTitleCase, formatCodeUpper } from '../../utils/formatters';
import { cleanFare, getDefaultFareMatrix } from '../../utils/fareUtils';

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

  // Left Column - Operator Details
  const [operatorLastName, setOperatorLastName] = useState('');
  const [operatorFirstName, setOperatorFirstName] = useState('');
  const [operatorMiddleName, setOperatorMiddleName] = useState('');
  const [residentialAddress, setResidentialAddress] = useState('');
  const [expirationDate, setExpirationDate] = useState('2027-01-15');
  const [driverAvailability, setDriverAvailability] = useState('Available / On-Duty');

  // Left Column - Driver Details
  const [driverLastName, setDriverLastName] = useState('');
  const [driverFirstName, setDriverFirstName] = useState('');
  const [driverMiddleName, setDriverMiddleName] = useState('');
  const [driverAddress, setDriverAddress] = useState('');

  // Right Column - Franchise & Unit Details
  const [applicationNo, setApplicationNo] = useState(`APP-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [touristGuide, setTouristGuide] = useState<'Yes' | 'No'>('Yes');
  const [status, setStatus] = useState<FranchiseStatus>('Active');
  const [paradaRoute, setParadaRoute] = useState('Sua-Igot 24 Tabaco');
  const [cityPlateNo, setCityPlateNo] = useState(vehicleCategory === 'Tricycle' ? 'T-106' : 'P-106');

  // Sync category and default fare matrix when switching vehicle mode from dashboard
  useEffect(() => {
    if (vehicleCategory) {
      setCityPlateNo(vehicleCategory === 'Tricycle' ? 'T-106' : 'P-106');
      const defaultRows = getDefaultFareMatrix(vehicleCategory).map(f => ({
        id: f.id || `fare-${Math.random()}`,
        destination: f.destination,
        regularFare: cleanFare(f.regularFare, vehicleCategory === 'Pedicab' ? '15.00' : '20.00'),
        studentFare: cleanFare(f.studentFare, '15.00'),
        seniorPwdFare: cleanFare(f.seniorPwdFare || f.discountedFare, '16.00'),
      }));
      setFareMatrix(defaultRows);
    }
  }, [vehicleCategory]);

  // Fare Adjustment Matrix (per Destination / Route) - Separate Student & Senior 20%
  const [fareMatrix, setFareMatrix] = useState<FareRow[]>([
    {
      id: 'fare-1',
      destination: 'Poblication to Miss pina',
      regularFare: '50.00',
      studentFare: '15.00',
      seniorPwdFare: '40.00',
    },
    {
      id: 'fare-2',
      destination: 'Short Distance (Base)',
      regularFare: '20.00',
      studentFare: '15.00',
      seniorPwdFare: '16.00',
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

  if (activeModule !== 'register') return null;

  const handleAddFareRow = () => {
    setFareMatrix(prev => [
      ...prev,
      {
        id: `fare-${Date.now()}`,
        destination: '',
        regularFare: vehicleCategory === 'Pedicab' ? '15.00' : '20.00',
        studentFare: '15.00',
        seniorPwdFare: '16.00',
      }
    ]);
  };

  const handleRemoveFareRow = (id: string) => {
    if (fareMatrix.length <= 1) return;
    setFareMatrix(prev => prev.filter(r => r.id !== id));
  };

  const handleUpdateFareRow = (id: string, field: keyof FareRow, value: string) => {
    const formattedValue = field === 'destination' ? formatTitleCase(value) : value;
    setFareMatrix(prev => prev.map(r => r.id === id ? { ...r, [field]: formattedValue } : r));
  };

  const handleReset = () => {
    setCreatedId(null);
    setOperatorLastName('');
    setOperatorFirstName('');
    setOperatorMiddleName('');
    setResidentialAddress('');
    setDriverLastName('');
    setDriverFirstName('');
    setDriverMiddleName('');
    setDriverAddress('');
    setCityPlateNo(vehicleCategory === 'Tricycle' ? 'T-106' : 'P-106');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const operatorFullName = [operatorFirstName, operatorMiddleName, operatorLastName]
      .map(s => s.trim())
      .filter(Boolean)
      .join(' ') || 'Andrie B. Barosana';

    const driverFullName = [driverFirstName, driverMiddleName, driverLastName]
      .map(s => s.trim())
      .filter(Boolean)
      .join(' ') || operatorFullName;

    const baseFareAmount = fareMatrix[0] ? cleanFare(fareMatrix[0].regularFare, '20.00') : (vehicleCategory === 'Pedicab' ? '15.00' : '50.00');
    const primaryFare = `₱${baseFareAmount} Minimum`;
    const targetPlate = cityPlateNo.trim() || (vehicleCategory === 'Tricycle' ? 'T-106' : 'P-106');

    const sanitizedFareMatrix = fareMatrix.map(row => ({
      id: row.id,
      destination: row.destination.trim() || 'Short Distance (Base)',
      regularFare: cleanFare(row.regularFare, '20.00'),
      studentFare: cleanFare(row.studentFare, '15.00'),
      seniorPwdFare: cleanFare(row.seniorPwdFare, '16.00'),
      discountedFare: cleanFare(row.seniorPwdFare, '16.00'),
    }));

    const newId = addFranchise({
      applicationNo: applicationNo || `APP-2026-${Math.floor(100 + Math.random() * 900)}`,
      cityPlateNumber: targetPlate,
      mtopNumber: targetPlate,
      plateNumber: vehicleCategory === 'Tricycle' ? `${targetPlate}-TR` : `${targetPlate}-PED`,
      vehicleCategory: vehicleCategory,
      operatorLastName,
      operatorFirstName,
      operatorMiddleName,
      operatorName: operatorFullName,
      operatorContact: '0917-882-1920',
      operatorAddress: residentialAddress || 'Zone 4, Barangay Poblacion, Tabaco City',
      residentialAddress: residentialAddress || 'Zone 4, Barangay Poblacion, Tabaco City',
      driverLastName,
      driverFirstName,
      driverMiddleName,
      driverName: driverFullName,
      driverAddress: driverAddress || residentialAddress || 'Zone 4, Barangay Poblacion, Tabaco City',
      driverLicenseNo: 'N02-18-994820',
      licenseExpiry: '2028-11-20',
      registrationDate: new Date().toISOString().split('T')[0],
      expirationDate: expirationDate || '2027-01-15',
      routeParada: paradaRoute || 'Sua-Igot 24 Tabaco',
      standardFare: primaryFare,
      fareMatrix: sanitizedFareMatrix,
      touristGuide: touristGuide,
      availability: driverAvailability,
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
        <div className="bg-[#f7f8fa] rounded-[32px] border border-slate-300 shadow-2xl p-6 sm:p-9 space-y-6 max-h-[92vh] overflow-y-auto">
          
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
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-300/80 shadow-sm space-y-6">
              
              {/* Form Title & Subtitle */}
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Tricycle Registration Form
                </h3>
                <p className="text-xs text-slate-400 font-medium italic mt-0.5">
                  Enter franchise details for registration
                </p>
              </div>

              {/* 2-Column Responsive Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-5 items-start">
                
                {/* ================= LEFT COLUMN ================= */}
                <div className="space-y-4">
                  
                  {/* Operator: Last Name, First Name, Middlename */}
                  <div>
                    <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                      Operator
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        required
                        value={operatorLastName}
                        onChange={(e) => setOperatorLastName(formatTitleCase(e.target.value))}
                        placeholder="{Last Name}"
                        className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      />
                      <input
                        type="text"
                        required
                        value={operatorFirstName}
                        onChange={(e) => setOperatorFirstName(formatTitleCase(e.target.value))}
                        placeholder="{First Name}"
                        className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      />
                      <input
                        type="text"
                        value={operatorMiddleName}
                        onChange={(e) => setOperatorMiddleName(formatTitleCase(e.target.value))}
                        placeholder="{Middlename}"
                        className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
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
                      className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>

                  {/* Expiration Date & Driver Availability */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                        Expiration Date
                      </label>
                      <input
                        type="date"
                        value={expirationDate}
                        onChange={(e) => setExpirationDate(e.target.value)}
                        className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                        Driver Availability
                      </label>
                      <select
                        value={driverAvailability}
                        onChange={(e) => setDriverAvailability(e.target.value)}
                        className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                      >
                        <option value="Available / On-Duty">Available / On-Duty</option>
                        <option value="Off-Duty">Off-Duty</option>
                        <option value="On Leave">On Leave</option>
                      </select>
                    </div>
                  </div>

                  {/* Driver: Last Name, First Name, Middlename */}
                  <div>
                    <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                      Driver
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={driverLastName}
                        onChange={(e) => setDriverLastName(formatTitleCase(e.target.value))}
                        placeholder="{Last Name}"
                        className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      />
                      <input
                        type="text"
                        value={driverFirstName}
                        onChange={(e) => setDriverFirstName(formatTitleCase(e.target.value))}
                        placeholder="{First Name}"
                        className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      />
                      <input
                        type="text"
                        value={driverMiddleName}
                        onChange={(e) => setDriverMiddleName(formatTitleCase(e.target.value))}
                        placeholder="{Middlename}"
                        className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-500 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Driver Address */}
                  <div>
                    <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                      Address
                    </label>
                    <input
                      type="text"
                      value={driverAddress}
                      onChange={(e) => setDriverAddress(formatTitleCase(e.target.value))}
                      className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
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
                        className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                        Vehicle Type
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={vehicleCategory}
                        className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:outline-none cursor-default text-center select-none"
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
                      <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
                        Parada/Route
                      </label>
                      <input
                        type="text"
                        required
                        value={paradaRoute}
                        onChange={(e) => setParadaRoute(formatTitleCase(e.target.value))}
                        className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
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
                        className="w-full bg-[#d8dfe6] border border-[#c6cfd8] rounded-lg px-3 py-2 text-xs font-medium text-slate-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      />
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
                  className="bg-[#00ba7c] hover:bg-[#00a36d] active:scale-[0.98] text-slate-950 font-bold text-xs sm:text-sm px-10 py-2 rounded-full shadow-[0_3px_5px_rgba(0,0,0,0.2)] border border-emerald-600/50 transition-all cursor-pointer"
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
