import React, { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  icon,
  disabled,
  type = 'button',
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 select-none min-h-[44px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3.5 py-2 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-primary hover:bg-primary/90 text-white shadow-sm',
    secondary: 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 shadow-sm',
    ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300',
    danger: 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-sm',
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0 flex items-center justify-center">{icon}</span>}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
