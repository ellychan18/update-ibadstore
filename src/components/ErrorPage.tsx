import React from 'react';
import {
  ShieldAlert,
  FileQuestion,
  ServerCrash,
  Home,
  MessageCircle,
  RefreshCw,
  Search,
  ArrowLeft,
  Lock,
} from 'lucide-react';

export interface ErrorPageProps {
  code?: 403 | 404 | 500 | 503;
  title?: string;
  message?: string;
  incidentId?: string;
  onNavigateHome?: () => void;
  onRetry?: () => void;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({
  code = 404,
  title,
  message,
  incidentId,
  onNavigateHome,
  onRetry,
}) => {
  const is403 = code === 403;
  const is404 = code === 404;
  const is500 = code === 500 || code === 503;

  const defaultTitle = is403
    ? 'Akses Ditolak (Security Shield)'
    : is404
    ? 'Halaman Tidak Ditemukan'
    : 'Kendala Sistem Internal';

  const defaultMessage = is403
    ? 'Halaman atau fungsi ini hanya dapat diakses oleh Administrator resmi Ibad Store. Akses Anda telah dibatasi oleh sistem keamanan demi menjaga integritas data.'
    : is404
    ? 'Halaman, produk, atau tautan yang Anda tuju telah dipindahkan atau belum terdaftar pada katalog resmi Ibad Store.'
    : 'Terjadi pemulihan sementara pada server backend. Seluruh saldo dan transaksi Anda tetap aman 100% dan terlindungi.';

  const displayTitle = title || defaultTitle;
  const displayMessage = message || defaultMessage;
  const displayIncident = incidentId || `ERR-${Date.now().toString(36).toUpperCase()}`;

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12 animate-in fade-in zoom-in-95 duration-200">
      <div className="relative w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl text-center overflow-hidden">
        {/* Ambient Top Glow */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
            is403
              ? 'bg-rose-500/15'
              : is404
              ? 'bg-indigo-500/15'
              : 'bg-amber-500/15'
          }`}
        />

        {/* Icon Badge */}
        <div className="relative mx-auto mb-5 flex items-center justify-center">
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center border shadow-xl ${
              is403
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : is404
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            {is403 ? (
              <ShieldAlert className="w-10 h-10" />
            ) : is404 ? (
              <FileQuestion className="w-10 h-10" />
            ) : (
              <ServerCrash className="w-10 h-10" />
            )}
          </div>
        </div>

        {/* Status Code Large */}
        <div className="font-black text-6xl sm:text-7xl tracking-tighter bg-gradient-to-b from-white via-slate-200 to-slate-500 bg-clip-text text-transparent mb-2">
          {code}
        </div>

        {/* Pill Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-4 border">
          <span
            className={`w-2 h-2 rounded-full animate-ping ${
              is403 ? 'bg-rose-500' : is404 ? 'bg-indigo-500' : 'bg-amber-500'
            }`}
          />
          <span
            className={
              is403 ? 'text-rose-400' : is404 ? 'text-indigo-400' : 'text-amber-400'
            }
          >
            {is403
              ? '403 Forbidden Shield'
              : is404
              ? '404 Route Not Found'
              : '500 Server Error'}
          </span>
        </div>

        {/* Title & Message */}
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
          {displayTitle}
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto mb-8">
          {displayMessage}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </button>
          )}

          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Coba Lagi</span>
            </button>
          )}

          <a
            href="https://wa.me/6281515723808?text=Halo%20Admin%20Ibad%20Store%2C%20saya%20mengalami%20kendala%20error%20pada%20aplikasi."
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto px-6 py-3 bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Bantuan CS Admin WhatsApp</span>
          </a>
        </div>

        {/* Security Diagnostics Box */}
        <div className="pt-5 border-t border-slate-800/80 text-left font-mono text-[11px] text-slate-500 space-y-1 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/40">
          <div className="flex justify-between items-center">
            <span>Security Incident:</span>
            <span className="text-slate-300 font-semibold">{displayIncident}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Status Protocol:</span>
            <span className="text-slate-300">WAF Active (Strict TLS)</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Timestamp:</span>
            <span className="text-slate-400">{new Date().toLocaleTimeString('id-ID')} WIB</span>
          </div>
        </div>
      </div>
    </div>
  );
};
