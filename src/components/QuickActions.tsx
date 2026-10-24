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
  MinusCircle
} from 'lucide-react';

export const QuickActions: React.FC = () => {
  const { setActiveModule } = useFranchise();

  const actionModules: {
    id: ActiveModule;
    title: string;
    description: string;
    icon: React.ElementType;
    iconColor?: string;
  }[] = [
    {
      id: 'register',
      title: 'Register Franchise',
      description: 'Add new franchise to system',
      icon: UserPlus,
      iconColor: 'text-slate-700',
    },
    {
      id: 'renewal',
      title: 'Process Renewal',
      description: 'Renewal Portal',
      icon: RotateCw,
      iconColor: 'text-slate-700',
    },
    {
      id: 'qr_scanner',
      title: 'QR Code Scanner',
      description: 'Generate QR Code',
      icon: QrCode,
      iconColor: 'text-slate-700',
    },
    {
      id: 'violation_entry',
      title: 'Violations & Reports',
      description: 'Monitor enforcer & passenger reports',
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
    },
    {
      id: 'driver_registry',
      title: 'Driver & Operator Registry',
      description: 'Management',
      icon: UserCheck,
      iconColor: 'text-slate-700',
    },
    {
      id: 'franchise_records',
      title: 'Franchise Records',
      description: 'View and update franchise data',
      icon: Users,
      iconColor: 'text-slate-700',
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      description: 'Generate visual data and reports',
      icon: BarChart3,
      iconColor: 'text-amber-500',
    },
    {
      id: 'deactivation',
      title: 'Franchise Deactivation',
      description: 'Deactivate and cancel unit records',
      icon: MinusCircle,
      iconColor: 'text-red-500',
    },
  ];

  return (
    <div className="mb-8">
      <h2 className="text-base font-bold text-slate-900 mb-4">Quick Actions</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actionModules.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className="bg-white rounded-2xl p-5 text-center border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[120px] group"
            >
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
  );
};
