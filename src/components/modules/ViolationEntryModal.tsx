import React, { useState, useEffect } from 'react';
import { useFranchise } from '../../context/FranchiseContext';
import { 
  ArrowLeft, 
  ShieldAlert, 
  AlertCircle, 
  Table, 
  PlusCircle, 
  Search, 
  CheckCircle2, 
  Clock, 
  FileText,
  UserCheck,
  ShieldCheck,
  RotateCw,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatTitleCase, formatSentenceCase, maskUsername } from '../../utils/formatters';
import { fetchViolationsFromSupabase } from '../../lib/supabaseClient';

export const ViolationEntryModal: React.FC = () => {
  const { 
    activeModule, 
    setActiveModule, 
    franchises = [], 
    violations = [], 
    addViolation, 
    updateViolationStatus, 
    vehicleCategory 
  } = useFranchise();

  const [activeTab, setActiveTab] = useState<'form' | 'table'>('form');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Settled'>('All');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('All');

  // Filter registered franchises for this category
  const categoryFranchises = franchises.filter(f => f && f.vehicleCategory === vehicleCategory);

  // Form states
  const [entryMode, setEntryMode] = useState<'registered' | 'custom'>('registered');
  const [selectedMtop, setSelectedMtop] = useState<string>('');
  const [customPlate, setCustomPlate] = useState<string>('');
  const [operatorName, setOperatorName] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('');
  const [reportedByUsername, setReportedByUsername] = useState('andrie30311');
  const [violationType, setViolationType] = useState('Fare Overcharging');
  const [location, setLocation] = useState('Public Market Main Terminal');
  const [fineAmount, setFineAmount] = useState<number>(vehicleCategory === 'Pedicab' ? 300 : 500);
  const [enforcerName, setEnforcerName] = useState('Officer J. Ramos (TMG)');
  const [remarks, setRemarks] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-sync selected unit when category or franchises list changes
  useEffect(() => {
    const list = franchises.filter(f => f && f.vehicleCategory === vehicleCategory);
    if (list.length > 0) {
      const firstPlate = list[0].cityPlateNumber || list[0].mtopNumber || '';
      setSelectedMtop(firstPlate);
      setOperatorName(list[0].operatorName || '');
      setDriverName(list[0].driverName || '');
    } else {
      setSelectedMtop(vehicleCategory === 'Pedicab' ? 'P-101' : 'T-102');
      setOperatorName('Unregistered Operator');
      setDriverName('Unregistered Driver');
    }
    setFineAmount(vehicleCategory === 'Pedicab' ? 300 : 500);
  }, [vehicleCategory, franchises]);

  // When selected unit changes from dropdown, sync operator & driver names
  const handleUnitSelectChange = (plate: string) => {
    setSelectedMtop(plate);
    const matched = categoryFranchises.find(f => (f.cityPlateNumber || f.mtopNumber) === plate);
    if (matched) {
      setOperatorName(matched.operatorName || '');
      setDriverName(matched.driverName || '');
    }
  };

  if (activeModule !== 'violation_entry') return null;

  const targetFranchise = categoryFranchises.find(f => (f.cityPlateNumber || f.mtopNumber) === selectedMtop) || categoryFranchises[0];

  // Safely filter violations for current category
  const categoryViolations = (violations || []).filter(v => {
    if (!v) return false;
    const plate = v.cityPlateNumber || v.mtopNumber || '';
    const matchedFranchise = franchises.find(f => 
      (f.cityPlateNumber && f.cityPlateNumber === plate) || 
      (f.mtopNumber && f.mtopNumber === plate) || 
      (v.franchiseId && f.id === v.franchiseId)
    );
    if (matchedFranchise) {
      return matchedFranchise.vehicleCategory === vehicleCategory;
    }
    // Fallback: check prefix (T- vs P-)
    if (vehicleCategory === 'Pedicab') return plate.toUpperCase().startsWith('P-');
    return !plate.toUpperCase().startsWith('P-');
  });

  const filteredViolations = categoryViolations.filter(v => {
    if (!v) return false;
    const plate = v.cityPlateNumber || v.mtopNumber || '';
    const op = v.operatorName || '';
    const dr = v.driverName || '';
    const vt = v.violationType || '';
    const enf = v.enforcerName || '';
    const rep = v.reportedBy || '';
    const loc = v.location || '';
    const term = searchTerm.toLowerCase();

    const matchesSearch = !term || 
      plate.toLowerCase().includes(term) ||
      op.toLowerCase().includes(term) ||
      dr.toLowerCase().includes(term) ||
      vt.toLowerCase().includes(term) ||
      enf.toLowerCase().includes(term) ||
      rep.toLowerCase().includes(term) ||
      loc.toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
    const matchesUnit = selectedUnitFilter === 'All' || plate === selectedUnitFilter;

    return matchesSearch && matchesStatus && matchesUnit;
  });

  const totalViolationsCount = categoryViolations.length;
  const pendingViolationsCount = categoryViolations.filter(v => v.status === 'Pending').length;
  const settledViolationsCount = categoryViolations.filter(v => v.status === 'Settled').length;
  const totalFinesAmount = categoryViolations.reduce((sum, v) => sum + (Number(v.fineAmount) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalPlate = '';
    let finalFranchiseId = '';
    let finalOperator = operatorName;
    let finalDriver = driverName;

    if (entryMode === 'registered' && targetFranchise) {
      finalPlate = targetFranchise.cityPlateNumber || targetFranchise.mtopNumber || selectedMtop;
      finalFranchiseId = targetFranchise.id;
      finalOperator = operatorName || targetFranchise.operatorName;
      finalDriver = driverName || targetFranchise.driverName;
    } else {
      finalPlate = customPlate.trim() || (vehicleCategory === 'Pedicab' ? 'P-COLORUM' : 'T-COLORUM');
      finalFranchiseId = `unreg-${Date.now()}`;
      finalOperator = operatorName || 'Colorum / Unregistered';
      finalDriver = driverName || 'Apprehended Driver';
    }

    addViolation({
      franchiseId: finalFranchiseId,
      cityPlateNumber: finalPlate,
      mtopNumber: finalPlate,
      plateNumber: `${finalPlate}-${vehicleCategory === 'Pedicab' ? 'PED' : 'TR'}`,
      operatorName: finalOperator,
      driverName: finalDriver,
      violationType,
      location,
      fineAmount: Number(fineAmount) || (vehicleCategory === 'Pedicab' ? 300 : 500),
      enforcerName,
      reportedBy: reportedByUsername || 'andrie30311',
      remarks: remarks || `Citation issued for ${violationType} at ${location}`,
    });

    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }

    setSuccessToast(`Violation citation successfully issued for unit ${finalPlate}! Reporter masked as ${maskUsername(reportedByUsername || 'andrie30311')}`);
    setTimeout(() => {
      setSuccessToast(null);
      setActiveTab('table');
    }, 1200);

    setRemarks('');
  };

  const handleToggleStatus = (violationId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Pending' ? 'Settled' : 'Pending';
    updateViolationStatus(violationId, newStatus);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const live = await fetchViolationsFromSupabase(vehicleCategory);
      if (live && live.length > 0) {
        setSuccessToast(`Live database synced! Loaded ${live.length} violation records.`);
        setTimeout(() => setSuccessToast(null), 3000);
      }
    } catch (e) {
      console.warn('Manual refresh error:', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className={`bg-slate-100 rounded-3xl shadow-2xl w-full overflow-hidden border border-slate-200 p-6 space-y-4 max-h-[92vh] overflow-y-auto transition-all ${
        activeTab === 'table' ? 'max-w-5xl' : 'max-w-3xl'
      }`}>
        
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setActiveModule('overview')}
            className="flex items-center space-x-2 text-xs font-bold text-slate-800 hover:text-slate-900 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </button>

          <button 
            onClick={() => setActiveModule('overview')}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Header Banner Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 border border-rose-200">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{vehicleCategory} Violation Entry & Citations</h2>
              <p className="text-xs text-slate-400 font-medium italic">File official traffic citations & review citizen reports with privacy protection</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              title="Sync with live Supabase database"
            >
              <RotateCw className={`h-3.5 w-3.5 text-rose-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Live Sync'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'form'
                  ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <PlusCircle className="h-4 w-4" />
              <span>File Citation / Report</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('table')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Table className="h-4 w-4" />
              <span>Citizen Reports & Citations ({totalViolationsCount})</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center space-x-1.5 text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 text-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Privacy Mask Active</span>
          </div>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center space-x-2 text-xs font-bold text-emerald-800 animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* TAB 1: FORM */}
        {activeTab === 'form' && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5 text-xs">
            
            {/* Mode Selector: Registered Unit vs Custom/Colorum */}
            <div className="flex items-center space-x-3 pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-700">Target Type:</span>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input 
                  type="radio" 
                  name="entryMode" 
                  checked={entryMode === 'registered'} 
                  onChange={() => setEntryMode('registered')}
                  className="text-rose-600 focus:ring-rose-500"
                />
                <span className="font-semibold text-slate-800">Registered {vehicleCategory}</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input 
                  type="radio" 
                  name="entryMode" 
                  checked={entryMode === 'custom'} 
                  onChange={() => setEntryMode('custom')}
                  className="text-rose-600 focus:ring-rose-500"
                />
                <span className="font-semibold text-slate-800">Unregistered / Colorum Unit</span>
              </label>
            </div>

            {/* Target Unit Select / Input */}
            {entryMode === 'registered' ? (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Registered {vehicleCategory} (City Plate No.) *</label>
                <select
                  value={selectedMtop}
                  onChange={(e) => handleUnitSelectChange(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  {categoryFranchises.length === 0 ? (
                    <option value="">No registered {vehicleCategory} found</option>
                  ) : (
                    categoryFranchises.map(f => {
                      const plate = f.cityPlateNumber || f.mtopNumber || f.id;
                      return (
                        <option key={f.id} value={plate}>
                          {plate} — {f.operatorName} (Driver: {f.driverName})
                        </option>
                      );
                    })
                  )}
                </select>
              </div>
            ) : (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Custom / Colorum Unit Plate Number *</label>
                <input
                  type="text"
                  required
                  value={customPlate}
                  onChange={(e) => setCustomPlate(e.target.value.toUpperCase())}
                  placeholder={vehicleCategory === 'Pedicab' ? 'e.g. P-UNREGISTERED or P-999' : 'e.g. T-COLORUM or 9999-TR'}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            )}

            {/* Operator & Driver Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Operator Name *</label>
                <input
                  type="text"
                  required
                  value={operatorName}
                  onChange={(e) => setOperatorName(formatTitleCase(e.target.value))}
                  placeholder="e.g. Juan Dela Cruz"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Apprehended Driver Name *</label>
                <input
                  type="text"
                  required
                  value={driverName}
                  onChange={(e) => setDriverName(formatTitleCase(e.target.value))}
                  placeholder="e.g. Pedro Santos"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Reporter Username with Privacy Mask Preview */}
            <div className="bg-sky-50/80 p-3.5 rounded-2xl border border-sky-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-sky-900 flex items-center space-x-1.5">
                  <UserCheck className="h-4 w-4 text-sky-700" />
                  <span>Reported By / Complainant Username</span>
                </label>
                <span className="font-mono font-bold bg-white text-sky-800 px-2 py-0.5 rounded-lg border border-sky-300">
                  Public View: {maskUsername(reportedByUsername || 'andrie30311')}
                </span>
              </div>
              <input
                type="text"
                required
                value={reportedByUsername}
                onChange={(e) => setReportedByUsername(e.target.value)}
                placeholder="e.g. andrie30311"
                className="w-full p-2 bg-white border border-sky-300 rounded-lg font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <p className="text-[11px] text-sky-700">
                🔒 Privacy Protection: The username will appear masked as <strong className="font-mono">{maskUsername(reportedByUsername || 'andrie30311')}</strong> on public citizen reports to protect reporter identity.
              </p>
            </div>

            {/* Violation Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Violation Offense Type *</label>
                <select
                  value={violationType}
                  onChange={(e) => setViolationType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none font-semibold text-slate-900"
                >
                  <option value="Fare Overcharging">Fare Overcharging</option>
                  <option value="Colorum Operation">Colorum Operation (No Franchise)</option>
                  <option value="No Driver License">No Driver License / Expired</option>
                  <option value="Refusal of Passenger Trip">Refusal of Passenger Trip</option>
                  <option value="Operating Outside Route Boundary">Operating Outside Route Boundary</option>
                  <option value="Reckless Driving">Reckless Driving / Speeding</option>
                  <option value="Rude Behavior to Commuters">Rude Behavior to Commuters</option>
                  <option value="Expired Franchise Permit">Expired Franchise Permit</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Penalty Fine Amount (PHP) *</label>
                <input
                  type="number"
                  required
                  value={fineAmount}
                  onChange={(e) => setFineAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Location of Apprehension / Incident *</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(formatTitleCase(e.target.value))}
                  placeholder="e.g. Public Market Main Terminal"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Apprehending Enforcer / Reviewing Officer *</label>
                <input
                  type="text"
                  required
                  value={enforcerName}
                  onChange={(e) => setEnforcerName(formatTitleCase(e.target.value))}
                  placeholder="e.g. Officer J. Ramos (TMG)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none font-medium text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Citation Remarks & Description</label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(formatSentenceCase(e.target.value))}
                placeholder="Describe incident circumstances, passenger statements, or citation ticket number..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none font-medium text-slate-900"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setActiveModule('overview')}
                className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30 flex items-center space-x-2 cursor-pointer transition-all hover:scale-[1.01]"
              >
                <AlertCircle className="h-4 w-4" />
                <span>Issue Official Citation Ticket</span>
              </button>
            </div>

          </form>
        )}

        {/* TAB 2: CITIZEN REPORTS & VIOLATIONS TABLE */}
        {activeTab === 'table' && (
          <div className="space-y-4">
            
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Reports</span>
                <p className="text-xl font-black text-slate-900">{totalViolationsCount}</p>
              </div>
              <div className="bg-rose-50/80 p-3.5 rounded-2xl border border-rose-200 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-rose-600">Pending Fines</span>
                <p className="text-xl font-black text-rose-700">{pendingViolationsCount}</p>
              </div>
              <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-emerald-600">Settled Citations</span>
                <p className="text-xl font-black text-emerald-700">{settledViolationsCount}</p>
              </div>
              <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-amber-700">Total Penalties</span>
                <p className="text-xl font-black text-amber-800">₱{totalFinesAmount.toLocaleString()}</p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* Status Filter */}
                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs">
                  {(['All', 'Pending', 'Settled'] as const).map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        statusFilter === status 
                          ? 'bg-white text-slate-900 shadow-sm' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                {/* Filter by Target Unit */}
                <div className="relative">
                  <select
                    value={selectedUnitFilter}
                    onChange={(e) => setSelectedUnitFilter(e.target.value)}
                    className="p-1.5 pl-2.5 pr-8 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="All">All Units ({categoryFranchises.length})</option>
                    {categoryFranchises.map(f => {
                      const plate = f.cityPlateNumber || f.mtopNumber || f.id;
                      return (
                        <option key={f.id} value={plate}>
                          {plate} ({f.operatorName})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search violations, reporter, officer..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                />
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-900 text-white font-bold">
                    <tr>
                      <th className="px-4 py-3">City Plate No.</th>
                      <th className="px-4 py-3">Reported By (Masked)</th>
                      <th className="px-4 py-3">Offense / Violation</th>
                      <th className="px-4 py-3">Operator & Driver</th>
                      <th className="px-4 py-3">Fine (PHP)</th>
                      <th className="px-4 py-3">Location & Officer</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredViolations.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <FileText className="h-8 w-8 text-slate-300" />
                            <p className="text-xs font-semibold text-slate-600">No violation reports found matching the filter</p>
                            <button
                              type="button"
                              onClick={() => setActiveTab('form')}
                              className="mt-2 text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer underline"
                            >
                              + Issue or record a new citation
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredViolations.map((v) => {
                        const plate = v.cityPlateNumber || v.mtopNumber || 'N/A';
                        const fine = Number(v.fineAmount) || 0;
                        return (
                          <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-bold font-mono text-slate-900 whitespace-nowrap">
                              {plate}
                            </td>
                            
                            {/* MASKED USERNAME COLUMN (e.g. and*******11) */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center space-x-1.5 font-mono text-[11px] font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                                <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
                                <span>{maskUsername(v.reportedBy || 'andrie30311')}</span>
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <div className="font-bold text-rose-600">{v.violationType || 'General Violation'}</div>
                              {v.remarks && (
                                <div className="text-[11px] text-slate-500 truncate max-w-xs" title={v.remarks}>
                                  {v.remarks}
                                </div>
                              )}
                            </td>

                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-900">{v.operatorName || 'Registered Operator'}</div>
                              <div className="text-[11px] text-slate-500">Driver: {v.driverName || 'Designated Driver'}</div>
                            </td>

                            <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                              ₱{fine.toFixed(2)}
                            </td>

                            <td className="px-4 py-3">
                              <div className="text-slate-800 font-medium">{v.location || 'Tabaco City'}</div>
                              <div className="text-[11px] text-slate-500">{v.enforcerName || 'TMG Officer'}</div>
                            </td>

                            <td className="px-4 py-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                              {v.dateSubmitted || '2026-09-06'}
                            </td>

                            <td className="px-4 py-3 whitespace-nowrap">
                              {v.status === 'Settled' ? (
                                <span className="inline-flex items-center space-x-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>Settled</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 text-[10px] font-bold bg-rose-100 text-rose-800 px-2.5 py-1 rounded-full border border-rose-200">
                                  <Clock className="h-3 w-3" />
                                  <span>Pending</span>
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(v.id, v.status)}
                                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-xs ${
                                  v.status === 'Pending'
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                }`}
                                title={v.status === 'Pending' ? 'Mark violation citation as settled' : 'Mark as pending'}
                              >
                                {v.status === 'Pending' ? 'Mark Settled' : 'Reopen'}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center space-x-1.5 cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                <span>File New Citation</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModule('overview')}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
              >
                Close Records
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
