import React, { useState } from 'react';
import { useFranchise } from '../../context/FranchiseContext';
import type { EnforcerAccount } from '../../types';
import { DEFAULT_MOBILE_VERIFIER_URL } from '../../utils/fareUtils';
import {
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
  RefreshCw,
  Shield,
  ShieldCheck,
  Phone,
  MapPin,
  Trash2,
  Search,
  ExternalLink,
  Copy,
  Printer,
  Smartphone,
  Check
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
    enforcers,
    registerEnforcer,
    deleteEnforcer,
  } = useFranchise();

  // Helper to generate a secure, readable system-provided password
  const generateSystemPassword = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let rand = '';
    for (let i = 0; i < 4; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `TRD-ENF-${rand}`;
  };

  // Active Tab: 'admins' (Admin Users) first by default, or 'enforcers' (Traffic Enforcers)
  const [activeTab, setActiveTab] = useState<'admins' | 'enforcers'>('admins');

  // ── TRAFFIC ENFORCER FORM STATE (System-Provided Credentials) ──
  const [enfFullName, setEnfFullName] = useState('');
  const [enfBadgeNumber, setEnfBadgeNumber] = useState(`ENF-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [enfContact, setEnfContact] = useState('');
  const [enfEmail, setEnfEmail] = useState('');
  const [enfAssignedArea, setEnfAssignedArea] = useState('Poblacion / Centro District');
  const [enfPassword, setEnfPassword] = useState(() => generateSystemPassword());
  const [enfConfirmPassword, setEnfConfirmPassword] = useState(enfPassword);
  const [enfAdminPasscode, setEnfAdminPasscode] = useState('');
  const [enfShowPassword, setEnfShowPassword] = useState(true);
  const [enfSearch, setEnfSearch] = useState('');
  const [notifyViaGmailOnCreate, setNotifyViaGmailOnCreate] = useState(true);
  const [isSubmittingEnforcer, setIsSubmittingEnforcer] = useState(false);

  // Issued credentials popup modal state
  const [issuedCredentials, setIssuedCredentials] = useState<{
    badgeNumber: string;
    name: string;
    password?: string;
    assignedArea?: string;
    contactNumber?: string;
    email?: string;
  } | null>(null);

  // Copy feedback notification
  const [copyNotification, setCopyNotification] = useState<string | null>(null);

  // Deletion state
  const [enforcerToDelete, setEnforcerToDelete] = useState<EnforcerAccount | null>(null);
  const [deletePasscode, setDeletePasscode] = useState('');
  const [isDeletingEnforcer, setIsDeletingEnforcer] = useState(false);

  // ── ADMIN USER FORM STATE ──
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [adminId, setAdminId] = useState(`ADM-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [role, setRole] = useState('Staff');
  const [department, setDepartment] = useState('Transportation Regulation Division');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [creationPasscode, setCreationPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

  // Feedback notifications
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (activeModule !== 'system_access') return null;

  const generateNewEnforcerBadge = () => {
    setEnfBadgeNumber(`ENF-2026-${Math.floor(100 + Math.random() * 900)}`);
  };

  const regenerateEnforcerPassword = () => {
    const newPass = generateSystemPassword();
    setEnfPassword(newPass);
    setEnfConfirmPassword(newPass);
  };

  const generateNewAdminId = () => {
    setAdminId(`ADM-2026-${Math.floor(100 + Math.random() * 900)}`);
  };

  // ── COPY CREDENTIALS HELPERS ──
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyNotification(`${label} copied to clipboard!`);
    setTimeout(() => setCopyNotification(null), 2500);
  };

  const handleCopyCompleteCredentials = (cred: {
    badgeNumber: string;
    name: string;
    password?: string;
    assignedArea?: string;
  }) => {
    const text = `CITY GOVERNMENT OF TABACO - TRD
OFFICIAL ENFORCER MOBILE WEB ACCESS CREDENTIALS
==================================================
Officer Name: ${cred.name}
Badge Number / Username: ${cred.badgeNumber}
Mobile Login Password: ${cred.password || 'enforcer123'}
Patrol Sector: ${cred.assignedArea || 'Poblacion / Centro District'}
Mobile Web Login Portal: ${DEFAULT_MOBILE_VERIFIER_URL}
==================================================
Open the link on your smartphone browser to access the TRD Mobile Citation App.`;

    navigator.clipboard.writeText(text);
    setCopyNotification('Complete credentials copied! Ready to send to the officer.');
    setTimeout(() => setCopyNotification(null), 3000);
  };

  // ── GMAIL NOTIFICATION DISPATCHER ──
  const generateEnforcerGmailContent = (cred: {
    badgeNumber: string;
    name: string;
    password?: string;
    assignedArea?: string;
    contactNumber?: string;
    email?: string;
  }) => {
    const todayStr = new Date().toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const subject = `TRD OFFICIAL NOTICE: Enforcer Mobile Web Account Credentials - Badge ${cred.badgeNumber}`;
    const body = `CITY GOVERNMENT OF TABACO
TRAFFIC & REGULATORY DIVISION (TRD)
Office of the City Mayor • Tabaco City Hall, Tabaco City, Albay

=======================================================
OFFICIAL NOTICE OF ENFORCER MOBILE WEB ACCESS CREDENTIALS
=======================================================

Dear ${cred.name},

Please be advised that your municipal Traffic Enforcer Mobile Citation Account has been officially authorized and issued by the Tabaco City Traffic & Regulatory Division (TRD).

YOUR OFFICIAL MOBILE WEB LOGIN CREDENTIALS:
- Authorized Officer: ${cred.name}
- Badge Number / Login ID: ${cred.badgeNumber}
- System-Generated Password: ${cred.password || 'enforcer123'}
- Assigned Patrol Sector: ${cred.assignedArea || 'Poblacion District'}
- Date Issued: ${todayStr}

MOBILE CITATION WEB PORTAL:
${DEFAULT_MOBILE_VERIFIER_URL}

ACCESS INSTRUCTIONS:
1. Open your smartphone browser (or scan the QR code on your credential pass) and navigate to the portal link above.
2. Sign in with your assigned Badge Number as Username and your System-Generated Password.
3. Once logged in, you can scan tricycle/pedicab QR codes, verify operator permits, and record municipal traffic citations in real time.

SECURITY NOTICE:
These credentials are strictly issued for your official duties as an authorized municipal traffic enforcer. Keep your password confidential.

Issued by:
${currentAdmin.name}
Traffic & Regulatory Division (TRD)
City Government of Tabaco, Albay`;

    return { subject, body };
  };

  const handleSendCredentialsViaGmail = (cred: {
    badgeNumber: string;
    name: string;
    password?: string;
    assignedArea?: string;
    contactNumber?: string;
    email?: string;
  }) => {
    const { subject, body } = generateEnforcerGmailContent(cred);
    const recipient = (cred.email || '').trim();
    const params = new URLSearchParams({
      view: 'cm',
      fs: '1',
      to: recipient,
      su: subject,
      body: body,
    });
    const gmailUrl = `https://mail.google.com/mail/?${params.toString()}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    setCopyNotification(recipient ? `Gmail compose opened for ${recipient}!` : 'Gmail compose opened with credentials!');
    setTimeout(() => setCopyNotification(null), 3000);
  };

  // ── PRINT CREDENTIAL PASS SLIP ──
  const handlePrintEnforcerCredentials = (cred: {
    badgeNumber: string;
    name: string;
    password?: string;
    assignedArea?: string;
  }) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print official enforcer credential slip.');
      return;
    }

    const issueDate = new Date().toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(DEFAULT_MOBILE_VERIFIER_URL)}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Enforcer Mobile Web Credential Pass - Tabaco City TRD</title>
        <style>
          @page { size: A5 portrait; margin: 8mm; }
          * { box-sizing: border-box; }
          body {
            font-family: Arial, "Helvetica Neue", sans-serif;
            margin: 0;
            padding: 8px;
            color: #0f172a;
            background: #ffffff;
            font-size: 11px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 6px;
            margin-bottom: 12px;
          }
          .header h1 { margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
          .header h2 { margin: 2px 0 0; font-size: 10px; font-weight: normal; color: #475569; }
          .header .doc-title { margin-top: 6px; font-size: 11.5px; font-weight: bold; color: #047857; text-transform: uppercase; letter-spacing: 0.5px; }
          .card {
            border: 2px solid #047857;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 12px;
            background: #f8fafc;
          }
          .row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dotted #cbd5e1; }
          .row:last-child { border-bottom: none; }
          .label { color: #64748b; font-weight: bold; }
          .val { font-weight: bold; color: #0f172a; }
          .badge-val { font-family: monospace; font-size: 15px; color: #047857; font-weight: 900; }
          .pass-val { font-family: monospace; font-size: 15px; color: #0f172a; background: #e2e8f0; padding: 2px 8px; border-radius: 4px; font-weight: 900; }
          .qr-section {
            text-align: center;
            margin: 12px 0;
            padding: 8px;
            border: 1px dashed #cbd5e1;
            border-radius: 6px;
            background: #ffffff;
          }
          .qr-section img { width: 110px; height: 110px; }
          .qr-section p { margin: 4px 0 0; font-size: 9px; color: #475569; }
          .instructions {
            font-size: 9.5px;
            color: #334155;
            line-height: 1.45;
            background: #f1f5f9;
            padding: 10px;
            border-radius: 6px;
            border-left: 3px solid #047857;
          }
          .footer {
            margin-top: 14px;
            display: flex;
            justify-content: space-between;
            font-size: 9px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 6px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>City Government of Tabaco</h1>
          <h2>Traffic &amp; Regulatory Division (TRD) • Office of the City Mayor</h2>
          <div class="doc-title">Official Enforcer Mobile Web Login Pass</div>
        </div>

        <div class="card">
          <div class="row">
            <span class="label">Authorized Officer:</span>
            <span class="val">${cred.name}</span>
          </div>
          <div class="row">
            <span class="label">Badge Number / Username:</span>
            <span class="badge-val">${cred.badgeNumber}</span>
          </div>
          <div class="row">
            <span class="label">System-Provided Password:</span>
            <span class="pass-val">${cred.password || 'enforcer123'}</span>
          </div>
          <div class="row">
            <span class="label">Assigned Sector / Line:</span>
            <span class="val">${cred.assignedArea || 'Poblacion District'}</span>
          </div>
          <div class="row">
            <span class="label">Date Issued:</span>
            <span class="val">${issueDate}</span>
          </div>
          <div class="row">
            <span class="label">Issuing Administrator:</span>
            <span class="val">${currentAdmin.name}</span>
          </div>
        </div>

        <div class="qr-section">
          <img src="${qrUrl}" alt="Mobile Web QR" />
          <p><strong>Scan QR or open on smartphone browser:</strong><br/>${DEFAULT_MOBILE_VERIFIER_URL}</p>
        </div>

        <div class="instructions">
          <strong>Field Officer Access Instructions:</strong>
          <ol style="margin: 4px 0 0 16px; padding: 0;">
            <li>Open your smartphone camera or web browser and visit the mobile web URL above.</li>
            <li>Log in using your assigned <strong>Badge Number</strong> and <strong>System-Provided Password</strong>.</li>
            <li>Scan vehicle QR codes or enter plate numbers to inspect licenses and record traffic citations.</li>
            <li>This mobile account is strictly for authorized municipal operations. Keep credentials secure.</li>
          </ol>
        </div>

        <div class="footer">
          <span>Official TRD System-Issued Account</span>
          <span>Tabaco City Hall, Tabaco City</span>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ── 1. SUBMIT TRAFFIC ENFORCER ACCOUNT (Admin Only) ──
  const handleCreateEnforcerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const nameCheck = validateName(enfFullName, 'Officer Full Name', true);
    if (!nameCheck.isValid) {
      setError(nameCheck.error!);
      return;
    }

    const badgeCheck = validateCode(enfBadgeNumber, 'Badge Number', true);
    if (!badgeCheck.isValid) {
      setError(badgeCheck.error!);
      return;
    }

    if (enfPassword.length < 4) {
      setError('Password must contain at least 4 characters.');
      return;
    }

    if (enfPassword !== enfConfirmPassword) {
      setError('Mobile password and Confirm Password do not match.');
      return;
    }

    // Strict Admin Authorization Check: Only Admin can add an account!
    const validCreationPasscodes = ['01012005', 'TRD2026', 'ADMIN2026', 'admin', 'admin123', 'trdadmin', '123456', '2004'];
    const cleanPasscode = enfAdminPasscode.trim().toUpperCase();
    if (!cleanPasscode) {
      setError('Please enter the confidential Administrator Passcode to authorize creating this enforcer account.');
      return;
    }
    const isAdminAuthed = validCreationPasscodes.map(p => p.toUpperCase()).includes(cleanPasscode) ||
      (currentAdmin?.password && currentAdmin.password.toUpperCase() === cleanPasscode);

    if (!isAdminAuthed) {
      setError('Invalid Administrator Passcode. Only authorized TRD administrators can create traffic enforcer accounts.');
      return;
    }

    setIsSubmittingEnforcer(true);
    try {
      const res = await registerEnforcer(
        {
          badgeNumber: enfBadgeNumber.trim().toUpperCase(),
          name: enfFullName.trim(),
          contactNumber: enfContact.trim(),
          email: enfEmail.trim().toLowerCase(),
          assignedArea: enfAssignedArea.trim(),
          password: enfPassword,
          status: 'Active',
          createdBy: currentAdmin?.name ? `${currentAdmin.name} (${currentAdmin.adminId})` : 'TRD Administrator',
        },
        { adminPasscode: cleanPasscode }
      );

      setIsSubmittingEnforcer(false);

      if (!res.success) {
        setError(res.error || 'Could not create traffic enforcer account.');
        return;
      }

      confetti({
        particleCount: 75,
        spread: 65,
        origin: { y: 0.6 }
      });

      // Save to issued credentials to pop up the credential slip / card immediately!
      const newCred = {
        badgeNumber: enfBadgeNumber.trim().toUpperCase(),
        name: enfFullName.trim(),
        password: enfPassword,
        assignedArea: enfAssignedArea.trim(),
        contactNumber: enfContact.trim(),
        email: enfEmail.trim().toLowerCase(),
      };
      setIssuedCredentials(newCred);

      setSuccess(`Account successfully issued for ${newCred.name} (${newCred.badgeNumber})! The credentials below can now be used on the Mobile Web citation app.`);

      if (notifyViaGmailOnCreate && newCred.email) {
        handleSendCredentialsViaGmail(newCred);
      }

      // Reset form with a fresh next badge & password
      setEnfFullName('');
      setEnfBadgeNumber(`ENF-2026-${Math.floor(100 + Math.random() * 900)}`);
      setEnfContact('');
      setEnfEmail('');
      const nextPass = generateSystemPassword();
      setEnfPassword(nextPass);
      setEnfConfirmPassword(nextPass);
      setEnfAdminPasscode('');
    } catch (err: any) {
      setIsSubmittingEnforcer(false);
      setError(err?.message || 'Error creating traffic enforcer account.');
    }
  };

  // ── 2. DELETE TRAFFIC ENFORCER ACCOUNT (Admin Only) ──
  const handleConfirmDeleteEnforcer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enforcerToDelete) return;
    setError(null);
    setSuccess(null);

    const validCreationPasscodes = ['01012005', 'TRD2026', 'ADMIN2026', 'admin', 'admin123', 'trdadmin', '123456', '2004'];
    const cleanPasscode = deletePasscode.trim().toUpperCase();
    const isAdminAuthed = validCreationPasscodes.map(p => p.toUpperCase()).includes(cleanPasscode) ||
      (currentAdmin?.password && currentAdmin.password.toUpperCase() === cleanPasscode);

    if (!isAdminAuthed) {
      setError('Invalid Administrator Passcode. Authorization denied.');
      return;
    }

    setIsDeletingEnforcer(true);
    try {
      const res = await deleteEnforcer(enforcerToDelete.badgeNumber, { adminPasscode: cleanPasscode });
      setIsDeletingEnforcer(false);

      if (!res.success) {
        setError(res.error || 'Could not remove enforcer account.');
        return;
      }

      setSuccess(`Traffic Enforcer account ${enforcerToDelete.badgeNumber} (${enforcerToDelete.name}) has been removed.`);
      setEnforcerToDelete(null);
      setDeletePasscode('');
    } catch (err: any) {
      setIsDeletingEnforcer(false);
      setError(err?.message || 'Failed to remove enforcer account.');
    }
  };

  // ── 3. SUBMIT ADMIN ACCOUNT ──
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

    setIsSubmittingAdmin(true);
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

      setIsSubmittingAdmin(false);

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
      setIsSubmittingAdmin(false);
      setError(err?.message || 'Error creating administrator account.');
    }
  };

  // Filter enforcers by search
  const filteredEnforcers = enforcers.filter(e => {
    if (!enfSearch.trim()) return true;
    const term = enfSearch.toLowerCase();
    return (
      e.badgeNumber.toLowerCase().includes(term) ||
      e.name.toLowerCase().includes(term) ||
      (e.assignedArea || '').toLowerCase().includes(term) ||
      (e.email || '').toLowerCase().includes(term) ||
      (e.contactNumber || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── TOP ROLE TAB SELECTOR & MOBILE WEB PORTAL LINK ── */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          {/* Tab 1: Admin Users (First) */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('admins');
              setError(null);
              setSuccess(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'admins'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <UserPlus className="h-4 w-4 text-sky-400" />
            <span>Administrator Accounts</span>
            <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full font-bold ${
              activeTab === 'admins'
                ? 'bg-sky-500 text-slate-950'
                : 'bg-slate-300 text-slate-800'
            }`}>
              {registeredAdmins.length}
            </span>
          </button>

          {/* Tab 2: Traffic Enforcers (Second) */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('enforcers');
              setError(null);
              setSuccess(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'enforcers'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Shield className="h-4 w-4 text-emerald-400" />
            <span>Traffic Enforcers</span>
            <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full font-bold ${
              activeTab === 'enforcers'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-300 text-slate-800'
            }`}>
              {enforcers.length}
            </span>
          </button>
        </div>

        {/* Mobile Web Direct Link Pill */}
        <div className="flex items-center space-x-2">
          <a
            href={DEFAULT_MOBILE_VERIFIER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            title="Open the Enforcer Mobile Web portal in a new tab"
          >
            <Smartphone className="h-3.5 w-3.5 text-emerald-600" />
            <span>Enforcer Mobile Web</span>
            <ExternalLink className="h-3 w-3 text-emerald-700 ml-0.5" />
          </a>
        </div>
      </div>

      {/* Global Alerts */}
      {copyNotification && (
        <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs font-bold shadow-lg animate-fadeIn">
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 text-emerald-400" />
            <span>{copyNotification}</span>
          </div>
        </div>
      )}

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

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: TRAFFIC ENFORCER MANAGEMENT ── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'enforcers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: System-Provided Enforcer Account Issuance Form (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Issue Enforcer Mobile Web Account
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    The admin system automatically generates the officer credentials for mobile login
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                <span>Admin Only</span>
              </span>
            </div>

            {/* Mobile Web Integration Info Banner */}
            <div className="bg-gradient-to-r from-emerald-50 via-sky-50 to-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl shrink-0">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">
                    System Provides Credentials to Enforcers
                  </span>
                  <span className="text-[11px] text-slate-600 block">
                    Field enforcers log in using this generated Badge ID and Password at:
                  </span>
                  <span className="font-mono text-[11px] font-bold text-emerald-800">
                    {DEFAULT_MOBILE_VERIFIER_URL}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateEnforcerSubmit} className="space-y-4">
              {/* Officer Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Enforcer Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={enfFullName}
                    onKeyDown={preventSpecialCharsForName}
                    onChange={(e) => setEnfFullName(cleanName(e.target.value))}
                    placeholder="e.g. Officer Pedro Santos"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Badge Number & Mobile Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Badge No. / Login ID *
                    </label>
                    <span className="text-[10px] text-emerald-700 font-bold">Auto-Provided</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <KeyRound className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        required
                        value={enfBadgeNumber}
                        onKeyDown={preventSpecialCharsForCode}
                        onChange={(e) => setEnfBadgeNumber(cleanCode(e.target.value))}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={generateNewEnforcerBadge}
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl transition-colors cursor-pointer"
                      title="Generate new Badge Number"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mobile Contact Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      value={enfContact}
                      onChange={(e) => setEnfContact(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      placeholder="e.g. 09171234567"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Official Email & Assigned Sector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Officer Gmail Address (To receive login credentials)
                    </label>
                    <span className="text-[10px] text-emerald-600 font-semibold">Recommended</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="email"
                      value={enfEmail}
                      onChange={(e) => setEnfEmail(e.target.value)}
                      placeholder="e.g. officer.name@gmail.com"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                  <label className="flex items-center space-x-2 cursor-pointer mt-1.5 text-[11px] text-slate-700 font-medium select-none">
                    <input
                      type="checkbox"
                      checked={notifyViaGmailOnCreate}
                      onChange={(e) => setNotifyViaGmailOnCreate(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span>Automatically open Gmail with login details upon account issuance</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Assigned Patrol Sector / Route Line
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      value={enfAssignedArea}
                      onChange={(e) => setEnfAssignedArea(e.target.value)}
                      placeholder="e.g. Poblacion / Centro District"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* SYSTEM-GENERATED ENFORCER PASSWORD BOX */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                      <span>System-Generated Mobile Password *</span>
                    </label>
                    <p className="text-[10px] text-slate-500">
                      The system auto-generates this secure password for the officer to log in
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={regenerateEnforcerPassword}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 flex items-center space-x-1 cursor-pointer transition-all shadow-2xs"
                  >
                    <RefreshCw className="w-3 h-3 text-emerald-600" />
                    <span>Regenerate</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="relative">
                      <input
                        type={enfShowPassword ? 'text' : 'password'}
                        required
                        value={enfPassword}
                        onChange={(e) => {
                          setEnfPassword(e.target.value);
                          setEnfConfirmPassword(e.target.value);
                        }}
                        placeholder="Mobile password"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setEnfShowPassword(!enfShowPassword)}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center space-x-1 cursor-pointer"
                    >
                      {enfShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{enfShowPassword ? 'Hide' : 'Show'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyText(enfPassword, 'Password')}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1 cursor-pointer shadow-2xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* STRICT ADMIN AUTHORIZATION PASSCODE (Only Admin Can Add Account) */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2 border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Admin Authorization Passcode *</span>
                  </label>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    Admin Only
                  </span>
                </div>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={enfAdminPasscode}
                  onChange={(e) => setEnfAdminPasscode(e.target.value)}
                  placeholder="Enter confidential administrator passcode..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
                <p className="text-[10px] text-slate-400 leading-snug">
                  Only verified TRD administrators can authorize adding this traffic enforcer account to the mobile citation system.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmittingEnforcer}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Shield className="w-4 h-4" />
                <span>{isSubmittingEnforcer ? 'Issuing Mobile Account...' : 'Issue Traffic Enforcer Mobile Account'}</span>
              </button>
            </form>
          </div>

          {/* Right Column: Authorized Traffic Enforcers Directory (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Authorized Enforcers ({filteredEnforcers.length})
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                Cloud Synced
              </span>
            </div>

            {/* Search Enforcers */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={enfSearch}
                onChange={(e) => setEnfSearch(e.target.value)}
                placeholder="Search by officer name or badge no..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>

            {/* Enforcers Directory List */}
            <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
              {filteredEnforcers.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Shield className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-700">No enforcer records found</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Use the form to add authorized traffic enforcers.</p>
                </div>
              ) : (
                filteredEnforcers.map((enf) => (
                  <div
                    key={enf.badgeNumber}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100/70 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-xl bg-slate-900 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0">
                          <Shield className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {enf.name}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono truncate">
                            {enf.email || enf.contactNumber || 'Field Citation Officer'}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-900 text-emerald-400 shrink-0">
                        {enf.badgeNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 text-[10px]">
                      <div className="flex items-center gap-1.5 text-slate-600 font-semibold truncate">
                        <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate">{enf.assignedArea || 'Poblacion District'}</span>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        {/* Notify via Gmail Button */}
                        <button
                          type="button"
                          onClick={() => handleSendCredentialsViaGmail(enf)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer flex items-center space-x-1"
                          title={enf.email ? `Send credentials to ${enf.email} via Gmail` : 'Open Gmail to send credentials'}
                        >
                          <Mail className="h-3 w-3 text-rose-600" />
                          <span>Gmail</span>
                        </button>

                        {/* View & Re-Issue Credentials Button */}
                        <button
                          type="button"
                          onClick={() => setIssuedCredentials(enf)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer flex items-center space-x-1"
                          title="View Mobile Web Login Credentials"
                        >
                          <KeyRound className="h-3 w-3 text-emerald-600" />
                          <span>Credentials</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEnforcerToDelete(enf);
                            setDeletePasscode('');
                            setError(null);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remove enforcer account"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: ADMINISTRATOR ACCOUNTS MANAGEMENT ── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'admins' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Add New Admin Account Form (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
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
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
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
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all cursor-pointer"
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
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
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
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
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
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

              {/* Confidential Passcode for Creating Admin Account */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2 border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
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
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                />
                <p className="text-[10px] text-slate-400 leading-snug">
                  Enter your confidential TRD authorization passcode to authorize creating this administrator account.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmittingAdmin}
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isSubmittingAdmin ? 'Creating Admin Account...' : 'Create Admin User Account'}</span>
              </button>
            </form>
          </div>

          {/* Right: Registered Admin Accounts Directory (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Authorized Admin Accounts ({registeredAdmins.length})
                </h3>
              </div>
              <span className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full">
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
                        ? 'bg-sky-50/60 border-sky-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-xl bg-slate-900 text-sky-400 font-black text-xs flex items-center justify-center shrink-0">
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
                        <span className="font-extrabold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
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
      )}

      {/* ── ISSUED CREDENTIALS POPUP MODAL (System-Provided Credentials Card) ── */}
      {issuedCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5 text-emerald-800">
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Enforcer Mobile Access Issued
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    System-provided credentials for Mobile Web login
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIssuedCredentials(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-xs font-bold px-2 py-1"
              >
                Close
              </button>
            </div>

            {/* Officer Profile Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{issuedCredentials.name}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Active Enforcer
                </span>
              </div>
              <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Sector: <strong>{issuedCredentials.assignedArea || 'Poblacion District'}</strong></span>
              </div>
            </div>

            {/* Credential Details Box */}
            <div className="space-y-3">
              {/* Portal URL */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Enforcer Mobile Web URL
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-emerald-800 truncate font-semibold">
                    {DEFAULT_MOBILE_VERIFIER_URL}
                  </div>
                  <a
                    href={DEFAULT_MOBILE_VERIFIER_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors cursor-pointer shrink-0"
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>

              {/* Badge Number / Username */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Username / Badge ID
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900">
                    {issuedCredentials.badgeNumber}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(issuedCredentials.badgeNumber, 'Badge ID')}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="Copy Badge ID"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Mobile Password */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Mobile Login Password
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-emerald-900">
                    {issuedCredentials.password || 'enforcer123'}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(issuedCredentials.password || 'enforcer123', 'Password')}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="Copy Password"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Actions: Gmail, Copy All or Print Slip */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => handleSendCredentialsViaGmail(issuedCredentials)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                title="Send credentials directly via Gmail"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Send via Gmail</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyCompleteCredentials(issuedCredentials)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Message</span>
              </button>

              <button
                type="button"
                onClick={() => handlePrintEnforcerCredentials(issuedCredentials)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Official Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ENFORCER REMOVAL CONFIRMATION MODAL (Admin Passcode Protected) ── */}
      {enforcerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5 text-rose-700">
                <div className="p-2 rounded-xl bg-rose-50 border border-rose-200">
                  <Trash2 className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Remove Enforcer Account
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setEnforcerToDelete(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to remove Traffic Enforcer <strong className="text-slate-900 font-bold">{enforcerToDelete.badgeNumber} ({enforcerToDelete.name})</strong>? This will revoke mobile citation access.
            </p>

            <form onSubmit={handleConfirmDeleteEnforcer} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Enter Administrator Passcode to Confirm *
                </label>
                <input
                  type="password"
                  required
                  value={deletePasscode}
                  onChange={(e) => setDeletePasscode(e.target.value)}
                  placeholder="Enter administrator passcode"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEnforcerToDelete(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeletingEnforcer}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{isDeletingEnforcer ? 'Removing...' : 'Confirm Remove'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
