import React from 'react';
import { TransactionCategory } from '../../types';
import { getCategoryIcon } from '../../utils/categoryIcons';

interface CategoryBadgeProps {
  category?: TransactionCategory | null;
  fallbackName?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  fallbackName,
  size = 'sm',
  className = '',
}) => {
  const name = category?.name || fallbackName || 'General';
  const color = category?.color || '#64748B';
  const Icon = getCategoryIcon(category?.icon);

  const sizeClasses = size === 'sm' 
    ? 'text-[11px] px-2 py-0.5 gap-1' 
    : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full shrink-0 border ${sizeClasses} ${className}`}
      style={{
        backgroundColor: `${color}18`,
        borderColor: `${color}35`,
        color: color,
      }}
    >
      <Icon className={size === 'sm' ? 'h-3 w-3 shrink-0' : 'h-3.5 w-3.5 shrink-0'} />
      <span className="truncate max-w-[120px]">{name}</span>
    </span>
  );
};

export default CategoryBadge;
