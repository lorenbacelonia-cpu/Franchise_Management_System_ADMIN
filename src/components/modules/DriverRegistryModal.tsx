import React, { useState } from 'react';
import { useFranchise } from '../../context/FranchiseContext';
import type { FranchiseRecord } from '../../types';
import {
  ArrowLeft,
  UserCheck,
  Search,
  Phone,
  MapPin,
  Building2,
  Users,
  Navigation,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  X,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatTitleCase } from '../../utils/formatters';

export const DriverRegistryModal: React.FC = () => {
  const { activeModule, setActiveModule, franchises = [], vehicleCategory, updateDriver } = useFranchise();
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Edit & Review state
  const [editingUnit, setEditingUnit] = useState<FranchiseRecord | null>(null);
  const [step, setStep] = useState<'edit' | 'review'>('edit');
  const [newOperatorName, setNewOperatorName] = useState('');
  const [newOperatorContact, setNewOperatorContact] = useState('');
  const [newOperatorAddress, setNewOperatorAddress] = useState('');
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverAddress, setNewDriverAddress] = useState('');
  const [isConfirmedChecked, setIsConfirmedChecked] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (activeModule !== 'driver_registry') return null;

  // Filter for the active vehicle category (Tricycle or Pedicab)
  const categoryFranchises = franchises.filter(f => f.vehicleCategory === vehicleCategory);

  // Filter with search term
  const filteredFranchises = categoryFranchises.filter(f => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      (f.operatorName || '').toLowerCase().includes(term) ||
      (f.driverName || '').toLowerCase().includes(term) ||
      (f.cityPlateNumber || f.mtopNumber || '').toLowerCase().includes(term) ||
      (f.status || '').toLowerCase().includes(term) ||
      (f.operatorContact || '').toLowerCase().includes(term) ||
      (f.operatorAddress || f.residentialAddress || '').toLowerCase().includes(term) ||
      (f.driverAddress || '').toLowerCase().includes(term) ||
      (f.routeParada || '').toLowerCase().includes(term)
    );
  });

  const handleOpenEditModal = (item: FranchiseRecord) => {
    setEditingUnit(item);
    setStep('edit');
    setNewOperatorName(item.operatorName || '');
    setNewOperatorContact(item.operatorContact || '');
    setNewOperatorAddress(item.operatorAddress || item.residentialAddress || '');
    setNewDriverName(item.driverName || '');
    setNewDriverAddress(item.driverAddress || '');
    setIsConfirmedChecked(false);
    setFormError(null);
  };

  const handleCloseEditModal = () => {
    setEditingUnit(null);
    setStep('edit');
    setIsConfirmedChecked(false);
    setFormError(null);
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnit) return;

    const cleanOp = newOperatorName.trim();
    const cleanDrv = newDriverName.trim();

    if (!cleanOp || !cleanDrv) {
      setFormError('Both Operator Name and Driver Name are required.');
      return;
    }

    setFormError(null);
    setIsConfirmedChecked(false);
    setStep('review');
  };

  const handleConfirmSaveChanges = async () => {
    if (!editingUnit) return;
    if (!isConfirmedChecked) {
      setFormError('Please check the confirmation box before saving changes.');
      return;
    }

    const plate = editingUnit.cityPlateNumber || editingUnit.mtopNumber;
    const finalOperator = newOperatorName.trim();
    const finalDriver = newDriverName.trim();

    await updateDriver(plate, {
      operatorName: finalOperator,
      driverName: finalDriver,
      contact: newOperatorContact.trim() || editingUnit.operatorContact,
      operatorAddress: newOperatorAddress.trim(),
      driverAddress: newDriverAddress.trim(),
    });

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#4f46e5', '#10b981', '#2563eb']
    });

    setNotification(
      `Updated Plate ${plate} • Operator: ${finalOperator} • Driver: ${finalDriver}`
    );
    setTimeout(() => setNotification(null), 5000);
    handleCloseEditModal();
  };

  const operatorChanged = editingUnit ? newOperatorName.trim() !== (editingUnit.operatorName || '').trim() : false;
  const driverChanged = editingUnit ? newDriverName.trim() !== (editingUnit.driverName || '').trim() : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-100 rounded-3xl shadow-2xl max-w-5xl w-full overflow-hidden border border-slate-200 p-6 space-y-4 max-h-[92vh] flex flex-col">

        {/* Top Back Navigation */}
        <div className="flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => setActiveModule('overview')}
            className="flex items-center space-x-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </button>

          <span className="text-[11px] font-mono text-slate-500 bg-slate-200/70 px-2.5 py-1 rounded-full font-semibold">
            {vehicleCategory} Registry • {categoryFranchises.length} Total Units
          </span>
        </div>

        {/* Header Banner Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="h-11 w-11 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 shadow-xs">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {vehicleCategory} Driver &amp; Operator Registry
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Official directory of registered operators, franchise grantees &amp; authorized drivers
              </p>
            </div>
          </div>

          {/* Unified Combined Metric Box (In One) */}
          <div className="bg-indigo-50/70 border border-indigo-200/80 px-4 py-2 rounded-2xl text-center shrink-0 shadow-2xs">
            <span className="block text-[10px] uppercase font-bold text-indigo-700 tracking-wider">
              Operators &amp; Drivers
            </span>
            <span className="text-base font-black text-slate-900 font-mono">
              {categoryFranchises.length}
            </span>
          </div>
        </div>

        {/* Toast Notification */}
        {notification && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold px-4 py-3 rounded-2xl flex items-center space-x-2 shadow-sm animate-fadeIn shrink-0">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Controls Bar: Unified Header & Search Bar (In One) */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
            <Users className="h-4 w-4 text-indigo-600 shrink-0" />
            <span>Driver &amp; Operator Registry ({filteredFranchises.length})</span>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search operator, driver, plate, or status…"
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
            />
          </div>
        </div>

        {/* Content Container (Scrollable) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex-1 overflow-y-auto space-y-4 min-h-0">

          {filteredFranchises.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <Users className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">
                {searchTerm
                  ? `No matching records found for "${searchTerm}"`
                  : `No Registered ${vehicleCategory} Records Found`}
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchTerm
                  ? 'Try searching with another operator name, driver name, or city plate number.'
                  : 'Registered franchise units and their assigned drivers and operators will appear in this registry.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFranchises.map((item) => {
                const plate = item.cityPlateNumber || item.mtopNumber || '—';
                const operatorInitial = (item.operatorName || 'O').trim().charAt(0).toUpperCase();
                const driverInitial = (item.driverName || 'D').trim().charAt(0).toUpperCase();

                return (
                  <div
                    key={item.id}
                    className="bg-slate-50/90 hover:bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 hover:border-slate-300 transition-all space-y-3.5 shadow-xs flex flex-col justify-between"
                  >
                    <div className="space-y-3.5">
                      {/* Unit Top Bar */}
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                        <div className="flex items-center space-x-2">
                          <span className="px-2.5 py-1 bg-slate-900 text-white font-mono font-bold text-xs rounded-lg shadow-xs">
                            Plate {plate}
                          </span>
                          {item.routeParada && (
                            <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                              <Navigation className="h-2.5 w-2.5 text-slate-400" />
                              <span className="truncate max-w-[140px]">{item.routeParada}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            item.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : item.status === 'Expired'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {item.status || 'Active'}
                          </span>
                        </div>
                      </div>

                      {/* Operator Box */}
                      <div className="bg-white p-3 rounded-xl border border-indigo-100 space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5 text-[11px] font-bold text-indigo-700 uppercase tracking-wide">
                            <Building2 className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                            <span>Franchise Operator</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">Owner</span>
                        </div>
                        <div className="flex items-center space-x-2.5 pt-0.5">
                          <div className="h-8 w-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 font-black text-xs flex items-center justify-center shrink-0">
                            {operatorInitial}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {item.operatorName || 'No Operator Recorded'}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono truncate flex items-center">
                              <Phone className="h-3 w-3 mr-1 text-slate-400 shrink-0" />
                              <span>{item.operatorContact || 'No contact number'}</span>
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
                          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            Active
                          </span>
                        </div>
                        <div className="flex items-center space-x-2.5 pt-0.5">
                          <div className="h-8 w-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0">
                            {driverInitial}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {item.driverName || 'No Driver Assigned'}
                            </p>
                            <div className="flex items-center space-x-1.5 text-[11px] mt-0.5">
                              <span className="font-semibold text-slate-500">Status:</span>
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase font-mono ${
                                item.status === 'Active'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
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

                    {/* Action Bar: Change Operator & Driver */}
                    <div className="pt-2 border-t border-slate-200/80 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all cursor-pointer active:scale-[0.98]"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Change Operator &amp; Driver</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

      {/* Modal: Change Operator & Driver with Review Names & Confirmation Step */}
      {editingUnit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30">
                  {step === 'edit' ? <Edit3 className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    {step === 'edit' ? 'Change Operator & Driver' : 'Review Names & Confirm Change'}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Unit Plate {editingUnit.cityPlateNumber || editingUnit.mtopNumber} • {editingUnit.vehicleCategory}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Step Indicator */}
            <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex items-center space-x-3 text-xs font-bold">
              <span className={`px-2.5 py-0.5 rounded-full ${step === 'edit' ? 'bg-indigo-600 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                1. Edit Names
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              <span className={`px-2.5 py-0.5 rounded-full ${step === 'review' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                2. Review Names &amp; Confirm
              </span>
            </div>

            {formError && (
              <div className="mx-6 mt-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {step === 'edit' ? (
              <form onSubmit={handleProceedToReview} className="p-6 space-y-4">
                {/* Operator Section */}
                <div className="bg-indigo-50/40 p-4 rounded-xl border border-indigo-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-800 flex items-center space-x-1.5">
                      <Building2 className="h-4 w-4 text-indigo-600" />
                      <span>Franchise Operator Details</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Current: {editingUnit.operatorName}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Operator Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newOperatorName}
                      onChange={(e) => setNewOperatorName(formatTitleCase(e.target.value))}
                      placeholder="Enter Operator Full Name"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Contact Number
                      </label>
                      <input
                        type="text"
                        value={newOperatorContact}
                        onChange={(e) => setNewOperatorContact(e.target.value)}
                        placeholder="e.g. 0917-882-1920"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Operator Address
                      </label>
                      <input
                        type="text"
                        value={newOperatorAddress}
                        onChange={(e) => setNewOperatorAddress(formatTitleCase(e.target.value))}
                        placeholder="Barangay / Street, Tabaco City"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Driver Section */}
                <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 flex items-center space-x-1.5">
                      <UserCheck className="h-4 w-4 text-emerald-600" />
                      <span>Authorized Driver Details</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Current: {editingUnit.driverName}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Driver Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newDriverName}
                      onChange={(e) => setNewDriverName(formatTitleCase(e.target.value))}
                      placeholder="Enter Authorized Driver Full Name"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Driver Address
                    </label>
                    <input
                      type="text"
                      value={newDriverAddress}
                      onChange={(e) => setNewDriverAddress(formatTitleCase(e.target.value))}
                      placeholder="Barangay / Street, Tabaco City"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all inline-flex items-center space-x-1.5 cursor-pointer"
                  >
                    <span>Review Names</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </form>
            ) : (
              /* Step 2: Review Names & Confirmation */
              <div className="p-6 space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start space-x-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Please Review Names Before Saving</p>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Verify the previous and updated Operator and Driver names below for Unit{' '}
                      <span className="font-mono font-bold">{editingUnit.cityPlateNumber || editingUnit.mtopNumber}</span>.
                    </p>
                  </div>
                </div>

                {/* Review Names Comparison Cards */}
                <div className="space-y-3">
                  {/* Operator Name Review */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase text-indigo-700 flex items-center space-x-1">
                        <Building2 className="h-3.5 w-3.5" />
                        <span>Franchise Operator Name</span>
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        operatorChanged ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {operatorChanged ? 'Name Changed' : 'Unchanged'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="block text-[10px] text-slate-400 font-semibold uppercase">Previous Name</span>
                        <span className="font-semibold text-slate-600">{editingUnit.operatorName || '—'}</span>
                      </div>
                      <div className={`p-2.5 rounded-lg border ${
                        operatorChanged ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-200'
                      }`}>
                        <span className="block text-[10px] text-indigo-600 font-bold uppercase">New Reviewed Name</span>
                        <span className="font-bold text-slate-900">{newOperatorName.trim()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Driver Name Review */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase text-emerald-700 flex items-center space-x-1">
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Authorized Driver Name</span>
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        driverChanged ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {driverChanged ? 'Name Changed' : 'Unchanged'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="block text-[10px] text-slate-400 font-semibold uppercase">Previous Name</span>
                        <span className="font-semibold text-slate-600">{editingUnit.driverName || '—'}</span>
                      </div>
                      <div className={`p-2.5 rounded-lg border ${
                        driverChanged ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200'
                      }`}>
                        <span className="block text-[10px] text-emerald-700 font-bold uppercase">New Reviewed Name</span>
                        <span className="font-bold text-slate-900">{newDriverName.trim()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mandatory Confirmation Checkbox */}
                <label className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-100 border border-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isConfirmedChecked}
                    onChange={(e) => {
                      setIsConfirmedChecked(e.target.checked);
                      if (e.target.checked) setFormError(null);
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-800 leading-snug">
                    I have reviewed the Operator and Driver names above and confirm changing them in the official TRD Franchise Registry.
                  </span>
                </label>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setFormError(null);
                      setStep('edit');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back to Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmSaveChanges}
                    className={`px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all inline-flex items-center space-x-1.5 cursor-pointer ${
                      isConfirmedChecked
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-slate-300 text-slate-500'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confirm &amp; Change Names</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
