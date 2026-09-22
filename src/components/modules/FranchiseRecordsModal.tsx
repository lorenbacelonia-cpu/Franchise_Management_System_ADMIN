import React, { useState } from 'react';
import { useFranchise } from '../../context/FranchiseContext';
import { ArrowLeft, Users, Search, QrCode, Lock, Sparkles, CheckCircle2, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

export const FranchiseRecordsModal: React.FC = () => {
  const { 
    activeModule, 
    setActiveModule, 
    franchises, 
    vehicleCategory, 
    setSelectedFranchiseId,
    generatePermanentQr,
    generateAllPermanentQr 
  } = useFranchise();
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  if (activeModule !== 'franchise_records') return null;

  const filtered = franchises.filter(f => {
    const matchesCategory = f.vehicleCategory === vehicleCategory;
    const matchesSearch = !search || 
      f.mtopNumber.toLowerCase().includes(search.toLowerCase()) ||
      f.operatorName.toLowerCase().includes(search.toLowerCase()) ||
      f.driverName.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const pendingQrCount = franchises.filter(f => !f.hasPermanentQr).length;
  const allGenerated = pendingQrCount === 0;

  const handleGenerateAllQrCodes = () => {
    generateAllPermanentQr();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#05b875', '#10b981', '#049d63']
    });
    setNotification('Success! Unique Permanent QR Codes have been generated and locked for all registered franchises.');
    setTimeout(() => setNotification(null), 5000);
  };

  const handleGenerateSingleQr = (franchiseId: string, mtopNumber: string) => {
    generatePermanentQr(franchiseId);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#05b875', '#10b981', '#049d63']
    });
    setNotification(`Success! Unique Permanent QR Code generated & locked for unit ${mtopNumber}.`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenQrGenerator = (franchiseId: string) => {
    setSelectedFranchiseId(franchiseId);
    setActiveModule('qr_scanner');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-100 rounded-3xl shadow-2xl max-w-5xl w-full overflow-hidden border border-slate-200 p-6 space-y-4">
        
        {/* Top Back Navigation */}
        <div>
          <button 
            onClick={() => setActiveModule('overview')}
            className="flex items-center space-x-2 text-xs font-bold text-slate-800 hover:text-slate-900 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Header Banner Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{vehicleCategory} Franchise Records</h2>
            <p className="text-xs text-slate-400 font-medium italic">Batch generate permanent QR codes and manage registered units</p>
          </div>
        </div>

        {/* Toast / Notification banner if active */}
        {notification && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold px-4 py-3 rounded-2xl flex items-center space-x-2 shadow-sm animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Content Container */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          
          {/* Section Header & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Registered Franchise Data</h3>
              <p className="text-xs text-slate-400 font-medium italic">
                {allGenerated 
                  ? 'All units have permanent QR codes active' 
                  : `${pendingQrCount} unit(s) awaiting QR generation • Batch generate below`}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Batch Action: Generate All QR Codes */}
              <button
                type="button"
                onClick={handleGenerateAllQrCodes}
                className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer ${
                  allGenerated
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                    : 'bg-[#05b875] hover:bg-[#049d63] text-white shadow-emerald-600/25 active:scale-[0.98]'
                }`}
                title="Generate permanent QR codes for all registered units"
              >
                {allGenerated ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-700" />
                    <span>All QR Codes Generated</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Generate All QR Codes</span>
                  </>
                )}
              </button>

              {/* Search Bar (Rounded Grey Pill) */}
              <div className="relative w-full sm:w-60">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search franchise............"
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-full text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Data Table with Dark Header */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-900 text-white font-bold border-b border-slate-900">
                <tr>
                  <th className="px-5 py-3">City Plate No.</th>
                  <th className="px-5 py-3">Operator Name</th>
                  <th className="px-5 py-3">Driver Name</th>
                  <th className="px-5 py-3">Route/Parada</th>
                  <th className="px-5 py-3">Permit Status</th>
                  <th className="px-5 py-3">QR Status</th>
                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{item.mtopNumber}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">{item.operatorName}</td>
                    <td className="px-5 py-3.5 text-slate-700">{item.driverName}</td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">{item.routeParada || 'Sua-Igot 24 Tabaco'}</td>
                    <td className="px-5 py-3.5">
                      <span className={
                        item.status === 'Active' ? 'badge-active' :
                        item.status === 'Under Review' ? 'badge-pending' : 'badge-expired'
                      }>
                        {item.status === 'Under Review' ? 'Pending' : item.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {item.hasPermanentQr ? (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                          <Lock className="h-3 w-3 text-emerald-600" />
                          <span>Permanent QR Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-bold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
                          <QrCode className="h-3 w-3 text-amber-600" />
                          <span>Ready for QR Generation</span>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {item.hasPermanentQr ? (
                        <button
                          onClick={() => handleOpenQrGenerator(item.id)}
                          className="inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300"
                          title="View permanent QR code"
                        >
                          <QrCode className="h-3.5 w-3.5 text-slate-600" />
                          <span>View QR Code</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleGenerateSingleQr(item.id, item.mtopNumber)}
                          className="inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm bg-[#05b875] hover:bg-[#049d63] text-white shadow-emerald-600/20 active:scale-[0.98]"
                          title="Generate permanent QR code for this unit"
                        >
                          <QrCode className="h-3.5 w-3.5 text-white" />
                          <span>Generate QR Code</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </div>
  );
};
