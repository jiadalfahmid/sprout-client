import React, { useState, useMemo, useCallback, useRef, useEffect, RefObject } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import PageHeader from '../components/ui/PageHeader';
import { Transaction, TransactionType, Bill, BillCategory, Borrowing, Lending, SavingsGoal, Repayment, Return } from '../types';
import { HiPlus, HiPencil, HiTrash, HiChevronLeft, HiChevronRight, HiOutlineArrowTrendingUp, HiOutlineArrowTrendingDown, HiOutlineBanknotes, HiOutlineScale, HiOutlineReceiptRefund, HiOutlineWifi, HiOutlineHome, HiOutlineCreditCard, HiOutlineQuestionMarkCircle, HiOutlineMagnifyingGlass, HiOutlineChevronUpDown, HiOutlinePresentationChartBar, HiOutlineClipboardDocumentList, HiOutlineArrowsRightLeft, HiOutlineFlag, HiOutlineTrophy, HiOutlinePlusCircle, HiEllipsisVertical } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from '../hooks/useTranslation';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

import SpeedDialFAB, { SpeedDialAction } from '../components/ui/SpeedDialFAB';

type FinanceView = 'dashboard' | 'transactions' | 'bills' | 'borrow_lend' | 'savings';
type ModalType = 'none' | 'transaction' | 'bill' | 'borrowing' | 'lending' | 'repayment' | 'return' | 'savings_goal' | 'deposit' | 'delete_goal' | 'edit_goal' | 'edit_borrowing' | 'edit_lending' | 'delete_borrowing' | 'delete_lending';

// Custom hook to handle clicks outside a specified element
type AnyEvent = MouseEvent | TouchEvent;

