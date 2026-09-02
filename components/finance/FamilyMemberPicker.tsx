import React from 'react';
import { FamilyMember } from '../../types';
import { HiOutlineUserGroup, HiOutlineCheck } from 'react-icons/hi2';

interface FamilyMemberPickerProps {
  members: FamilyMember[];
  selectedMemberId?: string;
  onSelect: (memberId?: string) => void;
  label?: string;
}

export const FamilyMemberPicker: React.FC<FamilyMemberPickerProps> = ({
  members,
  selectedMemberId,
  onSelect,
  label = 'Assign to Person',
}) => {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary uppercase tracking-wider">
        {label}
      </label>
      <div className="flex flex-wrap items-center gap-2">
        {/* Family / Shared option */}
        <button
          type="button"
          onClick={() => onSelect(undefined)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all border ${
            !selectedMemberId
              ? 'bg-primary/10 border-primary text-primary dark:text-primary-light ring-2 ring-primary/20 shadow-xs'
              : 'bg-light-surface dark:bg-surface border-slate-200 dark:border-zinc-700 text-light-text-secondary dark:text-text-secondary hover:border-slate-300 dark:hover:border-zinc-600'
          }`}
        >
          <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-zinc-700 flex items-center justify-center shrink-0">
            <HiOutlineUserGroup className="h-2.5 w-2.5" />
          </div>
          <span>Family (Shared)</span>
          {!selectedMemberId && <HiOutlineCheck className="h-3 w-3 shrink-0 ml-0.5" />}
        </button>

        {/* Member Options */}
        {members.map((member) => {
          const isSelected = selectedMemberId === member.id;
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => onSelect(member.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all border ${
                isSelected
                  ? 'bg-primary/10 border-primary text-primary dark:text-primary-light ring-2 ring-primary/20 shadow-xs'
                  : 'bg-light-surface dark:bg-surface border-slate-200 dark:border-zinc-700 text-light-text-secondary dark:text-text-secondary hover:border-slate-300 dark:hover:border-zinc-600'
              }`}
            >
              <img
                src={member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={member.name}
                className="w-4 h-4 rounded-full object-cover shrink-0"
              />
              <span className="truncate max-w-[100px]">{member.name}</span>
              {isSelected && <HiOutlineCheck className="h-3 w-3 shrink-0 ml-0.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FamilyMemberPicker;
