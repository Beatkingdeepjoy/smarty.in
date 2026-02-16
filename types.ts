
export type Category = 'Food' | 'Tuition' | 'Social' | 'Books' | 'Rent' | 'Transport' | 'Misc';

export type Currency = {
  code: string;
  symbol: string;
  name: string;
};

export type Language = 'en' | 'hi' | 'bn' | 'es' | 'fr';

export interface UserSettings {
  currency: Currency;
  language: Language;
}

export interface Expense {
  id: string;
  amount: number;
  category: Category;
  description: string;
  date: string;
}

export interface Budget {
  category: Category;
  limit: number;
}

export interface AIInsight {
  score: number;
  summary: string;
  tips: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
}
