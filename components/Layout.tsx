import React, { ReactNode } from 'react';
import BottomNav from './navigation/BottomNav';
import Header from './navigation/Header';
import { Toaster } from 'react-hot-toast';
import { useAppContext } from '../context/AppContext';
import NotificationDrawer from './navigation/NotificationDrawer';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme, isDrawerOpen, openDrawer, closeDrawer } = useAppContext();

  return (
    <div className="min-h-screen bg-light-background dark:bg-background font-sans text-light-text-primary dark:text-text-primary">
       <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: theme === 'dark' ? '#27272A' : '#FFFFFF',
            color: theme === 'dark' ? '#FAFAFA' : '#1E293B',
            border: `1px solid ${theme === 'dark' ? '#3F3F46' : '#E2E8F0'}`
          },
        }}
      />
      <NotificationDrawer isOpen={isDrawerOpen} onClose={closeDrawer} />
      <Header onNotificationClick={openDrawer} />
      <div className="pt-20 pb-20"> {/* Padding top for header, bottom for nav */}
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export default Layout;
