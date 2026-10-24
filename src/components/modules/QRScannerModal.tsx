import React, { useState, useMemo, useEffect } from 'react';
import { useFranchise } from '../../context/FranchiseContext';
import { 
  ArrowLeft, 
  QrCode, 
  Search, 
  User, 
  Printer, 
  CheckCircle2, 
  ChevronDown, 
  Lock, 
  Sparkles,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { cleanFare, formatExpDate, getDefaultFareMatrix, buildPermanentQrPayload } from '../../utils/fareUtils';

export const QRScannerModal: React.FC = () => {
  const { 
    activeModule, 
    setActiveModule, 
    franchises, 
    selectedFranchiseId: contextSelectedId,
    generatePermanentQr,
    vehicleCategory 
  } = useFranchise();

  // Search and selected unit state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Sync selected franchise from context ONLY when the module first opens — not on every context change.
  // This prevents auto-switching away from the unit the admin is currently viewing.
  useEffect(() => {
    if (activeModule !== 'qr_scanner') return;
    if (contextSelectedId) {
      setSelectedFranchiseId(contextSelectedId);
    } else {
      const match = franchises.find(f => f.vehicleCategory === vehicleCategory);
      if (match) setSelectedFranchiseId(match.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModule]); // only re-sync when the module itself opens/closes

  // Selected unit record (default according to vehicle category)
  const currentFranchise = 
    franchises.find((f) => f.id === selectedFranchiseId && f.vehicleCategory === vehicleCategory) || 
    franchises.find((f) => f.vehicleCategory === vehicleCategory) || 
    null;

  // Filter franchises matching search query
  const filteredFranchises = useMemo(() => {
    if (!searchQuery.trim()) return franchises;
    const query = searchQuery.toLowerCase();
    return franchises.filter(
      (f) =>
        f.mtopNumber.toLowerCase().includes(query) ||
        f.driverName.toLowerCase().includes(query) ||
        f.operatorName.toLowerCase().includes(query) ||
        f.plateNumber.toLowerCase().includes(query)
    );
  }, [franchises, searchQuery]);

  if (activeModule !== 'qr_scanner') return null;

  const handleSelectFranchise = (id: string) => {
    setSelectedFranchiseId(id);
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const handleGeneratePermanentQrCode = () => {
    if (!currentFranchise) return;
    generatePermanentQr(currentFranchise.id);
    
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#05b875', '#10b981', '#049d63']
    });

    setNotification(`Success! Unique Permanent QR Code generated & locked for driver ${currentFranchise.driverName} (${currentFranchise.mtopNumber}).`);
    setTimeout(() => setNotification(null), 5000);
  };

  const handleDownloadAndPrint = () => {
    setNotification('Preparing official permanent QR Code document for print...');
    setTimeout(() => {
      window.print();
      setNotification(null);
    }, 600);
  };

  // Generate the permanent QR code payload using standard Tabaco TRD format with complete fare matrix
  const permanentQrPayload = currentFranchise ? buildPermanentQrPayload(currentFranchise) : '';

  const qrDataUrl = currentFranchise 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(permanentQrPayload)}`
    : '';

  const isPermanentActive = !!currentFranchise && currentFranchise.hasPermanentQr === true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-[#f2f4f7] rounded-3xl shadow-2xl max-w-5xl w-full border border-slate-300 p-4 sm:p-7 space-y-5 my-auto max-h-[95vh] overflow-y-auto">
        
        {/* Top Back Navigation */}
        <div>
          <button 
            onClick={() => setActiveModule('overview')}
            className="flex items-center space-x-2 text-xs sm:text-sm font-bold text-slate-800 hover:text-slate-950 cursor-pointer transition-colors"
          >
            <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Top Header Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="h-12 w-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 shrink-0">
            <QrCode className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {vehicleCategory === 'Pedicab' ? 'Pedicab Generate System QR Code' : 'Tricycle QR Code Scanner'}
            </h2>
            <p className="text-xs text-slate-500 font-medium italic mt-0.5">
              Generate QR Code for registered {vehicleCategory} units
            </p>
          </div>
        </div>

        {/* Toast / Notification banner if active */}
        {notification && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold px-4 py-3 rounded-2xl flex items-center space-x-2 shadow-sm animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Main Portal Container */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-md space-y-6">
          
          {/* Main Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-wide uppercase">
                TABACO CITY TRD PORTAL
              </h1>
              <p className="text-xs font-semibold text-slate-500">
                Registration & Qr Generator
              </p>
            </div>
            <div>
              <button 
                type="button"
                className="bg-[#05b875] hover:bg-[#049d63] text-white font-bold text-xs px-4 py-2 rounded-full flex items-center space-x-1.5 shadow-sm transition-all cursor-default"
              >
                <User className="h-3.5 w-3.5" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          {/* Two Column Steps Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            
            {/* STEP 1 : SELECT REGISTERED UNIT */}
            <div className="flex flex-col h-full">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                STEP 1 : SELECT REGISTERED UNIT
              </h3>

              <div className="bg-[#f5f7f9] rounded-2xl p-4 sm:p-5 border border-slate-200/80 flex flex-col justify-between flex-1 space-y-4">
                
                {/* Search & Selector Row */}
                <div className="space-y-2 relative">
                  <label className="block text-xs font-bold text-slate-800">
                    Search Body No. / Driver :
                  </label>
                  
                  <div className="flex items-center gap-2">
                    {/* Unit Pill Dropdown Trigger */}
                    <button
                      type="button"
                      disabled={!currentFranchise}
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className={`font-bold text-xs px-4 py-2 rounded-full flex items-center space-x-1 shrink-0 transition-colors ${
                        currentFranchise 
                          ? 'bg-slate-400 hover:bg-slate-500 text-slate-950 shadow-inner cursor-pointer'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                      title={currentFranchise ? "Click to pick unit" : "No submitted drivers"}
                    >
                      <span>{currentFranchise?.mtopNumber || 'No Units'}</span>
                      <ChevronDown className="h-3 w-3" />
                    </button>

                    {/* Search Input Field */}
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Search className="h-3.5 w-3.5" />
                      </div>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setIsDropdownOpen(true);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        placeholder="Search by City plate No. / Driver ......"
                        className="w-full pl-8 pr-3 py-2 bg-slate-200/80 border border-slate-300 rounded-full text-xs font-medium text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Dropdown Suggestions List */}
                  {isDropdownOpen && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-2xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {filteredFranchises.length > 0 ? (
                        filteredFranchises.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => handleSelectFranchise(f.id)}
                            className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between hover:bg-emerald-50 transition-colors ${
                              f.id === currentFranchise?.id ? 'bg-emerald-50 font-bold text-emerald-900' : 'text-slate-700'
                            }`}
                          >
                            <span className="font-mono font-bold">{f.mtopNumber}</span>
                            <span className="text-slate-500 truncate max-w-[180px]">{f.driverName}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-xs text-slate-400 italic text-center">
                          No matching registered unit found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* MATCHING RECORD FOUND Card / Empty state */}
                {currentFranchise ? (
                  <div className="bg-[#eef6f2] border border-emerald-200/80 rounded-2xl p-4 sm:p-5 text-xs text-slate-900 space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-[11px] text-slate-700 tracking-wider uppercase">
                        MATCHING RECORD FOUND:
                      </h4>
                      <div className="flex items-center space-x-2">
                        {currentFranchise.status === 'Expired' && (
                          <button
                            type="button"
                            onClick={() => setActiveModule('renewal')}
                            className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs transition-colors"
                            title="Process renewal for this unit"
                          >
                            <RefreshCw className="h-2.5 w-2.5" />
                            <span>Renew</span>
                          </button>
                        )}
                        <span className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          currentFranchise.status === 'Expired'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : isPermanentActive 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}>
                          {currentFranchise.status === 'Expired' ? (
                            <>
                              <AlertTriangle className="h-3 w-3 text-rose-600" />
                              <span>EXPIRED DRIVER RECORD</span>
                            </>
                          ) : (
                            <>
                              <Lock className="h-3 w-3" />
                              <span>{isPermanentActive ? 'PERMANENT QR ACTIVE' : 'READY FOR QR GENERATION'}</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 divide-y divide-slate-200/80">
                      <div className="flex justify-between items-center pt-1">
                        <span className="font-medium text-slate-700">• Vehicle Type:</span>
                        <span className="font-bold text-slate-900">{currentFranchise.vehicleCategory}</span>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span className="font-medium text-slate-700">• CityPlate Number:</span>
                        <span className="font-mono font-bold text-slate-900">{currentFranchise.mtopNumber}</span>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span className="font-medium text-slate-700">• Operator:</span>
                        <span className="font-bold text-slate-900">{currentFranchise.operatorName}</span>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span className="font-medium text-slate-700">• Driver Name:</span>
                        <span className="font-bold text-slate-900">{currentFranchise.driverName}</span>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span className="font-medium text-slate-700">• Route/Parada:</span>
                        <span className="font-bold text-slate-900">{currentFranchise.routeParada || 'Sua-Igot 24'}</span>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span className="font-medium text-slate-700">• Standard Fare:</span>
                        <span className="font-bold text-slate-900">{currentFranchise.standardFare && !currentFranchise.standardFare.includes('50.00 Minimum') ? currentFranchise.standardFare : (vehicleCategory === 'Pedicab' ? '₱15.00 Minimum' : '₱20.00 Minimum')}</span>
                      </div>

                      {/* Official Fare Matrix Breakdown */}
                      <div className="pt-2">
                        <span className="font-bold text-slate-800 text-[11px] block mb-1.5">
                          • Official Fare Matrix:
                        </span>
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                          <table className="w-full text-[11px] text-left">
                            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                              <tr>
                                <th className="py-1.5 px-2">Route / Distance</th>
                                <th className="py-1.5 px-2 text-center">Regular</th>
                                <th className="py-1.5 px-2 text-center text-blue-700">Student (20%)</th>
                                <th className="py-1.5 px-2 text-center text-emerald-700">Senior/PWD (20%)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-800">
                              {(currentFranchise.fareMatrix && currentFranchise.fareMatrix.length > 0 
                                ? currentFranchise.fareMatrix 
                                : getDefaultFareMatrix(vehicleCategory)
                              ).map((f, idx) => {
                                const fallback = vehicleCategory === 'Pedicab' ? '15.00' : '20.00';
                                const reg = cleanFare(f.regularFare, fallback);
                                const regNum = parseFloat(reg);
                                const defaultDiscount = (regNum * 0.8).toFixed(2);
                                const stu = cleanFare(f.studentFare, defaultDiscount);
                                const snr = cleanFare(f.seniorPwdFare || f.discountedFare, defaultDiscount);

                                return (
                                  <tr key={f.id || idx} className="hover:bg-slate-50/80">
                                    <td className="py-1.5 px-2 font-medium">{f.destination}</td>
                                    <td className="py-1.5 px-2 text-center font-bold">₱{reg}</td>
                                    <td className="py-1.5 px-2 text-center font-bold text-blue-700">₱{stu}</td>
                                    <td className="py-1.5 px-2 text-center font-bold text-emerald-700">₱{snr}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span className="font-medium text-slate-700">• Tourist Guide:</span>
                        <span className="font-bold text-slate-900">{currentFranchise.touristGuide || 'Yes'}</span>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span className="font-medium text-slate-700">• Availability:</span>
                        <span className="font-bold text-slate-900">{currentFranchise.availability || 'Available / On-Duty'}</span>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span className="font-medium text-slate-700">• Status:</span>
                        <span className={`font-bold text-[11px] px-2.5 py-0.5 rounded-full border ${
                          currentFranchise.status === 'Expired'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : currentFranchise.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}>
                          {currentFranchise.status || 'Active'} (Expires: {formatExpDate(currentFranchise.expirationDate)})
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-3 my-auto">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">No {vehicleCategory} Drivers in Registry</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Submit a new driver under Register Franchise to generate their official permanent QR Code badge.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveModule('register')}
                      className="inline-flex items-center space-x-1.5 bg-[#05b875] hover:bg-[#049d63] text-white font-bold text-xs px-5 py-2.5 rounded-full shadow-sm transition-all cursor-pointer"
                    >
                      <span>Register Franchise</span>
                    </button>
                  </div>
                )}

                {/* Generate Action Button / Permanent Status */}
                {currentFranchise ? (
                  isPermanentActive ? (
                    <div className="w-full bg-emerald-50 border border-emerald-300/80 text-emerald-900 font-bold text-xs sm:text-sm py-3 px-6 rounded-full shadow-sm flex items-center justify-center space-x-2">
                      <Lock className="h-4 w-4 text-emerald-600" />
                      <span>PERMANENT QR CODE ACTIVE & LOCKED</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGeneratePermanentQrCode}
                      className="w-full bg-[#05b875] hover:bg-[#049d63] active:scale-[0.99] text-white font-bold text-xs sm:text-sm py-3.5 px-6 rounded-full shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer uppercase tracking-wider animate-pulse"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>GENERATE PERMANENT QR CODE</span>
                    </button>
                  )
                ) : null}

              </div>
            </div>

            {/* STEP 2: LIVE QR PREVIEW */}
            <div className="flex flex-col h-full">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                STEP 2: LIVE QR PREVIEW
              </h3>

              <div className="bg-[#f5f7f9] rounded-2xl p-4 sm:p-5 border border-slate-200/80 flex flex-col justify-between flex-1 space-y-4">
                
                {/* QR Code Container Box */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col items-center justify-center flex-1 min-h-[300px] shadow-sm space-y-3">
                  {currentFranchise ? (
                    isPermanentActive ? (
                      <>
                        <div className={`flex items-center space-x-1.5 text-[11px] font-bold px-3 py-1 rounded-full border ${
                          currentFranchise.status === 'Expired'
                            ? 'text-rose-800 bg-rose-50 border-rose-300'
                            : 'text-emerald-800 bg-emerald-50 border-emerald-200'
                        }`}>
                          {currentFranchise.status === 'Expired' ? (
                            <>
                              <AlertTriangle className="h-3 w-3 text-rose-600" />
                              <span>PERMANENT DRIVER QR CODE (STATUS: EXPIRED)</span>
                            </>
                          ) : (
                            <>
                              <Lock className="h-3 w-3 text-emerald-600" />
                              <span>PERMANENT DRIVER QR CODE</span>
                            </>
                          )}
                        </div>

                        <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                          <img
                            src={qrDataUrl}
                            alt="System QR Code"
                            className="w-52 h-52 sm:w-60 sm:h-60 object-contain"
                          />
                        </div>

                        <div className="text-center space-y-0.5">
                          <p className="text-xs sm:text-sm font-bold font-mono text-slate-900 tracking-wider">
                            UNIT ID: {currentFranchise.mtopNumber}
                          </p>
                          <p className="text-[11px] font-semibold text-slate-500">
                            Driver: {currentFranchise.driverName}
                          </p>
                        </div>

                        {/* Scanned Plain Text Output Preview */}
                        <div className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-left space-y-1 mt-2">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                            <span>Phone Camera Decoded Output:</span>
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                              currentFranchise.status === 'Expired'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {currentFranchise.status === 'Expired' ? 'Scanned Status: EXPIRED' : 'Scannable Plain Text'}
                            </span>
                          </div>
                          <pre className="text-[10px] font-mono text-slate-700 whitespace-pre-wrap leading-relaxed max-h-24 overflow-y-auto bg-white p-2 rounded-lg border border-slate-200/60 shadow-inner">
                            {permanentQrPayload}
                          </pre>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-6 space-y-4">
                        <div className="h-16 w-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto border border-dashed border-slate-300">
                          <QrCode className="h-8 w-8" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">QR Code Ready for Generation</p>
                          <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                            Click <span className="font-bold text-emerald-700">"GENERATE PERMANENT QR CODE"</span> on Step 1 to issue a unique permanent QR badge for driver {currentFranchise.driverName}.
                          </p>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="text-center p-8 space-y-3">
                      <div className="h-16 w-16 bg-slate-100 text-slate-300 rounded-2xl flex items-center justify-center mx-auto border border-dashed border-slate-300">
                        <QrCode className="h-8 w-8" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">No {vehicleCategory} Unit Selected</p>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                          Once an actual driver is registered, their permanent QR code badge and scanned output will be displayed here.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* DOWNLOAD & PRINT Button */}
                <button
                  type="button"
                  disabled={!isPermanentActive}
                  onClick={handleDownloadAndPrint}
                  className={`w-full font-bold text-xs sm:text-sm py-3 px-6 rounded-full shadow-md transition-all flex items-center justify-center space-x-2 uppercase tracking-wider ${
                    isPermanentActive 
                      ? 'bg-[#05b875] hover:bg-[#049d63] text-white cursor-pointer' 
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  }`}
                >
                  <Printer className="h-4 w-4" />
                  <span>DOWNLOAD & PRINT</span>
                </button>

              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
