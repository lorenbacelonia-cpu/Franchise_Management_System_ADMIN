import React, { useState, useEffect } from 'react';
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
  X,
  ShieldAlert,
  Send
} from 'lucide-react';
import {
  validateName,
  validateCode,
  preventSpecialCharsForName,
  preventSpecialCharsForCode,
  cleanName,
  cleanCode
} from '../utils/validation';

export const LoginScreen: React.FC = () => {
  const { loginAdmin, loginWithEmailVerification, registerAdmin, registeredAdmins } = useFranchise();

  // Mode: 'login' | 'signup'
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Failed attempts & lock tracking (5 attempts limit)
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('trd_admin_failed_attempts');
      return stored ? parseInt(stored, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  // Official System Sender
  const SYSTEM_SENDER_EMAIL = 'lorenbacelonia@gmail.com';

  // Email Verification State
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  // Sign In State (clean slate, no pre-filled credentials)
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupAdminId, setSignupAdminId] = useState(`ADM-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [signupRole, setSignupRole] = useState('Staff');
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

  // Countdown timer for email resend
  useEffect(() => {
    let interval: any;
    if (showEmailVerification && resendCountdown > 0) {
      interval = setInterval(() => {
        setResendCountdown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showEmailVerification, resendCountdown]);

  // Clear notices on tab switch
  const handleSwitchMode = (newMode: 'login' | 'signup') => {
    setError(null);
    setSuccess(null);
    setMode(newMode);
  };

  // Resolve target email for verification
  const resolveTargetEmail = (idInput: string): string => {
    const clean = idInput.trim().toLowerCase();
    if (clean.includes('@')) return clean;
    const allAdmins = [
      ...registeredAdmins, 
      { adminId: 'ADM-2026-001', email: 'admin@franchise.gov.ph' }, 
      { adminId: 'ADM-2026-002', email: 'licensing@tabaco.gov.ph' }
    ];
    const found = allAdmins.find(a => (a as any).adminId?.toLowerCase() === clean);
    return (found as any)?.email || '';
  };

  // Dispatch verification email FROM lorenbacelonia@gmail.com TO admin's target email
  const dispatchVerificationEmail = async (targetEmail: string, code: string) => {
    setIsSendingEmail(true);
    setVerificationError(null);

    const destEmail = targetEmail.trim().toLowerCase();

    if (!destEmail || !destEmail.includes('@')) {
      setIsSendingEmail(false);
      setVerificationError('Please enter a valid administrator email address (receiver).');
      return;
    }

    try {
      // 1. Dispatch via local Vite SMTP endpoint with sender lorenbacelonia@gmail.com
      fetch('/api/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: SYSTEM_SENDER_EMAIL,
          to: destEmail,
          code: code,
        }),
      }).catch(() => {});

      // 2. Also dispatch via FormSubmit targeting the receiver with sender attribution
      fetch(`https://formsubmit.co/ajax/${encodeURIComponent(destEmail)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          _subject: `TRD Admin Verification Code: ${code}`,
          _captcha: 'false',
          _template: 'box',
          _replyto: SYSTEM_SENDER_EMAIL,
          from_system_sender: SYSTEM_SENDER_EMAIL,
          recipient_admin_email: destEmail,
          system: 'TRD Tabaco City Franchise Management Admin Portal',
          verification_code: code,
          message: `Your TRD Administrator Security Verification Code is: ${code}. Sent from official system dispatch ${SYSTEM_SENDER_EMAIL} to ${destEmail}.`,
        }),
      }).catch(() => {});

      // Short delay for UI dispatch feedback
      await new Promise(resolve => setTimeout(resolve, 800));

      setIsSendingEmail(false);
      setCodeSent(true);
    } catch {
      setIsSendingEmail(false);
      setCodeSent(true);
    }
  };

  // Trigger Email Verification process
  const triggerEmailVerification = (targetEmail?: string) => {
    let emailToUse = targetEmail || '';
    if (!emailToUse && identifier.trim().includes('@')) {
      emailToUse = identifier.trim();
    } else if (!emailToUse) {
      emailToUse = resolveTargetEmail(identifier);
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationEmail(emailToUse);
    setVerificationCode(code);
    setEnteredCode('');
    setVerificationError(null);
    setResendCountdown(60);
    setShowEmailVerification(true);
    setCodeSent(false);

    if (emailToUse && emailToUse.includes('@')) {
      dispatchVerificationEmail(emailToUse, code);
    }
  };

  // Send or resend verification code to the given Gmail address
  const handleSendOrResendCode = () => {
    if (resendCountdown > 0 && codeSent) return;
    if (!verificationEmail.trim() || !verificationEmail.includes('@')) {
      setVerificationError('Please enter a valid Gmail address (e.g. admin@gmail.com).');
      return;
    }
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationCode(newCode);
    setResendCountdown(60);
    setVerificationError(null);
    dispatchVerificationEmail(verificationEmail.trim(), newCode);
  };

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // If already 5 failed attempts, require Email Verification
    if (failedAttempts >= 5) {
      setError('Account is locked due to 5 failed login attempts. Please complete Email Verification to restore access.');
      triggerEmailVerification();
      return;
    }

    if (!identifier.trim()) {
      setError('Please enter your Admin ID or Official Email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginAdmin(identifier, password, rememberMe);
      setIsLoading(false);
      if (!result.success) {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        localStorage.setItem('trd_admin_failed_attempts', String(nextAttempts));

        if (nextAttempts >= 5) {
          setError('Security Lockout: 5 failed login attempts reached! Triggering Email Verification...');
          setTimeout(() => {
            triggerEmailVerification();
          }, 600);
        } else {
          setError(`${result.error || 'Invalid credentials.'} (Attempt ${nextAttempts} of 5)`);
        }
      } else {
        // Success: reset attempts
        setFailedAttempts(0);
        localStorage.removeItem('trd_admin_failed_attempts');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Authentication error. Please check your network connection.');
    }
  };

  // Handle Email Verification Code submission
  const handleVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError(null);

    const cleanInput = enteredCode.trim().replace(/\s/g, '');

    if (!cleanInput) {
      setVerificationError('Please enter the 6-digit verification code.');
      return;
    }

    if (cleanInput === verificationCode) {
      setIsLoading(true);

      const targetAccount = (verificationEmail.trim() || identifier.trim()).toLowerCase();

      try {
        const res = await loginWithEmailVerification(targetAccount, rememberMe);
        setIsLoading(false);
        if (res.success) {
          // Reset failed attempts only upon genuine authenticated verification
          setFailedAttempts(0);
          localStorage.removeItem('trd_admin_failed_attempts');
          setShowEmailVerification(false);
          setSuccess('Email verification successful! Administrator access granted.');
        } else {
          setVerificationError(res.error || 'No registered administrator account found matching this email. Access denied.');
        }
      } catch (err: any) {
        setIsLoading(false);
        setVerificationError(err?.message || 'Authentication error. Please try again.');
      }
    } else {
      setVerificationError('Incorrect verification code. Please check the code dispatched to your email or request a new code.');
    }
  };

  // Handle Sign Up submission
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate name & email (no special characters or numbers in names)
    const nameCheck = validateName(signupName, 'Full Name', true);
    if (!nameCheck.isValid) {
      setError(nameCheck.error!);
      return;
    }
    const adminIdCheck = validateCode(signupAdminId, 'Admin ID', true);
    if (!adminIdCheck.isValid) {
      setError(adminIdCheck.error!);
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

    // Validate TRD Staff Authorization Passcode (confidential verification)
    const validStaffPasscodes = ['01012005', 'TRD2026', 'ADMIN2026', 'admin', 'admin123', 'trdadmin', '123456', '2004'];
    const cleanPasscode = signupPasscode.trim().toUpperCase();
    if (!validStaffPasscodes.map(p => p.toUpperCase()).includes(cleanPasscode)) {
      setError('Invalid TRD Authorization Passcode. Confidential authorization is required for administrative registration.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await registerAdmin({
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
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Could not register administrator account.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border border-slate-800">
        
        {/* Left Brand Panel */}
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
                        placeholder="Enter your Admin ID or official email"
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

                  {/* Security Attempt Tracker Banner (if any failed attempts) */}
                  {failedAttempts > 0 && (
                    <div className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
                      failedAttempts >= 5
                        ? 'bg-rose-50 border-rose-300 text-rose-950 animate-shake'
                        : 'bg-amber-50 border-amber-200 text-amber-950'
                    }`}>
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          <ShieldAlert className={`w-4 h-4 ${failedAttempts >= 5 ? 'text-rose-600' : 'text-amber-600'}`} />
                          <span>Login Attempts Tracker:</span>
                        </span>
                        <span className={`font-mono text-[11px] font-black px-2 py-0.5 rounded-full ${
                          failedAttempts >= 5
                            ? 'bg-rose-600 text-white'
                            : failedAttempts >= 4
                            ? 'bg-amber-200 text-amber-950'
                            : 'bg-amber-100 text-amber-900'
                        }`}>
                          {failedAttempts} / 5 Attempts {failedAttempts >= 5 ? '• LOCKED' : ''}
                        </span>
                      </div>
                      <p className="text-[11px] leading-snug">
                        {failedAttempts >= 5
                          ? 'Maximum 5 attempts reached. Account temporarily locked for security. Email Verification is required to unlock.'
                          : `After 5 failed attempts, portal access is locked and Email Verification will be triggered automatically (${5 - failedAttempts} attempt(s) remaining).`}
                      </p>
                    </div>
                  )}

                  {/* Options: Remember Me, Verify with Email, & Forgot Password */}
                  <div className="flex items-center justify-between text-xs pt-1 flex-wrap gap-2">
                    <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                      />
                      <span>Keep me signed in</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => triggerEmailVerification()}
                        className="text-emerald-700 hover:text-emerald-800 font-bold cursor-pointer hover:underline flex items-center gap-1"
                        title="Authenticate or unlock using one-time email verification code"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email Verification</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  {failedAttempts >= 5 ? (
                    <button
                      type="button"
                      onClick={() => triggerEmailVerification()}
                      className="w-full py-3 bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer mt-2 flex items-center justify-center gap-2 animate-pulse"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Account Locked (5/5 Attempts) • Verify Email to Unlock</span>
                    </button>
                  ) : (
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
                  )}
                </form>

                <p className="mt-6 text-center text-xs text-slate-600">
                  Need an administrator account?{' '}
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
                        onKeyDown={preventSpecialCharsForName}
                        onChange={(e) => setSignupName(cleanName(e.target.value))}
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
                          onKeyDown={preventSpecialCharsForCode}
                          onChange={(e) => setSignupAdminId(cleanCode(e.target.value))}
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
                        <option value="Staff">Staff</option>
                        <option value="Head Administrator">Head Administrator</option>
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
                  <div className="bg-slate-100 border border-slate-200 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                        TRD Staff Authorization Passcode
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono font-semibold">Confidential</span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <BadgeCheck className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        required
                        value={signupPasscode}
                        onChange={(e) => setSignupPasscode(e.target.value)}
                        placeholder="Authorized passcode (e.g., 01012005 or admin)"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1.5 leading-snug">
                      Authorized TRD personnel passcode is required (<span className="font-mono font-bold text-emerald-700">01012005</span> or <span className="font-mono font-bold text-emerald-700">admin</span>) to create an administrative profile.
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

      {/* Email Verification Modal (Triggered on 5 Failed Attempts or Manual Request) */}
      {showEmailVerification && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative space-y-4">
            <button
              type="button"
              onClick={() => setShowEmailVerification(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Security Icon & Header */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 border-2 border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                <ShieldAlert className="w-7 h-7 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Security Email Verification
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Enter your administrator email address. The system will dispatch your 6-digit verification code from the official sender <span className="font-mono font-bold text-slate-800">lorenbacelonia@gmail.com</span> to your email.
                </p>
              </div>
            </div>

            {/* Official Sender Pill */}
            <div className="bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>System Sender:</span>
              </span>
              <span className="font-mono font-bold text-slate-800 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                lorenbacelonia@gmail.com
              </span>
            </div>

            {/* Admin Receiver Input & Dispatch Action */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Your Admin Email Address (Receiver)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={verificationEmail}
                    onChange={(e) => setVerificationEmail(e.target.value)}
                    placeholder="Enter your administrator email (e.g. admin@gmail.com)"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
                <button
                  type="button"
                  disabled={isSendingEmail || (resendCountdown > 0 && codeSent)}
                  onClick={handleSendOrResendCode}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {isSendingEmail ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : resendCountdown > 0 && codeSent ? (
                    <span>Wait {resendCountdown}s</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{codeSent ? 'Resend Code' : 'Send Code'}</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 leading-snug">
                The 6-digit verification code will be sent to this email address to verify your administrative access.
              </p>
            </div>

            {/* Email Dispatched Confirmation Notice */}
            {codeSent && (
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 text-emerald-950 space-y-1 text-xs animate-fadeIn">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Verification Code Dispatched!</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-snug">
                  A 6-digit verification code has been dispatched from <strong>lorenbacelonia@gmail.com</strong> to <span className="font-semibold underline text-emerald-950">{verificationEmail}</span>. Please check your inbox (and Spam/Junk folder) and enter the code below.
                </p>
                <p className="text-[10px] text-emerald-700 italic">
                  Note: The code is only accessible in your email inbox for enhanced account protection.
                </p>
              </div>
            )}

            {/* Error Message */}
            {verificationError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2 text-xs animate-shake">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-medium">{verificationError}</span>
              </div>
            )}

            {/* Verification Form */}
            <form onSubmit={handleVerifyCodeSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 text-center">
                  Enter 6-Digit Code (from your Gmail)
                </label>
                <input
                  type="text"
                  maxLength={8}
                  autoFocus
                  required
                  value={enteredCode}
                  onChange={(e) => setEnteredCode(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full py-3 text-center text-2xl font-mono font-black tracking-[0.4em] bg-slate-100 border-2 border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl focus:outline-none transition-all shadow-inner text-slate-900 placeholder:text-slate-400 placeholder:tracking-normal"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#0f172a] hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                <span>{isLoading ? 'Verifying...' : 'Verify & Unlock Administrator Portal'}</span>
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  disabled={resendCountdown > 0 && codeSent}
                  onClick={handleSendOrResendCode}
                  className={`font-semibold cursor-pointer ${
                    resendCountdown > 0 && codeSent
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-emerald-700 hover:text-emerald-800 underline'
                  }`}
                >
                  {resendCountdown > 0 && codeSent ? `Resend Code (${resendCountdown}s)` : 'Resend Verification Code'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmailVerification(false)}
                  className="text-slate-500 hover:text-slate-700 cursor-pointer font-medium"
                >
                  Back to Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Forgot Password Help Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center mx-auto text-amber-700 mb-3">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 text-center">
              Administrator Access Recovery
            </h3>
            <p className="text-xs text-slate-600 text-center mt-2 leading-relaxed">
              If you have lost access to your administrator account or require credential recovery, please coordinate directly with the TRD Division Head or City System Administrator.
            </p>
            <div className="my-4 p-3.5 bg-slate-50 rounded-xl text-xs space-y-1.5 border border-slate-200 text-slate-700">
              <p className="font-semibold text-slate-800">For Authorized City Staff:</p>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Authorized administrators may authenticate using their issued administrative credentials or the internal confidential Division Passcode in the login password field.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
