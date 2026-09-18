import React from 'react';

export interface SegmentedControlOption<T extends string | number> {
  value: T;
  label: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  badge?: React.ReactNode;
  activeColor?: string;
}

export interface SegmentedControlProps<T extends string | number> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  variant?: 'default' | 'primary' | 'pills';
  fullWidth?: boolean;
  className?: string;
  ariaLabel?: string;
  responsiveCollapse?: boolean;
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  size = 'sm',
  variant = 'default',
  fullWidth = false,
  className = '',
  ariaLabel,
  responsiveCollapse = false,
}: SegmentedControlProps<T>) {
  const isPill = variant === 'pills';

  const containerClasses = [
    'inline-flex items-center p-1',
    isPill ? 'rounded-full' : 'rounded-2xl',
    'bg-slate-100/90 dark:bg-zinc-800/90 border border-slate-200/80 dark:border-zinc-700/80',
    fullWidth ? 'w-full' : '',
    className,
  ].filter(Boolean).join(' ');

  const getItemClasses = (isSelected: boolean, activeColor?: string) => {
    const sizeClasses = size === 'md' 
      ? (responsiveCollapse ? 'px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm' : 'px-3.5 py-2 text-xs sm:text-sm')
      : (responsiveCollapse ? 'px-2 sm:px-3 py-1.5 text-xs' : 'px-3 py-1.5 text-xs');

    const baseClasses = [
      'relative flex items-center justify-center gap-1.5 transition-all duration-200 font-medium select-none cursor-pointer',
      sizeClasses,
      isPill ? 'rounded-full' : 'rounded-xl',
      fullWidth ? 'flex-1' : 'shrink-0',
    ];

    if (isSelected) {
      if (activeColor) {
        baseClasses.push('text-white shadow-sm font-semibold');
      } else if (variant === 'primary') {
        baseClasses.push('bg-primary text-white shadow-sm font-semibold');
      } else {
        baseClasses.push('bg-white dark:bg-zinc-700 text-primary dark:text-primary-light shadow-sm font-semibold');
      }
    } else {
      baseClasses.push('text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-white/50 dark:hover:bg-zinc-700/50');
    }

    return baseClasses.join(' ');
  };

  return (
    <div className={containerClasses} role="tablist" aria-label={ariaLabel}>
      {options.map((option) => {
        const isSelected = option.value === value;
        const IconComponent = option.icon;
        const customStyle = isSelected && option.activeColor
          ? { backgroundColor: option.activeColor, borderColor: option.activeColor, color: '#fff' }
          : undefined;

        const titleText = typeof option.label === 'string' ? option.label : undefined;

        return (
          <button
            key={String(option.value)}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-label={titleText}
            title={titleText}
            onClick={() => onChange(option.value)}
            className={getItemClasses(isSelected, option.activeColor)}
            style={customStyle}
          >
            {IconComponent && (
              typeof IconComponent === 'function' ? (
                <IconComponent className={`${size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5'} shrink-0`} />
              ) : (
                IconComponent
              )
            )}
            <span className={responsiveCollapse && Boolean(IconComponent) ? (isSelected ? 'inline' : 'hidden sm:inline') : undefined}>
              {option.label}
            </span>
            {option.badge !== undefined && (
              <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                isSelected 
                  ? ((variant === 'primary' || option.activeColor) ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary')
                  : 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
              }`}>
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
