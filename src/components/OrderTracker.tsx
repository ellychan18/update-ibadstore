import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Check,
  Printer,
  ShieldCheck,
  AlertCircle,
  Receipt,
  ArrowRight,
  Gamepad2,
  Phone,
  Send,
  Headphones,
} from 'lucide-react';
import { api } from '../services/api.js';
import type { TransactionRecord } from '../types.js';

interface OrderTrackerProps {
  onViewInvoice: (tx: TransactionRecord) => void;
}

export const OrderTracker: React.FC<OrderTrackerProps> = ({ onViewInvoice }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<TransactionRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await api.checkOrder(query.trim());
      if (res.status && res.data) {
        setResult(res.data);
      } else {
        setError(res.message || 'Transaksi tidak ditemukan. Periksa No. Invoice atau Reff ID Anda.');
      }
    } catch (err) {
      setError('Gagal memeriksa pesanan.');
    } finally {
      setLoading(false);
    }
  };

  const copySn = (sn: string) => {
    navigator.clipboard.writeText(sn);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Lacak Status Pesanan / Cek Transaksi
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Pantau proses pengisian pulsa, diamond game, token PLN &amp; voucher secara real-time
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar Form */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
        <form onSubmit={handleSearch} className="space-y-3">
          <label className="block text-xs font-bold text-slate-700">
            Masukkan No. Invoice, Reff ID, atau No. HP / ID Akun
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="input-tracker-query"
                type="text"
                placeholder="Contoh: IBAD-L9X9... atau 08123456789"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold shadow-sm"
              />
            </div>

            <button
              id="btn-track-order"
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white font-black rounded-2xl text-xs shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Mengecek...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Cek Pesanan</span>
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Result Card */}
      {result && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <span className="text-[11px] font-semibold text-slate-500">Nomor Referensi Transaksi</span>
              <h3 className="text-lg font-black text-indigo-600 font-mono">{result.reff_id}</h3>
            </div>

            <div className="flex items-center gap-2">
              {result.status === 'success' ? (
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-black flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Berhasil / Sukses</span>
                </span>
              ) : result.status === 'pending' ? (
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-xs font-black flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Sedang Diproses</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-xs font-black flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" />
                  <span>Transaksi Gagal</span>
                </span>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <p className="text-slate-500 font-semibold">Nama Layanan</p>
              <p className="font-extrabold text-slate-900 text-sm">{result.layanan || '-'}</p>
              <p className="text-[10px] text-indigo-600 font-mono">Kode: {result.code || '-'}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <p className="text-slate-500 font-semibold">Target / Akun</p>
              <p className="font-mono font-black text-slate-900 text-sm">{result.target || '-'}</p>
              <p className="text-[10px] text-slate-500">
                Waktu: {result.created_at ? new Date(result.created_at).toLocaleString('id-ID') : '-'}
              </p>
            </div>
          </div>

          {/* Serial Number (SN / Token) Display */}
          {result.sn && (
            <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-900">
                  Serial Number (SN) / Token / Bukti Ref
                </span>
                <button
                  onClick={() => copySn(result.sn || '')}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin' : 'Salin SN'}</span>
                </button>
              </div>
              <div className="p-3 bg-white border border-indigo-200 rounded-xl font-mono text-xs sm:text-sm font-black text-slate-900 select-all tracking-wider break-all shadow-sm">
                {result.sn}
              </div>
            </div>
          )}

          {/* Customer Support for Order */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Kendala Pesanan? Hubungi CS Admin</div>
                <div className="text-[11px] text-slate-500">Respon cepat 24 jam via WhatsApp &amp; Telegram</div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a
                href={`https://wa.me/6281515723808?text=${encodeURIComponent(
                  `Halo Admin Ibad Store, saya ingin menanyakan status pesanan ID: ${result.reff_id || result.id} (${result.layanan || result.code})`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-xs transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Chat WA</span>
              </a>

              <a
                href="https://t.me/leviiwashere"
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Telegram</span>
              </a>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs">
              <span className="text-slate-500 font-medium">Total Harga: </span>
              <span className="font-black text-slate-900 font-mono text-sm">
                Rp {Number(result.price || 0).toLocaleString('id-ID')}
              </span>
            </div>

            <button
              onClick={() => onViewInvoice(result)}
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Struk Resmi</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
