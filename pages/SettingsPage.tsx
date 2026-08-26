import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Skeleton from '../components/ui/Skeleton';
import { uploadImage } from '../utils/imageUploader';
import { 
  HiOutlineUsers, HiOutlinePaintBrush, 
  HiOutlineCurrencyDollar, HiOutlineLanguage, HiChevronRight,
  HiOutlinePencil, HiOutlineCloudArrowUp, HiOutlineBeaker, HiOutlineCalendarDays, HiCheck
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { useTranslation } from '../hooks/useTranslation';

const SettingsPage = () => {
  const { loading, user, updateUser, theme, toggleTheme, currency, updateCurrency, availableCurrencies, language, updateLanguage, availableLanguages } = useAppContext();
  const { t } = useTranslation();
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [isCurrencyModalOpen, setCurrencyModalOpen] = useState(false);
  const [isLanguageModalOpen, setLanguageModalOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
  ];

  const ProfileCardSkeleton = () => (
    <Card className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="w-8 h-8 rounded-full" />
    </Card>
  )
  
  const SettingItemWrapper: React.FC<{icon: React.ElementType, children: React.ReactNode}> = ({ icon: Icon, children }) => (
    <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
        </div>
        {children}
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-light-text-primary dark:text-text-primary">{t('settings.title')}</h1>

      {loading ? <ProfileCardSkeleton /> : (
        <Card className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover" />
            <div>
              <h2 className="text-xl font-bold text-light-text-primary dark:text-text-primary">{user.name}</h2>
              <p className="text-light-text-secondary dark:text-text-secondary">{t('settings.profile.title')}</p>
            </div>
          </div>
          <button onClick={() => setProfileModalOpen(true)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 transition">
            <HiOutlinePencil className="h-6 w-6 text-light-text-secondary dark:text-text-secondary"/>
          </button>
        </Card>
      )}

      <Card>
        <ul className="divide-y divide-slate-200 dark:divide-zinc-700">
          <li className="py-3 flex justify-between items-center">
             <SettingItemWrapper icon={HiOutlinePaintBrush}>
                <span className="font-semibold text-light-text-primary dark:text-text-primary">{t('settings.darkMode')}</span>
             </SettingItemWrapper>
              <label htmlFor="theme-toggle" className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" id="theme-toggle" className="sr-only peer" checked={theme === 'dark'} onChange={toggleTheme} />
                <div className="w-11 h-6 bg-slate-200 dark:bg-zinc-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
          </li>
          
          <li className="py-3 flex justify-between items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-700/50 rounded-lg px-1 -mx-1" onClick={() => setCurrencyModalOpen(true)}>
              <SettingItemWrapper icon={HiOutlineCurrencyDollar}>
                  <span className="font-semibold text-light-text-primary dark:text-text-primary">{t('settings.currency')}</span>
              </SettingItemWrapper>
              <div className="flex items-center gap-2">
                  <span className="text-light-text-secondary dark:text-text-secondary">{selectedCurrency?.code} ({selectedCurrency?.symbol})</span>
                  <HiChevronRight className="h-5 w-5 text-light-text-secondary dark:text-text-secondary" />
              </div>
          </li>

           <li className="py-3 flex justify-between items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-700/50 rounded-lg px-1 -mx-1" onClick={() => setLanguageModalOpen(true)}>
              <SettingItemWrapper icon={HiOutlineLanguage}>
                  <span className="font-semibold text-light-text-primary dark:text-text-primary">{t('settings.language')}</span>
              </SettingItemWrapper>
              <div className="flex items-center gap-2">
                  <span className="text-light-text-secondary dark:text-text-secondary">{selectedLanguage?.name}</span>
                  <HiChevronRight className="h-5 w-5 text-light-text-secondary dark:text-text-secondary" />
              </div>
          </li>

          {settingsItems.map(item => (
            <Link to={item.to} key={item.label} className="block hover:bg-slate-100 dark:hover:bg-zinc-700/50 rounded-lg -mx-1">
              <li className="py-3 flex justify-between items-center px-1">
                <SettingItemWrapper icon={item.icon}>
                  <span className="font-semibold text-light-text-primary dark:text-text-primary">{item.label}</span>
                </SettingItemWrapper>
                <HiChevronRight className="h-5 w-5 text-light-text-secondary dark:text-text-secondary" />
              </li>
            </Link>
          ))}
        </ul>
      </Card>
      
      <Modal isOpen={isProfileModalOpen} onClose={() => setProfileModalOpen(false)} title={t('settings.profile.modalTitle')}>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder={t('settings.profile.namePlaceholder')} 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full p-3 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-zinc-600 text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent" 
            />
            <div>
              <label className="block w-full cursor-pointer p-3 border-2 border-dashed border-slate-300 dark:border-zinc-600 rounded-lg text-center text-light-text-secondary dark:text-text-secondary hover:bg-slate-100 dark:hover:bg-zinc-700/80">
                  <div className="flex flex-col items-center justify-center">
                      <HiOutlineCloudArrowUp className="h-8 w-8 mb-1" />
                      <span>{avatarFile ? avatarFile.name : t('settings.profile.uploadAvatar')}</span>
                  </div>
                  <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
              </label>
            </div>
            <button 
              onClick={handleProfileUpdate} 
              disabled={isUploading} 
              className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-opacity-90 disabled:bg-slate-500"
            >
              {isUploading ? t('settings.profile.saving') : t('settings.profile.saveChanges')}
            </button>
          </div>
      </Modal>

       <Modal isOpen={isCurrencyModalOpen} onClose={() => setCurrencyModalOpen(false)} title={t('settings.selectCurrency')}>
          <div className="space-y-2">
              {availableCurrencies.map(c => (
                  <button
                      key={c.code}
                      onClick={() => { updateCurrency(c.code); toast.success(t('settings.currencySetTo', {name: c.name})); setCurrencyModalOpen(false); }}
                      className={`w-full text-left p-3 rounded-lg flex justify-between items-center transition-colors ${currency === c.code ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-zinc-700/50'}`}
                  >
                      <span className="font-semibold">{c.symbol} - {c.name} ({c.code})</span>
                      {currency === c.code && <HiCheck className="h-5 w-5" />}
                  </button>
              ))}
          </div>
      </Modal>

       <Modal isOpen={isLanguageModalOpen} onClose={() => setLanguageModalOpen(false)} title={t('settings.selectLanguage')}>
          <div className="space-y-2">
              {availableLanguages.map(l => (
                  <button
                      key={l.code}
                      onClick={() => { updateLanguage(l.code); toast.success(`${t('settings.languageSetTo')} ${l.name}`); setLanguageModalOpen(false); }}
                      className={`w-full text-left p-3 rounded-lg flex justify-between items-center transition-colors ${language === l.code ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-zinc-700/50'}`}
                  >
                      <span className="font-semibold">{l.name}</span>
                      {language === l.code && <HiCheck className="h-5 w-5" />}
                  </button>
              ))}
          </div>
      </Modal>

    </div>
  );
};

export default SettingsPage;
