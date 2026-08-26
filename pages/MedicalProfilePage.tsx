import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { Medicine, MedicalReportCategory, MedicalReport } from '../types';
import { uploadImage } from '../utils/imageUploader';
import toast from 'react-hot-toast';
import { HiOutlineDocumentText, HiOutlineCalendar, HiOutlineTag, HiPlus, HiOutlineCloudArrowUp, HiOutlineClock } from 'react-icons/hi2';
import { FaUserDoctor } from 'react-icons/fa6';

const MedicalProfilePage: React.FC = () => {
    const { memberId } = useParams<{ memberId: string }>();
    const { familyMembers, medicines, medicalReports, appointments, loading, addMedicalReport } = useAppContext();
    const { t } = useTranslation();
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);

    const member = useMemo(() => familyMembers.find(m => m.id === memberId), [familyMembers, memberId]);
    const memberMedicines = useMemo(() => medicines.filter(m => m.memberId === memberId), [medicines, memberId]);
    const memberReports = useMemo(() => medicalReports.filter(r => r.memberId === memberId), [medicalReports, memberId]);
    const memberAppointments = useMemo(() => appointments.filter(a => a.memberId === memberId && a.status === 'upcoming'), [appointments, memberId]);

    if (loading) return <div>Loading...</div>;
    if (!member) return <Navigate to="/family" replace />;
    
    // Member Header Component
    const MemberHeader = () => (
        <Card className="flex items-center gap-4 mb-6">
            <img src={member.avatar} alt={member.name} className="w-20 h-20 rounded-full object-cover border-4 border-primary" />
            <div>
                <h1 className="text-3xl font-bold text-light-text-primary dark:text-text-primary">{member.name}</h1>
                <p className="text-light-text-secondary dark:text-text-secondary">{member.relation} - {member.age} {t('family.yearsOld')}</p>
            </div>
        </Card>
    );

    // Current Medicines Component
    const CurrentMedicines = () => {
        const [now, setNow] = useState(new Date());

        useEffect(() => {
            const timer = setInterval(() => setNow(new Date()), 60000); // Update every minute
            return () => clearInterval(timer);
        }, []);

        const getNextDoseInfo = (med: Medicine) => {
            const today = new Date();
            const upcomingDoses = med.times
                .map(time => {
                    const [hour, minute] = time.split(':');
                    const doseTime = new Date(today);
                    doseTime.setHours(parseInt(hour), parseInt(minute), 0, 0);
                    return doseTime;
                })
                .filter(doseTime => doseTime > now)
                .sort((a, b) => a.getTime() - b.getTime());

            if (upcomingDoses.length === 0) return null;

            const nextDoseTime = upcomingDoses[0];
            const diffMinutes = Math.round((nextDoseTime.getTime() - now.getTime()) / 60000);

            if (diffMinutes <= 0) return t('medicalProfile.medicines.now');
            if (diffMinutes < 60) return `${diffMinutes} ${t('medicalProfile.medicines.minutes')}`;
            
            const hours = Math.floor(diffMinutes / 60);
            const minutes = diffMinutes % 60;
            return `${hours} ${t('medicalProfile.medicines.hours')} ${minutes > 0 ? `${minutes} ${t('medicalProfile.medicines.minutes')}` : ''}`;
        };

        return (
            <Card>
                <h2 className="text-xl font-semibold mb-4">{t('medicalProfile.medicines.title')}</h2>
                {memberMedicines.length > 0 ? (
                    <div className="space-y-3">
                        {memberMedicines.map(med => {
                            const nextDoseInfo = getNextDoseInfo(med);
                            return (
                                <div key={med.id} className="p-3 bg-light-background dark:bg-background rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-light-text-primary dark:text-text-primary">{med.name} <span className="text-sm font-normal text-light-text-secondary dark:text-text-secondary">{med.dosage}{med.unit}</span></p>
                                        <p className="text-xs text-light-text-secondary dark:text-text-secondary capitalize">{med.times.join(', ')} - {med.mealRelation} meal</p>
                                    </div>
                                    {nextDoseInfo && <p className="text-sm font-semibold text-primary">{t('medicalProfile.medicines.nextDose')} {nextDoseInfo}</p>}
                                </div>
                            );
                        })}
                    </div>
                ) : <p className="text-light-text-secondary dark:text-text-secondary">{t('medicalProfile.medicines.noMedicines')}</p>}
            </Card>
        );
    };

    // Upcoming Appointments Component
    const UpcomingAppointments = () => (
        <Card>
            <h2 className="text-xl font-semibold mb-4">{t('appointments.upcomingTitle')}</h2>
            {memberAppointments.length > 0 ? (
                <div className="space-y-3">
                    {memberAppointments.map(appt => (
                        <div key={appt.id} className="p-3 bg-light-background dark:bg-background rounded-lg">
                            <p className="font-bold text-light-text-primary dark:text-text-primary">{appt.purpose}</p>
                            <div className="flex items-center gap-3 text-sm text-light-text-secondary dark:text-text-secondary mt-1">
                                <span className="flex items-center gap-1"><FaUserDoctor /> {appt.doctorName}</span>
                                <span className="flex items-center gap-1"><HiOutlineClock /> {new Date(appt.dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : <p className="text-light-text-secondary dark:text-text-secondary">{t('appointments.noUpcoming')}</p>}
        </Card>
    );

    // Intake History Component
    const IntakeHistory = () => {
        const [filter, setFilter] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
        
        const historyData = useMemo(() => {
            const endDate = new Date();
            const startDate = new Date();
            if (filter === 'daily') startDate.setDate(endDate.getDate() - 1);
            if (filter === 'weekly') startDate.setDate(endDate.getDate() - 7);
            if (filter === 'monthly') startDate.setMonth(endDate.getMonth() - 1);
            
            const relevantHistory = memberMedicines.flatMap(med => med.history)
                .filter(h => {
                    const hDate = new Date(h.timestamp);
                    return hDate >= startDate && hDate <= endDate;
                });
            
            const taken = relevantHistory.filter(h => h.status === 'taken').length;
            const missed = relevantHistory.filter(h => h.status === 'missed').length;
            const total = taken + missed;
            const compliance = total > 0 ? Math.round((taken / total) * 100) : 0;

            return { taken, missed, compliance, total };
        }, [filter, memberMedicines]);

        const FilterButton = ({ type, label }: { type: 'daily' | 'weekly' | 'monthly', label: string }) => (
            <button onClick={() => setFilter(type)} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${filter === type ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-zinc-700'}`}>{label}</button>
        );

        return (
            <Card>
                 <h2 className="text-xl font-semibold mb-4">{t('medicalProfile.history.title')}</h2>
                 <div className="flex justify-center gap-2 mb-4">
                     <FilterButton type="daily" label={t('medicalProfile.history.daily')} />
                     <FilterButton type="weekly" label={t('medicalProfile.history.weekly')} />
                     <FilterButton type="monthly" label={t('medicalProfile.history.monthly')} />
                 </div>
                 {historyData.total > 0 ? (
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold">{t('medicalProfile.history.compliance')}</span>
                            <span className="font-bold text-lg text-primary">{historyData.compliance}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-zinc-700 rounded-full h-4">
                            <div className="bg-primary h-4 rounded-full" style={{ width: `${historyData.compliance}%` }}></div>
                        </div>
                        <div className="flex justify-between text-sm mt-2">
                             <span className="text-green-500">Taken: {historyData.taken}</span>
                             <span className="text-red-500">Missed: {historyData.missed}</span>
                        </div>
                    </div>
                 ) : <p className="text-center text-light-text-secondary dark:text-text-secondary">{t('medicalProfile.history.noHistory')}</p>}
            </Card>
        );
    };
    
    // Health Documents Component
    const HealthDocuments = () => (
        <Card>
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{t('medicalProfile.documents.title')}</h2>
                <button onClick={() => setUploadModalOpen(true)} className="px-3 py-1.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-opacity-90 transition flex items-center gap-2">
                    <HiPlus/> {t('medicalProfile.documents.upload')}
                </button>
            </div>
            {memberReports.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {memberReports.map(report => (
                        <a key={report.id} href={report.fileUrl} target="_blank" rel="noopener noreferrer" className="block p-3 bg-light-background dark:bg-background rounded-lg hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                                    <HiOutlineDocumentText className="h-7 w-7" />
                                </div>
                                <div className="truncate">
                                    <p className="font-semibold truncate text-light-text-primary dark:text-text-primary">{report.name}</p>
                                    <div className="flex items-center gap-3 text-xs text-light-text-secondary dark:text-text-secondary">
                                        <div className="flex items-center gap-1"><HiOutlineTag/> {report.category}</div>
                                        <div className="flex items-center gap-1"><HiOutlineCalendar/> {new Date(report.date).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            ) : <p className="text-light-text-secondary dark:text-text-secondary">{t('medicalProfile.documents.noDocuments')}</p>}
        </Card>
    );
    
    // Upload Modal Component
    const UploadReportModal = () => {
        const [name, setName] = useState('');
        const [category, setCategory] = useState<MedicalReportCategory>(MedicalReportCategory.LAB_REPORT);
        const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
        const [file, setFile] = useState<File | null>(null);
        const [isUploading, setIsUploading] = useState(false);

        const handleUpload = async () => {
            if (!name || !category || !date || !file) {
                toast.error(t('medicalProfile.documents.modal.fillError'));
                return;
            }
            setIsUploading(true);
            toast.loading(t('family.modal.uploadingImage'));
            const fileUrl = await uploadImage(file);
            toast.dismiss();
            setIsUploading(false);

            if (fileUrl) {
                addMedicalReport({ memberId: member.id, name, category, date, fileUrl });
                toast.success(t('medicalProfile.documents.modal.uploadSuccess'));
                setUploadModalOpen(false);
            }
        };

        return (
             <Modal isOpen={isUploadModalOpen} onClose={() => setUploadModalOpen(false)} title={t('medicalProfile.documents.modal.title')}>
                <div className="space-y-4">
                    <input type="text" placeholder={t('medicalProfile.documents.modal.name')} value={name} onChange={e => setName(e.target.value)} className="w-full p-3 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600" />
                    <select value={category} onChange={e => setCategory(e.target.value as MedicalReportCategory)} className="w-full p-3 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600">
                        {Object.values(MedicalReportCategory).map(cat => <option key={cat} value={cat}>{t(`medicalProfile.documents.modal.categories.${cat.split(' ')[0].toLowerCase()}`)}</option>)}
                    </select>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600" />
                    <label className="block w-full cursor-pointer p-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-center text-light-text-secondary dark:text-text-secondary hover:bg-slate-100 dark:hover:bg-zinc-700/80">
                        <div className="flex flex-col items-center justify-center">
                            <HiOutlineCloudArrowUp className="h-8 w-8 mb-1" />
                            <span>{file ? file.name : t('medicalProfile.documents.modal.selectFile')}</span>
                        </div>
                        <input type="file" className="hidden" onChange={e => e.target.files && setFile(e.target.files[0])} accept="image/*,application/pdf" />
                    </label>
                    <button onClick={handleUpload} disabled={isUploading} className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-opacity-90 disabled:bg-slate-500">
                        {isUploading ? t('medicalProfile.documents.modal.uploading') : t('medicalProfile.documents.modal.add')}
                    </button>
                </div>
            </Modal>
        )
    };

    return (
        <div className="space-y-6">
            <MemberHeader />
            <UpcomingAppointments />
            <CurrentMedicines />
            <IntakeHistory />
            <HealthDocuments />
            <UploadReportModal />
        </div>
    );
};

export default MedicalProfilePage;
