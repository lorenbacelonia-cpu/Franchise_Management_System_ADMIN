import React from 'react';
import { useFranchise } from '../../context/FranchiseContext';
import { X, BarChart3, Download, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
  const { activeModule, setActiveModule, vehicleCategory } = useFranchise();

  if (activeModule !== 'reports') return null;

  const monthlyTrendData = [
    { month: 'Jan', registrations: 12, renewals: 45 },
    { month: 'Feb', registrations: 18, renewals: 38 },
    { month: 'Mar', registrations: 25, renewals: 50 },
    { month: 'Apr', registrations: 14, renewals: 42 },
    { month: 'May', registrations: 30, renewals: 60 },
    { month: 'Jun', registrations: 22, renewals: 55 },
    { month: 'Jul', registrations: 28, renewals: 48 },
    { month: 'Aug', registrations: 35, renewals: 62 },
  ];

  const violationTypesData = [
    { name: 'Fare Overcharging', value: 45, color: '#f43f5e' },
    { name: 'Colorum Operation', value: 25, color: '#f59e0b' },
    { name: 'No Driver License', value: 18, color: '#3b82f6' },
    { name: 'Trip Refusal', value: 12, color: '#10b981' },
  ];

  const handleDownloadPDF = () => {
    alert("Official Municipal Compliance & Analytics Report downloaded successfully as PDF!");
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
              <p className="text-xs text-slate-300">Registration trends, renewal volume & citation distribution for {vehicleCategory}s</p>
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
          
          {/* Top KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                <span>Annual Growth Rate</span>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">+18.4%</p>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">Compared to previous fiscal year</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                <span>Total Active Units</span>
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">1,482</p>
              <p className="text-[11px] text-blue-600 font-medium mt-1">98.2% Active compliance rate</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                <span>Total Citations Issued</span>
                <AlertTriangle className="h-4 w-4 text-rose-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">42</p>
              <p className="text-[11px] text-rose-600 font-medium mt-1">12 Pending settlement</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Monthly Trend Chart */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
                Monthly Registrations & Renewals (2026)
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="registrations" fill="#10b981" name="New Registrations" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="renewals" fill="#3b82f6" name="Renewals" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Violation Breakdown */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
                Violation Breakdown by Category
              </h4>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={violationTypesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
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
                    <span className="h-2.5 w-2.5 rounded-full mr-2" style={{ backgroundColor: v.color }} />
                    <span>{v.name} ({v.value}%)</span>
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
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center space-x-1.5"
          >
            <Download className="h-4 w-4" />
            <span>Download Compliance PDF Report</span>
          </button>
          <button
            onClick={() => setActiveModule('overview')}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
          >
            Close Reports
          </button>
        </div>

      </div>
    </div>
  );
};
