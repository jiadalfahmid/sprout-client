import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { HiOutlineBellAlert, HiOutlineCheckCircle, HiOutlineInformationCircle, HiXMark, HiOutlineHome, HiOutlineHeart, HiOutlineChartPie } from 'react-icons/hi2';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../hooks/useTranslation';
import { Notification } from '../../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationIcon = ({ type }: { type: 'info' | 'success' | 'warning' }) => {
  const iconWrapperClasses = "w-10 h-10 rounded-xl flex items-center justify-center";
  switch(type) {
    case 'warning': return <div className={`${iconWrapperClasses} bg-red-100 dark:bg-red-500/20`}><HiOutlineBellAlert className="h-6 w-6 text-red-500" /></div>;
    case 'info': return <div className={`${iconWrapperClasses} bg-yellow-100 dark:bg-yellow-500/20`}><HiOutlineInformationCircle className="h-6 w-6 text-yellow-500" /></div>;
    case 'success': return <div className={`${iconWrapperClasses} bg-blue-100 dark:bg-blue-500/20`}><HiOutlineCheckCircle className="h-6 w-6 text-blue-500" /></div>;
    default: return <div className={`${iconWrapperClasses} bg-slate-100 dark:bg-slate-500/20`}><HiOutlineInformationCircle className="h-6 w-6 text-slate-500" /></div>;
  }
};

type FilterType = 'all' | 'health' | 'finance' | 'system';

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { notifications, markAsRead, clearNotifications, deleteNotification } = useAppContext();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterType>('all');

  const handleNotificationClick = (notif: Notification) => {
    markAsRead(notif.id);
    if (notif.path) {
        navigate(notif.path);
        onClose();
    }
  };

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteNotification(id);
  };

  const timeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  }

  const filteredNotifications = notifications.filter(n => filter === 'all' || n.domain === filter);
  
  const FilterButton = ({ type, icon: Icon, label }: { type: FilterType, icon: React.ElementType, label: string }) => (
    <button
      onClick={() => setFilter(type)}
      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 ${filter === type ? 'bg-primary text-white shadow-lg' : 'text-light-text-secondary dark:text-text-secondary bg-slate-100 dark:bg-zinc-800'}`}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </button>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-light-surface dark:bg-surface z-50 shadow-2xl flex flex-col"
          >
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-zinc-700">
              <h2 className="text-xl font-bold">{t('notifications.title')}</h2>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700">
                <HiXMark className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-2 flex justify-center gap-2 border-b border-slate-200 dark:border-zinc-700">
                <FilterButton type="all" icon={HiOutlineHome} label={t('health.tabs.all')} />
                <FilterButton type="health" icon={HiOutlineHeart} label={t('nav.health')} />
                <FilterButton type="finance" icon={HiOutlineChartPie} label={t('nav.finance')} />
            </div>

            {filteredNotifications.length > 0 ? (
              <div className="flex-grow overflow-y-auto">
                <ul className="divide-y divide-slate-200 dark:divide-zinc-700">
                  {filteredNotifications.map(notif => (
                    <li key={notif.id} className={`relative p-4 flex gap-4 ${!notif.read ? 'bg-primary/5 dark:bg-primary/10' : ''} transition-colors duration-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800`} onClick={() => handleNotificationClick(notif)}>
                      <div className="flex-shrink-0">
                        <NotificationIcon type={notif.type} />
                      </div>
                      <div className="pr-4">
                        <p className="text-sm font-medium text-light-text-primary dark:text-text-primary">{notif.message}</p>
                        <p className="text-xs text-light-text-secondary dark:text-text-secondary">{timeSince(notif.createdAt)}</p>
                      </div>
                      {notif.type !== 'warning' && (
                        <button onClick={(e) => handleDismiss(e, notif.id)} className="absolute top-2 right-2 p-1 rounded-full hover:bg-slate-300 dark:hover:bg-zinc-600 transition-colors">
                            <HiXMark className="h-4 w-4 text-light-text-secondary dark:text-text-secondary" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex-grow flex items-center justify-center text-center p-4">
                <p className="text-light-text-secondary dark:text-text-secondary">{t('notifications.allCaughtUp')}</p>
              </div>
            )}
            
            {notifications.filter(n => !n.read).length > 0 && (
                <div className="p-2 border-t border-slate-200 dark:border-zinc-700">
                    <button onClick={clearNotifications} className="w-full py-2 text-sm text-center text-primary font-semibold rounded-lg hover:bg-primary/10">{t('notifications.markAllRead')}</button>
                </div>
            )}

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationDrawer;
