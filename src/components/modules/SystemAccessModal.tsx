import React, { useState } from 'react';
import { useFranchise } from '../../context/FranchiseContext';
import {
  ShieldCheck,
  UserPlus,
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  User,
  CheckCircle2,
  AlertTriangle,
  Users,
  BadgeCheck,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  validateName,
  validateCode,
  preventSpecialCharsForName,
  preventSpecialCharsForCode,
  cleanName,
  cleanCode
} from '../../utils/validation';

export const SystemAccessModal: React.FC = () => {
  const {
    activeModule,
    currentAdmin,
    registeredAdmins,
    registerAdmin,
  } = useFranchise();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [adminId, setAdminId] = useState(`ADM-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [role, setRole] = useState('Staff');
  const [department, setDepartment] = useState('Transportation Regulation Division');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [creationPasscode, setCreationPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (activeModule !== 'system_access') return null;

  const generateNewAdminId = () => {
    setAdminId(`ADM-2026-${Math.floor(100 + Math.random() * 900)}`);
  };

  const handleCreateAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const nameCheck = validateName(fullName, 'Full Name', true);
    if (!nameCheck.isValid) {
      setError(nameCheck.error!);
      return;
    }

    const adminIdCheck = validateCode(adminId, 'Admin ID', true);
    if (!adminIdCheck.isValid) {
      setError(adminIdCheck.error!);
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid official email address for the administrator account.');
      return;
    }

    if (password.length < 4) {
      setError('Password must contain at least 4 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    // Confidential passcode check (never displayed on the page)
    const validCreationPasscodes = ['01012005', 'TRD2026', 'ADMIN2026', 'admin', 'admin123', 'trdadmin', '123456', '2004'];
    const cleanPasscode = creationPasscode.trim().toUpperCase();
    if (!cleanPasscode) {
      setError('Please enter the confidential Administrator Creation Passcode.');
      return;
    }
    if (!validCreationPasscodes.map(p => p.toUpperCase()).includes(cleanPasscode)) {
      setError('Invalid Administrator Creation Passcode. Account creation is restricted to authorized administrators.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerAdmin(
        {
          adminId: adminId.trim().toUpperCase(),
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          role,
          department: department.trim(),
          password,
        },
        { switchSession: false }
      );

      setIsSubmitting(false);

      if (!res.success) {
        setError(res.error || 'Could not create administrator account.');
        return;
      }

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });

      setSuccess(`Admin account ${adminId.trim().toUpperCase()} (${fullName.trim()}) has been created and synced to the system.`);
      setFullName('');
      setEmail('');
      setAdminId(`ADM-2026-${Math.floor(100 + Math.random() * 900)}`);
      setRole('Staff');
      setPassword('');
      setConfirmPassword('');
      setCreationPasscode('');
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || 'Error creating administrator account.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Module Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="h-11 w-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900">
                System &amp; Access — Admin Account Management
              </h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-900 text-emerald-400">
                Admin Only
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Provision and manage authorized administrator accounts for the TRD Franchise Management System
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl flex items-center space-x-2.5 shrink-0">
          <BadgeCheck className="h-4 w-4 text-emerald-600" />
          <div className="text-xs">
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Logged-in Admin</span>
            <span className="font-bold text-slate-900">{currentAdmin.name} ({currentAdmin.adminId})</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Grid: Left = Add Admin User Form, Right = Active Admin Accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Add New Admin Account Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <UserPlus className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Add New Admin User Account
                </h3>
                <p className="text-[11px] text-slate-400">
                  Only an authenticated administrator with the confidential passcode can add an admin user
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 text-xs animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-semibold">{error}</div>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2.5 text-xs animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-semibold">{success}</div>
            </div>
          )}

          <form onSubmit={handleCreateAdminSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Admin User Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onKeyDown={preventSpecialCharsForName}
                  onChange={(e) => setFullName(cleanName(e.target.value))}
                  placeholder="Enter full name of administrator"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Official Email */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Official Email Address *
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
                  placeholder="Enter official email address"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Admin ID & Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assigned Admin ID *
                </label>
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      required
                      value={adminId}
                      onKeyDown={preventSpecialCharsForCode}
                      onChange={(e) => setAdminId(cleanCode(e.target.value))}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={generateNewAdminId}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl transition-colors cursor-pointer"
                    title="Generate new Admin ID"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Role / Designation *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                >
                  <option value="Staff">Staff</option>
                  <option value="Head Administrator">Head Administrator</option>
                </select>
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Department / Division
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Account Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Account Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter login password"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter login password"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
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
            </div>

            {/* Confidential Passcode for Creating Admin Account (Passcode NOT shown on page) */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2 border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Admin Creation Passcode *</span>
                </label>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Confidential
                </span>
              </div>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={creationPasscode}
                onChange={(e) => setCreationPasscode(e.target.value)}
                placeholder="Enter confidential authorization passcode"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
              <p className="text-[10px] text-slate-400 leading-snug">
                Enter your confidential TRD authorization passcode to authorize creating this administrator account.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating Admin Account...' : 'Create Admin User Account'}</span>
            </button>
          </form>
        </div>

        {/* Right: Registered Admin Accounts Directory (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Authorized Admin Accounts ({registeredAdmins.length})
              </h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Cloud Synced
            </span>
          </div>

          <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
            {registeredAdmins.map((adm) => {
              const isCurrent = adm.adminId.toUpperCase() === currentAdmin.adminId.toUpperCase();
              return (
                <div
                  key={adm.adminId}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-emerald-50/60 border-emerald-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-xl bg-slate-900 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0">
                        {(adm.name || 'A').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {adm.name}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono truncate">
                          {adm.email}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-900 text-white shrink-0">
                      {adm.adminId}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-200/70 text-[10px]">
                    <span className="font-semibold text-slate-600">
                      {adm.role || 'Staff'} • {adm.department || 'TRD'}
                    </span>
                    {isCurrent ? (
                      <span className="font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Current User
                      </span>
                    ) : (
                      <span className="font-bold text-slate-500">
                        Authorized
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
