import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HiOutlineEnvelope, 
  HiOutlineLockClosed, 
  HiOutlineUser, 
  HiOutlineSparkles,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineShieldCheck,
  HiOutlineCalendarDays,
  HiXMark
} from 'react-icons/hi2';
import Modal from './Modal';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthTab = 'login' | 'signup' | 'forgot' | 'profile';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { 
    user, 
    isGoogleAuthenticated, 
    googleFirebaseUser,
    isGoogleLoading, 
    loginWithGoogle, 
    loginWithEmail,
    signUpWithEmail,
    resetUserPassword,
    logout,
    fetchGoogleEvents,
    isCalendarSyncing,
    pendingInvite
  } = useAppContext();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<AuthTab>(isGoogleAuthenticated ? 'profile' : (pendingInvite ? 'signup' : 'login'));
  const [email, setEmail] = useState(pendingInvite?.recipientEmail || '');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(pendingInvite?.memberName || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pendingInvite) {
      if (pendingInvite.recipientEmail && !email) setEmail(pendingInvite.recipientEmail);
      if (pendingInvite.memberName && !displayName) setDisplayName(pendingInvite.memberName);
      if (!isGoogleAuthenticated) setActiveTab('signup');
    }
  }, [pendingInvite, isGoogleAuthenticated]);

  const handleGoogleSignIn = async () => {
    try {
      const ok = await loginWithGoogle();
      if (ok) {
        toast.success('Signed in with Google successfully!');
        onClose();
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return;
      }
      console.error(err);
      toast.error('Google sign-in failed');
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter your email and password');
      return;
    }
    setLoading(true);
    try {
      const ok = await loginWithEmail(email, password);
      if (ok) {
        toast.success('Welcome back!');
        onClose();
      } else {
        toast.error('Invalid email or password');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter your email and password');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const ok = await signUpWithEmail(email, password, displayName || undefined);
      if (ok) {
        toast.success('Account created successfully!');
        onClose();
      } else {
        toast.error('Could not create account');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      await resetUserPassword(email);
      toast.success('Password reset link sent to your email!');
      setActiveTab('login');
    } catch (err: any) {
      console.error(err);
      toast.error('Could not send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isGoogleAuthenticated 
          ? 'Account Profile' 
          : activeTab === 'login' 
            ? 'Sign In' 
            : activeTab === 'signup' 
              ? 'Create Account' 
              : 'Reset Password'
      }
    >
      <div className="space-y-4 pt-1">
        {isGoogleAuthenticated ? (
          /* Profile & Account Status */
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800/40">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-14 h-14 rounded-full border-2 border-emerald-500 object-cover bg-white shadow-xs"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-bold text-light-text-primary dark:text-text-primary truncate">
                  {user.name}
                </h4>
                <p className="text-xs text-light-text-secondary dark:text-text-secondary truncate">
                  {user.email || 'No email associated'}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/40 px-2.5 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                    <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                    Synced & Active
                  </span>
                </div>
              </div>
            </div>

            {/* Cloud Services Status */}
            <div className="rounded-xl bg-slate-50 dark:bg-zinc-800/60 p-3.5 border border-slate-200 dark:border-zinc-700 text-xs space-y-2.5">
              <div className="flex justify-between items-center text-light-text-secondary dark:text-text-secondary">
                <span className="flex items-center gap-1.5 font-medium">
                  <HiOutlineShieldCheck className="w-4 h-4 text-emerald-500" />
                  Cloud Database Sync:
                </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Connected</span>
              </div>
              <div className="flex justify-between items-center text-light-text-secondary dark:text-text-secondary">
                <span className="flex items-center gap-1.5 font-medium">
                  <HiOutlineCalendarDays className="w-4 h-4 text-blue-500" />
                  Google Calendar Sync:
                </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Active</span>
              </div>
              <div className="flex justify-between items-center text-light-text-secondary dark:text-text-secondary">
                <span className="flex items-center gap-1.5 font-medium">
                  <HiOutlineEnvelope className="w-4 h-4 text-purple-500" />
                  Family Email Invites:
                </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Enabled</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  fetchGoogleEvents();
                  toast.success('Syncing Google Calendar...');
                }}
                disabled={isCalendarSyncing}
                className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary-focus transition-colors shadow-sm disabled:opacity-50"
              >
                {isCalendarSyncing ? 'Syncing Calendar...' : 'Sync Google Calendar'}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-800/60 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          /* Sign In / Sign Up View */
          <div className="space-y-4">
            {pendingInvite && (
              <div className="p-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300">
                  <HiOutlineSparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Invitation from {pendingInvite.inviterName}</span>
                </div>
                <p className="text-slate-600 dark:text-zinc-300 text-[11px]">
                  Sign in or create an account to automatically link to <strong>{pendingInvite.inviterName}'s</strong> family group as <strong>{pendingInvite.memberName}</strong> ({pendingInvite.relation}).
                </p>
              </div>
            )}

            {/* Quick Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-2xl font-semibold text-xs text-slate-800 bg-white border border-slate-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 shadow-xs hover:bg-slate-50 dark:hover:bg-zinc-700/80 transition-all cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              {isGoogleLoading ? 'Connecting Google Account...' : 'Continue with Google'}
            </button>

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-slate-200 dark:border-zinc-700/80 w-full" />
              <span className="bg-light-surface dark:bg-surface px-3 text-[11px] font-semibold text-light-text-secondary dark:text-text-secondary uppercase tracking-wider">
                or with email
              </span>
            </div>

            {/* Tab Selector */}
            <div className="flex p-1 bg-slate-100 dark:bg-zinc-800 rounded-2xl border border-slate-200/50 dark:border-zinc-700/50">
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'login'
                    ? 'bg-light-surface dark:bg-zinc-700 text-primary shadow-xs'
                    : 'text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('signup')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'signup'
                    ? 'bg-light-surface dark:bg-zinc-700 text-primary shadow-xs'
                    : 'text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary'
                }`}
              >
                Create Account
              </button>
            </div>

            {activeTab === 'login' && (
              <form onSubmit={handleEmailSignIn} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-light-text-primary dark:text-text-primary mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <HiOutlineEnvelope className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-light-text-primary dark:text-text-primary">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveTab('forgot')}
                      className="text-[11px] font-semibold text-primary hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-primary text-white text-xs font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            )}

            {activeTab === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-light-text-primary dark:text-text-primary mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <HiOutlineUser className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Alex Morgan"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-light-text-primary dark:text-text-primary mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <HiOutlineEnvelope className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-light-text-primary dark:text-text-primary mb-1">
                    Password (min. 6 characters)
                  </label>
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-primary text-white text-xs font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            )}

            {activeTab === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <p className="text-xs text-light-text-secondary dark:text-text-secondary">
                  Enter your email address and we'll send you a password reset link.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <HiOutlineEnvelope className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-slate-600 text-xs focus:ring-2 focus:ring-primary focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="py-2 px-3 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-light-text-secondary dark:text-text-secondary"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-focus transition-all shadow-sm disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300">
              🔒 Your health and family data is encrypted and synced securely to your private account in real time.
            </div>

            <div className="pt-2 text-center text-[11px] text-light-text-secondary dark:text-text-secondary flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/privacy');
                }}
                className="hover:underline hover:text-primary transition"
              >
                Privacy Policy
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/terms');
                }}
                className="hover:underline hover:text-primary transition"
              >
                Terms of Service
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AuthModal;
