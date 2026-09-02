import React, { ReactNode, useState, useEffect } from 'react';
import BottomNav from './navigation/BottomNav';
import Header from './navigation/Header';
import { useAppContext } from '../context/AppContext';
import NotificationDrawer from './navigation/NotificationDrawer';
import { HiOutlineWifi, HiOutlineSparkles } from 'react-icons/hi2';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isDrawerOpen, openDrawer, closeDrawer } = useAppContext();
  const [isOnline, setIsOnline] = useState<boolean>(() => 
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-light-background dark:bg-background font-sans text-light-text-primary dark:text-text-primary flex flex-col items-center">
      <NotificationDrawer isOpen={isDrawerOpen} onClose={closeDrawer} />
      <Header onNotificationClick={openDrawer} />

      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="w-full bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-500/20 py-1.5 px-4 text-center text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center justify-center gap-2 z-20 sticky top-16">
          <HiOutlineWifi className="w-4 h-4 text-amber-500 animate-pulse" />
          <span>Offline Mode: You are viewing cached local data. Changes will sync once reconnected.</span>
        </div>
      )}

      {/* Reconnected Toast Indicator */}
      {showReconnected && isOnline && (
        <div className="w-full bg-emerald-500/10 dark:bg-emerald-500/15 border-b border-emerald-500/20 py-1.5 px-4 text-center text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-2 z-20 sticky top-16 transition-all">
          <HiOutlineSparkles className="w-4 h-4 text-emerald-500" />
          <span>Back Online — Connected to real-time cloud sync.</span>
        </div>
      )}
      
      {/* Responsive container: compact on mobile, full-width up to max-w-7xl on desktop */}
      <div className="w-full max-w-7xl mx-auto flex-1 pt-16 pb-24 px-3 sm:px-4 md:px-6 lg:px-8">
        <main className="py-2 sm:py-3">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
};

export default Layout;
