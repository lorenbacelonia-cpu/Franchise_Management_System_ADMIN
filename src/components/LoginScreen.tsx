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
  FileText,
  UserPlus,
  LogIn,
  AlertTriangle,
  CheckCircle2,
  User,
  Building2,
  BadgeCheck,
  HelpCircle,
  Sparkles
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { loginAdmin, registerAdmin } = useFranchise();

  // Mode: 'login' | 'signup'
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Sign In State
  const [identifier, setIdentifier] = useState('ADM-2026-001');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupAdminId, setSignupAdminId] = useState(`ADM-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [signupRole, setSignupRole] = useState('Franchise & Licensing Officer');
  const [signupDepartment, setSignupDepartment] = useState('Transportation Regulation Division');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupPasscode, setSignupPasscode] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Status feedback
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Clear notices on tab switch
  const handleSwitchMode = (newMode: 'login' | 'signup') => {
    setError(null);
    setSuccess(null);
    setMode(newMode);
  };

  // Quick preset loader for fast testing
  const handleQuickPreset = (presetId: string, presetPass: string) => {
    setIdentifier(presetId);
    setPassword(presetPass);
    setError(null);
  };

  // Handle Login submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = loginAdmin(identifier, password, rememberMe);
      setIsLoading(false);
      if (!result.success) {
        setError(result.error || 'Authentication failed. Please verify credentials.');
      }
    }, 300);
  };

  // Handle Sign Up submission
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate name & email
    if (!signupName.trim()) {
      setError('Please provide the Administrator’s Full Name.');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      setError('Please provide a valid official government or institutional email address.');
      return;
    }

    // Validate password match & length
    if (signupPassword.length < 4) {
      setError('Password must contain at least 4 characters.');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    // Validate TRD Staff Authorization Passcode (security measure for official government portal)
    const validStaffPasscodes = ['01012005', 'TRD2026', 'ADMIN2026', 'admin', 'admin123', 'trdadmin', '123456'];
    const cleanPasscode = signupPasscode.trim().toUpperCase();
    if (!validStaffPasscodes.map(p => p.toUpperCase()).includes(cleanPasscode)) {
      setError('Invalid TRD Authorization Passcode. Authorized city personnel passcode is required to create an admin account (hint: 01012005 or TRD2026).');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = registerAdmin({
        adminId: signupAdminId.trim(),
        name: signupName.trim(),
        email: signupEmail.trim(),
        role: signupRole,
        department: signupDepartment.trim(),
        password: signupPassword,
      });

      setIsLoading(false);

      if (!res.success) {
        setError(res.error || 'Could not register administrator account.');
      } else {
        setSuccess(`Administrator account ${signupAdminId} registered successfully! Redirecting to Dashboard...`);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border border-slate-800">
        
        {/* Left Brand Panel (Figma Design) */}
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
              <span>OFFICIAL TRD ADMIN SYSTEM</span>
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
                Transportation Regulation Division — Franchise Management with Verifier & Real-time Cloud Registry
              </p>
            </div>

            {/* 3 Overview Feature Cards */}
            <div className="mt-8 space-y-3">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3.5 flex items-center gap-3.5 hover:bg-white/10 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Executive Dashboard</h4>
                  <p className="text-[11px] text-slate-400">Live fleet telemetry & compliance analytics</p>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3.5 flex items-center gap-3.5 hover:bg-white/10 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Franchise & Driver Registry</h4>
                  <p className="text-[11px] text-slate-400">Tricycle and Pedicab verified credentials</p>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3.5 flex items-center gap-3.5 hover:bg-white/10 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Citations & Citizen Complaints</h4>
                  <p className="text-[11px] text-slate-400">Two-way chat investigation & audit log</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-8 pt-4 border-t border-white/10 text-center text-[10px] text-slate-400">
            City Government of Tabaco — Transportation Regulation Division © 2026
          </div>
        </div>

        {/* Right Form Panel (Sign In & Sign Up) */}
        <div className="p-8 sm:p-12 flex flex-col justify-between bg-slate-50 overflow-y-auto max-h-[90vh] md:max-h-none">
          <div>
            {/* Top Bar: Restricted Access Pill + Auth Mode Tabs */}
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                RESTRICTED ADMIN ACCESS
              </div>

              {/* Mode Toggle Tabs */}
              <div className="flex items-center bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => handleSwitchMode('login')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    mode === 'login'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log In</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchMode('signup')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Sign Up</span>
                </button>
              </div>
            </div>

            {/* Error Message Alert */}
            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 text-xs animate-shake">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{error}</div>
              </div>
            )}

            {/* Success Message Alert */}
            {success && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{success}</div>
              </div>
            )}

            {/* ======================================================== */}
            {/* SIGN IN FORM                                             */}
            {/* ======================================================== */}
            {mode === 'login' && (
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  Administrator Sign In
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Authenticate your credentials to enter the administrative portal.
                </p>

                <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
                  {/* ADMIN ID OR EMAIL */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Admin ID or Official Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="e.g. ADM-2026-001 or admin@franchise.gov.ph"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* PASSWORD */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Password
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
                        placeholder="Enter your administrative password"
                        className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Options: Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                      />
                      <span>Keep me signed in</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-slate-600 hover:text-emerald-700 font-semibold cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-[#0f172a] hover:bg-slate-900 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer mt-2 flex items-center justify-center gap-2 disabled:opacity-75"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <LogIn className="w-4 h-4" />
                    )}
                    <span>{isLoading ? 'Authenticating...' : 'Sign In as Administrator'}</span>
                  </button>
                </form>

                {/* Quick Credentials Helper Pills for convenience */}
                <div className="mt-5 p-3 rounded-xl bg-slate-100 border border-slate-200">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Quick Authorized Logins for Testing:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickPreset('ADM-2026-001', 'admin')}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 text-[10px] font-semibold hover:bg-slate-50 hover:border-emerald-500 transition-colors cursor-pointer"
                    >
                      Chief Admin (ADM-2026-001 / admin)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickPreset('licensing@tabaco.gov.ph', 'admin')}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 text-[10px] font-semibold hover:bg-slate-50 hover:border-emerald-500 transition-colors cursor-pointer"
                    >
                      Licensing Officer (admin)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickPreset('ADM-2026-001', '01012005')}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 text-[10px] font-semibold hover:bg-slate-50 hover:border-emerald-500 transition-colors cursor-pointer"
                    >
                      Master Passcode (01012005)
                    </button>
                  </div>
                </div>

                <p className="mt-4 text-center text-xs text-slate-600">
                  Need a new admin account?{' '}
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('signup')}
                    className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                  >
                    Register here
                  </button>
                </p>
              </div>
            )}

            {/* ======================================================== */}
            {/* SIGN UP FORM (ADMIN REGISTRATION)                        */}
            {/* ======================================================== */}
            {mode === 'signup' && (
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  Create Administrator Account
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Register an authorized Transportation Regulation Division personnel account.
                </p>

                <form onSubmit={handleSignupSubmit} className="mt-5 space-y-3.5">
                  {/* FULL NAME */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder="e.g. Maria Santos or Juan Dela Cruz"
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* OFFICIAL EMAIL */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Official Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="e.g. msantos@tabaco.gov.ph or admin@gmail.com"
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* ADMIN ID & ROLE (2 Columns) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Assigned Admin ID
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <KeyRound className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="text"
                          required
                          value={signupAdminId}
                          onChange={(e) => setSignupAdminId(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Role / Designation
                      </label>
                      <select
                        value={signupRole}
                        onChange={(e) => setSignupRole(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      >
                        <option value="Chief Administrator">Chief Administrator</option>
                        <option value="Franchise & Licensing Officer">Franchise & Licensing Officer</option>
                        <option value="Transportation Regulation Inspector">Regulation Inspector</option>
                        <option value="Enforcement Division Head">Enforcement Head</option>
                        <option value="Records & Audit Specialist">Records Specialist</option>
                      </select>
                    </div>
                  </div>

                  {/* DEPARTMENT */}
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
                        value={signupDepartment}
                        onChange={(e) => setSignupDepartment(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* PASSWORD & CONFIRM PASSWORD (2 Columns) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Create Password
                      </label>
                      <div className="relative">
                        <input
                          type={showSignupPassword ? 'text' : 'password'}
                          required
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          placeholder="Min. 4 characters"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          type={showSignupPassword ? 'text' : 'password'}
                          required
                          value={signupConfirmPassword}
                          onChange={(e) => setSignupConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Show Password Toggle */}
                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showSignupPassword}
                        onChange={(e) => setShowSignupPassword(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                      />
                      <span>Show password text</span>
                    </label>
                  </div>

                  {/* TRD STAFF AUTHORIZATION PASSCODE */}
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-emerald-950 uppercase tracking-wider">
                        TRD Staff Authorization Passcode
                      </label>
                      <span className="text-[10px] text-emerald-700 font-mono font-bold">Required</span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-600">
                        <BadgeCheck className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={signupPasscode}
                        onChange={(e) => setSignupPasscode(e.target.value)}
                        placeholder="Enter City TRD staff passcode (e.g. 01012005 or TRD2026)"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <p className="text-[10px] text-emerald-800 mt-1.5 leading-snug">
                      Security validation ensures only designated city personnel can activate an administrative profile. Use official TRD authorization key: <span className="font-mono font-bold">01012005</span>.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer mt-1 flex items-center justify-center gap-2 disabled:opacity-75"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    <span>{isLoading ? 'Creating Account...' : 'Complete Admin Registration'}</span>
                  </button>
                </form>

                <p className="mt-4 text-center text-xs text-slate-600">
                  Already have an admin account?{' '}
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('login')}
                    className="font-bold text-slate-900 hover:text-emerald-700 hover:underline cursor-pointer"
                  >
                    Sign In here
                  </button>
                </p>
              </div>
            )}
          </div>

          <p className="text-[10px] text-slate-400 text-center mt-6">
            Unauthorized access or registration attempts are monitored and logged for security compliance.
          </p>
        </div>

      </div>

      {/* Forgot Password Help Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center mx-auto text-amber-700 mb-3">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 text-center">
              Administrator Access Recovery
            </h3>
            <p className="text-xs text-slate-600 text-center mt-2 leading-relaxed">
              Administrative passwords can be reset by the Division Head or verified using the TRD Master Passcode.
            </p>
            <div className="my-4 p-3 bg-slate-100 rounded-xl text-xs space-y-1.5 border border-slate-200 font-mono text-slate-700">
              <p><span className="font-bold text-slate-900">Emergency Override:</span> 01012005</p>
              <p><span className="font-bold text-slate-900">Default Super Admin:</span> ADM-2026-001</p>
              <p><span className="font-bold text-slate-900">Default Password:</span> admin</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowForgotModal(false);
                handleQuickPreset('ADM-2026-001', '01012005');
              }}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-colors"
            >
              Use Emergency Passcode & Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
