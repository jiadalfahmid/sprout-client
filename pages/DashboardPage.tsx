import React, { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import Card from '../components/ui/Card';
import { TransactionType } from '../types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Link } from 'react-router-dom';
import { HiOutlineChartPie, HiOutlineUserGroup, HiOutlineCheckCircle, HiOutlineHeart, HiOutlineTrash } from 'react-icons/hi2';

const quickActions = [
  { to: '/finance', label: 'Finance', icon: HiOutlineChartPie },
  { to: '/family', label: 'Family', icon: HiOutlineUserGroup },
  { to: '/tasks', label: 'Tasks', icon: HiOutlineCheckCircle },
  { to: '/health', label: 'Health', icon: HiOutlineHeart },
]

const DashboardPage: React.FC = () => {
  const { transactions, medicines, familyMembers, notes, addNote, deleteNote, theme } = useAppContext();
  const [newNote, setNewNote] = useState('');

  const financialSummary = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;
    return { totalIncome, totalExpense, balance };
  }, [transactions]);
  
  const expenseByCategory = useMemo(() => {
    const categories = transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
      
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
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

                const hasBeenTaken = med.history.some(h => {
                    const historyDate = new Date(h.timestamp);
                    return historyDate.toDateString() === now.toDateString() && historyDate.getHours() === parseInt(hour);
                });

                if (doseTime > now && !hasBeenTaken) {
                    return {
                        id: med.id,
                        name: med.name,
                        dosage: med.dosage,
                        unit: med.unit,
                        memberName: member?.name || 'Unknown',
                        time: doseTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    };
                }
                return null;
            });
        })
        .filter((r): r is NonNullable<typeof r> => r !== null)
        .sort((a, b) => a.time.localeCompare(b.time))
        .slice(0, 3);
  }, [medicines, familyMembers]);

  const handleAddNote = () => {
    if (newNote.trim()) {
        addNote({ content: newNote });
        setNewNote('');
    }
  };
  
  const COLORS = ['#10B981', '#3B82F6', '#FBBF24', '#F87171', '#8B5CF6'];

  return (
    <div className="space-y-6">
       {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4 text-center">
        {quickActions.map(action => (
          <Link key={action.to} to={action.to} className="bg-light-surface dark:bg-surface p-4 rounded-2xl flex flex-col items-center justify-center space-y-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors duration-200 border border-slate-200 dark:border-slate-700/50">
            <action.icon className="h-8 w-8 text-primary" />
            <span className="text-xs font-semibold text-light-text-primary dark:text-text-primary">{action.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Financial Summary */}
        <Card className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4 text-light-text-primary dark:text-text-primary">Financial Snapshot</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-light-text-secondary dark:text-text-secondary">Income</p>
              <p className="text-2xl font-bold text-income">${financialSummary.totalIncome.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-light-text-secondary dark:text-text-secondary">Expenses</p>
              <p className="text-2xl font-bold text-expense">${financialSummary.totalExpense.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-light-text-secondary dark:text-text-secondary">Balance</p>
              <p className="text-2xl font-bold text-light-text-primary dark:text-text-primary">${financialSummary.balance.toFixed(2)}</p>
            </div>
          </div>
           {expenseByCategory.length > 0 && (
            <div style={{ width: '100%', height: 250 }} className="mt-6">
                <ResponsiveContainer>
                    <PieChart>
                        <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label={{ fill: theme === 'dark' ? '#F9FAFB' : '#1F2937' }}>
                             {expenseByCategory.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF', border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`, borderRadius: '1rem' }} itemStyle={{ color: theme === 'dark' ? '#F9FAFB' : '#1F2937' }} formatter={(value: number) => `$${value.toFixed(2)}`}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
           )}
        </Card>

        {/* Health Reminders */}
        <Card>
            <h2 className="text-xl font-semibold mb-4 text-light-text-primary dark:text-text-primary">Health Reminders</h2>
            {upcomingReminders.length > 0 ? (
                <ul className="space-y-3">
                    {upcomingReminders.map(reminder => (
                        <li key={`${reminder.id}-${reminder.time}`} className="p-3 bg-light-background dark:bg-background rounded-lg">
                            <p className="font-semibold text-light-text-primary dark:text-text-primary">{reminder.name} for {reminder.memberName}</p>
                            <p className="text-sm text-light-text-secondary dark:text-text-secondary">{reminder.dosage}{reminder.unit} at {reminder.time}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-light-text-secondary dark:text-text-secondary">No upcoming reminders for today.</p>
            )}
        </Card>
        
        {/* Quick Notes */}
        <Card>
          <h2 className="text-xl font-semibold mb-4 text-light-text-primary dark:text-text-primary">Quick Notes</h2>
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
              placeholder="Jot down a quick note..."
              className="flex-grow p-2 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600 text-light-text-primary dark:text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button onClick={handleAddNote} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-opacity-90 transition">Add</button>
          </div>
          {notes.length > 0 ? (
            <ul className="space-y-2">
              {notes.map(note => (
                <li key={note.id} className="flex justify-between items-center p-2 bg-light-background dark:bg-background rounded-lg group">
                  <p className="text-sm text-light-text-primary dark:text-text-primary">{note.content}</p>
                  <button onClick={() => deleteNote(note.id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <HiOutlineTrash className="h-5 w-5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : <p className="text-light-text-secondary dark:text-text-secondary">No notes yet.</p>}
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
