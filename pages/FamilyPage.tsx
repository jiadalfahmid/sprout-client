import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Skeleton from '../components/ui/Skeleton';
import { uploadImage } from '../utils/imageUploader';
import { HiPlus, HiOutlineCloudArrowUp } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';

const FamilyPage: React.FC = () => {
  const { loading, familyMembers, addFamilyMember } = useAppContext();
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [age, setAge] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const resetForm = () => {
    setName('');
    setRelation('');
    setAge('');
    setAvatarFile(null);
  };

  const handleAddMember = async () => {
    if (name && relation && age && avatarFile) {
      setIsUploading(true);
      toast.loading(t('family.modal.uploadingImage'));
      const avatarUrl = await uploadImage(avatarFile);
      toast.dismiss();
      setIsUploading(false);

      if (avatarUrl) {
        addFamilyMember({ name, relation, age: parseInt(age), avatar: avatarUrl });
        toast.success(t('family.modal.memberAdded'));
        setIsModalOpen(false);
        resetForm();
      }
    } else {
        toast.error(t('family.modal.fillFieldsError'))
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
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-light-text-primary dark:text-text-primary">{t('family.title')}</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-opacity-90 transition flex items-center gap-2"
        >
          <HiPlus className="h-5 w-5" />
          {t('family.addMember')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? renderSkeleton() : 
            familyMembers.length > 0 ? (
                familyMembers.map((member, index) => (
                    <Link to={`/family/${member.id}`} key={member.id} className="block h-full">
                      <Card className="text-center h-full">
                        <img src={member.avatar} alt={member.name} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-primary object-cover" />
                        <h3 className="text-xl font-bold text-light-text-primary dark:text-text-primary">{member.name}</h3>
                        <p className="text-light-text-secondary dark:text-text-secondary">{member.relation}</p>
                        <p className="text-sm text-light-text-secondary dark:text-text-secondary">{member.age} {t('family.yearsOld')}</p>
                      </Card>
                    </Link>
                ))
            ) : (
                <Card className="sm:col-span-2 lg:col-span-3 text-center">
                    <p className="text-light-text-secondary dark:text-text-secondary">{t('family.noMembers')}</p>
                </Card>
            )
        }
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('family.modal.title')}>
        <div className="space-y-4">
          <input type="text" placeholder={t('family.modal.name')} value={name} onChange={e => setName(e.target.value)} className="w-full p-3 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600 text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent" />
          <input type="text" placeholder={t('family.modal.relation')} value={relation} onChange={e => setRelation(e.target.value)} className="w-full p-3 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600 text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent" />
          <input type="number" placeholder={t('family.modal.age')} value={age} onChange={e => setAge(e.target.value)} className="w-full p-3 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600 text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent" />
           <div>
              <label className="block w-full cursor-pointer p-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-center text-light-text-secondary dark:text-text-secondary hover:bg-slate-100 dark:hover:bg-slate-700/80">
                  <div className="flex flex-col items-center justify-center">
                      <HiOutlineCloudArrowUp className="h-8 w-8 mb-1" />
                      <span>{avatarFile ? avatarFile.name : t('family.modal.uploadAvatar')}</span>
                  </div>
                  <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
              </label>
          </div>
          <button onClick={handleAddMember} disabled={isUploading} className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-opacity-90 disabled:bg-slate-500">
            {isUploading ? t('family.modal.uploading') : t('family.modal.addMemberBtn')}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default FamilyPage;