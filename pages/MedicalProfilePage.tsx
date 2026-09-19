import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import SectionHeading from '../components/ui/SectionHeading';
import { Medicine, MedicalReportCategory, MedicalReport } from '../types';
import { uploadImageWithDetails, deleteHostedImage } from '../utils/imageUploader';
import { downloadFile } from '../utils/downloadHelper';
import { EditFamilyMemberModal } from '../components/family/EditFamilyMemberModal';
import toast from 'react-hot-toast';
import { 
  HiOutlineDocumentText, 
  HiOutlineCalendar, 
  HiOutlineTag, 
  HiPlus, 
  HiOutlineCloudArrowUp, 
  HiOutlineClock, 
  HiOutlineUserCircle,
  HiOutlinePencilSquare,
  HiOutlineArrowDownTray,
  HiOutlineTrash,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineHeart,
  HiOutlineExclamationTriangle,
  HiOutlinePhone,
  HiOutlineEnvelope
} from 'react-icons/hi2';

const MedicalProfilePage: React.FC = () => {
    const { memberId } = useParams<{ memberId: string }>();
    const { 
        familyMembers, 
        medicines, 
        medicalReports, 
        appointments, 
        loading, 
        addMedicalReport,
        deleteMedicalReport,
        updateFamilyMember 
    } = useAppContext();
    const { t } = useTranslation();
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [reportToDelete, setReportToDelete] = useState<MedicalReport | null>(null);
    const [isDeletingReport, setIsDeletingReport] = useState(false);
    const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);

    const member = useMemo(() => familyMembers.find(m => m.id === memberId), [familyMembers, memberId]);
    const memberMedicines = useMemo(() => medicines.filter(m => m.memberId === memberId), [medicines, memberId]);
    const memberReports = useMemo(() => medicalReports.filter(r => r.memberId === memberId), [medicalReports, memberId]);
    const memberAppointments = useMemo(() => appointments.filter(a => a.memberId === memberId && a.status === 'upcoming'), [appointments, memberId]);

    if (loading) return <div>{t('common.loading')}</div>;
    if (!member) return <Navigate to="/family" replace />;
    
    // Member Header Component with Edit Button & Details
    const MemberHeader = () => (
        <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-4 sm:p-6">
            <div className="flex items-center gap-4 min-w-0">
                <img 
                    src={member.avatar} 
                    alt={member.name} 
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-primary shadow-sm bg-white shrink-0" 
                />
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-light-text-primary dark:text-text-primary truncate">
                        {member.name}
                    </h1>
                    <p className="text-sm font-semibold text-primary mt-0.5">
                        {member.relation} · {member.age} {t('family.yearsOld')}
                    </p>

                    {/* Additional badges: Blood, Allergies, Phone, Email */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        {member.bloodGroup && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                                <HiOutlineHeart className="w-3.5 h-3.5 text-rose-500" />
                                Blood: {member.bloodGroup}
                            </span>
                        )}
                        {member.allergies && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
                                <HiOutlineExclamationTriangle className="w-3.5 h-3.5 text-amber-500" />
                                Allergies: {member.allergies}
                            </span>
                        )}
                        {member.phone && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-light-text-secondary dark:text-text-secondary">
                                <HiOutlinePhone className="w-3.5 h-3.5" />
                                {member.phone}
                            </span>
                        )}
                        {member.email && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-light-text-secondary dark:text-text-secondary">
                                <HiOutlineEnvelope className="w-3.5 h-3.5" />
                                {member.email}
                            </span>
                        )}
                    </div>

                    {member.notes && (
                        <p className="text-xs text-light-text-secondary dark:text-text-secondary mt-2 p-2 bg-light-background dark:bg-background rounded-xl border border-slate-100 dark:border-zinc-800 italic">
                            "{member.notes}"
                        </p>
                    )}
                </div>
            </div>

            <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setEditModalOpen(true)}
                icon={<HiOutlinePencilSquare className="w-4 h-4" />}
                className="w-full sm:w-auto shrink-0 shadow-sm"
            >
                Edit Profile
            </Button>
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
                <SectionHeading className="mb-4">{t('medicalProfile.medicines.title')}</SectionHeading>
                {memberMedicines.length > 0 ? (
                    <div className="space-y-3">
                        {memberMedicines.map(med => {
                            const nextDoseInfo = getNextDoseInfo(med);
                            return (
                                <div key={med.id} className="p-3 bg-light-background dark:bg-background rounded-xl flex justify-between items-center">
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
            <SectionHeading className="mb-4">{t('appointments.upcomingTitle')}</SectionHeading>
            {memberAppointments.length > 0 ? (
                <div className="space-y-3">
                    {memberAppointments.map(appt => (
                        <div key={appt.id} className="p-3 bg-light-background dark:bg-background rounded-xl">
                            <p className="font-bold text-light-text-primary dark:text-text-primary">{appt.purpose}</p>
                            <div className="flex items-center gap-3 text-sm text-light-text-secondary dark:text-text-secondary mt-1">
                                <span className="flex items-center gap-1"><HiOutlineUserCircle className="w-4 h-4" /> {appt.doctorName}</span>
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
            <Button size="sm" variant={filter === type ? 'primary' : 'secondary'} onClick={() => setFilter(type)}>
                {label}
            </Button>
        );

        return (
            <Card>
                 <SectionHeading className="mb-4">{t('medicalProfile.history.title')}</SectionHeading>
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
    
    // Document Actions
    const handleDownloadDocument = async (report: MedicalReport, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDownloadingReportId(report.id);
        const toastId = toast.loading(`Preparing download: ${report.name}...`);
        const ok = await downloadFile(report.fileUrl, report.name);
        setDownloadingReportId(null);
        toast.dismiss(toastId);
        if (ok) {
            toast.success(`Downloaded ${report.name}`);
        } else {
            toast.error('Direct download failed. Opening file in a new tab...');
            window.open(report.fileUrl, '_blank', 'noopener,noreferrer');
        }
    };

    const handleConfirmDeleteReport = async () => {
        if (!reportToDelete) return;
        setIsDeletingReport(true);
        const toastId = toast.loading('Deleting document...');
        try {
            // Delete record from database/state
            deleteMedicalReport(reportToDelete.id);

            // Trigger cloud deletion
            if (reportToDelete.deleteUrl || reportToDelete.imageId || reportToDelete.fileUrl?.includes('ibb.co')) {
                await deleteHostedImage(reportToDelete.deleteUrl, reportToDelete.imageId);
            }

            toast.dismiss(toastId);
            toast.success(`"${reportToDelete.name}" deleted from records`);
            setReportToDelete(null);
        } catch (err: any) {
            toast.dismiss(toastId);
            console.error('Error deleting document:', err);
            toast.error('Document removed from records.');
            setReportToDelete(null);
        } finally {
            setIsDeletingReport(false);
        }
    };

    // Health Documents Component
    const HealthDocuments = () => (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <SectionHeading>{t('medicalProfile.documents.title')}</SectionHeading>
                    <p className="text-xs text-light-text-secondary dark:text-text-secondary mt-0.5">
                        Medical reports, lab tests, prescriptions, and personal health documents.
                    </p>
                </div>
                <Button onClick={() => setUploadModalOpen(true)} icon={<HiPlus className="w-4 h-4"/>} size="sm">
                    {t('medicalProfile.documents.upload')}
                </Button>
            </div>
            {memberReports.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {memberReports.map(report => (
                        <div key={report.id} className="p-4 bg-light-background dark:bg-background rounded-2xl border border-slate-200/80 dark:border-zinc-800 hover:border-primary/40 transition flex flex-col justify-between group">
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                                        <HiOutlineDocumentText className="h-6 w-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm text-light-text-primary dark:text-text-primary truncate" title={report.name}>
                                            {report.name}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-light-text-secondary dark:text-text-secondary mt-0.5 flex-wrap">
                                            <span className="inline-flex items-center gap-1 font-medium text-primary">
                                                <HiOutlineTag className="w-3 h-3" /> {report.category}
                                            </span>
                                            <span>•</span>
                                            <span className="inline-flex items-center gap-1">
                                                <HiOutlineCalendar className="w-3 h-3" /> {new Date(report.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons: View, Download, Delete */}
                            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800/80 mt-1">
                                <a
                                    href={report.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-light-text-secondary dark:text-text-secondary hover:text-primary hover:bg-primary/10 transition"
                                    title="View document in new tab"
                                >
                                    <HiOutlineArrowTopRightOnSquare className="w-3.5 h-3.5" />
                                    <span>View</span>
                                </a>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={(e) => handleDownloadDocument(report, e)}
                                        disabled={downloadingReportId === report.id}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition active:scale-95 disabled:opacity-50"
                                        title="Download document to device"
                                    >
                                        <HiOutlineArrowDownTray className="w-3.5 h-3.5" />
                                        <span>{downloadingReportId === report.id ? 'Downloading...' : 'Download'}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setReportToDelete(report);
                                        }}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition active:scale-95"
                                        title="Delete document"
                                        aria-label={`Delete ${report.name}`}
                                    >
                                        <HiOutlineTrash className="w-3.5 h-3.5" />
                                        <span>Delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
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
            const uploadToast = toast.loading('Uploading document...');
            const uploadResult = await uploadImageWithDetails(file);
            toast.dismiss(uploadToast);
            setIsUploading(false);

            if (uploadResult?.url) {
                addMedicalReport({ 
                    memberId: member.id, 
                    name: name.trim(), 
                    category, 
                    date, 
                    fileUrl: uploadResult.url,
                    deleteUrl: uploadResult.deleteUrl,
                    imageId: uploadResult.imageId
                });
                toast.success(t('medicalProfile.documents.modal.uploadSuccess'));
                setUploadModalOpen(false);
            }
        };

        return (
             <Modal isOpen={isUploadModalOpen} onClose={() => setUploadModalOpen(false)} title={t('medicalProfile.documents.modal.title')}>
                <div className="space-y-4 py-1">
                    <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">
                            Document / Report Name *
                        </label>
                        <input 
                            type="text" 
                            placeholder="e.g. Annual Blood Test, Chest X-Ray, Cardiology Prescription" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            className="w-full p-2.5 sm:p-3 border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-slate-600 text-sm text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent" 
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">
                            Report Category *
                        </label>
                        <select 
                            aria-label="Report Category"
                            value={category} 
                            onChange={e => setCategory(e.target.value as MedicalReportCategory)} 
                            className="w-full p-2.5 sm:p-3 border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-slate-600 text-sm text-light-text-primary dark:text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            {Object.values(MedicalReportCategory).map(cat => (
                                <option key={cat} value={cat}>
                                    {t(`medicalProfile.documents.modal.categories.${cat.split(' ')[0].toLowerCase()}`)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">
                            Document Date *
                        </label>
                        <input 
                            type="date" 
                            value={date} 
                            onChange={e => setDate(e.target.value)} 
                            className="w-full p-2.5 sm:p-3 border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-slate-600 text-sm text-light-text-primary dark:text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent" 
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">
                            Attachment File *
                        </label>
                        <label className="block w-full cursor-pointer p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-center text-light-text-secondary dark:text-text-secondary hover:bg-slate-100 dark:hover:bg-zinc-700/80 transition-colors">
                            <div className="flex flex-col items-center justify-center">
                                <HiOutlineCloudArrowUp className="h-8 w-8 mb-1 text-primary" />
                                <span className="text-sm font-medium text-light-text-primary dark:text-text-primary">
                                    {file ? file.name : t('medicalProfile.documents.modal.selectFile')}
                                </span>
                                <span className="text-xs text-light-text-secondary dark:text-text-secondary mt-1">PDF, JPG, PNG up to 10MB</span>
                            </div>
                            <input type="file" className="hidden" onChange={e => e.target.files && setFile(e.target.files[0])} accept="image/*,application/pdf" />
                        </label>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4">
                        <Button 
                            variant="secondary" 
                            onClick={() => setUploadModalOpen(false)} 
                            className="w-full sm:w-auto"
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button 
                            onClick={handleUpload} 
                            disabled={isUploading} 
                            className="w-full sm:w-auto"
                        >
                            {isUploading ? t('medicalProfile.documents.modal.uploading') : t('medicalProfile.documents.modal.add')}
                        </Button>
                    </div>
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

            {/* Delete Document Confirmation Modal */}
            <Modal
                isOpen={!!reportToDelete}
                onClose={() => !isDeletingReport && setReportToDelete(null)}
                title="Delete Health Document"
            >
                {reportToDelete && (
                    <div className="space-y-4 py-1">
                        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/40 flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 shrink-0">
                                <HiOutlineTrash className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-rose-800 dark:text-rose-200">
                                    Delete "{reportToDelete.name}"?
                                </h4>
                                <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">
                                    This document ({reportToDelete.category}) will be permanently removed from this member's health records.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2 justify-end">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setReportToDelete(null)}
                                disabled={isDeletingReport}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={handleConfirmDeleteReport}
                                disabled={isDeletingReport}
                                icon={<HiOutlineTrash className="w-4 h-4" />}
                            >
                                {isDeletingReport ? 'Deleting...' : 'Delete Document'}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Edit Family Member Profile Modal */}
            <EditFamilyMemberModal
                isOpen={isEditModalOpen}
                onClose={() => setEditModalOpen(false)}
                member={member}
                onSave={async (updated) => {
                    await updateFamilyMember(updated);
                }}
            />
        </div>
    );
};

export default MedicalProfilePage;
