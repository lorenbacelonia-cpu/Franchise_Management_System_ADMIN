import React, { useState } from 'react';
import { useFranchise } from '../context/FranchiseContext';
import { 
  Shield, 
  KeyRound, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LayoutDashboard, 
  Users, 
  FileText 
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { setIsAuthenticated } = useFranchise();
  const [adminId, setAdminId] = useState('ADM-2026-001');
  const [email, setEmail] = useState('admin@franchise.gov.ph');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticated(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border border-slate-800">
        
        {/* Left Brand Panel (Exact Figma Design) */}
        <div className="bg-[#0b1326] p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          
          {/* Subtle Radar/Concentric Circles Background */}
          <div className="absolute inset-0 opacity-15 pointer-events-none flex items-center justify-center">
            <div className="w-96 h-96 rounded-full border border-emerald-400/40 animate-pulse" />
            <div className="w-[480px] h-[480px] rounded-full border border-emerald-400/20 absolute" />
            <div className="w-[620px] h-[620px] rounded-full border border-emerald-400/10 absolute" />
          </div>

          <div className="relative z-10">
            {/* Admin Access Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/50 bg-emerald-950/40 text-emerald-400 text-xs font-semibold tracking-wide">
              <Shield className="w-3.5 h-3.5" />
              <span>ADMIN ACCESS</span>
            </div>

            {/* Glowing Emblem */}
            <div className="mt-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-500/60 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4">
                <Shield className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                TRD Tabaco City
              </h2>
              <p className="text-xs text-slate-300 max-w-xs mt-1 leading-relaxed">
                Franchise Management with Verifier for Transportation Regulation Division
              </p>
            </div>

            {/* 3 Overview Feature Cards */}
            <div className="mt-8 space-y-3">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3.5 flex items-center gap-3.5 hover:bg-white/10 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Dashboard</h4>
                  <p className="text-[11px] text-slate-400">System overview & analytics</p>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3.5 flex items-center gap-3.5 hover:bg-white/10 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Operators</h4>
                  <p className="text-[11px] text-slate-400">Manage franchise holders</p>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3.5 flex items-center gap-3.5 hover:bg-white/10 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Records</h4>
                  <p className="text-[11px] text-slate-400">Verify & audit documents</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-8 pt-4 border-t border-white/10 text-center text-[10px] text-slate-500">
            © 2026 Franchise Management Authority — Internal Use Only
          </div>
        </div>

        {/* Right Sign-in Form (Exact Figma Design) */}
        <div className="p-8 sm:p-12 flex flex-col justify-between bg-slate-50">
          <div>
            {/* Restricted Access Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
              RESTRICTED ACCESS
            </div>

            <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-3">
              Administrator Sign In
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Enter your credentials to access the admin dashboard.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* ADMIN ID */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  ADMIN ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                    placeholder="Enter your admin ID"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* EMAIL ADDRESS */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@franchise.gov.ph"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  PASSWORD
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <a href="#forgot" className="text-xs text-slate-500 hover:text-slate-800 font-medium">
                  Forgot password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 bg-[#0f172a] hover:bg-slate-900 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer mt-2"
              >
                Sign In as Administrator
              </button>
            </form>

            <div className="mt-6 flex items-center">
              <div className="flex-1 border-t border-slate-300" />
              <span className="px-3 text-[11px] text-slate-400 font-medium">admin portal</span>
              <div className="flex-1 border-t border-slate-300" />
            </div>

            <p className="mt-4 text-center text-xs text-slate-600">
              Need an admin account? <span className="font-bold text-slate-900 hover:underline cursor-pointer">Register here</span>
            </p>
          </div>

          <p className="text-[10px] text-slate-400 text-center mt-6">
            Unauthorized access is strictly prohibited and subject to legal action.
          </p>
        </div>

      </div>
    </div>
  );
};
