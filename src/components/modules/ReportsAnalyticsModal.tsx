import React, { useMemo, useState } from 'react';
import { useFranchise } from '../../context/FranchiseContext';
import {
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Printer,
  Calendar,
  Search,
  X,
  FileSpreadsheet
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface ReportsAnalyticsModalProps {
  embedded?: boolean;
  showRecordsTable?: boolean;
}

export const ReportsAnalyticsModal: React.FC<ReportsAnalyticsModalProps> = ({
  embedded = false,
  showRecordsTable = !embedded,
}) => {
  const { activeModule, franchises, violations } = useFranchise();

  // State for Monthly Registration Records Table filter
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [vehicleFilter, setVehicleFilter] = useState<'all' | 'Tricycle' | 'Pedicab'>('all');

  // State for Active Franchises Table filter
  const [activeSearchTerm, setActiveSearchTerm] = useState<string>('');
  const [activeVehicleFilter, setActiveVehicleFilter] = useState<'all' | 'Tricycle' | 'Pedicab'>('all');

  if (!embedded && activeModule !== 'reports') return null;

  // 1. UNIFIED DATA (Tricycle & Pedicab)
  const filteredFranchises = franchises;

  const totalUnits = filteredFranchises.length;
  const activeUnits = filteredFranchises.filter(f => f.status === 'Active').length;
  const complianceRate = totalUnits > 0 ? ((activeUnits / totalUnits) * 100).toFixed(1) : '100.0';

  // Tricycle and Pedicab counts
  const tricycleCount = filteredFranchises.filter(f => f.vehicleCategory === 'Tricycle').length;
  const pedicabCount = filteredFranchises.filter(f => f.vehicleCategory === 'Pedicab').length;
  const activeTricycleCount = filteredFranchises.filter(f => f.vehicleCategory === 'Tricycle' && f.status === 'Active').length;
  const activePedicabCount = filteredFranchises.filter(f => f.vehicleCategory === 'Pedicab' && f.status === 'Active').length;

  // 2. UNIFIED VIOLATIONS (strictly deduplicated by ID)
  const filteredViolations = useMemo(() => {
    const seen = new Set<string>();
    return (violations || []).filter(v => {
      if (!v || !v.id || seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    });
  }, [violations]);
  const totalCitations = filteredViolations.length;
  const pendingCitations = filteredViolations.filter(v => v.status === 'Pending').length;
  const totalFines = filteredViolations.reduce((acc, curr) => acc + (Number(curr.fineAmount) || 0), 0);

  // Helper to extract month index (0-11) from date string
  const getRecordMonth = (dateStr?: string): number | null => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.getMonth();
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthShortNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Count of registrations per month
  const monthlyCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (let i = 0; i < 12; i++) counts[i] = 0;

    filteredFranchises.forEach(f => {
      const m = getRecordMonth(f.registrationDate || f.paymentDate);
      if (m !== null && m >= 0 && m < 12) {
        counts[m] = (counts[m] || 0) + 1;
      }
    });
    return counts;
  }, [filteredFranchises]);

  // 3. COLORFUL BAR CHART DATA: TRICYCLE & PEDICAB COMPARISON BY MONTH
  const monthlyFleetTrendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return months.map((month, idx) => {
      let tricycles = 0;
      let pedicabs = 0;

      filteredFranchises.forEach(f => {
        const dateStr = f.registrationDate || f.paymentDate;
        if (dateStr) {
          const d = new Date(dateStr);
          if (!isNaN(d.getTime()) && d.getMonth() === idx) {
            if (f.vehicleCategory === 'Pedicab') {
              pedicabs++;
            } else {
              tricycles++;
            }
          }
        }
      });

      return {
        month,
        Tricycle: tricycles,
        Pedicab: pedicabs,
        Total: tricycles + pedicabs
      };
    });
  }, [filteredFranchises]);

  // 4. COLORFUL PIE CHART DATA: TRICYCLE & PEDICAB FLEET BREAKDOWN
  const fleetPieData = useMemo(() => {
    const total = tricycleCount + pedicabCount;
    if (total === 0) {
      return [
        { name: 'Tricycle', value: 1, count: 0, color: '#10b981', percentage: 50 },
        { name: 'Pedicab', value: 1, count: 0, color: '#0284c7', percentage: 50 }
      ];
    }
    const triPercent = Math.round((tricycleCount / total) * 100);
    const pedPercent = 100 - triPercent;

    return [
      {
        name: 'Tricycle',
        value: tricycleCount,
        count: tricycleCount,
        color: '#10b981', // Emerald 500
        percentage: triPercent
      },
      {
        name: 'Pedicab',
        value: pedicabCount,
        count: pedicabCount,
        color: '#0284c7', // Sky Blue 600
        percentage: pedPercent
      }
    ];
  }, [tricycleCount, pedicabCount]);

  // 5. ALL ACTIVE TRICYCLE AND PEDICAB FRANCHISES
  const allActiveFranchises = useMemo(() => {
    return filteredFranchises.filter(f => f.status === 'Active');
  }, [filteredFranchises]);

  const filteredActiveFranchises = useMemo(() => {
    return allActiveFranchises.filter(f => {
      // Category filter
      if (activeVehicleFilter !== 'all' && f.vehicleCategory !== activeVehicleFilter) {
        return false;
      }
      // Search term
      if (activeSearchTerm.trim()) {
        const q = activeSearchTerm.toLowerCase();
        return (
          (f.cityPlateNumber || '').toLowerCase().includes(q) ||
          (f.mtopNumber || '').toLowerCase().includes(q) ||
          (f.applicationNo || '').toLowerCase().includes(q) ||
          (f.operatorName || f.ownerName || '').toLowerCase().includes(q) ||
          (f.driverName || '').toLowerCase().includes(q) ||
          (f.routeParada || '').toLowerCase().includes(q)
        );
      }
      return true;
    }).sort((a, b) => {
      const plateA = a.cityPlateNumber || a.mtopNumber || '';
      const plateB = b.cityPlateNumber || b.mtopNumber || '';
      return plateA.localeCompare(plateB);
    });
  }, [allActiveFranchises, activeVehicleFilter, activeSearchTerm]);

  // Filtered records for the monthly registration table
  const monthlyRecords = useMemo(() => {
    return filteredFranchises.filter(f => {
      // Month filter
      if (selectedMonth !== 'all') {
        const m = getRecordMonth(f.registrationDate || f.paymentDate);
        if (m !== selectedMonth) return false;
      }
      // Vehicle type filter
      if (vehicleFilter !== 'all' && f.vehicleCategory !== vehicleFilter) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchPlate = (f.cityPlateNumber || f.mtopNumber || '').toLowerCase().includes(q);
        const matchApp = (f.applicationNo || '').toLowerCase().includes(q);
        const matchOp = (f.operatorName || f.ownerName || '').toLowerCase().includes(q);
        const matchDrv = (f.driverName || '').toLowerCase().includes(q);
        const matchRoute = (f.routeParada || '').toLowerCase().includes(q);
        const matchCat = (f.vehicleCategory || '').toLowerCase().includes(q);
        const matchStatus = (f.status || '').toLowerCase().includes(q);
        if (!matchPlate && !matchApp && !matchOp && !matchDrv && !matchRoute && !matchCat && !matchStatus) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      const dateA = a.registrationDate || a.paymentDate || '';
      const dateB = b.registrationDate || b.paymentDate || '';
      return dateB.localeCompare(dateA);
    });
  }, [filteredFranchises, selectedMonth, vehicleFilter, searchTerm]);

  // Breakdown counts for currently filtered list
  const monthlyTricyclesCount = monthlyRecords.filter(f => f.vehicleCategory === 'Tricycle').length;
  const monthlyPedicabsCount = monthlyRecords.filter(f => f.vehicleCategory === 'Pedicab').length;

  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Custom Bar Chart Tooltip
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700 min-w-[170px]">
          <p className="font-bold text-slate-300 border-b border-slate-800 pb-1 mb-2">
            Month: {label}
          </p>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => (
              <div key={`item-${index}`} className="flex items-center justify-between space-x-3">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-slate-300">{entry.name}:</span>
                </span>
                <span className="font-bold text-white font-mono">{entry.value} units</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Pie Chart Tooltip
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-xs border border-slate-700">
          <p className="font-bold text-white flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload.color }} />
            <span>{data.name} Units</span>
          </p>
          <p className="text-[11px] text-slate-300 mt-1">
            Count: <strong className="text-white font-mono">{data.payload.count}</strong> ({data.payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // 6. OFFICIAL PRINTABLE PDF REPORT GENERATOR
  const handleDownloadPDF = () => {
    const reportDate = new Date().toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate the official compliance report.');
      return;
    }

    const activeRowsHtml = allActiveFranchises.length > 0
      ? allActiveFranchises.map(f => `
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">
              ${f.cityPlateNumber || f.mtopNumber}
              <span style="font-size: 10px; color: ${f.vehicleCategory === 'Pedicab' ? '#0284c7' : '#059669'}; font-weight: bold; display: block;">${f.vehicleCategory}</span>
            </td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-mono;">${f.applicationNo || '—'}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${f.operatorName || f.ownerName || '—'}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${f.driverName || '—'}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${f.routeParada || 'Tabaco City Line'}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">
              <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold; background: #dcfce7; color: #166534;">
                Active
              </span>
            </td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${f.expirationDate || 'N/A'}</td>
          </tr>
        `).join('')
      : `<tr><td colspan="7" style="padding: 16px; text-align: center; color: #64748b; font-style: italic;">No active registered units on file.</td></tr>`;

    const violationsRowsHtml = filteredViolations.length > 0
      ? filteredViolations.map(v => `
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">${v.cityPlateNumber || v.mtopNumber || '—'}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${v.driverName || '—'}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${v.violationType || 'Traffic Citation'}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right;">₱${Number(v.fineAmount || 0).toFixed(2)}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${v.status || 'Pending'}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${v.dateSubmitted || '—'}</td>
          </tr>
        `).join('')
      : `<tr><td colspan="6" style="padding: 16px; text-align: center; color: #166534; font-weight: bold; background: #f0fdf4;">Zero traffic violations recorded on file (100% Compliance).</td></tr>`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tabaco City TRD - Official Franchise Compliance & Active Fleet Report</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 12px; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
          .header h1 { font-size: 16px; margin: 0; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; }
          .header h2 { font-size: 13px; margin: 4px 0; color: #047857; font-weight: 800; }
          .header p { font-size: 10px; margin: 2px 0; color: #64748b; }
          .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
          .meta-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center; }
          .meta-card .num { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 4px; }
          .meta-card .lbl { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
          th { background: #0f172a; color: white; padding: 8px; text-align: left; font-size: 10px; text-transform: uppercase; }
          .section-title { font-size: 13px; font-weight: 800; color: #0f172a; border-left: 4px solid #047857; padding-left: 8px; margin: 16px 0 8px 0; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 50px; }
          .sign-box { text-align: center; border-top: 1px solid #0f172a; padding-top: 8px; }
          .sign-box strong { display: block; font-size: 11px; }
          .sign-box span { font-size: 10px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Republic of the Philippines</h1>
          <h2>City Government of Tabaco • Transportation Regulation Division</h2>
          <p>Official Active Fleet &amp; Franchise Compliance Master Report</p>
          <p>Generated on: ${reportDate}</p>
        </div>

        <div class="meta-grid">
          <div class="meta-card">
            <div class="lbl">Total Active Units</div>
            <div class="num" style="color: #047857;">${activeUnits}</div>
          </div>
          <div class="meta-card">
            <div class="lbl">Active Tricycles</div>
            <div class="num" style="color: #10b981;">${activeTricycleCount}</div>
          </div>
          <div class="meta-card">
            <div class="lbl">Active Pedicabs</div>
            <div class="num" style="color: #0284c7;">${activePedicabCount}</div>
          </div>
          <div class="meta-card">
            <div class="lbl">Compliance Rate</div>
            <div class="num" style="color: #0f172a;">${complianceRate}%</div>
          </div>
        </div>

        <div class="section-title">I. Official Active Tricycle &amp; Pedicab Units Directory</div>
        <table>
          <thead>
            <tr>
              <th>Plate / Body No.</th>
              <th style="text-align: center;">Application No.</th>
              <th>Operator</th>
              <th>Authorized Driver</th>
              <th>Authorized Route</th>
              <th style="text-align: center;">Status</th>
              <th style="text-align: center;">Permit Validity</th>
            </tr>
          </thead>
          <tbody>
            ${activeRowsHtml}
          </tbody>
        </table>

        <div class="section-title">II. Traffic Citations &amp; Enforcer Apprehensions</div>
        <table>
          <thead>
            <tr>
              <th>Plate No.</th>
              <th>Apprehended Driver</th>
              <th>Violation Type</th>
              <th style="text-align: right;">Fine Amount</th>
              <th style="text-align: center;">Status</th>
              <th style="text-align: center;">Citation Date</th>
            </tr>
          </thead>
          <tbody>
            ${violationsRowsHtml}
          </tbody>
        </table>

        <div class="signatures">
          <div class="sign-box">
            <strong>TRD Chief Records Officer</strong>
            <span>Transportation Regulation Division</span>
          </div>
          <div class="sign-box">
            <strong>Hon. City Mayor</strong>
            <span>City Government of Tabaco</span>
          </div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Main Content Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
        {/* Top KPI row (100% DYNAMIC FROM DATABASE) */}
        <div className="sm:sticky sm:top-[72px] z-20 bg-white/95 backdrop-blur-md -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 -my-2 border-y border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 shadow-xs">
          {/* 1. Active Compliance Rate */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>Compliance Rate</span>
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{complianceRate}%</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">
              {activeUnits} active of {totalUnits} total units
            </p>
          </div>

          {/* 2. Total Active Units */}
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200">
            <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold mb-1">
              <span>Total Active Units</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-800">{activeUnits}</p>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">
              {activeTricycleCount} Tricycle • {activePedicabCount} Pedicab
            </p>
          </div>

          {/* 3. Total Registered Units */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>Total Fleet Registry</span>
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{totalUnits}</p>
            <p className="text-[11px] text-blue-600 font-medium mt-1">
              {tricycleCount} Tricycles • {pedicabCount} Pedicabs
            </p>
          </div>

          {/* 4. Citations */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>Total Citations</span>
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{totalCitations}</p>
            <p className="text-[11px] text-rose-600 font-medium mt-1">
              {pendingCitations} pending • ₱{totalFines.toLocaleString()} fines
            </p>
          </div>
        </div>

        {/* ── CHARTS ROW: COLORFUL BAR CHART & PIE CHART FOR TRICYCLE & PEDICAB ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart: Tricycle vs Pedicab Breakdown across Months */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Monthly Registrations: Tricycle vs. Pedicab
                </h4>
                <p className="text-[11px] text-slate-500">
                  Comparison of registered units across all calendar months
                </p>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                2026 Records
              </span>
            </div>

            {/* Custom Legend with Colors */}
            <div className="flex items-center space-x-4 mb-3 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block shadow-2xs" />
                <span className="font-bold text-slate-800">Tricycle Units</span>
                <span className="text-[11px] text-slate-400 font-mono">({tricycleCount})</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-md bg-sky-600 inline-block shadow-2xs" />
                <span className="font-bold text-slate-800">Pedicab Units</span>
                <span className="text-[11px] text-slate-400 font-mono">({pedicabCount})</span>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyFleetTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="Tricycle" fill="#10b981" name="Tricycle Units" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Pedicab" fill="#0284c7" name="Pedicab Units" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart: Tricycle vs Pedicab Fleet Distribution */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Fleet Distribution: Tricycle &amp; Pedicab
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Total share and proportion of registered vehicles
                  </p>
                </div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  {totalUnits} Total Units
                </span>
              </div>

              <div className="h-56 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={fleetPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {fleetPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Colored Category Badges under Pie Chart */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
              {fleetPieData.map((item, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl border flex items-center justify-between"
                  style={{
                    backgroundColor: item.name === 'Tricycle' ? '#f0fdf4' : '#f0f9ff',
                    borderColor: item.name === 'Tricycle' ? '#bbf7d0' : '#bae6fd'
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: item.color }} />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{item.count} units</p>
                    </div>
                  </div>
                  <span
                    className="text-xs font-black font-mono px-2 py-0.5 rounded-md"
                    style={{
                      color: item.color,
                      backgroundColor: item.name === 'Tricycle' ? '#dcfce7' : '#e0f2fe'
                    }}
                  >
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── NEW ACTIVE TABLE: ALL LIST OF TRICYCLE AND PEDICAB ACTIVE ──────── */}
        <div className="pt-5 border-t border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Active Franchises Registry (Tricycle &amp; Pedicab)</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300">
                    {filteredActiveFranchises.length} Active
                  </span>
                </h4>
                <p className="text-xs text-slate-500">
                  Complete official list of all active, compliant and operating Tricycle and Pedicab franchises
                </p>
              </div>
            </div>

            {/* Active KPI Count Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                Tricycles: {activeTricycleCount}
              </span>
              <span className="text-xs font-bold text-sky-900 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-xl">
                Pedicabs: {activePedicabCount}
              </span>
            </div>
          </div>

          {/* Active Table Search & Category Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            {/* Search Input with Search Button */}
            <div className="flex items-center w-full sm:max-w-md">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={activeSearchTerm}
                  onChange={(e) => setActiveSearchTerm(e.target.value)}
                  placeholder="Search active plate, operator, driver, MTOP..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-l-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                />
              </div>
              <button
                type="button"
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-r-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0 border border-emerald-600"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Search</span>
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveVehicleFilter('all')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${activeVehicleFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  All Active ({allActiveFranchises.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveVehicleFilter('Tricycle')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${activeVehicleFilter === 'Tricycle'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Tricycle ({activeTricycleCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveVehicleFilter('Pedicab')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${activeVehicleFilter === 'Pedicab'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Pedicab ({activePedicabCount})
                </button>
              </div>

              {(activeSearchTerm || activeVehicleFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveSearchTerm('');
                    setActiveVehicleFilter('all');
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Active Units Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden overflow-x-auto shadow-2xs">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-900 text-white font-bold whitespace-nowrap">
                <tr>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">City Plate / MTOP</th>
                  <th className="px-4 py-3">Application No.</th>
                  <th className="px-4 py-3">Operator</th>
                  <th className="px-4 py-3">Authorized Driver</th>
                  <th className="px-4 py-3">Route / Parada</th>
                  <th className="px-4 py-3 text-center">Registration Date</th>
                  <th className="px-4 py-3 text-center">Permit Expiry</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredActiveFranchises.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <CheckCircle2 className="h-8 w-8 text-slate-300" />
                        <p className="text-sm font-semibold text-slate-600">
                          No active franchises found matching the query.
                        </p>
                        <p className="text-xs text-slate-400 max-w-sm">
                          Try searching for another plate number, operator, or switch filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredActiveFranchises.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Vehicle Category */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${item.vehicleCategory === 'Pedicab'
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                        >
                          {item.vehicleCategory}
                        </span>
                      </td>

                      {/* Plate / MTOP */}
                      <td className="px-4 py-3.5 font-bold text-slate-900 whitespace-nowrap font-mono text-xs">
                        {item.cityPlateNumber || item.mtopNumber}
                      </td>

                      {/* Application No. */}
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {item.applicationNo || '—'}
                      </td>

                      {/* Operator / Owner */}
                      <td className="px-4 py-3.5 font-semibold text-slate-800">
                        {item.ownerName || item.operatorName || '—'}
                      </td>

                      {/* Authorized Driver */}
                      <td className="px-4 py-3.5 text-slate-700 font-medium">
                        {item.driverName || '—'}
                      </td>

                      {/* Route / Parada */}
                      <td className="px-4 py-3.5 text-slate-600">
                        {item.routeParada || 'Tabaco City Line'}
                      </td>

                      {/* Registration Date */}
                      <td className="px-4 py-3.5 text-center font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {formatDisplayDate(item.registrationDate || item.paymentDate)}
                      </td>

                      {/* Expiry Date */}
                      <td className="px-4 py-3.5 text-center font-mono text-[11px] font-semibold text-slate-700 whitespace-nowrap">
                        {item.expirationDate || 'N/A'}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span>Active</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── MONTHLY REGISTRATION RECORDS TABLE ────────────────────────── */}
        {showRecordsTable && (
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-2xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900">
                    Monthly Registration Records Table
                  </h4>
                  <p className="text-xs text-slate-500">
                    Detailed list of all registered units organized based on the month they registered
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl shrink-0">
                  {monthlyRecords.length} {monthlyRecords.length === 1 ? 'Unit' : 'Units'} Found
                </span>
              </div>
            </div>

            {/* Month Selector Tabs */}
            <div className="bg-slate-50 p-2 sm:p-2.5 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedMonth('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shrink-0 ${selectedMonth === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
              >
                <span>All Months</span>
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${selectedMonth === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                >
                  {filteredFranchises.length}
                </span>
              </button>

              {monthShortNames.map((shortName, idx) => {
                const count = monthlyCounts[idx] || 0;
                const isSelected = selectedMonth === idx;
                return (
                  <button
                    key={shortName}
                    type="button"
                    onClick={() => setSelectedMonth(idx)}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shrink-0 ${isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : count > 0
                        ? 'bg-white hover:bg-emerald-50 text-slate-800 border border-emerald-200 hover:border-emerald-300'
                        : 'bg-white hover:bg-slate-100 text-slate-400 border border-slate-200/80'
                      }`}
                    title={`${monthNames[idx]}: ${count} registered unit(s)`}
                  >
                    <span>{shortName}</span>
                    {count > 0 && (
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                          }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search & Category Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by plate, driver, operator, route, or app no..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setVehicleFilter('all')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${vehicleFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    All Types
                  </button>
                  <button
                    type="button"
                    onClick={() => setVehicleFilter('Tricycle')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${vehicleFilter === 'Tricycle'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    Tricycle
                  </button>
                  <button
                    type="button"
                    onClick={() => setVehicleFilter('Pedicab')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${vehicleFilter === 'Pedicab'
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    Pedicab
                  </button>
                </div>

                {(selectedMonth !== 'all' || searchTerm || vehicleFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMonth('all');
                      setSearchTerm('');
                      setVehicleFilter('all');
                    }}
                    className="px-2.5 py-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            {/* Summary Strip */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs flex-wrap gap-2">
              <div className="flex items-center space-x-2 text-emerald-950 font-medium">
                <span className="font-bold text-emerald-800">
                  {selectedMonth === 'all' ? 'All Registration Months' : `Month of ${monthNames[selectedMonth]}`}:
                </span>
                <span>
                  {monthlyRecords.length} registered {monthlyRecords.length === 1 ? 'unit' : 'units'}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-emerald-800 font-semibold">
                  {monthlyTricyclesCount} Tricycles, {monthlyPedicabsCount} Pedicabs
                </span>
              </div>
              {searchTerm && (
                <span className="text-[11px] font-semibold text-slate-500">
                  Matching query: &ldquo;{searchTerm}&rdquo;
                </span>
              )}
            </div>

            {/* Records Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden overflow-x-auto shadow-2xs">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-900 text-white font-bold border-b border-slate-900 whitespace-nowrap">
                  <tr>
                    <th className="px-4 py-3">Registration Month &amp; Date</th>
                    <th className="px-4 py-3">City Plate No.</th>
                    <th className="px-4 py-3">Application No.</th>
                    <th className="px-4 py-3">Operator</th>
                    <th className="px-4 py-3">Authorized Driver</th>
                    <th className="px-4 py-3">Route / Parada</th>
                    <th className="px-4 py-3 text-center">Permit Status</th>
                    <th className="px-4 py-3 text-center">Permit Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {monthlyRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Calendar className="h-8 w-8 text-slate-300" />
                          <p className="text-sm font-semibold text-slate-600">
                            {selectedMonth !== 'all'
                              ? `No records found registered in ${monthNames[selectedMonth]}.`
                              : 'No matching registered records found.'}
                          </p>
                          <p className="text-xs text-slate-400 max-w-sm">
                            {searchTerm || vehicleFilter !== 'all'
                              ? 'Try clearing your search query or vehicle type filter.'
                              : 'Select a different month or register new units to see them listed here.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    monthlyRecords.map((item) => {
                      const regMonthIdx = getRecordMonth(item.registrationDate || item.paymentDate);
                      const regMonthLabel =
                        regMonthIdx !== null && regMonthIdx >= 0 && regMonthIdx < 12
                          ? monthNames[regMonthIdx]
                          : 'Registered';

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Registration Month & Date */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-extrabold text-[10px] uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-200">
                                {regMonthLabel}
                              </span>
                              <span className="font-semibold text-slate-800 text-[11px]">
                                {formatDisplayDate(item.registrationDate || item.paymentDate)}
                              </span>
                            </div>
                          </td>

                          {/* City Plate No. */}
                          <td className="px-4 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-mono">{item.cityPlateNumber || item.mtopNumber}</span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${item.vehicleCategory === 'Pedicab'
                                  ? 'bg-sky-50 text-sky-800 border-sky-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  }`}
                              >
                                {item.vehicleCategory}
                              </span>
                            </div>
                          </td>

                          {/* Application No. */}
                          <td className="px-4 py-3.5 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                            {item.applicationNo || '—'}
                          </td>

                          {/* Owner / Operator */}
                          <td className="px-4 py-3.5 font-semibold text-slate-800">
                            {item.ownerName || item.operatorName || '—'}
                          </td>

                          {/* Authorized Driver */}
                          <td className="px-4 py-3.5 text-slate-700 font-medium">
                            {item.driverName || '—'}
                          </td>

                          {/* Route / Parada */}
                          <td className="px-4 py-3.5 text-slate-600">
                            {item.routeParada || 'Tabaco City Line'}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${item.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : item.status === 'Expired'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}
                            >
                              {item.status || 'Active'}
                            </span>
                          </td>

                          {/* Expiration Date */}
                          <td className="px-4 py-3.5 text-center font-mono text-[11px] font-semibold text-slate-700 whitespace-nowrap">
                            {item.expirationDate || 'N/A'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bottom Section: Generate and Print Official Report Bar */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                Official Compliance &amp; Active Fleet Printout
              </p>
              <p className="text-[11px] text-slate-500">
                Formatted for legal document archiving, Mayor&apos;s office submission &amp; regulatory review
              </p>
            </div>
          </div>
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs flex items-center justify-center space-x-2 cursor-pointer transition-colors shrink-0"
          >
            <Printer className="h-4 w-4 text-emerald-400" />
            <span>Generate &amp; Print Official PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
