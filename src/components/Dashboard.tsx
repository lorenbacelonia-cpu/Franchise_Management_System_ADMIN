import React from 'react';
import { Navbar } from './Navbar';
import { DashboardMetrics } from './DashboardMetrics';
import { QuickActions } from './QuickActions';
import { PendingReviewsTable } from './PendingReviewsTable';
import { ReviewApprovalModal } from './ReviewApprovalModal';

// 8 Module Modals
import { RegisterFranchiseModal } from './modules/RegisterFranchiseModal';
import { ProcessRenewalModal } from './modules/ProcessRenewalModal';
import { QRScannerModal } from './modules/QRScannerModal';
import { DriverRegistryModal } from './modules/DriverRegistryModal';
import { FranchiseRecordsModal } from './modules/FranchiseRecordsModal';
import { ReportsAnalyticsModal } from './modules/ReportsAnalyticsModal';
import { ViolationEntryModal } from './modules/ViolationEntryModal';
import { FranchiseDeactivationModal } from './modules/FranchiseDeactivationModal';

export const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-6 px-4 sm:px-6">
      <div className="w-full max-w-6xl bg-slate-50/60 rounded-3xl p-4 sm:p-8">
        <Navbar />

        <main className="mt-6">
          <DashboardMetrics />
          <QuickActions />
          <PendingReviewsTable />
        </main>
      </div>

      {/* Active Workflow Modals */}
      <ReviewApprovalModal />
      <RegisterFranchiseModal />
      <ProcessRenewalModal />
      <QRScannerModal />
      <DriverRegistryModal />
      <FranchiseRecordsModal />
      <ReportsAnalyticsModal />
      <ViolationEntryModal />
      <FranchiseDeactivationModal />
    </div>
  );
};
