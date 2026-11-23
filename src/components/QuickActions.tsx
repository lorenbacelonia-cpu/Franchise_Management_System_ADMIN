import React from 'react';
import { useFranchise } from '../context/FranchiseContext';
import type { ActiveModule } from '../types';
import {
  UserPlus,
  RotateCw,
  QrCode,
  AlertTriangle,
  UserCheck,
  Users,
  BarChart3,
  MinusCircle,
  Bell,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

export const QuickActions: React.FC = () => {
  const {
    setActiveModule,
    moduleBadges,
    moduleNotificationsList,
    franchises,
  } = useFranchise();

  // Expired drivers list for the Process Renewal notification detail in Dashboard Overview (unified Tricycle + Pedicab)
  const expiredFranchises = franchises.filter(
    f =>
      f.status === 'Expired' ||
      f.status === 'Pending Renewal' ||
      (f.expirationDate && new Date(f.expirationDate) < new Date(new Date().toISOString().split('T')[0]))
  );

  const actionModules: {
    id: ActiveModule;
    title: string;
    description: string;
    icon: React.ElementType;
    iconColor?: string;
    badgeColor: string;
    isPersistentTask?: boolean;
  }[] = [
      {
        id: 'register',
        title: 'Register Franchise',
        description: 'Add new franchise to system',
        icon: UserPlus,
        iconColor: 'text-slate-700',
        badgeColor: 'bg-emerald-600 text-white',
      },
      {
        id: 'renewal',
        title: 'Process Renewal',
        description: 'Drivers with expired franchise',
        icon: RotateCw,
        iconColor: 'text-blue-600',
        badgeColor: 'bg-blue-600 text-white',
        isPersistentTask: true,
      },
      {
        id: 'qr_scanner',
        title: 'QR Code Scanner',
        description: 'Generate QR Code',
        icon: QrCode,
        iconColor: 'text-slate-700',
        badgeColor: 'bg-emerald-600 text-white',
      },
      {
        id: 'violation_entry',
        title: 'Violations & Reports',
        description: 'Monitor enforcer & passenger reports',
        icon: AlertTriangle,
        iconColor: 'text-amber-500',
        badgeColor: 'bg-rose-600 text-white',
        isPersistentTask: true,
      },
      {
        id: 'driver_registry',
        title: 'Driver and Operator Management',
        description: 'Manage driver & operator assignments',
        icon: UserCheck,
        iconColor: 'text-slate-700',
        badgeColor: 'bg-indigo-600 text-white',
      },
      {
        id: 'franchise_records',
        title: 'Franchise Records',
        description: 'View and update franchise data',
        icon: Users,
        iconColor: 'text-slate-700',
        badgeColor: 'bg-emerald-600 text-white',
      },
      {
        id: 'reports',
        title: 'Reports & Analytics',
        description: 'Generate visual data and reports',
        icon: BarChart3,
        iconColor: 'text-amber-500',
        badgeColor: 'bg-amber-500 text-slate-950',
      },
      {
        id: 'deactivation',
        title: 'Franchise Deactivation',
        description: 'Deactivate and cancel unit records',
        icon: MinusCircle,
        iconColor: 'text-red-500',
        badgeColor: 'bg-rose-600 text-white',
      },
    ];

  return (
    <div className="mb-8 space-y-6">
      {/* All Active Notification Badges Overview Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Active Module Notifications
                </h2>
                {moduleBadges.overview > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-extrabold rounded-full bg-emerald-600 text-white">
                    {moduleBadges.overview} Total
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                All active notification badges across modules are summarized here
              </p>
            </div>
          </div>
        </div>

        {moduleNotificationsList.length === 0 ? (
          <div className="flex items-center gap-2.5 text-xs text-slate-500 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              All module tasks and notifications are clear. New badges will appear when a franchise expires, a violation/report needs action, or new records/QR codes are generated.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {moduleNotificationsList.map((notif) => (
              <div
                key={notif.module}
                onClick={() => setActiveModule(notif.module)}
                className="group flex items-start justify-between gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/70 hover:bg-white transition-all cursor-pointer shadow-2xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">
                      {notif.moduleTitle}
                    </span>
                    <span
                      className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-extrabold ${notif.badgeStyle}`}
                    >
                      {notif.count}
                    </span>
                    {notif.isPersistent ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                        <Clock className="h-3 w-3" />
                        Stays until done
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        <Sparkles className="h-3 w-3" />
                        New change (clears on view)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">{notif.description}</p>

                  {/* Show expired drivers preview for Process Renewal */}
                  {notif.module === 'renewal' && expiredFranchises.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-1.5">
                      {expiredFranchises.slice(0, 4).map((ef) => (
                        <span
                          key={ef.id}
                          className="inline-flex items-center gap-1 text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md"
                        >
                          <span className="font-bold">{ef.cityPlateNumber || ef.mtopNumber}</span>
                          <span>• {ef.driverName}</span>
                        </span>
                      ))}
                      {expiredFranchises.length > 4 && (
                        <span className="text-[10px] font-semibold text-blue-600 px-1.5 py-0.5">
                          +{expiredFranchises.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="shrink-0 self-center text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions Grid with Live Module Badges */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-4">Quick Actions</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actionModules.map((item) => {
            const Icon = item.icon;
            const badgeCount = moduleBadges[item.id] || 0;

            return (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className="relative bg-white rounded-2xl p-5 text-center border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[120px] group"
              >
                {badgeCount > 0 && (
                  <span
                    className={`absolute top-3 right-3 min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-extrabold flex items-center justify-center shadow-xs ${item.badgeColor}`}
                  >
                    {badgeCount}
                  </span>
                )}

                <div className="mb-3 flex items-center justify-center p-2 rounded-xl text-slate-700 group-hover:scale-105 transition-transform">
                  <Icon className={`h-6 w-6 ${item.iconColor || 'text-slate-700'}`} />
                </div>
                <h3 className="text-xs font-bold text-slate-900">
                  {item.title}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium mt-1 italic">
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
