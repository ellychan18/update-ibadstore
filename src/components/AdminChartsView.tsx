import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  Gamepad2,
  PieChart as PieIcon,
  Activity,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import type { TransactionRecord, DepositOrder } from '../types.js';

interface AdminChartsViewProps {
  transactions: TransactionRecord[];
  deposits: DepositOrder[];
  totalUsers: number;
}

const STATUS_COLORS: Record<string, string> = {
  Sukses: '#10b981', // Emerald
  Pending: '#f59e0b', // Amber
  Gagal: '#ef4444',  // Rose
  Batal: '#94a3b8',  // Slate
};

const CATEGORY_COLORS = [
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#14b8a6', // Teal
];

export const AdminChartsView: React.FC<AdminChartsViewProps> = ({
  transactions = [],
  deposits = [],
  totalUsers = 0,
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');

  // Filtered transactions strictly by date range - 100% Real-Time
  const filteredTxs = useMemo(() => {
    if (!Array.isArray(transactions)) return [];
    if (timeRange === 'all') return transactions;
    const now = Date.now();
    const days = timeRange === '7d' ? 7 : 30;
    const cutoff = now - days * 24 * 60 * 60 * 1000;

    return transactions.filter((t) => {
      if (!t) return false;
      const time = t.created_at ? new Date(t.created_at).getTime() : NaN;
      return isNaN(time) || time >= cutoff;
    });
  }, [transactions, timeRange]);

  // Key Real-Time Metrics (Strictly 0 if no transactions exist, no fake numbers)
  const metrics = useMemo(() => {
    const totalCount = filteredTxs.length;
    const successTxs = filteredTxs.filter((t) => t.status === 'success');
    const pendingTxs = filteredTxs.filter((t) => t.status === 'pending');
    const failedTxs = filteredTxs.filter((t) => t.status === 'failed' || t.status === 'cancel');
    const totalRevenue = successTxs.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
    const successRate = totalCount > 0 ? Math.round((successTxs.length / totalCount) * 100) : 0;
    const avgOrderValue = successTxs.length > 0 ? Math.round(totalRevenue / successTxs.length) : 0;

    return {
      totalCount,
      successCount: successTxs.length,
      pendingCount: pendingTxs.length,
      failedCount: failedTxs.length,
      totalRevenue,
      successRate,
      avgOrderValue,
    };
  }, [filteredTxs]);

  // 1. Daily Trend Data for AreaChart - Pure Real-Time
  const dailyTrendData = useMemo(() => {
    const daysMap: Record<string, { date: string; omset: number; total: number; success: number }> = {};
    const daysCount = timeRange === '7d' ? 7 : timeRange === '30d' ? 14 : 10;

    // Initialize date keys with pure 0
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      daysMap[key] = { date: key, omset: 0, total: 0, success: 0 };
    }

    filteredTxs.forEach((tx) => {
      if (!tx) return;
      const d = tx.created_at ? new Date(tx.created_at) : null;
      const key = d && !isNaN(d.getTime())
        ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
        : 'Hari Ini';

      if (!daysMap[key]) {
        daysMap[key] = { date: key, omset: 0, total: 0, success: 0 };
      }

      daysMap[key].total += 1;
      if (tx.status === 'success') {
        daysMap[key].omset += Number(tx.price) || 0;
        daysMap[key].success += 1;
      }
    });

    // Return pure real-time data points - NO fake/sample seed data
    return Object.values(daysMap);
  }, [filteredTxs, timeRange]);

  // 2. Category / Game Distribution for BarChart - Pure Real-Time
  const categoryData = useMemo(() => {
    const catMap: Record<string, { name: string; count: number; omset: number }> = {};

    filteredTxs.forEach((tx) => {
      if (!tx) return;
      let cat = tx.layanan ? tx.layanan.split(' ')[0] : 'Lainnya';
      const low = (tx.layanan || '').toLowerCase();
      if (low.includes('mobile legends') || low.includes('mlbb')) cat = 'Mobile Legends';
      else if (low.includes('free fire') || low.includes('ff')) cat = 'Free Fire';
      else if (low.includes('pubg')) cat = 'PUBG Mobile';
      else if (low.includes('genshin')) cat = 'Genshin Impact';
      else if (low.includes('valorant')) cat = 'Valorant';
      else if (low.includes('roblox')) cat = 'Roblox';
      else if (low.includes('pln') || low.includes('listrik')) cat = 'PLN Listrik';
      else if (low.includes('pulsa') || low.includes('telkomsel') || low.includes('indosat') || low.includes('xl') || low.includes('axis') || low.includes('tri') || low.includes('smartfren')) {
        cat = 'Pulsa & Kuota';
      }

      if (!catMap[cat]) {
        catMap[cat] = { name: cat, count: 0, omset: 0 };
      }
      catMap[cat].count += 1;
      if (tx.status === 'success') {
        catMap[cat].omset += Number(tx.price) || 0;
      }
    });

    // Pure real-time: sorted descending, NO dummy games added if empty
    return Object.values(catMap).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [filteredTxs]);

  // 3. Status Ratio Data for PieChart - Pure Real-Time (NO Sample Data)
  const statusPieData = useMemo(() => {
    const counts = {
      success: filteredTxs.filter((t) => t && t.status === 'success').length,
      pending: filteredTxs.filter((t) => t && t.status === 'pending').length,
      failed: filteredTxs.filter((t) => t && t.status === 'failed').length,
      cancel: filteredTxs.filter((t) => t && t.status === 'cancel').length,
    };

    // Strictly returns only statuses that have real count > 0.
    // If total real orders is 0, returns empty array [] with NO sample fallback (e.g. 85, 10, 5).
    const items: Array<{ name: string; value: number; color: string; pct: number }> = [];
    const total = filteredTxs.length;

    if (counts.success > 0) {
      items.push({
        name: 'Sukses',
        value: counts.success,
        color: STATUS_COLORS.Sukses,
        pct: total > 0 ? Math.round((counts.success / total) * 100) : 0,
      });
    }
    if (counts.pending > 0) {
      items.push({
        name: 'Pending',
        value: counts.pending,
        color: STATUS_COLORS.Pending,
        pct: total > 0 ? Math.round((counts.pending / total) * 100) : 0,
      });
    }
    if (counts.failed > 0) {
      items.push({
        name: 'Gagal',
        value: counts.failed,
        color: STATUS_COLORS.Gagal,
        pct: total > 0 ? Math.round((counts.failed / total) * 100) : 0,
      });
    }
    if (counts.cancel > 0) {
      items.push({
        name: 'Batal',
        value: counts.cancel,
        color: STATUS_COLORS.Batal,
        pct: total > 0 ? Math.round((counts.cancel / total) * 100) : 0,
      });
    }

    return items;
  }, [filteredTxs]);

  // 4. Payment Method Distribution - Pure Real-Time (NO Sample Data)
  const paymentMethodData = useMemo(() => {
    const map: Record<string, number> = {};

    filteredTxs.forEach((tx) => {
      if (!tx) return;
      const pm = (tx.payment_method || '').toLowerCase();
      let label = 'Transfer Bank';
      if (pm.includes('saldo') || pm.includes('balance')) label = 'Saldo Akun';
      else if (pm.includes('qris')) label = 'QRIS Dinamis';
      else if (pm.includes('va') || pm.includes('virtual')) label = 'Virtual Account';

      map[label] = (map[label] || 0) + 1;
    });

    // Pure real-time: NO dummy payment methods if empty
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .filter((item) => item.count > 0);
  }, [filteredTxs]);

  const hasAnyRealData = filteredTxs.length > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-cyan-500 to-indigo-600 rounded-xl text-white shadow-md shadow-indigo-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-base">
                Visualisasi Analitik &amp; Diagram Real-Time
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>100% Real-Time (No Sample)</span>
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Statistik penjualan, rasio pesanan, dan omset murni dari database tanpa data contoh atau data default.
            </p>
          </div>
        </div>

        {/* Time Filter Pills */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              timeRange === '7d'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            7 Hari
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              timeRange === '30d'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            30 Hari
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              timeRange === 'all'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua Periode
          </button>
        </div>
      </div>

      {/* 4 Summary Highlight Cards - Pure Real-Time Numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omset */}
        <div className="p-5 bg-gradient-to-br from-white to-indigo-50/50 border border-slate-200 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Omset Penjualan (Sukses)</span>
            <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            Rp {Number(metrics.totalRevenue || 0).toLocaleString('id-ID')}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{metrics.successCount} transaksi sukses</span>
          </div>
        </div>

        {/* Total Transaksi Masuk */}
        <div className="p-5 bg-gradient-to-br from-white to-cyan-50/50 border border-slate-200 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Total Pesanan Masuk</span>
            <div className="p-1.5 rounded-lg bg-cyan-100 text-cyan-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {metrics.totalCount} <span className="text-sm font-normal text-slate-500">pesanan</span>
          </div>
          <div className="text-[11px] text-slate-500">
            {timeRange === '7d' ? '7 hari terakhir' : timeRange === '30d' ? '30 hari terakhir' : 'Seluruh waktu'}
          </div>
        </div>

        {/* Success Rate */}
        <div className="p-5 bg-gradient-to-br from-white to-emerald-50/50 border border-slate-200 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Tingkat Sukses (Success Rate)</span>
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {metrics.successRate}%
          </div>
          <div className="text-[11px] text-slate-500">
            {hasAnyRealData
              ? `${metrics.successCount} dari ${metrics.totalCount} pesanan selesai`
              : 'Belum ada transaksi pada periode ini'}
          </div>
        </div>

        {/* Average Order Value */}
        <div className="p-5 bg-gradient-to-br from-white to-amber-50/50 border border-slate-200 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Rata-rata Nilai Order (AOV)</span>
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            Rp {Number(metrics.avgOrderValue || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-slate-500">
            Dihitung dari pesanan berstatus sukses
          </div>
        </div>
      </div>

      {/* Row 1: Area Chart (Omset Trend) & Pie Chart (Rasio Status Pesanan Murni) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart: Tren Omset & Pesanan Real-Time */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>Tren Omset &amp; Volume Pesanan Real-Time</span>
              </h4>
              <p className="text-xs text-slate-500">
                Data omset harian dan pesanan berhasil murni dari database
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="omsetGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="txGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => (val >= 1000 ? `${Math.round(val / 1000)}k` : val)}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#06b6d4' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: any, name: any) => {
                    const strName = String(name || '');
                    if (strName === 'Omset (Rp)') return [`Rp ${Number(value).toLocaleString('id-ID')}`, strName];
                    return [value, strName];
                  }}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '12px',
                    color: '#0f172a',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="omset"
                  name="Omset (Rp)"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#omsetGradient)"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="success"
                  name="Order Berhasil"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#txGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Rasio Status Pesanan - 100% MURNI REAL-TIME */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-cyan-600" />
                <span>Rasio Status Pemesanan</span>
              </h4>
              <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                Murni Real-Time
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Proporsi riil status seluruh pesanan tanpa data contoh
            </p>
          </div>

          {statusPieData.length === 0 ? (
            /* Clean Empty State when total real orders is 0 */
            <div className="h-56 w-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <PieIcon className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-slate-700">
                Belum Ada Data Rasio Pesanan
              </div>
              <p className="text-[11px] text-slate-400 max-w-[200px] leading-relaxed">
                Data rasio dihitung 100% murni saat pesanan pengguna masuk. Tidak ada data contoh yang ditampilkan.
              </p>
            </div>
          ) : (
            /* Pure Real-Time Pie Chart */
            <div className="h-56 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any) => [`${val} Pesanan`, String(name)]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '10px',
                      color: '#0f172a',
                      fontSize: '11px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Inner text overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-slate-800">{metrics.totalCount}</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase">Total Order</span>
              </div>
            </div>
          )}

          {/* Breakdown List of Real Statuses */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            {statusPieData.length > 0 ? (
              statusPieData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs bg-slate-50/80 p-1.5 rounded-lg border border-slate-100">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                  <span className="text-slate-600 font-medium truncate">{item.name}</span>
                  <div className="ml-auto text-right">
                    <strong className="text-slate-900 font-black">{item.value}</strong>
                    <span className="text-[10px] text-slate-400 ml-1 font-mono">({item.pct}%)</span>
                  </div>
                </div>
              ))
            ) : (
              ['Sukses', 'Pending', 'Gagal', 'Batal'].map((st) => (
                <div key={st} className="flex items-center justify-between text-xs bg-slate-50/50 p-1.5 rounded-lg border border-slate-100 text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[st] }}></span>
                    <span>{st}</span>
                  </span>
                  <span className="font-mono font-bold">0</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Top Games Categories BarChart & Payment Methods - 100% Real-Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Games Topup BarChart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-indigo-600" />
                <span>Game &amp; Kategori Terpopuler</span>
              </h4>
              <p className="text-xs text-slate-500">
                Distribusi frekuensi pesanan per kategori produk (Real-Time)
              </p>
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              {categoryData.length} Kategori Aktif
            </span>
          </div>

          {categoryData.length === 0 ? (
            <div className="h-64 w-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
              <Gamepad2 className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="text-xs font-bold text-slate-700">Belum Ada Pesanan Game</div>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Grafik kategori terpopuler akan otomatis muncul saat pengguna melakukan transaksi pembelian produk.
              </p>
            </div>
          ) : (
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    width={110}
                  />
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      String(name) === 'count' ? `${val} Pesanan` : `Rp ${Number(val).toLocaleString('id-ID')}`,
                      String(name) === 'count' ? 'Frekuensi' : 'Total Omset',
                    ]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '12px',
                      color: '#0f172a',
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {categoryData.map((_, index) => (
                      <Cell key={`bar-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Payment Methods Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-cyan-600" />
                <span>Metode Pembayaran Pilihan</span>
              </h4>
              <p className="text-xs text-slate-500">
                Channel pembayaran yang digunakan pelanggan (Real-Time)
              </p>
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              {paymentMethodData.length} Channel
            </span>
          </div>

          {paymentMethodData.length === 0 ? (
            <div className="h-64 w-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
              <CreditCard className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="text-xs font-bold text-slate-700">Belum Ada Transaksi Pembayaran</div>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Grafik metode pembayaran akan menampilkan channel riil (QRIS, Saldo, Transfer) saat ada transaksi masuk.
              </p>
            </div>
          ) : (
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentMethodData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(val: any) => [`${val} Pesanan`, 'Digunakan']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '12px',
                      color: '#0f172a',
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Bar dataKey="count" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
