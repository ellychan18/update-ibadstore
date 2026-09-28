import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Medal,
  Flame,
  Crown,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Zap,
  ShoppingBag,
  ArrowRight,
  RefreshCw,
  UserCheck,
  Star,
  Award,
} from 'lucide-react';
import { api } from '../services/api.js';
import type { LeaderboardEntry } from '../types.js';

interface TopLeaderboardProps {
  onGoToCatalog: () => void;
}

export const TopLeaderboard: React.FC<TopLeaderboardProps> = ({ onGoToCatalog }) => {
  const [period, setPeriod] = useState<'all' | 'monthly' | 'weekly'>('all');
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await api.getLeaderboard(period);
      if (res && res.status && Array.isArray(res.data)) {
        setLeaders(res.data);
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [period]);

  const topThree = leaders.slice(0, 3);
  const remainingLeaders = leaders.slice(3);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-10 border border-indigo-900/50 shadow-2xl text-white">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold tracking-wide">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>TOP SPENDER &amp; VIP LEADERBOARD</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Papan Peringkat <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-200">Sultan IBAD STORE</span>
            </h1>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              Daftar member teratas dengan total transaksi tertinggi. Tingkatkan transaksi Anda untuk meraih peringkat Sultan dan raih cashback eksklusif!
            </p>
          </div>

          {/* Quick Stats Banner */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/15">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] text-slate-300 font-semibold">Hadiah Akhir Bulan</p>
              <p className="text-sm font-black text-amber-300">Total Saldo Rp 1.500.000</p>
            </div>
          </div>
        </div>

        {/* Period Filter Tabs */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10">
            <button
              onClick={() => setPeriod('all')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                period === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 font-extrabold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Semua Waktu
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                period === 'monthly'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 font-extrabold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setPeriod('weekly')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                period === 'weekly'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 font-extrabold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Minggu Ini
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadLeaderboard}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-all cursor-pointer border border-white/10"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              <span>Segarkan Data</span>
            </button>
            <button
              onClick={onGoToCatalog}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Top Up Sekarang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content: Empty State or Real Data */}
      {leaders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto border border-amber-200">
            <Trophy className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900">Belum Ada Transaksi Sultan</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Jadilah member pertama yang bertengger di papan peringkat Sultan dengan melakukan transaksi top up game, voucher, atau produk digital hari ini!
            </p>
          </div>
          <button
            onClick={onGoToCatalog}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-xs font-black shadow-md cursor-pointer hover:from-amber-400 hover:to-yellow-400 transition-all inline-flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Top Up Sekarang</span>
          </button>
        </div>
      ) : (
        <>
          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            {/* Rank 2 - Silver (Left) */}
            {topThree[1] && (
              <div className="order-2 md:order-1 bg-white border-2 border-slate-200 hover:border-slate-400 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 shadow-md flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute -top-12 -left-12 w-28 h-28 bg-slate-100 rounded-full blur-xl" />
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-black text-sm mb-3 shadow-inner">
                  2
                </div>
                <div className="relative mb-3">
                  <img
                    src={topThree[1].avatar}
                    alt={topThree[1].name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(topThree[1].name)}&background=64748b&color=fff&bold=true`;
                    }}
                    className="w-20 h-20 rounded-full object-cover border-4 border-slate-300 shadow-md"
                  />
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-slate-600 text-white flex items-center justify-center shadow-sm">
                    <Medal className="w-4 h-4 text-slate-200" />
                  </div>
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider mb-1">
                  🥈 {topThree[1].badge}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">{topThree[1].name}</h3>
                <p className="text-xs text-slate-500 font-mono font-bold mb-3">@{topThree[1].maskedUsername}</p>
                <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 space-y-1">
                  <p className="text-[10px] text-slate-500 font-semibold">Total Belanja</p>
                  <p className="text-base font-black text-indigo-700 font-mono">
                    Rp {topThree[1].totalSpent.toLocaleString('id-ID')}
                  </p>
                  <p className="text-[11px] text-slate-600 font-medium">{topThree[1].totalOrders}x Transaksi Selesai</p>
                </div>
              </div>
            )}

            {/* Rank 1 - Gold (Center, Elevated) */}
            {topThree[0] && (
              <div className="order-1 md:order-2 bg-gradient-to-b from-amber-50 via-white to-amber-50/30 border-2 border-amber-400 rounded-3xl p-7 transition-all duration-300 hover:-translate-y-2 shadow-xl shadow-amber-500/10 flex flex-col items-center text-center relative overflow-hidden md:-mt-4">
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500" />
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs mb-3 shadow-md shadow-amber-500/30">
                  <Crown className="w-4 h-4 text-slate-950" />
                  <span>JUARA 1 SULTAN</span>
                </div>
                <div className="relative mb-3">
                  <img
                    src={topThree[0].avatar}
                    alt={topThree[0].name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(topThree[0].name)}&background=f59e0b&color=000&bold=true`;
                    }}
                    className="w-24 h-24 rounded-full object-cover border-4 border-amber-400 shadow-xl ring-4 ring-amber-200"
                  />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-md">
                    <Trophy className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-[10px] font-black px-3 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 uppercase tracking-wider mb-1">
                  👑 {topThree[0].badge}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">{topThree[0].name}</h3>
                <p className="text-xs text-slate-500 font-mono font-bold mb-3">@{topThree[0].maskedUsername}</p>
                <div className="w-full bg-amber-100/60 border border-amber-200/80 rounded-2xl p-4 space-y-1">
                  <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">Total Akumulasi Sultan</p>
                  <p className="text-xl font-black text-amber-900 font-mono">
                    Rp {topThree[0].totalSpent.toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-amber-800 font-bold">{topThree[0].totalOrders}x Transaksi Berhasil</p>
                </div>
              </div>
            )}

            {/* Rank 3 - Bronze (Right) */}
            {topThree[2] && (
              <div className="order-3 md:order-3 bg-white border-2 border-amber-200/70 hover:border-amber-400 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 shadow-md flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-28 h-28 bg-amber-50 rounded-full blur-xl" />
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-black text-sm mb-3 shadow-inner">
                  3
                </div>
                <div className="relative mb-3">
                  <img
                    src={topThree[2].avatar}
                    alt={topThree[2].name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(topThree[2].name)}&background=b45309&color=fff&bold=true`;
                    }}
                    className="w-20 h-20 rounded-full object-cover border-4 border-amber-300 shadow-md"
                  />
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-700 text-white flex items-center justify-center shadow-sm">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider mb-1">
                  🥉 {topThree[2].badge}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">{topThree[2].name}</h3>
                <p className="text-xs text-slate-500 font-mono font-bold mb-3">@{topThree[2].maskedUsername}</p>
                <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 space-y-1">
                  <p className="text-[10px] text-slate-500 font-semibold">Total Belanja</p>
                  <p className="text-base font-black text-indigo-700 font-mono">
                    Rp {topThree[2].totalSpent.toLocaleString('id-ID')}
                  </p>
                  <p className="text-[11px] text-slate-600 font-medium">{topThree[2].totalOrders}x Transaksi Selesai</p>
                </div>
              </div>
            )}
          </div>

          {/* Ranks 4 to 10 Table/List */}
          {remainingLeaders.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-black text-slate-900">Peringkat 4 - 10 Spender Terbaik</h3>
                </div>
                <span className="text-xs font-bold text-slate-500">Update Realtime Sistem</span>
              </div>

              <div className="divide-y divide-slate-100">
                {remainingLeaders.map((leader) => (
                  <div
                    key={leader.rank}
                    className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/80 px-3 rounded-2xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-700 text-xs font-mono border border-slate-200 shrink-0">
                        #{leader.rank}
                      </div>
                      <img
                        src={leader.avatar}
                        alt={leader.name}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(leader.name)}&background=4f46e5&color=fff&bold=true`;
                        }}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-slate-900">{leader.name}</p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {leader.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono">@{leader.maskedUsername}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] text-slate-400 font-medium">Layanan Favorit</p>
                        <p className="text-xs font-bold text-slate-700 line-clamp-1 max-w-[180px]">{leader.favoriteService}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-semibold">{leader.totalOrders} Pesanan</p>
                        <p className="text-sm font-black text-indigo-600 font-mono">
                          Rp {leader.totalSpent.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Leaderboard CTA & Rules */}
      <div className="bg-gradient-to-r from-indigo-50 via-cyan-50 to-blue-50 border border-indigo-100 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <h4 className="text-base font-black text-indigo-950 flex items-center justify-center sm:justify-start gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Ingin Masuk ke Papan Peringkat Sultan?
          </h4>
          <p className="text-xs text-indigo-900/80 max-w-xl">
            Lakukan transaksi game, pulsa, atau token listrik sesering mungkin. Peringkat 1-3 di akhir bulan akan mendapatkan saldo cashback langsung dan lencana VIP khusus di akun Anda!
          </p>
        </div>
        <button
          onClick={onGoToCatalog}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-xs transition-all shadow-lg shadow-indigo-500/20 cursor-pointer flex items-center gap-2 whitespace-nowrap"
        >
          <Zap className="w-4 h-4 text-amber-300" />
          <span>Mulai Top Up &amp; Kumpulkan Poin</span>
        </button>
      </div>
    </div>
  );
};
