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

import {
  LuApple,
  LuPill,
  LuScissors,
  LuSparkles,
  LuHeartHandshake,
  LuHandHeart,
  LuFuel,
  LuDroplet,
  LuCoffee,
  LuUtensils,
  LuPizza,
  LuShirt,
  LuCar,
  LuBaby,
  LuDog,
  LuCat,
  LuPlane,
  LuDumbbell,
  LuBookOpen,
  LuGamepad2,
  LuStethoscope,
  LuHammer,
  LuSmile,
  LuShoppingBag,
} from 'react-icons/lu';

import {
  FaAppleWhole,
  FaPills,
  FaScissors,
  FaSpa,
  FaHandHoldingHeart,
  FaGasPump,
  FaOilCan,
} from 'react-icons/fa6';

import { TransactionCategory } from '../types';

export const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  // Heroicons
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

  // Lucide icons (Requested: Apple, Meds, Grooming, Beauty, Donation, Oil, etc.)
  LuApple,
  LuPill,
  LuScissors,
  LuSparkles,
  LuHeartHandshake,
  LuHandHeart,
  LuFuel,
  LuDroplet,
  LuCoffee,
  LuUtensils,
  LuPizza,
  LuShirt,
  LuCar,
  LuBaby,
  LuDog,
  LuCat,
  LuPlane,
  LuDumbbell,
  LuBookOpen,
  LuGamepad2,
  LuStethoscope,
  LuHammer,
  LuSmile,
  LuShoppingBag,

  // FontAwesome icons
  FaAppleWhole,
  FaPills,
  FaScissors,
  FaSpa,
  FaHandHoldingHeart,
  FaGasPump,
  FaOilCan,

  // Semantic Aliases for easy lookup
  apple: LuApple,
  meds: LuPill,
  medicine: LuPill,
  pills: FaPills,
  grooming: LuScissors,
  beauty: LuSparkles,
  spa: FaSpa,
  donation: LuHeartHandshake,
  charity: LuHandHeart,
  oil: FaOilCan,
  fuel: LuFuel,
  gas: FaGasPump,
  groceries: LuApple,
  coffee: LuCoffee,
  dining: LuUtensils,
  food: LuUtensils,
  pizza: LuPizza,
  clothing: LuShirt,
  car: LuCar,
  baby: LuBaby,
  pet: LuDog,
  pets: LuDog,
  travel: LuPlane,
  gym: LuDumbbell,
  fitness: LuDumbbell,
  education: LuBookOpen,
  gaming: LuGamepad2,
  doctor: LuStethoscope,
  health: HiOutlineHeart,
  repairs: LuHammer,
  shopping: LuShoppingBag,
};

