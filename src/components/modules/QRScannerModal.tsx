import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFranchise } from '../../context/FranchiseContext';
import { 
  QrCode, 
  Search, 
  User, 
  Printer, 
  CheckCircle2, 
  ChevronDown, 
  Lock, 
  Sparkles,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Globe,
  FileDown,
  Calendar,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  cleanFare, 
  formatExpDate, 
  getDefaultFareMatrix, 
  buildPermanentQrPayload
} from '../../utils/fareUtils';
import { downloadFranchiseDocx } from '../../utils/docxExport';

export const QRScannerModal: React.FC = () => {
  const { 
    activeModule, 
    franchises, 
    selectedFranchiseId: contextSelectedId,
    generatePermanentQr,
    renewFranchise
  } = useFranchise();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [isExportingDocx, setIsExportingDocx] = useState(false);

  // Inline quick renewal state (so admin doesn't have to move to another portal)
  const [showInlineRenew, setShowInlineRenew] = useState(false);
  const [inlineExpiry, setInlineExpiry] = useState('2027-01-15');

  useEffect(() => {
    if (activeModule !== 'qr_scanner') return;
    if (contextSelectedId) {
      setSelectedFranchiseId(contextSelectedId);
    } else if (franchises[0]) {
      setSelectedFranchiseId(franchises[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModule]);

  const currentFranchise = 
    franchises.find((f) => f.id === selectedFranchiseId) || 
    franchises[0] || 
    null;

  const filteredFranchises = useMemo(() => {
    if (!searchQuery.trim()) return franchises;
    const query = searchQuery.toLowerCase();
    return franchises.filter(
      (f) =>
        f.mtopNumber.toLowerCase().includes(query) ||
        (f.vehicleCategory || '').toLowerCase().includes(query) ||
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
    setShowInlineRenew(false);
  };

  const handleGeneratePermanentQrCode = async () => {
    if (!currentFranchise) return;
    try {
      await generatePermanentQr(currentFranchise.id);
      
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#05b875', '#10b981', '#049d63']
      });

      setNotification(`Success! Unique Permanent QR Code generated & locked for driver ${currentFranchise.driverName} (${currentFranchise.mtopNumber}).`);
    } catch (err: any) {
      setNotification(`Error generating QR code: ${err?.message || 'Please retry.'}`);
    } finally {
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleInlineRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFranchise || !inlineExpiry) return;
    await renewFranchise(currentFranchise.id, { newExpiry: inlineExpiry });
    setShowInlineRenew(false);
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    setNotification(`Renewed Unit ${currentFranchise.mtopNumber} inline • New Expiration: ${inlineExpiry}`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDownloadAndPrint = () => {
    setNotification('Preparing 1-page printable official badge (Select Destination: Save as PDF or Printer)...');
    setTimeout(() => {
      window.print();
      setNotification(null);
    }, 400);
  };

  const handleDownloadDocx = async () => {
    if (!currentFranchise) return;
    setIsExportingDocx(true);
    setNotification(`Generating editable Word (.docx) document for Unit ${currentFranchise.mtopNumber}...`);
    try {
      await downloadFranchiseDocx(currentFranchise, qrDataUrl);
      setNotification(`Success! Downloaded Word (.docx) for Unit ${currentFranchise.mtopNumber}. You can now edit all pages and details in Microsoft Word.`);
      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      setNotification(`Could not generate Word document: ${err?.message || 'Unknown error'}`);
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setIsExportingDocx(false);
    }
  };

  const permanentQrPayload = currentFranchise ? buildPermanentQrPayload(currentFranchise) : '';
  const qrDataUrl = currentFranchise 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(permanentQrPayload)}`
    : '';
  const isPermanentActive = !!currentFranchise && currentFranchise.hasPermanentQr === true;

  return (
    <div className="space-y-6 animate-fadeIn">
      {notification && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold px-4 py-3 rounded-2xl flex items-center space-x-2 shadow-sm animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Single-Page Container */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-xs space-y-6">
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
                  <button
                    type="button"
                    disabled={!currentFranchise}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`font-bold text-xs px-4 py-2 rounded-full flex items-center space-x-1 shrink-0 transition-colors ${
                      currentFranchise 
                        ? 'bg-slate-800 hover:bg-slate-700 text-white shadow-xs cursor-pointer'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <span>{currentFranchise?.mtopNumber || 'No Units'}</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>

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
                      placeholder="Search by City plate No. / Driver..."
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-full text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>

                {isDropdownOpen && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-2xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {filteredFranchises.length > 0 ? (
                      filteredFranchises.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => handleSelectFranchise(f.id)}
                          className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between hover:bg-emerald-50 transition-colors cursor-pointer ${
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

              {/* MATCHING RECORD FOUND Card */}
              {currentFranchise ? (
                <div className="bg-[#eef6f2] border border-emerald-200/80 rounded-2xl p-4 sm:p-5 text-xs text-slate-900 space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="font-bold text-[11px] text-slate-700 tracking-wider uppercase">
                      MATCHING RECORD FOUND:
                    </h4>
                    <div className="flex items-center space-x-2">
                      {currentFranchise.status === 'Expired' && (
                        <button
                          type="button"
                          onClick={() => setShowInlineRenew(!showInlineRenew)}
                          className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs transition-colors"
                          title="Renew unit inline on this page"
                        >
                          <RefreshCw className="h-2.5 w-2.5" />
                          <span>Renew Here</span>
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

                  {/* Inline Quick Renewal Form if clicked */}
                  {showInlineRenew && (
                    <form onSubmit={handleInlineRenewSubmit} className="bg-white p-3 rounded-xl border border-blue-200 space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-blue-800 flex items-center space-x-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Set Next Expiration Date (Inline Renewal)</span>
                        </span>
                        <button type="button" onClick={() => setShowInlineRenew(false)} className="text-slate-400 hover:text-slate-700">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="date"
                          required
                          value={inlineExpiry}
                          onChange={(e) => setInlineExpiry(e.target.value)}
                          className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Save Renewal
                        </button>
                      </div>
                    </form>
                  )}

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
                      <span className="font-medium text-slate-700">• Tourist Guide:</span>
                      <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px]">
                        {currentFranchise.touristGuide || 'Yes'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-medium text-slate-700">• Standard Fare:</span>
                      <span className="font-bold text-slate-900">
                        {currentFranchise.standardFare && !currentFranchise.standardFare.includes('50.00 Minimum')
                          ? currentFranchise.standardFare
                          : (currentFranchise.vehicleCategory === 'Pedicab' ? '₱15.00 Minimum' : '₱20.00 Minimum')}
                      </span>
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
                              : getDefaultFareMatrix(currentFranchise.vehicleCategory)
                            ).map((f, idx) => {
                              const fallback = currentFranchise.vehicleCategory === 'Pedicab' ? '15.00' : '20.00';
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
                    <h4 className="font-bold text-sm text-slate-800">No Drivers in Registry</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Use &ldquo;Register Franchise&rdquo; in the sidebar to add a new driver and generate their QR badge.
                    </p>
                  </div>
                </div>
              )}

              {/* Generate Action Button / Permanent Status */}
              {currentFranchise ? (
                isPermanentActive ? (
                  <div className="w-full bg-emerald-50 border border-emerald-300/80 text-emerald-900 font-bold text-xs sm:text-sm py-3 px-6 rounded-full shadow-xs flex items-center justify-center space-x-2">
                    <Lock className="h-4 w-4 text-emerald-600" />
                    <span>PERMANENT QR CODE ACTIVE &amp; LOCKED</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleGeneratePermanentQrCode}
                    className="w-full bg-[#05b875] hover:bg-[#049d63] active:scale-[0.99] text-white font-bold text-xs sm:text-sm py-3.5 px-6 rounded-full shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer uppercase tracking-wider"
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
              STEP 2: LIVE QR PREVIEW &amp; EXPORT
            </h3>

            <div className="bg-[#f5f7f9] rounded-2xl p-4 sm:p-5 border border-slate-200/80 flex flex-col justify-between flex-1 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col items-center justify-center flex-1 min-h-[300px] shadow-xs space-y-3">
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
                            <span>OFFICIAL QR LINK (STATUS: EXPIRED)</span>
                          </>
                        ) : (
                          <>
                            <Globe className="h-3 w-3 text-emerald-600" />
                            <span>UNIVERSAL QR LINK • GOOGLE LENS &amp; CAMERA SCAN</span>
                          </>
                        )}
                      </div>

                      <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
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
                          Driver: {currentFranchise.driverName} • Tourist Guide: {currentFranchise.touristGuide || 'Yes'}
                        </p>
                      </div>

                      <div className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-left space-y-2 mt-2">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                          <span className="flex items-center space-x-1">
                            <Globe className="h-3 w-3 text-emerald-600" />
                            <span>Google Lens &amp; Built-in Camera Target URL:</span>
                          </span>
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                            currentFranchise.status === 'Expired'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {currentFranchise.status === 'Expired' ? 'Status: EXPIRED' : 'Status: ACTIVE'}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-slate-200 shadow-inner">
                          <input
                            type="text"
                            readOnly
                            value={permanentQrPayload}
                            className="text-[10px] font-mono text-slate-700 bg-transparent flex-1 outline-none select-all overflow-ellipsis"
                          />
                          <a
                            href={permanentQrPayload}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-xs transition-colors shrink-0 cursor-pointer"
                          >
                            <span>Test Link</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        </div>
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
                          Click <span className="font-bold text-emerald-700">&ldquo;GENERATE PERMANENT QR CODE&rdquo;</span> on Step 1 to issue a unique permanent QR badge for driver {currentFranchise.driverName}.
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
                      <p className="text-xs font-bold text-slate-700">No Unit Selected</p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                        Once a driver is registered, their permanent QR code badge and scanned output will be displayed here.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-1 no-print">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={!isPermanentActive || isExportingDocx}
                    onClick={handleDownloadDocx}
                    className={`w-full font-bold text-xs py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 ${
                      isPermanentActive && !isExportingDocx
                        ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white cursor-pointer'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <FileDown className="h-4 w-4 shrink-0" />
                    <span>{isExportingDocx ? 'Generating Word...' : 'Download Word (.docx)'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={!isPermanentActive}
                    onClick={handleDownloadAndPrint}
                    className={`w-full font-bold text-xs py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 ${
                      isPermanentActive
                        ? 'bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white cursor-pointer'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Printer className="h-4 w-4 shrink-0" />
                    <span>Print / Save PDF (1-Page)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Printable 1-Page QR Certificate */}
      {currentFranchise && typeof document !== 'undefined' && createPortal(
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
              Official {(currentFranchise.vehicleCategory || 'Tricycle').toUpperCase()} System QR Badge
            </div>
          </div>

          <div className="w-full bg-slate-100 border border-slate-900 rounded-lg py-2 px-5 my-2 flex items-center justify-between text-center">
            <div className="text-left">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">City Plate Number</span>
              <span className="text-2xl font-black font-mono text-slate-950 tracking-wider">
                {currentFranchise.cityPlateNumber || currentFranchise.mtopNumber}
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Permit Status</span>
              <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                currentFranchise.status === 'Active'
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                  : 'bg-rose-100 text-rose-900 border-rose-400'
              }`}>
                {currentFranchise.status}
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
              <span className="font-black text-slate-900 text-xs truncate block">{currentFranchise.driverName || '—'}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-300">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Franchise Operator</span>
              <span className="font-bold text-slate-900 text-xs truncate block">{currentFranchise.operatorName || currentFranchise.ownerName || '—'}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-300">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Authorized Route / Parada</span>
              <span className="font-bold text-slate-900 text-[11px] truncate block">{currentFranchise.routeParada || 'Sua-Igot 24 Tabaco'}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-300">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Accredited Tourist Guide</span>
              <span className="font-bold text-emerald-800 text-[11px] truncate block">{currentFranchise.touristGuide || 'Yes'}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-300 col-span-2">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Permit Expiration Date</span>
              <span className="font-mono font-bold text-slate-900 text-[11px] block">{formatExpDate(currentFranchise.expirationDate)}</span>
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
