import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import Skeleton from '../components/ui/Skeleton';
import { motion } from 'framer-motion';
import { PiPill, PiDrop } from 'react-icons/pi';
import { FaCapsules, FaSpoon } from 'react-icons/fa6';
import toast from 'react-hot-toast';
import { HiOutlineCheckCircle, HiOutlineExclamationCircle } from 'react-icons/hi2';
import { useTranslation } from '../hooks/useTranslation';

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
    const { loading, familyMembers, medicines, logDose } = useAppContext();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<ActiveTab>('all');
    const [selectedMemberId, setSelectedMemberId] = useState('all');

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

                const historyEntry = med.history.find(h => {
                    const hDate = new Date(h.timestamp);
                    return hDate.toDateString() === doseDateTime.toDateString() && hDate.getHours() === doseDateTime.getHours() && hDate.getMinutes() === doseDateTime.getMinutes();
                });

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
    
    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                 <div>
                    <h1 className="text-3xl font-bold text-light-text-primary dark:text-text-primary mb-2">{t('health.title')}</h1>
                    <p className="text-light-text-secondary dark:text-text-secondary">{t('health.subtitle')}</p>
                </div>
                <select value={selectedMemberId} onChange={e => setSelectedMemberId(e.target.value)} className="w-full sm:w-auto p-2 border rounded-lg bg-light-surface dark:bg-surface border-slate-200 dark:border-zinc-600 focus:ring-1 focus:ring-primary text-sm font-medium">
                    <option value="all">{t('health.allMembers')}</option>
                    {familyMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
            </div>


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
        </div>
    );
};

export default HealthPage;
