import React, { useState } from 'react';
import { TransactionCategory } from '../../types';
import { 
  getCategoryIcon, 
  AVAILABLE_CATEGORY_ICONS, 
  AVAILABLE_CATEGORY_COLORS 
} from '../../utils/categoryIcons';
import { HiPlus, HiOutlineCheck, HiXMark } from 'react-icons/hi2';
import Modal from '../ui/Modal';
import toast from 'react-hot-toast';

interface CategoryChipPickerProps {
  categories: TransactionCategory[];
  selectedCategoryId?: string;
  onSelect: (categoryId: string) => void;
  onAddCategory?: (category: { name: string; icon: string; color: string }) => TransactionCategory;
  label?: string;
}

export const CategoryChipPicker: React.FC<CategoryChipPickerProps> = ({
  categories,
  selectedCategoryId,
  onSelect,
  onAddCategory,
  label = 'Category',
}) => {
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState(AVAILABLE_CATEGORY_ICONS[0].name);
  const [newCatColor, setNewCatColor] = useState(AVAILABLE_CATEGORY_COLORS[0]);

  const handleCreateCategory = () => {
    if (!newCatName.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    if (onAddCategory) {
      const created = onAddCategory({
        name: newCatName.trim(),
        icon: newCatIcon,
        color: newCatColor,
      });
      onSelect(created.id);
      toast.success(`Category "${created.name}" created!`);
    }

    setNewCatName('');
    setAddModalOpen(false);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary uppercase tracking-wider">
          {label}
        </label>
        {onAddCategory && (
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
          >
            <HiPlus className="h-3 w-3" />
            New Category
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto p-1 border border-slate-200 dark:border-zinc-700/70 rounded-xl bg-slate-50/50 dark:bg-zinc-900/30">
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          const Icon = getCategoryIcon(cat.icon);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelect(cat.id)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 border ${
                isSelected
                  ? 'ring-2 shadow-xs'
                  : 'bg-light-surface dark:bg-surface border-slate-200 dark:border-zinc-700 text-light-text-primary dark:text-text-primary hover:border-slate-300 dark:hover:border-zinc-600'
              }`}
              style={{
                backgroundColor: isSelected ? `${cat.color}20` : undefined,
                borderColor: isSelected ? cat.color : undefined,
                color: isSelected ? cat.color : undefined,
                boxShadow: isSelected ? `0 0 0 1px ${cat.color}` : undefined,
              }}
            >
              <Icon 
                className="h-3.5 w-3.5 shrink-0" 
                style={{ color: isSelected ? cat.color : cat.color }} 
              />
              <span className="truncate max-w-[120px]">{cat.name}</span>
              {isSelected && <HiOutlineCheck className="h-3 w-3 shrink-0 ml-0.5" />}
            </button>
          );
        })}

        {onAddCategory && (
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-dashed border-slate-300 dark:border-zinc-700 text-light-text-secondary dark:text-text-secondary hover:text-primary dark:hover:text-primary-light hover:border-primary/50 transition-colors shrink-0"
          >
            <HiPlus className="h-3 w-3" />
            <span>Add Custom</span>
          </button>
        )}
      </div>

      {/* Add Category Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setAddModalOpen(false)}
          title="Create Custom Category"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1">
                Category Name
              </label>
              <input
                type="text"
                placeholder="e.g. Pets, Books, Gaming..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full p-2.5 text-sm border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-zinc-600 focus:ring-1 focus:ring-primary"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">
                Choose Color
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_CATEGORY_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewCatColor(c)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                      newCatColor === c ? 'scale-110 ring-2 ring-offset-2 ring-primary dark:ring-offset-zinc-900' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {newCatColor === c && <HiOutlineCheck className="h-4 w-4 text-white drop-shadow-xs" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">
                Choose Icon
              </label>
              <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1 border border-slate-200 dark:border-zinc-700 rounded-lg">
                {AVAILABLE_CATEGORY_ICONS.map((item) => {
                  const IconComp = item.icon;
                  const isSelected = newCatIcon === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setNewCatIcon(item.name)}
                      title={item.label}
                      className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-light-surface dark:bg-surface text-light-text-primary dark:text-text-primary hover:bg-slate-100 dark:hover:bg-zinc-700/50'
                      }`}
                    >
                      <IconComp className="h-5 w-5" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-lg border border-slate-200 dark:border-zinc-700 text-sm font-medium text-light-text-secondary dark:text-text-secondary hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCategory}
                className="flex-1 py-2.5 px-4 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-xs"
              >
                Create Category
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CategoryChipPicker;
