import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { FamilyInvite } from '../types';
import { 
  HiOutlineSparkles, 
  HiOutlineShieldCheck, 
  HiOutlineUsers, 
  HiOutlineCalendarDays, 
  HiOutlineHeart, 
  HiOutlineLockClosed,
  HiOutlineEnvelope,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineCheck,
  HiOutlineEye,
  HiOutlineEyeSlash
} from 'react-icons/hi2';
import { PiPill } from 'react-icons/pi';
import toast from 'react-hot-toast';

const JoinFamilyPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const routeParams = useParams<{ inviteId?: string }>();
  
  const inviteIdFromUrl = routeParams.inviteId || searchParams.get('inviteId');

  const { 
    getInviteDetails, 
    acceptPendingInvite, 
    pendingInvite, 
    googleFirebaseUser, 
    user,
    loginWithGoogle,
    loginWithEmail,
    signUpWithEmail,
    logout,
    isGoogleLoading 
  } = useAppContext();

  const [invite, setInvite] = useState<FamilyInvite | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [authMode, setAuthMode] = useState<'google' | 'signup' | 'login'>('google');
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load and resolve invite data
  useEffect(() => {
    let isMounted = true;

    async function loadInvite() {
      setLoadingInvite(true);
      const targetId = inviteIdFromUrl || pendingInvite?.id;

      if (!targetId) {
        if (pendingInvite) {
          setInvite(pendingInvite);
        }
        setLoadingInvite(false);
        return;
      }

      try {
        const remoteDoc = await getInviteDetails(targetId);
        if (isMounted) {
          if (remoteDoc) {
            setInvite(remoteDoc);
            if (remoteDoc.recipientEmail && !email) {
              setEmail(remoteDoc.recipientEmail);
            }
            if (remoteDoc.memberName && !name) {
              setName(remoteDoc.memberName);
            }
          } else {
            setInvite(null);
          }
        }
      } catch (err) {
        console.error('Error loading invite details:', err);
        if (isMounted) setInvite(null);
      } finally {
        if (isMounted) setLoadingInvite(false);
      }
    }

    loadInvite();
    return () => { isMounted = false; };
  }, [inviteIdFromUrl, pendingInvite, getInviteDetails]);

  const isAuthenticated = Boolean(googleFirebaseUser?.uid || user.googleId || user.firebaseUid);

  const handleAcceptInvite = async () => {
    if (!invite) return;
    setIsProcessing(true);
    try {
      await acceptPendingInvite(invite);
      navigate('/family');
    } catch (err) {
      console.error('Accept invite error:', err);
      toast.error('Failed to accept invitation. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoogleJoin = async () => {
    setIsProcessing(true);
    try {
      const success = await loginWithGoogle();
      if (success && invite) {
        await acceptPendingInvite(invite);
        navigate('/family');
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return;
      }
      console.error(err);
      toast.error('Google sign-in was cancelled or blocked.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    setIsProcessing(true);
    try {
      if (authMode === 'signup') {
        const success = await signUpWithEmail(email, password, name || invite?.memberName || undefined);
        if (success && invite) {
          await acceptPendingInvite(invite);
          navigate('/family');
        }
      } else {
        const success = await loginWithEmail(email, password);
        if (success && invite) {
          await acceptPendingInvite(invite);
          navigate('/family');
        }
      }
    } catch (err: any) {
      console.error('Auth error on join:', err);
      toast.error(err?.message || 'Authentication failed. Please verify your details.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-6 px-3 sm:px-6">
      <div className="w-full max-w-xl">
        {loadingInvite ? (
          <div className="bg-light-surface dark:bg-surface border border-slate-200 dark:border-zinc-700/60 rounded-3xl p-8 text-center space-y-4 animate-pulse shadow-xl">
            <div className="w-14 h-14 bg-primary/20 rounded-2xl mx-auto" />
            <div className="h-6 bg-slate-200 dark:bg-zinc-700 rounded-xl w-3/4 mx-auto" />
            <div className="h-4 bg-slate-100 dark:bg-zinc-800 rounded-lg w-1/2 mx-auto" />
          </div>
        ) : !invite ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-light-surface dark:bg-surface border border-slate-200 dark:border-zinc-700/60 rounded-3xl p-8 text-center space-y-5 shadow-xl"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
              <HiOutlineExclamationTriangle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-light-text-primary dark:text-text-primary">
                This invite link is invalid or has expired
              </h2>
              <p className="text-xs text-light-text-secondary dark:text-text-secondary mt-1.5 max-w-sm mx-auto leading-relaxed">
                We could not verify this invitation in our system. The link may have expired, been cancelled, or is invalid. Please ask your family organizer for an updated invite link.
              </p>
            </div>
            <Link
              to="/home"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-hover transition"
            >
              <span>Go to Sprout Home</span>
              <HiOutlineArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-light-surface dark:bg-surface border border-slate-200 dark:border-zinc-700/60 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden"
          >
            {/* Top Accent Gradient Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-primary" />

            {/* Header / Inviter Badge */}
            <div className="text-center mb-6">
              <div className="inline-flex p-3.5 rounded-2xl bg-primary/10 dark:bg-primary/20 border border-primary/25 text-primary mb-3 shadow-xs">
                <HiOutlineUsers className="w-7 h-7" />
              </div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-primary mb-1">
                Family Circle Invitation
              </span>
              <h1 className="text-2xl font-bold text-light-text-primary dark:text-text-primary">
                Join {invite.inviterName}'s Family
              </h1>
              <p className="text-xs text-light-text-secondary dark:text-text-secondary mt-1.5">
                You've been invited to collaborate securely on medication, schedule, and home care.
              </p>
            </div>

            {/* Role & Details Card */}
            <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60 space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/50 dark:border-zinc-700/50">
                <span className="text-light-text-secondary dark:text-text-secondary">Assigned Member:</span>
                <span className="font-bold text-light-text-primary dark:text-text-primary">
                  {invite.memberName || 'Family Member'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/50 dark:border-zinc-700/50">
                <span className="text-light-text-secondary dark:text-text-secondary">Family Role:</span>
                <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-bold text-[11px]">
                  {invite.relation || 'Member'}
                </span>
              </div>
              {invite.inviterEmail && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-light-text-secondary dark:text-text-secondary">Inviter Email:</span>
                  <span className="font-medium text-light-text-primary dark:text-text-primary">
                    {invite.inviterEmail}
                  </span>
                </div>
              )}
              {invite.customMessage && (
                <div className="p-2.5 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 text-xs italic text-light-text-secondary dark:text-text-secondary">
                  "{invite.customMessage}"
                </div>
              )}
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-2 gap-2.5 mb-6 text-[11px] text-light-text-secondary dark:text-text-secondary">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/50 dark:bg-zinc-800/40 border border-slate-200/40 dark:border-zinc-700/40">
                <PiPill className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="truncate">Medicine Reminders</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/50 dark:bg-zinc-800/40 border border-slate-200/40 dark:border-zinc-700/40">
                <HiOutlineCalendarDays className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="truncate">Calendar & Visits</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/50 dark:bg-zinc-800/40 border border-slate-200/40 dark:border-zinc-700/40">
                <HiOutlineSparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="truncate">Family Tasks</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/50 dark:bg-zinc-800/40 border border-slate-200/40 dark:border-zinc-700/40">
                <HiOutlineShieldCheck className="w-4 h-4 text-purple-500 shrink-0" />
                <span className="truncate">Synced Records</span>
              </div>
            </div>

            {/* Action State: Already Authenticated vs Unauthenticated */}
            {isAuthenticated ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 flex items-start gap-3">
                  <HiOutlineCheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-emerald-700 dark:text-emerald-300">
                      Signed in as {user.name || googleFirebaseUser?.displayName || 'User'}
                    </p>
                    <p className="text-emerald-600/90 dark:text-emerald-400/90 text-[11px] mt-0.5">
                      {user.email || googleFirebaseUser?.email}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAcceptInvite}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-md transition disabled:opacity-60"
                >
                  {isProcessing ? (
                    <span>Linking Family Account...</span>
                  ) : (
                    <>
                      <span>Accept Invitation & Join Circle</span>
                      <HiOutlineArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={async () => {
                      await logout();
                      toast('Signed out. You can now connect with another account.');
                    }}
                    className="text-[11px] text-light-text-secondary dark:text-text-secondary hover:text-red-500 transition underline underline-offset-2"
                  >
                    Switch to a different account
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 1-Click Google Sign In */}
                <button
                  type="button"
                  onClick={handleGoogleJoin}
                  disabled={isProcessing || isGoogleLoading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-white dark:bg-zinc-800/90 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 font-semibold text-xs transition shadow-xs disabled:opacity-60"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>{isGoogleLoading || isProcessing ? 'Connecting Google Account...' : 'Continue with Google & Join'}</span>
                </button>

                <div className="relative flex items-center justify-center my-2">
                  <div className="border-t border-slate-200 dark:border-zinc-700/80 w-full" />
                  <span className="bg-light-surface dark:bg-surface px-3 text-[11px] font-semibold uppercase tracking-wider text-light-text-secondary dark:text-text-secondary absolute">
                    or create account
                  </span>
                </div>

                {/* Switcher for Email Auth */}
                <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-zinc-800/80 rounded-2xl border border-slate-200/50 dark:border-zinc-700/50">
                  <button
                    type="button"
                    onClick={() => setAuthMode('signup')}
                    className={`py-1.5 text-xs font-bold rounded-xl transition ${
                      authMode === 'signup'
                        ? 'bg-light-surface dark:bg-zinc-700 text-primary shadow-xs'
                        : 'text-light-text-secondary dark:text-text-secondary'
                    }`}
                  >
                    Create Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className={`py-1.5 text-xs font-bold rounded-xl transition ${
                      authMode === 'login'
                        ? 'bg-light-surface dark:bg-zinc-700 text-primary shadow-xs'
                        : 'text-light-text-secondary dark:text-text-secondary'
                    }`}
                  >
                    Sign In
                  </button>
                </div>

                {/* Email Form */}
                <form onSubmit={handleEmailAuthSubmit} className="space-y-3">
                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-light-text-primary dark:text-text-primary mb-1">
                        Your Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Alex Morgan"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs text-light-text-primary dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary transition"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-light-text-primary dark:text-text-primary mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs text-light-text-primary dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-light-text-primary dark:text-text-primary mb-1">
                      Password (min 6 characters)
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3.5 py-2 pr-9 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs text-light-text-primary dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <HiOutlineEyeSlash className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-md transition disabled:opacity-60"
                  >
                    {isProcessing ? 'Connecting...' : authMode === 'signup' ? 'Create Account & Join Family' : 'Sign In & Join Family'}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default JoinFamilyPage;
