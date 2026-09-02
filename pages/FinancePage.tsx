import React, { useState, useMemo, useCallback, useRef, useEffect, RefObject } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import PageHeader from '../components/ui/PageHeader';
import { Transaction, TransactionType, Bill, BillCategory, Borrowing, Lending, SavingsGoal, Repayment, Return } from '../types';
import { 
    HiPlus, 
    HiPencil, 
    HiTrash, 
    HiChevronLeft, 
    HiChevronRight, 
    HiOutlineArrowTrendingUp, 
    HiOutlineArrowTrendingDown, 
    HiOutlineBanknotes, 
    HiOutlineScale, 
    HiOutlineReceiptRefund, 
    HiOutlineWifi, 
    HiOutlineHome, 
    HiOutlineCreditCard, 
    HiOutlineQuestionMarkCircle, 
    HiOutlineMagnifyingGlass, 
    HiOutlineChevronUpDown, 
    HiOutlinePresentationChartBar, 
    HiOutlineClipboardDocumentList, 
    HiOutlineArrowsRightLeft, 
    HiOutlineFlag, 
    HiOutlineTrophy, 
    HiOutlinePlusCircle, 
    HiEllipsisVertical,
    HiOutlineArrowUpRight,
    HiOutlineArrowDownLeft,
    HiOutlineXMark,
    HiOutlineFunnel,
    HiOutlineCheck,
    HiOutlineCalendarDays
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from '../hooks/useTranslation';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

import SpeedDialFAB, { SpeedDialAction } from '../components/ui/SpeedDialFAB';
import CategoryChipPicker from '../components/finance/CategoryChipPicker';
import FamilyMemberPicker from '../components/finance/FamilyMemberPicker';
import CategoryBadge from '../components/finance/CategoryBadge';
import MemberSpendingChart from '../components/finance/MemberSpendingChart';
import { getCategoryIcon } from '../utils/categoryIcons';

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
            {/* Header: Title & Month Switch on the same line */}
            <div className="flex items-center justify-between gap-3">
                <div className="text-left min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-light-text-primary dark:text-text-primary truncate">
                        {t('finance.title')}
                    </h1>
                </div>
                {activeView !== 'bills' && (
                    <div className="flex items-center justify-center bg-light-surface dark:bg-surface rounded-xl px-2 py-1 gap-0.5 shrink-0 border border-slate-200 dark:border-zinc-700 shadow-2xs">
                        <button
                            onClick={() => changeMonth(-1)}
                            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary transition-colors"
                            aria-label="Previous month"
                        >
                            <HiChevronLeft className="h-4 w-4" />
                        </button>

                        <h2 className="text-xs sm:text-sm font-semibold px-2 text-center whitespace-nowrap text-light-text-primary dark:text-text-primary">
                            {currentDate.toLocaleString(language, { month: 'short', year: 'numeric' })}
                        </h2>

                        <button
                            onClick={() => changeMonth(1)}
                            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary transition-colors"
                            aria-label="Next month"
                        >
                            <HiChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>

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
    const { theme, transactions, borrowings, lendings, savingsGoals, familyMembers } = useAppContext();
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {summaryCards.map(card => (
                    <Card key={card.title} className="!p-3 sm:!p-4 text-center">
                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mx-auto mb-1.5 sm:mb-2 ${card.bgColor}`}>
                            <card.icon className={`h-5 w-5 ${card.color}`} />
                        </div>
                        <p className={`text-base sm:text-lg font-bold ${card.color}`}>{card.value}</p>
                        <p className="text-xs text-light-text-secondary dark:text-text-secondary">{card.title}</p>
                    </Card>
                ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                     <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-light-text-primary dark:text-text-primary">{t('finance.chartTitle')}</h2>
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
                        <h3 className="text-base sm:text-lg font-bold mb-2 text-light-text-primary dark:text-text-primary">{t('finance.borrowingSummary.title')}</h3>
                        <div className="space-y-2">
                            <div>
                                <p className="text-xs sm:text-sm text-light-text-secondary dark:text-text-secondary">{t('finance.borrowingSummary.youOwe')}</p>
                                <p className="text-base sm:text-lg font-bold text-expense">{currencySymbol}{debtSummary.totalOwed.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm text-light-text-secondary dark:text-text-secondary">{t('finance.borrowingSummary.owedToYou')}</p>
                                <p className="text-base sm:text-lg font-bold text-income">{currencySymbol}{debtSummary.totalOwedToYou.toFixed(2)}</p>
                            </div>
                        </div>
                    </Card>
                     <Card>
                        <h3 className="text-base sm:text-lg font-bold mb-2 text-light-text-primary dark:text-text-primary">{t('finance.savingsSummary.title')}</h3>
                        <div className="space-y-3">
                            {savingsGoals.slice(0, 2).map(goal => <SavingsGoalItem key={goal.id} goal={goal} currencySymbol={currencySymbol} />)}
                             {savingsGoals.length === 0 && <p className="text-xs sm:text-sm text-center text-light-text-secondary dark:text-text-secondary py-2">{t('finance.savingsSummary.noGoals')}</p>}
                        </div>
                    </Card>
                </div>
            </div>
            
            {/* By Person Spending Breakdown */}
            <MemberSpendingChart
                transactions={transactions}
                familyMembers={familyMembers}
                currentDate={currentDate}
                currencySymbol={currencySymbol}
                theme={theme}
            />
        </div>
    );
};

const TransactionsView: React.FC<{ 
    currentDate: Date; 
    currencySymbol: string;
    triggerAction?: { type: 'income' | 'expense'; timestamp: number } | null;
}> = ({ currentDate, currencySymbol, triggerAction }) => {
    const { 
        transactions, 
        addTransaction, 
        updateTransaction, 
        deleteTransaction,
        transactionCategories,
        addTransactionCategory,
        familyMembers
    } = useAppContext();
    const { t } = useTranslation();
    const [isTransactionModalOpen, setTransactionModalOpen] = useState(false);
    const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.INCOME);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [categoryId, setCategoryId] = useState<string>(transactionCategories[0]?.id || 'cat-other');
    const [memberId, setMemberId] = useState<string | undefined>(undefined);
    const [date, setDate] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
    const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all');
    const [isFilterDropdownOpen, setFilterDropdownOpen] = useState(false);
    const filterDropdownRef = useRef<HTMLDivElement>(null);
    useOnClickOutside(filterDropdownRef, () => setFilterDropdownOpen(false));

    const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction | 'description'; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
    const [isSortOpen, setSortOpen] = useState(false);
    const sortRef = useRef<HTMLDivElement>(null);
    useOnClickOutside(sortRef, () => setSortOpen(false));

    const resetTransactionForm = useCallback(() => {
        setDescription(''); 
        setAmount(''); 
        setCategoryId(transactionCategories[0]?.id || 'cat-other');
        setMemberId(undefined);
        setEditingTransaction(null);
        setDate(new Date().toISOString().split('T')[0]);
    }, [transactionCategories]);

    const handleOpenTransactionModal = useCallback((type: TransactionType, transaction: Transaction | null = null) => {
        setTransactionType(type);
        if (transaction) {
            setEditingTransaction(transaction);
            setDescription(transaction.description);
            setAmount(transaction.amount.toString());
            const matchedCat = transaction.categoryId || transactionCategories.find(c => c.name.toLowerCase() === transaction.category?.toLowerCase())?.id || transactionCategories[0]?.id || 'cat-other';
            setCategoryId(matchedCat);
            setMemberId(transaction.memberId);
            setDate(new Date(transaction.date).toISOString().split('T')[0]);
        } else {
            resetTransactionForm();
        }
        setTransactionModalOpen(true);
    }, [resetTransactionForm, transactionCategories]);

    const handleRowClick = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setDetailsModalOpen(true);
    };

    const handleEditFromDetails = () => {
        if (!selectedTransaction) return;
        setDetailsModalOpen(false);
        handleOpenTransactionModal(selectedTransaction.type, selectedTransaction);
    };

    const handleDeleteFromDetails = () => {
        if (!selectedTransaction) return;
        deleteTransaction(selectedTransaction.id);
        setDetailsModalOpen(false);
        setSelectedTransaction(null);
        toast.success(t('finance.modal.transactionDeleted') || 'Transaction deleted');
    };

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
        if (description && amount && categoryId && date) {
            const selectedCatObj = transactionCategories.find(c => c.id === categoryId);
            const categoryName = selectedCatObj?.name || 'Other';

            const transactionData = {
                description,
                amount: parseFloat(amount),
                type: transactionType,
                category: categoryName,
                categoryId: categoryId,
                memberId: memberId || undefined,
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

    const monthlyTransactions = useMemo(() => {
        return transactions.filter(t => 
            new Date(t.date).getFullYear() === currentDate.getFullYear() && 
            new Date(t.date).getMonth() === currentDate.getMonth()
        );
    }, [transactions, currentDate]);

    const filteredAndSortedTransactions = useMemo(() => {
        const searchedTransactions = monthlyTransactions.filter(t => {
            const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                (t.category && t.category.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesCategory = selectedCategoryFilter === 'all' || 
                t.categoryId === selectedCategoryFilter || 
                t.category === selectedCategoryFilter;
            const matchesType = typeFilter === 'all' || t.type === typeFilter;
            const matchesMember = selectedMemberFilter === 'all' || 
                (selectedMemberFilter === 'household' ? !t.memberId : t.memberId === selectedMemberFilter);
            return matchesSearch && matchesCategory && matchesType && matchesMember;
        });

        return [...searchedTransactions].sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [monthlyTransactions, searchQuery, selectedCategoryFilter, typeFilter, selectedMemberFilter, sortConfig]);

    // Active filter counter for badge
    const activeFilterCount = (typeFilter !== 'all' ? 1 : 0) + 
        (selectedCategoryFilter !== 'all' ? 1 : 0) + 
        (selectedMemberFilter !== 'all' ? 1 : 0);

    // Aggregate filtered totals
    const filteredMetrics = useMemo(() => {
        let totalIncome = 0;
        let totalExpense = 0;
        filteredAndSortedTransactions.forEach(t => {
            if (t.type === 'income') totalIncome += t.amount;
            else totalExpense += t.amount;
        });
        return {
            totalIncome,
            totalExpense,
            net: totalIncome - totalExpense
        };
    }, [filteredAndSortedTransactions]);

    const isFiltered = searchQuery !== '' || activeFilterCount > 0;

    return (
        <Card>
            {/* Top Quick Actions */}
            <div className="grid grid-cols-2 gap-3 mb-5">
                <button 
                    onClick={() => handleOpenTransactionModal(TransactionType.INCOME)} 
                    className="p-3 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center text-xs sm:text-sm font-semibold transition-all shadow-xs active:scale-[0.98]"
                >
                    <HiOutlineArrowUpRight className="h-4 w-4 mr-2 text-emerald-500 stroke-[2.5]" />
                    {t('finance.addIncome')}
                </button>
                <button 
                    onClick={() => handleOpenTransactionModal(TransactionType.EXPENSE)} 
                    className="p-3 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center text-xs sm:text-sm font-semibold transition-all shadow-xs active:scale-[0.98]"
                >
                    <HiOutlineArrowDownLeft className="h-4 w-4 mr-2 text-rose-500 stroke-[2.5]" />
                    {t('finance.addExpense')}
                </button>
            </div>

            <div className="space-y-4">
                {/* Search Bar with integrated Filter Button + Sort Menu */}
                <div className="flex gap-2">
                    {/* Search Field with Integrated Filter Button */}
                    <div className="relative flex-grow flex items-center">
                        <HiOutlineMagnifyingGlass className="absolute left-3.5 h-4 w-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                        <input 
                            type="text" 
                            placeholder={t('finance.searchPlaceholder')} 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            className="w-full h-10 pl-10 pr-20 border rounded-xl bg-slate-50/80 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700 focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary text-xs sm:text-sm text-light-text-primary dark:text-text-primary placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-all"
                        />
                        <div className="absolute right-1.5 flex items-center gap-1">
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-full"
                                >
                                    <HiOutlineXMark className="h-3.5 w-3.5" />
                                </button>
                            )}

                            {/* Filter Button at the end of Search Bar */}
                            <div className="relative" ref={filterDropdownRef}>
                                <button
                                    onClick={() => setFilterDropdownOpen(!isFilterDropdownOpen)}
                                    className={`h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-all ${
                                        activeFilterCount > 0 
                                            ? 'bg-primary text-white shadow-xs' 
                                            : isFilterDropdownOpen
                                                ? 'bg-slate-200 dark:bg-zinc-700 text-light-text-primary dark:text-white'
                                                : 'bg-white dark:bg-zinc-700 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-600 hover:bg-slate-100 dark:hover:bg-zinc-600'
                                    }`}
                                    title="Filter options"
                                >
                                    <HiOutlineFunnel className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Filter</span>
                                    {activeFilterCount > 0 && (
                                        <span className="w-4 h-4 rounded-full bg-white text-primary text-[10px] font-bold flex items-center justify-center leading-none">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </button>

                                {/* Comprehensive Filter Popover Dropdown */}
                                <AnimatePresence>
                                    {isFilterDropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 4 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 4 }}
                                            className="absolute z-30 top-full mt-2 right-[-116px] w-[calc(100vw-3.5rem)] max-w-xs sm:w-80 bg-light-surface dark:bg-zinc-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-700 p-3.5 sm:p-4 text-xs space-y-4 max-h-[75vh] overflow-y-auto"
                                        >
                                            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-zinc-700">
                                                <div className="flex items-center gap-2 font-bold text-sm text-light-text-primary dark:text-text-primary">
                                                    <HiOutlineFunnel className="w-4 h-4 text-primary" />
                                                    <span>Filters</span>
                                                </div>
                                                {activeFilterCount > 0 && (
                                                    <button
                                                        onClick={() => {
                                                            setTypeFilter('all');
                                                            setSelectedCategoryFilter('all');
                                                            setSelectedMemberFilter('all');
                                                        }}
                                                        className="text-xs font-semibold text-primary hover:underline"
                                                    >
                                                        Reset All
                                                    </button>
                                                )}
                                            </div>

                                            {/* Transaction Type Filter */}
                                            <div className="space-y-1.5">
                                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                                                    Type
                                                </label>
                                                <div className="grid grid-cols-3 gap-1.5">
                                                    <button
                                                        onClick={() => setTypeFilter('all')}
                                                        className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                                                            typeFilter === 'all'
                                                                ? 'bg-primary text-white border-primary shadow-xs font-semibold'
                                                                : 'bg-slate-50 dark:bg-zinc-700/50 border-slate-200 dark:border-zinc-600 text-slate-600 dark:text-zinc-300 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        All
                                                    </button>
                                                    <button
                                                        onClick={() => setTypeFilter('income')}
                                                        className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                                                            typeFilter === 'income'
                                                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs font-semibold'
                                                                : 'bg-slate-50 dark:bg-zinc-700/50 border-slate-200 dark:border-zinc-600 text-slate-600 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                                        }`}
                                                    >
                                                        Income
                                                    </button>
                                                    <button
                                                        onClick={() => setTypeFilter('expense')}
                                                        className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                                                            typeFilter === 'expense'
                                                                ? 'bg-rose-500 text-white border-rose-500 shadow-xs font-semibold'
                                                                : 'bg-slate-50 dark:bg-zinc-700/50 border-slate-200 dark:border-zinc-600 text-slate-600 dark:text-zinc-300 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                                                        }`}
                                                    >
                                                        Expense
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Categories Filter */}
                                            <div className="space-y-1.5">
                                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                                                    Category
                                                </label>
                                                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                                                    <button
                                                        onClick={() => setSelectedCategoryFilter('all')}
                                                        className={`py-1.5 px-2 rounded-lg text-left text-xs font-medium border transition-all flex items-center justify-between ${
                                                            selectedCategoryFilter === 'all'
                                                                ? 'bg-primary/10 border-primary text-primary font-semibold'
                                                                : 'bg-slate-50 dark:bg-zinc-700/50 border-slate-200 dark:border-zinc-600 text-slate-600 dark:text-zinc-300 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        <span>All Categories</span>
                                                        {selectedCategoryFilter === 'all' && <HiOutlineCheck className="w-3.5 h-3.5" />}
                                                    </button>
                                                    {transactionCategories.map(cat => {
                                                        const isSelected = selectedCategoryFilter === cat.id;
                                                        return (
                                                            <button
                                                                key={cat.id}
                                                                onClick={() => setSelectedCategoryFilter(cat.id)}
                                                                className={`py-1.5 px-2 rounded-lg text-left text-xs font-medium border transition-all flex items-center gap-1.5 justify-between ${
                                                                    isSelected
                                                                        ? 'bg-primary/10 border-primary text-primary font-semibold'
                                                                        : 'bg-slate-50 dark:bg-zinc-700/50 border-slate-200 dark:border-zinc-600 text-slate-600 dark:text-zinc-300 hover:bg-slate-100'
                                                                }`}
                                                            >
                                                                <span className="flex items-center gap-1.5 truncate">
                                                                    <span 
                                                                        className="w-2 h-2 rounded-full shrink-0" 
                                                                        style={{ backgroundColor: cat.color }} 
                                                                    />
                                                                    <span className="truncate">{cat.name}</span>
                                                                </span>
                                                                {isSelected && <HiOutlineCheck className="w-3.5 h-3.5 shrink-0" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Family Member Filter */}
                                            <div className="space-y-1.5">
                                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                                                    For Whom / Family Member
                                                </label>
                                                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                                                    <button
                                                        onClick={() => setSelectedMemberFilter('all')}
                                                        className={`py-1.5 px-2 rounded-lg text-left text-xs font-medium border transition-all flex items-center justify-between ${
                                                            selectedMemberFilter === 'all'
                                                                ? 'bg-primary/10 border-primary text-primary font-semibold'
                                                                : 'bg-slate-50 dark:bg-zinc-700/50 border-slate-200 dark:border-zinc-600 text-slate-600 dark:text-zinc-300 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        <span>Everyone</span>
                                                        {selectedMemberFilter === 'all' && <HiOutlineCheck className="w-3.5 h-3.5" />}
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedMemberFilter('household')}
                                                        className={`py-1.5 px-2 rounded-lg text-left text-xs font-medium border transition-all flex items-center justify-between ${
                                                            selectedMemberFilter === 'household'
                                                                ? 'bg-primary/10 border-primary text-primary font-semibold'
                                                                : 'bg-slate-50 dark:bg-zinc-700/50 border-slate-200 dark:border-zinc-600 text-slate-600 dark:text-zinc-300 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        <span>Shared / Household</span>
                                                        {selectedMemberFilter === 'household' && <HiOutlineCheck className="w-3.5 h-3.5" />}
                                                    </button>
                                                    {familyMembers.map(member => {
                                                        const isSelected = selectedMemberFilter === member.id;
                                                        return (
                                                            <button
                                                                key={member.id}
                                                                onClick={() => setSelectedMemberFilter(member.id)}
                                                                className={`py-1.5 px-2 rounded-lg text-left text-xs font-medium border transition-all flex items-center justify-between ${
                                                                    isSelected
                                                                        ? 'bg-primary/10 border-primary text-primary font-semibold'
                                                                        : 'bg-slate-50 dark:bg-zinc-700/50 border-slate-200 dark:border-zinc-600 text-slate-600 dark:text-zinc-300 hover:bg-slate-100'
                                                                }`}
                                                            >
                                                                <span className="flex items-center gap-1.5 truncate">
                                                                    <img 
                                                                        src={member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                                                                        alt={member.name}
                                                                        className="w-3.5 h-3.5 rounded-full object-cover shrink-0" 
                                                                    />
                                                                    <span className="truncate">{member.name}</span>
                                                                </span>
                                                                {isSelected && <HiOutlineCheck className="w-3.5 h-3.5 shrink-0" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setFilterDropdownOpen(false)}
                                                className="w-full py-2 bg-primary text-white font-semibold rounded-xl text-xs hover:bg-opacity-90 transition-opacity"
                                            >
                                                Apply Filters
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* Sort Menu Button */}
                    <div className="relative shrink-0" ref={sortRef}>
                        <button 
                            onClick={() => setSortOpen(!isSortOpen)} 
                            className={`h-10 px-3 flex items-center gap-1.5 border rounded-xl bg-slate-50/80 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700 text-xs font-medium transition-all ${isSortOpen ? 'border-primary ring-2 ring-primary/20' : 'hover:bg-slate-100 dark:hover:bg-zinc-700/50'}`}
                        >
                            <HiOutlineChevronUpDown className="h-4 w-4 text-slate-500 dark:text-zinc-400" />
                            <span className="capitalize hidden sm:inline text-light-text-secondary dark:text-text-secondary">
                                {t(`finance.sort.${sortConfig.key}`)}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10">
                                {sortConfig.direction}
                            </span>
                        </button>

                        <AnimatePresence>
                            {isSortOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95, y: 4 }} 
                                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                                    exit={{ opacity: 0, scale: 0.95, y: 4 }} 
                                    className="absolute z-20 top-full mt-1.5 w-48 right-0 bg-light-surface dark:bg-zinc-800 rounded-xl shadow-xl border border-slate-200 dark:border-zinc-700 p-1.5 text-xs"
                                >
                                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                                        {t('finance.sortBy')}
                                    </div>
                                    {(['date', 'description', 'amount', 'category'] as const).map(key => {
                                        const isSelected = sortConfig.key === key;
                                        return (
                                            <button 
                                                key={key} 
                                                onClick={() => handleSortChange(key)} 
                                                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg capitalize transition-colors ${isSelected ? 'bg-primary/10 text-primary font-semibold' : 'text-light-text-secondary dark:text-text-secondary hover:bg-slate-100 dark:hover:bg-zinc-700/60'}`}
                                            >
                                                <span>{t(`finance.sort.${key}`)}</span>
                                                {isSelected && <HiOutlineCheck className="h-3.5 w-3.5" />}
                                            </button>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Active Filter Indicators Bar */}
                {activeFilterCount > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap text-xs pt-0.5">
                        <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 mr-1">Active:</span>
                        {typeFilter !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-light-text-primary dark:text-text-primary border border-slate-200 dark:border-zinc-700 text-xs">
                                <span className="capitalize">{typeFilter}</span>
                                <button onClick={() => setTypeFilter('all')} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200">
                                    <HiOutlineXMark className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                        {selectedCategoryFilter !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-light-text-primary dark:text-text-primary border border-slate-200 dark:border-zinc-700 text-xs">
                                <span>{transactionCategories.find(c => c.id === selectedCategoryFilter)?.name || selectedCategoryFilter}</span>
                                <button onClick={() => setSelectedCategoryFilter('all')} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200">
                                    <HiOutlineXMark className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                        {selectedMemberFilter !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-light-text-primary dark:text-text-primary border border-slate-200 dark:border-zinc-700 text-xs">
                                <span>{selectedMemberFilter === 'household' ? 'Shared / Household' : familyMembers.find(m => m.id === selectedMemberFilter)?.name || 'Member'}</span>
                                <button onClick={() => setSelectedMemberFilter('all')} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200">
                                    <HiOutlineXMark className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                        <button
                            onClick={() => {
                                setTypeFilter('all');
                                setSelectedCategoryFilter('all');
                                setSelectedMemberFilter('all');
                            }}
                            className="text-xs text-primary font-semibold hover:underline ml-1"
                        >
                            Clear all
                        </button>
                    </div>
                )}

                {/* Filter Summary Strip */}
                {filteredAndSortedTransactions.length > 0 && (
                    <div className="flex items-center justify-between py-1 px-1 text-[11px] text-light-text-secondary dark:text-text-secondary border-b border-slate-100 dark:border-zinc-800/80 pb-2">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-light-text-primary dark:text-text-primary">{filteredAndSortedTransactions.length}</span>
                            <span>{filteredAndSortedTransactions.length === 1 ? 'transaction' : 'transactions'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            {filteredMetrics.totalIncome > 0 && (
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                    +{currencySymbol}{filteredMetrics.totalIncome.toFixed(2)}
                                </span>
                            )}
                            {filteredMetrics.totalExpense > 0 && (
                                <span className="text-rose-600 dark:text-rose-400 font-semibold">
                                    -{currencySymbol}{filteredMetrics.totalExpense.toFixed(2)}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Minimalist Transactions List - Only Name & Amount, Click to open details */}
                {filteredAndSortedTransactions.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-zinc-800/60 rounded-xl bg-slate-50/50 dark:bg-zinc-800/30 border border-slate-200/80 dark:border-zinc-700/60 overflow-hidden">
                        <AnimatePresence>
                            {filteredAndSortedTransactions.map((item) => {
                                const isIncome = item.type === 'income';

                                return (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => handleRowClick(item)}
                                        className="px-4 py-3.5 hover:bg-slate-100/80 dark:hover:bg-zinc-700/50 active:bg-slate-200/70 dark:active:bg-zinc-700 transition-colors flex items-center justify-between gap-3 cursor-pointer select-none group"
                                    >
                                        {/* Left Side: Name and Date only */}
                                        <div className="min-w-0 pr-2">
                                            <p className="font-semibold text-xs sm:text-sm text-light-text-primary dark:text-text-primary truncate group-hover:text-primary transition-colors">
                                                {item.description}
                                            </p>
                                            <p className="text-[11px] text-light-text-secondary dark:text-text-secondary mt-0.5">
                                                {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>

                                        {/* Right Side: Amount with +/- and currency */}
                                        <div className="text-right shrink-0 flex items-center gap-2">
                                            <span className={`font-bold text-xs sm:text-sm ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                {isIncome ? '+' : '-'}{currencySymbol}{item.amount.toFixed(2)}
                                            </span>
                                            <HiChevronRight className="w-4 h-4 text-slate-300 dark:text-zinc-600 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="py-12 px-4 text-center rounded-xl bg-slate-50/50 dark:bg-zinc-800/30 border border-dashed border-slate-200 dark:border-zinc-700/80">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3 text-slate-400 dark:text-zinc-500">
                            <HiOutlineBanknotes className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-semibold text-light-text-primary dark:text-text-primary mb-1">
                            {isFiltered ? 'No matching transactions' : t('finance.noTransactions')}
                        </h4>
                        <p className="text-xs text-light-text-secondary dark:text-text-secondary max-w-sm mx-auto mb-4">
                            {isFiltered 
                                ? 'Try adjusting your search query, type filter, category or family member filter.' 
                                : 'Start logging your family income and expenses to track your household budget.'
                            }
                        </p>
                        {isFiltered ? (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedCategoryFilter('all');
                                    setSelectedMemberFilter('all');
                                    setTypeFilter('all');
                                }}
                                className="px-3.5 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                            >
                                Clear all filters
                            </button>
                        ) : (
                            <div className="flex justify-center gap-2">
                                <button
                                    onClick={() => handleOpenTransactionModal(TransactionType.INCOME)}
                                    className="px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15 rounded-lg transition-colors"
                                >
                                    + {t('finance.addIncome')}
                                </button>
                                <button
                                    onClick={() => handleOpenTransactionModal(TransactionType.EXPENSE)}
                                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/15 rounded-lg transition-colors"
                                >
                                    + {t('finance.addExpense')}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Transaction Details Popup (Click to view full category & member info, edit or delete) */}
            <Modal 
                isOpen={isDetailsModalOpen} 
                onClose={() => setDetailsModalOpen(false)} 
                title="Transaction Details"
            >
                {selectedTransaction && (() => {
                    const isIncome = selectedTransaction.type === 'income';
                    const catObj = transactionCategories.find(c => c.id === selectedTransaction.categoryId || c.name.toLowerCase() === selectedTransaction.category?.toLowerCase());
                    const assignedMember = familyMembers.find(m => m.id === selectedTransaction.memberId);
                    const IconComp = catObj ? getCategoryIcon(catObj.icon) : HiOutlineCreditCard;
                    const categoryColor = catObj?.color || '#64748b';

                    return (
                        <div className="space-y-5">
                            {/* Big Amount & Type Card */}
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/80 text-center space-y-1">
                                <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                    isIncome ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                }`}>
                                    {isIncome ? <HiOutlineArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" /> : <HiOutlineArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />}
                                    {selectedTransaction.type}
                                </span>
                                <h3 className={`text-2xl sm:text-3xl font-extrabold ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {isIncome ? '+' : '-'}{currencySymbol}{selectedTransaction.amount.toFixed(2)}
                                </h3>
                                <p className="font-medium text-sm text-light-text-primary dark:text-text-primary">
                                    {selectedTransaction.description}
                                </p>
                            </div>

                            {/* Details List (Category & For Whom displayed here) */}
                            <div className="space-y-3 bg-slate-50/50 dark:bg-zinc-800/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-zinc-700/60">
                                {/* Category */}
                                <div className="flex items-center justify-between py-1">
                                    <span className="text-xs text-light-text-secondary dark:text-text-secondary font-medium">Category</span>
                                    <div className="flex items-center gap-1.5">
                                        <div 
                                            className="w-5 h-5 rounded-md flex items-center justify-center text-white" 
                                            style={{ backgroundColor: categoryColor }}
                                        >
                                            <IconComp className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-xs font-semibold text-light-text-primary dark:text-text-primary">
                                            {catObj?.name || selectedTransaction.category || 'Other'}
                                        </span>
                                    </div>
                                </div>

                                {/* For Whom / Assigned Member */}
                                <div className="flex items-center justify-between py-1 border-t border-slate-200/40 dark:border-zinc-700/40">
                                    <span className="text-xs text-light-text-secondary dark:text-text-secondary font-medium">For Whom</span>
                                    {assignedMember ? (
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-700/60 border border-slate-200 dark:border-zinc-600">
                                            <img 
                                                src={assignedMember.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                                                alt={assignedMember.name} 
                                                className="w-4 h-4 rounded-full object-cover" 
                                            />
                                            <span className="text-xs font-semibold text-light-text-primary dark:text-text-primary">{assignedMember.name}</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-700/60 px-2 py-0.5 rounded-full border border-slate-200 dark:border-zinc-600">
                                            Shared / Whole Household
                                        </span>
                                    )}
                                </div>

                                {/* Date */}
                                <div className="flex items-center justify-between py-1 border-t border-slate-200/40 dark:border-zinc-700/40">
                                    <span className="text-xs text-light-text-secondary dark:text-text-secondary font-medium">Date</span>
                                    <span className="text-xs font-semibold text-light-text-primary dark:text-text-primary">
                                        {new Date(selectedTransaction.date).toLocaleDateString(undefined, { 
                                            weekday: 'short', 
                                            year: 'numeric', 
                                            month: 'short', 
                                            day: 'numeric' 
                                        })}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons: Edit and Delete */}
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={handleDeleteFromDetails}
                                    className="py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98]"
                                >
                                    <HiTrash className="w-4 h-4" />
                                    <span>Delete</span>
                                </button>
                                <button
                                    onClick={handleEditFromDetails}
                                    className="py-2.5 px-4 bg-primary text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 hover:bg-opacity-90 transition-opacity active:scale-[0.98] shadow-xs"
                                >
                                    <HiPencil className="w-4 h-4" />
                                    <span>Edit</span>
                                </button>
                            </div>
                        </div>
                    );
                })()}
            </Modal>

            {/* Add / Edit Transaction Modal */}
            <Modal isOpen={isTransactionModalOpen} onClose={() => setTransactionModalOpen(false)} title={editingTransaction ? t('finance.modal.edit' + (transactionType === 'income' ? 'Income' : 'Expense')) : t('finance.modal.add' + (transactionType === 'income' ? 'Income' : 'Expense'))}>
                <div className="space-y-4 py-1">
                    <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">
                            {t('finance.modal.description')} *
                        </label>
                        <input 
                            type="text" 
                            placeholder={transactionType === 'income' ? "e.g. Monthly Salary, Freelance project" : "e.g. Grocery shopping, Electricity bill"} 
                            value={description} 
                            onChange={e => setDescription(e.target.value)} 
                            className="w-full p-2.5 sm:p-3 text-sm border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-zinc-600 text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent" 
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">
                                {t('finance.modal.amount')} ({currencySymbol}) *
                            </label>
                            <input 
                                type="number" 
                                step="0.01" 
                                min="0"
                                placeholder="0.00" 
                                value={amount} 
                                onChange={e => setAmount(e.target.value)} 
                                className="w-full p-2.5 sm:p-3 text-sm border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-zinc-600 text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">
                                Date *
                            </label>
                            <input 
                                type="date" 
                                value={date} 
                                onChange={e => setDate(e.target.value)} 
                                className="w-full p-2.5 sm:p-3 text-sm border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-zinc-600 text-light-text-primary dark:text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent" 
                            />
                        </div>
                    </div>

                    {/* Category Chip Picker */}
                    <CategoryChipPicker
                        categories={transactionCategories}
                        selectedCategoryId={categoryId}
                        onSelect={setCategoryId}
                        onAddCategory={addTransactionCategory}
                    />

                    {/* Family Member Picker */}
                    <FamilyMemberPicker
                        members={familyMembers}
                        selectedMemberId={memberId}
                        onSelect={setMemberId}
                    />

                    <button 
                        onClick={handleSaveTransaction} 
                        className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-opacity-90 shadow-md active:scale-[0.99] transition-colors text-sm"
                    >
                        {editingTransaction ? t('finance.modal.saveChanges') : t('finance.modal.addRecord')}
                    </button>
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
    const { 
        bills, 
        addBill, 
        updateBill, 
        deleteBill,
        transactionCategories,
        addTransactionCategory,
        familyMembers
    } = useAppContext();
    const { t, language } = useTranslation();
    const [isBillModalOpen, setBillModalOpen] = useState(false);
    const [editingBill, setEditingBill] = useState<Bill | null>(null);
    const [deletingBill, setDeletingBill] = useState<Bill | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [billForm, setBillForm] = useState({ 
        name: '', 
        amount: '', 
        categoryId: transactionCategories[0]?.id || 'cat-utilities',
        category: 'Utilities',
        memberId: undefined as string | undefined,
        dueDate: '', 
        recurrence: 'monthly' as Bill['recurrence'],
        paid: false
    });

    const openBillModal = (bill?: Bill) => {
        if (bill) {
            setEditingBill(bill);
            const matchedCat = bill.categoryId || transactionCategories.find(c => c.name.toLowerCase() === bill.category?.toLowerCase())?.id || transactionCategories[0]?.id || 'cat-utilities';
            setBillForm({
                name: bill.name,
                amount: bill.amount.toString(),
                categoryId: matchedCat,
                category: bill.category,
                memberId: bill.memberId,
                dueDate: bill.dueDate.split('T')[0],
                recurrence: bill.recurrence,
                paid: bill.paid
            });
        } else {
            setEditingBill(null);
            setBillForm({ 
                name: '', 
                amount: '', 
                categoryId: transactionCategories[0]?.id || 'cat-utilities',
                category: 'Utilities',
                memberId: undefined,
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
            const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) || (b.category && b.category.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesCategory = selectedCategory === 'all' || b.categoryId === selectedCategory || b.category === selectedCategory;
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
        if(billForm.name && billForm.amount && billForm.dueDate && billForm.categoryId) {
            const catObj = transactionCategories.find(c => c.id === billForm.categoryId);
            const categoryName = catObj?.name || 'Utilities';

            if (editingBill) {
                updateBill({
                    ...editingBill,
                    name: billForm.name,
                    amount: parseFloat(billForm.amount),
                    category: categoryName,
                    categoryId: billForm.categoryId,
                    memberId: billForm.memberId,
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
                    category: categoryName,
                    categoryId: billForm.categoryId,
                    memberId: billForm.memberId,
                    dueDate: new Date(billForm.dueDate).toISOString(),
                    recurrence: billForm.recurrence
                });
                toast.success(t('finance.modal.billAdded'));
            }
            setBillModalOpen(false);
            setEditingBill(null);
            setBillForm({ 
                name: '', 
                amount: '', 
                categoryId: transactionCategories[0]?.id || 'cat-utilities', 
                category: 'Utilities',
                memberId: undefined, 
                dueDate: '', 
                recurrence: 'monthly', 
                paid: false 
            });
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
        
        const catObj = transactionCategories.find(c => c.id === bill.categoryId || c.name.toLowerCase() === bill.category?.toLowerCase());
        const assignedMember = familyMembers.find(m => m.id === bill.memberId);

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
            <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-3 sm:p-3.5 bg-light-background dark:bg-background rounded-xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2.5 sm:gap-3 border border-slate-100 dark:border-zinc-800">
                <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-xs sm:text-sm text-light-text-primary dark:text-text-primary">{bill.name}</p>
                        <CategoryBadge category={catObj} fallbackName={bill.category} />
                        {bill.recurrence !== 'none' && (
                            <span className="text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded bg-primary/10 text-primary capitalize font-medium">{bill.recurrence}</span>
                        )}
                        {assignedMember && (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-light-text-secondary dark:text-text-secondary border border-slate-200 dark:border-zinc-700">
                                <img 
                                    src={assignedMember.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                                    alt={assignedMember.name} 
                                    className="w-3.5 h-3.5 rounded-full object-cover" 
                                />
                                <span className="truncate max-w-[80px]">{assignedMember.name}</span>
                            </span>
                        )}
                    </div>
                    <p className={`text-[11px] sm:text-xs font-semibold mt-0.5 ${statusColor}`}>{statusText}</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 self-stretch sm:self-auto">
                    <p className="font-bold text-base sm:text-lg text-light-text-primary dark:text-text-primary">{currencySymbol}{bill.amount.toFixed(2)}</p>
                    
                    <div className="flex items-center gap-1.5">
                        <button 
                            onClick={() => handleTogglePaid(bill)} 
                            className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${bill.paid ? 'bg-slate-200 dark:bg-zinc-700 text-light-text-primary dark:text-text-primary hover:bg-slate-300' : 'bg-primary text-white hover:bg-primary/90'}`}
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
                                        className="absolute right-0 top-8 w-44 bg-light-surface dark:bg-surface rounded-lg shadow-xl border border-slate-200 dark:border-zinc-700 z-20 p-1.5 space-y-1 text-xs"
                                    >
                                        <button onClick={() => { openBillModal(bill); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 font-medium rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700/50">
                                            <HiPencil className="h-4 w-4" /> {t('finance.modal.actions.edit')}
                                        </button>
                                        <button onClick={() => { setDeletingBill(bill); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 font-medium rounded-md text-red-500 hover:bg-red-500/10">
                                            <HiTrash className="h-4 w-4" /> {t('finance.modal.actions.delete')}
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
                        className="w-full text-base sm:text-sm p-2 pl-9 border rounded-lg bg-light-background dark:bg-background border-slate-200 dark:border-zinc-700 focus:ring-1 focus:ring-primary"
                    />
                </div>
                <button onClick={() => openBillModal()} className="w-full sm:w-auto px-3.5 py-2 bg-primary text-white rounded-lg flex items-center justify-center text-xs sm:text-sm font-semibold hover:bg-opacity-90 transition-colors shrink-0">
                    <HiPlus className="h-4 w-4 mr-1.5"/>{t('finance.addRecurringBill')}
                </button>
            </div>

            {/* Category Chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1.5 rounded-full capitalize whitespace-nowrap font-medium transition-colors ${selectedCategory === 'all' ? 'bg-primary text-white' : 'bg-light-surface dark:bg-surface border border-slate-200 dark:border-zinc-700 text-light-text-secondary dark:text-text-secondary hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
                >
                    All Categories
                </button>
                {transactionCategories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-full capitalize whitespace-nowrap font-medium transition-colors ${selectedCategory === cat.id ? 'bg-primary text-white' : 'bg-light-surface dark:bg-surface border border-slate-200 dark:border-zinc-700 text-light-text-secondary dark:text-text-secondary hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            <Card>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-base sm:text-lg font-bold text-light-text-primary dark:text-text-primary">{t('finance.bills.upcoming')}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 font-semibold">{upcomingBills.length}</span>
                </div>
                {upcomingBills.length > 0 ? (
                    <div className="space-y-2"><AnimatePresence>{upcomingBills.map(b => <BillItem key={b.id} bill={b}/>)}</AnimatePresence></div>
                ) : (
                    <p className="text-center text-xs sm:text-sm text-light-text-secondary dark:text-text-secondary py-4">{t('finance.noBills')}</p>
                )}
            </Card>

            <Card>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-base sm:text-lg font-bold text-light-text-primary dark:text-text-primary">{t('finance.bills.paid')}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 font-semibold">{paidBills.length}</span>
                </div>
                {paidBills.length > 0 ? (
                    <div className="space-y-2"><AnimatePresence>{paidBills.map(b => <BillItem key={b.id} bill={b}/>)}</AnimatePresence></div>
                ) : (
                    <p className="text-center text-xs sm:text-sm text-light-text-secondary dark:text-text-secondary py-4">{t('finance.noPaidBills')}</p>
                )}
            </Card>

            {/* Add / Edit Bill Modal */}
            <Modal isOpen={isBillModalOpen} onClose={() => setBillModalOpen(false)} title={editingBill ? t('finance.modal.editBill') : t('finance.modal.addBill')}>
                <div className="space-y-4 py-1">
                    <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">
                            {t('finance.modal.billName')} *
                        </label>
                        <input 
                            type="text" 
                            placeholder="e.g. WiFi & Internet, Electricity, Rent" 
                            value={billForm.name} 
                            onChange={e => setBillForm(s => ({...s, name: e.target.value}))} 
                            className="w-full p-2.5 sm:p-3 text-sm border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-zinc-600 text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">
                                {t('finance.modal.amount')} ({currencySymbol}) *
                            </label>
                            <input 
                                type="number" 
                                step="0.01"
                                min="0"
                                placeholder="0.00" 
                                value={billForm.amount} 
                                onChange={e => setBillForm(s => ({...s, amount: e.target.value}))} 
                                className="w-full p-2.5 sm:p-3 text-sm border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-zinc-600 text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">
                                {t('finance.modal.dueDate')} *
                            </label>
                            <input 
                                type="date" 
                                value={billForm.dueDate} 
                                onChange={e => setBillForm(s => ({...s, dueDate: e.target.value}))} 
                                className="w-full p-2.5 sm:p-3 text-sm border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-zinc-600 text-light-text-primary dark:text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                    </div>
                    
                    {/* Category Chip Picker */}
                    <CategoryChipPicker
                        categories={transactionCategories}
                        selectedCategoryId={billForm.categoryId}
                        onSelect={(id) => setBillForm(s => ({ ...s, categoryId: id }))}
                        onAddCategory={addTransactionCategory}
                    />

                    {/* Family Member Picker */}
                    <FamilyMemberPicker
                        members={familyMembers}
                        selectedMemberId={billForm.memberId}
                        onSelect={(id) => setBillForm(s => ({ ...s, memberId: id }))}
                    />

                    <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">
                            {t('finance.modal.recurrence')}
                        </label>
                        <select 
                            value={billForm.recurrence} 
                            onChange={e => setBillForm(s => ({...s, recurrence: e.target.value as any}))} 
                            className="w-full p-2.5 sm:p-3 text-sm border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-zinc-600 text-light-text-primary dark:text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="monthly">{t('finance.modal.recurrenceOptions.monthly')}</option>
                            <option value="weekly">{t('finance.modal.recurrenceOptions.weekly')}</option>
                            <option value="yearly">{t('finance.modal.recurrenceOptions.yearly')}</option>
                            <option value="none">{t('finance.modal.recurrenceOptions.none')}</option>
                        </select>
                    </div>
                    {editingBill && (
                        <label className="flex items-center gap-2.5 text-sm font-medium cursor-pointer pt-1 text-light-text-primary dark:text-text-primary">
                            <input 
                                type="checkbox" 
                                checked={billForm.paid} 
                                onChange={e => setBillForm(s => ({ ...s, paid: e.target.checked }))} 
                                className="h-4 w-4 rounded-md text-primary focus:ring-primary" 
                            />
                            <span>{t('finance.modal.markPaid')}</span>
                        </label>
                    )}
                    <button 
                        onClick={handleSaveBill} 
                        className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-opacity-90 shadow-md active:scale-[0.99] transition-colors text-sm"
                    >
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
        <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-3.5 sm:p-4 bg-light-background dark:bg-background rounded-2xl space-y-3 border border-slate-100 dark:border-zinc-800">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-xs sm:text-sm text-light-text-primary dark:text-text-primary">{isBorrowing ? item.lenderName : item.borrowerName}</p>
                    <p className="text-[11px] sm:text-xs text-light-text-secondary dark:text-text-secondary">{t(isBorrowing ? 'finance.borrowLend.lender' : 'finance.borrowLend.borrower')}</p>
                </div>
                <div className="relative" ref={menuRef}>
                    <button onClick={() => setMenuOpen(p => !p)} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 text-light-text-secondary dark:text-text-secondary">
                        <HiEllipsisVertical className="h-5 w-5" />
                    </button>
                    <AnimatePresence>
                        {menuOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                                className="absolute top-8 right-0 w-48 bg-light-surface dark:bg-surface rounded-lg shadow-xl border border-slate-200 dark:border-zinc-700 z-10 p-1.5 space-y-1 text-xs"
                            >
                                <button onClick={() => { onLogPayment(item); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 font-medium rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700/50">
                                    <HiPlus className="h-4 w-4" /> {t(isBorrowing ? 'finance.borrowLend.logRepayment' : 'finance.borrowLend.logReturn')}
                                </button>
                                <button onClick={() => { onEdit(item); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 font-medium rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700/50">
                                    <HiPencil className="h-4 w-4" /> {t('finance.modal.actions.edit')}
                                </button>
                                {!isBorrowing && onWriteOff && (
                                     <button onClick={() => { onWriteOff(item.id); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 font-medium rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700/50">
                                        <HiOutlineReceiptRefund className="h-4 w-4" /> {t('finance.borrowLend.writeOff')}
                                    </button>
                                )}
                                <div className="h-px bg-slate-200 dark:bg-zinc-700 my-1"></div>
                                <button onClick={() => { onDelete(item); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 font-medium rounded-md text-red-500 hover:bg-red-500/10">
                                    <HiTrash className="h-4 w-4" /> {t('finance.modal.actions.delete')}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            
            <div className={`p-2.5 sm:p-3 rounded-lg flex justify-between items-center ${accentClasses}`}>
                <div>
                    <p className="text-[11px] sm:text-xs font-semibold opacity-80">{t('finance.borrowLend.remaining')}</p>
                    <p className="text-xl sm:text-2xl font-bold">{currencySymbol}{remaining.toFixed(2)}</p>
                </div>
                <div className="text-right">
                    <p className="text-[11px] sm:text-xs font-semibold opacity-80">{t('finance.borrowLend.total')}</p>
                    <p className="text-xs sm:text-sm font-semibold">{currencySymbol}{item.amount.toFixed(2)}</p>
                </div>
            </div>

            <div>
                <div className="flex justify-between text-[11px] sm:text-xs font-medium text-light-text-secondary dark:text-text-secondary mb-1">
                    <span>{currencySymbol}{totalPaid.toFixed(2)} {t('finance.borrowLend.paid')}</span>
                    <span>{percentage}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-zinc-700 rounded-full h-2">
                    <div className={`${progressColor} h-2 rounded-full transition-all duration-300`} style={{ width: `${percentage}%` }}/>
                </div>
            </div>
            
            <div className="flex justify-between items-center text-[11px] sm:text-xs text-light-text-secondary dark:text-text-secondary pt-1">
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
                                                className="text-red-400 hover:text-red-500 p-1.5 rounded hover:bg-red-500/10 transition-colors"
                                                title="Delete this payment record"
                                            >
                                                <HiTrash className="h-4 w-4" />
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
                    <h3 className="text-base sm:text-lg font-bold text-light-text-primary dark:text-text-primary">{t('finance.borrowLend.youOwe')}</h3>
                    <button onClick={() => openModal('borrowing')} className="p-1.5 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"><HiPlus className="h-4 w-4"/></button>
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
                    <p className="text-center text-xs sm:text-sm text-light-text-secondary dark:text-text-secondary py-4">{t('finance.borrowLend.noBorrowings')}</p>
                )}
            </Card>
            <Card>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-base sm:text-lg font-bold text-light-text-primary dark:text-text-primary">{t('finance.borrowLend.owedToYou')}</h3>
                    <button onClick={() => openModal('lending')} className="p-1.5 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"><HiPlus className="h-4 w-4"/></button>
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
                    <p className="text-center text-xs sm:text-sm text-light-text-secondary dark:text-text-secondary py-4">{t('finance.borrowLend.noLendings')}</p>
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
                <div className="space-y-4 py-1">
                    <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">
                            {['borrowing', 'edit_borrowing'].includes(modal) ? 'Lender Name *' : 'Borrower Name *'}
                        </label>
                        <input 
                            type="text" 
                            placeholder={['borrowing', 'edit_borrowing'].includes(modal) ? 'e.g. Alex Morgan, Bank, Friend' : 'e.g. John Doe, Colleague, Relative'} 
                            value={form.name} 
                            onChange={e => setForm(s => ({...s, name: e.target.value}))} 
                            className="w-full p-2.5 sm:p-3 text-sm border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-zinc-600 text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">
                            {t('finance.modal.amount')} ({currencySymbol}) *
                        </label>
                        <input 
                            type="number" 
                            step="0.01" 
                            min="0"
                            placeholder="0.00" 
                            value={form.amount} 
                            onChange={e => setForm(s => ({...s, amount: e.target.value}))} 
                            className="w-full p-2.5 sm:p-3 text-sm border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-zinc-600 text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">
                                {['borrowing', 'edit_borrowing'].includes(modal) ? 'Borrowed Date *' : 'Lent Date *'}
                            </label>
                            <input 
                                type="date" 
                                value={form.date} 
                                onChange={e => setForm(s => ({...s, date: e.target.value}))} 
                                className="w-full p-2.5 sm:p-3 text-sm border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-zinc-600 text-light-text-primary dark:text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">
                                {['borrowing', 'edit_borrowing'].includes(modal) ? 'Due Date *' : 'Return Date *'}
                            </label>
                            <input 
                                type="date" 
                                value={form.returnDate} 
                                onChange={e => setForm(s => ({...s, returnDate: e.target.value}))} 
                                className="w-full p-2.5 sm:p-3 text-sm border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-zinc-600 text-light-text-primary dark:text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">
                            {t('finance.modal.notes')} (Optional)
                        </label>
                        <input 
                            type="text" 
                            placeholder="e.g. Emergency medical expenses, Travel tickets" 
                            value={form.notes} 
                            onChange={e => setForm(s => ({...s, notes: e.target.value}))} 
                            className="w-full p-2.5 sm:p-3 text-sm border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-zinc-600 text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                    <button 
                        onClick={handleSave} 
                        className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-opacity-90 shadow-md active:scale-[0.99] transition-colors text-sm"
                    >
                        {['borrowing', 'lending'].includes(modal) ? t('finance.modal.addRecord') : t('finance.modal.saveChanges')}
                    </button>
                </div>
            </Modal>
             <Modal isOpen={modal === 'repayment' || modal === 'return'} onClose={() => openModal('none')} title={t(modal === 'repayment' ? 'finance.modal.logRepayment' : 'finance.modal.logReturn')}>
                <div className="space-y-4 py-1">
                    <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">
                            {t(modal === 'repayment' ? 'finance.modal.repaymentAmount' : 'finance.modal.returnAmount')} ({currencySymbol}) *
                        </label>
                        <input 
                            type="number" 
                            step="0.01" 
                            min="0"
                            placeholder="0.00" 
                            value={form.amount} 
                            onChange={e => setForm(s => ({...s, amount: e.target.value}))} 
                            className="w-full p-2.5 sm:p-3 text-sm border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-zinc-600 text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">
                            Payment Date *
                        </label>
                        <input 
                            type="date" 
                            value={form.date} 
                            onChange={e => setForm(s => ({...s, date: e.target.value}))} 
                            className="w-full p-2.5 sm:p-3 text-sm border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-zinc-600 text-light-text-primary dark:text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                    <button 
                        onClick={handleSave} 
                        className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-opacity-90 shadow-md active:scale-[0.99] transition-colors text-sm"
                    >
                        {t('finance.modal.log')}
                    </button>
                </div>
            </Modal>
            {/* Delete Confirmation Modal */}
            <Modal isOpen={modal === 'delete_borrowing' || modal === 'delete_lending'} onClose={() => openModal('none')} title={t('finance.modal.deleteTitle')}>
                <p className="text-light-text-secondary dark:text-text-secondary">{t('finance.modal.deleteConfirm')}</p>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => openModal('none')} className="px-3.5 py-2 bg-slate-200 dark:bg-zinc-700 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-zinc-600 text-xs sm:text-sm">{t('tasks.deleteModal.cancel')}</button>
                    <button onClick={handleDelete} className="px-3.5 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 text-xs sm:text-sm">{t('tasks.deleteModal.confirm')}</button>
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
                    <h3 className="text-base sm:text-lg font-bold text-light-text-primary dark:text-text-primary pr-8">{goal.title}</h3>
                    <div className="relative" ref={menuRef}>
                        <button onClick={() => setMenuOpen(prev => !prev)} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 text-light-text-secondary dark:text-text-secondary">
                            <HiEllipsisVertical className="h-5 w-5" />
                        </button>
                        <AnimatePresence>
                            {menuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className="absolute top-8 right-0 w-44 bg-light-surface dark:bg-surface rounded-lg shadow-xl border border-slate-200 dark:border-zinc-700 z-10 p-1.5 space-y-1 text-xs"
                                >
                                    <button onClick={() => { onAddDeposit(); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 font-medium rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700/50">
                                        <HiPlus className="h-4 w-4 text-green-500" /> {t('finance.savingsPage.addDeposit')}
                                    </button>
                                    <button onClick={() => { onWithdraw(); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 font-medium rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700/50">
                                        <HiOutlineReceiptRefund className="h-4 w-4 text-orange-500" /> {t('finance.modal.withdraw')}
                                    </button>
                                    <button onClick={() => { onEdit(); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 font-medium rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700/50">
                                        <HiPencil className="h-4 w-4" /> {t('finance.modal.actions.edit')}
                                    </button>
                                    <div className="h-px bg-slate-200 dark:bg-zinc-700 my-1"></div>
                                    <button onClick={() => { onDelete(); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 font-medium rounded-md text-red-500 hover:bg-red-500/10">
                                        <HiTrash className="h-4 w-4" /> {t('finance.modal.actions.delete')}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="relative my-4 sm:my-6 flex items-center justify-center">
                    <CircularProgress percentage={percentage} size={110} strokeWidth={10} />
                    <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-2xl sm:text-3xl font-bold text-primary">{percentage}%</span>
                    </div>
                </div>

                <div className="text-center space-y-1.5 sm:space-y-2">
                    <p className="text-xs sm:text-sm text-light-text-secondary dark:text-text-secondary">
                        {t('finance.savingsPage.saved')}: <span className="font-semibold text-light-text-primary dark:text-text-primary">{currencySymbol}{goal.currentAmount.toLocaleString()}</span> / {currencySymbol}{goal.targetAmount.toLocaleString()}
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-teal">
                        {t('finance.savingsPage.remaining')}: {currencySymbol}{remaining.toLocaleString()}
                    </p>
                    {goal.deadlineDate && (
                        <p className="text-[11px] sm:text-xs text-light-text-secondary dark:text-text-secondary">
                            {t('finance.modal.deadline')}: {new Date(goal.deadlineDate).toLocaleDateString()}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-zinc-700">
                    <button 
                        onClick={onAddDeposit}
                        className="w-full py-2 px-2 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors"
                    >
                        <HiPlus className="h-3.5 w-3.5" /> {t('finance.savingsPage.addDeposit')}
                    </button>
                    <button 
                        onClick={onWithdraw}
                        className="w-full py-2 px-2 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors"
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
                className="w-full h-full min-h-[240px] sm:min-h-[280px] flex flex-col items-center justify-center text-center p-4 sm:p-6 text-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors rounded-2xl"
            >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-dashed border-primary flex items-center justify-center mb-3">
                    <HiPlus className="h-6 w-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold">{t('finance.savingsPage.createGoal')}</h3>
                <p className="text-xs sm:text-sm text-light-text-secondary dark:text-text-secondary mt-1">{t('finance.savingsPage.goalDescription')}</p>
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
                <div className="space-y-4 py-1">
                    <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">
                            {t('finance.modal.goalTitle')} *
                        </label>
                        <input 
                            type="text" 
                            placeholder="e.g. Emergency Fund, Vacation, New Laptop" 
                            value={form.title} 
                            onChange={e => setForm(s => ({...s, title: e.target.value}))} 
                            className="w-full p-2.5 sm:p-3 text-sm border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-zinc-600 text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">
                                {t('finance.modal.targetAmount')} ({currencySymbol}) *
                            </label>
                            <input 
                                type="number" 
                                step="0.01" 
                                min="0"
                                placeholder="0.00" 
                                value={form.targetAmount} 
                                onChange={e => setForm(s => ({...s, targetAmount: e.target.value}))} 
                                className="w-full p-2.5 sm:p-3 text-sm border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-zinc-600 text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">
                                {t('finance.modal.deadline')} (Optional)
                            </label>
                            <input 
                                type="date" 
                                value={form.deadlineDate} 
                                onChange={e => setForm(s => ({...s, deadlineDate: e.target.value}))} 
                                className="w-full p-2.5 sm:p-3 text-sm border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-zinc-600 text-light-text-primary dark:text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                    </div>

                    {modal.type === 'savings_goal' && (
                        <div>
                            <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">
                                {t('finance.modal.initialDeposit')} ({currencySymbol}) (Optional)
                            </label>
                            <input 
                                type="number" 
                                step="0.01" 
                                min="0"
                                placeholder="0.00" 
                                value={form.initialDeposit} 
                                onChange={e => setForm(s => ({...s, initialDeposit: e.target.value}))} 
                                className="w-full p-2.5 sm:p-3 text-sm border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-zinc-600 text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                    )}

                    {modal.type === 'edit_goal' && (
                        <div>
                            <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">
                                Current Saved Amount ({currencySymbol})
                            </label>
                            <input 
                                type="number" 
                                step="0.01" 
                                min="0"
                                placeholder="0.00" 
                                value={form.currentAmount} 
                                onChange={e => setForm(s => ({...s, currentAmount: e.target.value}))} 
                                className="w-full p-2.5 sm:p-3 text-sm border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-zinc-600 text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                    )}

                    <button 
                        onClick={handleSaveGoal} 
                        className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-opacity-90 shadow-md active:scale-[0.99] transition-colors text-sm"
                    >
                        {t(modal.type === 'edit_goal' ? 'finance.modal.saveChanges' : 'finance.modal.addRecord')}
                    </button>
                </div>
            </Modal>
            
            {/* Add Deposit Modal */}
            <Modal isOpen={modal.type === 'deposit'} onClose={() => openModal('none')} title={t('finance.modal.addDeposit', { goalName: modal.goal?.title })}>
                 <div className="space-y-4 py-1">
                    <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">
                            {t('finance.modal.depositAmount')} ({currencySymbol}) *
                        </label>
                        <input 
                            type="number" 
                            step="0.01" 
                            min="0"
                            placeholder="0.00" 
                            value={depositAmount} 
                            onChange={e => setDepositAmount(e.target.value)} 
                            className="w-full p-2.5 sm:p-3 text-sm border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-zinc-600 text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                    <button 
                        onClick={handleSaveDeposit} 
                        className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-opacity-90 shadow-md active:scale-[0.99] transition-colors text-sm"
                    >
                        {t('finance.savingsPage.addDeposit')}
                    </button>
                </div>
            </Modal>

            {/* Withdraw Modal */}
            <Modal isOpen={modal.type === 'withdraw'} onClose={() => openModal('none')} title={t('finance.modal.withdrawDeposit', { goalName: modal.goal?.title || '' })}>
                 <div className="space-y-4 py-1">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-700/60">
                        <p className="text-xs text-light-text-secondary dark:text-text-secondary">
                            Available saved balance: <span className="font-bold text-light-text-primary dark:text-text-primary">{currencySymbol}{modal.goal?.currentAmount.toFixed(2) || '0.00'}</span>
                        </p>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-1.5">
                            {t('finance.modal.withdrawAmount')} ({currencySymbol}) *
                        </label>
                        <input 
                            type="number" 
                            step="0.01" 
                            min="0"
                            placeholder="0.00" 
                            max={modal.goal?.currentAmount || 0} 
                            value={withdrawAmount} 
                            onChange={e => setWithdrawAmount(e.target.value)} 
                            className="w-full p-2.5 sm:p-3 text-sm border rounded-xl bg-light-background dark:bg-background border-slate-200 dark:border-zinc-600 text-light-text-primary dark:text-text-primary placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                    <button 
                        onClick={handleWithdraw} 
                        className="w-full py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 shadow-md active:scale-[0.99] transition-colors text-sm"
                    >
                        {t('finance.modal.withdraw')}
                    </button>
                </div>
            </Modal>

            {/* Delete Goal Confirmation Modal */}
            <Modal isOpen={modal.type === 'delete_goal'} onClose={() => openModal('none')} title={t('finance.modal.deleteGoal')}>
                 <div className="space-y-6">
                    <p className="text-light-text-secondary dark:text-text-secondary text-sm">{t('finance.modal.deleteGoalConfirm', { goalName: modal.goal?.title || '' })}</p>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => openModal('none')} className="px-3.5 py-2 bg-slate-200 dark:bg-zinc-700 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-zinc-600 text-xs sm:text-sm">{t('tasks.deleteModal.cancel')}</button>
                        <button onClick={handleDeleteGoal} className="px-3.5 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 text-xs sm:text-sm">{t('tasks.deleteModal.confirm')}</button>
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
                <span className="font-semibold text-xs sm:text-sm text-light-text-primary dark:text-text-primary">{goal.title}</span>
                <span className="font-bold text-xs sm:text-sm text-primary">{percentage}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-zinc-700 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
            </div>
            <div className="flex justify-between text-[11px] sm:text-xs mt-1 text-light-text-secondary dark:text-text-secondary">
                <span>{currencySymbol}{goal.currentAmount.toFixed(0)}</span>
                <span>{t('finance.savingsPage.of')} {currencySymbol}{goal.targetAmount.toFixed(0)}</span>
            </div>
             {onAddDeposit && (
                <button onClick={onAddDeposit} className="w-full mt-2.5 text-xs py-2 bg-primary/10 text-primary font-semibold rounded-lg hover:bg-primary/20 transition-colors">{t('finance.savingsPage.addDeposit')}</button>
             )}
        </div>
    );
}

export default FinancePage;
