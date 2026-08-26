import React, { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Card from '../components/ui/Card';
import { TransactionType } from '../types';
import { ResponsiveContainer, RadialBarChart, RadialBar, Legend, Tooltip, Cell, PolarAngleAxis } from 'recharts';
import { useTranslation } from '../hooks/useTranslation';
import { motion } from 'framer-motion';
import {
  HiOutlineTrash, HiOutlineCalendarDays,
  HiOutlineClipboardDocumentList, HiOutlineReceiptPercent,
  HiOutlineShoppingCart, HiOutlinePencil, HiOutlineUserGroup, HiOutlineCalendar,
  HiOutlineFlag, HiOutlineArrowsRightLeft, HiOutlineCog6Tooth, HiOutlineChevronDown,
  // FIX: Replaced HiOutlineSwitchHorizontal with HiOutlineArrowsUpDown as it does not exist in react-icons/hi2
  HiOutlineChartPie, HiOutlineHeart, HiOutlineReceiptRefund, HiOutlinePaintBrush, HiOutlineBell, HiOutlineArrowsUpDown, HiOutlineClipboardDocumentCheck
} from 'react-icons/hi2';
import { PiPill } from 'react-icons/pi';

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
          const hasBeenTaken = med.history.some(h => new Date(h.timestamp).toDateString() === now.toDateString() && new Date(h.timestamp).getHours() === parseInt(hour));
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
    
    { label: t('home.actions.transactions'), icon: HiOutlineArrowsUpDown, path: '/finance', color: 'emerald' },
    { label: t('home.actions.bills'), icon: HiOutlineReceiptRefund, path: '/finance', color: 'yellow' },
    { label: t('home.actions.borrowLend'), icon: HiOutlineArrowsRightLeft, path: '/finance', color: 'lime' },
    { label: t('home.actions.savings'), icon: HiOutlineFlag, path: '/finance', color: 'green' },
    
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
      <button onClick={handleClick} className="bg-transparent p-0 rounded-2xl flex flex-col items-center justify-start space-y-2 text-center group h-24">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 group-hover:scale-105 ${colorClasses[color] || colorClasses.gray}`}>
          <Icon className="h-7 w-7" />
        </div>
        <span className="text-xs font-semibold text-light-text-primary dark:text-text-primary leading-tight px-1">{label}</span>
      </button>
    );
  };
  
  const COLORS = ['#8B5CF6', '#3B82F6', '#FBBF24', '#F87171', '#4ADE80'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-light-text-primary dark:text-text-primary mb-1">
          {t('home.greeting', { name: user.name.split(' ')[0] })}
        </h1>
        <p className="text-light-text-secondary dark:text-text-secondary">{t('home.greetingSubtitle')}</p>
      </div>

      <Card>
        <motion.div layout>
            <h2 className="text-xl font-semibold mb-4 text-light-text-primary dark:text-text-primary">{t('home.actions.title')}</h2>
            <div className="grid grid-cols-4 gap-x-3 gap-y-5 justify-items-center">
                {actionsToDisplay.map((action, index) => (
                  <motion.div key={action.label} initial={{opacity: 0, scale: 0.8}} animate={{opacity: 1, scale: 1}} transition={{delay: index < 8 ? 0 : (index-8) * 0.05}}>
                    <ActionButton {...action} />
                  </motion.div>
                ))}
            </div>
            <div className="flex justify-center mt-4">
                <button
                    onClick={() => setActionsExpanded(prev => !prev)}
                    className="bg-light-surface dark:bg-surface px-6 py-2 rounded-full text-sm font-semibold text-primary border border-slate-200 dark:border-zinc-700 hover:bg-primary/10 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
                >
                    {isActionsExpanded ? t('home.actions.showLess') : t('home.actions.showMore')}
                    <motion.div animate={{ rotate: isActionsExpanded ? 180 : 0 }}>
                        <HiOutlineChevronDown className="h-5 w-5" />
                    </motion.div>
                </button>
            </div>
        </motion.div>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4 text-light-text-primary dark:text-text-primary">{t('home.financialSnapshot.title')}</h2>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-sm text-light-text-secondary dark:text-text-secondary">{t('home.financialSnapshot.income')}</p>
                <p className="text-2xl font-bold text-income">{currencySymbol}{financialSummary.totalIncome.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-light-text-secondary dark:text-text-secondary">{t('home.financialSnapshot.expenses')}</p>
                <p className="text-2xl font-bold text-expense">{currencySymbol}{financialSummary.totalExpense.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-light-text-secondary dark:text-text-secondary">{t('home.financialSnapshot.balance')}</p>
                <p className="text-2xl font-bold text-light-text-primary dark:text-text-primary">{currencySymbol}{financialSummary.balance.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex-1" style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer>
                <RadialBarChart cx="50%" cy="50%" innerRadius="40%" outerRadius="110%" barSize={10} data={expenseByCategory} startAngle={90} endAngle={-270}>
                    <PolarAngleAxis type="number" domain={[0, financialSummary.totalExpense]} angleAxisId={0} tick={false} />
                    <RadialBar background dataKey="value" angleAxisId={0} cornerRadius={5}>
                        {expenseByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none" />
                        ))}
                    </RadialBar>
                    <Legend iconSize={10} wrapperStyle={{fontSize: "12px"}}/>
                    <Tooltip formatter={(value: number) => `${currencySymbol}${value.toFixed(2)}`}/>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
        
        <Card>
          <h2 className="text-xl font-semibold mb-4 text-light-text-primary dark:text-text-primary">{t('home.atAGlance.title')}</h2>
          <ul className="space-y-4 text-light-text-primary dark:text-text-primary">
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300">
                  <HiOutlineReceiptPercent className="h-5 w-5"/>
                </div>
                {t('home.atAGlance.upcomingBills')}
              </span>
              <span className="font-bold text-lg">{atAGlanceStats.upcomingBills}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-300">
                  <HiOutlineClipboardDocumentList className="h-5 w-5"/>
                </div>
                {t('home.atAGlance.pendingTasks')}
              </span>
              <span className="font-bold text-lg">{atAGlanceStats.pendingTasks}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                  <HiOutlineCalendarDays className="h-5 w-5"/>
                </div>
                {t('home.atAGlance.upcomingAppointments')}
              </span>
              <span className="font-bold text-lg">{atAGlanceStats.upcomingAppointments}</span>
            </li>
          </ul>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4 text-light-text-primary dark:text-text-primary">{t('home.healthReminders.title')}</h2>
          {upcomingReminders.length > 0 ? (
            <ul className="space-y-3">
              {upcomingReminders.map(r => (
                <li key={r.id} className="flex items-center gap-3 p-3 bg-light-surface dark:bg-surface rounded-lg">
                  <div className="w-10 h-10 flex items-center justify-center bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 rounded-xl">
                    <PiPill className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-light-text-primary dark:text-text-primary">{r.name} {t('home.healthReminders.for')} {r.memberName}</p>
                    <p className="text-sm text-light-text-secondary dark:text-text-secondary">{r.dosage} {t('home.healthReminders.at')} {r.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="text-light-text-secondary dark:text-text-secondary">{t('home.healthReminders.noReminders')}</p>}
        </Card>

        <Card ref={notesRef}>
          <h2 className="text-xl font-semibold mb-4 text-light-text-primary dark:text-text-primary">{t('home.quickNotes.title')}</h2>
          <div className="flex gap-2 mb-4">
            <input type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddNote()} placeholder={t('home.quickNotes.placeholder')} className="flex-grow p-2 border rounded-lg bg-light-surface dark:bg-surface border-slate-200 dark:border-zinc-600 focus:ring-1 focus:ring-primary"/>
            <button onClick={handleAddNote} className="px-3 bg-primary text-white font-semibold rounded-lg hover:bg-opacity-90 transition"><HiOutlinePencil/></button>
          </div>
          {notes.length > 0 ? (
            <ul className="space-y-2">
              {notes.map(note => (
                <li key={note.id} className="flex justify-between items-center p-2 bg-light-surface dark:bg-surface rounded-lg group">
                  <p className="text-sm">{note.content}</p>
                  <button onClick={() => deleteNote(note.id)} className="text-red-400 opacity-0 group-hover:opacity-100"><HiOutlineTrash className="h-5 w-5" /></button>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-light-text-secondary dark:text-text-secondary">{t('home.quickNotes.noNotes')}</p>}
        </Card>
      </div>
    </div>
  );
};

export default HomePage;
