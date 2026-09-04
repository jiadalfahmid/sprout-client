import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { AVATAR_PRESETS, AvatarPreset } from '../../data/avatarPresets';
import { HiOutlineCloudArrowUp, HiCheck, HiOutlineSparkles, HiOutlinePhoto } from 'react-icons/hi2';

interface AvatarPickerProps {
  selectedAvatarUrl: string;
  onSelectAvatarUrl: (url: string) => void;
  avatarFile: File | null;
  onSelectAvatarFile: (file: File | null) => void;
}

type FilterCategory = 'all' | 'adult' | 'kid' | 'senior' | 'pet' | 'other';

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  selectedAvatarUrl,
  onSelectAvatarUrl,
  avatarFile,
  onSelectAvatarFile,
}) => {
  const [activeTab, setActiveTab] = useState<'preset' | 'upload'>('preset');
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all');

  const filteredPresets = categoryFilter === 'all' 
    ? AVATAR_PRESETS 
    : AVATAR_PRESETS.filter(p => p.category === categoryFilter);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image is too large. Please select a photo under 5MB.');
        return;
      }
      onSelectAvatarFile(file);
      // Create local preview
      const previewUrl = URL.createObjectURL(file);
      onSelectAvatarUrl(previewUrl);
    }
  };

  const categories: { id: FilterCategory; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'adult', label: 'Parents' },
    { id: 'kid', label: 'Kids' },
    { id: 'senior', label: 'Seniors' },
    { id: 'pet', label: 'Pets' },
    { id: 'other', label: 'Care' },
  ];

  return (
    <div className="space-y-3">
      {/* Tab Switcher: Vector Art vs Custom Photo */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
        <label className="text-xs font-bold text-light-text-primary dark:text-text-primary flex items-center gap-1.5">
          <HiOutlineSparkles className="w-3.5 h-3.5 text-primary" />
          <span>Choose Vector Avatar</span>
        </label>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('preset')}
            className={`px-2.5 py-1 rounded-md font-semibold transition ${
              activeTab === 'preset'
                ? 'bg-white dark:bg-zinc-700 text-primary shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Vector Art
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-2.5 py-1 rounded-md font-semibold transition ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-zinc-700 text-primary shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Custom Photo
          </button>
        </div>
      </div>

      {activeTab === 'preset' ? (
        <div className="space-y-2.5">
          {/* Category Chips */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition ${
                  categoryFilter === cat.id
                    ? 'bg-primary text-white shadow-xs font-semibold'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Vector Art Grid (TP-Link Tether style) */}
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-48 overflow-y-auto p-1 border border-slate-100 dark:border-zinc-800/80 rounded-xl bg-slate-50/50 dark:bg-zinc-900/40">
            {filteredPresets.map((preset) => {
              const isSelected = selectedAvatarUrl === preset.svgUrl && !avatarFile;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    onSelectAvatarUrl(preset.svgUrl);
                    onSelectAvatarFile(null); // Clear custom upload if picking preset
                  }}
                  className={`group relative flex flex-col items-center p-1.5 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-primary/10 dark:bg-primary/20 ring-2 ring-primary scale-105'
                      : 'hover:bg-white dark:hover:bg-zinc-800 hover:scale-105 opacity-85 hover:opacity-100'
                  }`}
                  title={preset.label}
                >
                  <div className="relative w-12 h-12 rounded-full overflow-hidden shadow-xs border border-white dark:border-zinc-700">
                    <img
                      src={preset.svgUrl}
                      alt={preset.label}
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/25 flex items-center justify-center">
                        <div className="bg-primary text-white rounded-full p-0.5 shadow-xs">
                          <HiCheck className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-slate-600 dark:text-zinc-300 mt-1 truncate max-w-full text-center">
                    {preset.label.split('/')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Custom Photo Upload */
        <div className="space-y-2">
          <label className="block w-full cursor-pointer p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-center text-light-text-secondary dark:text-text-secondary hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
            <div className="flex flex-col items-center justify-center">
              <HiOutlineCloudArrowUp className="h-6 w-6 mb-1 text-primary" />
              <span className="text-xs font-medium">
                {avatarFile ? avatarFile.name : 'Upload custom photo (JPG, PNG, WebP)'}
              </span>
            </div>
            <input
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="image/*"
            />
          </label>
        </div>
      )}

      {/* Selected Avatar Preview & Confirmation */}
      <div className="flex items-center gap-3 p-2 bg-slate-100/70 dark:bg-zinc-800/40 rounded-xl border border-slate-200/60 dark:border-zinc-700/50">
        <img
          src={selectedAvatarUrl || AVATAR_PRESETS[0].svgUrl}
          alt="Selected Avatar Preview"
          className="w-10 h-10 rounded-full object-cover border-2 border-primary shadow-xs"
        />
        <div className="text-xs">
          <p className="font-semibold text-light-text-primary dark:text-text-primary">
            Selected Avatar
          </p>
          <p className="text-[11px] text-light-text-secondary dark:text-text-secondary">
            {avatarFile ? 'Custom uploaded image' : 'Vector illustration'}
          </p>
        </div>
      </div>
    </div>
  );
};
