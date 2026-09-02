import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext, availableCurrencies } from '../context/AppContext';
import { 
  HiOutlineSparkles, 
  HiOutlineShieldCheck, 
  HiOutlineCalendarDays, 
  HiOutlineBell, 
  HiOutlineUsers, 
  HiOutlineArrowRight,
  HiOutlineHeart,
  HiOutlineCurrencyDollar,
  HiOutlineLockClosed,
  HiOutlineEnvelope,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineBolt,
  HiOutlineArrowPath,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
  HiOutlineScale,
  HiOutlineBanknotes,
  HiOutlineCheck,
  HiOutlineShoppingBag
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
    pendingInvite,
    theme, 
    toggleTheme,
    currency
  } = useAppContext();

  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>(pendingInvite ? 'signup' : 'login');
  const [email, setEmail] = useState(pendingInvite?.recipientEmail || '');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(pendingInvite?.memberName || '');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currencySymbol = availableCurrencies.find(c => c.code === currency)?.symbol || '৳';

  // Sync state if pendingInvite arrives after render
  useEffect(() => {
    if (pendingInvite) {
      if (pendingInvite.recipientEmail && !email) {
        setEmail(pendingInvite.recipientEmail);
      }
      if (pendingInvite.memberName && !name) {
        setName(pendingInvite.memberName);
      }
    }
  }, [pendingInvite]);

  const handleGoogleSignIn = async () => {
    try {
      setSubmitting(true);
      const success = await loginWithGoogle();
      if (success) {
        toast.success('Welcome to Sprout!');
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return;
      }
      console.error(err);
      toast.error('Google sign-in was cancelled or blocked by the browser.');
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
      console.error(err);
      toast.error('Authentication failed. Please check your details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const features = [
    {
      icon: PiPill,
      title: 'Smart Medicine & Dose Tracker',
      description: 'Timed daily schedules, low stock restock alerts, and complete taken/missed logs per family member.',
      colorClass: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30',
    },
    {
      icon: HiOutlineCurrencyDollar,
      title: 'Unified Household Finances',
      description: 'Track monthly income, recurring bills, debt repayments, and personal savings goals in one view.',
      colorClass: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30',
    },
    {
      icon: HiOutlineUsers,
      title: 'Family Medical Profiles',
      description: 'Emergency contacts, blood types, chronic allergies, prescriptions, and direct doctor appointment bookings.',
      colorClass: 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30',
    },
    {
      icon: HiOutlineCalendarDays,
      title: 'Google Calendar & Cloud Sync',
      description: '2-way synchronization for doctor visits and bill dues, plus 1-click Gmail invitations for family members.',
      colorClass: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30',
    },
  ];

  return (
    <div className="min-h-screen bg-light-background dark:bg-background text-light-text-primary dark:text-text-primary transition-colors duration-200 font-sans">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-light-surface/80 dark:bg-surface/80 border-b border-slate-200 dark:border-zinc-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-xs">
              <HiOutlineSparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight flex items-center gap-1.5 text-light-text-primary dark:text-text-primary">
                Sprout
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 dark:bg-primary/20 text-primary border border-primary/30">
                  Care Hub
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-700/60 transition"
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <HiOutlineSun className="w-5 h-5" /> : <HiOutlineMoon className="w-5 h-5" />}
            </button>

            {onEnterGuest && (
              <button
                onClick={onEnterGuest}
                className="hidden sm:inline-flex px-3.5 py-1.5 rounded-xl text-xs font-semibold text-light-text-secondary dark:text-text-secondary hover:text-primary dark:hover:text-primary hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
              >
                Demo / Guest Mode
              </button>
            )}

            <button
              onClick={() => {
                setAuthMode('signup');
                const el = document.getElementById('auth-card');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-8 sm:pt-12 pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Left Column: Brand Story & Live Dashboard Sneak Peek */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 dark:bg-primary/15 border border-primary/25 text-primary text-xs font-semibold">
                <HiOutlineBolt className="w-4 h-4 text-primary" />
                <span>Unified Family Health, Care & Home Finance</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.18] text-light-text-primary dark:text-text-primary">
                All Your Family's <span className="text-primary">Health</span>, <span className="text-emerald-500">Finances</span> & <span className="text-blue-500">Care</span> in One Living Hub.
              </h1>

              <p className="text-sm sm:text-base text-light-text-secondary dark:text-text-secondary max-w-2xl leading-relaxed">
                Take the guesswork out of household management. Track daily medications, doctor visits, household budgets, savings, and shared chores with seamless Google Calendar sync and real-time cloud backup.
              </p>

              {/* Interactive Dashboard UI Preview (matching user's screenshot styles) */}
              <div className="p-5 sm:p-6 rounded-3xl bg-light-surface dark:bg-surface border border-slate-200 dark:border-zinc-700/60 shadow-lg space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-700/50 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-light-text-primary dark:text-text-primary uppercase tracking-wider">Live Household Overview</span>
                  </div>
                  <span className="text-[11px] font-medium text-light-text-secondary dark:text-text-secondary">Synced with Cloud</span>
                </div>

                {/* 4 Financial Stat Cards (Styled exactly like Screenshot 2) */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {/* Total Income */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80 space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center">
                      <HiOutlineArrowTrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-lg sm:text-xl font-bold text-emerald-500 dark:text-emerald-400">
                        {currencySymbol}3,450.00
                      </div>
                      <div className="text-[11px] font-medium text-light-text-secondary dark:text-text-secondary">
                        Total Income
                      </div>
                    </div>
                  </div>

                  {/* Total Expenses */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80 space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 flex items-center justify-center">
                      <HiOutlineArrowTrendingDown className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-lg sm:text-xl font-bold text-rose-500 dark:text-rose-400">
                        {currencySymbol}1,280.00
                      </div>
                      <div className="text-[11px] font-medium text-light-text-secondary dark:text-text-secondary">
                        Total Expenses
                      </div>
                    </div>
                  </div>

                  {/* Remaining Balance */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80 space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 flex items-center justify-center">
                      <HiOutlineBanknotes className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-lg sm:text-xl font-bold text-light-text-primary dark:text-text-primary">
                        {currencySymbol}2,170.00
                      </div>
                      <div className="text-[11px] font-medium text-light-text-secondary dark:text-text-secondary">
                        Remaining Balance
                      </div>
                    </div>
                  </div>

                  {/* Savings Rate */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80 space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30 flex items-center justify-center">
                      <HiOutlineScale className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-lg sm:text-xl font-bold text-teal-500 dark:text-teal-400">
                        62.8%
                      </div>
                      <div className="text-[11px] font-medium text-light-text-secondary dark:text-text-secondary">
                        Savings Rate
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Care Snapshot */}
                <div className="p-3.5 rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/15 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center">
                      <PiPill className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-light-text-primary dark:text-text-primary block">Amoxicillin 500mg</span>
                      <span className="text-[11px] text-light-text-secondary dark:text-text-secondary">Next dose: 2:00 PM • After Meal</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] border border-emerald-300 dark:border-emerald-800">
                    On Schedule
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Authentication Card */}
            <div className="lg:col-span-5" id="auth-card">
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-light-surface dark:bg-surface border border-slate-200 dark:border-zinc-700/60 rounded-3xl p-6 sm:p-8 shadow-xl relative"
              >
                {/* Header of Auth Box */}
                <div className="text-center mb-6">
                  <div className="inline-flex p-3 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/25 text-primary mb-3 shadow-xs">
                    <HiOutlineLockClosed className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-light-text-primary dark:text-text-primary">
                    {pendingInvite ? `Join ${pendingInvite.inviterName}'s Family` : (
                      authMode === 'login' ? 'Sign in to Sprout' :
                      authMode === 'signup' ? 'Create Your Living Hub' :
                      'Reset Your Password'
                    )}
                  </h2>
                  <p className="text-xs text-light-text-secondary dark:text-text-secondary mt-1">
                    {pendingInvite ? `Collaborate securely as ${pendingInvite.memberName} (${pendingInvite.relation})` : (
                      authMode === 'login' ? 'Access your synced family records, medicines & money' :
                      authMode === 'signup' ? 'Get started with real-time cloud synchronization' :
                      'Enter your email to receive a secure recovery link'
                    )}
                  </p>
                </div>

                {/* Pending Invitation Alert */}
                {pendingInvite && (
                  <div className="mb-5 p-3.5 rounded-2xl bg-primary/10 dark:bg-primary/15 border border-primary/25 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-primary">
                      <HiOutlineSparkles className="w-4 h-4 shrink-0" />
                      <span>Family Invite Ready to Connect</span>
                    </div>
                    <p className="text-light-text-secondary dark:text-text-secondary text-[11px] leading-relaxed">
                      Signing in with Google or creating an account with <strong>{pendingInvite.recipientEmail || 'your email'}</strong> will instantly link your profile with <strong>{pendingInvite.inviterName}</strong>.
                    </p>
                  </div>
                )}

                {/* Tab Switcher */}
                {authMode !== 'forgot' && (
                  <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-zinc-800/80 rounded-2xl mb-6 border border-slate-200/50 dark:border-zinc-700/50">
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className={`py-2 text-xs font-bold rounded-xl transition-all ${
                        authMode === 'login'
                          ? 'bg-light-surface dark:bg-zinc-700 text-primary shadow-xs'
                          : 'text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('signup')}
                      className={`py-2 text-xs font-bold rounded-xl transition-all ${
                        authMode === 'signup'
                          ? 'bg-light-surface dark:bg-zinc-700 text-primary shadow-xs'
                          : 'text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary'
                      }`}
                    >
                      Create Account
                    </button>
                  </div>
                )}

                {/* 1-Click Google Sign In */}
                {authMode !== 'forgot' && (
                  <div className="space-y-4 mb-5">
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={submitting || isGoogleLoading}
                      className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-2xl bg-white dark:bg-zinc-800/90 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 font-semibold text-xs transition shadow-xs disabled:opacity-60"
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
                      <div className="border-t border-slate-200 dark:border-zinc-700/80 w-full" />
                      <span className="bg-light-surface dark:bg-surface px-3 text-[11px] font-semibold uppercase tracking-wider text-light-text-secondary dark:text-text-secondary absolute">
                        or with email
                      </span>
                    </div>
                  </div>
                )}

                {/* Email Form */}
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-xs font-semibold text-light-text-primary dark:text-text-primary mb-1">
                        Your Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Alex Morgan"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-light-text-primary dark:text-text-primary mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <HiOutlineEnvelope className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  {authMode !== 'forgot' && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-light-text-primary dark:text-text-primary">
                          Password
                        </label>
                        {authMode === 'login' && (
                          <button
                            type="button"
                            onClick={() => setAuthMode('forgot')}
                            className="text-[11px] font-semibold text-primary hover:underline"
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
                          className="w-full px-4 pr-10 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
                        >
                          {showPassword ? <HiOutlineEyeSlash className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 sm:py-3 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-md shadow-primary/20 transition flex items-center justify-center gap-2 disabled:opacity-60"
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
                    className="w-full mt-4 text-center text-xs font-semibold text-light-text-secondary hover:text-light-text-primary dark:text-text-secondary dark:hover:text-text-primary transition"
                  >
                    ← Back to Sign In
                  </button>
                )}

                {/* Guest / Demo Explorer CTA */}
                {onEnterGuest && (
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-700/60">
                    <button
                      type="button"
                      onClick={onEnterGuest}
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/40 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/60 text-xs font-semibold text-light-text-primary dark:text-text-primary transition group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center">
                          <HiOutlineSparkles className="w-4 h-4" />
                        </div>
                        <span>Explore with Demo Data (Guest Mode)</span>
                      </div>
                      <HiOutlineArrowRight className="w-4 h-4 text-light-text-secondary dark:text-text-secondary group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid with Squircle Icon Cards */}
      <section className="py-14 bg-light-surface dark:bg-surface/50 border-t border-slate-200 dark:border-zinc-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-light-text-primary dark:text-text-primary">
              Built for Real Everyday Family Life
            </h2>
            <p className="text-xs sm:text-sm text-light-text-secondary dark:text-text-secondary mt-1.5">
              Everything your household needs across health, schedules, appointments, and money in unified sync.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className="p-5 rounded-3xl bg-light-surface dark:bg-surface border border-slate-200 dark:border-zinc-700/60 space-y-3.5 hover:border-primary/40 transition-colors shadow-xs"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs ${f.colorClass}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-sm text-light-text-primary dark:text-text-primary">
                  {f.title}
                </h3>
                <p className="text-xs leading-relaxed text-light-text-secondary dark:text-text-secondary">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-light-text-secondary dark:text-text-secondary border-t border-slate-200 dark:border-zinc-800 space-y-2">
        <div className="flex items-center justify-center gap-4 font-medium">
          <Link to="/privacy" className="hover:text-primary transition underline-offset-4 hover:underline">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link to="/terms" className="hover:text-primary transition underline-offset-4 hover:underline">
            Terms of Service
          </Link>
        </div>
        <p>© {new Date().getFullYear()} Sprout • Unified Home & Family Care</p>
      </footer>
    </div>
  );
};

export default LandingPage;

