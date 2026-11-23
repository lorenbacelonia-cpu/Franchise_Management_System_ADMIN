import React from 'react';
import { useFranchise } from '../context/FranchiseContext';
import { ShieldCheck, Menu, RefreshCw, Search, X } from 'lucide-react';
import type { ActiveModule } from '../types';
import { NotificationBell } from './NotificationBell';

interface NavbarProps {
  onOpenMobileSidebar?: () => void;
}

const MODULE_TITLES: Record<ActiveModule, { title: string; subtitle: string }> = {
  overview: {
    title: 'Dashboard Overview',
    subtitle: 'Real-time operational metrics, quick actions, and pending reviews',
  },
  register: {
    title: 'Register Franchise',
    subtitle: 'Enroll new franchise units and generate permanent QR badges on one page',
  },
  franchise_records: {
    title: 'Franchise Records',
    subtitle: 'Complete unit registry with inline QR preview, document download, and renewal',
  },
  renewal: {
    title: 'Process Renewal',
    subtitle: 'Update permit expiration dates and official receipts inline',
  },
  qr_scanner: {
    title: 'Generate QR Code',
    subtitle: 'Generate, preview, download Word (.docx) or print 1-page QR badges',
  },
  driver_registry: {
    title: 'Driver and Operator Management',
    subtitle: 'Manage and review operator and authorized driver assignments inline',
  },
  violation_entry: {
    title: 'Violation and Reports',
    subtitle: 'Enforcer traffic citations, citizen complaints, and audit trail',
  },
  reports: {
    title: 'Reports and Analysis',
    subtitle: 'Live regulatory compliance metrics and official printable PDF reports',
  },
  deactivation: {
    title: 'Franchise Deactivation',
    subtitle: 'Administrative permit revocation and unit cancellation',
  },
  system_access: {
    title: 'User Managements',
    subtitle: 'Add traffic enforcers & administrator accounts with access control',
  },
  account: {
    title: 'Account Settings',
    subtitle: 'Manage administrator profile, credentials, and active session',
  },
};

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileSidebar }) => {
  const {
    setIsAuthenticated,
    currentAdmin,
    activeModule,
    isSyncing,
    syncFromDatabase,
    searchQuery,
    setSearchQuery,
  } = useFranchise();

  const currentMeta = MODULE_TITLES[activeModule] || MODULE_TITLES.overview;

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 lg:px-8 py-3.5 no-print">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left: Mobile Menu Button + Module Title */}
        <div className="flex items-center space-x-3 min-w-0">
          {onOpenMobileSidebar && (
            <button
              type="button"
              onClick={onOpenMobileSidebar}
              className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0"
              title="Open sidebar menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <div className="min-w-0 shrink-0 sm:shrink">
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight whitespace-normal">
                {currentMeta.title}
              </h1>
              <span className="hidden sm:inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Tricycle &amp; Pedicab Registry
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block truncate">
              {currentMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-md mx-2 min-w-[200px] order-last sm:order-none w-full sm:w-auto">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plate, MTOP, driver, operator..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-100 hover:bg-slate-200/80 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-full outline-none transition-all placeholder:text-slate-400 shadow-2xs font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 ml-auto">
          {/* Notification Bell */}
          <NotificationBell />

          {/* Cloud Sync Button */}
          <button
            type="button"
            onClick={() => syncFromDatabase()}
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
            title="Sync with live database"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden xl:inline">{isSyncing ? 'Syncing...' : 'Live Sync'}</span>
          </button>

          {/* Current Active Admin Pill */}
          <div className="hidden md:flex items-center space-x-2 bg-slate-900 text-white px-3.5 py-1.5 rounded-full border border-slate-700 shadow-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <div className="text-left">
              <p className="text-[10px] font-mono font-bold text-slate-200 leading-none">
                {currentAdmin.adminId}
              </p>
              <p className="text-[9px] text-emerald-400 font-semibold leading-none mt-0.5">
                Admin In-Charge
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
