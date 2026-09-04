import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import Modal from './Modal';
import { 
  HiOutlineDevicePhoneMobile, 
  HiOutlineArrowDownTray, 
  HiCheckCircle, 
  HiOutlineSparkles, 
  HiOutlineArrowTopRightOnSquare, 
  HiOutlineEllipsisVertical,
  HiOutlineShare,
  HiOutlinePlusCircle,
  HiOutlineBolt
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

interface PWAInstallSectionProps {
  className?: string;
}

export const PWAInstallSection: React.FC<PWAInstallSectionProps> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, isInIframe, triggerInstall } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstallClick = async () => {
    if (isInstalled) {
      toast.success('Sprout is already installed on your device!');
      return;
    }

    if (isInstallable) {
      setIsInstalling(true);
      try {
        const res = await triggerInstall();
        if (res.outcome === 'accepted') {
          toast.success('Sprout successfully added to your home screen!');
        } else if (res.outcome === 'dismissed') {
          toast('Installation was cancelled', { icon: 'ℹ️' });
        }
      } catch (e) {
        setShowGuideModal(true);
      } finally {
        setIsInstalling(false);
      }
    } else {
      // If native prompt is not directly available (e.g. running in iframe preview, iOS Safari, or already deferred)
      setShowGuideModal(true);
    }
  };

  const handleOpenDirectTab = () => {
    const url = window.location.href;
    window.open(url, '_blank');
  };

  return (
    <>
      <div className={`p-3.5 sm:p-5 rounded-2xl bg-gradient-to-br from-violet-600/10 via-purple-500/5 to-emerald-500/10 dark:from-violet-900/30 dark:via-purple-900/15 dark:to-emerald-950/30 border border-violet-200/80 dark:border-violet-800/40 shadow-xs ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <HiOutlineDevicePhoneMobile className="w-5 h-5 sm:w-6 sm:h-6" />
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center">
                <HiOutlineSparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="font-bold text-xs sm:text-base text-light-text-primary dark:text-text-primary">
                  Install to Home Screen
                </h3>
                {isInstalled ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                    <HiCheckCircle className="w-3 h-3 text-emerald-500" />
                    Installed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                    <HiOutlineBolt className="w-2.5 h-2.5" />
                    Chrome App
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-light-text-secondary dark:text-text-secondary mt-0.5 line-clamp-2 sm:line-clamp-none max-w-md leading-relaxed">
                {isInstalled 
                  ? 'Sprout is ready for instant full-screen access without browser navigation bars.' 
                  : 'Direct one-tap launch from your device home screen with offline capability.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto pt-1 sm:pt-0">
            {isInstalled ? (
              <button
                type="button"
                onClick={() => toast.success('Sprout is installed on your device!')}
                aria-label="Sprout is installed on your home screen"
                className="w-full sm:w-auto justify-center px-4 py-2.5 sm:px-4 sm:py-2.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 transition cursor-default min-h-[44px]"
              >
                <HiCheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Ready on Home Screen</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleInstallClick}
                disabled={isInstalling}
                aria-label={isInstallable ? 'Install Web App to Home Screen' : 'Add to Home Screen instructions'}
                className="w-full sm:w-auto justify-center px-4 py-2.5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-primary hover:bg-primary-focus text-white shadow-sm active:scale-98 transition-all flex items-center gap-2 min-h-[44px] touch-manipulation"
              >
                <HiOutlineArrowDownTray className={`w-4 h-4 shrink-0 ${isInstalling ? 'animate-bounce' : ''}`} />
                <span>{isInstallable ? 'Install Web App' : 'Add to Home Screen'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Install Guide Modal (Handles Chrome, iOS Safari, and iframe sandboxes) */}
      <Modal 
        isOpen={showGuideModal} 
        onClose={() => setShowGuideModal(false)} 
        title="Add Sprout to Your Home Screen"
      >
        <div className="space-y-4 py-1">
          {/* Header icon and banner */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/40">
            <img 
              src="/icon-192.svg" 
              alt="Sprout App Icon" 
              className="w-12 h-12 rounded-xl shadow-xs border border-violet-200 dark:border-zinc-700" 
            />
            <div>
              <h4 className="font-bold text-sm text-light-text-primary dark:text-text-primary">
                Sprout - Family & Home Care
              </h4>
              <p className="text-xs text-light-text-secondary dark:text-text-secondary">
                Install as a standalone Chrome Web App for instant access and full-screen experience.
              </p>
            </div>
          </div>

          {/* Iframe Notice & Quick Open Button */}
          {isInIframe && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs space-y-2">
              <p className="text-amber-800 dark:text-amber-300 font-medium">
                💡 <strong>Preview Environment Note:</strong> Browsers require opening the direct app URL to trigger the 1-click Chrome installation banner.
              </p>
              <button
                type="button"
                onClick={handleOpenDirectTab}
                className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <HiOutlineArrowTopRightOnSquare className="w-3.5 h-3.5" />
                <span>Open in Direct Tab to Install</span>
              </button>
            </div>
          )}

          {/* Platform-Specific Step by Step Instructions */}
          <div className="space-y-3 pt-1">
            <h5 className="text-xs font-bold uppercase tracking-wider text-light-text-secondary dark:text-text-secondary">
              {isIOS ? 'Instructions for iPhone / iPad (Safari)' : 'Instructions for Chrome & Android / PC'}
            </h5>

            {isIOS ? (
              <div className="space-y-2.5 text-xs text-light-text-primary dark:text-text-primary">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Tap the <strong className="text-primary inline-flex items-center gap-1"><HiOutlineShare className="w-3.5 h-3.5" /> Share</strong> button in the Safari bottom toolbar.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Scroll down and tap <strong className="text-primary inline-flex items-center gap-1"><HiOutlinePlusCircle className="w-3.5 h-3.5" /> Add to Home Screen</strong>.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Tap <strong>Add</strong> in the top-right corner to launch Sprout directly from your home screen.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs text-light-text-primary dark:text-text-primary">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                    1
                  </div>
                  <div>
                    <p className="font-medium">In Google Chrome, tap the <strong className="text-primary inline-flex items-center gap-1"><HiOutlineEllipsisVertical className="w-3.5 h-3.5" /> Menu</strong> (three dots at top-right).</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Select <strong className="text-primary inline-flex items-center gap-1"><HiOutlineArrowDownTray className="w-3.5 h-3.5" /> Install Sprout</strong> or <strong>Add to Home screen</strong>.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Confirm <strong>Install</strong> to place the Sprout app icon on your home screen or desktop application launcher.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition"
            >
              Done
            </button>
            <button
              type="button"
              onClick={handleOpenDirectTab}
              className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary-focus transition flex items-center gap-1.5 shadow-xs"
            >
              <HiOutlineArrowTopRightOnSquare className="w-3.5 h-3.5" />
              <span>Direct Link</span>
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
