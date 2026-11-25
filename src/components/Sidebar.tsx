import React from 'react';
import { useFranchise } from '../context/FranchiseContext';
import type { ActiveModule } from '../types';
import { isHeadAdmin } from '../utils/roles';
import {
  LayoutDashboard,
  UserPlus,
  RotateCw,
  QrCode,
  AlertTriangle,
  UserCheck,
  Users,
  BarChart3,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  User
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const {
    activeModule,
    setActiveModule,
    moduleBadges,
    currentAdmin,
    setIsAuthenticated,
  } = useFranchise();

  const navGroups: {
    groupLabel: string;
    items: {
      id: ActiveModule;
      title: string;
      subtitle: string;
      icon: React.ElementType;
      badge?: number;
      badgeColor?: string;
      activeAccent?: string;
    }[];
  }[] = [
    {
      groupLabel: 'Main Workspace',
      items: [
        {
          id: 'overview',
          title: 'Dashboard Overview',
          subtitle: 'All notifications & metrics',
          icon: LayoutDashboard,
          badge: moduleBadges.overview > 0 ? moduleBadges.overview : undefined,
          badgeColor: 'bg-amber-500 text-slate-950',
        },
      ],
    },
    {
      groupLabel: 'Franchise Operations',
      items: [
        {
          id: 'register',
          title: 'Register Franchise',
          subtitle: 'Add new franchise unit',
          icon: UserPlus,
          badge: moduleBadges.register > 0 ? moduleBadges.register : undefined,
          badgeColor: 'bg-emerald-500 text-slate-950',
        },
        {
          id: 'renewal',
          title: 'Process Renewal',
          subtitle: 'Expired driver franchises',
          icon: RotateCw,
          badge: moduleBadges.renewal > 0 ? moduleBadges.renewal : undefined,
          badgeColor: 'bg-blue-500 text-white',
        },
        {
          id: 'qr_scanner',
          title: 'Generate QR Code',
          subtitle: 'Generate & print QR badge',
          icon: QrCode,
          badge: moduleBadges.qr_scanner > 0 ? moduleBadges.qr_scanner : undefined,
          badgeColor: 'bg-emerald-500 text-slate-950',
        },
        {
          id: 'driver_registry',
          title: 'Driver and Operator Management',
          subtitle: 'Assignments & directory',
          icon: UserCheck,
          badge: moduleBadges.driver_registry > 0 ? moduleBadges.driver_registry : undefined,
          badgeColor: 'bg-indigo-500 text-white',
        },
        {
          id: 'violation_entry',
          title: 'Violation and Reports',
          subtitle: 'Citations & citizen complaints',
          icon: AlertTriangle,
          badge: moduleBadges.violation_entry > 0 ? moduleBadges.violation_entry : undefined,
          badgeColor: 'bg-rose-500 text-white',
        },
        {
          id: 'franchise_records',
          title: 'Franchise Records',
          subtitle: 'All units, QR & inline actions',
          icon: Users,
          badge: moduleBadges.franchise_records > 0 ? moduleBadges.franchise_records : undefined,
          badgeColor: 'bg-emerald-500 text-slate-950',
        },
        {
          id: 'reports',
          title: 'Reports and Analysis',
          subtitle: 'Charts & printable PDF',
          icon: BarChart3,
          badge: moduleBadges.reports > 0 ? moduleBadges.reports : undefined,
          badgeColor: 'bg-amber-500 text-slate-950',
        },
      ],
    },
    {
      groupLabel: 'Administration',
      items: [
        ...(isHeadAdmin(currentAdmin)
          ? [
              {
                id: 'system_access' as const,
                title: 'User Managements',
                subtitle: 'Enforcers & admin users',
                icon: ShieldCheck,
                badge: moduleBadges.system_access > 0 ? moduleBadges.system_access : undefined,
                badgeColor: 'bg-emerald-500 text-slate-950',
              },
            ]
          : []),
        {
          id: 'account',
          title: 'Account',
          subtitle: 'Profile & active session',
          icon: User,
        },
      ],
    },
  ];

  const handleSelectModule = (id: ActiveModule) => {
    setActiveModule(id);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 select-none border-r border-slate-800 shadow-xl">
      {/* Top Branding Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="h-10 w-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-black text-xs tracking-wider shadow-md shadow-emerald-600/30 shrink-0">
            TRD
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-black tracking-wider uppercase text-emerald-400">
                  Tabaco TRD
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Admin
                </span>
              </div>
              <h2 className="text-sm font-extrabold text-white truncate">
                Franchise System
              </h2>
            </div>
          )}
        </div>

        {/* Collapse Toggle Button (Desktop Only) */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation Modules List */}
      <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-2.5 space-y-4">
        {navGroups.map((group) => (
          <div key={group.groupLabel} className="space-y-1">
            {!collapsed && (
              <div className="px-2.5 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                {group.groupLabel}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              const activeClass =
                item.activeAccent || 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25';

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectModule(item.id)}
                  title={collapsed ? `${item.title} — ${item.subtitle}` : undefined}
                  className={`w-full flex items-center ${
                    collapsed ? 'justify-center px-2 py-3' : 'justify-between px-3 py-2.5'
                  } rounded-xl text-left transition-all cursor-pointer group relative ${
                    isActive
                      ? activeClass
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                        isActive
                          ? 'bg-white/15 text-white'
                          : 'bg-slate-800 text-slate-400 group-hover:text-white group-hover:bg-slate-700'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    {!collapsed && (
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold leading-tight whitespace-normal break-words">
                          {item.title}
                        </p>
                        <p
                          className={`text-[10px] truncate mt-0.5 ${
                            isActive ? 'text-white/80 font-medium' : 'text-slate-500'
                          }`}
                        >
                          {item.subtitle}
                        </p>
                      </div>
                    )}
                  </div>

                  {!collapsed && item.badge !== undefined && (
                    <span
                      className={`ml-2 text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                        isActive
                          ? 'bg-white text-slate-900'
                          : item.badgeColor || 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {collapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Admin Info Card & Logout */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50 space-y-2">
        {!collapsed ? (
          <div
            onClick={() => handleSelectModule('account')}
            className={`flex items-center justify-between rounded-xl px-3 py-2 transition-colors cursor-pointer group border ${
              activeModule === 'account'
                ? 'bg-emerald-950/40 border-emerald-500/40'
                : 'bg-slate-900 hover:bg-slate-800/80 border-slate-800'
            }`}
            title="Open Account Dashboard"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{currentAdmin.name}</p>
                <p className="text-[10px] font-mono text-emerald-400 truncate">
                  {currentAdmin.adminId}
                </p>
              </div>
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-emerald-400">
              Account
            </span>
          </div>
        ) : (
          <div
            onClick={() => handleSelectModule('account')}
            className={`flex justify-center py-1 cursor-pointer rounded-lg ${
              activeModule === 'account' ? 'bg-emerald-950/40' : ''
            }`}
            title={`Account: ${currentAdmin.name} (${currentAdmin.adminId})`}
          >
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 transition-colors">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsAuthenticated(false)}
          title="Log Out"
          className={`w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-bold bg-rose-600/15 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition-all cursor-pointer`}
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-200 no-print ${
          collapsed ? 'w-20' : 'w-72'
        }`}
      >
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex no-print">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
