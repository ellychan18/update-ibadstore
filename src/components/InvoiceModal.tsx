import React, { useState } from 'react';
import {
  X,
  Printer,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Shield,
  Receipt,
  Share2,
  Gamepad2,
  Phone,
  Send,
  Headphones,
} from 'lucide-react';
import type { TransactionRecord } from '../types.js';

interface InvoiceModalProps {
  transaction: TransactionRecord | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ transaction, onClose }) => {
  const [copied, setCopied] = useState<string | null>(null);

  if (!transaction) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-indigo-50/40 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Receipt className="w-4 h-4" />
            </div>
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Struk Resmi Transaksi
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Receipt Area */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* Logo & Store Header */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-md mb-2">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">IBAD STORE</h3>
            <p className="text-[10px] text-indigo-600 font-bold font-mono">Transaksi Terverifikasi Otomatis</p>
          </div>

          {/* Status Chip */}
          <div className="flex justify-center">
            {transaction.status === 'success' ? (
              <span className="px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                PEMBAYARAN SUKSES
              </span>
            ) : transaction.status === 'pending' ? (
              <span className="px-4 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-xs font-black flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                TRANSAKSI DIPROSES
              </span>
            ) : (
              <span className="px-4 py-1.5 rounded-full bg-rose-100 border border-rose-200 text-rose-800 text-xs font-black">
                TRANSAKSI GAGAL
              </span>
            )}
          </div>

          {/* Details Table */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500 text-[11px] font-semibold">No. Invoice / Reff</span>
              <div className="flex items-center gap-1 font-mono font-black text-indigo-600">
                <span>{transaction.reff_id}</span>
                <button
                  onClick={() => handleCopy(transaction.reff_id, 'reff')}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  {copied === 'reff' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-between text-slate-700 font-medium">
              <span className="text-slate-500">Waktu:</span>
              <span className="font-mono font-bold text-slate-900">
                {transaction?.created_at ? new Date(transaction.created_at).toLocaleString('id-ID') : '-'}
              </span>
            </div>

            <div className="flex justify-between text-slate-700 font-medium">
              <span className="text-slate-500">Layanan:</span>
              <span className="font-black text-slate-900 text-right max-w-[200px] truncate">
                {transaction.layanan}
              </span>
            </div>

            <div className="flex justify-between text-slate-700 font-medium">
              <span className="text-slate-500">Nomor / ID Tujuan:</span>
              <span className="font-mono font-black text-slate-900">{transaction.target}</span>
            </div>

            <div className="flex justify-between text-slate-700 font-medium">
              <span className="text-slate-500">Metode Pembayaran:</span>
              <span className="capitalize font-bold text-slate-900">{transaction.payment_method}</span>
            </div>

            {/* Serial Number */}
            <div className="pt-2 border-t border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-700 font-bold">Serial Number / Token:</span>
                {transaction.sn && (
                  <button
                    onClick={() => handleCopy(transaction.sn!, 'sn')}
                    className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer font-bold"
                  >
                    {copied === 'sn' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied === 'sn' ? 'Disalin' : 'Salin'}</span>
                  </button>
                )}
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 font-mono text-emerald-600 font-black break-all text-center shadow-sm">
                {transaction.sn || (transaction.status === 'pending' ? 'Sedang diproses oleh provider...' : '-')}
              </div>
            </div>

            {/* Total Price */}
            <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm font-black text-slate-900">
              <span>Total Bayar:</span>
              <span className="text-indigo-600 font-mono text-base">
                Rp {Number(transaction?.price || 0).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Contact Admin / CS for this transaction */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
              <span className="flex items-center gap-1.5 text-slate-800">
                <Headphones className="w-3.5 h-3.5 text-indigo-600" />
                <span>Butuh Bantuan Transaksi Ini?</span>
              </span>
              <span className="text-[10px] text-emerald-600 font-bold">Admin CS 24 Jam</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`https://wa.me/6281515723808?text=${encodeURIComponent(
                  `Halo Admin Ibad Store, saya butuh bantuan untuk transaksi Invoice: ${
                    transaction.reff_id || transaction.id
                  } (${transaction.layanan || transaction.code}). Status: ${transaction.status}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>WhatsApp CS</span>
              </a>

              <a
                href="https://t.me/leviiwashere"
                target="_blank"
                rel="noreferrer"
                className="py-2 px-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Telegram CS</span>
              </a>
            </div>
          </div>

          <p className="text-center text-[10px] text-slate-400 font-medium leading-tight">
            Struk ini adalah bukti pembayaran digital sah dari Ibad Store yang dilindungi enkripsi sistem.
          </p>
        </div>

        {/* Modal footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold cursor-pointer"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk</span>
          </button>
        </div>
      </div>
    </div>
  );
};
