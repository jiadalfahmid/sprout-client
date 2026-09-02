import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  HiOutlineSparkles, 
  HiOutlineBell, 
  HiArrowLeft, 
  HiOutlineArrowsPointingOut, 
  HiOutlineArrowsPointingIn 
} from 'react-icons/hi2';
import { useAppContext } from '../../context/AppContext';
import { motion } from 'motion/react';
import { useTranslation } from '../../hooks/useTranslation';
import AuthModal from '../ui/AuthModal';

interface HeaderProps {
  onNotificationClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNotificationClick }) => {
  const { 
    user, 
    notifications, 
    isGoogleAuthenticated, 
    isGoogleLoading, 
    loginWithGoogle, 
  } = useAppContext();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      }
    } catch (e) {
      console.warn('Fullscreen toggle request was prevented or not permitted in current context:', e);
    }
  };

  const isHomePage = location.pathname === '/home' || location.pathname === '/';

  const renderUserAuthButton = () => (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsAuthModalOpen(true)}
        className="flex items-center gap-2 p-0.5 sm:p-1 sm:pl-2 sm:pr-1 rounded-full border-0 sm:border sm:border-slate-200 dark:sm:border-zinc-700 bg-transparent sm:bg-light-surface/60 dark:sm:bg-surface/60 hover:bg-slate-100 dark:hover:bg-zinc-700/70 transition-colors"
        title={isGoogleAuthenticated ? `Signed in as ${user.email || user.name}` : 'Sign in / Account'}
      >
        <span className="text-xs font-medium hidden sm:inline-block max-w-[100px] truncate text-light-text-primary dark:text-text-primary">
          {user.name.split(' ')[0]}
        </span>
        <div className="relative">
          <img 
            src={user.avatar} 
            alt="User Avatar" 
            className="w-7 h-7 rounded-full bg-surface border border-primary/50 object-cover" 
          />
          {isGoogleAuthenticated ? (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-800" title="Account connected & synced">
              <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </span>
          ) : (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-amber-500 ring-2 ring-white dark:ring-zinc-800" title="Guest mode — not synced" />
          )}
        </div>
      </motion.button>
    </div>
  );

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-light-surface/80 dark:bg-surface/80 backdrop-blur-sm z-40 border-b border-slate-200 dark:border-zinc-700/50">
        {isHomePage ? (
          <div className="flex items-center justify-between h-full px-4 md:px-6">
            <div className="flex items-center gap-2">
              <HiOutlineSparkles className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold text-light-text-primary dark:text-text-primary">{t('appName')}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {!isGoogleAuthenticated && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsAuthModalOpen(true)}
                  disabled={isGoogleLoading}
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-zinc-700 border border-slate-300 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 shadow-xs hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  {isGoogleLoading ? t('auth.connecting') : t('auth.googleSignIn')}
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleFullscreen}
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary transition-colors"
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
              >
                {isFullscreen ? (
                  <HiOutlineArrowsPointingIn className="h-5 w-5" />
                ) : (
                  <HiOutlineArrowsPointingOut className="h-5 w-5" />
                )}
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onNotificationClick} 
                className="relative p-2 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 text-light-text-primary dark:text-text-primary transition-colors"
                aria-label="Open notifications"
              >
                <HiOutlineBell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
              </motion.button>
              {renderUserAuthButton()}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between h-full px-4 md:px-6">
            <div className="flex items-center gap-2">
              <motion.button 
                onClick={() => navigate(-1)} 
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 text-light-text-primary dark:text-text-primary transition-colors"
                aria-label="Go back"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <HiArrowLeft className="h-5 w-5" />
              </motion.button>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleFullscreen}
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary transition-colors"
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
              >
                {isFullscreen ? (
                  <HiOutlineArrowsPointingIn className="h-5 w-5" />
                ) : (
                  <HiOutlineArrowsPointingOut className="h-5 w-5" />
                )}
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onNotificationClick} 
                className="relative p-2 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 text-light-text-primary dark:text-text-primary transition-colors"
                aria-label="Open notifications"
              >
                <HiOutlineBell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
              </motion.button>
              {renderUserAuthButton()}
            </div>
          </div>
        )}
      </header>

      {/* Unified Auth & Firebase Profile Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
};

export default Header;
