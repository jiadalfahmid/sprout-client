import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Skeleton from '../components/ui/Skeleton';
import Modal from '../components/ui/Modal';
import PageHeader from '../components/ui/PageHeader';
import SpeedDialFAB, { SpeedDialAction } from '../components/ui/SpeedDialFAB';
import { motion } from 'motion/react';
import { PiPill, PiDrop } from 'react-icons/pi';
import { FaCapsules, FaSpoon } from 'react-icons/fa6';
import toast from 'react-hot-toast';
import { 
    HiOutlineCheckCircle, 
    HiOutlineExclamationCircle, 
    HiOutlineHeart, 
    HiOutlineShoppingCart,
    HiOutlineCog6Tooth,
    HiPlus
} from 'react-icons/hi2';
import { useTranslation } from '../hooks/useTranslation';
import { findDoseHistoryEntry } from '../services/notificationService';

type Dose = {
    medId: string;
    name: string;
    memberName: string;
    time: Date;
    dosage: string;
    doseQuantity: number;
    doseForm: 'Tablet' | 'Capsule' | 'Drops' | 'Spoon';
    status: 'taken' | 'missed' | 'upcoming';
    stock: number;
};

type ActiveTab = 'all' | 'pending' | 'completed';

const getMedicineVisuals = (doseForm: Dose['doseForm'], medId: string) => {
    const colors = [
        { bg: 'bg-blue-100 dark:bg-blue-500/20', iconBg: 'bg-blue-200 dark:bg-blue-500/50', text: 'text-blue-800 dark:text-blue-200' },
        { bg: 'bg-green-100 dark:bg-green-500/20', iconBg: 'bg-green-200 dark:bg-green-500/50', text: 'text-green-800 dark:text-green-200' },
        { bg: 'bg-red-100 dark:bg-red-500/20', iconBg: 'bg-red-200 dark:bg-red-500/50', text: 'text-red-800 dark:text-red-200' },
        { bg: 'bg-orange-100 dark:bg-orange-500/20', iconBg: 'bg-orange-200 dark:bg-orange-500/50', text: 'text-orange-800 dark:text-orange-200' },
        { bg: 'bg-purple-100 dark:bg-purple-500/20', iconBg: 'bg-purple-200 dark:bg-purple-500/50', text: 'text-purple-800 dark:text-purple-200' },
    ];
    
    // Simple hash function to get a consistent index
    const colorIndex = medId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    const color = colors[colorIndex];

    let icon;
    switch(doseForm) {
        case 'Tablet': icon = <PiPill className="h-5 w-5" />; break;
        case 'Capsule': icon = <FaCapsules className="h-5 w-5" />; break;
        case 'Drops': icon = <PiDrop className="h-5 w-5" />; break;
        case 'Spoon': icon = <FaSpoon className="h-5 w-5" />; break;
        default: icon = <PiPill className="h-5 w-5" />;
    }
    return { color, icon };
};

