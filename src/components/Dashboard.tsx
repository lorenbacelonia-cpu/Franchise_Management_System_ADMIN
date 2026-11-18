import React, { useState } from 'react';
import { useFranchise } from '../context/FranchiseContext';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { DashboardMetrics } from './DashboardMetrics';
import { DashboardAnalyticsSection } from './DashboardAnalyticsSection';
import { RegisterRenewTable } from './RegisterRenewTable';
import { PendingReviewsTable } from './PendingReviewsTable';
import { ReviewApprovalModal } from './ReviewApprovalModal';

// 8 Single-Page Modules (Rendered directly inline in the main workspace — no separate portals)
import { RegisterFranchiseModal } from './modules/RegisterFranchiseModal';
import { ProcessRenewalModal } from './modules/ProcessRenewalModal';
import { QRScannerModal } from './modules/QRScannerModal';
import { DriverRegistryModal } from './modules/DriverRegistryModal';
import { FranchiseRecordsModal } from './modules/FranchiseRecordsModal';
import { ReportsAnalyticsModal } from './modules/ReportsAnalyticsModal';
import { ViolationEntryModal } from './modules/ViolationEntryModal';
import { FranchiseDeactivationModal } from './modules/FranchiseDeactivationModal';
import { SystemAccessModal } from './modules/SystemAccessModal';
import { AccountDashboard } from './modules/AccountDashboard';

export const Dashboard: React.FC = () => {
  const { activeModule } = useFranchise();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Persistent Left Sidebar for All Modules */}
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Single-Page Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeModule === 'overview' && (
            <div className="space-y-8 animate-fadeIn">
              {/* 1. Top Metrics: Total, Active, Pending with both Tricycle & Pedicab */}
              <DashboardMetrics />

              {/* 2. Middle: Reports & Analytics (Bar Chart & Pie Chart for both Tricycle & Pedicab) */}
              <DashboardAnalyticsSection />

              {/* 3. Downside: Total of Register/Renew Franchise (both Tricycle & Pedicab) - Naka-table */}
              <RegisterRenewTable />

              {/* 4. Footer: Pending Review, Passenger Complaints, and Removed & Audit Trail (both Tricycle & Pedicab) - Naka-table */}
              <ReviewApprovalModal />
              <PendingReviewsTable />
            </div>
          )}

          {/* Each module renders directly inline on the page */}
          {activeModule === 'register' && <RegisterFranchiseModal />}
          {activeModule === 'renewal' && <ProcessRenewalModal />}
          {activeModule === 'qr_scanner' && <QRScannerModal />}
          {activeModule === 'driver_registry' && <DriverRegistryModal />}
          {activeModule === 'franchise_records' && <FranchiseRecordsModal />}
          {activeModule === 'reports' && <ReportsAnalyticsModal />}
          {activeModule === 'violation_entry' && <ViolationEntryModal />}
          {activeModule === 'deactivation' && <FranchiseDeactivationModal />}
          {activeModule === 'system_access' && <SystemAccessModal />}
          {activeModule === 'account' && <AccountDashboard />}
        </main>
      </div>
    </div>
  );
};
