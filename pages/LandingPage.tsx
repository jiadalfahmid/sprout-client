import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { 
  HiOutlineSparkles, 
  HiOutlineShieldCheck, 
  HiOutlineCalendarDays, 
  HiOutlineBell, 
  HiOutlineUsers, 
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineHeart,
  HiOutlineCurrencyDollar,
  HiOutlineLockClosed,
  HiOutlineEnvelope,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineBolt,
  HiOutlineArrowPath
} from 'react-icons/hi2';
import { PiPill } from 'react-icons/pi';
import toast from 'react-hot-toast';

interface LandingPageProps {
  onEnterGuest?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnterGuest }) => {
  const { 
    loginWithGoogle, 
    loginWithEmail, 
    signUpWithEmail, 
    resetUserPassword,
    isGoogleLoading,
    theme,
    toggleTheme 
  } = useAppContext();

  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setSubmitting(true);
      const success = await loginWithGoogle();
      if (success) {
        toast.success('Welcome to Sprout!');
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // User voluntarily dismissed popup
        return;
      }
      toast.error(err.message || 'Google sign-in was cancelled or blocked by the browser.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }

    setSubmitting(true);

    try {
      if (authMode === 'login') {
        if (!password) {
          toast.error('Please enter your password.');
          setSubmitting(false);
          return;
        }
        await loginWithEmail(email, password);
        toast.success('Welcome back to Sprout!');
      } else if (authMode === 'signup') {
        if (!password || password.length < 6) {
          toast.error('Password must be at least 6 characters long.');
          setSubmitting(false);
          return;
        }
        await signUpWithEmail(email, password, name || undefined);
        toast.success('Account created successfully! Welcome to Sprout.');
      } else if (authMode === 'forgot') {
        await resetUserPassword(email);
        toast.success('Password reset link sent to your email.');
        setAuthMode('login');
      }
    } catch (err: any) {
      const msg = err.code ? err.code.replace('auth/', '').replace(/-/g, ' ') : err.message;
      toast.error(`Authentication error: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const features = [
    {
      icon: PiPill,
      title: 'Smart Medicine & Dose Tracker',
      description: 'Never miss a dose. Timed daily schedules, low stock restock alerts, and complete taken/missed logs per family member.',
      color: 'from-blue-500/20 to-cyan-500/20 text-blue-500',
    },
    {
      icon: HiOutlineUsers,
      title: 'Family Medical Records',
      description: 'Centralize emergency contacts, blood types, chronic allergies, prescriptions, and direct doctor appointment bookings.',
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-500',
    },
    {
      icon: HiOutlineCurrencyDollar,
      title: 'Unified Household Finances',
      description: 'Monitor monthly income & expenses, track upcoming bills with overdue warnings, and manage debt repayments and savings goals.',
      color: 'from-amber-500/20 to-yellow-500/20 text-amber-500',
    },
    {
      icon: HiOutlineCalendarDays,
      title: 'Google Calendar & Gmail Sync',
      description: '2-way synchronization with Google Calendar for medical visits and bill dues, plus 1-click Gmail invitations for family members.',
      color: 'from-purple-500/20 to-indigo-500/20 text-purple-500',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#121417] text-slate-900 dark:text-zinc-100 transition-colors duration-200">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 dark:bg-[#181a1f]/80 border-b border-slate-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              <HiOutlineSparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight flex items-center gap-1.5">
                Sprout
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Live Cloud
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            <button
              onClick={() => {
                setAuthMode('login');
                const el = document.getElementById('auth-card');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hidden sm:inline-flex px-4 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
            >
              Sign In
            </button>

            <button
              onClick={() => {
                setAuthMode('signup');
                const el = document.getElementById('auth-card');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition"
            >
              Create Account
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                <HiOutlineBolt className="w-4 h-4 text-emerald-500" />
                <span>Production-Ready Firebase Cloud Sync & Real-Time Alerts</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-slate-900 dark:text-white">
                All Your Family's <span className="text-emerald-500">Health, Care</span> & <span className="text-blue-500">Finances</span> in One Living Hub.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Take the anxiety out of managing loved ones. Track daily medications, doctor visits, household bills, debts, and tasks with Google Calendar integration and Firebase cloud storage.
              </p>

              {/* Quick Trust Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white dark:bg-[#1a1d24] border border-slate-200/80 dark:border-zinc-800 shadow-xs">
                  <HiOutlineShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200">Encrypted Firestore DB</span>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white dark:bg-[#1a1d24] border border-slate-200/80 dark:border-zinc-800 shadow-xs">
                  <HiOutlineCalendarDays className="w-5 h-5 text-blue-500 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200">Google Calendar 2-Way</span>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white dark:bg-[#1a1d24] border border-slate-200/80 dark:border-zinc-800 shadow-xs">
                  <HiOutlineBell className="w-5 h-5 text-amber-500 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200">Live Audio & Push Alerts</span>
                </div>
              </div>
            </div>

            {/* Right Interactive Auth Card */}
            <div className="lg:col-span-5" id="auth-card">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white dark:bg-[#1a1d24] border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl relative"
              >
                {/* Header of Auth Box */}
                <div className="text-center mb-6">
                  <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 mb-3">
                    <HiOutlineLockClosed className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {authMode === 'login' && 'Sign in to Sprout'}
                    {authMode === 'signup' && 'Create Your Personal Hub'}
                    {authMode === 'forgot' && 'Reset Your Password'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                    {authMode === 'login' && 'Access all your synced family records and medicines'}
                    {authMode === 'signup' && 'Start fresh with your own personal cloud database'}
                    {authMode === 'forgot' && 'Enter your registered email to receive a secure link'}
                  </p>
                </div>

                {/* Tab Switcher */}
                {authMode !== 'forgot' && (
                  <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-zinc-800/80 rounded-2xl mb-6">
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className={`py-2 text-xs font-bold rounded-xl transition-all ${
                        authMode === 'login'
                          ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('signup')}
                      className={`py-2 text-xs font-bold rounded-xl transition-all ${
                        authMode === 'signup'
                          ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      New Account
                    </button>
                  </div>
                )}

                {/* 1-Click Google Sign In */}
                {authMode !== 'forgot' && (
                  <div className="space-y-4 mb-6">
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={submitting || isGoogleLoading}
                      className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-300 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700/80 font-semibold text-xs transition shadow-xs disabled:opacity-60"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      <span>{isGoogleLoading || submitting ? 'Connecting Google Account...' : 'Continue with Google'}</span>
                    </button>

                    <div className="relative flex items-center justify-center">
                      <div className="border-t border-slate-200 dark:border-zinc-700 w-full" />
                      <span className="bg-white dark:bg-[#1a1d24] px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 absolute">
                        or with email
                      </span>
                    </div>
                  </div>
                )}

                {/* Email Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                        Your Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Alex Morgan"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <HiOutlineEnvelope className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {authMode !== 'forgot' && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                          Password
                        </label>
                        {authMode === 'login' && (
                          <button
                            type="button"
                            onClick={() => setAuthMode('forgot')}
                            className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            Forgot Password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-4 pr-10 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
                        >
                          {showPassword ? <HiOutlineEyeSlash className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <HiOutlineArrowPath className="w-4 h-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>
                          {authMode === 'login' && 'Sign In to Dashboard'}
                          {authMode === 'signup' && 'Create Account & Enter'}
                          {authMode === 'forgot' && 'Send Reset Email'}
                        </span>
                        <HiOutlineArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Back to sign in from forgot password */}
                {authMode === 'forgot' && (
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="w-full mt-4 text-center text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 transition"
                  >
                    ← Back to Sign In
                  </button>
                )}

                {/* Guest explorer mode if provided */}
                {onEnterGuest && (
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800 text-center">
                    <button
                      type="button"
                      onClick={onEnterGuest}
                      className="text-xs font-medium text-slate-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 transition"
                    >
                      Or explore as Guest / Demo Mode →
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-16 bg-white dark:bg-[#17191e] border-y border-slate-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Engineered for Complete Household Harmony
            </h2>
            <p className="text-sm text-slate-600 dark:text-zinc-400 mt-2">
              Everything your family needs across health, schedules, appointments, and money in unified sync.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="p-6 rounded-3xl bg-slate-50 dark:bg-[#1e2129] border border-slate-200/80 dark:border-zinc-800/80 space-y-4 hover:border-emerald-500/50 transition-colors"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {f.title}
                </h3>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-zinc-400">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-slate-500 dark:text-zinc-500">
        <p>© {new Date().getFullYear()} Sprout • Unified Home & Family Care. Powered by Firebase Firestore.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
