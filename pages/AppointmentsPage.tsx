import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import { Appointment } from '../types';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import PageHeader from '../components/ui/PageHeader';
import SpeedDialFAB, { SpeedDialAction } from '../components/ui/SpeedDialFAB';
import { uploadImage } from '../utils/imageUploader';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { 
    HiPlus, HiOutlinePencil, HiOutlineTrash, HiOutlineCheckCircle, 
    HiOutlineXCircle, HiOutlineCloudArrowUp, HiOutlineCalendarDays,
    HiOutlineArrowPath
} from 'react-icons/hi2';
import { FaUserDoctor } from 'react-icons/fa6';

const AppointmentsPage: React.FC = () => {
    const { 
        loading, 
        appointments, 
        familyMembers, 
        addAppointment, 
        updateAppointment, 
        deleteAppointment,
        isGoogleAuthenticated,
        syncAppointmentToGoogle,
        loginWithGoogle
    } = useAppContext();
    const { t } = useTranslation();

    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [syncingApptId, setSyncingApptId] = useState<string | null>(null);

    const [formState, setFormState] = useState({
        memberId: familyMembers.length > 0 ? familyMembers[0].id : '',
        doctorName: '',
        clinicName: '',
        dateTime: '',
        purpose: '',
        specialization: '',
        documentFile: null as File | null,
        syncToGCal: true,
    });

    const resetForm = () => {
        setFormState({
            memberId: familyMembers.length > 0 ? familyMembers[0].id : '',
            doctorName: '',
            clinicName: '',
            dateTime: '',
            purpose: '',
            specialization: '',
            documentFile: null,
            syncToGCal: true,
        });
        setEditingAppointment(null);
    };

    const handleOpenModal = (appointment: Appointment | null = null) => {
        if (appointment) {
            setEditingAppointment(appointment);
            setFormState({
                memberId: appointment.memberId,
                doctorName: appointment.doctorName,
                clinicName: appointment.clinicName,
                dateTime: new Date(appointment.dateTime).toISOString().slice(0, 16),
                purpose: appointment.purpose,
                specialization: appointment.specialization || '',
                documentFile: null,
                syncToGCal: true,
            });
        } else {
            resetForm();
        }
        setModalOpen(true);
    };

    const handleSaveAppointment = async () => {
        if (!formState.memberId || !formState.doctorName || !formState.clinicName || !formState.dateTime || !formState.purpose) {
            toast.error(t('appointments.modal.fillError'));
            return;
        }

        let documentUrl: string | undefined = editingAppointment?.documentUrl;
        if (formState.documentFile) {
            toast.loading(t('family.modal.uploadingImage'));
            const uploadedUrl = await uploadImage(formState.documentFile);
            toast.dismiss();
            if (uploadedUrl) {
                documentUrl = uploadedUrl;
            } else {
                return; // Upload failed
            }
        }

        const appointmentData = {
            memberId: formState.memberId,
            doctorName: formState.doctorName,
            clinicName: formState.clinicName,
            dateTime: new Date(formState.dateTime).toISOString(),
            purpose: formState.purpose,
            specialization: formState.specialization,
            documentUrl: documentUrl,
        };

        if (editingAppointment) {
            updateAppointment({ ...editingAppointment, ...appointmentData });
            toast.success(t('appointments.modal.updated'));
        } else {
            addAppointment(appointmentData);
            toast.success(t('appointments.modal.added'));
        }
        setModalOpen(false);
    };
    
    const handleStatusChange = (appointment: Appointment, status: 'completed' | 'cancelled') => {
        updateAppointment({ ...appointment, status });
        toast.success(t(status === 'completed' ? 'appointments.modal.completed' : 'appointments.modal.cancelled'));
    };

    const handleSyncToGoogle = async (appointmentId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isGoogleAuthenticated) {
            toast.error('Please connect your Google account first.');
            const ok = await loginWithGoogle();
            if (!ok) return;
        }

        setSyncingApptId(appointmentId);
        try {
            const ok = await syncAppointmentToGoogle(appointmentId);
            if (ok) {
                toast.success('Synced to Google Calendar!');
            } else {
                toast.error('Failed to sync to Google Calendar');
            }
        } finally {
            setSyncingApptId(null);
        }
    };

    const { upcoming, past } = useMemo(() => {
        const now = new Date();
        const upcoming: Appointment[] = [];
        const past: Appointment[] = [];
        appointments.forEach(appt => {
            if (appt.status === 'upcoming' && new Date(appt.dateTime) >= now) {
                upcoming.push(appt);
            } else {
                past.push(appt);
            }
        });
        return { 
            upcoming: upcoming.sort((a,b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()),
            past: past.sort((a,b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
        };
    }, [appointments]);

    const displayedAppointments = activeTab === 'upcoming' ? upcoming : past;
    
    const AppointmentCard = ({ appointment }: { appointment: Appointment }) => {
        const member = familyMembers.find(m => m.id === appointment.memberId);
        const date = new Date(appointment.dateTime);
        const isPast = new Date(appointment.dateTime) < new Date();
        
        let statusColor = 'text-blue-500';
        if (appointment.status === 'completed') statusColor = 'text-green-500';
        if (appointment.status === 'cancelled') statusColor = 'text-red-500';

        return (
            <Card className="hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start group">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-lg text-light-text-primary dark:text-text-primary">{appointment.purpose}</p>
                            {appointment.googleEventId && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                                    <HiOutlineCalendarDays className="w-3.5 h-3.5" />
                                    Google Calendar
                                </span>
                            )}
                        </div>
                        <p className="text-sm font-semibold text-primary">{t('medicines.for')}: {member?.name || 'N/A'}</p>
                        <div className="text-sm text-light-text-secondary dark:text-text-secondary mt-2 space-y-1">
                            <p className="flex items-center gap-2"><FaUserDoctor className="text-primary" /> {appointment.doctorName} {appointment.specialization && `(${appointment.specialization})`}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">🏥 {appointment.clinicName}</p>
                            <p className="font-semibold text-xs text-slate-700 dark:text-slate-200">🗓️ {date.toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}</p>
                        </div>
                    </div>
                     <div className="text-right flex flex-col items-end gap-2">
                        <p className={`text-sm font-bold capitalize ${statusColor}`}>{appointment.status}</p>
                        
                        {/* Google Calendar Sync Button */}
                        {!appointment.googleEventId && appointment.status === 'upcoming' && (
                            <button
                                onClick={(e) => handleSyncToGoogle(appointment.id, e)}
                                disabled={syncingApptId === appointment.id}
                                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition shadow-xs disabled:opacity-60"
                            >
                                <HiOutlineArrowPath className={`w-3.5 h-3.5 ${syncingApptId === appointment.id ? 'animate-spin' : ''}`} />
                                {syncingApptId === appointment.id ? 'Syncing...' : 'Sync to GCal'}
                            </button>
                        )}

                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                           <button onClick={() => handleOpenModal(appointment)} className="text-blue-400 hover:text-blue-300"><HiOutlinePencil className="h-5 w-5"/></button>
                           <button onClick={() => deleteAppointment(appointment.id)} className="text-red-400 hover:text-red-300"><HiOutlineTrash className="h-5 w-5"/></button>
                        </div>
                    </div>
                </div>
                 {appointment.status === 'upcoming' && !isPast && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-zinc-700">
                        <button onClick={() => handleStatusChange(appointment, 'completed')} className="w-full flex items-center justify-center gap-2 py-2 text-sm bg-green-500/10 text-green-600 dark:text-green-300 rounded-lg hover:bg-green-500/20">
                            <HiOutlineCheckCircle /> {t('appointments.markComplete')}
                        </button>
                        <button onClick={() => handleStatusChange(appointment, 'cancelled')} className="w-full flex items-center justify-center gap-2 py-2 text-sm bg-red-500/10 text-red-600 dark:text-red-300 rounded-lg hover:bg-red-500/20">
                           <HiOutlineXCircle /> {t('appointments.cancel')}
                        </button>
                    </div>
                 )}
            </Card>
        );
    };

    const fabActions: SpeedDialAction[] = [
        {
            id: 'book_appt',
            label: t('appointments.add') || 'Book Appointment',
            icon: HiPlus,
            color: 'purple',
            onClick: () => handleOpenModal(),
        },
        {
            id: 'sync_gcal',
            label: isGoogleAuthenticated ? 'Google Calendar Synced' : 'Connect Google Calendar',
            icon: HiOutlineArrowPath,
            color: 'cyan',
            onClick: () => {
                if (!isGoogleAuthenticated) {
                    loginWithGoogle();
                } else {
                    toast.success('Google Calendar is connected!');
                }
            },
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('appointments.title')}
                subtitle={t('appointments.subtitle')}
                action={
                    <button onClick={() => handleOpenModal()} className="px-3.5 py-2 sm:px-4 sm:py-2.5 bg-primary text-white font-semibold rounded-xl flex items-center gap-1.5 shadow-sm shrink-0 text-xs sm:text-sm whitespace-nowrap hover:opacity-90 transition-opacity">
                        <HiPlus className="w-4 h-4" /> {t('appointments.add')}
                    </button>
                }
            />

            <div className="flex justify-center items-center gap-2 mb-8 bg-slate-100 dark:bg-surface p-1 rounded-full max-w-md mx-auto">
                <button onClick={() => setActiveTab('upcoming')} className={`w-1/2 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${activeTab === 'upcoming' ? 'bg-primary text-white shadow-lg' : 'text-light-text-secondary dark:text-text-secondary'}`}>{t('appointments.upcomingTitle')}</button>
                <button onClick={() => setActiveTab('past')} className={`w-1/2 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${activeTab === 'past' ? 'bg-primary text-white shadow-lg' : 'text-light-text-secondary dark:text-text-secondary'}`}>{t('appointments.pastTitle')}</button>
            </div>
            
            <div className="space-y-4">
                <AnimatePresence>
                    {displayedAppointments.length > 0 ? (
                        displayedAppointments.map(appt => (
                            <motion.div key={appt.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <AppointmentCard appointment={appt} />
                            </motion.div>
                        ))
                    ) : (
                        <p className="text-center py-8 text-light-text-secondary dark:text-text-secondary">
                            {activeTab === 'upcoming' ? t('appointments.noUpcoming') : t('appointments.noPast')}
                        </p>
                    )}
                </AnimatePresence>
            </div>

            {/* SPEED DIAL FLOATING ACTION BUTTON */}
            <SpeedDialFAB
                actions={fabActions}
                mainLabel="Appointment Actions"
            />
            
            <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={editingAppointment ? t('appointments.modal.editTitle') : t('appointments.modal.addTitle')}>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
                    <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1">
                            Family Member *
                        </label>
                        <select value={formState.memberId} onChange={e => setFormState(s => ({...s, memberId: e.target.value}))} className="w-full p-2.5 border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-slate-600 text-sm">
                            {familyMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1">
                            {t('appointments.modal.doctor')} *
                        </label>
                        <input type="text" placeholder="e.g., Dr. Smith" value={formState.doctorName} onChange={e => setFormState(s => ({...s, doctorName: e.target.value}))} className="w-full p-2.5 border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-slate-600 text-sm" />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1">
                            {t('appointments.modal.clinic')} *
                        </label>
                        <input type="text" placeholder="e.g., City Medical Center" value={formState.clinicName} onChange={e => setFormState(s => ({...s, clinicName: e.target.value}))} className="w-full p-2.5 border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-slate-600 text-sm" />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1">
                            Date & Time *
                        </label>
                        <input type="datetime-local" value={formState.dateTime} onChange={e => setFormState(s => ({...s, dateTime: e.target.value}))} className="w-full p-2.5 border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-slate-600 text-sm" />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1">
                            {t('appointments.modal.purpose')} *
                        </label>
                        <textarea placeholder="e.g., Annual cardiology checkup & blood work review" value={formState.purpose} onChange={e => setFormState(s => ({...s, purpose: e.target.value}))} rows={2} className="w-full p-2.5 border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-slate-600 text-sm resize-none" />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1">
                            {t('appointments.modal.specialization')} (Optional)
                        </label>
                        <input type="text" placeholder="e.g., Cardiology, Pediatrics" value={formState.specialization} onChange={e => setFormState(s => ({...s, specialization: e.target.value}))} className="w-full p-2.5 border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-slate-600 text-sm" />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1">
                            {t('appointments.modal.prescriptionOrDoc')}
                        </label>
                        <label className="block w-full cursor-pointer p-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-center text-light-text-secondary dark:text-text-secondary hover:bg-slate-50 dark:hover:bg-zinc-800 transition">
                            <div className="flex flex-col items-center justify-center">
                                <HiOutlineCloudArrowUp className="h-6 w-6 mb-1 text-primary" />
                                <span className="text-xs">{formState.documentFile ? formState.documentFile.name : t('appointments.modal.upload')}</span>
                            </div>
                            <input type="file" className="hidden" onChange={e => e.target.files && setFormState(s=> ({...s, documentFile: e.target.files![0]}))} accept="image/*,application/pdf" />
                        </label>
                    </div>

                    <button onClick={handleSaveAppointment} className="w-full py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-focus transition shadow-sm text-sm">
                        {editingAppointment ? t('finance.modal.saveChanges') : t('finance.modal.addRecord')}
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default AppointmentsPage;

