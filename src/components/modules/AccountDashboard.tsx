import React, { useState } from 'react';
import { useFranchise } from '../../context/FranchiseContext';
import {
  User,
  ShieldCheck,
  Mail,
  Building2,
  BadgeCheck,
  LogOut,
  Users,
  CheckCircle2,
  Lock,
  ArrowRight
} from 'lucide-react';

export const AccountDashboard: React.FC = () => {
  const {
    currentAdmin,
    registeredAdmins,
    setIsAuthenticated,
    setActiveModule,
    lastSyncedAt,
  } = useFranchise();

  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);

  const formatLastSync = (d: Date | null) => {
    if (!d) return 'Just now';
    return d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-black text-xl tracking-wider shadow-lg shadow-emerald-600/30 shrink-0">
              TRD
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  {currentAdmin.adminId}
                </span>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                  {currentAdmin.role}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Authenticated</span>
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5 tracking-tight">
                {currentAdmin.name}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentAdmin.department || 'Transportation Regulation Division'} • Tabaco City LGU
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-3 shrink-0">
            <button
              type="button"
              onClick={() => setActiveModule('system_access')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors cursor-pointer flex items-center space-x-1.5"
            >
              <Users className="w-4 h-4 text-slate-600" />
              <span>User Managements</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAuthenticated(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Account Details & Contact (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Account Information */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-4 pb-2 border-b border-slate-100">
              Account Credentials &amp; Identity
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <span className="text-slate-400 font-medium text-[11px] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>Full Administrator Name</span>
                </span>
                <p className="font-bold text-slate-900 mt-1 text-sm">{currentAdmin.name}</p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <span className="text-slate-400 font-medium text-[11px] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Official Admin ID</span>
                </span>
                <p className="font-mono font-bold text-slate-900 mt-1 text-sm">{currentAdmin.adminId}</p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <span className="text-slate-400 font-medium text-[11px] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>Email Address</span>
                </span>
                <p className="font-mono font-bold text-slate-900 mt-1 truncate">{currentAdmin.email}</p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <span className="text-slate-400 font-medium text-[11px] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Assigned Department</span>
                </span>
                <p className="font-bold text-slate-900 mt-1 truncate">
                  {currentAdmin.department || 'Transportation Regulation Division'}
                </p>
              </div>
            </div>

            {/* Password Management Notice */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-600 font-medium">
                  Password protected &amp; encrypted on file
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPasswordNotice('To update your password, use the User Managements panel or contact the TRD Head Administrator.');
                  setTimeout(() => setPasswordNotice(null), 5000);
                }}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
              >
                Change Password Info
              </button>
            </div>

            {passwordNotice && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium animate-fadeIn">
                {passwordNotice}
              </div>
            )}
          </div>

          {/* Section 2: Administrative Permissions Matrix */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-4 pb-2 border-b border-slate-100">
              System Permissions &amp; Authorizations
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                    <BadgeCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Franchise Registration &amp; Approvals</p>
                    <p className="text-[11px] text-slate-500">Authorize new applications, renewals, and official QR badges</p>
                  </div>
                </div>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                  Granted
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                    <BadgeCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Violations &amp; Citizen Complaints Resolution</p>
                    <p className="text-[11px] text-slate-500">Manage enforcer traffic citations and investigate passenger complaints</p>
                  </div>
                </div>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                  Granted
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                    <BadgeCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Live Database Synchronization &amp; Audit Trail</p>
                    <p className="text-[11px] text-slate-500">Real-time sync with cloud database &amp; administrator removal log tracking</p>
                  </div>
                </div>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                  Active
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Session & Registered Admins Summary (1 col) */}
        <div className="space-y-6">
          
          {/* Session Overview Card */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm border border-slate-800">
            <div className="flex items-center space-x-2.5 mb-4">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Active Session</h3>
                <p className="text-[11px] text-slate-400">Authenticated Administrator</p>
              </div>
            </div>

            <div className="space-y-3 text-xs pt-2">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Session Status</span>
                <span className="font-bold text-emerald-400">Online &amp; Active</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Live DB Sync</span>
                <span className="font-mono text-slate-200">{formatLastSync(lastSyncedAt)}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Role Authority</span>
                <span className="text-slate-200 font-semibold">{currentAdmin.role}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAuthenticated(false)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of Session</span>
              </button>
            </div>
          </div>

          {/* Registered Team Administrators Preview */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  System Admins ({registeredAdmins.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModule('system_access')}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center space-x-1 cursor-pointer"
              >
                <span>Manage</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {registeredAdmins.slice(0, 4).map((admin) => (
                <div key={admin.adminId} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{admin.name}</p>
                    <p className="text-[10px] font-mono text-slate-400">{admin.adminId} • {admin.role}</p>
                  </div>
                  {admin.adminId === currentAdmin.adminId && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      You
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
