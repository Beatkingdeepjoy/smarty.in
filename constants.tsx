
import { Category, Currency, Language } from './types';

export const CATEGORIES: Category[] = [
  'Food', 'Tuition', 'Social', 'Books', 'Rent', 'Transport', 'Misc'
];

export const CATEGORY_COLORS: Record<Category, string> = {
  Food: '#3b82f6',      // Blue
  Tuition: '#6366f1',   // Indigo
  Social: '#8b5cf6',    // Violet
  Books: '#06b6d4',     // Cyan
  Rent: '#1e293b',      // Slate
  Transport: '#0ea5e9', // Sky
  Misc: '#64748b'       // Grey
};

export const INITIAL_BUDGETS = CATEGORIES.map(cat => ({
  category: cat,
  limit: cat === 'Rent' ? 15000 : 2000
}));

export const CURRENCIES: Currency[] = [
  { code: 'INR', symbol: '₹', name: 'Rupee' },
  { code: 'USD', symbol: '$', name: 'Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'BDT', symbol: '৳', name: 'Taka' }
];

export const LANGUAGES: { id: Language; name: string }[] = [
  { id: 'en', name: 'English' },
  { id: 'bn', name: 'বাংলা' },
  { id: 'hi', name: 'हिन्दी' }
];
