import React from 'react';

export interface FilterChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected: boolean;
  label: React.ReactNode;
  icon?: React.ReactNode;
  count?: number | string;
  color?: string;
  size?: 'sm' | 'md';
  variant?: 'pill' | 'rounded';
}

export const FilterChip: React.FC<FilterChipProps> = ({
  selected,
  label,
  icon,
  count,
  color,
  size = 'sm',
  variant = 'pill',
  className = '',
  ...buttonProps
}) => {
  const isPill = variant === 'pill';
  const sizeClasses = size === 'md'
    ? 'px-3.5 py-1.5 text-xs sm:text-sm'
    : 'px-2.5 py-1 text-xs';

  const baseClasses = [
    'inline-flex items-center gap-1.5 transition-all duration-150 border font-medium select-none cursor-pointer whitespace-nowrap active:scale-[0.98]',
    sizeClasses,
    isPill ? 'rounded-full' : 'rounded-xl',
  ];

  if (selected) {
    if (color) {
      baseClasses.push('ring-2 ring-offset-1 dark:ring-offset-zinc-900 shadow-sm font-semibold');
    } else {
      baseClasses.push('bg-primary text-white border-primary shadow-sm font-semibold');
    }
  } else {
    baseClasses.push(
      'bg-slate-50 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 border-slate-200/80 dark:border-zinc-700/80 hover:bg-slate-100 dark:hover:bg-zinc-700 hover:text-slate-900 dark:hover:text-zinc-100'
    );
  }

  const customStyle = color && selected
    ? { backgroundColor: color, borderColor: color, color: '#fff' }
    : color && !selected
    ? { borderColor: `${color}40`, color }
    : undefined;

  return (
    <button
      type="button"
      className={`${baseClasses.join(' ')} ${className}`}
      style={customStyle}
      {...buttonProps}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
            selected
              ? 'bg-white/25 text-white'
              : 'bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-400'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
};

export default FilterChip;
