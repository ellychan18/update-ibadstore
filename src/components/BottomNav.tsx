import React from 'react';
import {
  Layers,
  ReceiptText,
  Trophy,
  Search,
  User as UserIcon,
  Sliders,
  Wallet,
} from 'lucide-react';
import type { User, AppTab } from '../types.js';

interface BottomNavProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  user: User | null;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  user,
  onOpenAuth,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe">
      <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto px-1">
        {/* Tab 1: Catalog / Beranda */}
        <button
          id="mobile-bottom-tab-catalog"
          onClick={() => setActiveTab('catalog')}
          className={`flex flex-col items-center justify-center gap-1 py-1 cursor-pointer transition-colors ${
            activeTab === 'catalog' ? 'text-indigo-600 font-extrabold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${activeTab === 'catalog' ? 'bg-indigo-50 text-indigo-600 scale-105' : ''}`}>
            <Layers className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight">Katalog</span>
        </button>

        {/* Tab 2: Pascabayar / Tagihan */}
        <button
          id="mobile-bottom-tab-postpaid"
          onClick={() => setActiveTab('postpaid')}
          className={`flex flex-col items-center justify-center gap-1 py-1 cursor-pointer transition-colors ${
            activeTab === 'postpaid' ? 'text-indigo-600 font-extrabold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${activeTab === 'postpaid' ? 'bg-indigo-50 text-indigo-600 scale-105' : ''}`}>
            <ReceiptText className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight">Tagihan</span>
        </button>

        {/* Tab 3: Leaderboard (Center Highlight) */}
        <button
          id="mobile-bottom-tab-leaderboard"
          onClick={() => setActiveTab('leaderboard')}
          className={`flex flex-col items-center justify-center gap-1 py-1 cursor-pointer transition-colors ${
            activeTab === 'leaderboard' ? 'text-amber-600 font-extrabold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className={`p-1.5 rounded-2xl transition-all ${
            activeTab === 'leaderboard'
              ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/30 scale-110 -translate-y-1'
              : 'bg-amber-50 text-amber-600'
          }`}>
            <Trophy className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight font-bold">Top Sultan</span>
        </button>

        {/* Tab 4: Lacak Pesanan */}
        <button
          id="mobile-bottom-tab-tracker"
          onClick={() => setActiveTab('tracker')}
          className={`flex flex-col items-center justify-center gap-1 py-1 cursor-pointer transition-colors ${
            activeTab === 'tracker' ? 'text-indigo-600 font-extrabold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${activeTab === 'tracker' ? 'bg-indigo-50 text-indigo-600 scale-105' : ''}`}>
            <Search className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight">Lacak</span>
        </button>

        {/* Tab 5: Akun / Admin */}
        {user ? (
          <button
            id="mobile-bottom-tab-account"
            onClick={() => setActiveTab(user.role === 'admin' && activeTab !== 'admin' ? 'admin' : 'dashboard')}
            className={`flex flex-col items-center justify-center gap-1 py-1 cursor-pointer transition-colors ${
              activeTab === 'dashboard' || activeTab === 'admin' ? 'text-indigo-600 font-extrabold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${activeTab === 'dashboard' || activeTab === 'admin' ? 'bg-indigo-50 text-indigo-600 scale-105' : ''}`}>
              {user.role === 'admin' ? <Sliders className="w-5 h-5 text-rose-600" /> : <UserIcon className="w-5 h-5" />}
            </div>
            <span className="text-[10px] tracking-tight">{user.role === 'admin' ? 'Admin' : 'Akun'}</span>
          </button>
        ) : (
          <button
            id="mobile-bottom-tab-login"
            onClick={() => onOpenAuth('login')}
            className="flex flex-col items-center justify-center gap-1 py-1 cursor-pointer text-slate-500 hover:text-indigo-600"
          >
            <div className="p-1 rounded-xl">
              <UserIcon className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight font-bold">Masuk</span>
          </button>
        )}
      </div>
    </div>
  );
};
