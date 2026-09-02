import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import SpeedDialFAB, { SpeedDialAction } from '../components/ui/SpeedDialFAB';
import { 
    HiChevronLeft, HiChevronRight, HiOutlineBeaker, HiOutlineCurrencyDollar, 
    HiOutlineCheckCircle, HiMagnifyingGlass, HiOutlineXMark, HiOutlineArrowPath,
    HiOutlineCalendarDays
} from 'react-icons/hi2';
import { FaUserDoctor } from 'react-icons/fa6';
import { CalendarEvent } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from '../hooks/useTranslation';
import toast from 'react-hot-toast';

// --- Helper Functions & Components ---

const getEventVisuals = (event: CalendarEvent) => {
    let icon: React.ElementType | undefined;
    let color: string = 'primary';

    switch (event.type) {
        case 'medicine':
            icon = HiOutlineBeaker;
            color = 'purple';
            if (event.status === 'taken') color = 'green';
            else if (event.status === 'missed') color = 'yellow';
            else if (event.details?.stock === 0) color = 'red';
            break;
        case 'bill':
            icon = HiOutlineCurrencyDollar;
            color = 'blue';
            if (event.status !== 'paid') color = 'red';
            break;
        case 'task':
            icon = HiOutlineCheckCircle;
            color = 'orange';
            if (event.status === 'completed') color = 'green';
            break;
        case 'appointment':
            icon = FaUserDoctor;
            color = 'teal';
            if (event.status === 'cancelled') color = 'slate';
            break;
        case 'google_event':
            icon = HiOutlineCalendarDays;
            color = 'google';
            break;
    }

    const colorMapping: Record<string, { dot: string; text: string; border: string; bgLight: string; }> = {
        primary: { dot: 'bg-primary', text: 'text-primary', border: 'border-primary', bgLight: 'bg-primary/10' },
        purple: { dot: 'bg-purple-500', text: 'text-purple-500', border: 'border-purple-500', bgLight: 'bg-purple-500/10' },
        green: { dot: 'bg-green-500', text: 'text-green-500', border: 'border-green-500', bgLight: 'bg-green-500/10' },
        yellow: { dot: 'bg-yellow-500', text: 'text-yellow-500', border: 'border-yellow-500', bgLight: 'bg-yellow-500/10' },
        red: { dot: 'bg-red-500', text: 'text-red-500', border: 'border-red-500', bgLight: 'bg-red-500/10' },
        blue: { dot: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500', bgLight: 'bg-blue-500/10' },
        orange: { dot: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500', bgLight: 'bg-orange-500/10' },
        teal: { dot: 'bg-teal-500', text: 'text-teal-500', border: 'border-teal-500', bgLight: 'bg-teal-500/10' },
        slate: { dot: 'bg-slate-500', text: 'text-slate-500', border: 'border-slate-500', bgLight: 'bg-slate-500/10' },
        google: { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500', bgLight: 'bg-emerald-500/10' },
    };

    return { icon, colors: colorMapping[color] || colorMapping.primary };
};


const TimelineEventCard: React.FC<{ event: CalendarEvent; onSyncToGoogle?: (id: string, type: 'appointment' | 'bill') => void }> = ({ event, onSyncToGoogle }) => {
    const { colors, icon: Icon } = getEventVisuals(event);
    const { familyMembers, currency, availableCurrencies, isGoogleAuthenticated } = useAppContext();
    const { t } = useTranslation();
    const member = familyMembers.find(m => m.id === event.details?.memberId);
    const currencySymbol = useMemo(() => availableCurrencies.find(c => c.code === currency)?.symbol || '$', [currency, availableCurrencies]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-xl bg-light-background dark:bg-background border-l-4 ${colors.border} flex items-start justify-between gap-3`}
        >
            <div className="flex items-start gap-3 min-w-0">
                {Icon && (
                    <div className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center ${colors.bgLight} ${colors.text}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                )}
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm text-light-text-primary dark:text-text-primary truncate">{event.title}</p>
                        {event.isGoogleCalendarEvent && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                Google Calendar
                            </span>
                        )}
                        {event.details?.syncedWithGoogle && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                                Synced
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-light-text-secondary dark:text-text-secondary capitalize mt-0.5">
                        {event.type === 'medicine' && `${event.details?.doseQuantity} ${event.details?.doseForm} for ${member?.name || 'N/A'}`}
                        {event.type === 'bill' && `${currencySymbol}${event.details?.amount?.toFixed(2)} - ${event.status}`}
                        {event.type === 'task' && `${t('calendar.modal.status')}: ${event.status}`}
                        {event.type === 'appointment' && `Doctor: ${event.details?.doctorName} • ${event.details?.clinicName || ''}`}
                        {event.type === 'google_event' && (event.location ? `${event.location}` : 'Synced from your Google Calendar')}
                    </p>
                </div>
            </div>

            {/* Quick sync trigger if appointment not yet synced */}
            {isGoogleAuthenticated && event.type === 'appointment' && !event.details?.syncedWithGoogle && onSyncToGoogle && (
                <button
                    onClick={() => onSyncToGoogle(event.details?.id, 'appointment')}
                    title="Sync to Google Calendar"
                    className="p-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition shrink-0"
                >
                    Sync GCal
                </button>
            )}
        </motion.div>
    );
};

const DayDetailsModal: React.FC<{
    onClose: () => void;
    events: CalendarEvent[];
    date: Date;
}> = ({ onClose, events, date }) => {
    const { t, language } = useTranslation();
    const { syncAppointmentToGoogle, syncBillToGoogle } = useAppContext();
    
    const handleSyncToGoogle = async (id: string, type: 'appointment' | 'bill') => {
        if (type === 'appointment') {
            await syncAppointmentToGoogle(id);
            toast.success('Appointment synced to Google Calendar!');
        } else if (type === 'bill') {
            await syncBillToGoogle(id);
            toast.success('Bill synced to Google Calendar!');
        }
    };

    const groupedEvents = useMemo(() => 
        events?.reduce((acc, event) => {
            const timeKey = event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (!acc[timeKey]) acc[timeKey] = [];
            acc[timeKey].push(event);
            return acc;
        }, {} as Record<string, CalendarEvent[]>)
    , [events]);

    const sortedTimeKeys = useMemo(() => groupedEvents ? Object.keys(groupedEvents).sort((a, b) => {
      const timeA = new Date(`1970/01/01 ${a}`).getTime();
      const timeB = new Date(`1970/01/01 ${b}`).getTime();
      return timeA - timeB;
    }) : [], [groupedEvents]);

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                onClick={e => e.stopPropagation()}
                className="bg-light-surface dark:bg-surface rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 dark:border-zinc-700 flex flex-col overflow-hidden"
            >
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/30">
                    <div>
                        <h2 className="text-lg font-bold text-light-text-primary dark:text-text-primary">
                            {date ? date.toLocaleDateString(language, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : ''}
                        </h2>
                        <p className="text-xs text-light-text-secondary dark:text-text-secondary">
                            {events?.length || 0} event{(events?.length || 0) === 1 ? '' : 's'} scheduled
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 text-light-text-secondary dark:text-text-secondary">
                        <HiOutlineXMark className="h-6 w-6" />
                    </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-5">
                    {events && sortedTimeKeys.length > 0 && groupedEvents ? (
                        <div className="relative pl-8">
                            <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary/20 rounded-full"></div>
                            <AnimatePresence>
                            {sortedTimeKeys.map((time) => (
                                <div key={time} className="relative flex items-start mb-6 last:mb-2">
                                    <div className="absolute -left-[5.5px] top-1 h-3 w-3 rounded-full bg-light-surface dark:bg-surface border-2 border-primary"></div>
                                    <div className="absolute -left-16 text-right w-14">
                                        <p className="font-bold text-xs text-light-text-primary dark:text-text-primary whitespace-nowrap">{time.split(' ')[0]}</p>
                                        <p className="text-[10px] text-light-text-secondary dark:text-text-secondary">{time.split(' ')[1]}</p>
                                    </div>
                                    <div className="flex-1 space-y-3 ml-4">
                                        {groupedEvents[time].map((event) => (
                                            <TimelineEventCard 
                                                key={event.id} 
                                                event={event} 
                                                onSyncToGoogle={handleSyncToGoogle} 
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <HiOutlineCalendarDays className="w-12 h-12 mx-auto text-slate-300 dark:text-zinc-600 mb-2" />
                            <p className="text-sm font-medium text-light-text-secondary dark:text-text-secondary">{t('calendar.modal.noEvents')}</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

// --- Main Calendar Page Component ---

const CalendarPage: React.FC = () => {
    const navigate = useNavigate();
    const { 
        familyMembers, 
        getCalendarEvents, 
        isGoogleAuthenticated, 
        loginWithGoogle,
        isCalendarSyncing, 
        fetchGoogleEvents,
        syncAllToGoogleCalendar,
        includeGoogleCalendar,
        setIncludeGoogleCalendar,
        googleCalendarEvents
    } = useAppContext();
    const { t, language } = useTranslation();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedMemberId, setSelectedMemberId] = useState('all');
    const [filterType, setFilterType] = useState<'all' | 'medicine' | 'bill' | 'task' | 'appointment' | 'google_event'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [modalData, setModalData] = useState<{events: CalendarEvent[], date: Date} | null>(null);

    const firstDayOfMonth = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), [currentDate]);
    const lastDayOfMonth = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0), [currentDate]);

    const calendarEvents = useMemo(() => {
        let events = getCalendarEvents(firstDayOfMonth, lastDayOfMonth);

        if (filterType !== 'all') {
            events = events.filter(e => e.type === filterType);
        }
        
        if (selectedMemberId !== 'all') {
            events = events.filter(e => e.details?.memberId === selectedMemberId);
        }

        if (searchQuery.trim() !== '') {
            events = events.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        return events;
    }, [currentDate, selectedMemberId, filterType, searchQuery, getCalendarEvents, firstDayOfMonth, lastDayOfMonth]);

    const daysInMonth = useMemo(() => {
        const days = [];
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const date = new Date(year, month, 1);
        const startingDay = date.getDay();

        for (let i = 0; i < startingDay; i++) {
            days.push(null);
        }
        
        while (date.getMonth() === month) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;
    }, [currentDate]);

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    const handleDayClick = (day: Date) => {
        const events = calendarEvents.filter(e => e.date.toDateString() === day.toDateString());
        setModalData({ events, date: day });
    };

    const handleSyncCalendar = async () => {
        try {
            if (!isGoogleAuthenticated) {
                const ok = await loginWithGoogle();
                if (!ok) return;
            }
            const res = await syncAllToGoogleCalendar();
            toast.success(`Google Calendar synced! (${res.appointmentsSynced} appointments & ${res.billsSynced} bills synced)`);
        } catch (err: any) {
            if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
                return;
            }
            console.error(err);
            toast.error('Google Calendar sync failed.');
        }
    };

    const fabActions: SpeedDialAction[] = [
        {
            id: 'book_appointment',
            label: 'Book Appointment',
            icon: FaUserDoctor,
            color: 'indigo',
            onClick: () => navigate('/settings/appointments'),
        },
        {
            id: 'add_task',
            label: 'Create Task',
            icon: HiOutlineCheckCircle,
            color: 'purple',
            onClick: () => navigate('/tasks'),
        },
        {
            id: 'sync_gcal',
            label: isCalendarSyncing ? 'Syncing...' : (isGoogleAuthenticated ? 'Sync Google Calendar' : 'Connect Google Calendar'),
            icon: HiOutlineArrowPath,
            color: 'cyan',
            onClick: handleSyncCalendar,
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader 
                title={t('calendar.title')}
            />

            <Card className="!p-0 overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-center p-4 border-b border-slate-200 dark:border-zinc-700 gap-4">
                    <div className="flex items-center gap-2 self-start md:self-center">
                        <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-700"><HiChevronLeft className="h-6 w-6" /></button>
                        <h2 className="text-xl font-semibold w-40 text-center">{currentDate.toLocaleString(language, { month: 'long', year: 'numeric' })}</h2>
                        <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-700"><HiChevronRight className="h-6 w-6" /></button>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                        <div className="relative w-full sm:w-auto flex-grow">
                            <HiMagnifyingGlass className="absolute top-1/2 left-3 -translate-y-1/2 h-5 w-5 text-light-text-secondary dark:text-text-secondary" />
                            <input type="text" placeholder={t('calendar.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full p-2 pl-10 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-zinc-600 focus:ring-1 focus:ring-primary text-sm"/>
                        </div>
                        <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="w-full sm:w-auto p-2 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-zinc-600 focus:ring-1 focus:ring-primary text-sm">
                            <option value="all">{t('calendar.filter.allTypes')}</option>
                            <option value="medicine">{t('calendar.filter.medicine')}</option>
                            <option value="bill">{t('calendar.filter.bills')}</option>
                            <option value="task">{t('calendar.filter.tasks')}</option>
                            <option value="appointment">{t('appointments.title')}</option>
                            <option value="google_event">Google Calendar</option>
                        </select>
                        <select value={selectedMemberId} onChange={e => setSelectedMemberId(e.target.value)} className="w-full sm:w-auto p-2 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-zinc-600 focus:ring-1 focus:ring-primary text-sm">
                            <option value="all">{t('health.allMembers')}</option>
                            {familyMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                </div>

                <div role="grid">
                    <div role="row" className="grid grid-cols-7 text-center text-xs font-semibold text-light-text-secondary dark:text-text-secondary bg-slate-50/50 dark:bg-zinc-800/30">
                        {['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map(day => <div role="columnheader" key={day} className="py-2.5">{t(`calendar.days.${day}`)}</div>)}
                    </div>
                    <div role="rowgroup" className="grid grid-cols-7">
                        {daysInMonth.map((day, index) => {
                            if (!day) return <div key={`empty-${index}`} role="gridcell" className="border-t border-r border-slate-200 dark:border-zinc-800" />;

                            const isToday = day.toDateString() === new Date().toDateString();
                            const eventsForDay = calendarEvents.filter(e => e.date.toDateString() === day.toDateString());
                            
                            const dayNumberClasses = `w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                                isToday ? 'bg-primary text-white shadow' : 'text-light-text-primary dark:text-text-primary'
                            }`;
                            
                            return (
                                <motion.div 
                                    role="gridcell" 
                                    key={day.toISOString()} 
                                    onClick={() => handleDayClick(day)} 
                                    className="border-t border-r border-slate-200 dark:border-zinc-800 p-2 h-28 md:h-32 flex flex-col cursor-pointer transition-colors relative"
                                    whileHover={{ backgroundColor: 'rgba(139, 92, 246, 0.05)' }}
                                >
                                    <div className="self-end">
                                        <span className={dayNumberClasses}>{day.getDate()}</span>
                                    </div>
                                    <div className="flex-grow overflow-hidden mt-1">
                                        <AnimatePresence>
                                        <motion.div className="flex flex-wrap gap-1">
                                            {eventsForDay.slice(0, 4).map((event, i) => {
                                                const { colors } = getEventVisuals(event);
                                                return <motion.div 
                                                    key={event.id}
                                                    initial={{scale: 0}}
                                                    animate={{scale: 1}}
                                                    transition={{delay: i * 0.05}}
                                                    className={`w-2 h-2 rounded-full ${colors.dot}`} 
                                                    title={event.title} 
                                                />;
                                            })}
                                        </motion.div>
                                        </AnimatePresence>
                                        {eventsForDay.length > 4 && (
                                            <p className="text-[10px] font-semibold text-light-text-secondary dark:text-text-secondary mt-1">
                                                +{eventsForDay.length - 4} more
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </Card>
            
            <AnimatePresence>
                {modalData && (
                    <DayDetailsModal
                        onClose={() => setModalData(null)}
                        events={modalData.events}
                        date={modalData.date}
                    />
                )}
            </AnimatePresence>

            {/* SPEED DIAL FLOATING ACTION BUTTON */}
            <SpeedDialFAB
                actions={fabActions}
                mainLabel="Calendar Actions"
            />
        </div>
    );
};

export default CalendarPage;

