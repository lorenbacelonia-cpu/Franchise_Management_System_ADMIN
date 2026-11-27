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
  ArrowRight,
  History,
  Calendar,
  Clock,
  Filter
} from 'lucide-react';
import { isHeadAdmin } from '../../utils/roles';
import { DateBadge } from '../DateBadge';

export const AccountDashboard: React.FC = () => {
  const {
    currentAdmin,
    registeredAdmins,
    setIsAuthenticated,
    setActiveModule,
    lastSyncedAt,
    activityLogs,
    clearActivityLogs,
  } = useFranchise();

  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);
  const [activityFilter, setActivityFilter] = useState<string>('all');

  const formatLastSync = (d: Date | null) => {
    if (!d) return 'Just now';
    return d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const formatActivityDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const day = d.toLocaleDateString('en-PH', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      const time = d.toLocaleTimeString('en-PH', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      return { day, time };
    } catch {
      return { day: 'Today', time: 'Just now' };
    }
  };

  const filteredLogs = activityLogs.filter(log => {
    if (activityFilter === 'all') return true;
    if (activityFilter === 'my_logs') return log.adminId === currentAdmin.adminId;
    return log.category?.toLowerCase() === activityFilter.toLowerCase();
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Sticky Top Bar & Live Date (Fixed Position) */}
      <div className="sticky top-[72px] z-20 bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-slate-200 shadow-md flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
            <User className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 leading-tight">Account &amp; Session Settings</h4>
            <p className="text-[10px] text-slate-500">Administrator profile &amp; security logs</p>
          </div>
        </div>
        <DateBadge className="py-1 text-[11px]" />
      </div>

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
            {isHeadAdmin(currentAdmin) && (
              <button
                type="button"
                onClick={() => setActiveModule('system_access')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                <Users className="w-4 h-4 text-slate-600" />
                <span>User Managements</span>
              </button>
            )}

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

          {/* Section 3: Persistent Admin Activity Log (Never disappears on logout) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Account Activity &amp; Audit Log</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                      {filteredLogs.length} events
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Permanent record of actions performed — preserved across sessions and device logouts
                  </p>
                </div>
              </div>

              {/* Filter Selector */}
              <div className="flex items-center space-x-2 shrink-0">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Events</option>
                  <option value="my_logs">My Actions Only</option>
                  <option value="auth">Auth &amp; Sessions</option>
                  <option value="franchise">Franchise Actions</option>
                  <option value="violation">Violations</option>
                  <option value="complaint">Complaints</option>
                  <option value="user">User Accounts</option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Clear local activity log history on this browser? (Cloud records remain saved in Supabase)')) {
                      clearActivityLogs();
                    }
                  }}
                  className="text-[10px] text-slate-400 hover:text-rose-600 font-bold px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Clear local view"
                >
                  Clear View
                </button>
              </div>
            </div>

            {/* Activity List with Exact Day & Time */}
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No activity recorded for this filter</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Actions taken across modules will automatically appear here with exact day and time</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1 space-y-0.5">
                {filteredLogs.map((log) => {
                  const { day, time } = formatActivityDateTime(log.createdAt);
                  const isMine = log.adminId === currentAdmin.adminId;

                  return (
                    <div
                      key={log.id}
                      className="py-3 px-3 rounded-2xl hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${log.category === 'Auth'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : log.category === 'Franchise'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : log.category === 'Violation'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : log.category === 'Complaint'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                            {log.category || 'System'}
                          </span>

                          <span className="font-bold text-slate-900">
                            {log.action}
                          </span>

                          <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                            {log.adminName} ({log.adminId})
                          </span>

                          {isMine && (
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              You
                            </span>
                          )}
                        </div>

                        {log.details && (
                          <p className="text-[11px] text-slate-600 pl-0.5">
                            {log.details}
                          </p>
                        )}
                      </div>

                      {/* Day and Time Stamps */}
                      <div className="shrink-0 flex sm:flex-col items-start sm:items-end justify-between text-right border-t sm:border-t-0 pt-1.5 sm:pt-0 border-slate-100">
                        <div className="flex items-center space-x-1 text-slate-700 font-semibold text-[11px]">
                          <Calendar className="w-3 h-3 text-emerald-600" />
                          <span>{day}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-slate-400 font-mono text-[10px] mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{time}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