export const AVAILABLE_CATEGORY_ICONS = [
  // User-requested categories first for instant discoverability
  { name: 'LuApple', label: 'Apple / Groceries / Fresh Produce', icon: LuApple },
  { name: 'LuPill', label: 'Meds / Pharmacy / Medicine', icon: LuPill },
  { name: 'FaPills', label: 'Prescriptions / Pills', icon: FaPills },
  { name: 'LuScissors', label: 'Grooming / Haircut / Barber', icon: LuScissors },
  { name: 'LuSparkles', label: 'Beauty / Cosmetics / Skincare', icon: LuSparkles },
  { name: 'FaSpa', label: 'Spa / Wellness & Relaxation', icon: FaSpa },
  { name: 'LuHeartHandshake', label: 'Donation / Charity / Support', icon: LuHeartHandshake },
  { name: 'FaHandHoldingHeart', label: 'Donation & Giving', icon: FaHandHoldingHeart },
  { name: 'FaOilCan', label: 'Oil / Motor Oil / Maintenance', icon: FaOilCan },
  { name: 'LuFuel', label: 'Fuel / Gas / Petrol', icon: LuFuel },
  { name: 'FaGasPump', label: 'Gas Station / Refueling', icon: FaGasPump },
  { name: 'LuDroplet', label: 'Oil / Fluids / Droplet', icon: LuDroplet },

  // Food & Everyday Living
  { name: 'HiOutlineShoppingCart', label: 'Shopping / Supermarket', icon: HiOutlineShoppingCart },
  { name: 'LuCoffee', label: 'Coffee & Cafe', icon: LuCoffee },
  { name: 'LuUtensils', label: 'Dining Out & Restaurants', icon: LuUtensils },
  { name: 'LuPizza', label: 'Takeout / Fast Food', icon: LuPizza },
  { name: 'HiOutlineCake', label: 'Celebration & Desserts', icon: HiOutlineCake },
  { name: 'LuShoppingBag', label: 'Shopping & Retail', icon: LuShoppingBag },
  { name: 'LuShirt', label: 'Clothing & Wardrobe', icon: LuShirt },

  // Home, Transit & Lifestyle
  { name: 'HiOutlineHome', label: 'Home / Rent / Mortgage', icon: HiOutlineHome },
  { name: 'HiOutlineBolt', label: 'Utilities / Electricity', icon: HiOutlineBolt },
  { name: 'LuCar', label: 'Car / Vehicle', icon: LuCar },
  { name: 'HiOutlineTruck', label: 'Transport & Logistics', icon: HiOutlineTruck },
  { name: 'LuPlane', label: 'Travel & Vacations', icon: LuPlane },
  { name: 'LuBaby', label: 'Baby & Childcare', icon: LuBaby },
  { name: 'LuDog', label: 'Pets & Veterinary', icon: LuDog },
  { name: 'LuCat', label: 'Cats & Small Pets', icon: LuCat },

  // Health, Fitness & Services
  { name: 'HiOutlineHeart', label: 'Health & Wellness', icon: HiOutlineHeart },
  { name: 'LuStethoscope', label: 'Doctor & Clinic Visits', icon: LuStethoscope },
  { name: 'LuDumbbell', label: 'Gym, Sports & Fitness', icon: LuDumbbell },
  { name: 'HiOutlineWrench', label: 'Repairs & Handyman', icon: HiOutlineWrench },
  { name: 'LuHammer', label: 'Hardware & Renovation', icon: LuHammer },

  // Entertainment, Tech & Finance
  { name: 'HiOutlinePlay', label: 'Streaming & Video', icon: HiOutlinePlay },
  { name: 'HiOutlineMusicalNote', label: 'Music & Audio', icon: HiOutlineMusicalNote },
  { name: 'LuGamepad2', label: 'Gaming & Apps', icon: LuGamepad2 },
  { name: 'HiOutlineAcademicCap', label: 'Education & Tuition', icon: HiOutlineAcademicCap },
  { name: 'LuBookOpen', label: 'Books & Reading', icon: LuBookOpen },
  { name: 'HiOutlinePhone', label: 'Phone & Cellular', icon: HiOutlinePhone },
  { name: 'HiOutlineWifi', label: 'Internet & Broadband', icon: HiOutlineWifi },
  { name: 'HiOutlineShieldCheck', label: 'Insurance & Security', icon: HiOutlineShieldCheck },
  { name: 'HiOutlineBanknotes', label: 'Cash & Allowance', icon: HiOutlineBanknotes },
  { name: 'HiOutlineBriefcase', label: 'Work & Salary', icon: HiOutlineBriefcase },
  { name: 'HiOutlineGift', label: 'Gifts & Presents', icon: HiOutlineGift },
  { name: 'HiOutlineTag', label: 'Other / General Tag', icon: HiOutlineTag },
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
  '#A855F7', // Bright Purple
  '#E11D48', // Rose
  '#D97706', // Warm Amber
  '#0284C7', // Sky Blue
  '#64748B', // Slate
];

export const DEFAULT_TRANSACTION_CATEGORIES: TransactionCategory[] = [
  { id: 'cat-groceries', name: 'Groceries', icon: 'LuApple', color: '#10B981', isCustom: false },
  { id: 'cat-rent', name: 'Rent', icon: 'HiOutlineHome', color: '#6366F1', isCustom: false },
  { id: 'cat-utilities', name: 'Utilities', icon: 'HiOutlineBolt', color: '#F59E0B', isCustom: false },
  { id: 'cat-subscriptions', name: 'Subscriptions', icon: 'HiOutlinePlay', color: '#EC4899', isCustom: false },
  { id: 'cat-transport', name: 'Transport', icon: 'LuCar', color: '#3B82F6', isCustom: false },
  { id: 'cat-fuel', name: 'Fuel & Oil', icon: 'LuFuel', color: '#F97316', isCustom: false },
  { id: 'cat-health', name: 'Health & Meds', icon: 'LuPill', color: '#EF4444', isCustom: false },
  { id: 'cat-beauty', name: 'Beauty & Grooming', icon: 'LuScissors', color: '#EC4899', isCustom: false },
  { id: 'cat-donation', name: 'Donation & Charity', icon: 'LuHeartHandshake', color: '#8B5CF6', isCustom: false },
  { id: 'cat-entertainment', name: 'Entertainment', icon: 'HiOutlineSparkles', color: '#8B5CF6', isCustom: false },
  { id: 'cat-education', name: 'Education', icon: 'HiOutlineAcademicCap', color: '#14B8A6', isCustom: false },
  { id: 'cat-other', name: 'Other', icon: 'HiOutlineTag', color: '#64748B', isCustom: false },
];

export const getCategoryIcon = (iconName?: string): React.ElementType => {
  if (!iconName) return HiOutlineTag;
  if (CATEGORY_ICON_MAP[iconName]) {
    return CATEGORY_ICON_MAP[iconName];
  }
  const lower = iconName.toLowerCase().trim();
  if (CATEGORY_ICON_MAP[lower]) {
    return CATEGORY_ICON_MAP[lower];
  }
  return HiOutlineTag;
};
