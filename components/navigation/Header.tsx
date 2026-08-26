import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HiOutlineSparkles, HiOutlineBell, HiArrowLeft } from 'react-icons/hi2';
import { useAppContext } from '../../context/AppContext';
import { motion } from 'framer-motion';
import { useTranslation } from '../../hooks/useTranslation';

interface HeaderProps {
  onNotificationClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNotificationClick }) => {
  const { user, notifications } = useAppContext();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const unreadCount = notifications.filter(n => !n.read).length;

  const getPageTitle = (pathname: string): string => {
    if (pathname.startsWith('/family/')) {
        return t('medicalProfile.title');
    }
    const pageTitles: { [key: string]: string } = {
      '/finance': t('nav.finance'),
      '/calendar': t('nav.calendar'),
      '/health': t('nav.health'),
      '/settings': t('nav.settings'),
      '/family': t('family.title'),
      '/tasks': t('tasks.title'),
      '/restock': t('restock.cartTitle'),
      '/settings/medicines': t('settings.manageMedicines'),
      '/settings/appointments': t('settings.manageAppointments'),
    };
    return pageTitles[pathname] || '';
  };

  const isHomePage = location.pathname === '/home' || location.pathname === '/';
  const pageTitle = getPageTitle(location.pathname);

  // The home page has a distinct header.
  if (isHomePage) {
    return (
      <header className="fixed top-0 left-0 right-0 h-16 bg-light-surface/80 dark:bg-surface/80 backdrop-blur-sm z-40 border-b border-slate-200 dark:border-zinc-700/50">
        <div className="flex items-center justify-between h-full px-4 md:px-6">
          <div className="flex items-center gap-2">
            <HiOutlineSparkles className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-light-text-primary dark:text-text-primary">{t('appName')}</span>
          </div>
          <div className="flex items-center gap-4">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onNotificationClick} 
              className="relative p-2 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700"
              aria-label="Open notifications"
            >
              <HiOutlineBell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </motion.button>
            <img src={user.avatar} alt="User Avatar" className="w-9 h-9 rounded-full bg-surface border-2 border-primary/50" />
          </div>
        </div>
      </header>
    );
  }

  // All other pages have a contextual header with a back button and title.
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-light-surface/80 dark:bg-surface/80 backdrop-blur-sm z-40 border-b border-slate-200 dark:border-zinc-700/50">
      <div className="grid grid-cols-3 items-center h-full px-4 md:px-6">
        <div className="justify-self-start">
          <motion.button 
            onClick={() => navigate(-1)} 
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700"
            aria-label="Go back"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <HiArrowLeft className="h-6 w-6" />
          </motion.button>
        </div>
        <div className="justify-self-center text-center">
          <h1 className="text-xl font-bold text-light-text-primary dark:text-text-primary truncate">{pageTitle}</h1>
        </div>
        <div className="justify-self-end flex items-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onNotificationClick} 
            className="relative p-2 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700"
            aria-label="Open notifications"
          >
            <HiOutlineBell className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </motion.button>
          <img src={user.avatar} alt="User Avatar" className="w-9 h-9 rounded-full bg-surface border-2 border-primary/50" />
        </div>
      </div>
    </header>
  );
};

export default Header;