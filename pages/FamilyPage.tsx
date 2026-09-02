import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import PageHeader from '../components/ui/PageHeader';
import Skeleton from '../components/ui/Skeleton';
import SpeedDialFAB, { SpeedDialAction } from '../components/ui/SpeedDialFAB';
import { uploadImage } from '../utils/imageUploader';
import { 
  HiPlus, 
  HiOutlineCloudArrowUp, 
  HiOutlineEnvelope, 
  HiOutlinePaperAirplane, 
  HiCheckCircle,
  HiOutlineTrash,
  HiOutlineXMark,
  HiOutlineExclamationTriangle,
  HiOutlineUserMinus
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { useTranslation } from '../hooks/useTranslation';
import { FamilyMember } from '../types';

const FamilyPage: React.FC = () => {
  const { 
    loading, 
    familyMembers, 
    addFamilyMember, 
    deleteFamilyMember,
    sendFamilyInvite, 
    cancelFamilyInvite,
    isGoogleAuthenticated, 
    loginWithGoogle 
  } = useAppContext();
  const { t } = useTranslation();
  
  // Add Member Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [sendInviteOnCreate, setSendInviteOnCreate] = useState(true);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Invite Modal State for Existing Members
  const [selectedMemberForInvite, setSelectedMemberForInvite] = useState<FamilyMember | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  // Confirmation Modal States
  const [memberToDelete, setMemberToDelete] = useState<FamilyMember | null>(null);
  const [memberToCancelInvite, setMemberToCancelInvite] = useState<FamilyMember | null>(null);
  const [isCancellingInvite, setIsCancellingInvite] = useState(false);

  const resetForm = () => {
    setName('');
    setRelation('');
    setAge('');
    setEmail('');
    setSendInviteOnCreate(true);
    setAvatarFile(null);
  };

  const handleAddMember = async () => {
    if (name && relation && age) {
      let avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face';
      
      if (avatarFile) {
        setIsUploading(true);
        toast.loading(t('family.modal.uploadingImage'));
        const uploaded = await uploadImage(avatarFile);
        toast.dismiss();
        setIsUploading(false);
        if (uploaded) {
          avatarUrl = uploaded;
        }
      }

      addFamilyMember({ 
        name, 
        relation, 
        age: parseInt(age) || 0, 
        avatar: avatarUrl,
        email: email.trim() || undefined,
        inviteStatus: email.trim() && sendInviteOnCreate ? 'none' : undefined,
      });

      toast.success(t('family.modal.memberAdded'));
      setIsModalOpen(false);

      // If email provided and send invite checked, trigger Gmail invite
      if (email.trim() && sendInviteOnCreate) {
        if (!isGoogleAuthenticated) {
          toast((toastT) => (
            <div className="flex items-center gap-2">
              <span>{t('family.signInToInvite')}</span>
              <button 
                onClick={async () => {
                  toast.dismiss(toastT.id);
                  await loginWithGoogle();
                }}
                className="px-2 py-1 bg-primary text-white rounded text-xs font-bold"
              >
                {t('common.signIn')}
              </button>
            </div>
          ), { duration: 6000 });
        }
      }

      resetForm();
    } else {
      toast.error(t('family.modal.fillFieldsError'));
    }
  };

  const openInviteModal = (member: FamilyMember, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedMemberForInvite(member);
    setInviteEmail(member.email || '');
    setCustomMessage('');
  };

  const promptCancelInvite = (member: FamilyMember, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMemberToCancelInvite(member);
  };

  const promptDeleteMember = (member: FamilyMember, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMemberToDelete(member);
  };

  const handleConfirmCancelInvite = async () => {
    if (!memberToCancelInvite) return;
    setIsCancellingInvite(true);
    try {
      await cancelFamilyInvite(memberToCancelInvite.id);
      setMemberToCancelInvite(null);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to cancel invite');
    } finally {
      setIsCancellingInvite(false);
    }
  };

  const handleConfirmDeleteMember = async () => {
    if (!memberToDelete) return;
    try {
      await deleteFamilyMember(memberToDelete.id);
      setMemberToDelete(null);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to remove family member');
    }
  };

  const handleSendGmailInvite = async () => {
    if (!selectedMemberForInvite) return;
    if (!inviteEmail.trim()) {
      toast.error('Please enter a valid Gmail address.');
      return;
    }

    if (!isGoogleAuthenticated) {
      try {
        const loggedIn = await loginWithGoogle();
        if (!loggedIn) return;
      } catch (err: any) {
        if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
          return;
        }
        console.error(err);
        toast.error('Google sign-in was blocked or cancelled.');
        return;
      }
    }

    setIsSendingInvite(true);
    const toastId = toast.loading(t('googleServices.sendingInvite'));
    
    try {
      const res = await sendFamilyInvite(selectedMemberForInvite.id, inviteEmail.trim(), customMessage.trim());
      toast.dismiss(toastId);
      if (res.success) {
        toast.success(t('googleServices.inviteSentSuccess').replace('{name}', selectedMemberForInvite.name));
        setSelectedMemberForInvite(null);
      } else {
        if (res.mailtoFallback) {
          toast((tItem) => (
            <div className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-amber-600 dark:text-amber-400">{res.error || 'Gmail API notice'}</span>
              <div className="flex items-center gap-2 mt-1">
                <a
                  href={res.mailtoFallback}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    toast.dismiss(tItem.id);
                    setSelectedMemberForInvite(null);
                  }}
                  className="px-2.5 py-1 bg-primary text-white rounded font-bold hover:bg-primary-focus transition inline-flex items-center gap-1.5"
                >
                  <HiOutlineEnvelope className="w-3.5 h-3.5" />
                  Send via Email Client
                </a>
                <button
                  onClick={() => toast.dismiss(tItem.id)}
                  className="px-2 py-1 bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-slate-300 rounded"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ), { duration: 9000 });
        } else {
          toast.error(res.error || t('googleServices.inviteSentError'));
        }
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      console.error(err);
      toast.error('Failed to send invite.');
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const renderSkeleton = () => (
    [...Array(4)].map((_, i) => (
        <Card key={i} className="text-center">
            <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
            <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
            <Skeleton className="h-4 w-1/2 mx-auto mb-2" />
            <Skeleton className="h-4 w-1/3 mx-auto" />
        </Card>
    ))
  );

  const fabActions: SpeedDialAction[] = [
    {
      id: 'add_member',
      label: t('family.addMember') || 'Add Family Member',
      icon: HiPlus,
      color: 'purple',
      onClick: () => {
        resetForm();
        setIsModalOpen(true);
      },
    },
    {
      id: 'invite_gmail',
      label: 'Invite via Gmail',
      icon: HiOutlineEnvelope,
      color: 'indigo',
      onClick: () => {
        if (familyMembers.length > 0) {
          setSelectedMemberForInvite(familyMembers[0]);
          setInviteEmail(familyMembers[0].email || '');
          setCustomMessage('');
        } else {
          resetForm();
          setIsModalOpen(true);
        }
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('family.title')}
        subtitle={t('family.subtitle')}
        action={
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 sm:px-4 sm:py-2.5 bg-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm shrink-0 text-xs sm:text-sm whitespace-nowrap"
          >
            <HiPlus className="h-4 w-4" />
            {t('family.addMember')}
          </button>
        }
      />

      {/* Google Workspace Banner */}
      {!isGoogleAuthenticated && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-transparent border border-blue-200 dark:border-blue-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-bold text-light-text-primary dark:text-text-primary">{t('family.connectGmailTitle')}</h4>
              <p className="text-xs text-light-text-secondary dark:text-text-secondary">{t('family.connectGmailDesc')}</p>
            </div>
          </div>
          <button
            onClick={loginWithGoogle}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary-focus transition-colors shadow-sm shrink-0"
          >
            {t('auth.googleSignIn')}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? renderSkeleton() : 
            familyMembers.length > 0 ? (
                familyMembers.map((member) => (
                    <div key={member.id} className="relative group">
                      <Link to={`/family/${member.id}`} className="block h-full">
                        <Card className="text-center h-full p-6 hover:shadow-md transition-all flex flex-col justify-between relative group/card border border-slate-200/80 dark:border-zinc-800">
                          
                          {/* Remove Member Top Button */}
                          <button
                            type="button"
                            onClick={(e) => promptDeleteMember(member, e)}
                            className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition opacity-60 group-hover/card:opacity-100"
                            title="Remove Member"
                            aria-label="Remove Member"
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>

                          <div>
                            <div className="relative inline-block mb-4">
                              <img 
                                src={member.avatar} 
                                alt={member.name} 
                                className="w-24 h-24 rounded-full mx-auto border-4 border-primary/40 object-cover shadow-inner" 
                              />
                              {member.inviteStatus === 'invited' && (
                                <span className="absolute bottom-0 right-0 p-1 bg-amber-500 text-white rounded-full ring-2 ring-white dark:ring-zinc-800" title="Invited via Gmail">
                                  <HiOutlineEnvelope className="w-3.5 h-3.5" />
                                </span>
                              )}
                              {member.inviteStatus === 'accepted' && (
                                <span className="absolute bottom-0 right-0 p-1 bg-emerald-500 text-white rounded-full ring-2 ring-white dark:ring-zinc-800" title="Joined &amp; Linked">
                                  <HiCheckCircle className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                            <h3 className="text-xl font-bold text-light-text-primary dark:text-text-primary truncate">{member.name}</h3>
                            <p className="text-sm font-medium text-primary mb-1">{member.relation}</p>
                            <p className="text-xs text-light-text-secondary dark:text-text-secondary">{member.age} {t('family.yearsOld')}</p>
                            
                            {member.email && (
                              <p className="text-[11px] text-light-text-secondary dark:text-text-secondary truncate mt-1 flex items-center justify-center gap-1">
                                <HiOutlineEnvelope className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{member.email}</span>
                              </p>
                            )}
                          </div>

                          {/* Invite / Status Actions */}
                          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/60">
                            {member.inviteStatus === 'invited' ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/30">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    {t('googleServices.statusInvited')}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => openInviteModal(member, e)}
                                    className="text-[11px] text-primary hover:underline font-semibold"
                                  >
                                    {t('googleServices.resendInvite')}
                                  </button>
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={(e) => promptCancelInvite(member, e)}
                                    className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-900/30 hover:bg-amber-200/60 dark:hover:bg-amber-900/50 transition flex items-center justify-center gap-1"
                                  >
                                    <HiOutlineXMark className="w-3.5 h-3.5" />
                                    {t('family.cancelInvite')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => promptDeleteMember(member, e)}
                                    className="py-1.5 px-2.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition flex items-center justify-center"
                                    title="Remove Member"
                                  >
                                    <HiOutlineTrash className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : member.inviteStatus === 'accepted' ? (
                              <div className="flex items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/30">
                                  <HiCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                  {t('googleServices.statusJoined')}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => promptDeleteMember(member, e)}
                                  className="text-[11px] text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 font-medium flex items-center gap-1"
                                >
                                  <HiOutlineTrash className="w-3 h-3" />
                                  {t('family.removeMember')}
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => openInviteModal(member, e)}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-zinc-800 hover:bg-primary hover:text-white dark:hover:bg-primary text-light-text-secondary dark:text-text-secondary transition-colors"
                                >
                                  <HiOutlinePaperAirplane className="w-3.5 h-3.5" />
                                  {t('googleServices.sendInviteBtn')}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => promptDeleteMember(member, e)}
                                  className="py-1.5 px-2 rounded-lg text-xs text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                                  title="Remove Member"
                                >
                                  <HiOutlineTrash className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </Card>
                      </Link>
                    </div>
                ))
            ) : (
                <Card className="sm:col-span-2 lg:col-span-3 text-center py-12">
                    <p className="text-light-text-secondary dark:text-text-secondary">{t('family.noMembers')}</p>
                </Card>
            )
        }
      </div>

      {/* SPEED DIAL FLOATING ACTION BUTTON */}
      <SpeedDialFAB
        actions={fabActions}
        mainLabel="Family Actions"
      />

      {/* Add Member Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('family.modal.title')}>
        <div className="space-y-4 py-1">
          <div>
            <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">
              {t('family.modal.name')} *
            </label>
            <input 
              type="text" 
              placeholder="e.g. Sarah Johnson" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full p-2.5 sm:p-3 border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-slate-600 text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent text-sm" 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">
                {t('family.modal.relation')} *
              </label>
              <input 
                type="text" 
                placeholder="e.g. Mother, Spouse, Son" 
                value={relation} 
                onChange={e => setRelation(e.target.value)} 
                className="w-full p-2.5 sm:p-3 border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-slate-600 text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent text-sm" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">
                {t('family.modal.age')} *
              </label>
              <input 
                type="number" 
                placeholder="e.g. 42" 
                value={age} 
                onChange={e => setAge(e.target.value)} 
                className="w-full p-2.5 sm:p-3 border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-slate-600 text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent text-sm" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">
              {t('family.emailLabel')}
            </label>
            <input 
              type="email" 
              placeholder="e.g. sarah.johnson@gmail.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full p-2.5 sm:p-3 border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-slate-600 text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent text-sm" 
            />
          </div>

          {email.trim() && (
            <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-zinc-800/50 cursor-pointer text-xs text-light-text-secondary dark:text-text-secondary">
              <input 
                type="checkbox" 
                checked={sendInviteOnCreate} 
                onChange={e => setSendInviteOnCreate(e.target.checked)} 
                className="rounded text-primary focus:ring-primary h-4 w-4"
              />
              <span className="font-medium text-light-text-primary dark:text-text-primary">{t('family.sendInviteCheckbox')}</span>
            </label>
          )}

          <div>
            <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">
              {t('family.photoLabel')}
            </label>
            <label className="block w-full cursor-pointer p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-center text-light-text-secondary dark:text-text-secondary hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
              <div className="flex flex-col items-center justify-center">
                <HiOutlineCloudArrowUp className="h-6 w-6 mb-1 text-primary" />
                <span className="text-xs font-medium">{avatarFile ? avatarFile.name : t('family.modal.uploadAvatar')}</span>
              </div>
              <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
            </label>
          </div>

          <button 
            onClick={handleAddMember} 
            disabled={isUploading} 
            className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-focus transition disabled:opacity-60 shadow-md active:scale-[0.99] text-sm"
          >
            {isUploading ? t('family.modal.uploading') : t('family.modal.addMemberBtn')}
          </button>
        </div>
      </Modal>

      {/* Gmail Family Invite Modal */}
      <Modal 
        isOpen={!!selectedMemberForInvite} 
        onClose={() => setSelectedMemberForInvite(null)} 
        title={t('googleServices.inviteModalTitle')}
      >
        {selectedMemberForInvite && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700">
              <img 
                src={selectedMemberForInvite.avatar} 
                alt={selectedMemberForInvite.name} 
                className="w-12 h-12 rounded-full object-cover border border-primary/50"
              />
              <div>
                <h4 className="text-sm font-bold text-light-text-primary dark:text-text-primary">{selectedMemberForInvite.name}</h4>
                <p className="text-xs text-primary font-medium">{selectedMemberForInvite.relation}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1">
                {t('googleServices.inviteEmailPlaceholder')} *
              </label>
              <input 
                type="email" 
                placeholder="recipient@gmail.com" 
                value={inviteEmail} 
                onChange={e => setInviteEmail(e.target.value)} 
                className="w-full p-2.5 border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-slate-600 text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent text-sm" 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1">
                {t('googleServices.inviteMessagePlaceholder')}
              </label>
              <textarea 
                rows={3} 
                placeholder="Hey! Join our family care portal on Sprout to track appointments, health records, and home tasks together." 
                value={customMessage} 
                onChange={e => setCustomMessage(e.target.value)} 
                className="w-full p-2.5 border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-slate-600 text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none" 
              />
            </div>

            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-xs text-blue-800 dark:text-blue-300 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <HiOutlineEnvelope className="w-4 h-4 text-blue-500" />
                {t('family.directGmailDelivery')}
              </p>
              <p className="text-[11px]">{t('family.gmailInviteNote')}</p>
            </div>

            <div className="flex gap-2 pt-1">
              <button 
                type="button" 
                onClick={() => setSelectedMemberForInvite(null)} 
                className="flex-1 py-2 px-3 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
              >
                {t('family.cancel')}
              </button>
              <button 
                type="button" 
                onClick={handleSendGmailInvite} 
                disabled={isSendingInvite} 
                className="flex-1 py-2 px-3 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-focus transition disabled:opacity-60 flex items-center justify-center gap-1.5 shadow-sm"
              >
                <HiOutlinePaperAirplane className="w-3.5 h-3.5" />
                {isSendingInvite ? t('googleServices.sendingInvite') : t('googleServices.sendInviteBtn')}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Invite Confirmation Modal */}
      <Modal
        isOpen={!!memberToCancelInvite}
        onClose={() => setMemberToCancelInvite(null)}
        title={t('family.cancelInvite')}
      >
        {memberToCancelInvite && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40">
              <HiOutlineExclamationTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-800 dark:text-amber-200">
                  Cancel Invitation for {memberToCancelInvite.name}?
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  The invitation link previously sent to {memberToCancelInvite.email || 'this member'} will be deactivated. You can send a new invitation at any time.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMemberToCancelInvite(null)}
                className="flex-1 py-2 px-3 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
              >
                {t('family.cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelInvite}
                disabled={isCancellingInvite}
                className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition disabled:opacity-60 flex items-center justify-center gap-1.5 shadow-sm"
              >
                <HiOutlineXMark className="w-4 h-4" />
                {isCancellingInvite ? 'Cancelling...' : t('family.cancelInvite')}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Remove Member Confirmation Modal */}
      <Modal
        isOpen={!!memberToDelete}
        onClose={() => setMemberToDelete(null)}
        title={t('family.removeMember')}
      >
        {memberToDelete && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40">
              <HiOutlineUserMinus className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-rose-800 dark:text-rose-200">
                  Remove {memberToDelete.name} ({memberToDelete.relation})?
                </h4>
                <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
                  {t('family.removeMemberConfirm').replace('{name}', memberToDelete.name)}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                className="flex-1 py-2 px-3 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
              >
                {t('family.cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteMember}
                className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <HiOutlineTrash className="w-4 h-4" />
                {t('family.confirmDelete')}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FamilyPage;
