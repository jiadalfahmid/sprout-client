import React from 'react';
import { Link } from 'react-router-dom';
import { TransactionCategory } from '../../types';
import { getCategoryIcon } from '../../utils/categoryIcons';
import { HiOutlineCheck, HiOutlineCog6Tooth } from 'react-icons/hi2';

interface CategoryChipPickerProps {
  categories: TransactionCategory[];
  selectedCategoryId?: string;
  onSelect: (categoryId: string) => void;
  onAddCategory?: (category: { name: string; icon: string; color: string }) => TransactionCategory;
  onUpdateCategory?: (category: TransactionCategory) => void;
  label?: string;
}

export const CategoryChipPicker: React.FC<CategoryChipPickerProps> = ({
  categories,
  selectedCategoryId,
  onSelect,
  label = 'Category',
}) => {
  return (
    <div className="space-y-1.5" id="category-chip-picker-root">
      <div className="flex items-center justify-between" id="category-picker-header">
        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary uppercase tracking-wider">
          {label}
        </label>
        <Link
          id="category-picker-settings-link"
          to="/settings/categories"
          className="text-xs text-light-text-secondary dark:text-text-secondary hover:text-primary dark:hover:text-primary-light font-medium hover:underline inline-flex items-center gap-1 transition-colors"
          title="Manage categories in Settings"
        >
          <HiOutlineCog6Tooth className="h-3.5 w-3.5" />
          <span>Settings</span>
        </Link>
      </div>

      <div 
        id="category-chips-container"
        className="flex flex-wrap gap-1.5 max-h-[136px] overflow-y-auto p-1.5 border border-slate-200 dark:border-zinc-700/70 rounded-xl bg-slate-50/50 dark:bg-zinc-900/30"
      >
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          const Icon = getCategoryIcon(cat.icon);
          return (
            <button
              key={cat.id}
              id={`category-chip-${cat.id}`}
              type="button"
              onClick={() => onSelect(cat.id)}
              className={`h-8 px-2.5 inline-flex items-center gap-1.5 rounded-lg text-xs font-medium transition-all shrink-0 border cursor-pointer select-none ${
                isSelected
                  ? 'ring-2 shadow-xs'
                  : 'bg-light-surface dark:bg-surface border-slate-200 dark:border-zinc-700 text-light-text-primary dark:text-text-primary hover:border-slate-300 dark:hover:border-zinc-600 hover:bg-slate-100/70 dark:hover:bg-zinc-800/60 active:scale-[0.98]'
              }`}
              style={{
                backgroundColor: isSelected ? `${cat.color}20` : undefined,
                borderColor: isSelected ? cat.color : undefined,
                color: isSelected ? cat.color : undefined,
                boxShadow: isSelected ? `0 0 0 1px ${cat.color}` : undefined,
              }}
              title={cat.name}
            >
              <Icon 
                className="h-3.5 w-3.5 shrink-0" 
                style={{ color: cat.color }} 
              />
              <span className="whitespace-nowrap">{cat.name}</span>
              {isSelected && <HiOutlineCheck className="h-3.5 w-3.5 shrink-0 ml-0.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryChipPicker;
