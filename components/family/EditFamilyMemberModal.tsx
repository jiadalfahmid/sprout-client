import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { AvatarPicker } from '../ui/AvatarPicker';
import { uploadImage } from '../../utils/imageUploader';
import { AVATAR_PRESETS } from '../../data/avatarPresets';
import { FamilyMember } from '../../types';
import toast from 'react-hot-toast';
import { 
  HiOutlineUser, 
  HiOutlineCalendar, 
  HiOutlineEnvelope, 
  HiOutlinePhone, 
  HiOutlineHeart, 
  HiOutlineDocumentText,
  HiOutlineExclamationTriangle,
  HiOutlineCheck,
  HiOutlineSparkles,
  HiOutlineChevronDown,
  HiOutlineChevronUp
} from 'react-icons/hi2';

interface EditFamilyMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: FamilyMember | null;
  onSave: (updatedMember: FamilyMember) => Promise<void> | void;
}

const COMMON_RELATIONS = [
  'Spouse',
  'Partner',
  'Son',
  'Daughter',
  'Child',
  'Mother',
  'Father',
  'Parent',
  'Sister',
  'Brother',
  'Sibling',
  'Grandmother',
  'Grandfather',
  'Aunt',
  'Uncle',
  'Cousin',
  'Pet',
  'Roommate',
  'Other'
];

const BLOOD_GROUPS = [
  'Unknown',
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-'
];

