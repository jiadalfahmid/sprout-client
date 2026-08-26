import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { Notification } from '../../types';
import { 
  HiOutlineBell, 
  HiOutlineCheckCircle, 
  HiOutlineExclamationTriangle, 
  HiOutlineInformationCircle, 
  HiXMark, 
  HiOutlineHeart, 
  HiOutlineCurrencyDollar,
  HiOutlineSparkles,
  HiOutlineCheck,
  HiOutlineArrowRight,
  HiOutlineSpeakerWave,
  HiOutlineBeaker
} from 'react-icons/hi2';
import { useTranslation } from '../../hooks/useTranslation';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    clearNotifications, 
    deleteNotification,
    notificationSettings,
    requestBrowserNotifications,
    sendTestNotification,
    logDose
  } = useAppContext();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'health' | 'finance' | 'system'>('all');
  const navigate = useNavigate();

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    return n.domain === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
    switch (type) {
      case 'warning':
        return <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500"><HiOutlineExclamationTriangle className="h-5 w-5" /></div>;
      case 'success':
        return <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500"><HiOutlineCheckCircle className="h-5 w-5" /></div>;
      case 'info':
      default:
        return <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500"><HiOutlineInformationCircle className="h-5 w-5" /></div>;
    }
  };

  const timeSince = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}y ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}mo ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}m ago`;
    return 'Just now';
  };

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

  const FilterButton: React.FC<{ type: 'all' | 'health' | 'finance' | 'system'; icon?: React.ElementType; label: string }> = ({ type, icon: Icon, label }) => {
    const count = notifications.filter(n => type === 'all' ? true : n.domain === type).length;
    return (
      <button
        onClick={() => setFilter(type)}
        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
          filter === type 
            ? 'bg-primary text-white shadow-xs' 
            : 'bg-slate-100 dark:bg-zinc-800 text-light-text-secondary dark:text-text-secondary hover:bg-slate-200 dark:hover:bg-zinc-700'
        }`}
      >
        {Icon && <Icon className="h-3.5 w-3.5" />}
        <span>{label}</span>
        {count > 0 && (
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            filter === type ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-zinc-700 text-light-text-primary dark:text-text-primary'
          }`}>
            {count}
          </span>
        )}
      </button>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-light-surface dark:bg-surface shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-zinc-700"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-zinc-700 flex justify-between items-center bg-light-background/50 dark:bg-background/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <HiOutlineBell className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-light-text-primary dark:text-text-primary">
                    {t('notifications.title')}
                  </h2>
                  <p className="text-xs text-light-text-secondary dark:text-text-secondary">
                    {unreadCount > 0 ? `${unreadCount} unread alerts` : 'All alerts up to date'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 text-light-text-secondary dark:text-text-secondary"
              >
                <HiXMark className="h-5 w-5" />
              </button>
            </div>

            {/* Quick System Status Bar */}
            <div className="px-4 py-2 bg-emerald-50/70 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Alert Engine Active</span>
              </div>
              <div className="flex items-center gap-2">
                {!notificationSettings.browserPushEnabled && (
                  <button
                    onClick={() => requestBrowserNotifications()}
                    className="text-emerald-700 dark:text-emerald-300 underline font-semibold hover:text-emerald-800"
                  >
                    Enable Push
                  </button>
                )}
                <button
                  onClick={sendTestNotification}
                  className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 font-semibold hover:bg-emerald-200 dark:hover:bg-emerald-800/60"
                >
                  Test Alert
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="p-3 flex gap-2 overflow-x-auto border-b border-slate-200 dark:border-zinc-700 no-scrollbar">
              <FilterButton type="all" label={t('notifications.filterAll')} />
              <FilterButton type="health" icon={HiOutlineHeart} label={t('nav.health')} />
              <FilterButton type="finance" icon={HiOutlineCurrencyDollar} label={t('nav.finance')} />
              <FilterButton type="system" icon={HiOutlineSparkles} label="System" />
            </div>

            {/* Notification List */}
            {filteredNotifications.length > 0 ? (
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800">
                {filteredNotifications.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`relative p-4 flex gap-3.5 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/60 ${
                      !notif.read ? 'bg-primary/5 dark:bg-primary/10 font-medium' : ''
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <NotificationIcon type={notif.type} />
                    </div>

                    <div className="flex-1 min-w-0 pr-6">
                      <p className="text-xs text-light-text-primary dark:text-text-primary leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[10px] text-light-text-secondary dark:text-text-secondary">
                          {timeSince(notif.createdAt)}
                        </span>
                        {notif.domain && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-zinc-700 text-light-text-secondary dark:text-text-secondary uppercase tracking-wider font-semibold">
                            {notif.domain}
                          </span>
                        )}
                        {!notif.read && (
                          <span className="text-[10px] text-primary font-semibold flex items-center gap-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" /> New
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDismiss(e, notif.id)}
                      className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 text-light-text-secondary dark:text-text-secondary"
                      title="Dismiss notification"
                    >
                      <HiXMark className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-2">
                <div className="p-3 rounded-full bg-slate-100 dark:bg-zinc-800 text-light-text-secondary dark:text-text-secondary">
                  <HiOutlineCheck className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-light-text-primary dark:text-text-primary">
                  {t('notifications.allCaughtUp')}
                </p>
                <p className="text-xs text-light-text-secondary dark:text-text-secondary max-w-[220px]">
                  No active warnings or reminders in this category right now.
                </p>
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="p-3 border-t border-slate-200 dark:border-zinc-700 bg-light-background/60 dark:bg-background/60 flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex-1 py-2 text-xs font-semibold text-center text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors"
                >
                  {t('notifications.markAllRead')}
                </button>
              )}
              {filteredNotifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="flex-1 py-2 text-xs font-semibold text-center text-light-text-secondary dark:text-text-secondary hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Clear Read
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationDrawer;
