import React, { useState } from 'react';
import { Eye, EyeOff, Check, X, Copy, ExternalLink, ShieldAlert, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthScreenProps {
  onSuccess?: () => void;
}

export const PhoneLoginScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const { 
    loginWithGoogle, 
    loginWithEmail, 
    signupWithEmail, 
    resetPassword,
    loginWithDemo 
  } = useAuth();
  
  // View mode: 'signin' | 'signup' | 'forgot'
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Unauthorized Domain helper state
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [hasCopiedDomain, setHasCopiedDomain] = useState(false);

  // Clean error messages to hide technical Firebase naming and raw error codes
  const sanitizeAuthError = (err: any, fallback = 'Authentication failed. Please try again.'): string => {
    if (!err) return fallback;

    const code = (err?.code || '').toLowerCase();
    const rawMsg = (err?.message || (typeof err === 'string' ? err : '')).trim();

    // 1. Explicit code matching for clear, friendly messages
    if (code.includes('user-disabled') || rawMsg.includes('user-disabled')) {
      return 'This account has been disabled. Please contact support or sign in with another account.';
    }
    if (
      code.includes('user-not-found') || 
      code.includes('wrong-password') || 
      code.includes('invalid-credential') ||
      rawMsg.includes('user-not-found') ||
      rawMsg.includes('wrong-password') ||
      rawMsg.includes('invalid-credential')
    ) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (code.includes('email-already-in-use')) {
      return 'This email address is already registered. Please sign in instead.';
    }
    if (code.includes('invalid-email')) {
      return 'Please provide a valid email address.';
    }
    if (code.includes('weak-password')) {
      return 'Password is too weak. Please use at least 8 characters with letters, numbers, and symbols.';
    }
    if (code.includes('too-many-requests') || rawMsg.includes('too-many-requests')) {
      return 'Access temporarily locked due to multiple failed attempts. Please reset your password or try again in a few minutes.';
    }
    if (code.includes('popup-closed-by-user')) {
      return 'Sign in cancelled: The popup window was closed before completion.';
    }
    if (code.includes('popup-blocked')) {
      return 'The sign-in popup was blocked by your browser. Please allow popups or use email sign-in.';
    }
    if (code.includes('operation-not-allowed')) {
      return 'This sign-in method is currently disabled. Please sign in using email and password.';
    }
    if (code.includes('network-request-failed')) {
      return 'Network connection error. Please verify your internet connection and try again.';
    }
    if (code.includes('expired-action-code')) {
      return 'The verification or reset link has expired. Please request a new link.';
    }
    if (code.includes('invalid-action-code')) {
      return 'The reset link is invalid or has already been used.';
    }

    // 2. General sanitizer: strip "Firebase: Error (auth/...)", "Firebase: ", etc.
    if (rawMsg) {
      const clean = rawMsg
        .replace(/^Firebase:\s*(Error\s*)?/gi, '')
        .replace(/\(auth\/[a-z0-9-]+\)\.?/gi, '')
        .replace(/\[auth\/[a-z0-9-]+\]/gi, '')
        .replace(/Firebase/gi, 'Authentication Service')
        .trim();

      if (clean && clean.length > 3 && !clean.toLowerCase().includes('auth/')) {
        return clean.charAt(0).toUpperCase() + clean.slice(1);
      }
    }

    return fallback;
  };

  // Strong password rule checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password);
  const isPasswordStrong = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
  const doPasswordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  // Copy current domain helper
  const handleCopyDomain = () => {
    if (!unauthorizedDomain) return;
    navigator.clipboard.writeText(unauthorizedDomain);
    setHasCopiedDomain(true);
    setTimeout(() => setHasCopiedDomain(false), 2500);
  };

  // Switch to email signin with pre-fill
  const handleUseEmailInstead = () => {
    if (!email) {
      setEmail('nderitus368@gmail.com');
    }
    setUnauthorizedDomain(null);
    setErrorMessage(null);
  };

  // Handle Continue with Google
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setUnauthorizedDomain(null);
    setIsGoogleLoading(true);

    try {
      await loginWithGoogle();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      const code = err?.code || '';

      if (code === 'auth/unauthorized-domain') {
        // OAuth requires the Cloud Run hostname to be authorized in Console
        const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
        setUnauthorizedDomain(currentHostname || 'ais-dev-6fbiw7s64izlqyolenrutu-395139546537.europe-west2.run.app');
      } else if (code === 'auth/cancelled-popup-request') {
        // Ignored
      } else {
        setErrorMessage(sanitizeAuthError(err, 'Failed to sign in with Google. Please try again or use email.'));
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Handle Email/Password Form Submit
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    if (authMode === 'signup') {
      // Strong password validation
      if (!isPasswordStrong) {
        if (!hasMinLength) {
          setErrorMessage('Password must be at least 8 characters long.');
        } else if (!hasUppercase) {
          setErrorMessage('Password must contain at least one uppercase letter (A-Z).');
        } else if (!hasLowercase) {
          setErrorMessage('Password must contain at least one lowercase letter (a-z).');
        } else if (!hasNumber) {
          setErrorMessage('Password must contain at least one number (0-9).');
        } else if (!hasSpecialChar) {
          setErrorMessage('Password must contain at least one special symbol (!@#$%^&* etc.).');
        } else {
          setErrorMessage('Please ensure your password meets all strong password requirements.');
        }
        return;
      }

      // Password matching validation
      if (!confirmPassword) {
        setErrorMessage('Please confirm your password.');
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please verify both passwords match.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (authMode === 'signup') {
        await signupWithEmail(cleanEmail, password);
      } else {
        await loginWithEmail(cleanEmail, password);
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Email auth error:', err);
      setErrorMessage(sanitizeAuthError(err, 'Authentication failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot Password Reset Email
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address to receive reset instructions.');
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(cleanEmail);
      setSuccessMessage(`Password reset link sent to ${cleanEmail}. Please check your inbox or spam folder.`);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setErrorMessage(sanitizeAuthError(err, 'Failed to send password reset email.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-y-contain bg-[#07090e] text-slate-100 flex flex-col items-center justify-start sm:justify-center px-3.5 sm:px-6 py-6 sm:py-12 pb-20 font-sans">
      
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />
      
      {/* Glowing Ambient Lights */}
      <div className="absolute -top-40 -left-40 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-emerald-500/10 rounded-full blur-[90px] sm:blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-cyan-500/10 rounded-full blur-[90px] sm:blur-[120px] pointer-events-none" />

      {/* Trading Chart Background Graphics (Candlestick & Line Charts) */}
      <div className="absolute inset-0 w-full h-full opacity-[0.08] sm:opacity-[0.12] pointer-events-none select-none flex items-center justify-center overflow-hidden">
        <svg className="w-full h-full max-w-7xl" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Candlestick Green Group */}
          <g opacity="0.8">
            <rect x="150" y="320" width="12" height="180" rx="2" fill="#10B981" />
            <line x1="156" y1="280" x2="156" y2="540" stroke="#10B981" strokeWidth="2" />
            <rect x="250" y="240" width="12" height="120" rx="2" fill="#10B981" />
            <line x1="256" y1="180" x2="256" y2="400" stroke="#10B981" strokeWidth="2" />
            <rect x="350" y="290" width="12" height="90" rx="2" fill="#EF4444" />
            <line x1="356" y1="250" x2="356" y2="420" stroke="#EF4444" strokeWidth="2" />
            <rect x="1050" y="180" width="12" height="220" rx="2" fill="#10B981" />
            <line x1="1056" y1="130" x2="1056" y2="450" stroke="#10B981" strokeWidth="2" />
            <rect x="1150" y="280" width="12" height="140" rx="2" fill="#EF4444" />
            <line x1="1156" y1="220" x2="1156" y2="480" stroke="#EF4444" strokeWidth="2" />
          </g>

          {/* Glowing Trend Line Chart */}
          <path d="M-50 650 L 200 520 L 450 580 L 720 410 L 980 490 L 1200 290 L 1500 340" stroke="url(#lineGradient)" strokeWidth="3" strokeLinecap="round" />
          <path d="M-50 650 L 200 520 L 450 580 L 720 410 L 980 490 L 1200 290 L 1500 340 L 1500 900 L -50 900 Z" fill="url(#areaGradient)" />

          {/* Supporting Tech Signals */}
          <circle cx="720" cy="410" r="6" fill="#10B981" />
          <circle cx="720" cy="410" r="16" stroke="#10B981" strokeWidth="2" className="animate-ping" style={{ transformOrigin: '720px 410px' }} />
          
          <circle cx="1200" cy="290" r="6" fill="#06B6D4" />
          <circle cx="1200" cy="290" r="16" stroke="#06B6D4" strokeWidth="2" className="animate-ping" style={{ transformOrigin: '1200px 290px' }} />

          {/* Gradients */}
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="w-full max-w-md z-10 my-auto py-2 sm:py-4">
        
        {/* Brand Header */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-flex items-center justify-center p-1 bg-[#131722] rounded-2xl border border-slate-800 shadow-xl mb-3">
            <img 
              src="/logo.png" 
              alt="OTIVO Logo" 
              className="w-12 h-12 sm:w-16 sm:h-16 object-contain rounded-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://placehold.co/128x128/10b981/ffffff?text=O';
              }}
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wider bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            OTIVO
          </h1>
          <p className="text-[11px] sm:text-xs tracking-widest text-slate-400 uppercase font-semibold mt-1">
            Trading View Platform
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-[#131722]/95 backdrop-blur-xl border border-slate-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl relative">
          
          {/* Mobile-Friendly Top Mode Switcher Tabs */}
          {(authMode === 'signin' || authMode === 'signup') && (
            <div className="flex p-1 bg-[#0c1017] rounded-xl border border-slate-800/90 mb-5">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setUnauthorizedDomain(null);
                  setAuthMode('signin');
                }}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer text-center min-h-[36px] flex items-center justify-center ${
                  authMode === 'signin'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setUnauthorizedDomain(null);
                  setAuthMode('signup');
                }}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer text-center min-h-[36px] flex items-center justify-center ${
                  authMode === 'signup'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* ACTIONABLE MODAL/CARD: Unauthorized Domain Helper */}
          {unauthorizedDomain && (
            <div className="mb-5 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-300 text-sm">
                    Domain Authorization Required
                  </h4>
                  <p className="text-[11px] text-amber-200/80 mt-0.5 leading-relaxed">
                    Google popup sign-in requires this app domain to be registered in your authorization settings.
                  </p>
                </div>
              </div>

              {/* Hostname Copy Block */}
              <div className="p-2 sm:p-2.5 bg-[#090c12] rounded-xl border border-amber-500/20 flex items-center justify-between gap-2">
                <code className="text-[10px] sm:text-[11px] text-amber-100 font-mono truncate select-all">
                  {unauthorizedDomain}
                </code>
                <button
                  type="button"
                  onClick={handleCopyDomain}
                  className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold rounded-lg text-[10px] flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                >
                  {hasCopiedDomain ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick instructions & Direct Console Link */}
              <div className="text-[11px] text-slate-300 space-y-1.5 pt-1">
                <p className="font-medium text-amber-200">To authorize in 30 seconds:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-slate-400 text-[11px]">
                  <li>Open Authentication Settings</li>
                  <li>Go to <span className="text-slate-200 font-medium">Authorized domains</span> &gt; <span className="text-slate-200 font-medium">Add domain</span></li>
                  <li>Paste the domain and click Done</li>
                </ol>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <a
                  href="https://console.firebase.google.com/project/studio-1256110026-44ab5/authentication/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-center text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm min-h-[40px]"
                >
                  <span>Open Auth Settings</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={handleUseEmailInstead}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer min-h-[40px]"
                >
                  Use Email / Password Instead
                </button>
              </div>

              {/* Instant Test Bypass */}
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => {
                    loginWithDemo();
                    if (onSuccess) onSuccess();
                  }}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-mono cursor-pointer py-1 inline-block"
                >
                  ⚡ Instant Preview Pass (Test Terminal Immediately)
                </button>
              </div>
            </div>
          )}

          {/* Standard Error Alert Box */}
          {errorMessage && (
            <div className="mb-5 p-3 sm:p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start sm:items-center gap-2.5 sm:gap-3 text-rose-400 text-sm animate-in fade-in duration-200">
              <svg className="w-5 h-5 shrink-0 mt-0.5 sm:mt-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-xs leading-relaxed">{sanitizeAuthError(errorMessage)}</span>
            </div>
          )}

          {/* Success Alert Box */}
          {successMessage && (
            <div className="mb-5 p-3 sm:p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start sm:items-center gap-2.5 sm:gap-3 text-emerald-400 text-sm animate-in fade-in duration-200">
              <svg className="w-5 h-5 shrink-0 mt-0.5 sm:mt-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-xs leading-relaxed">{successMessage}</span>
            </div>
          )}

          {/* PRIMARY FLOW: EMAIL SIGN IN / SIGN UP */}
          {(authMode === 'signin' || authMode === 'signup') && (
            <>
              {/* CONTINUE WITH GOOGLE BUTTON (PRIMARY & HIGH VISIBILITY) */}
              <button 
                type="button" 
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isLoading}
                className="w-full min-h-[46px] py-3 px-4 bg-[#1e222d] hover:bg-slate-800 active:bg-slate-700/80 border border-slate-700/50 hover:border-slate-600 text-slate-200 font-medium rounded-xl transition-all flex items-center justify-center gap-3 cursor-pointer shadow-md disabled:opacity-50 active:scale-[0.99] mb-3 sm:mb-4"
              >
                {isGoogleLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-slate-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-sm">Connecting Google Account...</span>
                  </>
                ) : (
                  <>
                    {/* Google Icon */}
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span className="text-sm font-semibold">
                      {authMode === 'signup' ? 'Continue with Google' : 'Continue with Google'}
                    </span>
                  </>
                )}
              </button>

              {/* OR DIVIDER */}
              <div className="relative flex py-2 sm:py-3 items-center mb-3.5 sm:mb-4">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-slate-500 text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
                  or with email
                </span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                {/* Email Input */}
                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                      </svg>
                    </div>
                    <input 
                      type="email" 
                      inputMode="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com" 
                      disabled={isLoading || isGoogleLoading}
                      className="w-full pl-10 sm:pl-11 pr-4 py-3 bg-[#1e222d] border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-base sm:text-sm disabled:opacity-50 min-h-[46px]"
                      required
                    />
                  </div>
                </div>

                {/* Password Input with Hide/Unhide Icon */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Password
                    </label>
                    {authMode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage(null);
                          setSuccessMessage(null);
                          setUnauthorizedDomain(null);
                          setAuthMode('forgot');
                        }}
                        className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer py-1"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" 
                      disabled={isLoading || isGoogleLoading}
                      className="w-full pl-10 sm:pl-11 pr-11 py-3 bg-[#1e222d] border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-base sm:text-sm disabled:opacity-50 font-mono tracking-wider min-h-[46px]"
                      required
                    />
                    {/* Show/Hide Password Toggle Button */}
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 sm:pr-3.5 flex items-center justify-center min-w-[44px] text-slate-400 hover:text-slate-200 focus:outline-none cursor-pointer transition-colors"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password (Sign up only) with Hide/Unhide Icon */}
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input 
                        type={showConfirmPassword ? 'text' : 'password'} 
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••" 
                        disabled={isLoading || isGoogleLoading}
                        className={`w-full pl-10 sm:pl-11 pr-11 py-3 bg-[#1e222d] border rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none transition-all text-base sm:text-sm disabled:opacity-50 font-mono tracking-wider min-h-[46px] ${
                          confirmPassword.length > 0
                            ? doPasswordsMatch
                              ? 'border-emerald-500/70 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                              : 'border-rose-500/70 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                            : 'border-slate-700/60 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                        }`}
                        required
                      />
                      {/* Show/Hide Confirm Password Toggle Button */}
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 sm:pr-3.5 flex items-center justify-center min-w-[44px] text-slate-400 hover:text-slate-200 focus:outline-none cursor-pointer transition-colors"
                        title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Real-time Strong Password Checklist & Match Indicator */}
                    <div className="mt-2.5 p-2.5 sm:p-3 bg-[#0c1017] rounded-xl border border-slate-800 space-y-1 text-[11px]">
                      <div className="font-semibold text-slate-300 text-xs mb-1 flex items-center justify-between">
                        <span>Password Requirements</span>
                        {isPasswordStrong && doPasswordsMatch && (
                          <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                            <Check className="w-3.5 h-3.5" /> All criteria met
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10.5px] sm:text-[11px]">
                        <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {hasMinLength ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />}
                          <span className="truncate">8+ chars</span>
                        </div>

                        <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {hasUppercase ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />}
                          <span className="truncate">Uppercase (A-Z)</span>
                        </div>

                        <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {hasLowercase ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />}
                          <span className="truncate">Lowercase (a-z)</span>
                        </div>

                        <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {hasNumber ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />}
                          <span className="truncate">Number (0-9)</span>
                        </div>

                        <div className={`flex items-center gap-1.5 ${hasSpecialChar ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {hasSpecialChar ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />}
                          <span className="truncate">Symbol (!@#$)</span>
                        </div>

                        <div className={`flex items-center gap-1.5 ${doPasswordsMatch ? 'text-emerald-400' : confirmPassword.length > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                          {doPasswordsMatch ? (
                            <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                          ) : confirmPassword.length > 0 ? (
                            <X className="w-3 h-3 text-rose-400 shrink-0" />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
                          )}
                          <span className="truncate">Match</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button 
                  type="submit" 
                  disabled={isLoading || isGoogleLoading}
                  className="w-full min-h-[48px] py-3.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 active:scale-[0.99] disabled:bg-emerald-500/60 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-3 text-sm sm:text-base"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>{authMode === 'signup' ? 'Creating Account...' : 'Signing In...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{authMode === 'signup' ? 'Create Account' : 'Sign In'}</span>
                      <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              {/* REGISTRATION FOOTER */}
              <div className="text-center mt-5 sm:mt-6">
                <p className="text-xs text-slate-400">
                  {authMode === 'signin' ? (
                    <>
                      New to the terminal?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage(null);
                          setSuccessMessage(null);
                          setUnauthorizedDomain(null);
                          setAuthMode('signup');
                        }}
                        className="text-emerald-400 hover:text-emerald-300 font-semibold underline transition-colors cursor-pointer py-1"
                      >
                        Create an account
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage(null);
                          setSuccessMessage(null);
                          setUnauthorizedDomain(null);
                          setAuthMode('signin');
                        }}
                        className="text-emerald-400 hover:text-emerald-300 font-semibold underline transition-colors cursor-pointer py-1"
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </p>
              </div>
            </>
          )}

          {/* FORGOT PASSWORD FORM */}
          {authMode === 'forgot' && (
            <form onSubmit={handlePasswordReset} className="space-y-4 sm:space-y-5">
              <div className="text-center mb-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-100">Reset Your Password</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your email address to receive password reset instructions.
                </p>
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                    </svg>
                  </div>
                  <input 
                    type="email" 
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com" 
                    disabled={isLoading}
                    className="w-full pl-10 sm:pl-11 pr-4 py-3 bg-[#1e222d] border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-base sm:text-sm disabled:opacity-50 min-h-[46px]"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full min-h-[48px] py-3.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 disabled:bg-emerald-500/60 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
              >
                {isLoading ? 'Sending reset link...' : 'Send Password Reset Email'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setUnauthorizedDomain(null);
                    setAuthMode('signin');
                  }}
                  className="text-xs sm:text-sm text-slate-400 hover:text-slate-200 transition-colors cursor-pointer py-2 inline-block"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Security Footer */}
        <div className="mt-5 sm:mt-6 mb-2 flex items-center justify-center gap-2 text-[11px] sm:text-xs text-slate-500">
          <svg className="w-4 h-4 text-emerald-500/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Encrypted OTIVO Financial Protocol</span>
        </div>
      </div>
    </div>
  );
};