export const EditFamilyMemberModal: React.FC<EditFamilyMemberModalProps> = ({
  isOpen,
  onClose,
  member,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [customRelation, setCustomRelation] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('Unknown');
  const [allergies, setAllergies] = useState('');
  const [notes, setNotes] = useState('');

  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>(AVATAR_PRESETS[0].svgUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [showOptionalHealth, setShowOptionalHealth] = useState(true);

  // Sync state with incoming member
  useEffect(() => {
    if (member && isOpen) {
      setName(member.name || '');
      
      const isKnownRelation = COMMON_RELATIONS.includes(member.relation);
      if (isKnownRelation) {
        setRelation(member.relation);
        setCustomRelation('');
      } else {
        setRelation('Other');
        setCustomRelation(member.relation || '');
      }

      setAge(member.age !== undefined && member.age !== null ? String(member.age) : '');
      setEmail(member.email || '');
      setPhone(member.phone || '');
      setBloodGroup(member.bloodGroup || 'Unknown');
      setAllergies(member.allergies || '');
      setNotes(member.notes || '');

      setSelectedAvatarUrl(member.avatar || AVATAR_PRESETS[0].svgUrl);
      setAvatarFile(null);
      setIsAvatarPickerOpen(false);
      // If member already has contact or medical notes, keep section expanded
      const hasExtraInfo = Boolean(member.email || member.phone || (member.bloodGroup && member.bloodGroup !== 'Unknown') || member.allergies || member.notes);
      setShowOptionalHealth(hasExtraInfo || true);
    }
  }, [member, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    const trimmedName = name.trim();
    const finalRelation = relation === 'Other' ? (customRelation.trim() || 'Other') : relation.trim();
    const parsedAge = parseInt(age, 10);

    if (!trimmedName) {
      toast.error('Please enter the family member name.');
      return;
    }
    if (!finalRelation) {
      toast.error('Please select or specify a relation.');
      return;
    }
    if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 130) {
      toast.error('Please enter a valid age between 0 and 130.');
      return;
    }

    setIsSaving(true);
    try {
      let avatarUrl = selectedAvatarUrl;

      // If user uploaded a new custom image file, upload it to cloud storage
      if (avatarFile) {
        const uploadToast = toast.loading('Uploading profile picture...');
        const uploadedUrl = await uploadImage(avatarFile);
        toast.dismiss(uploadToast);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        } else {
          toast.error('Could not upload custom photo. Keeping previous avatar.');
          avatarUrl = member.avatar || selectedAvatarUrl;
        }
      }

      const updatedMember: FamilyMember = {
        ...member,
        name: trimmedName,
        relation: finalRelation,
        age: parsedAge,
        avatar: avatarUrl,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        bloodGroup: bloodGroup !== 'Unknown' ? bloodGroup : undefined,
        allergies: allergies.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      await onSave(updatedMember);
      toast.success(`${trimmedName}'s profile updated!`);
      onClose();
    } catch (err: any) {
      console.error('Error saving family member:', err);
      toast.error(err?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!member) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Profile: ${member.name}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
        <div className="space-y-4 pb-4">
          
          {/* Mobile-Friendly Avatar Header */}
          <div className="p-3 sm:p-3.5 bg-slate-50 dark:bg-zinc-900/60 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <img 
                    src={selectedAvatarUrl} 
                    alt={name || 'Avatar'} 
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-primary shadow-sm bg-white" 
                  />
                  {avatarFile && (
                    <span className="absolute -bottom-1 -right-1 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">
                      New
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-light-text-primary dark:text-text-primary truncate">
                    Profile Picture
                  </p>
                  <p className="text-[11px] text-light-text-secondary dark:text-text-secondary mt-0.5 truncate">
                    {avatarFile ? avatarFile.name : 'Vector art or custom photo'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAvatarPickerOpen(!isAvatarPickerOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-light-text-primary dark:text-text-primary hover:bg-slate-100 dark:hover:bg-zinc-700 transition active:scale-95 shrink-0 shadow-sm min-h-[38px]"
              >
                <HiOutlineSparkles className="w-3.5 h-3.5 text-primary" />
                <span>{isAvatarPickerOpen ? 'Done' : 'Change'}</span>
                {isAvatarPickerOpen ? (
                  <HiOutlineChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <HiOutlineChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
            </div>

            {/* Collapsible Avatar Picker for mobile convenience */}
            {isAvatarPickerOpen && (
              <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-zinc-800">
                <AvatarPicker
                  selectedAvatarUrl={selectedAvatarUrl}
                  onSelectAvatarUrl={(url) => setSelectedAvatarUrl(url)}
                  avatarFile={avatarFile}
                  onSelectAvatarFile={(file) => setAvatarFile(file)}
                  showPreview={false}
                />
              </div>
            )}
          </div>

          {/* Primary Identity Info */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-light-text-secondary dark:text-text-secondary mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Eleanor Vance"
                    className="w-full h-11 sm:h-10 px-3 pl-9 rounded-xl border border-slate-200 dark:border-zinc-700 bg-light-background dark:bg-background text-base sm:text-sm text-light-text-primary dark:text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  />
                  <HiOutlineUser className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 sm:top-3 pointer-events-none" />
                </div>
              </div>

              {/* Relation / Role */}
              <div>
                <label className="block text-xs font-bold text-light-text-secondary dark:text-text-secondary mb-1">
                  Relation / Role <span className="text-rose-500">*</span>
                </label>
                <select
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                  className="w-full h-11 sm:h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-light-background dark:bg-background text-base sm:text-sm text-light-text-primary dark:text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition cursor-pointer"
                >
                  {COMMON_RELATIONS.map((rel) => (
                    <option key={rel} value={rel}>{rel}</option>
                  ))}
                </select>
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-bold text-light-text-secondary dark:text-text-secondary mb-1">
                  Age (Years) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="130"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 34"
                    className="w-full h-11 sm:h-10 px-3 pl-9 rounded-xl border border-slate-200 dark:border-zinc-700 bg-light-background dark:bg-background text-base sm:text-sm text-light-text-primary dark:text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  />
                  <HiOutlineCalendar className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 sm:top-3 pointer-events-none" />
                </div>
              </div>

              {/* Custom Relation if "Other" */}
              {relation === 'Other' && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-light-text-secondary dark:text-text-secondary mb-1">
                    Specify Custom Relation <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customRelation}
                    onChange={(e) => setCustomRelation(e.target.value)}
                    placeholder="e.g. Step-daughter, Guardian, Nanny"
                    className="w-full h-11 sm:h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-light-background dark:bg-background text-base sm:text-sm text-light-text-primary dark:text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Contact & Health Details Section */}
          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setShowOptionalHealth(!showOptionalHealth)}
              className="w-full flex items-center justify-between py-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 hover:text-primary transition"
            >
              <span className="flex items-center gap-1.5">
                <HiOutlineHeart className="w-4 h-4 text-rose-500" />
                <span>Contact &amp; Health Details</span>
              </span>
              {showOptionalHealth ? (
                <HiOutlineChevronUp className="w-4 h-4" />
              ) : (
                <HiOutlineChevronDown className="w-4 h-4" />
              )}
            </button>

            {showOptionalHealth && (
              <div className="mt-2 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-bold text-light-text-secondary dark:text-text-secondary mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +1 (555) 019-2834"
                        className="w-full h-11 sm:h-10 px-3 pl-9 rounded-xl border border-slate-200 dark:border-zinc-700 bg-light-background dark:bg-background text-base sm:text-sm text-light-text-primary dark:text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                      />
                      <HiOutlinePhone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 sm:top-3 pointer-events-none" />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-light-text-secondary dark:text-text-secondary mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. name@family.care"
                        className="w-full h-11 sm:h-10 px-3 pl-9 rounded-xl border border-slate-200 dark:border-zinc-700 bg-light-background dark:bg-background text-base sm:text-sm text-light-text-primary dark:text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                      />
                      <HiOutlineEnvelope className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 sm:top-3 pointer-events-none" />
                    </div>
                  </div>

                  {/* Blood Group */}
                  <div>
                    <label className="block text-xs font-bold text-light-text-secondary dark:text-text-secondary mb-1 flex items-center gap-1">
                      <HiOutlineHeart className="w-3.5 h-3.5 text-rose-500" />
                      <span>Blood Group</span>
                    </label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full h-11 sm:h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-light-background dark:bg-background text-base sm:text-sm text-light-text-primary dark:text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition cursor-pointer"
                    >
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>

                  {/* Known Allergies */}
                  <div>
                    <label className="block text-xs font-bold text-light-text-secondary dark:text-text-secondary mb-1 flex items-center gap-1">
                      <HiOutlineExclamationTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span>Known Allergies</span>
                    </label>
                    <input
                      type="text"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      placeholder="e.g. Penicillin, Peanuts"
                      className="w-full h-11 sm:h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-light-background dark:bg-background text-base sm:text-sm text-light-text-primary dark:text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-light-text-secondary dark:text-text-secondary mb-1 flex items-center gap-1">
                    <HiOutlineDocumentText className="w-3.5 h-3.5 text-primary" />
                    <span>Personal &amp; Medical Notes</span>
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Care instructions, pediatric milestones, dietary guidelines, or notes..."
                    className="w-full p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-light-background dark:bg-background text-base sm:text-sm text-light-text-primary dark:text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
                  />
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Sticky Mobile Action Footer */}
        <div className="sticky bottom-0 bg-light-surface/95 dark:bg-surface/95 backdrop-blur-md pt-3 pb-1 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-2.5 mt-auto">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 sm:flex-none h-11 sm:h-10"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving}
            icon={<HiOutlineCheck className="w-4 h-4" />}
            className="flex-1 sm:flex-none h-11 sm:h-10"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
