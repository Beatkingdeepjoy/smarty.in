
import React, { useState, useEffect, useMemo } from 'react';
import { Expense, Budget, AIInsight, User, UserSettings, Language } from './types';
import { CATEGORIES, INITIAL_BUDGETS, CURRENCIES, LANGUAGES } from './constants';
import { TRANSLATIONS } from './translations';
import Header from './components/Header';
import StatsOverview from './components/StatsOverview';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import BudgetManager from './components/BudgetManager';
import GeminiChat from './components/GeminiChat';
import Login from './components/Login';
import MonthlyReport from './components/MonthlyReport';
import { getAIInsights } from './services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('smarty_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('smarty_settings');
    return saved ? JSON.parse(saved) : { currency: CURRENCIES[0], language: 'en' as Language };
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('smarty_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('smarty_budgets');
    return saved ? JSON.parse(saved) : INITIAL_BUDGETS;
  });

  const [insights, setInsights] = useState<AIInsight | null>(null);
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'budgets' | 'report' | 'settings'>('dashboard');

  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;

  useEffect(() => {
    if (user) localStorage.setItem('smarty_user', JSON.stringify(user));
    else localStorage.removeItem('smarty_user');
  }, [user]);

  useEffect(() => {
    localStorage.setItem('smarty_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('smarty_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('smarty_budgets', JSON.stringify(budgets));
  }, [budgets]);

  const refreshInsights = async () => {
    if (expenses.length === 0) return;
    setIsInsightLoading(true);
    try {
      const data = await getAIInsights(expenses, budgets);
      setInsights(data);
    } catch (error) {
      console.error("Insight error:", error);
    } finally {
      setIsInsightLoading(false);
    }
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense = { ...expense, id: crypto.randomUUID() };
    setExpenses(prev => [newExpense, ...prev]);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const totalSpent = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);

  if (!user) {
    return <Login onLogin={(userData) => setUser({ ...userData, id: '1' })} />;
  }

  const formatCurrency = (amount: number) => {
    return `${settings.currency.symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0 font-sans text-slate-900 bg-[#f8fafc] selection:bg-blue-600 selection:text-white">
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userName={user.name} 
        t={t}
      />
      
      <main className="max-w-6xl mx-auto px-4 pt-24 pb-8">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
                <div>
                  <h2 className="text-4xl font-black tracking-tighter text-slate-900 font-heading uppercase">
                    {t.welcomeBack}, {user.name}
                  </h2>
                  <p className="text-blue-600/60 font-bold text-xs uppercase tracking-[0.3em] mt-2">Core System Protocol Active</p>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Syncing Data</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <StatsOverview 
                    expenses={expenses} 
                    totalSpent={totalSpent} 
                    formatCurrency={formatCurrency}
                    t={t}
                  />
                  <ExpenseForm onAdd={addExpense} t={t} />
                </div>
                <div className="space-y-6">
                  <GeminiChat 
                    insights={insights} 
                    isLoading={isInsightLoading} 
                    onRefresh={refreshInsights} 
                    expenseCount={expenses.length}
                    t={t}
                  />
                  
                  <div className="glass p-8 rounded-[40px] shadow-sm border border-white relative overflow-hidden group">
                    <h3 className="text-lg font-black mb-8 flex items-center gap-3 font-heading uppercase tracking-tighter">
                      <span className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center text-xl shadow-lg shadow-blue-100">🎯</span>
                      {t.monthlyGoals}
                    </h3>
                    <div className="space-y-6">
                      {budgets.slice(0, 3).map(b => {
                        const spent = expenses
                          .filter(e => e.category === b.category)
                          .reduce((sum, e) => sum + e.amount, 0);
                        const percent = Math.min((spent / b.limit) * 100, 100);
                        return (
                          <div key={b.category}>
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] mb-3">
                              <span className="text-slate-400">{b.category}</span>
                              <span className={percent > 90 ? 'text-rose-600' : 'text-blue-600'}>
                                {percent.toFixed(0)}% Utilized
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${percent}%` }}
                                className={`h-full rounded-full ${percent > 90 ? 'bg-rose-500 shadow-lg' : 'bg-blue-600 shadow-md'}`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <ExpenseList expenses={expenses} onDelete={deleteExpense} formatCurrency={formatCurrency} t={t} />
            </motion.div>
          )}

          {activeTab === 'budgets' && (
            <motion.div key="budgets" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <BudgetManager budgets={budgets} setBudgets={setBudgets} expenses={expenses} formatCurrency={formatCurrency} t={t} />
            </motion.div>
          )}

          {activeTab === 'report' && (
            <motion.div key="report" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}>
              <MonthlyReport expenses={expenses} budgets={budgets} t={t} />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto font-heading">
              <div className="glass p-12 rounded-[48px] border border-white space-y-10 shadow-2xl">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{t.settings}</h2>
                
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Preferred Currency</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {CURRENCIES.map(curr => (
                        <button
                          key={curr.code}
                          onClick={() => setSettings(s => ({ ...s, currency: curr }))}
                          className={`p-5 rounded-2xl border transition-all flex flex-col items-center gap-2 ${settings.currency.code === curr.code ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-lg shadow-blue-100' : 'border-slate-100 bg-slate-50 hover:border-slate-300'}`}
                        >
                          <span className="text-2xl font-black">{curr.symbol}</span>
                          <span className="text-[9px] font-black uppercase tracking-widest">{curr.code}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Language Setup</label>
                    <div className="grid grid-cols-3 gap-4">
                      {LANGUAGES.map(lang => (
                        <button
                          key={lang.id}
                          onClick={() => setSettings(s => ({ ...s, language: lang.id }))}
                          className={`p-5 rounded-2xl border transition-all font-black uppercase text-[10px] tracking-widest ${settings.language === lang.id ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-lg shadow-blue-100' : 'border-slate-100 bg-slate-50 hover:border-slate-300'}`}
                        >
                          {lang.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-100">
                    <button 
                      onClick={() => setUser(null)}
                      className="w-full bg-slate-100 text-slate-600 font-black py-5 rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-[0.2em] text-[10px]"
                    >
                      {t.logout}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white flex justify-around items-center h-20 md:hidden z-[60] rounded-t-3xl shadow-2xl bg-white/90">
        {[
          { id: 'dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
          { id: 'history', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2' },
          { id: 'budgets', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2' },
          { id: 'report', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
          { id: 'settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0' }
        ].map(item => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === item.id ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}/></svg>
            <div className={`w-1 h-1 rounded-full bg-blue-600 transition-opacity ${activeTab === item.id ? 'opacity-100' : 'opacity-0'}`} />
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