const MedicineCard: React.FC<{ dose: Dose; onMarkAsTaken: (medId: string, time: Date) => void }> = ({ dose, onMarkAsTaken }) => {
    const { color, icon } = getMedicineVisuals(dose.doseForm, dose.medId);
    const { t } = useTranslation();
    
    const handleTakeDose = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent any parent handlers from firing
        onMarkAsTaken(dose.medId, dose.time);
    };

    const StatusIndicator = () => {
        switch(dose.status) {
            case 'taken':
                return (
                    <div className="flex items-center gap-1 text-sm font-semibold text-green-600 dark:text-green-400">
                        <HiOutlineCheckCircle className="h-5 w-5"/>
                        <span>{t('health.status.taken')}</span>
                    </div>
                );
            case 'missed':
                 return (
                    <div className="flex items-center gap-1 text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                        <HiOutlineExclamationCircle className="h-5 w-5"/>
                        <span>{t('health.status.missed')}</span>
                    </div>
                );
            default: // upcoming
                return (
                    <button 
                        onClick={handleTakeDose}
                        className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-full hover:bg-opacity-90 transition flex items-center gap-1.5 whitespace-nowrap"
                    >
                       <HiOutlineCheckCircle className="h-4 w-4" />
                       {t('health.status.markAsTaken')}
                    </button>
                );
        }
    }

    return (
        <motion.div
            className={`rounded-2xl p-4 flex items-center justify-between gap-4 shadow-md border border-slate-200 dark:border-zinc-700/50 ${color.bg}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex items-center gap-4 overflow-hidden">
                <div className={`flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center ${color.iconBg} ${color.text}`}>
                    {icon}
                </div>
                <div className="truncate">
                    <p className="font-bold text-light-text-primary dark:text-text-primary truncate">{dose.name} {dose.dosage.toLowerCase() !== "0mg" ? dose.dosage : ''}</p>
                    <p className="text-sm text-light-text-secondary dark:text-text-secondary truncate">{t('health.doseInfo', { quantity: dose.doseQuantity, form: dose.doseForm, plural: dose.doseQuantity > 1 ? 's' : '', name: dose.memberName })}</p>
                </div>
            </div>
            <div className="flex-shrink-0">
                <StatusIndicator />
            </div>
        </motion.div>
    );
};


const HealthPage: React.FC = () => {
    const { loading, familyMembers, medicines, logDose, addMedicine, addNote } = useAppContext();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<ActiveTab>('all');
    const [selectedMemberId, setSelectedMemberId] = useState('all');

    // Quick Action Modals
    const [isAddMedModalOpen, setIsAddMedModalOpen] = useState(false);
    const [isVitalModalOpen, setIsVitalModalOpen] = useState(false);

    // Quick Medicine Form
    const [medForm, setMedForm] = useState({
        memberId: familyMembers.length > 0 ? familyMembers[0].id : '',
        name: '',
        dosage: '',
        unit: 'mg',
        doseQuantity: '1',
        doseForm: 'Tablet' as 'Tablet' | 'Capsule' | 'Drops' | 'Spoon',
        times: ['09:00'],
        mealRelation: 'after' as 'before' | 'after',
        stock: '30'
    });

    // Quick Vital Form
    const [vitalForm, setVitalForm] = useState({
        memberId: familyMembers.length > 0 ? familyMembers[0].id : '',
        type: 'Blood Pressure',
        value: '',
        notes: ''
    });

    const handleSaveMedicine = () => {
        if (!medForm.name || !medForm.memberId || medForm.times.length === 0) {
            toast.error(t('settings.fillRequiredFields') || 'Please fill required fields');
            return;
        }
        addMedicine({
            memberId: medForm.memberId,
            name: medForm.name,
            dosage: parseFloat(medForm.dosage) || 1,
            unit: medForm.unit,
            doseQuantity: parseInt(medForm.doseQuantity) || 1,
            doseForm: medForm.doseForm,
            stock: parseInt(medForm.stock) || 0,
            times: medForm.times,
            mealRelation: medForm.mealRelation,
            schedule: { type: 'daily' }
        });
        toast.success(t('settings.medicineAdded') || 'Medicine added successfully!');
        setIsAddMedModalOpen(false);
        setMedForm({
            memberId: familyMembers.length > 0 ? familyMembers[0].id : '',
            name: '',
            dosage: '',
            unit: 'mg',
            doseQuantity: '1',
            doseForm: 'Tablet',
            times: ['09:00'],
            mealRelation: 'after',
            stock: '30'
        });
    };

    const handleSaveVital = () => {
        if (!vitalForm.value) {
            toast.error('Please enter a measurement value');
            return;
        }
        const member = familyMembers.find(m => m.id === vitalForm.memberId);
        const logContent = `🩺 Vital Log [${vitalForm.type}]: ${vitalForm.value}${vitalForm.notes ? ` (${vitalForm.notes})` : ''} - For ${member?.name || 'Family'}`;
        addNote({ content: logContent });
        toast.success('Health measurement logged!');
        setIsVitalModalOpen(false);
        setVitalForm({
            memberId: familyMembers.length > 0 ? familyMembers[0].id : '',
            type: 'Blood Pressure',
            value: '',
            notes: ''
        });
    };

    const handleMarkAsTaken = (medId: string, time: Date) => {
        const medName = logDose(medId, time.toISOString());
        if (medName) {
            toast.success(t('health.doseTakenSuccess', { medName }));
        } else {
            toast.error(t('health.doseTakenError'));
        }
    };

    const allTodaysDoses = useMemo<Dose[]>(() => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const referenceDate = new Date(2024, 0, 1); // Fixed reference date

        const doses = medicines
            .filter(med => selectedMemberId === 'all' || med.memberId === selectedMemberId)
            .flatMap(med => {
            const daysDifference = Math.floor((todayStart.getTime() - referenceDate.getTime()) / (1000 * 3600 * 24));
            const isScheduledToday = med.schedule.type === 'daily' || (med.schedule.type === 'alternate_days' && daysDifference % 2 === 0);
            
            if(!isScheduledToday) return [];

            const member = familyMembers.find(m => m.id === med.memberId);

            return med.times.map(time => {
                const [hour, minute] = time.split(':');
                const doseDateTime = new Date();
                doseDateTime.setHours(parseInt(hour), parseInt(minute), 0, 0);

                const historyEntry = findDoseHistoryEntry(med.history, doseDateTime, doseDateTime.getHours(), doseDateTime.getMinutes());

                return {
                    medId: med.id,
                    name: med.name,
                    memberName: member?.name || 'Unknown',
                    time: doseDateTime,
                    dosage: `${med.dosage}${med.unit}`,
                    doseQuantity: med.doseQuantity,
                    doseForm: med.doseForm,
                    status: historyEntry ? historyEntry.status : 'upcoming',
                    stock: med.stock
                };
            });
        });

        return doses.sort((a,b) => a.time.getTime() - b.time.getTime());
    }, [medicines, familyMembers, selectedMemberId]);

    const filteredDoses = useMemo(() => {
        if (activeTab === 'pending') {
            return allTodaysDoses.filter(d => d.status === 'upcoming');
        }
        if (activeTab === 'completed') {
            return allTodaysDoses.filter(d => d.status === 'taken');
        }
        return allTodaysDoses;
    }, [allTodaysDoses, activeTab]);

    const groupedDoses = useMemo(() => {
        return filteredDoses.reduce((acc, dose) => {
            const timeKey = dose.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (!acc[timeKey]) {
                acc[timeKey] = [];
            }
            acc[timeKey].push(dose);
            return acc;
        }, {} as Record<string, Dose[]>);
    }, [filteredDoses]);

    const sortedTimeKeys = Object.keys(groupedDoses).sort((a, b) => {
      const timeA = new Date(`1970/01/01 ${a}`).getTime();
      const timeB = new Date(`1970/01/01 ${b}`).getTime();
      return timeA - timeB;
    });

    const TabButton: React.FC<{ tabName: ActiveTab; label: string }> = ({ tabName, label }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${activeTab === tabName ? 'bg-primary text-white shadow-lg' : 'text-light-text-secondary dark:text-text-secondary'}`}
        >
            {label}
        </button>
    );

    const renderSkeleton = () => (
        <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                    <Skeleton className="w-20 h-8 hidden sm:block" />
                    <div className="flex-1 space-y-3">
                        <Skeleton className="w-full h-20 rounded-2xl" />
                        <Skeleton className="w-4/5 h-20 rounded-2xl" />
                    </div>
                </div>
            ))}
        </div>
    );

    const fabActions: SpeedDialAction[] = [
        {
            id: 'add_med',
            label: t('settings.addNewMedicine') || 'Add Medicine',
            icon: PiPill,
            color: 'blue',
            onClick: () => setIsAddMedModalOpen(true),
        },
        {
            id: 'log_vital',
            label: 'Record Health Vital',
            icon: HiOutlineHeart,
            color: 'rose',
            onClick: () => setIsVitalModalOpen(true),
        },
        {
            id: 'restock',
            label: t('restock.cartTitle') || 'Restock Shopping Cart',
            icon: HiOutlineShoppingCart,
            color: 'orange',
            onClick: () => navigate('/restock'),
        },
        {
            id: 'manage',
            label: t('settings.manageMedicines') || 'Manage All Medicines',
            icon: HiOutlineCog6Tooth,
            color: 'teal',
            onClick: () => navigate('/settings/medicines'),
        },
    ];
    
    return (
        <div>
            <PageHeader
                title={t('health.title')}
                subtitle={t('health.subtitle')}
                action={
                    <select aria-label="Filter by family member" value={selectedMemberId} onChange={e => setSelectedMemberId(e.target.value)} className="w-full sm:w-auto p-2 border rounded-xl bg-light-surface dark:bg-surface border-slate-200 dark:border-zinc-600 focus:ring-1 focus:ring-primary text-sm font-medium">
                        <option value="all">{t('health.allMembers')}</option>
                        {familyMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                }
            />

            <div className="flex justify-center items-center gap-2 mb-8 bg-slate-100 dark:bg-surface p-1 rounded-full">
                <TabButton tabName="all" label={t('health.tabs.all')} />
                <TabButton tabName="pending" label={t('health.tabs.pending')} />
                <TabButton tabName="completed" label={t('health.tabs.completed')} />
            </div>
            
            {loading ? renderSkeleton() : (
            <div className="relative sm:pl-20">
                <div className="absolute left-10 top-2 bottom-2 w-0.5 bg-primary/20 rounded-full hidden sm:block"></div>
                {sortedTimeKeys.length > 0 ? (
                    sortedTimeKeys.map((time) => (
                         <div key={time} className="relative mb-8">
                            {/* Desktop time and dot */}
                            <div className="hidden sm:block">
                                <div className="absolute -left-10 top-1.5 h-3 w-3 rounded-full bg-white dark:bg-zinc-500 border-2 border-primary/30"></div>
                                <div className="absolute -left-20 text-right w-16">
                                    <p className="font-bold text-sm text-light-text-primary dark:text-text-primary">{time.split(' ')[0]}</p>
                                    <p className="text-xs text-light-text-secondary dark:text-text-secondary">{time.split(' ')[1]}</p>
                                </div>
                            </div>
                            {/* Mobile time */}
                            <div className="sm:hidden font-bold text-light-text-primary dark:text-text-primary mb-2">
                                {time}
                            </div>

                            <div className="space-y-3">
                                {groupedDoses[time].map((dose) => (
                                    <MedicineCard key={dose.medId + dose.time.toISOString()} dose={dose} onMarkAsTaken={handleMarkAsTaken} />
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10">
                        <p className="text-light-text-secondary dark:text-text-secondary">{t('health.noMedications', { tab: activeTab })}</p>
                    </div>
                )}
            </div>
            )}

            {/* SPEED DIAL FLOATING ACTION BUTTON */}
            <SpeedDialFAB
                actions={fabActions}
                mainLabel="Health Actions"
            />

            {/* QUICK ADD MEDICINE MODAL */}
            <Modal isOpen={isAddMedModalOpen} onClose={() => setIsAddMedModalOpen(false)} title={t('settings.addNewMedicine') || 'Add Medicine'}>
                <div className="space-y-4 py-1">
                    <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">Family Member *</label>
                        <select 
                            value={medForm.memberId} 
                            onChange={e => setMedForm(s => ({...s, memberId: e.target.value}))}
                            className="w-full p-2.5 sm:p-3 border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-slate-600 text-sm text-light-text-primary dark:text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            {familyMembers.map(m => (
                                <option key={m.id} value={m.id}>{m.name} ({m.relation})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">Medicine Name *</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Paracetamol, Metformin, Vitamin D3" 
                            value={medForm.name} 
                            onChange={e => setMedForm(s => ({...s, name: e.target.value}))} 
                            className="w-full p-2.5 sm:p-3 border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-slate-600 text-sm text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">Dosage Strength</label>
                            <input 
                                type="text" 
                                placeholder="e.g. 500" 
                                value={medForm.dosage} 
                                onChange={e => setMedForm(s => ({...s, dosage: e.target.value}))} 
                                className="w-full p-2.5 sm:p-3 border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-slate-600 text-sm text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">Unit of Measurement</label>
                            <select 
                                value={medForm.unit} 
                                onChange={e => setMedForm(s => ({...s, unit: e.target.value}))} 
                                className="w-full p-2.5 sm:p-3 border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-slate-600 text-sm text-light-text-primary dark:text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="mg">mg (Milligrams)</option>
                                <option value="ml">ml (Milliliters)</option>
                                <option value="tablet">tablet</option>
                                <option value="drops">drops</option>
                                <option value="pills">pills</option>
                                <option value="mcg">mcg (Micrograms)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">Medicine Form</label>
                            <select 
                                value={medForm.doseForm} 
                                onChange={e => setMedForm(s => ({...s, doseForm: e.target.value as any}))} 
                                className="w-full p-2.5 sm:p-3 border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-slate-600 text-sm text-light-text-primary dark:text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="Tablet">{t('medicines.forms.tablet')}</option>
                                <option value="Capsule">{t('medicines.forms.capsule')}</option>
                                <option value="Drops">{t('medicines.forms.drops')}</option>
                                <option value="Spoon">{t('medicines.forms.spoon')}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">Meal Timing</label>
                            <select 
                                value={medForm.mealRelation} 
                                onChange={e => setMedForm(s => ({...s, mealRelation: e.target.value as any}))} 
                                className="w-full p-2.5 sm:p-3 border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-slate-600 text-sm text-light-text-primary dark:text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="after">{t('health.afterMeal')}</option>
                                <option value="before">{t('health.beforeMeal')}</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">Scheduled Reminder Time *</label>
                        <input 
                            type="time" 
                            value={medForm.times[0] || '09:00'} 
                            onChange={e => setMedForm(s => ({...s, times: [e.target.value]}))} 
                            className="w-full p-2.5 sm:p-3 border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-slate-600 text-sm text-light-text-primary dark:text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>

                    <button 
                        onClick={handleSaveMedicine} 
                        className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-opacity-90 shadow-md transition-colors text-sm active:scale-[0.99]"
                    >
                        Save Medicine
                    </button>
                </div>
            </Modal>

            {/* QUICK LOG VITAL MODAL */}
            <Modal isOpen={isVitalModalOpen} onClose={() => setIsVitalModalOpen(false)} title={t('health.vitalModalTitle')}>
                <div className="space-y-4 py-1">
                    <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">Family Member *</label>
                        <select 
                            value={vitalForm.memberId} 
                            onChange={e => setVitalForm(s => ({...s, memberId: e.target.value}))}
                            className="w-full p-2.5 sm:p-3 border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-slate-600 text-sm text-light-text-primary dark:text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            {familyMembers.map(m => (
                                <option key={m.id} value={m.id}>{m.name} ({m.relation})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">Health Metric Type *</label>
                        <select 
                            value={vitalForm.type} 
                            onChange={e => setVitalForm(s => ({...s, type: e.target.value}))}
                            className="w-full p-2.5 sm:p-3 border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-slate-600 text-sm text-light-text-primary dark:text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="Blood Pressure">{t('health.bloodPressure')}</option>
                            <option value="Blood Sugar">{t('health.bloodSugar')}</option>
                            <option value="Weight">{t('health.weight')}</option>
                            <option value="Heart Rate">{t('health.heartRate')}</option>
                            <option value="Temperature">{t('health.temperature')}</option>
                            <option value="General Health Note">{t('health.generalNote')}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">Metric Value / Reading *</label>
                        <input 
                            type="text" 
                            placeholder="e.g. 120/80 mmHg, 98.6 °F, 110 mg/dL, 70 kg" 
                            value={vitalForm.value} 
                            onChange={e => setVitalForm(s => ({...s, value: e.target.value}))} 
                            className="w-full p-2.5 sm:p-3 border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-slate-600 text-sm text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">Notes & Context (Optional)</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Fasting reading before breakfast, feeling well" 
                            value={vitalForm.notes} 
                            onChange={e => setVitalForm(s => ({...s, notes: e.target.value}))} 
                            className="w-full p-2.5 sm:p-3 border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-slate-600 text-sm text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>

                    <button 
                        onClick={handleSaveVital} 
                        className="w-full py-3 bg-rose-600 text-white font-semibold rounded-xl hover:bg-rose-700 shadow-md transition-colors text-sm active:scale-[0.99]"
                    >
                        {t('health.saveVital')}
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default HealthPage;
