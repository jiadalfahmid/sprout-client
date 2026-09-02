import React from 'react';
import { 
  HiOutlineShoppingCart, 
  HiOutlineHome, 
  HiOutlineBolt, 
  HiOutlinePlay, 
  HiOutlineTruck, 
  HiOutlineHeart, 
  HiOutlineSparkles, 
  HiOutlineAcademicCap, 
  HiOutlineBanknotes, 
  HiOutlineTag,
  HiOutlineBriefcase,
  HiOutlineGift,
  HiOutlineFilm,
  HiOutlineBuildingStorefront,
  HiOutlineReceiptPercent,
  HiOutlineTv,
  HiOutlineGlobeAlt,
  HiOutlineUserGroup,
  HiOutlineShieldCheck,
  HiOutlinePhone,
  HiOutlineWifi,
  HiOutlineWrench,
  HiOutlineCake,
  HiOutlineWallet,
  HiOutlineCreditCard,
  HiOutlineReceiptRefund,
  HiOutlineMusicalNote,
} from 'react-icons/hi2';
import { TransactionCategory } from '../types';

export const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  HiOutlineShoppingCart,
  HiOutlineHome,
  HiOutlineBolt,
  HiOutlinePlay,
  HiOutlineTruck,
  HiOutlineHeart,
  HiOutlineSparkles,
  HiOutlineAcademicCap,
  HiOutlineBanknotes,
  HiOutlineTag,
  HiOutlineBriefcase,
  HiOutlineGift,
  HiOutlineFilm,
  HiOutlineBuildingStorefront,
  HiOutlineReceiptPercent,
  HiOutlineTv,
  HiOutlineGlobeAlt,
  HiOutlineUserGroup,
  HiOutlineShieldCheck,
  HiOutlinePhone,
  HiOutlineWifi,
  HiOutlineWrench,
  HiOutlineCake,
  HiOutlineWallet,
  HiOutlineCreditCard,
  HiOutlineReceiptRefund,
  HiOutlineMusicalNote,
};

export const AVAILABLE_CATEGORY_ICONS = [
  { name: 'HiOutlineShoppingCart', label: 'Shopping / Groceries', icon: HiOutlineShoppingCart },
  { name: 'HiOutlineHome', label: 'Home / Rent', icon: HiOutlineHome },
  { name: 'HiOutlineBolt', label: 'Utilities / Energy', icon: HiOutlineBolt },
  { name: 'HiOutlinePlay', label: 'Subscriptions / Streaming', icon: HiOutlinePlay },
  { name: 'HiOutlineTruck', label: 'Transport / Car', icon: HiOutlineTruck },
  { name: 'HiOutlineHeart', label: 'Health / Medical', icon: HiOutlineHeart },
  { name: 'HiOutlineSparkles', label: 'Entertainment / Fun', icon: HiOutlineSparkles },
  { name: 'HiOutlineAcademicCap', label: 'Education / School', icon: HiOutlineAcademicCap },
  { name: 'HiOutlineBanknotes', label: 'Loan / Cash', icon: HiOutlineBanknotes },
  { name: 'HiOutlineTag', label: 'Other / General', icon: HiOutlineTag },
  { name: 'HiOutlineBriefcase', label: 'Work / Salary', icon: HiOutlineBriefcase },
  { name: 'HiOutlineGift', label: 'Gifts / Charity', icon: HiOutlineGift },
  { name: 'HiOutlineMusicalNote', label: 'Music & Arts', icon: HiOutlineMusicalNote },
  { name: 'HiOutlineCake', label: 'Celebration & Dining', icon: HiOutlineCake },
  { name: 'HiOutlineWrench', label: 'Repairs / Maintenance', icon: HiOutlineWrench },
  { name: 'HiOutlinePhone', label: 'Phone / Mobile', icon: HiOutlinePhone },
  { name: 'HiOutlineWifi', label: 'Internet', icon: HiOutlineWifi },
  { name: 'HiOutlineShieldCheck', label: 'Insurance', icon: HiOutlineShieldCheck },
];

export const AVAILABLE_CATEGORY_COLORS = [
  '#10B981', // Emerald
  '#6366F1', // Indigo
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#64748B', // Slate
];

export const DEFAULT_TRANSACTION_CATEGORIES: TransactionCategory[] = [
  { id: 'cat-groceries', name: 'Groceries', icon: 'HiOutlineShoppingCart', color: '#10B981', isCustom: false },
  { id: 'cat-rent', name: 'Rent', icon: 'HiOutlineHome', color: '#6366F1', isCustom: false },
  { id: 'cat-utilities', name: 'Utilities', icon: 'HiOutlineBolt', color: '#F59E0B', isCustom: false },
  { id: 'cat-subscriptions', name: 'Subscriptions', icon: 'HiOutlinePlay', color: '#EC4899', isCustom: false },
  { id: 'cat-transport', name: 'Transport', icon: 'HiOutlineTruck', color: '#3B82F6', isCustom: false },
  { id: 'cat-health', name: 'Health', icon: 'HiOutlineHeart', color: '#EF4444', isCustom: false },
  { id: 'cat-entertainment', name: 'Entertainment', icon: 'HiOutlineSparkles', color: '#8B5CF6', isCustom: false },
  { id: 'cat-education', name: 'Education', icon: 'HiOutlineAcademicCap', color: '#14B8A6', isCustom: false },
  { id: 'cat-loan', name: 'Loan', icon: 'HiOutlineBanknotes', color: '#F97316', isCustom: false },
  { id: 'cat-other', name: 'Other', icon: 'HiOutlineTag', color: '#64748B', isCustom: false },
];

export const getCategoryIcon = (iconName?: string): React.ElementType => {
  if (iconName && CATEGORY_ICON_MAP[iconName]) {
    return CATEGORY_ICON_MAP[iconName];
  }
  return HiOutlineTag;
};
