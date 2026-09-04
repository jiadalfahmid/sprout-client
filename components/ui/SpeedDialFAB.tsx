import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HiPlus, HiXMark } from 'react-icons/hi2';

export interface SpeedDialAction {
  id: string;
  label: string;
  icon: React.ElementType;
  color?: string;
  bgColor?: string;
  onClick: () => void;
  description?: string;
}

interface SpeedDialFABProps {
  actions: SpeedDialAction[];
  mainLabel?: string;
  onSingleAction?: () => void;
  className?: string;
}

const colorClassesMap: Record<string, string> = {
  purple: 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30',
  emerald: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30',
  rose: 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30',
  red: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-500/30',
  blue: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30',
  indigo: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30',
  orange: 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-300 border border-orange-200 dark:border-orange-500/30',
  yellow: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-500/30',
  amber: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30',
  teal: 'bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30',
  cyan: 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30',
  pink: 'bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-300 border border-pink-200 dark:border-pink-500/30',
  green: 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-300 border border-green-200 dark:border-green-500/30',
  lime: 'bg-lime-100 dark:bg-lime-500/20 text-lime-600 dark:text-lime-300 border border-lime-200 dark:border-lime-500/30',
  sky: 'bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30',
  gray: 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600',
  slate: 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600',
};

const resolveActionStyle = (action: SpeedDialAction): string => {
  if (action.color && colorClassesMap[action.color]) {
    return colorClassesMap[action.color];
  }
  // If bgColor was specified like 'bg-primary' or 'bg-emerald-600'
  if (action.bgColor) {
    if (action.bgColor.includes('primary') || action.bgColor.includes('purple')) {
      return colorClassesMap.purple;
    }
    if (action.bgColor.includes('emerald') || action.bgColor.includes('green')) {
      return colorClassesMap.emerald;
    }
    if (action.bgColor.includes('rose') || action.bgColor.includes('red')) {
      return colorClassesMap.rose;
    }
    if (action.bgColor.includes('blue') || action.bgColor.includes('sky')) {
      return colorClassesMap.blue;
    }
    if (action.bgColor.includes('indigo')) {
      return colorClassesMap.indigo;
    }
    if (action.bgColor.includes('amber') || action.bgColor.includes('yellow')) {
      return colorClassesMap.amber;
    }
    if (action.bgColor.includes('teal') || action.bgColor.includes('cyan')) {
      return colorClassesMap.teal;
    }
    if (action.bgColor.includes('orange')) {
      return colorClassesMap.orange;
    }
    return `${action.bgColor} text-white`;
  }
  return colorClassesMap.purple;
};

const SpeedDialFAB: React.FC<SpeedDialFABProps> = ({
  actions,
  mainLabel = 'Add New',
  onSingleAction,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside tap / click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  const handleMainButtonClick = () => {
    if (actions.length === 1 && onSingleAction) {
      onSingleAction();
    } else if (actions.length === 1 && actions[0].onClick) {
      actions[0].onClick();
    } else {
      setIsOpen(prev => !prev);
    }
  };

  const handleActionClick = (action: SpeedDialAction) => {
    setIsOpen(false);
    setTimeout(() => {
      action.onClick();
    }, 50);
  };

  return (
    <>
      {/* Dimmed Backdrop for Mobile Phone Focus */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-[2px] z-40 transition-opacity"
          />
        )}
      </AnimatePresence>

      <div
        ref={containerRef}
        className={`fixed bottom-20 right-4 sm:right-6 md:right-8 z-40 flex flex-col items-end pointer-events-auto ${className}`}
      >
        {/* Speed Dial Menu Items styled like homepage / finance dashboard icons */}
        <AnimatePresence>
          {isOpen && actions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.9 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="flex flex-col items-end gap-3 mb-3 select-none"
            >
              {actions.map((action, idx) => {
                const Icon = action.icon;
                const styleClasses = resolveActionStyle(action);
                return (
                  <motion.button
                    key={action.id || idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: (actions.length - 1 - idx) * 0.03 }}
                    onClick={() => handleActionClick(action)}
                    className="flex items-center gap-3 group focus:outline-none"
                    type="button"
                    aria-label={action.label}
                  >
                    {/* Action Label Chip */}
                    <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/95 dark:bg-zinc-800/95 backdrop-blur-sm text-slate-800 dark:text-zinc-100 shadow-md border border-slate-200/80 dark:border-zinc-700/80 whitespace-nowrap group-hover:bg-slate-50 dark:group-hover:bg-zinc-700 transition-colors">
                      {action.label}
                    </span>

                    {/* Squircle Action Button matching Homepage / Finance archetype */}
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform transform active:scale-95 group-hover:scale-105 ${styleClasses}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary Squircle Floating Action Button (FAB) matching app branding */}
        <motion.button
          type="button"
          onClick={handleMainButtonClick}
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.05 }}
          className={`relative flex items-center justify-center w-14 h-14 rounded-2xl shadow-2xl focus:outline-none transition-all duration-200 ${
            isOpen
              ? 'bg-slate-800 text-white dark:bg-zinc-700 dark:text-zinc-100 border border-slate-600'
              : 'bg-primary text-white shadow-primary/30 ring-4 ring-primary/20 border border-white/20'
          }`}
          aria-label={mainLabel}
          title={mainLabel}
        >
          <motion.div
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center"
          >
            {isOpen ? <HiXMark className="w-7 h-7" /> : <HiPlus className="w-7 h-7" />}
          </motion.div>
        </motion.button>
      </div>
    </>
  );
};

export default SpeedDialFAB;