function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: AnyEvent) => void,
): void {
  useEffect(() => {
    const listener = (event: AnyEvent) => {
      const el = ref?.current;
      if (!el || el.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}


const FinancePage: React.FC = () => {
    const { 
        currency, availableCurrencies
    } = useAppContext();
    const { t, language } = useTranslation();
    
    const [searchParams] = useSearchParams();
    const queryView = searchParams.get('view') as FinanceView | null;
    
    const [currentDate, setCurrentDate] = useState(new Date());
    const [activeView, setActiveView] = useState<FinanceView>(() => {
        if (queryView && ['dashboard', 'transactions', 'bills', 'borrow_lend', 'savings'].includes(queryView)) {
            return queryView;
        }
        return 'dashboard';
    });

    useEffect(() => {
        if (queryView && ['dashboard', 'transactions', 'bills', 'borrow_lend', 'savings'].includes(queryView)) {
            setActiveView(queryView);
        }
    }, [queryView]);

    const [pendingAction, setPendingAction] = useState<{ type: string; timestamp: number } | null>(null);
    const currencySymbol = useMemo(() => availableCurrencies.find(c => c.code === currency)?.symbol || '$', [currency, availableCurrencies]);

    const fabActions: SpeedDialAction[] = [
        {
            id: 'income',
            label: t('finance.addIncome') || 'Add Income',
            icon: HiOutlineArrowTrendingUp,
            color: 'emerald',
            onClick: () => {
                setActiveView('transactions');
                setPendingAction({ type: 'income', timestamp: Date.now() });
            },
        },
        {
            id: 'expense',
            label: t('finance.addExpense') || 'Add Expense',
            icon: HiOutlineArrowTrendingDown,
            color: 'rose',
            onClick: () => {
                setActiveView('transactions');
                setPendingAction({ type: 'expense', timestamp: Date.now() });
            },
        },
        {
            id: 'bill',
            label: t('finance.addRecurringBill') || 'Add Bill',
            icon: HiOutlineReceiptRefund,
            color: 'blue',
            onClick: () => {
                setActiveView('bills');
                setPendingAction({ type: 'bill', timestamp: Date.now() });
            },
        },
        {
            id: 'borrow',
            label: t('finance.modal.addBorrowing') || 'Add Borrowing (Debt)',
            icon: HiOutlineArrowsRightLeft,
            color: 'amber',
            onClick: () => {
                setActiveView('borrow_lend');
                setPendingAction({ type: 'borrowing', timestamp: Date.now() });
            },
        },
        {
            id: 'lend',
            label: t('finance.modal.addLending') || 'Add Lending (Loan)',
            icon: HiOutlineBanknotes,
            color: 'teal',
            onClick: () => {
                setActiveView('borrow_lend');
                setPendingAction({ type: 'lending', timestamp: Date.now() });
            },
        },
        {
            id: 'goal',
            label: t('finance.modal.addGoal') || 'New Goal',
            icon: HiOutlineFlag,
            color: 'indigo',
            onClick: () => {
                setActiveView('savings');
                setPendingAction({ type: 'goal', timestamp: Date.now() });
            },
        },
    ];

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    const navItems = [
        { view: 'dashboard', label: t('finance.tabs.dashboard'), icon: HiOutlinePresentationChartBar },
        { view: 'transactions', label: t('finance.tabs.transactions'), icon: HiOutlineClipboardDocumentList },
        { view: 'bills', label: t('finance.tabs.bills'), icon: HiOutlineReceiptRefund },
        { view: 'borrow_lend', label: t('finance.tabs.borrow_lend'), icon: HiOutlineArrowsRightLeft },
        { view: 'savings', label: t('finance.tabs.savings'), icon: HiOutlineFlag },
    ];

    const renderView = () => {
        switch(activeView) {
            case 'dashboard': return <DashboardView currentDate={currentDate} currencySymbol={currencySymbol} />;
            case 'transactions': return <TransactionsView currentDate={currentDate} currencySymbol={currencySymbol} triggerAction={pendingAction?.type === 'income' || pendingAction?.type === 'expense' ? (pendingAction as any) : null} />;
            case 'bills': return <BillsView currentDate={currentDate} currencySymbol={currencySymbol} triggerAction={pendingAction?.type === 'bill' ? (pendingAction as any) : null} />;
            case 'borrow_lend': return <BorrowLendView currencySymbol={currencySymbol} triggerAction={pendingAction?.type === 'borrowing' || pendingAction?.type === 'lending' ? (pendingAction as any) : null} />;
            case 'savings': return <SavingsView currencySymbol={currencySymbol} triggerAction={pendingAction?.type === 'goal' ? (pendingAction as any) : null} />;
            default: return null;
        }
    }
    
    return (
        <div className="space-y-6">
            <PageHeader
                title={t('finance.title')}
                action={
                    <div className="flex items-center justify-center bg-light-surface dark:bg-surface rounded-lg px-2 py-1 gap-1 w-full sm:w-auto border border-slate-200 dark:border-zinc-700">
                        <button
                            onClick={() => changeMonth(-1)}
                            className="p-2 sm:p-1 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-700"
                        >
                            <HiChevronLeft className="h-5 w-5" />
                        </button>

                        <h2 className="text-sm font-semibold w-32 sm:w-28 text-center truncate">
                            {currentDate.toLocaleString(language, { month: 'long', year: 'numeric' })}
                        </h2>

                        <button
                            onClick={() => changeMonth(1)}
                            className="p-2 sm:p-1 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-700"
                        >
                            <HiChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                }
            />

            <div className="overflow-x-auto">
                <div className="flex justify-center sm:justify-center gap-2 bg-slate-100 dark:bg-surface p-1 rounded-full min-w-max">
                    {navItems.map(item => (
                        <button key={item.view} onClick={() => setActiveView(item.view as FinanceView)} className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${activeView === item.view ? 'bg-primary text-white shadow-lg' : 'text-light-text-secondary dark:text-text-secondary'}`}>
                            <item.icon className="h-5 w-5"/>
                            <span className="hidden sm:inline">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeView}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {renderView()}
                </motion.div>
            </AnimatePresence>

            {/* SPEED DIAL FLOATING ACTION BUTTON */}
            <SpeedDialFAB
                actions={fabActions}
                mainLabel="Finance Actions"
            />
        </div>
    );
};

// --- VIEWS --- //

const DashboardView: React.FC<{ currentDate: Date, currencySymbol: string }> = ({ currentDate, currencySymbol }) => {
    const { theme, transactions, borrowings, lendings, savingsGoals } = useAppContext();
    const { t } = useTranslation();
    
    const monthlySummary = useMemo(() => {
        const monthTxs = transactions.filter(t => new Date(t.date).getMonth() === currentDate.getMonth() && new Date(t.date).getFullYear() === currentDate.getFullYear());
        const totalIncome = monthTxs.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = monthTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
        const balance = totalIncome - totalExpense;
        const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;
        return { totalIncome, totalExpense, balance, savingsRate };
    }, [transactions, currentDate]);

    const debtSummary = useMemo(() => {
        const totalOwed = borrowings
            .filter(b => b.status === 'outstanding')
            .reduce((sum, b) => sum + b.amount - b.repayments.reduce((s, r) => s + r.amount, 0), 0);
        const totalOwedToYou = lendings
            .filter(l => l.status === 'outstanding')
            .reduce((sum, l) => sum + l.amount - l.returns.reduce((s, r) => s + r.amount, 0), 0);
        return { totalOwed, totalOwedToYou };
    }, [borrowings, lendings]);

    const dailyChartData = useMemo(() => {
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        const data = [];
        const monthTxs = transactions.filter(t => new Date(t.date).getMonth() === currentDate.getMonth());
        for (let day = 1; day <= daysInMonth; day++) {
            const dailyIncome = monthTxs.filter(t => t.type === TransactionType.INCOME && new Date(t.date).getDate() === day).reduce((sum, t) => sum + t.amount, 0);
            const dailyExpense = monthTxs.filter(t => t.type === TransactionType.EXPENSE && new Date(t.date).getDate() === day).reduce((sum, t) => sum + t.amount, 0);
            if (dailyIncome > 0 || dailyExpense > 0) {
                data.push({ day: day.toString(), income: dailyIncome, expense: dailyExpense });
            }
        }
        return data;
    }, [transactions, currentDate]);

    const summaryCards = [
        { title: t('finance.totalIncome'), value: `${currencySymbol}${monthlySummary.totalIncome.toFixed(2)}`, icon: HiOutlineArrowTrendingUp, color: 'text-income', bgColor: 'bg-green-100 dark:bg-green-500/20' },
        { title: t('finance.totalExpenses'), value: `${currencySymbol}${monthlySummary.totalExpense.toFixed(2)}`, icon: HiOutlineArrowTrendingDown, color: 'text-expense', bgColor: 'bg-red-100 dark:bg-red-500/20' },
        { title: t('finance.remainingBalance'), value: `${currencySymbol}${monthlySummary.balance.toFixed(2)}`, icon: HiOutlineBanknotes, color: 'text-light-text-primary dark:text-text-primary', bgColor: 'bg-slate-100 dark:bg-zinc-800' },
        { title: t('finance.savingsRate'), value: `${monthlySummary.savingsRate}%`, icon: HiOutlineScale, color: 'text-teal', bgColor: 'bg-teal-100 dark:bg-teal-500/20' },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {summaryCards.map(card => (
                    <Card key={card.title} className="!p-4 text-center">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2 ${card.bgColor}`}>
                            <card.icon className={`h-6 w-6 ${card.color}`} />
                        </div>
                        <p className={`text-lg sm:text-xl font-bold ${card.color}`}>{card.value}</p>
                        <p className="text-xs text-light-text-secondary dark:text-text-secondary">{card.title}</p>
                    </Card>
                ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                     <h2 className="text-lg font-semibold mb-4 text-light-text-primary dark:text-text-primary">{t('finance.chartTitle')}</h2>
                     <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer>
                            <LineChart data={dailyChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#3f3f46' : '#e2e8f0'} />
                                <XAxis dataKey="day" tick={{ fill: theme === 'dark' ? '#a1a1aa' : '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis tick={{ fill: theme === 'dark' ? '#a1a1aa' : '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: theme === 'dark' ? '#27272a' : '#ffffff', border: `1px solid ${theme === 'dark' ? '#3f3f46' : '#e2e8f0'}`, borderRadius: '0.75rem' }}
                                    labelStyle={{ color: theme === 'dark' ? '#fafafa' : '#1e293b' }}
                                    formatter={(value: number) => `${currencySymbol}${value.toFixed(2)}`}
                                />
                                <Legend wrapperStyle={{fontSize: "14px"}}/>
                                <Line type="monotone" dataKey="income" stroke="#4ADE80" strokeWidth={2} name={t('finance.tabs.income')} dot={{ r: 4 }} activeDot={{ r: 6 }}/>
                                <Line type="monotone" dataKey="expense" stroke="#F87171" strokeWidth={2} name={t('finance.tabs.expenses')} dot={{ r: 4 }} activeDot={{ r: 6 }}/>
                            </LineChart>
                        </ResponsiveContainer>
                     </div>
                </Card>
                <div className="space-y-6">
                    <Card>
                        <h3 className="text-lg font-semibold mb-2">{t('finance.borrowingSummary.title')}</h3>
                        <div className="space-y-2">
                            <div>
                                <p className="text-sm text-light-text-secondary dark:text-text-secondary">{t('finance.borrowingSummary.youOwe')}</p>
                                <p className="text-xl font-bold text-expense">{currencySymbol}{debtSummary.totalOwed.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-light-text-secondary dark:text-text-secondary">{t('finance.borrowingSummary.owedToYou')}</p>
                                <p className="text-xl font-bold text-income">{currencySymbol}{debtSummary.totalOwedToYou.toFixed(2)}</p>
                            </div>
                        </div>
                    </Card>
                     <Card>
                        <h3 className="text-lg font-semibold mb-2">{t('finance.savingsSummary.title')}</h3>
                        <div className="space-y-3">
                            {savingsGoals.slice(0, 2).map(goal => <SavingsGoalItem key={goal.id} goal={goal} currencySymbol={currencySymbol} />)}
                             {savingsGoals.length === 0 && <p className="text-sm text-center text-light-text-secondary dark:text-text-secondary">{t('finance.savingsSummary.noGoals')}</p>}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

const TransactionsView: React.FC<{ 
    currentDate: Date; 
    currencySymbol: string;
    triggerAction?: { type: 'income' | 'expense'; timestamp: number } | null;
}> = ({ currentDate, currencySymbol, triggerAction }) => {
    const { transactions, addTransaction, updateTransaction, deleteTransaction } = useAppContext();
    const { t } = useTranslation();
    const [isTransactionModalOpen, setTransactionModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.INCOME);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [date, setDate] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction | 'description'; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
    const [isSortOpen, setSortOpen] = useState(false);
    const sortRef = useRef<HTMLDivElement>(null);
    useOnClickOutside(sortRef, () => setSortOpen(false));

    const resetTransactionForm = useCallback(() => {
        setDescription(''); setAmount(''); setCategory(''); setEditingTransaction(null);
        setDate(new Date().toISOString().split('T')[0]);
    }, []);

    const handleOpenTransactionModal = useCallback((type: TransactionType, transaction: Transaction | null = null) => {
        setTransactionType(type);
        if (transaction) {
            setEditingTransaction(transaction);
            setDescription(transaction.description);
            setAmount(transaction.amount.toString());
            setCategory(transaction.category);
            setDate(new Date(transaction.date).toISOString().split('T')[0]);
        } else {
            resetTransactionForm();
        }
        setTransactionModalOpen(true);
    }, [resetTransactionForm]);

    useEffect(() => {
        if (triggerAction) {
            if (triggerAction.type === 'income') {
                handleOpenTransactionModal(TransactionType.INCOME);
            } else if (triggerAction.type === 'expense') {
                handleOpenTransactionModal(TransactionType.EXPENSE);
            }
        }
    }, [triggerAction, handleOpenTransactionModal]);

    const handleSaveTransaction = () => {
        if (description && amount && category && date) {
            const transactionData = {
                description,
                amount: parseFloat(amount),
                type: transactionType,
                category,
                date: new Date(date).toISOString()
            };
            if(editingTransaction) {
                updateTransaction({ ...editingTransaction, ...transactionData });
                toast.success(t('finance.modal.transactionUpdated'));
            } else {
                addTransaction(transactionData);
                toast.success(t('finance.modal.transactionAdded'));
            }
            setTransactionModalOpen(false);
            resetTransactionForm();
        } else {
            toast.error(t('finance.modal.fillFieldsError'));
        }
    };
    
     const handleSortChange = (key: typeof sortConfig.key) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
        setSortOpen(false);
    };

    const filteredAndSortedTransactions = useMemo(() => {
        const monthlyTransactions = transactions.filter(t => new Date(t.date).getFullYear() === currentDate.getFullYear() && new Date(t.date).getMonth() === currentDate.getMonth());
        const searchedTransactions = monthlyTransactions.filter(t => t.description.toLowerCase().includes(searchQuery.toLowerCase()) || t.category.toLowerCase().includes(searchQuery.toLowerCase()));
        return [...searchedTransactions].sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [transactions, currentDate, searchQuery, sortConfig]);


    return (
        <Card>
            <div className="grid grid-cols-2 gap-4 mb-4">
                 <button onClick={() => handleOpenTransactionModal(TransactionType.INCOME)} className="p-3 bg-light-surface dark:bg-surface rounded-lg flex items-center justify-center text-sm font-semibold hover:bg-slate-100 dark:hover:bg-zinc-700/50 transition-colors border border-slate-200 dark:border-zinc-700"><HiPlus className="h-5 w-5 mr-2 text-income"/>{t('finance.addIncome')}</button>
                 <button onClick={() => handleOpenTransactionModal(TransactionType.EXPENSE)} className="p-3 bg-light-surface dark:bg-surface rounded-lg flex items-center justify-center text-sm font-semibold hover:bg-slate-100 dark:hover:bg-zinc-700/50 transition-colors border border-slate-200 dark:border-zinc-700"><HiPlus className="h-5 w-5 mr-2 text-expense"/>{t('finance.addExpense')}</button>
            </div>
             <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-grow">
                        <HiOutlineMagnifyingGlass className="absolute top-1/2 left-3 -translate-y-1/2 h-5 w-5 text-light-text-secondary dark:text-text-secondary" />
                        <input type="text" placeholder={t('finance.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full p-2 pl-10 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-zinc-600 focus:ring-1 focus:ring-primary"/>
                    </div>
                    <div className="relative" ref={sortRef}>
                        <button onClick={() => setSortOpen(!isSortOpen)} className="w-full sm:w-auto flex items-center justify-between gap-2 p-2 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-zinc-600">
                            <span className="capitalize">{t('finance.sortBy')}: {t(`finance.sort.${sortConfig.key}`)} ({t(`finance.sort.${sortConfig.direction}`)})</span>
                            <HiOutlineChevronUpDown className="h-5 w-5 text-light-text-secondary dark:text-text-secondary" />
                        </button>
                        <AnimatePresence>
                        {isSortOpen && (
                            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute z-10 top-full mt-2 w-full sm:w-56 right-0 bg-light-surface dark:bg-surface rounded-lg shadow-lg border border-slate-200 dark:border-zinc-700 p-2">
                                {(['date', 'description', 'amount', 'category'] as const).map(key => (
                                    <button key={key} onClick={() => handleSortChange(key)} className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700/50 capitalize">{t(`finance.sort.${key}`)}</button>
                                ))}
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </div>
                </div>
                {filteredAndSortedTransactions.length > 0 ? (
                    <ul className="divide-y divide-slate-200 dark:divide-zinc-700"><AnimatePresence>
                    {filteredAndSortedTransactions.map((t) => (
                        <motion.li key={t.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="py-3 flex flex-wrap justify-between items-center group gap-x-4 gap-y-2">
                            <div>
                                <p className="font-semibold">{t.description}</p>
                                <p className="text-sm text-light-text-secondary dark:text-text-secondary">{t.category} - {new Date(t.date).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <p className={`font-bold ${t.type === 'income' ? 'text-income' : 'text-expense'}`}>{t.type === 'income' ? '+' : '-'}{currencySymbol}{t.amount.toFixed(2)}</p>
                                <div className="flex gap-2 sm:opacity-0 sm:group-hover:opacity-100">
                                    <button onClick={() => handleOpenTransactionModal(t.type, t)} className="text-blue-400 hover:text-blue-300"><HiPencil/></button>
                                    <button onClick={() => deleteTransaction(t.id)} className="text-red-400 hover:text-red-300"><HiTrash/></button>
                                </div>
                            </div>
                        </motion.li>
                    ))}
                    </AnimatePresence></ul>
                ) : <p className="text-center py-4 text-light-text-secondary dark:text-text-secondary">{t('finance.noTransactions')}</p>}
            </div>
             <Modal isOpen={isTransactionModalOpen} onClose={() => setTransactionModalOpen(false)} title={editingTransaction ? t('finance.modal.edit' + (transactionType === 'income' ? 'Income' : 'Expense')) : t('finance.modal.add' + (transactionType === 'income' ? 'Income' : 'Expense'))}>
                 <div className="space-y-4">
                     <input type="text" placeholder={t('finance.modal.description')} value={description} onChange={e => setDescription(e.target.value)} className="w-full mt-1 p-3 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600" />
                    <div className="grid grid-cols-2 gap-4">
                        <input type="number" placeholder={t('finance.modal.amount')} value={amount} onChange={e => setAmount(e.target.value)} className="w-full mt-1 p-3 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600" />
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full mt-1 p-3 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600" />
                    </div>
                    <input type="text" placeholder={t('finance.modal.category')} value={category} onChange={e => setCategory(e.target.value)} className="w-full mt-1 p-3 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600" />
                    <button onClick={handleSaveTransaction} className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-opacity-90">{editingTransaction ? t('finance.modal.saveChanges') : t('finance.modal.addRecord')}</button>
                </div>
            </Modal>
        </Card>
    );
};

const BillsView: React.FC<{ 
    currentDate: Date; 
    currencySymbol: string;
    triggerAction?: { type: 'bill'; timestamp: number } | null;
}> = ({ currentDate, currencySymbol, triggerAction }) => {
    const { bills, addBill, updateBill, deleteBill } = useAppContext();
    const { t, language } = useTranslation();
    const [isBillModalOpen, setBillModalOpen] = useState(false);
    const [editingBill, setEditingBill] = useState<Bill | null>(null);
    const [deletingBill, setDeletingBill] = useState<Bill | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [billForm, setBillForm] = useState({ 
        name: '', 
        amount: '', 
        category: BillCategory.UTILITIES, 
        dueDate: '', 
        recurrence: 'monthly' as Bill['recurrence'],
        paid: false
    });

    const openBillModal = (bill?: Bill) => {
        if (bill) {
            setEditingBill(bill);
            setBillForm({
                name: bill.name,
                amount: bill.amount.toString(),
                category: bill.category,
                dueDate: bill.dueDate.split('T')[0],
                recurrence: bill.recurrence,
                paid: bill.paid
            });
        } else {
            setEditingBill(null);
            setBillForm({ 
                name: '', 
                amount: '', 
                category: BillCategory.UTILITIES, 
                dueDate: new Date().toISOString().split('T')[0], 
                recurrence: 'monthly',
                paid: false
            });
        }
        setBillModalOpen(true);
    };

    useEffect(() => {
        if (triggerAction && triggerAction.type === 'bill') {
            openBillModal();
        }
    }, [triggerAction]);

    const filteredBills = useMemo(() => {
        return bills.filter(b => {
            const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.category.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || b.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [bills, searchQuery, selectedCategory]);

    const upcomingBills = filteredBills.filter(b => !b.paid).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    const paidBills = filteredBills.filter(b => b.paid).sort((a,b) => new Date(b.paidOn || b.dueDate).getTime() - new Date(a.paidOn || a.dueDate).getTime());

    const handleTogglePaid = (bill: Bill) => {
        const updatedPaid = !bill.paid;
        if (updateBill({ 
            ...bill, 
            paid: updatedPaid,
            paidOn: updatedPaid ? new Date().toISOString() : undefined
        })) {
            toast.success(updatedPaid ? t('finance.billPaidSuccess') : t('finance.modal.markUnpaid'));
        }
    };

    const handleSaveBill = () => {
        if(billForm.name && billForm.amount && billForm.dueDate) {
            if (editingBill) {
                updateBill({
                    ...editingBill,
                    name: billForm.name,
                    amount: parseFloat(billForm.amount),
                    category: billForm.category,
                    dueDate: new Date(billForm.dueDate).toISOString(),
                    recurrence: billForm.recurrence,
                    paid: billForm.paid,
                    paidOn: billForm.paid ? (editingBill.paidOn || new Date().toISOString()) : undefined
                });
                toast.success(t('finance.modal.billUpdated'));
            } else {
                addBill({
                    name: billForm.name,
                    amount: parseFloat(billForm.amount),
                    category: billForm.category,
                    dueDate: new Date(billForm.dueDate).toISOString(),
                    recurrence: billForm.recurrence
                });
                toast.success(t('finance.modal.billAdded'));
            }
            setBillModalOpen(false);
            setEditingBill(null);
            setBillForm({ name: '', amount: '', category: BillCategory.UTILITIES, dueDate: '', recurrence: 'monthly', paid: false });
        } else {
            toast.error(t('finance.modal.fillFieldsError'));
        }
    };

    const handleDeleteBill = () => {
        if (deletingBill) {
            deleteBill(deletingBill.id);
            toast.success(t('finance.modal.billDeleted'));
            setDeletingBill(null);
        }
    };

    const BillItem: React.FC<{ bill: Bill }> = ({ bill }) => {
        const [menuOpen, setMenuOpen] = useState(false);
        const menuRef = useRef<HTMLDivElement>(null);
        useOnClickOutside(menuRef, () => setMenuOpen(false));

        const today = new Date();
        today.setHours(0,0,0,0);
        const dueDate = new Date(bill.dueDate);
        const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        let statusText = '';
        let statusColor = 'text-light-text-secondary dark:text-text-secondary';
        if (!bill.paid) {
            if (diffDays < 0) {
                statusText = t('finance.bills.overdueBy', { days: Math.abs(diffDays) });
                statusColor = 'text-expense';
            } else if (diffDays === 0) {
                statusText = t('finance.bills.dueToday');
                statusColor = 'text-yellow-500';
            } else {
                statusText = t('finance.bills.dueIn', { days: diffDays });
            }
        } else {
            statusText = t('finance.bills.paidOn', { date: new Date(bill.paidOn || bill.dueDate).toLocaleDateString() });
            statusColor = 'text-green-500';
        }

        return (
            <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-3.5 bg-light-background dark:bg-background rounded-xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border border-slate-100 dark:border-zinc-800">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <p className="font-bold text-light-text-primary dark:text-text-primary">{bill.name}</p>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-zinc-700 text-light-text-secondary dark:text-text-secondary capitalize font-medium">{bill.category}</span>
                        {bill.recurrence !== 'none' && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-primary/10 text-primary capitalize font-medium">{bill.recurrence}</span>
                        )}
                    </div>
                    <p className={`text-xs font-semibold mt-1 ${statusColor}`}>{statusText}</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-auto">
                    <p className="font-bold text-lg text-light-text-primary dark:text-text-primary">{currencySymbol}{bill.amount.toFixed(2)}</p>
                    
                    <div className="flex items-center gap-1.5">
                        <button 
                            onClick={() => handleTogglePaid(bill)} 
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${bill.paid ? 'bg-slate-200 dark:bg-zinc-700 text-light-text-primary dark:text-text-primary hover:bg-slate-300' : 'bg-primary text-white hover:bg-primary/90'}`}
                        >
                            {bill.paid ? t('finance.modal.markUnpaid') : t('finance.bills.pay')}
                        </button>
                        
                        <div className="relative" ref={menuRef}>
                            <button onClick={() => setMenuOpen(p => !p)} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 text-light-text-secondary dark:text-text-secondary">
                                <HiEllipsisVertical className="h-5 w-5" />
                            </button>
                            <AnimatePresence>
                                {menuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                                        className="absolute right-0 top-8 w-44 bg-light-surface dark:bg-surface rounded-lg shadow-xl border border-slate-200 dark:border-zinc-700 z-20 p-1.5 space-y-1"
                                    >
                                        <button onClick={() => { openBillModal(bill); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700/50">
                                            <HiPencil className="h-3.5 w-3.5" /> {t('finance.modal.actions.edit')}
                                        </button>
                                        <button onClick={() => { setDeletingBill(bill); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md text-red-500 hover:bg-red-500/10">
                                            <HiTrash className="h-3.5 w-3.5" /> {t('finance.modal.actions.delete')}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-72">
                    <HiOutlineMagnifyingGlass className="absolute top-1/2 left-3 -translate-y-1/2 h-4 w-4 text-light-text-secondary dark:text-text-secondary" />
                    <input 
                        type="text" 
                        placeholder={t('finance.searchPlaceholder')} 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        className="w-full text-sm p-2 pl-9 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-zinc-700 focus:ring-1 focus:ring-primary"
                    />
                </div>
                <button onClick={() => openBillModal()} className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-lg flex items-center justify-center text-sm font-semibold hover:bg-opacity-90 transition-colors shrink-0">
                    <HiPlus className="h-4 w-4 mr-1.5"/>{t('finance.addRecurringBill')}
                </button>
            </div>

            {/* Category Chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
                {['all', ...Object.values(BillCategory)].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-full capitalize whitespace-nowrap font-medium transition-colors ${selectedCategory === cat ? 'bg-primary text-white' : 'bg-light-surface dark:bg-surface border border-slate-200 dark:border-zinc-700 text-light-text-secondary dark:text-text-secondary hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <Card>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold">{t('finance.bills.upcoming')}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 font-semibold">{upcomingBills.length}</span>
                </div>
                {upcomingBills.length > 0 ? (
                    <div className="space-y-2"><AnimatePresence>{upcomingBills.map(b => <BillItem key={b.id} bill={b}/>)}</AnimatePresence></div>
                ) : (
                    <p className="text-center text-sm text-light-text-secondary dark:text-text-secondary py-4">{t('finance.noBills')}</p>
                )}
            </Card>

            <Card>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold">{t('finance.bills.paid')}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 font-semibold">{paidBills.length}</span>
                </div>
                {paidBills.length > 0 ? (
                    <div className="space-y-2"><AnimatePresence>{paidBills.map(b => <BillItem key={b.id} bill={b}/>)}</AnimatePresence></div>
                ) : (
                    <p className="text-center text-sm text-light-text-secondary dark:text-text-secondary py-4">{t('finance.noPaidBills')}</p>
                )}
            </Card>

            {/* Add / Edit Bill Modal */}
            <Modal isOpen={isBillModalOpen} onClose={() => setBillModalOpen(false)} title={editingBill ? t('finance.modal.editBill') : t('finance.modal.addBill')}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1">{t('finance.modal.billName')}</label>
                        <input type="text" placeholder={t('finance.modal.billName')} value={billForm.name} onChange={e => setBillForm(s => ({...s, name: e.target.value}))} className="w-full p-2.5 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600"/>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1">{t('finance.modal.amount')}</label>
                            <input type="number" placeholder="0.00" value={billForm.amount} onChange={e => setBillForm(s => ({...s, amount: e.target.value}))} className="w-full p-2.5 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600"/>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1">{t('finance.modal.dueDate')}</label>
                            <input type="date" value={billForm.dueDate} onChange={e => setBillForm(s => ({...s, dueDate: e.target.value}))} className="w-full p-2.5 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600"/>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1">{t('finance.modal.category')}</label>
                            <select value={billForm.category} onChange={e => setBillForm(s => ({...s, category: e.target.value as BillCategory}))} className="w-full p-2.5 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600">
                                {Object.values(BillCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1">{t('finance.modal.recurrence')}</label>
                            <select value={billForm.recurrence} onChange={e => setBillForm(s => ({...s, recurrence: e.target.value as any}))} className="w-full p-2.5 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600">
                                <option value="monthly">{t('finance.modal.recurrenceOptions.monthly')}</option>
                                <option value="weekly">{t('finance.modal.recurrenceOptions.weekly')}</option>
                                <option value="yearly">{t('finance.modal.recurrenceOptions.yearly')}</option>
                                <option value="none">{t('finance.modal.recurrenceOptions.none')}</option>
                            </select>
                        </div>
                    </div>
                    {editingBill && (
                        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer pt-1">
                            <input type="checkbox" checked={billForm.paid} onChange={e => setBillForm(s => ({ ...s, paid: e.target.checked }))} className="h-4 w-4 rounded text-primary focus:ring-primary" />
                            <span>{t('finance.modal.markPaid')}</span>
                        </label>
                    )}
                    <button onClick={handleSaveBill} className="w-full py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-opacity-90 transition-colors">
                        {editingBill ? t('finance.modal.saveChanges') : t('finance.modal.addBillBtn')}
                    </button>
                </div>
            </Modal>

            {/* Delete Bill Confirmation Modal */}
            <Modal isOpen={!!deletingBill} onClose={() => setDeletingBill(null)} title={t('finance.modal.deleteBill')}>
                <div className="space-y-4">
                    <p className="text-light-text-secondary dark:text-text-secondary">
                        {t('finance.modal.deleteBillConfirm', { billName: deletingBill?.name || '' })}
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => setDeletingBill(null)} className="px-4 py-2 bg-slate-200 dark:bg-zinc-700 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-zinc-600 text-sm">
                            {t('tasks.deleteModal.cancel')}
                        </button>
                        <button onClick={handleDeleteBill} className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 text-sm">
                            {t('tasks.deleteModal.confirm')}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

const BorrowLendItemCard: React.FC<{
    item: Borrowing | Lending;
    currencySymbol: string;
    onLogPayment: (item: Borrowing | Lending) => void;
    onEdit: (item: Borrowing | Lending) => void;
    onDelete: (item: Borrowing | Lending) => void;
    onDeletePayment?: (itemId: string, index: number, isBorrowing: boolean) => void;
    onWriteOff?: (id: string) => void;
}> = ({ item, currencySymbol, onLogPayment, onEdit, onDelete, onDeletePayment, onWriteOff }) => {
    const { t } = useTranslation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    useOnClickOutside(menuRef, () => setMenuOpen(false));
    
    const isBorrowing = 'lenderName' in item;
    const paymentsList = isBorrowing ? (item.repayments || []) : (item.returns || []);
    const totalPaid = paymentsList.reduce((s, r) => s + r.amount, 0);
    const remaining = Math.max(0, item.amount - totalPaid);
    const percentage = item.amount > 0 ? Math.min(Math.round((totalPaid / item.amount) * 100), 100) : 100;
    const dueDate = isBorrowing ? item.dueDate : item.returnDate;
    const isOverdue = item.status === 'outstanding' && new Date(dueDate) < new Date();
    
    const accentClasses = isBorrowing 
        ? 'bg-card-accent-orange-bg dark:bg-dark-card-accent-orange-bg text-card-accent-orange-text dark:text-dark-card-accent-orange-text' 
        : 'bg-card-accent-green-bg dark:bg-dark-card-accent-green-bg text-card-accent-green-text dark:text-dark-card-accent-green-text';

    const progressColor = isBorrowing ? 'bg-orange-500' : 'bg-green-500';

    return (
        <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 bg-light-background dark:bg-background rounded-2xl space-y-3 border border-slate-100 dark:border-zinc-800">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-light-text-primary dark:text-text-primary">{isBorrowing ? item.lenderName : item.borrowerName}</p>
                    <p className="text-xs text-light-text-secondary dark:text-text-secondary">{t(isBorrowing ? 'finance.borrowLend.lender' : 'finance.borrowLend.borrower')}</p>
                </div>
                <div className="relative" ref={menuRef}>
                    <button onClick={() => setMenuOpen(p => !p)} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 text-light-text-secondary dark:text-text-secondary">
                        <HiEllipsisVertical className="h-5 w-5" />
                    </button>
                    <AnimatePresence>
                        {menuOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                                className="absolute top-8 right-0 w-48 bg-light-surface dark:bg-surface rounded-lg shadow-xl border border-slate-200 dark:border-zinc-700 z-10 p-1.5 space-y-1"
                            >
                                <button onClick={() => { onLogPayment(item); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700/50">
                                    <HiPlus className="h-3.5 w-3.5" /> {t(isBorrowing ? 'finance.borrowLend.logRepayment' : 'finance.borrowLend.logReturn')}
                                </button>
                                <button onClick={() => { onEdit(item); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700/50">
                                    <HiPencil className="h-3.5 w-3.5" /> {t('finance.modal.actions.edit')}
                                </button>
                                {!isBorrowing && onWriteOff && (
                                     <button onClick={() => { onWriteOff(item.id); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700/50">
                                        <HiOutlineReceiptRefund className="h-3.5 w-3.5" /> {t('finance.borrowLend.writeOff')}
                                    </button>
                                )}
                                <div className="h-px bg-slate-200 dark:bg-zinc-700 my-1"></div>
                                <button onClick={() => { onDelete(item); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md text-red-500 hover:bg-red-500/10">
                                    <HiTrash className="h-3.5 w-3.5" /> {t('finance.modal.actions.delete')}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            
            <div className={`p-3 rounded-lg flex justify-between items-center ${accentClasses}`}>
                <div>
                    <p className="text-xs font-semibold opacity-80">{t('finance.borrowLend.remaining')}</p>
                    <p className="text-2xl font-bold">{currencySymbol}{remaining.toFixed(2)}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-semibold opacity-80">{t('finance.borrowLend.total')}</p>
                    <p className="font-semibold">{currencySymbol}{item.amount.toFixed(2)}</p>
                </div>
            </div>

            <div>
                <div className="flex justify-between text-xs font-medium text-light-text-secondary dark:text-text-secondary mb-1">
                    <span>{currencySymbol}{totalPaid.toFixed(2)} {t('finance.borrowLend.paid')}</span>
                    <span>{percentage}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-zinc-700 rounded-full h-2">
                    <div className={`${progressColor} h-2 rounded-full transition-all duration-300`} style={{ width: `${percentage}%` }}/>
                </div>
            </div>
            
            <div className="flex justify-between items-center text-xs text-light-text-secondary dark:text-text-secondary pt-1">
                <p>{t('finance.borrowLend.dueDate')} <span className={`font-semibold ${isOverdue ? 'text-red-500' : 'text-light-text-primary dark:text-text-primary'}`}>{new Date(dueDate).toLocaleDateString()}</span></p>
                {isOverdue && <span className="px-2 py-0.5 bg-red-500/20 text-red-500 text-[10px] font-bold rounded-full">{t('finance.borrowLend.overdue')}</span>}
            </div>

            {/* Payment History Accordion */}
            {paymentsList.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-zinc-700/60">
                    <button 
                        onClick={() => setHistoryOpen(p => !p)} 
                        className="text-xs font-semibold text-primary flex items-center justify-between w-full hover:underline"
                    >
                        <span>{isBorrowing ? 'Repayments Log' : 'Returns Log'} ({paymentsList.length})</span>
                        <span>{historyOpen ? '▲ Hide' : '▼ View'}</span>
                    </button>

                    <AnimatePresence>
                        {historyOpen && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: 'auto' }} 
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-2 space-y-1.5 overflow-hidden"
                            >
                                {paymentsList.map((p, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xs bg-light-surface dark:bg-surface p-2 rounded-lg border border-slate-200 dark:border-zinc-700">
                                        <div>
                                            <span className="font-semibold text-light-text-primary dark:text-text-primary">{currencySymbol}{p.amount.toFixed(2)}</span>
                                            <span className="text-light-text-secondary dark:text-text-secondary ml-2">{new Date(p.date).toLocaleDateString()}</span>
                                        </div>
                                        {onDeletePayment && (
                                            <button 
                                                onClick={() => onDeletePayment(item.id, idx, isBorrowing)} 
                                                className="text-red-400 hover:text-red-500 p-1 rounded hover:bg-red-500/10 transition-colors"
                                                title="Delete this payment record"
                                            >
                                                <HiTrash className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </motion.div>
    );
};

const BorrowLendView: React.FC<{ 
    currencySymbol: string;
    triggerAction?: { type: 'borrowing' | 'lending'; timestamp: number } | null;
}> = ({ currencySymbol, triggerAction }) => {
    const { borrowings, lendings, addBorrowing, updateBorrowing, deleteBorrowing, addLending, updateLending, deleteLending, addRepayment, deleteRepayment, addReturn, deleteReturn, writeOffLending } = useAppContext();
    const { t } = useTranslation();
    const [modal, setModal] = useState<ModalType>('none');
    const [selectedItem, setSelectedItem] = useState<Borrowing | Lending | null>(null);
    const [form, setForm] = useState({ name: '', amount: '', date: new Date().toISOString().split('T')[0], returnDate: new Date().toISOString().split('T')[0], notes: '' });

    const openModal = useCallback((type: ModalType, item: Borrowing | Lending | null = null) => {
        setModal(type);
        setSelectedItem(item);
        if ((type === 'edit_borrowing' || type === 'edit_lending') && item) {
            const isBorrowing = 'lenderName' in item;
            setForm({
                name: isBorrowing ? item.lenderName : item.borrowerName,
                amount: item.amount.toString(),
                date: new Date(isBorrowing ? item.borrowedDate : item.lentDate).toISOString().split('T')[0],
                returnDate: new Date(isBorrowing ? item.dueDate : item.returnDate).toISOString().split('T')[0],
                notes: item.notes || ''
            });
        } else {
             setForm({ name: '', amount: '', date: new Date().toISOString().split('T')[0], returnDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0], notes: '' });
        }
    }, []);

    useEffect(() => {
        if (triggerAction) {
            if (triggerAction.type === 'borrowing') {
                openModal('borrowing');
            } else if (triggerAction.type === 'lending') {
                openModal('lending');
            }
        }
    }, [triggerAction, openModal]);

    const handleSave = () => {
        // Logic for logging payments (repayment/return)
        if (modal === 'repayment' || modal === 'return') {
            if (!form.amount || !form.date) {
                toast.error(t('finance.modal.fillFieldsError'));
                return;
            }
    
            if (selectedItem) {
                if (modal === 'repayment') {
                    addRepayment(selectedItem.id, { amount: parseFloat(form.amount), date: new Date(form.date).toISOString() });
                    toast.success(t('finance.modal.repaymentLogged'));
                } else { // modal === 'return'
                    addReturn(selectedItem.id, { amount: parseFloat(form.amount), date: new Date(form.date).toISOString() });
                    toast.success(t('finance.modal.returnLogged'));
                }
            }
            openModal('none');
            return;
        }
        
        // Logic for adding/editing borrowing/lending records
        if (!form.name || !form.amount || !form.date || !form.returnDate) {
            toast.error(t('finance.modal.fillFieldsError'));
            return;
        }
    
        const commonData = {
            amount: parseFloat(form.amount),
            notes: form.notes,
        };
    
        if (modal === 'borrowing' || modal === 'edit_borrowing') {
            const borrowingData = { ...commonData, lenderName: form.name, borrowedDate: new Date(form.date).toISOString(), dueDate: new Date(form.returnDate).toISOString() };
            if (modal === 'edit_borrowing' && selectedItem) {
                updateBorrowing({ ...(selectedItem as Borrowing), ...borrowingData });
                toast.success(t('finance.modal.borrowingUpdated'));
            } else {
                addBorrowing(borrowingData);
                toast.success(t('finance.modal.borrowingAdded'));
            }
        } else if (modal === 'lending' || modal === 'edit_lending') {
            const lendingData = { ...commonData, borrowerName: form.name, lentDate: new Date(form.date).toISOString(), returnDate: new Date(form.returnDate).toISOString() };
            if (modal === 'edit_lending' && selectedItem) {
                updateLending({ ...(selectedItem as Lending), ...lendingData });
                toast.success(t('finance.modal.lendingUpdated'));
            } else {
                addLending(lendingData);
                toast.success(t('finance.modal.lendingAdded'));
            }
        }
    
        openModal('none');
    };

    const handleDelete = () => {
        if (!selectedItem) return;
        if (modal === 'delete_borrowing') {
            deleteBorrowing(selectedItem.id);
            toast.success(t('finance.modal.borrowingDeleted'));
        } else if (modal === 'delete_lending') {
            deleteLending(selectedItem.id);
            toast.success(t('finance.modal.lendingDeleted'));
        }
        openModal('none');
    };

    const handleDeletePayment = (itemId: string, index: number, isBorrowing: boolean) => {
        if (isBorrowing) {
            deleteRepayment(itemId, index);
            toast.success(t('finance.modal.paymentDeleted'));
        } else {
            deleteReturn(itemId, index);
            toast.success(t('finance.modal.paymentDeleted'));
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold">{t('finance.borrowLend.youOwe')}</h3>
                    <button onClick={() => openModal('borrowing')} className="p-1.5 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"><HiPlus/></button>
                </div>
                {borrowings.filter(b => b.status === 'outstanding').length > 0 ? (
                    <div className="space-y-3">
                        <AnimatePresence>
                            {borrowings.filter(b => b.status === 'outstanding').map(b => (
                                <BorrowLendItemCard 
                                    key={b.id} 
                                    item={b} 
                                    currencySymbol={currencySymbol} 
                                    onLogPayment={(item) => openModal('repayment', item)} 
                                    onEdit={(item) => openModal('edit_borrowing', item)} 
                                    onDelete={(item) => openModal('delete_borrowing', item)} 
                                    onDeletePayment={handleDeletePayment}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <p className="text-center text-sm text-light-text-secondary dark:text-text-secondary py-4">{t('finance.borrowLend.noBorrowings')}</p>
                )}
            </Card>
            <Card>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold">{t('finance.borrowLend.owedToYou')}</h3>
                    <button onClick={() => openModal('lending')} className="p-1.5 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"><HiPlus/></button>
                </div>
                {lendings.filter(l => l.status === 'outstanding').length > 0 ? (
                    <div className="space-y-3">
                        <AnimatePresence>
                            {lendings.filter(l => l.status === 'outstanding').map(l => (
                                <BorrowLendItemCard 
                                    key={l.id} 
                                    item={l} 
                                    currencySymbol={currencySymbol} 
                                    onLogPayment={(item) => openModal('return', item)} 
                                    onEdit={(item) => openModal('edit_lending', item)} 
                                    onDelete={(item) => openModal('delete_lending', item)} 
                                    onDeletePayment={handleDeletePayment}
                                    onWriteOff={writeOffLending}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <p className="text-center text-sm text-light-text-secondary dark:text-text-secondary py-4">{t('finance.borrowLend.noLendings')}</p>
                )}
            </Card>

            {/* Add/Edit Modals */}
             <Modal 
                isOpen={['borrowing', 'lending', 'edit_borrowing', 'edit_lending'].includes(modal)} 
                onClose={() => openModal('none')} 
                title={
                    modal === 'borrowing' ? t('finance.modal.addBorrowing') :
                    modal === 'edit_borrowing' ? t('finance.modal.editBorrowing') :
                    modal === 'lending' ? t('finance.modal.addLending') :
                    t('finance.modal.editLending')
                }>
                <div className="space-y-4">
                    <input type="text" placeholder={t(['borrowing', 'edit_borrowing'].includes(modal) ? 'finance.modal.lenderName' : 'finance.modal.borrowerName')} value={form.name} onChange={e => setForm(s => ({...s, name: e.target.value}))} className="w-full p-3 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600"/>
                    <input type="number" placeholder={t('finance.modal.amount')} value={form.amount} onChange={e => setForm(s => ({...s, amount: e.target.value}))} className="w-full p-3 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600"/>
                    <div className="grid grid-cols-2 gap-4">
                        <input type="date" value={form.date} onChange={e => setForm(s => ({...s, date: e.target.value}))} className="w-full p-3 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600"/>
                        <input type="date" value={form.returnDate} onChange={e => setForm(s => ({...s, returnDate: e.target.value}))} className="w-full p-3 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600"/>
                    </div>
                    <input type="text" placeholder={t('finance.modal.notes')} value={form.notes} onChange={e => setForm(s => ({...s, notes: e.target.value}))} className="w-full p-3 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600"/>
                    <button onClick={handleSave} className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-opacity-90">{['borrowing', 'lending'].includes(modal) ? t('finance.modal.addRecord') : t('finance.modal.saveChanges')}</button>
                </div>
            </Modal>
             <Modal isOpen={modal === 'repayment' || modal === 'return'} onClose={() => openModal('none')} title={t(modal === 'repayment' ? 'finance.modal.logRepayment' : 'finance.modal.logReturn')}>
                <div className="space-y-4">
                    <input type="number" placeholder={t(modal === 'repayment' ? 'finance.modal.repaymentAmount' : 'finance.modal.returnAmount')} value={form.amount} onChange={e => setForm(s => ({...s, amount: e.target.value}))} className="w-full p-3 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600"/>
                    <input type="date" value={form.date} onChange={e => setForm(s => ({...s, date: e.target.value}))} className="w-full p-3 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600"/>
                    <button onClick={handleSave} className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-opacity-90">{t('finance.modal.log')}</button>
                </div>
            </Modal>
            {/* Delete Confirmation Modal */}
            <Modal isOpen={modal === 'delete_borrowing' || modal === 'delete_lending'} onClose={() => openModal('none')} title={t('finance.modal.deleteTitle')}>
                <p className="text-light-text-secondary dark:text-text-secondary">{t('finance.modal.deleteConfirm')}</p>
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={() => openModal('none')} className="px-4 py-2 bg-slate-200 dark:bg-zinc-700 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-zinc-600">{t('tasks.deleteModal.cancel')}</button>
                    <button onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600">{t('tasks.deleteModal.confirm')}</button>
                </div>
            </Modal>
        </div>
    );
};

const CircularProgress: React.FC<{ percentage: number, size?: number, strokeWidth?: number }> = ({ percentage, size = 100, strokeWidth = 10 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            <circle
                className="text-slate-200 dark:text-zinc-700"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                fill="transparent"
                r={radius}
                cx={size / 2}
                cy={size / 2}
            />
            <circle
                className="text-primary transition-all duration-500"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                fill="transparent"
                r={radius}
                cx={size / 2}
                cy={size / 2}
            />
        </svg>
    );
};

const SavingsGoalCard: React.FC<{
    goal: SavingsGoal;
    currencySymbol: string;
    onAddDeposit: () => void;
    onWithdraw: () => void;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ goal, currencySymbol, onAddDeposit, onWithdraw, onEdit, onDelete }) => {
    const { t } = useTranslation();
    const percentage = goal.targetAmount > 0 ? Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100) : 100;
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    useOnClickOutside(menuRef, () => setMenuOpen(false));

    return (
        <Card className="flex flex-col justify-between">
            <div className="relative">
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-light-text-primary dark:text-text-primary pr-8">{goal.title}</h3>
                    <div className="relative" ref={menuRef}>
                        <button onClick={() => setMenuOpen(prev => !prev)} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 text-light-text-secondary dark:text-text-secondary">
                            <HiEllipsisVertical className="h-5 w-5" />
                        </button>
                        <AnimatePresence>
                            {menuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className="absolute top-8 right-0 w-44 bg-light-surface dark:bg-surface rounded-lg shadow-xl border border-slate-200 dark:border-zinc-700 z-10 p-1.5 space-y-1"
                                >
                                    <button onClick={() => { onAddDeposit(); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700/50">
                                        <HiPlus className="h-3.5 w-3.5 text-green-500" /> {t('finance.savingsPage.addDeposit')}
                                    </button>
                                    <button onClick={() => { onWithdraw(); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700/50">
                                        <HiOutlineReceiptRefund className="h-3.5 w-3.5 text-orange-500" /> {t('finance.modal.withdraw')}
                                    </button>
                                    <button onClick={() => { onEdit(); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700/50">
                                        <HiPencil className="h-3.5 w-3.5" /> {t('finance.modal.actions.edit')}
                                    </button>
                                    <div className="h-px bg-slate-200 dark:bg-zinc-700 my-1"></div>
                                    <button onClick={() => { onDelete(); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md text-red-500 hover:bg-red-500/10">
                                        <HiTrash className="h-3.5 w-3.5" /> {t('finance.modal.actions.delete')}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="relative my-6 flex items-center justify-center">
                    <CircularProgress percentage={percentage} size={120} strokeWidth={12} />
                    <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-primary">{percentage}%</span>
                    </div>
                </div>

                <div className="text-center space-y-2">
                    <p className="text-sm text-light-text-secondary dark:text-text-secondary">
                        {t('finance.savingsPage.saved')}: <span className="font-semibold text-light-text-primary dark:text-text-primary">{currencySymbol}{goal.currentAmount.toLocaleString()}</span> / {currencySymbol}{goal.targetAmount.toLocaleString()}
                    </p>
                    <p className="text-sm font-semibold text-teal">
                        {t('finance.savingsPage.remaining')}: {currencySymbol}{remaining.toLocaleString()}
                    </p>
                    {goal.deadlineDate && (
                        <p className="text-xs text-light-text-secondary dark:text-text-secondary">
                            {t('finance.modal.deadline')}: {new Date(goal.deadlineDate).toLocaleDateString()}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-zinc-750">
                    <button 
                        onClick={onAddDeposit}
                        className="w-full py-1.5 px-2 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors"
                    >
                        <HiPlus className="h-3.5 w-3.5" /> {t('finance.savingsPage.addDeposit')}
                    </button>
                    <button 
                        onClick={onWithdraw}
                        className="w-full py-1.5 px-2 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors"
                    >
                        <HiOutlineReceiptRefund className="h-3.5 w-3.5" /> {t('finance.modal.withdraw')}
                    </button>
                </div>
            </div>
        </Card>
    );
};

const CreateGoalCard: React.FC<{ onClick: () => void }> = ({ onClick }) => {
    const { t } = useTranslation();
    return (
        <Card className="!p-0">
            <button
                onClick={onClick}
                className="w-full h-full min-h-[280px] flex flex-col items-center justify-center text-center p-6 text-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors rounded-2xl"
            >
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-primary flex items-center justify-center mb-4">
                    <HiPlus className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold">{t('finance.savingsPage.createGoal')}</h3>
                <p className="text-sm text-light-text-secondary dark:text-text-secondary mt-1">{t('finance.savingsPage.goalDescription')}</p>
            </button>
        </Card>
    );
};

const SavingsView: React.FC<{ 
    currencySymbol: string;
    triggerAction?: { type: 'goal'; timestamp: number } | null;
}> = ({ currencySymbol, triggerAction }) => {
    const { savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, addSavingsDeposit, withdrawSavingsDeposit } = useAppContext();
    const { t } = useTranslation();
    const [modal, setModal] = useState<{type: ModalType | 'withdraw', goal: SavingsGoal | null}>({ type: 'none', goal: null });
    const [form, setForm] = useState({ title: '', targetAmount: '', initialDeposit: '', currentAmount: '', deadlineDate: '' });
    const [depositAmount, setDepositAmount] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');

    const openModal = useCallback((type: ModalType | 'withdraw', goal: SavingsGoal | null = null) => {
        setModal({ type: type as any, goal });

        if ((type === 'savings_goal' || type === 'edit_goal') && goal) {
            setForm({
                title: goal.title,
                targetAmount: goal.targetAmount.toString(),
                initialDeposit: '',
                currentAmount: goal.currentAmount.toString(),
                deadlineDate: goal.deadlineDate ? new Date(goal.deadlineDate).toISOString().split('T')[0] : ''
            });
        } else {
             setForm({ title: '', targetAmount: '', initialDeposit: '', currentAmount: '', deadlineDate: '' });
        }
       
        setDepositAmount('');
        setWithdrawAmount('');
    }, []);

    useEffect(() => {
        if (triggerAction && triggerAction.type === 'goal') {
            openModal('savings_goal');
        }
    }, [triggerAction, openModal]);

    const handleSaveGoal = () => {
        if (!form.title || !form.targetAmount) { toast.error(t('finance.modal.fillFieldsError')); return; }
        
        if (modal.type === 'edit_goal' && modal.goal) {
            const updatedGoal: SavingsGoal = {
                ...modal.goal,
                title: form.title,
                targetAmount: parseFloat(form.targetAmount),
                currentAmount: form.currentAmount !== '' ? parseFloat(form.currentAmount) : modal.goal.currentAmount,
                deadlineDate: form.deadlineDate || undefined,
            };
            updateSavingsGoal(updatedGoal);
            toast.success(t('finance.modal.goalUpdated'));
        } else {
             addSavingsGoal({
                title: form.title,
                targetAmount: parseFloat(form.targetAmount),
                startDate: new Date().toISOString(),
                initialDeposit: form.initialDeposit ? parseFloat(form.initialDeposit) : 0,
                deadlineDate: form.deadlineDate
            });
            toast.success(t('finance.modal.goalAdded'));
        }
        openModal('none');
    };

    const handleSaveDeposit = () => {
        if (modal.goal && depositAmount) {
            const amount = parseFloat(depositAmount);
            if (amount <= 0 || isNaN(amount)) {
                toast.error(t('finance.modal.fillFieldsError'));
                return;
            }
            addSavingsDeposit(modal.goal.id, amount);
            toast.success(t('finance.modal.depositAdded'));
            openModal('none');
        }
    };

    const handleWithdraw = () => {
        if (modal.goal && withdrawAmount) {
            const amount = parseFloat(withdrawAmount);
            if (amount <= 0 || isNaN(amount)) {
                toast.error(t('finance.modal.fillFieldsError'));
                return;
            }
            if (amount > modal.goal.currentAmount) {
                toast.error("Withdrawal amount cannot exceed current saved amount.");
                return;
            }
            withdrawSavingsDeposit(modal.goal.id, amount);
            toast.success(t('finance.modal.depositWithdrawn'));
            openModal('none');
        }
    };
    
    const handleDeleteGoal = () => {
        if(modal.goal) {
            deleteSavingsGoal(modal.goal.id);
            toast.success(t('finance.modal.goalDeleted'));
            openModal('none');
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <AnimatePresence>
                     {savingsGoals.map(goal => (
                        <motion.div key={goal.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                            <SavingsGoalCard
                                goal={goal}
                                currencySymbol={currencySymbol}
                                onAddDeposit={() => openModal('deposit', goal)}
                                onWithdraw={() => openModal('withdraw', goal)}
                                onEdit={() => openModal('edit_goal', goal)}
                                onDelete={() => openModal('delete_goal', goal)}
                            />
                        </motion.div>
                     ))}
                 </AnimatePresence>
                 <CreateGoalCard onClick={() => openModal('savings_goal')} />
            </div>

            {/* Add / Edit Goal Modal */}
            <Modal isOpen={modal.type === 'savings_goal' || modal.type === 'edit_goal'} onClose={() => openModal('none')} title={t(modal.type === 'edit_goal' ? 'finance.modal.editGoal' : 'finance.modal.addGoal')}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1">{t('finance.modal.goalTitle')}</label>
                        <input type="text" placeholder={t('finance.modal.goalTitle')} value={form.title} onChange={e => setForm(s => ({...s, title: e.target.value}))} className="w-full p-2.5 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600"/>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1">{t('finance.modal.targetAmount')}</label>
                            <input type="number" placeholder="0.00" value={form.targetAmount} onChange={e => setForm(s => ({...s, targetAmount: e.target.value}))} className="w-full p-2.5 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600"/>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1">{t('finance.modal.deadline')}</label>
                            <input type="date" value={form.deadlineDate} onChange={e => setForm(s => ({...s, deadlineDate: e.target.value}))} className="w-full p-2.5 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600"/>
                        </div>
                    </div>

                    {modal.type === 'savings_goal' && (
                        <div>
                            <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1">{t('finance.modal.initialDeposit')}</label>
                            <input type="number" placeholder="0.00" value={form.initialDeposit} onChange={e => setForm(s => ({...s, initialDeposit: e.target.value}))} className="w-full p-2.5 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600"/>
                        </div>
                    )}

                    {modal.type === 'edit_goal' && (
                        <div>
                            <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1">Current Saved Amount (Balance Adjustment)</label>
                            <input type="number" placeholder="0.00" value={form.currentAmount} onChange={e => setForm(s => ({...s, currentAmount: e.target.value}))} className="w-full p-2.5 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600"/>
                        </div>
                    )}

                    <button onClick={handleSaveGoal} className="w-full py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-opacity-90 transition-colors">
                        {t(modal.type === 'edit_goal' ? 'finance.modal.saveChanges' : 'finance.modal.addRecord')}
                    </button>
                </div>
            </Modal>
            
            {/* Add Deposit Modal */}
            <Modal isOpen={modal.type === 'deposit'} onClose={() => openModal('none')} title={t('finance.modal.addDeposit', { goalName: modal.goal?.title })}>
                 <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1">{t('finance.modal.depositAmount')}</label>
                        <input type="number" placeholder="0.00" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} className="w-full p-2.5 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600"/>
                    </div>
                    <button onClick={handleSaveDeposit} className="w-full py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-opacity-90 transition-colors">{t('finance.savingsPage.addDeposit')}</button>
                </div>
            </Modal>

            {/* Withdraw Modal */}
            <Modal isOpen={modal.type === 'withdraw'} onClose={() => openModal('none')} title={t('finance.modal.withdrawDeposit', { goalName: modal.goal?.title || '' })}>
                 <div className="space-y-4">
                    <p className="text-xs text-light-text-secondary dark:text-text-secondary">
                        Available saved balance: <span className="font-semibold text-light-text-primary dark:text-text-primary">{currencySymbol}{modal.goal?.currentAmount.toFixed(2) || '0.00'}</span>
                    </p>
                    <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1">{t('finance.modal.withdrawAmount')}</label>
                        <input type="number" placeholder="0.00" max={modal.goal?.currentAmount || 0} value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} className="w-full p-2.5 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-slate-600"/>
                    </div>
                    <button onClick={handleWithdraw} className="w-full py-2.5 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors">{t('finance.modal.withdraw')}</button>
                </div>
            </Modal>

            {/* Delete Goal Confirmation Modal */}
            <Modal isOpen={modal.type === 'delete_goal'} onClose={() => openModal('none')} title={t('finance.modal.deleteGoal')}>
                 <div className="space-y-6">
                    <p className="text-light-text-secondary dark:text-text-secondary">{t('finance.modal.deleteGoalConfirm', { goalName: modal.goal?.title || '' })}</p>
                    <div className="flex justify-end gap-4">
                        <button onClick={() => openModal('none')} className="px-4 py-2 bg-slate-200 dark:bg-zinc-700 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-zinc-600 text-sm">{t('tasks.deleteModal.cancel')}</button>
                        <button onClick={handleDeleteGoal} className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 text-sm">{t('tasks.deleteModal.confirm')}</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};


// --- SHARED ITEMS & MODALS --- //

const SavingsGoalItem: React.FC<{ goal: SavingsGoal, currencySymbol: string, onAddDeposit?: () => void }> = ({ goal, currencySymbol, onAddDeposit }) => {
    const { t } = useTranslation();
    const percentage = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-sm">{goal.title}</span>
                <span className="font-bold text-sm text-primary">{percentage}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-zinc-700 rounded-full h-2.5">
                <div className="bg-primary h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
            </div>
            <div className="flex justify-between text-xs mt-1 text-light-text-secondary dark:text-text-secondary">
                <span>{currencySymbol}{goal.currentAmount.toFixed(0)}</span>
                <span>{t('finance.savingsPage.of')} {currencySymbol}{goal.targetAmount.toFixed(0)}</span>
            </div>
             {onAddDeposit && (
                <button onClick={onAddDeposit} className="w-full mt-3 text-sm py-2 bg-primary/10 text-primary font-semibold rounded-lg hover:bg-primary/20 transition-colors">{t('finance.savingsPage.addDeposit')}</button>
             )}
        </div>
    );
}

export default FinancePage;
