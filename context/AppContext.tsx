import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { 
    Transaction, TransactionType, Bill, FamilyMember, Medicine, Task, Note, User, Notification, 
    NotificationSettings, CalendarEvent, CartItem, HealthRecord, Currency, Language, MedicalReport,
    Borrowing, Lending, SavingsGoal, Repayment, Return, Appointment, TaskList, FamilyInvite,
    TransactionCategory
} from '../types';
import { 
    mockUser, mockFamilyMembers, mockTransactions, mockBills, mockMedicines, mockTasks, mockNotes, mockNotifications, mockMedicalReports,
    mockBorrowings, mockLendings, mockSavingsGoals, mockAppointments, mockTaskLists, mockTransactionCategories
} from '../data/mockData';
import { DEFAULT_TRANSACTION_CATEGORIES } from '../utils/categoryIcons';
import { 
  auth, 
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail, 
  resetPassword, 
  logoutFirebase,
  saveUserDocument,
  deleteUserDocument,
  saveInviteDocument,
  getInviteDocument,
  updateInviteDocument,
  subscribeToUserSubcollection,
  subscribeToInviterInvites,
  saveUserProfile,
  getUserProfile,
  seedUserData,
  setCachedAccessToken,
  getAccessToken,
  cancelPendingInvitesForMember,
  clearAllCloudUserData
} from '../services/firebaseService';
import { 
  defaultNotificationSettings, 
  requestBrowserNotificationPermission, 
  sendBrowserNotification, 
  playNotificationSound,
  generateSystemAlerts,
  findDoseHistoryEntry
} from '../services/notificationService';
import { sendFamilyInviteViaGmail } from '../services/gmailService';
import { fetchGoogleCalendarEvents, syncAppointmentToGoogleCalendar, syncBillToGoogleCalendar } from '../services/calendarService';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import toast from 'react-hot-toast';

// Cryptographically secure random hex & UUID generators
const generateSecureRandomHex = (byteCount: number = 16): string => {
  if (typeof crypto !== 'undefined') {
    if (typeof crypto.randomUUID === 'function' && byteCount === 16) {
      return crypto.randomUUID().replace(/-/g, '');
    }
    if (typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(byteCount);
      crypto.getRandomValues(bytes);
      return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    }
  }
  let result = '';
  for (let i = 0; i < byteCount; i++) {
    result += (Math.random() * 256 | 0).toString(16).padStart(2, '0');
  }
  return result;
};

