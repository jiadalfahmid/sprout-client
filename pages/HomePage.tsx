import React, { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import { TransactionType } from '../types';
import { ResponsiveContainer, RadialBarChart, RadialBar, Legend, Tooltip, Cell, PolarAngleAxis } from 'recharts';
import { useTranslation } from '../hooks/useTranslation';
import { motion } from 'motion/react';
import {
  HiOutlineTrash, HiOutlineCalendarDays,
  HiOutlineClipboardDocumentList, HiOutlineReceiptPercent,
  HiOutlineShoppingCart, HiOutlinePencil, HiOutlineUserGroup, HiOutlineCalendar,
  HiOutlineFlag, HiOutlineArrowsRightLeft, HiOutlineCog6Tooth, HiOutlineChevronDown,
  HiOutlineChartPie, HiOutlineHeart, HiOutlineReceiptRefund, HiOutlinePaintBrush, 
  HiOutlineBell, HiOutlineArrowsUpDown, HiOutlineClipboardDocumentCheck,
  HiArrowTrendingUp, HiArrowTrendingDown, HiOutlineWallet, HiChevronRight
} from 'react-icons/hi2';
import { PiPill } from 'react-icons/pi';
import { findDoseHistoryEntry } from '../services/notificationService';

const HomePage: React.FC = () => {
  const { 
    user, transactions, medicines, familyMembers, notes, addNote, deleteNote, 
    theme, currency, availableCurrencies, bills, tasks, appointments,
    toggleTheme, openDrawer 
  } = useAppContext();

  const [newNote, setNewNote] = useState('');
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isActionsExpanded, setActionsExpanded] = useState(false);
  const notesRef = useRef<HTMLDivElement>(null);

  const currencySymbol = useMemo(() => availableCurrencies.find(c => c.code === currency)?.symbol || '$', [currency, availableCurrencies]);

  const financialSummary = useMemo(() => {
    const monthTxs = transactions.filter(t => new Date(t.date).getMonth() === new Date().getMonth() && new Date(t.date).getFullYear() === new Date().getFullYear());
    const totalIncome = monthTxs.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = monthTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;
    return { totalIncome, totalExpense, balance };
  }, [transactions]);

  const expenseByCategory = useMemo(() => {
    const monthTxs = transactions.filter(t => new Date(t.date).getMonth() === new Date().getMonth() && new Date(t.date).getFullYear() === new Date().getFullYear());
    const categories = monthTxs
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
      
    const sortedCategories = Object.entries(categories).sort(([, a], [, b]) => Number(b) - Number(a)).slice(0, 5);
    return sortedCategories.map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const upcomingReminders = useMemo(() => {
    const now = new Date();
    return medicines
      .flatMap(med => {
        const member = familyMembers.find(m => m.id === med.memberId);
        return med.times.map(time => {
          const [hour, minute] = time.split(':');
          const doseTime = new Date();
          doseTime.setHours(parseInt(hour), parseInt(minute), 0, 0);
          const historyEntry = findDoseHistoryEntry(med.history, now, parseInt(hour, 10), parseInt(minute, 10));
          const hasBeenTaken = historyEntry?.status === 'taken';
          if (doseTime > now && !hasBeenTaken) {
            return {
              id: `${med.id}-${time}`,
              name: med.name,
              dosage: `${med.dosage}${med.unit}`,
              memberName: member?.name || 'Unknown',
              time: doseTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
          }
          return null;
        });
      })
      .filter(Boolean)
      .sort((a, b) => a.time.localeCompare(b.time))
      .slice(0, 3);
  }, [medicines, familyMembers]);

  const atAGlanceStats = useMemo(() => {
    const upcomingBills = bills.filter(b => !b.paid && new Date(b.dueDate) >= new Date()).length;
    const pendingTasks = tasks.filter(t => !t.completed).length;
    const upcomingAppointments = appointments.filter(a => a.status === 'upcoming' && new Date(a.dateTime) >= new Date()).length;
    return { upcomingBills, pendingTasks, upcomingAppointments };
  }, [bills, tasks, appointments]);

  const handleAddNote = () => {
    if (newNote.trim()) {
      addNote({ content: newNote });
      setNewNote('');
    }
  };
  
  const handleQuickNotesClick = () => {
    notesRef.current?.scrollIntoView({ behavior: 'smooth' });
    const input = notesRef.current?.querySelector('input');
    if (input) {
      input.focus();
    }
  };

  const allQuickActions = [
    { label: t('home.actions.finance'), icon: HiOutlineChartPie, path: '/finance', color: 'purple' },
    { label: t('home.actions.family'), icon: HiOutlineUserGroup, path: '/family', color: 'pink' },
    { label: t('home.actions.calendar'), icon: HiOutlineCalendarDays, path: '/calendar', color: 'cyan' },
    { label: t('home.actions.settings'), icon: HiOutlineCog6Tooth, path: '/settings', color: 'gray' },
    
    { label: t('home.actions.health'), icon: HiOutlineHeart, path: '/health', color: 'red' },
    { label: t('home.actions.medicine'), icon: PiPill, path: '/settings/medicines', color: 'blue' },
    { label: t('home.actions.appointment'), icon: HiOutlineCalendar, path: '/settings/appointments', color: 'indigo' },
    { label: t('home.actions.buyMedicine'), icon: HiOutlineShoppingCart, path: '/restock', color: 'orange' },
    
    { label: t('home.actions.transactions'), icon: HiOutlineArrowsUpDown, path: '/finance?view=transactions', color: 'emerald' },
    { label: t('home.actions.bills'), icon: HiOutlineReceiptRefund, path: '/finance?view=bills', color: 'yellow' },
    { label: t('home.actions.borrowLend'), icon: HiOutlineArrowsRightLeft, path: '/finance?view=borrow_lend', color: 'lime' },
    { label: t('home.actions.savings'), icon: HiOutlineFlag, path: '/finance?view=savings', color: 'green' },
    
    { label: t('home.actions.quickNotes'), icon: HiOutlinePencil, onClick: handleQuickNotesClick, color: 'slate' },
    { label: t('home.actions.newChore'), icon: HiOutlineClipboardDocumentCheck, path: '/tasks', color: 'rose' },
    { label: t('home.actions.theme'), icon: HiOutlinePaintBrush, onClick: toggleTheme, color: 'sky' },
    { label: t('home.actions.notifications'), icon: HiOutlineBell, onClick: openDrawer, color: 'amber' },
  ];

  const actionsToDisplay = isActionsExpanded ? allQuickActions : allQuickActions.slice(0, 8);

  const ActionButton = ({ label, icon: Icon, path, onClick, color }: {label: string, icon: React.ElementType, path?: string, onClick?: () => void, color: string}) => {
    
    const handleClick = () => {
        if (path) {
            navigate(path);
        } else if (onClick) {
            onClick();
        }
    };

    const colorClasses: Record<string, string> = {
      red: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-300',
      green: 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-300',
      emerald: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300',
      purple: 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300',
      blue: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300',
      indigo: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300',
      orange: 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-300',
      yellow: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-300',
      pink: 'bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-300',
      cyan: 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300',
      lime: 'bg-lime-100 dark:bg-lime-500/20 text-lime-600 dark:text-lime-300',
      gray: 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
      slate: 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
      rose: 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300',
      sky: 'bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-300',
      amber: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300'
    };
    
    return (
      <button onClick={handleClick} className="bg-transparent p-0 rounded-2xl flex flex-col items-center justify-start space-y-1 sm:space-y-1.5 text-center group h-18 sm:h-22 w-full max-w-[72px] sm:max-w-[84px]">
        <div className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center transition-all duration-200 group-hover:scale-105 ${colorClasses[color] || colorClasses.gray}`}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <span className="text-[11px] sm:text-xs font-semibold text-light-text-primary dark:text-text-primary leading-tight px-0.5 whitespace-nowrap truncate w-full" title={label}>
          {label}
        </span>
      </button>
    );
  };
  
  const COLORS = ['#8B5CF6', '#3B82F6', '#FBBF24', '#F87171', '#4ADE80'];

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader 
        title={t('home.greeting', { name: user.name.split(' ')[0] })}
        subtitle={t('home.greetingSubtitle')}
      />

      <Card>
        <motion.div layout>
            <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-light-text-primary dark:text-text-primary">{t('home.actions.title')}</h2>
            <div className="grid grid-cols-4 gap-x-2 sm:gap-x-3 gap-y-4 sm:gap-y-5 justify-items-center">
                {actionsToDisplay.map((action, index) => (
                  <motion.div key={action.label} initial={{opacity: 0, scale: 0.8}} animate={{opacity: 1, scale: 1}} transition={{delay: index < 8 ? 0 : (index-8) * 0.05}}>
                    <ActionButton {...action} />
                  </motion.div>
                ))}
            </div>
            <div className="flex justify-center mt-3 sm:mt-4">
                <button
                    onClick={() => setActionsExpanded(prev => !prev)}
                    className="bg-light-surface dark:bg-surface px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold text-primary border border-slate-200 dark:border-zinc-700 hover:bg-primary/10 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1.5 sm:gap-2"
                >
                    {isActionsExpanded ? t('home.actions.showLess') : t('home.actions.showMore')}
                    <motion.div animate={{ rotate: isActionsExpanded ? 180 : 0 }}>
                        <HiOutlineChevronDown className="h-4 w-4" />
                    </motion.div>
                </button>
            </div>
        </motion.div>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-bold text-light-text-primary dark:text-text-primary">{t('home.financialSnapshot.title')}</h2>
            <button 
              onClick={() => navigate('/finance')}
              className="text-xs font-semibold text-primary hover:text-primary-focus flex items-center gap-1 transition-colors group"
            >
              <span>{t('finance.title')}</span>
              <HiChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
            <div className="flex-1 flex flex-col justify-between gap-2.5 sm:gap-3">
              {/* Income */}
              <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/15">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <HiArrowTrendingUp className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium text-light-text-secondary dark:text-text-secondary truncate">
                    {t('home.financialSnapshot.income')}
                  </span>
                </div>
                <span className="text-xs sm:text-sm md:text-base font-bold text-emerald-600 dark:text-emerald-400 pl-2 whitespace-nowrap">
                  +{currencySymbol}{financialSummary.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Expenses */}
              <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/15">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <HiArrowTrendingDown className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium text-light-text-secondary dark:text-text-secondary truncate">
                    {t('home.financialSnapshot.expenses')}
                  </span>
                </div>
                <span className="text-xs sm:text-sm md:text-base font-bold text-rose-600 dark:text-rose-400 pl-2 whitespace-nowrap">
                  -{currencySymbol}{financialSummary.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Balance */}
              <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/70">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <HiOutlineWallet className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium text-light-text-secondary dark:text-text-secondary truncate">
                    {t('home.financialSnapshot.balance')}
                  </span>
                </div>
                <span className={`text-xs sm:text-sm md:text-base font-bold pl-2 whitespace-nowrap ${financialSummary.balance >= 0 ? 'text-light-text-primary dark:text-text-primary' : 'text-rose-500'}`}>
                  {financialSummary.balance < 0 ? '-' : ''}{currencySymbol}{Math.abs(financialSummary.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="hidden md:block flex-1 min-h-[170px]" style={{ width: '100%', height: 180 }}>
              {expenseByCategory.length > 0 && financialSummary.totalExpense > 0 ? (
                <ResponsiveContainer>
                  <RadialBarChart cx="50%" cy="50%" innerRadius="40%" outerRadius="110%" barSize={10} data={expenseByCategory} startAngle={90} endAngle={-270}>
                      <PolarAngleAxis type="number" domain={[0, financialSummary.totalExpense]} angleAxisId={0} tick={false} />
                      <RadialBar background dataKey="value" angleAxisId={0} cornerRadius={5}>
                          {expenseByCategory.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none" />
                          ))}
                      </RadialBar>
                      <Legend iconSize={10} wrapperStyle={{fontSize: "11px"}}/>
                      <Tooltip formatter={(value: number) => `${currencySymbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}/>
                  </RadialBarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-3 border border-dashed border-slate-200 dark:border-zinc-700 rounded-2xl">
                  <p className="text-xs text-light-text-secondary dark:text-text-secondary mb-2">
                    No expense transactions logged for this month.
                  </p>
                  <button
                    onClick={() => navigate('/finance')}
                    className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition"
                  >
                    + Add Transaction
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>
        
        <Card>
          <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-light-text-primary dark:text-text-primary">{t('home.atAGlance.title')}</h2>
          <ul className="space-y-3 sm:space-y-4 text-light-text-primary dark:text-text-primary">
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm font-medium">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300">
                  <HiOutlineReceiptPercent className="h-4 w-4 sm:h-5 sm:w-5"/>
                </div>
                {t('home.atAGlance.upcomingBills')}
              </span>
              <span className="font-bold text-base sm:text-lg">{atAGlanceStats.upcomingBills}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm font-medium">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-300">
                  <HiOutlineClipboardDocumentList className="h-4 w-4 sm:h-5 sm:w-5"/>
                </div>
                {t('home.atAGlance.pendingTasks')}
              </span>
              <span className="font-bold text-base sm:text-lg">{atAGlanceStats.pendingTasks}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm font-medium">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                  <HiOutlineCalendarDays className="h-4 w-4 sm:h-5 sm:w-5"/>
                </div>
                {t('home.atAGlance.upcomingAppointments')}
              </span>
              <span className="font-bold text-base sm:text-lg">{atAGlanceStats.upcomingAppointments}</span>
            </li>
          </ul>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-light-text-primary dark:text-text-primary">{t('home.healthReminders.title')}</h2>
          {upcomingReminders.length > 0 ? (
            <ul className="space-y-2 sm:space-y-3">
              {upcomingReminders.map(r => (
                <li key={r.id} className="flex items-center gap-3 p-2.5 sm:p-3 bg-light-surface dark:bg-surface rounded-xl border border-slate-100 dark:border-zinc-800">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 rounded-xl shrink-0">
                    <PiPill className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-xs sm:text-sm text-light-text-primary dark:text-text-primary truncate">{r.name} {t('home.healthReminders.for')} {r.memberName}</p>
                    <p className="text-[11px] sm:text-xs text-light-text-secondary dark:text-text-secondary">{r.dosage} {t('home.healthReminders.at')} {r.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="text-xs sm:text-sm text-light-text-secondary dark:text-text-secondary py-2">{t('home.healthReminders.noReminders')}</p>}
        </Card>

        <Card ref={notesRef}>
          <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-light-text-primary dark:text-text-primary">{t('home.quickNotes.title')}</h2>
          <div className="flex gap-2 mb-3 sm:mb-4">
            <input type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddNote()} placeholder={t('home.quickNotes.placeholder')} className="flex-grow p-2.5 text-base border rounded-lg bg-light-surface dark:bg-surface border-slate-200 dark:border-zinc-600 focus:ring-1 focus:ring-primary"/>
            <button onClick={handleAddNote} className="px-3.5 bg-primary text-white font-semibold rounded-lg hover:bg-opacity-90 transition flex items-center justify-center"><HiOutlinePencil className="h-4 w-4"/></button>
          </div>
          {notes.length > 0 ? (
            <ul className="space-y-1.5 sm:space-y-2">
              {notes.map(note => (
                <li key={note.id} className="flex justify-between items-center p-2 sm:p-2.5 bg-light-surface dark:bg-surface rounded-lg group border border-slate-100 dark:border-zinc-800">
                  <p className="text-xs sm:text-sm text-light-text-primary dark:text-text-primary">{note.content}</p>
                  <button onClick={() => deleteNote(note.id)} className="text-red-400 p-1.5 rounded hover:bg-red-500/10 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"><HiOutlineTrash className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          ) : <p className="text-xs sm:text-sm text-light-text-secondary dark:text-text-secondary py-2">{t('home.quickNotes.noNotes')}</p>}
        </Card>
      </div>
    </div>
  );
};

export default HomePage;
