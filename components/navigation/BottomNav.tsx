import React from 'react';
import { NavLink } from 'react-router-dom';
import { HiOutlineHome, HiOutlineChartPie, HiOutlineHeart, HiOutlineCog6Tooth, HiOutlineCalendarDays } from 'react-icons/hi2';
import { motion } from 'motion/react';
import { useTranslation } from '../../hooks/useTranslation';

const BottomNav: React.FC = () => {
  const { t } = useTranslation();

  const navItems = [
    { path: '/home', label: t('nav.home'), icon: HiOutlineHome, color: 'blue' },
    { path: '/finance', label: t('nav.finance'), icon: HiOutlineChartPie, color: 'purple' },
    { path: '/calendar', label: t('nav.calendar'), icon: HiOutlineCalendarDays, isCentral: true },
    { path: '/health', label: t('nav.health'), icon: HiOutlineHeart, color: 'red' },
    { path: '/settings', label: t('nav.settings'), icon: HiOutlineCog6Tooth, color: 'gray' },
  ];

  const activeColorClasses: Record<string, string> = {
    blue: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300',
    purple: 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300',
    red: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-300',
    gray: 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
  };

  const activeTextColorClasses: Record<string, string> = {
      blue: 'text-blue-600 dark:text-blue-300',
      purple: 'text-purple-600 dark:text-purple-300',
      red: 'text-red-600 dark:text-red-300',
      gray: 'text-slate-600 dark:text-slate-300',
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-light-surface dark:bg-surface border-t border-slate-200 dark:border-zinc-700/50 shadow-t-lg z-50">
      <div className="flex justify-around items-center h-full px-2 gap-1">
        {navItems.map(({ path, label, icon: Icon, isCentral, color }) => {
          if (isCentral) {
            return (
              <NavLink key={path} to={path} className="relative -top-4">
                {({isActive}) => (
                  <motion.div 
                    className="flex items-center justify-center h-16 w-16 bg-primary rounded-full shadow-lg border-4 border-light-surface dark:border-surface"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Icon className={`h-8 w-8 text-white transition-transform ${isActive ? 'scale-110' : ''}`} />
                  </motion.div>
                )}
              </NavLink>
            );
          }
          return (
            <NavLink
              key={path}
              to={path}
              className="flex flex-col items-center justify-center flex-1 py-1 text-center group"
            >
              {({ isActive }) => (
                <>
                  <div className={`w-12 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${isActive && color ? activeColorClasses[color] : 'bg-transparent'}`}>
                      <Icon className={`h-6 w-6 transition-colors ${isActive ? '' : 'text-light-text-secondary dark:text-text-secondary group-hover:text-primary'}`} />
                  </div>
                  <span className={`text-xs mt-1 font-medium transition-colors ${isActive && color ? activeTextColorClasses[color] : 'text-light-text-secondary dark:text-text-secondary group-hover:text-primary'}`}>{label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