const uuidv4 = (): string => {
  if (typeof crypto !== 'undefined') {
    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    if (typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40; // RFC 4122 version 4
      bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
      const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

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
  // Firebase Auth
  isGoogleAuthenticated: boolean;
  isGoogleLoading: boolean;
  needsGoogleReauth: boolean;
  reconnectGoogle: () => Promise<boolean>;
  isGuestMode: boolean;
  setGuestMode: (guest: boolean) => void;
  googleFirebaseUser: FirebaseUser | null;
  loginWithGoogle: () => Promise<boolean>;
  loginWithEmail: (email: string, pass: string) => Promise<boolean>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<boolean>;
  resetUserPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutFromGoogle: () => Promise<void>;
  seedSampleDataToCloud: () => Promise<boolean>;
  clearAllUserData: () => Promise<void>;
  // Google Calendar Sync
  includeGoogleCalendar: boolean;
  setIncludeGoogleCalendar: (include: boolean) => void;
  isCalendarSyncing: boolean;
  googleCalendarEvents: CalendarEvent[];
  fetchGoogleEvents: () => Promise<boolean>;
  syncAppointmentToGoogle: (appointmentId: string) => Promise<boolean>;
  syncBillToGoogle: (billId: string) => Promise<boolean>;
  syncAllToGoogleCalendar: () => Promise<{ appointmentsSynced: number; billsSynced: number }>;
  // Gmail Family Invite & Linking
  pendingInvite: FamilyInvite | null;
  sendFamilyInvite: (memberId: string, email: string, customMessage?: string) => Promise<{ success: boolean; inviteLink?: string; error?: string; mailtoFallback?: string }>;
  generateFamilyInviteLink: (memberId?: string, email?: string, customMessage?: string) => Promise<{ inviteId: string; inviteLink: string }>;
  copyFamilyInviteLink: (memberId?: string, email?: string) => Promise<string>;
  getInviteDetails: (inviteId: string) => Promise<FamilyInvite | null>;
  cancelFamilyInvite: (memberId: string) => Promise<boolean>;
  acceptPendingInvite: (invite?: FamilyInvite) => Promise<void>;
  // Notification System
  notifications: Notification[];
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  requestBrowserNotifications: () => Promise<boolean>;
  sendTestNotification: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  deleteNotification: (id: string) => void;
  addNotification: (notif: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  // Core Entities
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Transaction;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  transactionCategories: TransactionCategory[];
  addTransactionCategory: (category: Omit<TransactionCategory, 'id' | 'isCustom'> & { isCustom?: boolean }) => TransactionCategory;
  updateTransactionCategory: (category: TransactionCategory) => void;
  deleteTransactionCategory: (id: string) => void;
  mergeTransactionCategories: (sourceId: string, targetId: string) => void;
  bills: Bill[];
  addBill: (bill: Omit<Bill, 'id' | 'paid' | 'paidOn'>) => void;
  updateBill: (bill: Bill) => boolean;
  deleteBill: (id: string) => void;
  familyMembers: FamilyMember[];
  addFamilyMember: (member: Omit<FamilyMember, 'id'>) => void;
  updateFamilyMember: (member: FamilyMember) => void;
  deleteFamilyMember: (id: string) => void;
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
  borrowings: Borrowing[];
  addBorrowing: (item: Omit<Borrowing, 'id' | 'repayments' | 'status'>) => void;
  updateBorrowing: (item: Borrowing) => void;
  deleteBorrowing: (id: string) => void;
  addRepayment: (borrowingId: string, repayment: Repayment) => boolean;
  deleteRepayment: (borrowingId: string, repaymentIndex: number) => void;
  settleBorrowing: (borrowingId: string) => void;
  lendings: Lending[];
  addLending: (item: Omit<Lending, 'id' | 'returns' | 'status'>) => void;
  updateLending: (item: Lending) => void;
  deleteLending: (id: string) => void;
  addReturn: (lendingId: string, returnItem: Return) => boolean;
  deleteReturn: (lendingId: string, returnIndex: number) => void;
  writeOffLending: (lendingId: string) => void;
  savingsGoals: SavingsGoal[];
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'currentAmount'> & { initialDeposit?: number }) => void;
  addSavingsDeposit: (goalId: string, amount: number) => void;
  withdrawSavingsDeposit: (goalId: string, amount: number) => void;
  updateSavingsGoal: (goal: SavingsGoal) => void;
  deleteSavingsGoal: (goalId: string) => void;
  appointments: Appointment[];
  addAppointment: (appointment: Omit<Appointment, 'id' | 'status'>) => void;
  updateAppointment: (appointment: Appointment) => void;
  deleteAppointment: (id: string) => void;
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

const defaultCleanUser: User = {
  name: 'Sprout User',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
};

export const AppProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'dark');
  const [user, setUser] = useLocalStorage<User>('user', defaultCleanUser);
  const [familyMembers, setFamilyMembers] = useLocalStorage<FamilyMember[]>('familyMembers', []);
  const [transactionCategories, setTransactionCategories] = useLocalStorage<TransactionCategory[]>('transactionCategories', mockTransactionCategories);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
  const [bills, setBills] = useLocalStorage<Bill[]>('bills', []);
  const [medicines, setMedicines] = useLocalStorage<Medicine[]>('medicines', []);
  const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', []);
  const [taskLists, setTaskLists] = useLocalStorage<TaskList[]>('taskLists', []);
  const [notes, setNotes] = useLocalStorage<Note[]>('notes', []);
  const [notifications, setNotifications] = useLocalStorage<Notification[]>('notifications', []);
  const [notificationSettings, setNotificationSettings] = useLocalStorage<NotificationSettings>('notificationSettings', defaultNotificationSettings);
  const [cart, setCart] = useLocalStorage<CartItem[]>('cart', []);
  const [currency, setCurrency] = useLocalStorage<string>('currency', 'USD');
  const [language, setLanguage] = useLocalStorage<string>('language', 'en');
  const [medicalReports, setMedicalReports] = useLocalStorage<MedicalReport[]>('medicalReports', []);
  const [borrowings, setBorrowings] = useLocalStorage<Borrowing[]>('borrowings', []);
  const [lendings, setLendings] = useLocalStorage<Lending[]>('lendings', []);
  const [savingsGoals, setSavingsGoals] = useLocalStorage<SavingsGoal[]>('savingsGoals', []);
  const [appointments, setAppointments] = useLocalStorage<Appointment[]>('appointments', []);

  // Firebase Auth State
  const [googleFirebaseUser, setGoogleFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isGoogleAuthenticated, setIsGoogleAuthenticated] = useState<boolean>(false);
  const [needsGoogleReauth, setNeedsGoogleReauth] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [isGuestMode, setIsGuestMode] = useLocalStorage<boolean>('isGuestMode', true);
  const [includeGoogleCalendar, setIncludeGoogleCalendar] = useLocalStorage<boolean>('includeGoogleCalendar', true);
  const [isCalendarSyncing, setIsCalendarSyncing] = useState<boolean>(false);
  const [googleCalendarEvents, setGoogleCalendarEvents] = useState<CalendarEvent[]>([]);

  // Family Invite Pending State
  const [pendingInvite, setPendingInvite] = useState<FamilyInvite | null>(() => {
    try {
      const saved = localStorage.getItem('sprout_pending_invite');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // UI State
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const previousAlertIdsRef = useRef<Set<string>>(new Set());

  // URL Invitation Parameter Scanner
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const inviteId = params.get('inviteId');
      if (inviteId) {
        const invitePayload: FamilyInvite = {
          id: inviteId,
          inviterUid: params.get('inviterUid') || '',
          inviterName: decodeURIComponent(params.get('inviterName') || 'Family Admin'),
          inviterEmail: params.get('inviterEmail') || undefined,
          memberId: params.get('memberId') || undefined,
          memberName: decodeURIComponent(params.get('memberName') || 'Family Member'),
          recipientEmail: decodeURIComponent(params.get('recipientEmail') || ''),
          relation: decodeURIComponent(params.get('relation') || 'Family Member'),
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        setPendingInvite(invitePayload);
        localStorage.setItem('sprout_pending_invite', JSON.stringify(invitePayload));

        // Fetch fresh authoritative invite data from Firestore if available
        getInviteDocument(inviteId).then((freshDoc) => {
          if (freshDoc) {
            setPendingInvite(freshDoc);
            localStorage.setItem('sprout_pending_invite', JSON.stringify(freshDoc));
          }
        }).catch((err) => console.warn('Could not fetch invite document:', err));

        toast(`🌱 Family invite from ${invitePayload.inviterName} detected! Sign in or register to join.`, {
          icon: '💌',
          duration: 6000,
        });
      }
    } catch (err) {
      console.warn('Error reading invite link parameters:', err);
    }
  }, []);

  const unsubsRef = useRef<(() => void)[]>([]);

  // Firebase Auth State Listener & Real-time Cloud Sync
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      // Explicitly tear down any prior subscriptions
      unsubsRef.current.forEach(u => u && u());
      unsubsRef.current = [];

      if (fbUser) {
        setGoogleFirebaseUser(fbUser);
        setIsGoogleAuthenticated(true);
        setIsGuestMode(false);

        // Fetch user profile from Firestore
        const savedProfile = await getUserProfile(fbUser.uid);

        const isGoogleAccount = fbUser.providerData.some(p => p.providerId === 'google.com');
        const token = await getAccessToken();
        setNeedsGoogleReauth(Boolean(isGoogleAccount && !token));

        const updatedUser: User = {
          name: savedProfile?.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'Sprout User',
          avatar: savedProfile?.avatar || fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          email: fbUser.email || undefined,
          googleId: fbUser.uid,
          firebaseUid: fbUser.uid,
          isGoogleUser: isGoogleAccount,
        };
        setUser(updatedUser);

        if (savedProfile?.currency) setCurrency(savedProfile.currency);
        if (savedProfile?.language) setLanguage(savedProfile.language);
        if (savedProfile?.notificationSettings) setNotificationSettings(savedProfile.notificationSettings);

        // Sync user profile to Firestore
        saveUserProfile(fbUser.uid, {
          name: updatedUser.name,
          email: updatedUser.email,
          avatar: updatedUser.avatar,
          currency: savedProfile?.currency || currency,
          language: savedProfile?.language || language,
        });

        // Set up real-time Firestore collection listeners
        unsubsRef.current = [
          subscribeToUserSubcollection<FamilyMember>(fbUser.uid, 'familyMembers', (items) => {
            setFamilyMembers(items);
          }),
          subscribeToUserSubcollection<Medicine>(fbUser.uid, 'medicines', (items) => {
            setMedicines(items);
          }),
          subscribeToUserSubcollection<Bill>(fbUser.uid, 'bills', (items) => {
            setBills(items);
          }),
          subscribeToUserSubcollection<Appointment>(fbUser.uid, 'appointments', (items) => {
            setAppointments(items);
          }),
          subscribeToUserSubcollection<TransactionCategory>(fbUser.uid, 'transactionCategories', (items) => {
            if (items && items.length > 0) {
              setTransactionCategories(prev => {
                const itemMap = new Map(items.map(it => [it.id, it]));
                const merged = [...items];
                DEFAULT_TRANSACTION_CATEGORIES.forEach(defCat => {
                  if (!itemMap.has(defCat.id) && !items.some(it => it.name.toLowerCase() === defCat.name.toLowerCase())) {
                    merged.push(defCat);
                  }
                });
                return merged;
              });
            }
          }),
          subscribeToUserSubcollection<Transaction>(fbUser.uid, 'transactions', (items) => {
            setTransactions(items);
          }),
          subscribeToUserSubcollection<Task>(fbUser.uid, 'tasks', (items) => {
            setTasks(items);
          }),
          subscribeToUserSubcollection<TaskList>(fbUser.uid, 'taskLists', (items) => {
            setTaskLists(items);
          }),
          subscribeToUserSubcollection<Note>(fbUser.uid, 'notes', (items) => {
            setNotes(items);
          }),
          subscribeToUserSubcollection<MedicalReport>(fbUser.uid, 'medicalReports', (items) => {
            setMedicalReports(items);
          }),
          subscribeToUserSubcollection<Borrowing>(fbUser.uid, 'borrowings', (items) => {
            setBorrowings(items);
          }),
          subscribeToUserSubcollection<Lending>(fbUser.uid, 'lendings', (items) => {
            setLendings(items);
          }),
          subscribeToUserSubcollection<SavingsGoal>(fbUser.uid, 'savingsGoals', (items) => {
            setSavingsGoals(items);
          }),
          subscribeToUserSubcollection<Notification>(fbUser.uid, 'notifications', (items) => {
            setNotifications(items);
          }),
        ];
      } else {
        unsubsRef.current.forEach(u => u && u());
        unsubsRef.current = [];
        setGoogleFirebaseUser(null);
        setIsGoogleAuthenticated(false);
        setNeedsGoogleReauth(false);
      }
    });

    return () => {
      unsubsRef.current.forEach(u => u && u());
      unsubsRef.current = [];
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    // Initial data load simulation
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Derived lightweight signature for transactions and bills categories to prevent stale dependency issues
  const categoryMigrationSignature = useMemo(() => {
    const txSig = transactions.map(t => `${t.id}:${t.categoryId || ''}:${t.category || ''}`).join(';');
    const billSig = bills.map(b => `${b.id}:${b.categoryId || ''}:${typeof b.category === 'string' ? b.category : ''}`).join(';');
    return `${txSig}__${billSig}`;
  }, [transactions, bills]);

  // Category & Legacy Free-Text Migration for Transactions and Bills
  useEffect(() => {
    if (loading) return;

    let categoriesUpdated = false;
    let currentCategories = [...transactionCategories];

    // Ensure baseline default categories exist if empty
    if (currentCategories.length === 0) {
      currentCategories = [...DEFAULT_TRANSACTION_CATEGORIES];
      categoriesUpdated = true;
    }

    const ensureCategory = (catNameOrId?: string): string => {
      if (!catNameOrId) return currentCategories[0]?.id || 'cat-other';
      // 1. Direct ID match
      const existingById = currentCategories.find(c => c.id === catNameOrId);
      if (existingById) return existingById.id;
      // 2. Name match (case-insensitive)
      const normalized = String(catNameOrId).trim();
      const existingByName = currentCategories.find(c => c.name.toLowerCase() === normalized.toLowerCase());
      if (existingByName) return existingByName.id;
      
      // If catNameOrId looks like an internal ID (starts with "cat-" or "Cat-") or hex hash,
      // never treat it as a category display name! Safely fallback to cat-other.
      if (/^cat-[a-z0-9_-]+/i.test(normalized) || /^[0-9a-f]{8}(-[0-9a-f]{4}){0,4}$/i.test(normalized)) {
        const otherCat = currentCategories.find(c => c.id === 'cat-other' || c.name.toLowerCase() === 'other');
        return otherCat?.id || currentCategories[0]?.id || 'cat-other';
      }

      // 3. Create a new custom category from the legacy free-text string
      const titleCased = normalized.charAt(0).toUpperCase() + normalized.slice(1);
      const newCategory: TransactionCategory = {
        id: `cat-${uuidv4().slice(0, 8)}`,
        name: titleCased || 'Other',
        icon: 'HiOutlineTag',
        color: '#6366F1',
        isCustom: true,
      };
      currentCategories = [...currentCategories, newCategory];
      categoriesUpdated = true;
      if (googleFirebaseUser?.uid) {
        saveUserDocument(googleFirebaseUser.uid, 'transactionCategories', newCategory.id, newCategory);
      }
      return newCategory.id;
    };

    let transactionsUpdated = false;
    const migratedTransactions = transactions.map(tx => {
      if (!tx.categoryId || !currentCategories.some(c => c.id === tx.categoryId)) {
        const validId = ensureCategory(tx.categoryId || tx.category);
        transactionsUpdated = true;
        const updated = { ...tx, categoryId: validId };
        if (googleFirebaseUser?.uid) {
          saveUserDocument(googleFirebaseUser.uid, 'transactions', tx.id, updated);
        }
        return updated;
      }
      return tx;
    });

    let billsUpdated = false;
    const migratedBills = bills.map(bill => {
      if (!bill.categoryId || !currentCategories.some(c => c.id === bill.categoryId)) {
        const validId = ensureCategory(bill.categoryId || (typeof bill.category === 'string' ? bill.category : undefined));
        billsUpdated = true;
        const updated = { ...bill, categoryId: validId };
        if (googleFirebaseUser?.uid) {
          saveUserDocument(googleFirebaseUser.uid, 'bills', bill.id, updated);
        }
        return updated;
      }
      return bill;
    });

    if (categoriesUpdated) {
      setTransactionCategories(currentCategories);
    }
    if (transactionsUpdated) {
      setTransactions(migratedTransactions);
    }
    if (billsUpdated) {
      setBills(migratedBills);
    }
  }, [loading, categoryMigrationSignature]);

  // -------------------------------------------------------------
  // NOTIFICATION SYSTEM
  // -------------------------------------------------------------
  const addNotification = useCallback((notif: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotif: Notification = {
      id: uuidv4(),
      ...notif,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Save to Firestore if authenticated
    if (googleFirebaseUser?.uid) {
      saveUserDocument(googleFirebaseUser.uid, 'notifications', newNotif.id, newNotif);
    }
  }, [googleFirebaseUser, setNotifications]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (googleFirebaseUser?.uid) {
      saveUserDocument(googleFirebaseUser.uid, 'notifications', id, { read: true });
    }
  }, [googleFirebaseUser, setNotifications]);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (googleFirebaseUser?.uid) {
      notifications.forEach(n => {
        saveUserDocument(googleFirebaseUser.uid, 'notifications', n.id, { read: true });
      });
    }
  }, [googleFirebaseUser, notifications, setNotifications]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    if (googleFirebaseUser?.uid) {
      notifications.forEach(n => {
        deleteUserDocument(googleFirebaseUser.uid, 'notifications', n.id);
      });
    }
  }, [googleFirebaseUser, notifications, setNotifications]);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (googleFirebaseUser?.uid) {
      deleteUserDocument(googleFirebaseUser.uid, 'notifications', id);
    }
  }, [googleFirebaseUser, setNotifications]);

  const updateNotificationSettings = useCallback((settings: Partial<NotificationSettings>) => {
    setNotificationSettings(prev => {
      const updated = { ...prev, ...settings };
      if (googleFirebaseUser?.uid) {
        saveUserProfile(googleFirebaseUser.uid, { notificationSettings: updated });
      }
      return updated;
    });
  }, [googleFirebaseUser, setNotificationSettings]);

  const requestBrowserNotifications = async (): Promise<boolean> => {
    const permission = await requestBrowserNotificationPermission();
    if (permission === 'granted') {
      updateNotificationSettings({ browserPushEnabled: true });
      toast.success('Browser notifications enabled!');
      sendBrowserNotification('🌱 Sprout Notifications Connected', {
        body: 'You will now receive dose alerts and bill reminders directly on your device.',
      });
      return true;
    } else {
      updateNotificationSettings({ browserPushEnabled: false });
      toast.error('Notification permission was not granted.');
      return false;
    }
  };

  const sendTestNotification = () => {
    if (notificationSettings.soundEnabled) {
      playNotificationSound();
    }
    addNotification({
      message: '🔔 Test notification: Sprout real-time alert system is active!',
      type: 'info',
      domain: 'system',
      path: '/settings',
    });
    if (notificationSettings.browserPushEnabled) {
      sendBrowserNotification('🌱 Sprout System Alert', {
        body: 'Real-time notifications are working perfectly on Sprout!',
      });
    }
    toast.success('Test notification triggered!');
  };

  // Real-time notification scanner
  useEffect(() => {
    const scanAlerts = () => {
      const systemAlerts = generateSystemAlerts({
        medicines,
        bills,
        appointments,
        tasks,
        familyMembers,
        settings: notificationSettings,
      });

      // Check for newly triggered urgent alerts
      systemAlerts.forEach((alert) => {
        if (!previousAlertIdsRef.current.has(alert.id)) {
          previousAlertIdsRef.current.add(alert.id);

          // If browser push is enabled, send native push notification
          if (notificationSettings.browserPushEnabled) {
            sendBrowserNotification('🌱 Sprout Alert', {
              body: alert.message,
            });
          }
          // If sound is enabled, play chime
          if (notificationSettings.soundEnabled && alert.type === 'warning') {
            playNotificationSound();
          }
        }
      });

      // Update notifications list
      setNotifications(prev => {
        const customNotifs = prev.filter(n => !n.id.startsWith('alert-'));
        const newFormattedAlerts: Notification[] = systemAlerts.map(a => {
          const existing = prev.find(p => p.id === a.id);
          return {
            ...a,
            read: existing ? existing.read : false,
          };
        });

        return [...newFormattedAlerts, ...customNotifs].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    };

    scanAlerts();
    const interval = setInterval(scanAlerts, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [medicines, bills, appointments, tasks, familyMembers, notificationSettings, setNotifications]);

  // -------------------------------------------------------------
  // FIREBASE AUTHENTICATION ACTIONS
  // -------------------------------------------------------------
  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      setIsGoogleLoading(true);
      const res = await signInWithGoogle();
      if (res?.cancelled) {
        // User closed or dismissed the popup
        return false;
      }
      if (res?.user) {
        setGoogleFirebaseUser(res.user);
        setIsGoogleAuthenticated(true);
        setNeedsGoogleReauth(false);
        setUser(prev => ({
          ...prev,
          name: res.user.displayName || prev.name,
          avatar: res.user.photoURL || prev.avatar,
          email: res.user.email || undefined,
          googleId: res.user.uid,
          firebaseUid: res.user.uid,
          isGoogleUser: true,
        }));
        addNotification({
          message: `Connected Google Account (${res.user.email || res.user.displayName})`,
          type: 'success',
          domain: 'system',
          path: '/settings',
        });
        if (includeGoogleCalendar) {
          fetchGoogleEvents();
        }
        return true;
      }
      return false;
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        return false;
      }
      console.warn('Google Sign In:', err?.message || err);
      throw err;
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const reconnectGoogle = async (): Promise<boolean> => {
    try {
      setIsGoogleLoading(true);
      const res = await signInWithGoogle();
      if (res?.cancelled) {
        return false;
      }
      if (res?.accessToken) {
        setNeedsGoogleReauth(false);
        setIsGoogleAuthenticated(true);
        if (res.user) {
          setGoogleFirebaseUser(res.user);
        }
        toast.success('Google account reconnected successfully!');
        if (includeGoogleCalendar) {
          fetchGoogleEvents();
        }
        return true;
      }
      return false;
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        return false;
      }
      console.warn('Google Reconnect:', err?.message || err);
      toast.error('Failed to reconnect Google account. Please try again.');
      return false;
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string): Promise<boolean> => {
    try {
      setIsGoogleLoading(true);
      const fbUser = await signInWithEmail(email, pass);
      setGoogleFirebaseUser(fbUser);
      setIsGoogleAuthenticated(true);
      setUser(prev => ({
        ...prev,
        name: fbUser.displayName || prev.name || 'Sprout User',
        avatar: fbUser.photoURL || prev.avatar,
        email: fbUser.email || undefined,
        googleId: fbUser.uid,
        firebaseUid: fbUser.uid,
      }));
      addNotification({
        message: `Signed in as ${fbUser.email}`,
        type: 'success',
        domain: 'system',
      });
      return true;
    } catch (err: any) {
      console.error('Email sign in failed:', err);
      throw err;
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const signUpWithEmailHandler = async (email: string, pass: string, name?: string): Promise<boolean> => {
    try {
      setIsGoogleLoading(true);
      const fbUser = await signUpWithEmail(email, pass, name);
      setGoogleFirebaseUser(fbUser);
      setIsGoogleAuthenticated(true);
      setUser(prev => ({
        ...prev,
        name: name || prev.name || 'Sprout User',
        email: fbUser.email || undefined,
        googleId: fbUser.uid,
        firebaseUid: fbUser.uid,
      }));
      addNotification({
        message: `Account created for ${email}`,
        type: 'success',
        domain: 'system',
      });
      return true;
    } catch (err: any) {
      console.error('Sign up failed:', err);
      throw err;
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const resetUserPassword = async (email: string): Promise<void> => {
    await resetPassword(email);
  };

  const logout = async () => {
    try {
      await logoutFirebase();
      setGoogleFirebaseUser(null);
      setIsGoogleAuthenticated(false);
      setIsGuestMode(false);
      setGoogleCalendarEvents([]);
      setFamilyMembers([]);
      setMedicines([]);
      setBills([]);
      setTransactions([]);
      setTasks([]);
      setTaskLists([]);
      setAppointments([]);
      setSavingsGoals([]);
      setBorrowings([]);
      setLendings([]);
      setMedicalReports([]);
      setNotes([]);
      setNotifications([]);
      setTransactionCategories(mockTransactionCategories);
      setUser(defaultCleanUser);
      toast.success('Signed out of Sprout.');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const logoutFromGoogle = logout;

  const seedSampleDataToCloud = async (): Promise<boolean> => {
    try {
      if (googleFirebaseUser?.uid) {
        toast.loading('Populating starter sample data into your cloud database...');
        await seedUserData(googleFirebaseUser.uid, {
          familyMembers: mockFamilyMembers,
          transactionCategories: mockTransactionCategories,
          medicines: mockMedicines,
          bills: mockBills,
          transactions: mockTransactions,
          tasks: mockTasks,
          taskLists: mockTaskLists,
          appointments: mockAppointments,
          savingsGoals: mockSavingsGoals,
          borrowings: mockBorrowings,
          lendings: mockLendings,
          medicalReports: mockMedicalReports,
          notes: mockNotes,
        });
        toast.dismiss();
        toast.success('Sample data synced to your cloud account!');
        return true;
      } else {
        setFamilyMembers(mockFamilyMembers);
        setTransactionCategories(mockTransactionCategories);
        setMedicines(mockMedicines);
        setBills(mockBills);
        setTransactions(mockTransactions);
        setTasks(mockTasks);
        setTaskLists(mockTaskLists);
        setAppointments(mockAppointments);
        setSavingsGoals(mockSavingsGoals);
        setBorrowings(mockBorrowings);
        setLendings(mockLendings);
        setMedicalReports(mockMedicalReports);
        setNotes(mockNotes);
        toast.success('Sample data loaded into local preview!');
        return true;
      }
    } catch (err: any) {
      toast.dismiss();
      console.error('Failed to populate data:', err);
      toast.error('Failed to populate data');
      return false;
    }
  };

  const clearAllUserData = async (): Promise<void> => {
    try {
      if (googleFirebaseUser?.uid) {
        toast.loading('Clearing all synced records from cloud storage...');
        await clearAllCloudUserData(googleFirebaseUser.uid);
        toast.dismiss();
      }
      setFamilyMembers([]);
      setMedicines([]);
      setBills([]);
      setTransactions([]);
      setTasks([]);
      setTaskLists([]);
      setAppointments([]);
      setSavingsGoals([]);
      setBorrowings([]);
      setLendings([]);
      setMedicalReports([]);
      setNotes([]);
      setNotifications([]);
      setCart([]);
      toast.success(googleFirebaseUser?.uid ? 'All cloud and local records cleared.' : 'All local session records cleared.');
    } catch (err) {
      toast.dismiss();
      console.error('Error clearing user records:', err);
      toast.error('Failed to clear records');
    }
  };

  // -------------------------------------------------------------
  // GOOGLE CALENDAR & WORKSPACE
  // -------------------------------------------------------------
  const fetchGoogleEvents = useCallback(async (): Promise<boolean> => {
    try {
      setIsCalendarSyncing(true);
      const events = await fetchGoogleCalendarEvents();
      setGoogleCalendarEvents(events);
      return true;
    } catch (err) {
      console.error('Failed to fetch Google Calendar events:', err);
      return false;
    } finally {
      setIsCalendarSyncing(false);
    }
  }, []);

  const syncAppointmentToGoogle = async (appointmentId: string): Promise<boolean> => {
    const appt = appointments.find(a => a.id === appointmentId);
    if (!appt) return false;

    const member = familyMembers.find(m => m.id === appt.memberId);
    const result = await syncAppointmentToGoogleCalendar(appt, member);

    if (result.success) {
      const updated = { ...appt, googleEventId: result.googleEventId || appt.googleEventId, syncedWithGoogle: true };
      setAppointments(prev => prev.map(a => a.id === appointmentId ? updated : a));
      if (googleFirebaseUser?.uid) {
        saveUserDocument(googleFirebaseUser.uid, 'appointments', appointmentId, updated);
      }
      addNotification({
        message: `Appointment with ${appt.doctorName} synced to Google Calendar.`,
        type: 'success',
        domain: 'health',
        path: '/calendar',
      });
      return true;
    }
    return false;
  };

  const syncBillToGoogle = async (billId: string): Promise<boolean> => {
    const bill = bills.find(b => b.id === billId);
    if (!bill) return false;

    const currencySymbol = availableCurrencies.find(c => c.code === currency)?.symbol || '$';
    const result = await syncBillToGoogleCalendar(bill, currencySymbol);

    if (result.success) {
      addNotification({
        message: `Bill reminder '${bill.name}' synced to Google Calendar.`,
        type: 'success',
        domain: 'finance',
        path: '/calendar',
      });
      return true;
    }
    return false;
  };

  const syncAllToGoogleCalendar = async (): Promise<{ appointmentsSynced: number; billsSynced: number }> => {
    setIsCalendarSyncing(true);
    let apptCount = 0;
    let billCount = 0;

    try {
      for (const appt of appointments) {
        if (appt.status === 'upcoming') {
          const member = familyMembers.find(m => m.id === appt.memberId);
          const res = await syncAppointmentToGoogleCalendar(appt, member);
          if (res.success) {
            apptCount++;
            const updated = { ...appt, googleEventId: res.googleEventId || appt.googleEventId, syncedWithGoogle: true };
            setAppointments(prev => prev.map(a => a.id === appt.id ? updated : a));
            if (googleFirebaseUser?.uid) {
              saveUserDocument(googleFirebaseUser.uid, 'appointments', appt.id, updated);
            }
          }
        }
      }

      const currencySymbol = availableCurrencies.find(c => c.code === currency)?.symbol || '$';
      for (const bill of bills) {
        if (!bill.paid) {
          const res = await syncBillToGoogleCalendar(bill, currencySymbol);
          if (res.success) {
            billCount++;
          }
        }
      }

      await fetchGoogleEvents();

      addNotification({
        message: `Google Calendar Synced: ${apptCount} appointments, ${billCount} bills.`,
        type: 'success',
        domain: 'system',
        path: '/calendar',
      });
    } catch (error) {
      console.error('Sync all error:', error);
    } finally {
      setIsCalendarSyncing(false);
    }

    return { appointmentsSynced: apptCount, billsSynced: billCount };
  };

  // -------------------------------------------------------------
  // FAMILY INVITATION, JOINING & MEMBER MANAGEMENT
  // -------------------------------------------------------------
  const generateFamilyInviteLink = useCallback(async (
    memberId?: string, 
    email?: string, 
    customMessage?: string
  ): Promise<{ inviteId: string; inviteLink: string }> => {
    const currentUid = googleFirebaseUser?.uid || user.googleId || user.firebaseUid || 'family_admin';
    const inviterName = user.name || googleFirebaseUser?.displayName || 'Family Organizer';
    const randomEntropy = generateSecureRandomHex(16);
    const inviteId = `inv_${randomEntropy}`;
    const now = new Date().toISOString();

    const member = memberId ? familyMembers.find(m => m.id === memberId) : undefined;
    const memberName = member?.name || '';
    const relation = member?.relation || 'Family Member';
    const recipientEmail = email || member?.email || '';

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sprout-family.app';
    const inviteLink = `${origin}/join?inviteId=${inviteId}&inviterUid=${encodeURIComponent(currentUid)}&inviterName=${encodeURIComponent(inviterName)}${memberId ? `&memberId=${encodeURIComponent(memberId)}` : ''}${memberName ? `&memberName=${encodeURIComponent(memberName)}` : ''}${relation ? `&relation=${encodeURIComponent(relation)}` : ''}${recipientEmail ? `&recipientEmail=${encodeURIComponent(recipientEmail)}` : ''}`;

    // Store in Firestore family_invites collection
    const inviteRecord: FamilyInvite = {
      id: inviteId,
      inviterUid: currentUid,
      inviterName,
      inviterEmail: user.email || googleFirebaseUser?.email || undefined,
      memberId: memberId || undefined,
      memberName: memberName || undefined,
      recipientEmail: recipientEmail || undefined,
      relation: relation || 'Family Member',
      customMessage: customMessage || undefined,
      status: 'pending',
      createdAt: now,
    };

    try {
      await saveInviteDocument(inviteId, inviteRecord);
    } catch (e) {
      console.warn('Could not save invite record to Firestore immediately:', e);
    }

    // Invalidate any previously pending invite(s) for this member so old links cannot be reused
    if (memberId && currentUid) {
      const prevInvites = [
        ...(member?.inviteId ? [member.inviteId] : []),
        ...(member?.inviteHistory || [])
      ];
      cancelPendingInvitesForMember(currentUid, memberId, prevInvites, 'superseded').catch(e => {
        console.warn('Failed to mark previous invites superseded:', e);
      });
    }

    if (memberId && member) {
      const updatedHistory = Array.from(new Set([...(member.inviteHistory || []), ...(member.inviteId ? [member.inviteId] : []), inviteId]));
      const updatedMember: FamilyMember = {
        ...member,
        email: recipientEmail || member.email,
        inviteStatus: 'invited',
        inviteId,
        inviteHistory: updatedHistory,
        inviteSentAt: now,
      };
      setFamilyMembers(prev => prev.map(m => m.id === memberId ? updatedMember : m));
      if (googleFirebaseUser?.uid) {
        saveUserDocument(googleFirebaseUser.uid, 'familyMembers', memberId, updatedMember);
      }
    }

    return { inviteId, inviteLink };
  }, [googleFirebaseUser, user, familyMembers]);

  const copyFamilyInviteLink = useCallback(async (memberId?: string, email?: string): Promise<string> => {
    try {
      const { inviteLink } = await generateFamilyInviteLink(memberId, email);
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(inviteLink);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = inviteLink;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      const member = memberId ? familyMembers.find(m => m.id === memberId) : undefined;
      const targetName = member?.name ? `${member.name}'s` : 'Family';
      toast.success(`📋 ${targetName} invite link copied! Anyone with this link can join your family circle.`, {
        duration: 5000,
        icon: '🔗',
      });
      return inviteLink;
    } catch (err) {
      console.error('Copy link error:', err);
      toast.error('Failed to copy link to clipboard');
      return '';
    }
  }, [generateFamilyInviteLink, familyMembers]);

  const getInviteDetails = useCallback(async (inviteId: string): Promise<FamilyInvite | null> => {
    try {
      const doc = await getInviteDocument(inviteId);
      if (doc) return doc;
    } catch (err) {
      console.warn('Error fetching invite doc from Firestore:', err);
    }
    return null;
  }, []);

  const isAcceptingInviteRef = useRef(false);

  const acceptPendingInvite = useCallback(async (inviteToAccept?: FamilyInvite) => {
    const targetInvite = inviteToAccept || pendingInvite;
    if (!targetInvite) return;
    const currentUid = googleFirebaseUser?.uid || user.googleId || user.firebaseUid;
    if (!currentUid) return;

    if (isAcceptingInviteRef.current) return;
    isAcceptingInviteRef.current = true;

    try {
      // Validate invite is still pending and not cancelled or superseded
      const freshInvite = await getInviteDocument(targetInvite.id);
      const effectiveInvite = freshInvite || targetInvite;
      if (effectiveInvite.status !== 'pending') {
        toast.error('This invitation link is no longer active or has been superseded.');
        setPendingInvite(null);
        localStorage.removeItem('sprout_pending_invite');
        return;
      }

      const now = new Date().toISOString();
      const userEmail = googleFirebaseUser?.email || user.email || targetInvite.recipientEmail || 'member@sprout.family';
      const userName = user.name || googleFirebaseUser?.displayName || targetInvite.memberName || 'Family Member';

      // 1. Update family_invites/{inviteId} in Firestore with accepter metadata
      await updateInviteDocument(targetInvite.id, {
        status: 'accepted',
        acceptedAt: now,
        acceptedByUid: currentUid,
        acceptedByEmail: userEmail,
        acceptedByName: userName,
      });

      // Clear pending invite immediately so repeat auto-triggers do not re-fire
      setPendingInvite(null);
      localStorage.removeItem('sprout_pending_invite');

      // 2. Create or link this member in the joined user's local and Firestore state (their own users/{currentUid}/familyMembers)
      const memberRecord: FamilyMember = {
        id: targetInvite.memberId || uuidv4(),
        name: userName,
        relation: targetInvite.relation || 'Family Member',
        age: 28,
        avatar: user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        email: userEmail,
        inviteStatus: 'accepted',
        inviteId: targetInvite.id,
        linkedUid: currentUid,
        linkedSince: now,
      };

      // Also create a record for the inviter in the invitee's family circle
      const inviterMemberRecord: FamilyMember = {
        id: `inviter_${targetInvite.inviterUid.slice(0, 8)}`,
        name: targetInvite.inviterName || 'Family Organizer',
        relation: 'Family Organizer',
        age: 35,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        email: targetInvite.inviterEmail,
        inviteStatus: 'accepted',
        linkedUid: targetInvite.inviterUid,
        inviteId: targetInvite.id,
        linkedSince: now,
      };

      setFamilyMembers(prev => {
        let list = [...prev];
        // Ensure self is in list
        const selfExists = list.some(m => m.id === memberRecord.id || (m.email && m.email.toLowerCase() === userEmail.toLowerCase()));
        if (selfExists) {
          list = list.map(m => (m.id === memberRecord.id || (m.email && m.email.toLowerCase() === userEmail.toLowerCase())) ? {
            ...m,
            inviteStatus: 'accepted' as const,
            linkedUid: currentUid,
            inviteId: targetInvite.id,
            linkedSince: now,
          } : m);
        } else {
          list.push(memberRecord);
        }

        // Ensure inviter is in list
        if (targetInvite.inviterUid && !list.some(m => m.linkedUid === targetInvite.inviterUid || m.name === targetInvite.inviterName)) {
          list.push(inviterMemberRecord);
        }
        return list;
      });

      if (currentUid) {
        saveUserDocument(currentUid, 'familyMembers', memberRecord.id, memberRecord);
        if (targetInvite.inviterUid) {
          saveUserDocument(currentUid, 'familyMembers', inviterMemberRecord.id, inviterMemberRecord);
        }
      }

      toast.success(`🎉 You've joined ${targetInvite.inviterName}'s family circle!`, {
        duration: 7000,
      });

      addNotification({
        message: `Joined ${targetInvite.inviterName}'s family circle as ${targetInvite.memberName || userName} (${targetInvite.relation || 'Member'})`,
        type: 'success',
        domain: 'system',
        path: '/family',
      });
    } catch (err: any) {
      console.error('Error accepting family invite:', err);
      toast.error('Failed to link family account');
    } finally {
      isAcceptingInviteRef.current = false;
    }
  }, [pendingInvite, googleFirebaseUser, user, setFamilyMembers, addNotification]);

  // Automatically link invite when authenticated and pendingInvite exists
  useEffect(() => {
    if (googleFirebaseUser?.uid && pendingInvite && pendingInvite.status === 'pending') {
      acceptPendingInvite(pendingInvite);
    }
  }, [googleFirebaseUser?.uid, pendingInvite, acceptPendingInvite]);

  // -------------------------------------------------------------
  // REAL-TIME LISTENER FOR INVITER'S ACCEPTED FAMILY INVITES
  // -------------------------------------------------------------
  // Listens to family_invites where inviterUid == currentUid.
  // When an invite transitions to 'accepted', the inviter's own client
  // writes the updated familyMembers entry to their own subcollection.
  useEffect(() => {
    if (!googleFirebaseUser?.uid) return;
    const inviterUid = googleFirebaseUser.uid;

    const unsub = subscribeToInviterInvites(inviterUid, (invites) => {
      const acceptedInvites = invites.filter(i => i.status === 'accepted' && i.acceptedByUid);
      if (acceptedInvites.length === 0) return;

      setFamilyMembers(prevMembers => {
        let hasChanges = false;
        const updatedList = [...prevMembers];

        acceptedInvites.forEach(invite => {
          const existingIndex = updatedList.findIndex(m => 
            (invite.memberId && m.id === invite.memberId) ||
            (m.inviteId && m.inviteId === invite.id) ||
            (m.linkedUid && m.linkedUid === invite.acceptedByUid) ||
            (invite.acceptedByEmail && m.email && m.email.toLowerCase() === invite.acceptedByEmail.toLowerCase()) ||
            (invite.recipientEmail && m.email && m.email.toLowerCase() === invite.recipientEmail.toLowerCase())
          );

          if (existingIndex >= 0) {
            const existing = updatedList[existingIndex];
            if (existing.inviteStatus !== 'accepted' || existing.linkedUid !== invite.acceptedByUid) {
              const updated: FamilyMember = {
                ...existing,
                name: invite.acceptedByName || existing.name,
                email: invite.acceptedByEmail || existing.email,
                inviteStatus: 'accepted',
                linkedUid: invite.acceptedByUid,
                inviteId: invite.id,
                linkedSince: invite.acceptedAt || new Date().toISOString(),
              };
              updatedList[existingIndex] = updated;
              hasChanges = true;

              saveUserDocument(inviterUid, 'familyMembers', updated.id, updated);

              toast.success(`🎉 ${updated.name} accepted your invite and joined your family circle!`, {
                duration: 6000,
              });
              addNotification({
                message: `${updated.name} accepted your invitation and joined your family circle!`,
                type: 'success',
                domain: 'system',
                path: '/family',
              });
            }
          } else {
            const newMemberId = invite.memberId || uuidv4();
            const newMember: FamilyMember = {
              id: newMemberId,
              name: invite.acceptedByName || invite.memberName || 'Family Member',
              relation: invite.relation || 'Family Member',
              age: 28,
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
              email: invite.acceptedByEmail || invite.recipientEmail,
              inviteStatus: 'accepted',
              linkedUid: invite.acceptedByUid,
              inviteId: invite.id,
              linkedSince: invite.acceptedAt || new Date().toISOString(),
            };
            updatedList.push(newMember);
            hasChanges = true;

            saveUserDocument(inviterUid, 'familyMembers', newMemberId, newMember);

            toast.success(`🎉 ${newMember.name} joined your family circle!`, {
              duration: 6000,
            });
            addNotification({
              message: `${newMember.name} joined your family circle!`,
              type: 'success',
              domain: 'system',
              path: '/family',
            });
          }
        });

        return hasChanges ? updatedList : prevMembers;
      });
    });

    return () => {
      if (unsub) unsub();
    };
  }, [googleFirebaseUser?.uid, addNotification]);

  const sendFamilyInvite = async (
    memberId: string, 
    email: string, 
    customMessage?: string
  ): Promise<{ success: boolean; inviteLink?: string; error?: string; mailtoFallback?: string }> => {
    const member = familyMembers.find(m => m.id === memberId);
    if (!member) {
      return { success: false, error: 'Family member not found' };
    }

    const { inviteId, inviteLink } = await generateFamilyInviteLink(memberId, email, customMessage);
    const inviterName = user.name || googleFirebaseUser?.displayName || 'Family Organizer';

    const result = await sendFamilyInviteViaGmail({
      toEmail: email,
      recipientName: member.name,
      inviterName,
      inviterEmail: user.email,
      relation: member.relation,
      customMessage: customMessage || undefined,
      inviteLink,
    });

    if (result.success) {
      addNotification({
        message: `Family invite sent to ${member.name} (${email}) via Gmail!`,
        type: 'success',
        domain: 'system',
        path: '/family',
      });
    }

    return {
      ...result,
      inviteLink,
    };
  };

  const cancelFamilyInvite = async (memberId: string): Promise<boolean> => {
    const member = familyMembers.find(m => m.id === memberId);
    if (!member) return false;

    const currentUid = googleFirebaseUser?.uid || user.googleId || user.firebaseUid;
    const allInvitesToCancel = [
      ...(member.inviteId ? [member.inviteId] : []),
      ...(member.inviteHistory || [])
    ];

    try {
      if (currentUid) {
        await cancelPendingInvitesForMember(currentUid, memberId, allInvitesToCancel, 'cancelled');
      } else if (member.inviteId) {
        await updateInviteDocument(member.inviteId, { status: 'cancelled' });
      }

      const updatedMember: FamilyMember = {
        ...member,
        inviteStatus: 'none',
        inviteId: undefined,
        inviteHistory: [],
        inviteSentAt: undefined,
      };

      setFamilyMembers(prev => prev.map(m => m.id === memberId ? updatedMember : m));
      if (googleFirebaseUser?.uid) {
        await saveUserDocument(googleFirebaseUser.uid, 'familyMembers', memberId, updatedMember);
      }

      toast.success(`Cancelled invitation for ${member.name}.`);
      addNotification({
        message: `Invitation for ${member.name} was cancelled.`,
        type: 'info',
        domain: 'system',
        path: '/family',
      });
      return true;
    } catch (err: any) {
      console.error('Error cancelling invite:', err);
      toast.error('Failed to cancel invite');
      return false;
    }
  };

  const deleteFamilyMember = async (id: string) => {
    const member = familyMembers.find(m => m.id === id);
    if (member?.inviteId) {
      try {
        await updateInviteDocument(member.inviteId, { status: 'cancelled' });
      } catch (err) {
        console.warn('Could not cancel invite record:', err);
      }
    }

    setFamilyMembers(prev => prev.filter(m => m.id !== id));
    // Clean up medicines and appointments assigned to this member
    setMedicines(prev => prev.filter(med => med.memberId !== id));
    setAppointments(prev => prev.filter(appt => appt.memberId !== id));

    if (googleFirebaseUser?.uid) {
      await deleteUserDocument(googleFirebaseUser.uid, 'familyMembers', id);
      const memberMeds = medicines.filter(med => med.memberId === id);
      for (const med of memberMeds) {
        await deleteUserDocument(googleFirebaseUser.uid, 'medicines', med.id);
      }
      const memberAppts = appointments.filter(a => a.memberId === id);
      for (const appt of memberAppts) {
        await deleteUserDocument(googleFirebaseUser.uid, 'appointments', appt.id);
      }
    }

    toast.success(`${member ? member.name : 'Member'} removed from your family.`);
    addNotification({
      message: `${member ? member.name : 'Member'} was removed from your family circle.`,
      type: 'info',
      domain: 'system',
      path: '/family',
    });
  };

  // -------------------------------------------------------------
  // CORE ENTITY ACTIONS (WITH FIRESTORE PERSISTENCE)
  // -------------------------------------------------------------
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };
  
  const updateUser = (updatedUser: Partial<User>) => {
    setUser(prev => {
      const neu = { ...prev, ...updatedUser };
      if (googleFirebaseUser?.uid) {
        saveUserProfile(googleFirebaseUser.uid, neu);
      }
      return neu;
    });
  };

  const addFamilyMember = (member: Omit<FamilyMember, 'id'>) => {
    const newMember: FamilyMember = { ...member, id: uuidv4() };
    setFamilyMembers(prev => [...prev, newMember]);
    if (googleFirebaseUser?.uid) {
      saveUserDocument(googleFirebaseUser.uid, 'familyMembers', newMember.id, newMember);
    }
  };

  const updateFamilyMember = (member: FamilyMember) => {
    setFamilyMembers(prev => prev.map(m => m.id === member.id ? member : m));
    if (googleFirebaseUser?.uid) {
      saveUserDocument(googleFirebaseUser.uid, 'familyMembers', member.id, member);
    }
  };
  
  const addTransaction = (transaction: Omit<Transaction, 'id'>): Transaction => {
    const newTransaction: Transaction = {
      id: uuidv4(),
      ...transaction,
      categoryId: transaction.categoryId || 'cat-other',
    };
    setTransactions(prev => [newTransaction, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    if (googleFirebaseUser?.uid) {
      saveUserDocument(googleFirebaseUser.uid, 'transactions', newTransaction.id, newTransaction);
    }
    return newTransaction;
  };
  
  const updateTransaction = (updatedTransaction: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
    if (googleFirebaseUser?.uid) {
      saveUserDocument(googleFirebaseUser.uid, 'transactions', updatedTransaction.id, updatedTransaction);
    }
  };
  
  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    if (googleFirebaseUser?.uid) {
      deleteUserDocument(googleFirebaseUser.uid, 'transactions', id);
    }
  };

  const addTransactionCategory = (category: Omit<TransactionCategory, 'id' | 'isCustom'> & { isCustom?: boolean }): TransactionCategory => {
    const newCat: TransactionCategory = {
      id: `cat-${uuidv4().slice(0, 8)}`,
      name: category.name.trim(),
      icon: category.icon || 'HiOutlineTag',
      color: category.color || '#6366F1',
      isCustom: category.isCustom !== false,
    };
    setTransactionCategories(prev => [...prev, newCat]);
    if (googleFirebaseUser?.uid) {
      saveUserDocument(googleFirebaseUser.uid, 'transactionCategories', newCat.id, newCat);
    }
    return newCat;
  };

  const updateTransactionCategory = (category: TransactionCategory) => {
    setTransactionCategories(prev => {
      const exists = prev.some(c => c.id === category.id);
      if (exists) {
        return prev.map(c => c.id === category.id ? category : c);
      }
      return [...prev, category];
    });

    if (googleFirebaseUser?.uid) {
      saveUserDocument(googleFirebaseUser.uid, 'transactionCategories', category.id, category);
    }

    // Sync updated category name and details to existing transactions
    setTransactions(prev => prev.map(t => {
      if (t.categoryId === category.id) {
        const updated = { ...t, category: category.name };
        if (googleFirebaseUser?.uid) {
          saveUserDocument(googleFirebaseUser.uid, 'transactions', t.id, updated);
        }
        return updated;
      }
      return t;
    }));

    // Sync updated category name to existing bills
    setBills(prev => prev.map(b => {
      if (b.categoryId === category.id) {
        const updated = { ...b, category: category.name };
        if (googleFirebaseUser?.uid) {
          saveUserDocument(googleFirebaseUser.uid, 'bills', b.id, updated);
        }
        return updated;
      }
      return b;
    }));
  };

  const mergeTransactionCategories = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const targetCat = transactionCategories.find(c => c.id === targetId);
    if (!targetCat) return;

    // 1. Reassign affected transactions
    setTransactions(prev => prev.map(t => {
      if (t.categoryId === sourceId) {
        const updated = { ...t, categoryId: targetId, category: targetCat.name };
        if (googleFirebaseUser?.uid) {
          saveUserDocument(googleFirebaseUser.uid, 'transactions', t.id, updated);
        }
        return updated;
      }
      return t;
    }));

    // 2. Reassign affected bills
    setBills(prev => prev.map(b => {
      if (b.categoryId === sourceId) {
        const updated = { ...b, categoryId: targetId, category: targetCat.name };
        if (googleFirebaseUser?.uid) {
          saveUserDocument(googleFirebaseUser.uid, 'bills', b.id, updated);
        }
        return updated;
      }
      return b;
    }));

    // 3. Delete source category
    setTransactionCategories(prev => prev.filter(c => c.id !== sourceId));
    if (googleFirebaseUser?.uid) {
      deleteUserDocument(googleFirebaseUser.uid, 'transactionCategories', sourceId);
    }
  };

  const deleteTransactionCategory = (id: string) => {
    const fallbackCategory = transactionCategories.find(c => c.id !== id && (c.id === 'cat-other' || c.name.toLowerCase() === 'other')) 
      || transactionCategories.find(c => c.id !== id) 
      || DEFAULT_TRANSACTION_CATEGORIES[DEFAULT_TRANSACTION_CATEGORIES.length - 1];

    const fallbackId = fallbackCategory.id;

    // Remove category
    setTransactionCategories(prev => prev.filter(c => c.id !== id));
    if (googleFirebaseUser?.uid) {
      deleteUserDocument(googleFirebaseUser.uid, 'transactionCategories', id);
    }

    // Reassign affected transactions
    setTransactions(prev => prev.map(t => {
      if (t.categoryId === id) {
        const updated = { ...t, categoryId: fallbackId };
        if (googleFirebaseUser?.uid) {
          saveUserDocument(googleFirebaseUser.uid, 'transactions', t.id, updated);
        }
        return updated;
      }
      return t;
    }));

    // Reassign affected bills
    setBills(prev => prev.map(b => {
      if (b.categoryId === id) {
        const updated = { ...b, categoryId: fallbackId };
        if (googleFirebaseUser?.uid) {
          saveUserDocument(googleFirebaseUser.uid, 'bills', b.id, updated);
        }
        return updated;
      }
      return b;
    }));
  };
  
  const addBill = (bill: Omit<Bill, 'id' | 'paid' | 'paidOn'>) => {
    const newBill: Bill = { 
      ...bill, 
      id: uuidv4(), 
      paid: false,
      categoryId: bill.categoryId || 'cat-other',
    };
    setBills(prev => [...prev, newBill]);
    if (googleFirebaseUser?.uid) {
      saveUserDocument(googleFirebaseUser.uid, 'bills', newBill.id, newBill);
    }
  };
  
  const updateBill = (updatedBill: Bill): boolean => {
    const originalBill = bills.find(b => b.id === updatedBill.id);
    let transactionCreated = false;
    const finalBill = { ...updatedBill };

    if (originalBill && !originalBill.paid && finalBill.paid) {
        const createdTx = addTransaction({
            description: finalBill.name,
            amount: finalBill.amount,
            type: TransactionType.EXPENSE,
            categoryId: finalBill.categoryId || 'cat-other',
            category: typeof finalBill.category === 'string' ? finalBill.category : undefined,
            date: new Date().toISOString(),
            memberId: finalBill.memberId,
        });
        transactionCreated = true;
        finalBill.paidOn = new Date().toISOString();
        finalBill.paymentTransactionId = createdTx.id;
    } else if (originalBill && originalBill.paid && !finalBill.paid) {
        if (originalBill.paymentTransactionId) {
            deleteTransaction(originalBill.paymentTransactionId);
        }
        delete finalBill.paidOn;
        delete finalBill.paymentTransactionId;
    } else if (originalBill && originalBill.paid && finalBill.paid && originalBill.paymentTransactionId) {
        const fieldsChanged = originalBill.amount !== finalBill.amount
            || originalBill.categoryId !== finalBill.categoryId
            || originalBill.memberId !== finalBill.memberId
            || originalBill.name !== finalBill.name;
        if (fieldsChanged) {
            const existingTx = transactions.find(t => t.id === originalBill.paymentTransactionId);
            updateTransaction({
                id: originalBill.paymentTransactionId,
                description: finalBill.name,
                amount: finalBill.amount,
                type: TransactionType.EXPENSE,
                categoryId: finalBill.categoryId || 'cat-other',
                category: typeof finalBill.category === 'string' ? finalBill.category : undefined,
                date: existingTx ? existingTx.date : (finalBill.paidOn || new Date().toISOString()),
                memberId: finalBill.memberId,
            });
        }
    }

    setBills(prev => prev.map(b => b.id === finalBill.id ? finalBill : b));
    if (googleFirebaseUser?.uid) {
      saveUserDocument(googleFirebaseUser.uid, 'bills', finalBill.id, finalBill);
    }
    return transactionCreated;
  };

  const deleteBill = (id: string) => {
    const targetBill = bills.find(b => b.id === id);
    if (targetBill?.paymentTransactionId) {
      deleteTransaction(targetBill.paymentTransactionId);
    }
    setBills(prev => prev.filter(b => b.id !== id));
    if (googleFirebaseUser?.uid) {
      deleteUserDocument(googleFirebaseUser.uid, 'bills', id);
    }
  };
  
  const addMedicine = (medicine: Omit<Medicine, 'id' | 'history'>) => {
    const newMed: Medicine = { ...medicine, id: uuidv4(), history: [] };
    setMedicines(prev => [...prev, newMed]);
    if (googleFirebaseUser?.uid) {
      saveUserDocument(googleFirebaseUser.uid, 'medicines', newMed.id, newMed);
    }
  };

  const updateMedicine = (updatedMedicine: Medicine) => {
    setMedicines(prev => prev.map(m => m.id === updatedMedicine.id ? updatedMedicine : m));
    if (googleFirebaseUser?.uid) {
      saveUserDocument(googleFirebaseUser.uid, 'medicines', updatedMedicine.id, updatedMedicine);
    }
  };
  
  const deleteMedicine = (id: string) => {
    setMedicines(prev => prev.filter(m => m.id !== id));
    if (googleFirebaseUser?.uid) {
      deleteUserDocument(googleFirebaseUser.uid, 'medicines', id);
    }
  };
  
  const logDose = (medicineId: string, timestamp: string) => {
      let medName: string | null = null;
      let updatedMed: Medicine | null = null;

      setMedicines(prev => prev.map(med => {
          if (med.id === medicineId && med.stock >= med.doseQuantity) {
              medName = med.name;
              updatedMed = {
                  ...med,
                  stock: med.stock - med.doseQuantity,
                  history: [...med.history, { timestamp, status: 'taken' }]
              };
              return updatedMed;
          }
          return med;
      }));

      if (updatedMed && googleFirebaseUser?.uid) {
        saveUserDocument(googleFirebaseUser.uid, 'medicines', medicineId, updatedMed);
      }

      return medName;
  };

  const addTaskList = (name: string) => {
    const newTaskList: TaskList = { id: uuidv4(), name };
    setTaskLists(prev => [...prev, newTaskList]);
    if (googleFirebaseUser?.uid) {
      saveUserDocument(googleFirebaseUser.uid, 'taskLists', newTaskList.id, newTaskList);
    }
  };

  const deleteTaskList = (id: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.listId !== id));
    setTaskLists(prevLists => prevLists.filter(list => list.id !== id));
    if (googleFirebaseUser?.uid) {
      deleteUserDocument(googleFirebaseUser.uid, 'taskLists', id);
    }
  };

  const addTask = (task: Omit<Task, 'id' | 'completed'>) => {
    const newTask: Task = { ...task, id: uuidv4(), completed: false };
    setTasks(prev => [...prev, newTask]);
    if (googleFirebaseUser?.uid) {
      saveUserDocument(googleFirebaseUser.uid, 'tasks', newTask.id, newTask);
    }
  };

  const toggleTask = (id: string) => {
    setTasks(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
      const target = updated.find(t => t.id === id);
      if (target && googleFirebaseUser?.uid) {
        saveUserDocument(googleFirebaseUser.uid, 'tasks', id, target);
      }
      return updated;
    });
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (googleFirebaseUser?.uid) {
      deleteUserDocument(googleFirebaseUser.uid, 'tasks', id);
    }
  };
  
  const addNote = (note: Omit<Note, 'id' | 'createdAt'>) => {
    const newNote: Note = { ...note, id: uuidv4(), createdAt: new Date().toISOString() };
    setNotes(prev => [newNote, ...prev]);
    if (googleFirebaseUser?.uid) {
      saveUserDocument(googleFirebaseUser.uid, 'notes', newNote.id, newNote);
    }
  };
  
  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (googleFirebaseUser?.uid) {
      deleteUserDocument(googleFirebaseUser.uid, 'notes', id);
    }
  };

  const addMedicalReport = (report: Omit<MedicalReport, 'id'>) => {
    const newReport: MedicalReport = { ...report, id: uuidv4() };
    setMedicalReports(prev => [newReport, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    if (googleFirebaseUser?.uid) {
      saveUserDocument(googleFirebaseUser.uid, 'medicalReports', newReport.id, newReport);
    }
  };

  const deleteMedicalReport = (id: string) => {
    setMedicalReports(prev => prev.filter(r => r.id !== id));
    if (googleFirebaseUser?.uid) {
      deleteUserDocument(googleFirebaseUser.uid, 'medicalReports', id);
    }
  };

  // Borrowings & Lendings
  const addBorrowing = (item: Omit<Borrowing, 'id' | 'repayments' | 'status'>) => {
    const newBorrowing: Borrowing = { ...item, id: uuidv4(), repayments: [], status: 'outstanding' };
    setBorrowings(prev => [...prev, newBorrowing]);
    if (googleFirebaseUser?.uid) {
      saveUserDocument(googleFirebaseUser.uid, 'borrowings', newBorrowing.id, newBorrowing);
    }
  };

  const updateBorrowing = (item: Borrowing) => {
    const totalRepaid = (item.repayments || []).reduce((sum, r) => sum + r.amount, 0);
    const recalculated: Borrowing = {
      ...item,
      repayments: item.repayments || [],
      status: totalRepaid >= item.amount ? 'settled' : 'outstanding'
    };
    setBorrowings(prev => prev.map(b => b.id === recalculated.id ? recalculated : b));
    if (googleFirebaseUser?.uid) {
      saveUserDocument(googleFirebaseUser.uid, 'borrowings', recalculated.id, recalculated);
    }
  };

  const deleteBorrowing = (id: string) => {
    setBorrowings(prev => prev.filter(b => b.id !== id));
    if (googleFirebaseUser?.uid) {
      deleteUserDocument(googleFirebaseUser.uid, 'borrowings', id);
    }
  };

  const addRepayment = (borrowingId: string, repayment: Repayment) => {
    let success = false;
    let updatedBorrowing: Borrowing | null = null;

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
        updatedBorrowing = { ...b, repayments: [...b.repayments, repayment], status: newStatus };
        return updatedBorrowing;
      }
      return b;
    }));

    if (updatedBorrowing && googleFirebaseUser?.uid) {
      saveUserDocument(googleFirebaseUser.uid, 'borrowings', borrowingId, updatedBorrowing);
    }
    return success;
  };

  const deleteRepayment = (borrowingId: string, repaymentIndex: number) => {
    let updatedBorrowing: Borrowing | null = null;
    setBorrowings(prev => prev.map(b => {
      if (b.id === borrowingId) {
        const newRepayments = b.repayments.filter((_, idx) => idx !== repaymentIndex);
        const totalRepaid = newRepayments.reduce((sum, r) => sum + r.amount, 0);
        const newStatus = totalRepaid >= b.amount ? 'settled' : 'outstanding';
        updatedBorrowing = { ...b, repayments: newRepayments, status: newStatus };
        return updatedBorrowing;
      }
      return b;
    }));

    if (updatedBorrowing && googleFirebaseUser?.uid) {
      saveUserDocument(googleFirebaseUser.uid, 'borrowings', borrowingId, updatedBorrowing);
    }
  };

  const settleBorrowing = (borrowingId: string) => {
    setBorrowings(prev => {
      const updated = prev.map(b => b.id === borrowingId ? { ...b, status: 'settled' as const } : b);
      const target = updated.find(b => b.id === borrowingId);
      if (target && googleFirebaseUser?.uid) {
        saveUserDocument(googleFirebaseUser.uid, 'borrowings', borrowingId, target);
      }
      return updated;
    });
  };
  
  const addLending = (item: Omit<Lending, 'id' | 'returns' | 'status'>) => {
    const newLending: Lending = { ...item, id: uuidv4(), returns: [], status: 'outstanding' };
    setLendings(prev => [...prev, newLending]);
    if (googleFirebaseUser?.uid) {
      saveUserDocument(googleFirebaseUser.uid, 'lendings', newLending.id, newLending);
    }
  };

  const updateLending = (item: Lending) => {
    const totalReturned = (item.returns || []).reduce((sum, r) => sum + r.amount, 0);
    const recalculated: Lending = {
      ...item,
      returns: item.returns || [],
      status: totalReturned >= item.amount ? 'returned' : 'outstanding'
    };
    setLendings(prev => prev.map(l => l.id === recalculated.id ? recalculated : l));
    if (googleFirebaseUser?.uid) {
      saveUserDocument(googleFirebaseUser.uid, 'lendings', recalculated.id, recalculated);
    }
  };

  const deleteLending = (id: string) => {
    setLendings(prev => prev.filter(l => l.id !== id));
    if (googleFirebaseUser?.uid) {
      deleteUserDocument(googleFirebaseUser.uid, 'lendings', id);
    }
  };
  
  const addReturn = (lendingId: string, returnItem: Return) => {
    let success = false;
    let updatedLending: Lending | null = null;

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
        updatedLending = { ...l, returns: [...l.returns, returnItem], status: newStatus };
        return updatedLending;
      }
      return l;
    }));

    if (updatedLending && googleFirebaseUser?.uid) {
      saveUserDocument(googleFirebaseUser.uid, 'lendings', lendingId, updatedLending);
    }
    return success;
  };

  const deleteReturn = (lendingId: string, returnIndex: number) => {
    let updatedLending: Lending | null = null;
    setLendings(prev => prev.map(l => {
      if (l.id === lendingId) {
        const newReturns = l.returns.filter((_, idx) => idx !== returnIndex);
        const totalReturned = newReturns.reduce((sum, r) => sum + r.amount, 0);
        const newStatus = totalReturned >= l.amount ? 'returned' : 'outstanding';
        updatedLending = { ...l, returns: newReturns, status: newStatus };
        return updatedLending;
      }
      return l;
    }));

    if (updatedLending && googleFirebaseUser?.uid) {
      saveUserDocument(googleFirebaseUser.uid, 'lendings', lendingId, updatedLending);
    }
  };

  const writeOffLending = (lendingId: string) => {
    setLendings(prev => {
      const updated = prev.map(l => l.id === lendingId ? { ...l, status: 'written_off' as const } : l);
      const target = updated.find(l => l.id === lendingId);
      if (target && googleFirebaseUser?.uid) {
        saveUserDocument(googleFirebaseUser.uid, 'lendings', lendingId, target);
      }
      return updated;
    });
  };

  // Savings Goals
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
    if (googleFirebaseUser?.uid) {
      saveUserDocument(googleFirebaseUser.uid, 'savingsGoals', newGoal.id, newGoal);
    }
  };

  const addSavingsDeposit = (goalId: string, amount: number) => {
    let goalTitle = '';
    let updatedGoal: SavingsGoal | null = null;

    setSavingsGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        goalTitle = g.title;
        updatedGoal = { ...g, currentAmount: g.currentAmount + amount };
        return updatedGoal;
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

    if (updatedGoal && googleFirebaseUser?.uid) {
      saveUserDocument(googleFirebaseUser.uid, 'savingsGoals', goalId, updatedGoal);
    }
  };

  const withdrawSavingsDeposit = (goalId: string, amount: number) => {
    let goalTitle = '';
    let actuallyWithdrawn = 0;
    let updatedGoal: SavingsGoal | null = null;

    setSavingsGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        goalTitle = g.title;
        actuallyWithdrawn = Math.min(amount, Math.max(0, g.currentAmount));
        const newAmount = g.currentAmount - actuallyWithdrawn;
        updatedGoal = { ...g, currentAmount: newAmount };
        return updatedGoal;
      }
      return g;
    }));

    if (goalTitle && actuallyWithdrawn > 0) {
      addTransaction({
        description: `Withdrawal from ${goalTitle}`,
        amount: actuallyWithdrawn,
        type: TransactionType.INCOME,
        category: 'Savings Withdrawal',
        date: new Date().toISOString()
      });
    }

    if (updatedGoal && googleFirebaseUser?.uid) {
      saveUserDocument(googleFirebaseUser.uid, 'savingsGoals', goalId, updatedGoal);
    }
  };

  const updateSavingsGoal = (goal: SavingsGoal) => {
    setSavingsGoals(prev => prev.map(g => g.id === goal.id ? goal : g));
    if (googleFirebaseUser?.uid) {
      saveUserDocument(googleFirebaseUser.uid, 'savingsGoals', goal.id, goal);
    }
  };

  const deleteSavingsGoal = (goalId: string) => {
    setSavingsGoals(prev => prev.filter(g => g.id !== goalId));
    if (googleFirebaseUser?.uid) {
      deleteUserDocument(googleFirebaseUser.uid, 'savingsGoals', goalId);
    }
  };

  // Appointments
  const addAppointment = (appointment: Omit<Appointment, 'id' | 'status'>) => {
    const newAppointment: Appointment = { id: uuidv4(), ...appointment, status: 'upcoming' };
    setAppointments(prev => [...prev, newAppointment].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()));
    if (googleFirebaseUser?.uid) {
      saveUserDocument(googleFirebaseUser.uid, 'appointments', newAppointment.id, newAppointment);
    }
  };

  const updateAppointment = (updatedAppointment: Appointment) => {
    setAppointments(prev => prev.map(a => a.id === updatedAppointment.id ? updatedAppointment : a));
    if (googleFirebaseUser?.uid) {
      saveUserDocument(googleFirebaseUser.uid, 'appointments', updatedAppointment.id, updatedAppointment);
    }
  };

  const deleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
    if (googleFirebaseUser?.uid) {
      deleteUserDocument(googleFirebaseUser.uid, 'appointments', id);
    }
  };

  const getCalendarEvents = useCallback((startDate: Date, endDate: Date): CalendarEvent[] => {
      const events: CalendarEvent[] = [];
      const referenceDate = new Date(2024, 0, 1);
      
      medicines.forEach(med => {
          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
              const daysDifference = Math.floor((d.getTime() - referenceDate.getTime()) / (1000 * 3600 * 24));
              const isScheduledToday = med.schedule.type === 'daily' || (med.schedule.type === 'alternate_days' && daysDifference % 2 === 0);
              if(!isScheduledToday) continue;

              med.times.forEach(time => {
                  const [hour, minute] = time.split(':');
                  const doseDateTime = new Date(d);
                  doseDateTime.setHours(parseInt(hour), parseInt(minute), 0, 0);

                  const historyEntry = findDoseHistoryEntry(med.history, d, parseInt(hour, 10), parseInt(minute, 10));
                  
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
              dueDate.setHours(12, 0, 0, 0);
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
                title: `Appt: ${appt.doctorName} for ${member?.name || 'Family Member'}`,
                type: 'appointment',
                status: appt.status,
                details: { ...appt }
            });
        }
      });

      // Include Google Calendar Events if enabled
      if (includeGoogleCalendar && googleCalendarEvents.length > 0) {
        googleCalendarEvents.forEach(gEvent => {
          const gDate = new Date(gEvent.date);
          if (gDate >= startDate && gDate <= endDate) {
            events.push({
              ...gEvent,
              date: gDate,
            });
          }
        });
      }
      
      return events.sort((a,b) => a.date.getTime() - b.date.getTime());
  }, [medicines, bills, tasks, appointments, familyMembers, includeGoogleCalendar, googleCalendarEvents]);
  
  const addToCart = (item: CartItem) => {
      setCart(prev => {
          const existing = prev.find(i => i.medicineId === item.medicineId);
          if (existing) {
              return prev.map(i => i.medicineId === item.medicineId ? { ...i, strips: i.strips + item.strips, pieces: i.pieces + item.pieces } : i);
          }
          return [...prev, item];
      });
  };

  const updateCartItemQuantity = (medicineId: string, strips: number, pieces: number) => {
      setCart(prev => prev.map(item => item.medicineId === medicineId ? { ...item, strips, pieces } : item).filter(item => item.strips > 0 || item.pieces > 0));
  };
  
  const clearCart = () => {
      setCart([]);
  };

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
                  const updated = { ...med, stock: med.stock + totalPiecesAdded };
                  if (googleFirebaseUser?.uid) {
                    saveUserDocument(googleFirebaseUser.uid, 'medicines', med.id, updated);
                  }
                  return updated;
              }
              return med;
          });
      });
      clearCart();
  };

  const updateCurrency = (code: string) => {
    setCurrency(code);
    if (googleFirebaseUser?.uid) {
      saveUserProfile(googleFirebaseUser.uid, { currency: code });
    }
  };
  
  const updateLanguage = (code: string) => {
    setLanguage(code);
    if (googleFirebaseUser?.uid) {
      saveUserProfile(googleFirebaseUser.uid, { language: code });
    }
  };
  
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
    }));
  }, [medicines]);

  // UI State Controls
  const openDrawer = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);

  const value = {
    loading,
    theme, toggleTheme,
    user, updateUser,
    // Firebase Auth
    isGoogleAuthenticated,
    isGoogleLoading,
    needsGoogleReauth,
    reconnectGoogle,
    isGuestMode,
    setGuestMode: setIsGuestMode,
    googleFirebaseUser,
    loginWithGoogle,
    loginWithEmail,
    signUpWithEmail: signUpWithEmailHandler,
    resetUserPassword,
    logout,
    logoutFromGoogle,
    seedSampleDataToCloud,
    clearAllUserData,
    // Google Calendar Sync
    includeGoogleCalendar,
    setIncludeGoogleCalendar,
    isCalendarSyncing,
    googleCalendarEvents,
    fetchGoogleEvents,
    syncAppointmentToGoogle,
    syncBillToGoogle,
    syncAllToGoogleCalendar,
    // Family Invites & Linking
    pendingInvite,
    sendFamilyInvite,
    generateFamilyInviteLink,
    copyFamilyInviteLink,
    getInviteDetails,
    cancelFamilyInvite,
    acceptPendingInvite,
    // Notifications
    notifications,
    notificationSettings,
    updateNotificationSettings,
    requestBrowserNotifications,
    sendTestNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    deleteNotification,
    addNotification,
    // Core Domain
    transactions, addTransaction, updateTransaction, deleteTransaction,
    transactionCategories, addTransactionCategory, updateTransactionCategory, deleteTransactionCategory, mergeTransactionCategories,
    bills, addBill, updateBill, deleteBill,
    familyMembers, addFamilyMember, updateFamilyMember, deleteFamilyMember,
    medicines, addMedicine, updateMedicine, deleteMedicine, logDose,
    tasks, taskLists, addTaskList, deleteTaskList, addTask, toggleTask, deleteTask,
    notes, addNote, deleteNote,
    getCalendarEvents,
    healthRecords,
    cart, addToCart, updateCartItemQuantity, clearCart, completeRestock,
    currency, updateCurrency, availableCurrencies,
    language, updateLanguage, availableLanguages,
    medicalReports, addMedicalReport, deleteMedicalReport,
    borrowings, addBorrowing, updateBorrowing, deleteBorrowing, addRepayment, deleteRepayment, settleBorrowing,
    lendings, addLending, updateLending, deleteLending, addReturn, deleteReturn, writeOffLending,
    savingsGoals, addSavingsGoal, addSavingsDeposit, withdrawSavingsDeposit, updateSavingsGoal, deleteSavingsGoal,
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
