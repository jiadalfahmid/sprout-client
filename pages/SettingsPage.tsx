import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import PageHeader from '../components/ui/PageHeader';
import Skeleton from '../components/ui/Skeleton';
import AuthModal from '../components/ui/AuthModal';
import { uploadImage } from '../utils/imageUploader';
import { 
  HiOutlineUsers, 
  HiOutlineUserGroup,
  HiOutlineClipboardDocumentList,
  HiOutlinePaintBrush, 
  HiOutlineCurrencyDollar, 
  HiOutlineLanguage, 
  HiChevronRight,
  HiOutlinePencil, 
  HiOutlineCloudArrowUp, 
  HiOutlineBeaker, 
  HiOutlineCalendarDays, 
  HiCheck,
  HiOutlineBell,
  HiOutlineSpeakerWave,
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlineDocumentText,
  HiOutlineArrowPath,
  HiOutlineArrowsPointingOut,
  HiOutlineArrowsPointingIn
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { useTranslation } from '../hooks/useTranslation';

const SettingsPage = () => {
  const { 
    loading, 
    user, 
    updateUser, 
    theme, 
    toggleTheme, 
    currency, 
    updateCurrency, 
    availableCurrencies, 
    language, 
    updateLanguage, 
    availableLanguages,
    isGoogleAuthenticated,
    notificationSettings,
    updateNotificationSettings,
    requestBrowserNotifications,
    sendTestNotification,
    fetchGoogleEvents,
    isCalendarSyncing,
    seedSampleDataToCloud,
    clearAllUserData,
    logout,
    familyMembers,
    tasks
  } = useAppContext();
  const { t } = useTranslation();
  
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [isCurrencyModalOpen, setCurrencyModalOpen] = useState(false);
  const [isLanguageModalOpen, setLanguageModalOpen] = useState(false);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(() => 
    typeof document !== 'undefined' ? Boolean(document.fullscreenElement) : false
  );

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (e) {
      console.warn('Fullscreen toggle failed:', e);
    }
  };

  const selectedCurrency = useMemo(() => availableCurrencies.find(c => c.code === currency), [currency, availableCurrencies]);
  const selectedLanguage = useMemo(() => availableLanguages.find(l => l.code === language), [language, availableLanguages]);

  const handleProfileUpdate = async () => {
    setIsUploading(true);
    let avatarUrl = user.avatar;

    if (avatarFile) {
      toast.loading(t('settings.profile.uploadingAvatar'));
      const uploadedUrl = await uploadImage(avatarFile);
      toast.dismiss();
      if (uploadedUrl) {
        avatarUrl = uploadedUrl;
      } else {
        setIsUploading(false);
        return;
      }
    }
    
    updateUser({ name, avatar: avatarUrl });
    toast.success(t('settings.profile.profileUpdated'));
    setIsUploading(false);
    setProfileModalOpen(false);
    setAvatarFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const settingsItems = [
    { icon: HiOutlineUsers, label: t("settings.manageFamily"), to: "/family" },
    { icon: HiOutlineBeaker, label: t("settings.manageMedicines"), to: "/settings/medicines"},
    { icon: HiOutlineCalendarDays, label: t("settings.manageAppointments"), to: "/settings/appointments"},
    { icon: HiOutlineShieldCheck, label: "Privacy Policy", to: "/privacy"},
    { icon: HiOutlineDocumentText, label: "Terms of Service", to: "/terms"},
  ];

  const SettingItemWrapper: React.FC<{icon: React.ElementType, children: React.ReactNode}> = ({ icon: Icon, children }) => (
    <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-primary/10 text-primary shrink-0">
            <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">{children}</div>
    </div>
  );

  return (
    <div className="space-y-6 pb-8">
      <PageHeader 
        title={t('settings.title')}
      />

      {/* User Profile Card */}
      {loading ? (
        <Card className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <Skeleton className="w-14 h-14 sm:w-16 sm:h-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="w-8 h-8 rounded-full" />
        </Card>
      ) : (
        <Card className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <img src={user.avatar} alt={user.name} className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border border-primary/30" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-light-text-primary dark:text-text-primary">{user.name}</h2>
              <p className="text-xs text-light-text-secondary dark:text-text-secondary">
                {user.email || 'Local User Profile'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setProfileModalOpen(true)} 
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 transition"
              title="Edit Profile"
            >
              <HiOutlinePencil className="h-5 w-5 text-light-text-secondary dark:text-text-secondary"/>
            </button>
          </div>
        </Card>
      )}

      {/* Quick Access Hub: Family & Tasks (2-tap accessibility from anywhere) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link 
          to="/family" 
          className="group block p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-800/90 border border-slate-200 dark:border-zinc-700/80 shadow-xs hover:border-primary/40 dark:hover:border-primary/40 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-pink-500/10 text-pink-600 dark:text-pink-400 group-hover:scale-105 transition-transform shrink-0">
                <HiOutlineUserGroup className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-light-text-primary dark:text-text-primary">
                    {t('settings.familyHub')}
                  </h3>
                  {familyMembers?.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 dark:bg-pink-950/40 text-pink-600 dark:text-pink-300">
                      {familyMembers.length}
                    </span>
                  )}
                </div>
                <p className="text-xs text-light-text-secondary dark:text-text-secondary">
                  {t('settings.familyHubDesc')}
                </p>
              </div>
            </div>
            <HiChevronRight className="h-5 w-5 text-light-text-secondary dark:text-text-secondary group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>

        <Link 
          to="/tasks" 
          className="group block p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-800/90 border border-slate-200 dark:border-zinc-700/80 shadow-xs hover:border-primary/40 dark:hover:border-primary/40 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform shrink-0">
                <HiOutlineClipboardDocumentList className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-light-text-primary dark:text-text-primary">
                    {t('settings.tasksHub')}
                  </h3>
                  {tasks?.filter(t => !t.completed).length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300">
                      {tasks.filter(t => !t.completed).length}
                    </span>
                  )}
                </div>
                <p className="text-xs text-light-text-secondary dark:text-text-secondary">
                  {t('settings.tasksHubDesc')}
                </p>
              </div>
            </div>
            <HiChevronRight className="h-5 w-5 text-light-text-secondary dark:text-text-secondary group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>
      </div>

      {/* Firebase Cloud Authentication & Sync Section */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-500 shrink-0">
              <HiOutlineShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-light-text-primary dark:text-text-primary text-sm">
                Cloud Sync & Account Security
              </h3>
              <p className="text-xs text-light-text-secondary dark:text-text-secondary">
                {isGoogleAuthenticated ? 'Real-time multi-device synchronization active' : 'Sign in to enable automatic cloud backup'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setAuthModalOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary-focus transition-colors shadow-xs"
          >
            {isGoogleAuthenticated ? t('settings.manageAccount') : t('settings.signInConnect')}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/70">
            <span className="text-light-text-secondary dark:text-text-secondary block mb-1">{t('settings.cloudSync')}</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {isGoogleAuthenticated ? t('settings.active') : t('settings.offlineLocal')}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/70">
            <span className="text-light-text-secondary dark:text-text-secondary block mb-1">{t('settings.googleCalendar')}</span>
            <span className="font-semibold text-light-text-primary dark:text-text-primary flex items-center justify-between">
              <span>{isGoogleAuthenticated ? t('settings.connected') : t('settings.signInToSync')}</span>
              {isGoogleAuthenticated && (
                <button
                  onClick={() => fetchGoogleEvents()}
                  disabled={isCalendarSyncing}
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  <HiOutlineArrowPath className={`w-3.5 h-3.5 ${isCalendarSyncing ? 'animate-spin' : ''}`} />
                  {t('settings.sync')}
                </button>
              )}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/70">
            <span className="text-light-text-secondary dark:text-text-secondary block mb-1">{t('settings.familyInvites')}</span>
            <span className="font-semibold text-light-text-primary dark:text-text-primary">
              {isGoogleAuthenticated ? t('settings.readyToSend') : t('settings.signInToSend')}
            </span>
          </div>
        </div>
      </Card>

      {/* Connected Notification System Preferences */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-500 shrink-0">
              <HiOutlineBell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-light-text-primary dark:text-text-primary text-sm">
                Real-Time Notification System
              </h3>
              <p className="text-xs text-light-text-secondary dark:text-text-secondary">
                Configure smart medicine doses, restock reminders, and bill alerts
              </p>
            </div>
          </div>

          <button
            onClick={sendTestNotification}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors"
          >
            Send Test Alert
          </button>
        </div>

        <ul className="divide-y divide-slate-200 dark:divide-zinc-700/70 text-sm">
          {/* Browser Push Notifications */}
          <li className="py-2.5 sm:py-3 flex justify-between items-center gap-3">
            <div className="min-w-0">
              <span className="font-medium text-light-text-primary dark:text-text-primary block text-xs sm:text-sm">
                Browser Push Notifications
              </span>
              <span className="text-[11px] sm:text-xs text-light-text-secondary dark:text-text-secondary">
                Receive notifications even when Sprout is in the background
              </span>
            </div>
            <button
              onClick={() => {
                if (!notificationSettings.browserPushEnabled) {
                  requestBrowserNotifications();
                } else {
                  updateNotificationSettings({ browserPushEnabled: false });
                  toast.success('Browser notifications disabled');
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                notificationSettings.browserPushEnabled
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-slate-200 dark:bg-zinc-700 text-light-text-secondary dark:text-text-secondary'
              }`}
            >
              {notificationSettings.browserPushEnabled ? 'Enabled' : 'Enable'}
            </button>
          </li>

          {/* Medicine & Dose Reminders */}
          <li className="py-2.5 sm:py-3 flex justify-between items-center gap-3">
            <div className="min-w-0">
              <span className="font-medium text-light-text-primary dark:text-text-primary block text-xs sm:text-sm">
                Medicine & Dose Alerts
              </span>
              <span className="text-[11px] sm:text-xs text-light-text-secondary dark:text-text-secondary">
                Reminders when it's time to take prescribed medications
              </span>
            </div>
            <label htmlFor="medicine-alerts-toggle" className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                id="medicine-alerts-toggle" 
                className="sr-only peer" 
                checked={notificationSettings.medicineReminders} 
                onChange={(e) => updateNotificationSettings({ medicineReminders: e.target.checked })} 
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-zinc-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </li>

          {/* Low Stock Warning */}
          <li className="py-2.5 sm:py-3 flex justify-between items-center gap-3">
            <div className="min-w-0">
              <span className="font-medium text-light-text-primary dark:text-text-primary block text-xs sm:text-sm">
                Low Medicine Stock Warnings
              </span>
              <span className="text-[11px] sm:text-xs text-light-text-secondary dark:text-text-secondary">
                Alert when medicine inventory drops below restock threshold
              </span>
            </div>
            <label htmlFor="lowstock-alerts-toggle" className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                id="lowstock-alerts-toggle" 
                className="sr-only peer" 
                checked={notificationSettings.lowStockAlerts} 
                onChange={(e) => updateNotificationSettings({ lowStockAlerts: e.target.checked })} 
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-zinc-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </li>

          {/* Bill Due Reminders */}
          <li className="py-2.5 sm:py-3 flex justify-between items-center gap-3">
            <div className="min-w-0">
              <span className="font-medium text-light-text-primary dark:text-text-primary block text-xs sm:text-sm">
                Bill Due Date Alerts
              </span>
              <span className="text-[11px] sm:text-xs text-light-text-secondary dark:text-text-secondary">
                Warn 3 days before utilities, rent, or credit card bills are due
              </span>
            </div>
            <label htmlFor="bill-alerts-toggle" className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                id="bill-alerts-toggle" 
                className="sr-only peer" 
                checked={notificationSettings.billAlerts} 
                onChange={(e) => updateNotificationSettings({ billAlerts: e.target.checked })} 
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-zinc-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </li>

          {/* Sound Alerts */}
          <li className="py-2.5 sm:py-3 flex justify-between items-center gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <HiOutlineSpeakerWave className="h-4 w-4 text-light-text-secondary dark:text-text-secondary shrink-0" />
              <div className="min-w-0">
                <span className="font-medium text-light-text-primary dark:text-text-primary block text-xs sm:text-sm">
                  Audio Sound Effects
                </span>
                <span className="text-[11px] sm:text-xs text-light-text-secondary dark:text-text-secondary">
                  Play pleasant notification chime for urgent reminders
                </span>
              </div>
            </div>
            <label htmlFor="sound-alerts-toggle" className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                id="sound-alerts-toggle" 
                className="sr-only peer" 
                checked={notificationSettings.soundEnabled} 
                onChange={(e) => updateNotificationSettings({ soundEnabled: e.target.checked })} 
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-zinc-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </li>
        </ul>
      </Card>

      {/* General App Preferences */}
      <Card>
        <ul className="divide-y divide-slate-200 dark:divide-zinc-700/70">
          <li className="py-2.5 sm:py-3 flex justify-between items-center">
             <SettingItemWrapper icon={HiOutlinePaintBrush}>
                <span className="font-medium text-xs sm:text-sm text-light-text-primary dark:text-text-primary">{t('settings.darkMode')}</span>
             </SettingItemWrapper>
              <label htmlFor="theme-toggle" className="relative inline-flex items-center cursor-pointer shrink-0">
                <input type="checkbox" id="theme-toggle" className="sr-only peer" checked={theme === 'dark'} onChange={toggleTheme} />
                <div className="w-11 h-6 bg-slate-200 dark:bg-zinc-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
          </li>

          <li className="py-2.5 sm:py-3 flex justify-between items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-700/50 rounded-lg px-1.5 -mx-1.5 transition-colors" onClick={toggleFullscreen}>
             <SettingItemWrapper icon={isFullscreen ? HiOutlineArrowsPointingIn : HiOutlineArrowsPointingOut}>
                <div>
                  <span className="font-medium text-xs sm:text-sm text-light-text-primary dark:text-text-primary block">Fullscreen Mode</span>
                  <span className="text-[11px] sm:text-xs text-light-text-secondary dark:text-text-secondary">Expand view to fill entire display</span>
                </div>
             </SettingItemWrapper>
             <button
               type="button"
               onClick={(e) => {
                 e.stopPropagation();
                 toggleFullscreen();
               }}
               className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                 isFullscreen
                   ? 'bg-primary text-white'
                   : 'bg-slate-200 dark:bg-zinc-700 text-light-text-primary dark:text-text-primary'
               }`}
             >
               {isFullscreen ? 'Active' : 'Enable'}
             </button>
          </li>
          
          <li className="py-2.5 sm:py-3 flex justify-between items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-700/50 rounded-lg px-1.5 -mx-1.5 transition-colors" onClick={() => setCurrencyModalOpen(true)}>
              <SettingItemWrapper icon={HiOutlineCurrencyDollar}>
                  <span className="font-medium text-xs sm:text-sm text-light-text-primary dark:text-text-primary">{t('settings.currency')}</span>
              </SettingItemWrapper>
              <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-xs text-light-text-secondary dark:text-text-secondary">{selectedCurrency?.code} ({selectedCurrency?.symbol})</span>
                  <HiChevronRight className="h-4 w-4 text-light-text-secondary dark:text-text-secondary" />
              </div>
          </li>

           <li className="py-2.5 sm:py-3 flex justify-between items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-700/50 rounded-lg px-1.5 -mx-1.5 transition-colors" onClick={() => setLanguageModalOpen(true)}>
              <SettingItemWrapper icon={HiOutlineLanguage}>
                  <span className="font-medium text-xs sm:text-sm text-light-text-primary dark:text-text-primary">{t('settings.language')}</span>
              </SettingItemWrapper>
              <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-xs text-light-text-secondary dark:text-text-secondary">{selectedLanguage?.name}</span>
                  <HiChevronRight className="h-4 w-4 text-light-text-secondary dark:text-text-secondary" />
              </div>
          </li>

          {settingsItems.map(item => (
            <Link to={item.to} key={item.label} className="block hover:bg-slate-100 dark:hover:bg-zinc-700/50 rounded-lg -mx-1.5 transition-colors">
              <li className="py-2.5 sm:py-3 flex justify-between items-center px-1.5">
                <SettingItemWrapper icon={item.icon}>
                  <span className="font-medium text-xs sm:text-sm text-light-text-primary dark:text-text-primary">{item.label}</span>
                </SettingItemWrapper>
                <HiChevronRight className="h-4 w-4 text-light-text-secondary dark:text-text-secondary" />
              </li>
            </Link>
          ))}
        </ul>
      </Card>

      {/* Cloud Data Management & Account Controls */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <HiOutlineCloudArrowUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-light-text-primary dark:text-text-primary">
                  {t('settings.dataBackupTitle')}
                </h3>
                <p className="text-xs text-light-text-secondary dark:text-text-secondary">
                  {t('settings.encryptedSync')}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              {t('settings.syncedBadge')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              onClick={seedSampleDataToCloud}
              className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition flex items-center justify-center gap-2"
            >
              <HiOutlineSparkles className="w-4 h-4 text-emerald-500" />
              <span>{t('settings.loadSampleData')}</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear your current local session records?')) {
                  clearAllUserData();
                }
              }}
              className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 transition"
            >
              {t('settings.resetSession')}
            </button>
          </div>

          <div className="pt-2">
            <button
              onClick={logout}
              className="w-full py-3 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40 transition flex items-center justify-center gap-2"
            >
              <span>{t('common.signOut')}</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-zinc-700/60 text-center text-xs text-light-text-secondary dark:text-text-secondary space-y-1">
            <div className="flex items-center justify-center gap-3">
              <Link to="/privacy" className="hover:text-primary underline-offset-4 hover:underline">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link to="/terms" className="hover:text-primary underline-offset-4 hover:underline">
                Terms of Service
              </Link>
            </div>
            <p className="text-[11px] opacity-75">Sprout v1.0.0 • Production Ready</p>
          </div>
        </div>
      </Card>
      
      {/* Edit Profile Modal */}
      <Modal isOpen={isProfileModalOpen} onClose={() => setProfileModalOpen(false)} title={t('settings.profile.modalTitle')}>
          <div className="space-y-4 py-1">
            <div>
              <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">
                Full Name *
              </label>
              <input 
                type="text" 
                placeholder="e.g. John Doe" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full p-2.5 sm:p-3 text-sm border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-zinc-600 text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">
                Profile Photo (Optional)
              </label>
              <label className="block w-full cursor-pointer p-4 border-2 border-dashed border-slate-300 dark:border-zinc-600 rounded-xl text-center text-light-text-secondary dark:text-text-secondary hover:bg-slate-100 dark:hover:bg-zinc-700/80 transition-colors">
                  <div className="flex flex-col items-center justify-center">
                      <HiOutlineCloudArrowUp className="h-7 w-7 mb-1 text-primary" />
                      <span className="text-sm font-medium text-light-text-primary dark:text-text-primary">{avatarFile ? avatarFile.name : t('settings.profile.uploadAvatar')}</span>
                      <span className="text-xs text-light-text-secondary dark:text-text-secondary mt-1">PNG, JPG, WebP up to 5MB</span>
                  </div>
                  <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
              </label>
            </div>
            <button 
              onClick={handleProfileUpdate} 
              disabled={isUploading} 
              className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-opacity-90 disabled:bg-slate-500 shadow-md active:scale-[0.99] transition-colors text-sm"
            >
              {isUploading ? t('settings.profile.saving') : t('settings.profile.saveChanges')}
            </button>
          </div>
      </Modal>

      {/* Currency Modal */}
      <Modal isOpen={isCurrencyModalOpen} onClose={() => setCurrencyModalOpen(false)} title={t('settings.selectCurrency')}>
          <div className="space-y-2 py-1 max-h-[60vh] overflow-y-auto">
              {availableCurrencies.map(c => (
                  <button
                      key={c.code}
                      onClick={() => { updateCurrency(c.code); toast.success(t('settings.currencySetTo', {name: c.name})); setCurrencyModalOpen(false); }}
                      className={`w-full text-left p-3 rounded-xl flex justify-between items-center transition-colors text-sm ${currency === c.code ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-slate-100 dark:hover:bg-zinc-700/50 text-light-text-primary dark:text-text-primary'}`}
                  >
                      <span>{c.symbol} - {c.name} ({c.code})</span>
                      {currency === c.code && <HiCheck className="h-5 w-5 text-primary" />}
                  </button>
              ))}
          </div>
      </Modal>

      {/* Language Modal */}
      <Modal isOpen={isLanguageModalOpen} onClose={() => setLanguageModalOpen(false)} title={t('settings.selectLanguage')}>
          <div className="space-y-2 py-1 max-h-[60vh] overflow-y-auto">
              {availableLanguages.map(l => (
                  <button
                      key={l.code}
                      onClick={() => { updateLanguage(l.code); toast.success(`${t('settings.languageSetTo')} ${l.name}`); setLanguageModalOpen(false); }}
                      className={`w-full text-left p-3 rounded-xl flex justify-between items-center transition-colors text-sm ${language === l.code ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-slate-100 dark:hover:bg-zinc-700/50 text-light-text-primary dark:text-text-primary'}`}
                  >
                      <span>{l.name}</span>
                      {language === l.code && <HiCheck className="h-5 w-5 text-primary" />}
                  </button>
              ))}
          </div>
      </Modal>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
};

export default SettingsPage;
