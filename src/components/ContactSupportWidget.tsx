import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  Send,
  Mail,
  Copy,
  Check,
  Headphones,
  ExternalLink,
  Clock,
  Sparkles,
  HelpCircle,
  MessageCircle,
} from 'lucide-react';

export const ContactSupportWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const CONTACTS = {
    whatsapp: {
      number: '6281515723808',
      display: '+62 815-1572-3808',
      url: 'https://wa.me/6281515723808?text=Halo%20Admin%20Ibad%20Store%2C%20saya%20butuh%20bantuan%20terkait%20layanan%20top%20up%20%2F%20transaksi.',
    },
    telegram: {
      handle: 'leviiwashere',
      display: '@leviiwashere',
      url: 'https://t.me/leviiwashere',
    },
    email: {
      address: 'ibadcode.id@gmail.com',
      display: 'ibadcode.id@gmail.com',
      url: 'mailto:ibadcode.id@gmail.com?subject=Bantuan%20Pelanggan%20Ibad%20Store',
    },
  };

  const handleCopy = (text: string, key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Close popup on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Mobile Backdrop Overlay when Support Modal is open */}
      {isOpen && (
        <div
          id="cs-modal-backdrop"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Support Dialog Card */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pusat Bantuan CS Admin Ibad Store"
          className="fixed z-[65] inset-x-3 bottom-20 sm:bottom-24 sm:right-6 sm:left-auto sm:inset-x-auto w-auto sm:w-[380px] max-w-full max-h-[85vh] overflow-y-auto bg-white border border-slate-200 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-slate-800"
        >
          {/* Header Card */}
          <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 text-white relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight flex items-center gap-1.5">
                    <span>Customer Support Admin</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  </h3>
                  <p className="text-[11px] text-slate-300 font-medium">
                    Layanan Resmi 24 Jam • Ibad Store
                  </p>
                </div>
              </div>

              <button
                id="btn-close-cs-modal"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Tutup"
                aria-label="Tutup Bantuan"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Response Time Badge */}
            <div className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-[11px] text-emerald-200">
              <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-semibold">Admin Aktif: Rata-rata respon &lt; 5 menit</span>
            </div>
          </div>

          {/* Contact Channels */}
          <div className="p-4 sm:p-5 space-y-3 bg-slate-50/70">
            {/* 1. WhatsApp Button Primary */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-400 hover:shadow-md transition-all">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        WhatsApp Resmi
                      </span>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-emerald-100 text-emerald-700 rounded-md">
                        Prioritas
                      </span>
                    </div>
                    <div className="text-xs font-black text-slate-900 font-mono truncate">
                      {CONTACTS.whatsapp.display}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleCopy(CONTACTS.whatsapp.number, 'wa', e)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Salin Nomor WhatsApp"
                  >
                    {copiedKey === 'wa' ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <a
                    id="btn-link-wa-cs"
                    href={CONTACTS.whatsapp.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 transition-all hover:scale-102 active:scale-98"
                  >
                    <span>Chat WA</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* 2. Telegram Support */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 hover:border-sky-400 hover:shadow-md transition-all">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center shrink-0">
                    <Send className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Telegram Admin
                    </div>
                    <div className="text-xs font-black text-slate-900 font-mono truncate">
                      {CONTACTS.telegram.display}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleCopy(CONTACTS.telegram.handle, 'tele', e)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Salin Username Telegram"
                  >
                    {copiedKey === 'tele' ? (
                      <Check className="w-4 h-4 text-sky-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <a
                    id="btn-link-tele-cs"
                    href={CONTACTS.telegram.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm shadow-sky-600/30 transition-all hover:scale-102 active:scale-98"
                  >
                    <span>Telegram</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* 3. Email Support */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-400 hover:shadow-md transition-all">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Email Dukungan
                    </div>
                    <div className="text-xs font-bold text-slate-900 font-mono truncate">
                      {CONTACTS.email.display}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleCopy(CONTACTS.email.address, 'email', e)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Salin Alamat Email"
                  >
                    {copiedKey === 'email' ? (
                      <Check className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <a
                    id="btn-link-email-cs"
                    href={CONTACTS.email.url}
                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm shadow-indigo-600/30 transition-all hover:scale-102 active:scale-98"
                  >
                    <span>Kirim</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Support Guide */}
            <div className="p-3 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-[11px] text-indigo-950 space-y-1">
              <div className="font-extrabold flex items-center gap-1.5 text-indigo-900">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Tips Bantuan Cepat:</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Sertakan <b>ID Pesanan/Invoice</b> dan <b>User ID Game</b> saat mengirim pesan agar admin dapat memverifikasi dan mempercepat penyelesaian dalam hitungan menit.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Trigger Button - Guaranteed Solid Positioning */}
      {/* Mobile: Round Compact FAB above BottomNav (bottom: 76px, right: 16px) */}
      {/* Desktop: Pill Badge (bottom: 24px, right: 24px) */}
      <aside
        aria-label="Kontak Customer Support"
        className="fixed z-40 print:hidden transition-all duration-300"
        style={{
          // Explicit inline positioning fallback for mobile & desktop to prevent browser layout anomalies
          right: '16px',
          bottom: isOpen ? '24px' : 'calc(4.75rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <button
          id="btn-floating-contact-support"
          onClick={() => setIsOpen(!isOpen)}
          className={`group flex items-center gap-2.5 rounded-full shadow-2xl transition-all duration-300 cursor-pointer border border-white/20 select-none ${
            isOpen
              ? 'bg-slate-900 text-white px-4 py-3 hover:bg-slate-800'
              : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white p-3 sm:px-4 sm:py-3 shadow-emerald-600/30 hover:shadow-emerald-600/50 hover:scale-105 active:scale-95'
          }`}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Tutup Bantuan CS' : 'Hubungi Customer Support Admin 24 Jam'}
        >
          {/* Status Ping Indicator (When closed) */}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white shadow-xs" />
            </span>
          )}

          {/* Icon */}
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            {isOpen ? <X className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
          </div>

          {/* Label: Always visible when open; Hidden on mobile when closed for clean unobtrusive FAB, visible on sm+ */}
          {isOpen ? (
            <span className="text-xs font-black tracking-wide pr-1">Tutup</span>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="hidden sm:inline text-xs font-black tracking-wide whitespace-nowrap">
                Chat CS Admin
              </span>
              <span className="inline sm:hidden text-[11px] font-black tracking-tight">
                CS
              </span>
            </div>
          )}
        </button>
      </aside>
    </>
  );
};
