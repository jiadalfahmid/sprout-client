import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { 
    Transaction, TransactionType, Bill, FamilyMember, Medicine, Task, Note, User, Notification, CalendarEvent, CartItem, HealthRecord, Currency, Language, MedicalReport,
    Borrowing, Lending, SavingsGoal, Repayment, Return, Appointment, TaskList
} from '../types';
import { 
    mockUser, mockFamilyMembers, mockTransactions, mockBills, mockMedicines, mockTasks, mockNotes, mockNotifications, mockMedicalReports,
    mockBorrowings, mockLendings, mockSavingsGoals, mockAppointments, mockTaskLists
} from '../data/mockData';

// A simple uuid generator
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const availableCurrencies: Currency[] = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
];

export const availableLanguages: Language[] = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'bn', name: 'বাংলা' },
];

interface AppContextType {
  loading: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  user: User;
  updateUser: (user: Partial<User>) => void;
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  bills: Bill[];
  addBill: (bill: Omit<Bill, 'id' | 'paid' | 'paidOn'>) => void;
  updateBill: (bill: Bill) => boolean;
  deleteBill: (id: string) => void;
  familyMembers: FamilyMember[];
  addFamilyMember: (member: Omit<FamilyMember, 'id'>) => void;
  medicines: Medicine[];
  addMedicine: (medicine: Omit<Medicine, 'id' | 'history'>) => void;
  updateMedicine: (medicine: Medicine) => void;
  deleteMedicine: (id: string) => void;
  logDose: (medicineId: string, timestamp: string) => string | null;
  tasks: Task[];
  taskLists: TaskList[];
  addTaskList: (name: string) => void;
  deleteTaskList: (id: string) => void;
  addTask: (task: Omit<Task, 'id' | 'completed'>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt'>) => void;
  deleteNote: (id: string) => void;
  notifications: Notification[];
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
  deleteNotification: (id: string) => void;
  getCalendarEvents: (startDate: Date, endDate: Date) => CalendarEvent[];
  healthRecords: HealthRecord[]; 
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateCartItemQuantity: (medicineId: string, strips: number, pieces: number) => void;
  clearCart: () => void;
  completeRestock: () => void;
  currency: string;
  updateCurrency: (code: string) => void;
  availableCurrencies: Currency[];
  language: string;
  updateLanguage: (code: string) => void;
  availableLanguages: Language[];
  medicalReports: MedicalReport[];
  addMedicalReport: (report: Omit<MedicalReport, 'id'>) => void;
  deleteMedicalReport: (id: string) => void;
  // New financial features
  borrowings: Borrowing[];
  addBorrowing: (item: Omit<Borrowing, 'id' | 'repayments' | 'status'>) => void;
  updateBorrowing: (item: Borrowing) => void;
  deleteBorrowing: (id: string) => void;
  addRepayment: (borrowingId: string, repayment: Repayment) => boolean;
  settleBorrowing: (borrowingId: string) => void;
  lendings: Lending[];
  addLending: (item: Omit<Lending, 'id' | 'returns' | 'status'>) => void;
  updateLending: (item: Lending) => void;
  deleteLending: (id: string) => void;
  addReturn: (lendingId: string, returnItem: Return) => boolean;
  writeOffLending: (lendingId: string) => void;
  savingsGoals: SavingsGoal[];
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'currentAmount'> & { initialDeposit?: number }) => void;
  addSavingsDeposit: (goalId: string, amount: number) => void;
  updateSavingsGoal: (goal: SavingsGoal) => void;
  deleteSavingsGoal: (goalId: string) => void;
  // Appointments
  appointments: Appointment[];
  addAppointment: (appointment: Omit<Appointment, 'id' | 'status'>) => void;
  updateAppointment: (appointment: Appointment) => void;
  deleteAppointment: (id: string) => void;
  // UI State
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.log(error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
};

export const AppProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'dark');
  const [user, setUser] = useLocalStorage<User>('user', mockUser);
  const [familyMembers, setFamilyMembers] = useLocalStorage<FamilyMember[]>('familyMembers', mockFamilyMembers);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', mockTransactions);
  const [bills, setBills] = useLocalStorage<Bill[]>('bills', mockBills);
  const [medicines, setMedicines] = useLocalStorage<Medicine[]>('medicines', mockMedicines);
  const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', mockTasks);
  const [taskLists, setTaskLists] = useLocalStorage<TaskList[]>('taskLists', mockTaskLists);
  const [notes, setNotes] = useLocalStorage<Note[]>('notes', mockNotes);
  const [notifications, setNotifications] = useLocalStorage<Notification[]>('notifications', mockNotifications);
  const [cart, setCart] = useLocalStorage<CartItem[]>('cart', []);
  const [currency, setCurrency] = useLocalStorage<string>('currency', 'USD');
  const [language, setLanguage] = useLocalStorage<string>('language', 'en');
  const [medicalReports, setMedicalReports] = useLocalStorage<MedicalReport[]>('medicalReports', mockMedicalReports);
  const [borrowings, setBorrowings] = useLocalStorage<Borrowing[]>('borrowings', mockBorrowings);
  const [lendings, setLendings] = useLocalStorage<Lending[]>('lendings', mockLendings);
  const [savingsGoals, setSavingsGoals] = useLocalStorage<SavingsGoal[]>('savingsGoals', mockSavingsGoals);
  const [appointments, setAppointments] = useLocalStorage<Appointment[]>('appointments', mockAppointments);
  // UI State
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    // Simulate initial data load
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

    // Effect for generating dynamic notifications
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day for accurate date comparison
    
    const lowStockNotifs: Notification[] = medicines
        .filter(med => med.stock > 0 && med.stock <= 10)
        .map(med => ({
            id: `stock-${med.id}`,
            message: `${med.name} stock is low (${med.stock} pieces left).`,
            type: 'warning',
            domain: 'health',
            path: '/settings/medicines',
            read: false,
            createdAt: new Date().toISOString(),
        }));

    const upcomingBillNotifs: Notification[] = bills
        .filter(bill => {
            const dueDate = new Date(bill.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            const diffTime = dueDate.getTime() - today.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            return !bill.paid && diffDays >= 0 && diffDays <= 7;
        })
        .map(bill => {
            const dueDate = new Date(bill.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            const diffTime = dueDate.getTime() - today.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            
            let message;
            if (diffDays === 0) {
                message = `${bill.name} is due today.`;
            } else if (diffDays === 1) {
                message = `${bill.name} is due tomorrow.`;
            } else {
                message = `${bill.name} is due in ${diffDays} days.`;
            }

            return {
                id: `bill-${bill.id}`,
                message: message,
                type: 'info',
                domain: 'finance',
                path: '/finance',
                read: false,
                createdAt: new Date().toISOString(),
            };
        });
    
    const upcomingAppointmentNotifs: Notification[] = appointments
        .filter(appt => {
            const apptDate = new Date(appt.dateTime);
            apptDate.setHours(0, 0, 0, 0);
            const diffTime = apptDate.getTime() - today.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            return appt.status === 'upcoming' && diffDays >= 0 && diffDays <= 2;
        })
        .map(appt => {
            const member = familyMembers.find(m => m.id === appt.memberId);
            const apptDate = new Date(appt.dateTime);
            apptDate.setHours(0, 0, 0, 0);
            const diffTime = apptDate.getTime() - today.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            
            let timeText;
            if (diffDays === 0) {
                timeText = 'today';
            } else if (diffDays === 1) {
                timeText = 'tomorrow';
            } else {
                timeText = `in ${diffDays} days`;
            }

            const message = `Appointment for ${member?.name} with ${appt.doctorName} is ${timeText}.`;
            return {
                id: `appt-${appt.id}`,
                message: message,
                type: 'info',
                domain: 'health',
                path: '/settings/appointments',
                read: false,
                createdAt: new Date().toISOString()
            };
        });

    const dynamicNotifications = [...lowStockNotifs, ...upcomingBillNotifs, ...upcomingAppointmentNotifs];

    setNotifications(prev => {
        const nonDynamic = prev.filter(n => !n.id.startsWith('stock-') && !n.id.startsWith('bill-') && !n.id.startsWith('appt-'));
        
        const updatedDynamic = dynamicNotifications.map(newNotif => {
            const oldNotif = prev.find(n => n.id === newNotif.id);
            return oldNotif ? { ...newNotif, read: oldNotif.read, createdAt: oldNotif.createdAt } : newNotif;
        });

        return [...nonDynamic, ...updatedDynamic].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });
}, [medicines, bills, appointments, familyMembers]);


  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };
  
  const updateUser = (updatedUser: Partial<User>) => {
    setUser(prev => ({...prev, ...updatedUser}));
  }

  const addFamilyMember = (member: Omit<FamilyMember, 'id'>) => {
    setFamilyMembers(prev => [...prev, { ...member, id: uuidv4() }]);
  };
  
  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      id: uuidv4(),
      ...transaction,
    };
    setTransactions(prev => [newTransaction, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };
  
  const updateTransaction = (updatedTransaction: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
  };
  
  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };
  
  const addBill = (bill: Omit<Bill, 'id' | 'paid' | 'paidOn'>) => {
    setBills(prev => [...prev, { ...bill, id: uuidv4(), paid: false }]);
  };
  
  const updateBill = (updatedBill: Bill): boolean => {
    const originalBill = bills.find(b => b.id === updatedBill.id);
    let transactionCreated = false;
    const finalBill = { ...updatedBill };

    if (originalBill && !originalBill.paid && finalBill.paid) {
        addTransaction({
            description: finalBill.name,
            amount: finalBill.amount,
            type: TransactionType.EXPENSE,
            category: finalBill.category,
            date: new Date().toISOString()
        });
        transactionCreated = true;
        finalBill.paidOn = new Date().toISOString();
    } else if (originalBill && originalBill.paid && !finalBill.paid) {
        // If un-paying, remove paidOn date
        delete finalBill.paidOn;
    }


    setBills(prev => prev.map(b => b.id === finalBill.id ? finalBill : b));
    return transactionCreated;
  };

  const deleteBill = (id: string) => {
    setBills(prev => prev.filter(b => b.id !== id));
  }
  
  const addMedicine = (medicine: Omit<Medicine, 'id' | 'history'>) => {
      setMedicines(prev => [...prev, { ...medicine, id: uuidv4(), history: [] }]);
  }

  const updateMedicine = (updatedMedicine: Medicine) => {
      setMedicines(prev => prev.map(m => m.id === updatedMedicine.id ? updatedMedicine : m));
  }
  
  const deleteMedicine = (id: string) => {
      setMedicines(prev => prev.filter(m => m.id !== id));
  }
  
  const logDose = (medicineId: string, timestamp: string) => {
      let medName: string | null = null;
      setMedicines(prev => prev.map(med => {
          if (med.id === medicineId && med.stock >= med.doseQuantity) {
              medName = med.name;
              return {
                  ...med,
                  stock: med.stock - med.doseQuantity,
                  history: [...med.history, { timestamp, status: 'taken' }]
              };
          }
          return med;
      }));
      return medName;
  }

  const addTaskList = (name: string) => {
    const newTaskList: TaskList = { id: uuidv4(), name };
    setTaskLists(prev => [...prev, newTaskList]);
  };

  const deleteTaskList = (id: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.listId !== id));
    setTaskLists(prevLists => prevLists.filter(list => list.id !== id));
  };

  const addTask = (task: Omit<Task, 'id' | 'completed'>) => {
    setTasks(prev => [...prev, { ...task, id: uuidv4(), completed: false }]);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };
  
  const addNote = (note: Omit<Note, 'id' | 'createdAt'>) => {
    setNotes(prev => [{ ...note, id: uuidv4(), createdAt: new Date().toISOString() }, ...prev]);
  };
  
  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  }
  
  const markAsRead = (id: string) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }
  
  const clearNotifications = () => {
      setNotifications(prev => prev.map(n => ({...n, read: true})));
  }
  
  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const addMedicalReport = (report: Omit<MedicalReport, 'id'>) => {
    setMedicalReports(prev => [{ ...report, id: uuidv4() }, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const deleteMedicalReport = (id: string) => {
      setMedicalReports(prev => prev.filter(r => r.id !== id));
  };

    // --- Borrowing & Lending ---
    const addBorrowing = (item: Omit<Borrowing, 'id' | 'repayments' | 'status'>) => {
        const newBorrowing: Borrowing = { ...item, id: uuidv4(), repayments: [], status: 'outstanding' };
        setBorrowings(prev => [...prev, newBorrowing]);
    };

    const updateBorrowing = (item: Borrowing) => {
        setBorrowings(prev => prev.map(b => b.id === item.id ? item : b));
    };

    const deleteBorrowing = (id: string) => {
        setBorrowings(prev => prev.filter(b => b.id !== id));
    };

    const addRepayment = (borrowingId: string, repayment: Repayment) => {
        let success = false;
        setBorrowings(prev => prev.map(b => {
            if (b.id === borrowingId) {
                success = true;
                const totalRepaid = b.repayments.reduce((sum, r) => sum + r.amount, 0) + repayment.amount;
                const newStatus = totalRepaid >= b.amount ? 'settled' : 'outstanding';
                addTransaction({
                    description: `Repayment to ${b.lenderName}`,
                    amount: repayment.amount,
                    type: TransactionType.EXPENSE,
                    category: 'Debt Repayment',
                    date: repayment.date
                });
                return { ...b, repayments: [...b.repayments, repayment], status: newStatus };
            }
            return b;
        }));
        return success;
    };

    const settleBorrowing = (borrowingId: string) => setBorrowings(prev => prev.map(b => b.id === borrowingId ? { ...b, status: 'settled' } : b));
    
    const addLending = (item: Omit<Lending, 'id' | 'returns' | 'status'>) => {
        const newLending: Lending = { ...item, id: uuidv4(), returns: [], status: 'outstanding' };
        setLendings(prev => [...prev, newLending]);
    };

    const updateLending = (item: Lending) => {
        setLendings(prev => prev.map(l => l.id === item.id ? item : l));
    };

    const deleteLending = (id: string) => {
        setLendings(prev => prev.filter(l => l.id !== id));
    };
    
    const addReturn = (lendingId: string, returnItem: Return) => {
        let success = false;
        setLendings(prev => prev.map(l => {
            if (l.id === lendingId) {
                success = true;
                const totalReturned = l.returns.reduce((sum, r) => sum + r.amount, 0) + returnItem.amount;
                const newStatus = totalReturned >= l.amount ? 'returned' : 'outstanding';
                addTransaction({
                    description: `Return from ${l.borrowerName}`,
                    amount: returnItem.amount,
                    type: TransactionType.INCOME,
                    category: 'Loan Return',
                    date: returnItem.date
                });
                return { ...l, returns: [...l.returns, returnItem], status: newStatus };
            }
            return l;
        }));
        return success;
    };

    const writeOffLending = (lendingId: string) => setLendings(prev => prev.map(l => l.id === lendingId ? { ...l, status: 'written_off' } : l));

    // --- Savings Goals ---
    const addSavingsGoal = (goal: Omit<SavingsGoal, 'id' | 'currentAmount'> & { initialDeposit?: number }) => {
        const newGoal: SavingsGoal = { id: uuidv4(), ...goal, currentAmount: goal.initialDeposit || 0 };
        if (goal.initialDeposit && goal.initialDeposit > 0) {
            addTransaction({
                description: `Initial deposit for ${goal.title}`,
                amount: goal.initialDeposit,
                type: TransactionType.EXPENSE,
                category: 'Savings',
                date: new Date().toISOString()
            });
        }
        setSavingsGoals(prev => [...prev, newGoal]);
    };

    const addSavingsDeposit = (goalId: string, amount: number) => {
        let goalTitle = '';
        setSavingsGoals(prev => prev.map(g => {
            if (g.id === goalId) {
                goalTitle = g.title;
                return { ...g, currentAmount: g.currentAmount + amount };
            }
            return g;
        }));
        if (goalTitle) {
            addTransaction({
                description: `Deposit to ${goalTitle}`,
                amount: amount,
                type: TransactionType.EXPENSE,
                category: 'Savings',
                date: new Date().toISOString()
            });
        }
    };

    const updateSavingsGoal = (goal: SavingsGoal) => setSavingsGoals(prev => prev.map(g => g.id === goal.id ? goal : g));
    const deleteSavingsGoal = (goalId: string) => setSavingsGoals(prev => prev.filter(g => g.id !== goalId));

  // --- Appointments ---
  const addAppointment = (appointment: Omit<Appointment, 'id' | 'status'>) => {
    const newAppointment: Appointment = { id: uuidv4(), ...appointment, status: 'upcoming' };
    setAppointments(prev => [...prev, newAppointment].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()));
  };

  const updateAppointment = (updatedAppointment: Appointment) => {
    setAppointments(prev => prev.map(a => a.id === updatedAppointment.id ? updatedAppointment : a));
  };

  const deleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
  };


  const getCalendarEvents = useCallback((startDate: Date, endDate: Date): CalendarEvent[] => {
      const events: CalendarEvent[] = [];
      const referenceDate = new Date(2024, 0, 1); // Fixed reference for alternate days
      
      medicines.forEach(med => {
          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
              const daysDifference = Math.floor((d.getTime() - referenceDate.getTime()) / (1000 * 3600 * 24));
              const isScheduledToday = med.schedule.type === 'daily' || (med.schedule.type === 'alternate_days' && daysDifference % 2 === 0);
              if(!isScheduledToday) continue;

              med.times.forEach(time => {
                  const [hour, minute] = time.split(':');
                  const doseDateTime = new Date(d);
                  doseDateTime.setHours(parseInt(hour), parseInt(minute), 0, 0);

                  const historyEntry = med.history.find(h => new Date(h.timestamp).toDateString() === d.toDateString() && new Date(h.timestamp).getHours() === parseInt(hour));
                  
                  events.push({
                      id: `${med.id}-${d.toISOString()}-${time}`,
                      date: doseDateTime,
                      title: med.name,
                      type: 'medicine',
                      status: historyEntry ? historyEntry.status : 'upcoming',
                      details: { ...med }
                  });
              });
          }
      });
      
      bills.forEach(bill => {
          const dueDate = new Date(bill.dueDate);
          if (dueDate >= startDate && dueDate <= endDate) {
              events.push({
                  id: bill.id,
                  date: dueDate,
                  title: bill.name,
                  type: 'bill',
                  status: bill.paid ? 'paid' : 'unpaid',
                  details: { ...bill }
              });
          }
      });

      tasks.forEach(task => {
          if (task.dueDate) {
              const dueDate = new Date(task.dueDate);
              dueDate.setHours(12, 0, 0, 0); // Set a default time for tasks
              if (dueDate >= startDate && dueDate <= endDate) {
                  events.push({
                      id: task.id,
                      date: dueDate,
                      title: task.content,
                      type: 'task',
                      status: task.completed ? 'completed' : 'upcoming',
                      details: { ...task }
                  });
              }
          }
      });

      appointments.forEach(appt => {
        const apptDate = new Date(appt.dateTime);
        if (apptDate >= startDate && apptDate <= endDate) {
            const member = familyMembers.find(m => m.id === appt.memberId);
            events.push({
                id: appt.id,
                date: apptDate,
                title: `Appt: ${appt.doctorName} for ${member?.name}`,
                type: 'appointment',
                status: appt.status,
                details: { ...appt }
            });
        }
      });
      
      return events.sort((a,b) => a.date.getTime() - b.date.getTime());
  }, [medicines, bills, tasks, appointments, familyMembers]);
  
  const addToCart = (item: CartItem) => {
      setCart(prev => {
          const existing = prev.find(i => i.medicineId === item.medicineId);
          if (existing) {
              return prev.map(i => i.medicineId === item.medicineId ? { ...i, strips: i.strips + item.strips, pieces: i.pieces + item.pieces } : i);
          }
          return [...prev, item];
      });
  }

  const updateCartItemQuantity = (medicineId: string, strips: number, pieces: number) => {
      setCart(prev => prev.map(item => item.medicineId === medicineId ? { ...item, strips, pieces } : item).filter(item => item.strips > 0 || item.pieces > 0));
  }
  
  const clearCart = () => {
      setCart([]);
  }

  const completeRestock = () => {
      const grandTotal = cart.reduce((acc, cartItem) => {
          const med = medicines.find(m => m.id === cartItem.medicineId);
          if (!med) return acc;

          const pricePerPiece = (med.stripPrice && med.piecesPerStrip) ? (med.stripPrice / med.piecesPerStrip) : 0;
          const totalPieces = (cartItem.strips * (med.piecesPerStrip || 0)) + cartItem.pieces;
          return acc + (totalPieces * pricePerPiece);
      }, 0);

      if (grandTotal > 0) {
          addTransaction({
              description: "Medicine Restock",
              amount: grandTotal,
              type: TransactionType.EXPENSE,
              category: "Medicine & Health",
              date: new Date().toISOString(),
          });
      }

      setMedicines(prevMeds => {
          return prevMeds.map(med => {
              const cartItem = cart.find(item => item.medicineId === med.id);
              if(cartItem) {
                  const piecesPerStrip = med.piecesPerStrip || 1;
                  const totalPiecesAdded = (cartItem.strips * piecesPerStrip) + cartItem.pieces;
                  return { ...med, stock: med.stock + totalPiecesAdded };
              }
              return med;
          });
      });
      clearCart();
  }

  const updateCurrency = (code: string) => {
    setCurrency(code);
  };
  
  const updateLanguage = (code: string) => {
    setLanguage(code);
  };
  
  // Create healthRecords from medicines for compatibility with original components
  const healthRecords: HealthRecord[] = useMemo(() => {
    const recordsByMember: {[key: string]: Medicine[]} = {};
    medicines.forEach(med => {
      if(!recordsByMember[med.memberId]) {
        recordsByMember[med.memberId] = [];
      }
      recordsByMember[med.memberId].push(med);
    });
    return Object.keys(recordsByMember).map(memberId => ({
      id: memberId,
      memberId: memberId,
      medicines: recordsByMember[memberId]
    }))
  }, [medicines]);

  // UI State Controls
  const openDrawer = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);

  const value = {
    loading,
    theme, toggleTheme,
    user, updateUser,
    transactions, addTransaction, updateTransaction, deleteTransaction,
    bills, addBill, updateBill, deleteBill,
    familyMembers, addFamilyMember,
    medicines, addMedicine, updateMedicine, deleteMedicine, logDose,
    tasks, taskLists, addTaskList, deleteTaskList, addTask, toggleTask, deleteTask,
    notes, addNote, deleteNote,
    notifications, markAsRead, clearNotifications, deleteNotification,
    getCalendarEvents,
    healthRecords,
    cart, addToCart, updateCartItemQuantity, clearCart, completeRestock,
    currency, updateCurrency, availableCurrencies,
    language, updateLanguage, availableLanguages,
    medicalReports, addMedicalReport, deleteMedicalReport,
    borrowings, addBorrowing, updateBorrowing, deleteBorrowing, addRepayment, settleBorrowing,
    lendings, addLending, updateLending, deleteLending, addReturn, writeOffLending,
    savingsGoals, addSavingsGoal, addSavingsDeposit, updateSavingsGoal, deleteSavingsGoal,
    appointments, addAppointment, updateAppointment, deleteAppointment,
    isDrawerOpen, openDrawer, closeDrawer,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
