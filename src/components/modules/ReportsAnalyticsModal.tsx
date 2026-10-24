import React, { useMemo } from 'react';
import { useFranchise } from '../../context/FranchiseContext';
import { X, BarChart3, Download, TrendingUp, AlertTriangle, CheckCircle2, ShieldCheck, Printer } from 'lucide-react';
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

export const ReportsAnalyticsModal: React.FC = () => {
  const { activeModule, setActiveModule, vehicleCategory, franchises, violations } = useFranchise();

  if (activeModule !== 'reports') return null;

  // 1. DYNAMIC DATA FILTERING BY VEHICLE CATEGORY
  const filteredFranchises = useMemo(() => {
    return franchises.filter(f => f.vehicleCategory === vehicleCategory);
  }, [franchises, vehicleCategory]);

  const totalUnits = filteredFranchises.length;
  const activeUnits = filteredFranchises.filter(f => f.status === 'Active').length;
  const expiredUnits = filteredFranchises.filter(f => f.status === 'Expired').length;
  const deactivatedUnits = filteredFranchises.filter(f => f.status === 'Deactivated').length;
  const complianceRate = totalUnits > 0 ? ((activeUnits / totalUnits) * 100).toFixed(1) : '100.0';

  // 2. DYNAMIC VIOLATIONS FILTERING
  const isPedicab = vehicleCategory === 'Pedicab';
  const filteredViolations = useMemo(() => {
    return violations.filter(v => {
      const p = (v.cityPlateNumber || v.mtopNumber || v.plateNumber || '').toUpperCase();
      if (isPedicab) {
        return p.startsWith('P') || p.includes('PED');
      } else {
        return p.startsWith('T') || p.includes('TR') || (!p.startsWith('P') && !p.includes('PED'));
      }
    });
  }, [violations, isPedicab]);

  const totalCitations = filteredViolations.length;
  const pendingCitations = filteredViolations.filter(v => v.status === 'Pending' || v.status === 'Under Investigation').length;
  const settledCitations = filteredViolations.filter(v => v.status === 'Settled').length;
  const totalFines = filteredViolations.reduce((acc, curr) => acc + (Number(curr.fineAmount) || 0), 0);

  // 3. DYNAMIC MONTHLY REGISTRATIONS & RENEWALS (Based on actual dates in system)
  const monthlyTrendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();

    return months.map((month, idx) => {
      let registrations = 0;
      let renewals = 0;

      filteredFranchises.forEach(f => {
        if (f.registrationDate) {
          const d = new Date(f.registrationDate);
          if (!isNaN(d.getTime()) && d.getMonth() === idx && (d.getFullYear() === currentYear || d.getFullYear() === 2026)) {
            registrations++;
          }
        }
        if (f.expirationDate && f.status === 'Active') {
          const d = new Date(f.expirationDate);
          if (!isNaN(d.getTime()) && d.getMonth() === idx) {
            renewals++;
          }
        }
      });

      return { month, registrations, renewals };
    });
  }, [filteredFranchises]);

  // 4. DYNAMIC VIOLATION TYPES BREAKDOWN
  const colorPalette = ['#f43f5e', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];
  const violationTypesData = useMemo(() => {
    if (totalCitations === 0) {
      return [
        { name: '100% Full Compliance', value: 100, count: 0, color: '#10b981' }
      ];
    }

    const typeCounts: Record<string, number> = {};
    filteredViolations.forEach(v => {
      const type = (v.violationType || 'General Traffic Citation').trim();
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    return Object.keys(typeCounts).map((name, i) => {
      const count = typeCounts[name];
      const percentage = Math.round((count / totalCitations) * 100);
      return {
        name,
        count,
        value: percentage,
        color: colorPalette[i % colorPalette.length]
      };
    });
  }, [filteredViolations, totalCitations]);

  // 5. OFFICIAL PRINTABLE PDF REPORT GENERATOR
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

    const franchiseRowsHtml = filteredFranchises.length > 0
      ? filteredFranchises.map(f => `
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">${f.cityPlateNumber || f.mtopNumber}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${f.operatorName}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${f.driverName}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">${f.route || 'Tabaco City Line'}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">
              <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold; background: ${f.status === 'Active' ? '#dcfce7; color: #166534;' : '#fee2e2; color: #991b1b;'}">
                ${f.status}
              </span>
            </td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${f.expirationDate || 'N/A'}</td>
          </tr>
        `).join('')
      : `<tr><td colspan="6" style="padding: 16px; text-align: center; color: #64748b; font-style: italic;">No registered units on file for ${vehicleCategory}.</td></tr>`;

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
        <title>Tabaco City TRD - Official ${vehicleCategory} Report</title>
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
          .sign-box strong { font-size: 11px; text-transform: uppercase; }
          .sign-box span { font-size: 10px; color: #64748b; display: block; }
          @media print {
            .no-print { display: none !important; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 16px; display: flex; justify-content: flex-end; gap: 8px;">
          <button onclick="window.print()" style="padding: 8px 16px; background: #047857; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
            🖨️ Print / Save as PDF
          </button>
          <button onclick="window.close()" style="padding: 8px 16px; background: #e2e8f0; color: #0f172a; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
            Close
          </button>
        </div>

        <div class="header">
          <p>Republic of the Philippines • Province of Albay</p>
          <h1>City Government of Tabaco</h1>
          <h2>Transportation Regulation Division (TRD)</h2>
          <p>Official ${vehicleCategory} Operational Compliance & Regulatory Analytics Report</p>
          <p style="margin-top: 6px; font-weight: bold; color: #0f172a;">Date Generated: ${reportDate}</p>
        </div>

        <div class="meta-grid">
          <div class="meta-card">
            <div class="lbl">Total Registered Units</div>
            <div class="num">${totalUnits}</div>
          </div>
          <div class="meta-card">
            <div class="lbl">Active Operating Units</div>
            <div class="num" style="color: #047857;">${activeUnits}</div>
          </div>
          <div class="meta-card">
            <div class="lbl">Compliance Rate</div>
            <div class="num" style="color: #2563eb;">${complianceRate}%</div>
          </div>
          <div class="meta-card">
            <div class="lbl">Recorded Citations</div>
            <div class="num" style="color: #e11d48;">${totalCitations}</div>
          </div>
        </div>

        <div class="section-title">I. Registered ${vehicleCategory} Fleet Records (Live Database)</div>
        <table>
          <thead>
            <tr>
              <th>Plate / Body No.</th>
              <th>Operator Name</th>
              <th>Designated Driver</th>
              <th>Authorized Route</th>
              <th style="text-align: center;">Status</th>
              <th style="text-align: center;">Permit Validity</th>
            </tr>
          </thead>
          <tbody>
            ${franchiseRowsHtml}
          </tbody>
        </table>

        <div class="section-title">II. Roadside Apprehensions & Traffic Citations</div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="gradient-header px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{vehicleCategory} Reports & Analytics Dashboard</h3>
              <p className="text-xs text-slate-300">Live regulatory metrics calculated directly from database records for {vehicleCategory}s</p>
            </div>
          </div>
          <button 
            onClick={() => setActiveModule('overview')}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Top KPI row (100% DYNAMIC FROM DATABASE) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* 1. Compliance Rate */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                <span>Active Compliance Rate</span>
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">{complianceRate}%</p>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">
                {activeUnits} active of {totalUnits} registered {vehicleCategory}s
              </p>
            </div>

            {/* 2. Total Units */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                <span>Total Registered Units</span>
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">{totalUnits}</p>
              <p className="text-[11px] text-blue-600 font-medium mt-1">
                {expiredUnits > 0 ? `${expiredUnits} permits requiring renewal` : 'All registered permits valid'}
              </p>
            </div>

            {/* 3. Citations */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                <span>Total Citations Issued</span>
                <AlertTriangle className="h-4 w-4 text-rose-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">{totalCitations}</p>
              <p className="text-[11px] text-rose-600 font-medium mt-1">
                {pendingCitations} pending settlement • ₱{totalFines.toLocaleString()} fines
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Monthly Trend Chart */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Monthly Registrations & Renewals (2026)
                </h4>
                <span className="text-[10px] text-slate-400 font-medium">Live System Records</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="registrations" fill="#10b981" name="New Registrations" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="renewals" fill="#3b82f6" name="Active Permits" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Violation Breakdown */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Violation Breakdown by Category
                </h4>
                <span className="text-[10px] text-slate-400 font-medium">
                  {totalCitations > 0 ? `${totalCitations} Total Records` : 'Zero Citations'}
                </span>
              </div>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={violationTypesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={totalCitations > 0 ? 4 : 0}
                      dataKey="value"
                    >
                      {violationTypesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
                {violationTypesData.map((v, i) => (
                  <div key={i} className="flex items-center text-xs text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full mr-2 shrink-0" style={{ backgroundColor: v.color }} />
                    <span className="truncate">{v.name} ({totalCitations > 0 ? `${v.count} - ${v.value}%` : '100%'})</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center space-x-1.5 cursor-pointer transition-colors"
          >
            <Printer className="h-4 w-4" />
            <span>Generate &amp; Print Official PDF Report</span>
          </button>
          <button
            onClick={() => setActiveModule('overview')}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
          >
            Close Reports
          </button>
        </div>

      </div>
    </div>
  );
};
