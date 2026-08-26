// types.ts

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // ISO string
}

export enum BillCategory {
  UTILITIES = 'Utilities',
  RENT = 'Rent',
  SUBSCRIPTION = 'Subscription',
  LOAN = 'Loan',
  OTHER = 'Other',
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  category: BillCategory;
  dueDate: string; // ISO string
  paid: boolean;
  recurrence: 'none' | 'weekly' | 'monthly' | 'yearly';
  paidOn?: string; // ISO string
}

export interface Repayment {
  amount: number;
  date: string; // ISO string
}

export interface Borrowing {
  id: string;
  lenderName: string;
  amount: number;
  borrowedDate: string; // ISO string
  dueDate: string; // ISO string
  notes?: string;
  repayments: Repayment[];
  status: 'outstanding' | 'settled';
}

export interface Return {
  amount: number;
  date: string; // ISO string
}

export interface Lending {
  id: string;
  borrowerName: string;
  amount: number;
  lentDate: string; // ISO string
  returnDate: string; // ISO string
  notes?: string;
  returns: Return[];
  status: 'outstanding' | 'returned' | 'written_off';
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  startDate: string; // ISO string
  deadlineDate?: string; // ISO string
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  age: number;
  avatar: string;
}

export interface MedicineSchedule {
    type: 'daily' | 'alternate_days' | 'specific_days';
    days?: number[]; // for specific_days (0=Sun, 1=Mon, ...)
}

export interface DoseHistory {
    timestamp: string; // ISO string
    status: 'taken' | 'missed' | 'upcoming';
}

export interface Medicine {
  id: string;
  memberId: string;
  name: string;
  dosage: number;
  unit: string; // e.g., 'mg', 'ml'
  doseQuantity: number;
  doseForm: 'Tablet' | 'Capsule' | 'Drops' | 'Spoon';
  stock: number; // in pieces
  times: string[]; // e.g., ['08:00', '20:00']
  mealRelation: 'before' | 'after';
  schedule: MedicineSchedule;
  history: DoseHistory[];
  stripPrice?: number;
  piecesPerStrip?: number;
}

export interface HealthRecord {
    id: string;
    memberId: string;
    medicines: Medicine[];
}

export enum MedicalReportCategory {
    LAB_REPORT = 'Lab Report',
    PRESCRIPTION = 'Prescription',
    DOCTOR_NOTE = 'Doctor Note',
    VACCINATION = 'Vaccination Record',
}

export interface MedicalReport {
    id: string;
    memberId: string;
    name: string;
    category: MedicalReportCategory;
    date: string; // ISO string
    fileUrl: string; // URL to the image/pdf
}

export interface Appointment {
  id: string;
  memberId: string;
  doctorName: string;
  dateTime: string; // ISO string
  clinicName: string;
  purpose: string;
  specialization?: string;
  documentUrl?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

export interface TaskList {
  id: string;
  name: string;
}

export interface Task {
  id: string;
  content: string;
  completed: boolean;
  listId: string;
  dueDate?: string; // ISO string
}

export interface Note {
  id: string;
  content: string;
  createdAt: string; // ISO string
}

export interface User {
  name: string;
  avatar: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  domain: 'finance' | 'health' | 'tasks' | 'system';
  read: boolean;
  createdAt: string; // ISO string
  path?: string;
}

export interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  type: 'medicine' | 'bill' | 'task' | 'appointment';
  status: 'paid' | 'unpaid' | 'taken' | 'missed' | 'upcoming' | 'completed' | 'cancelled';
  details: any;
}

export interface CartItem {
  medicineId: string;
  strips: number;
  pieces: number;
}

export interface Currency {
  code: string; // e.g., 'USD'
  name: string; // e.g., 'US Dollar'
  symbol: string; // e.g., '$'
}

export interface Language {
  code: string; // e.g., 'en'
  name: string; // e.g., 'English'
}