import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Wallet,
  QrCode,
  Copy,
  Check,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ExternalLink,
  Phone,
  Headphones,
  Zap,
  Download,
  Info,
} from 'lucide-react';
import { api } from '../services/api.js';
import type { DepositMethod, DepositOrder, User } from '../types.js';

interface DepositModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSuccessDeposit: (updatedUser: User) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  user,
  onClose,
  onSuccessDeposit,
  onOpenAuth,
}) => {
  const [methods, setMethods] = useState<DepositMethod[]>([]);
  const [nominal, setNominal] = useState<number>(50000);
  const [customNominal, setCustomNominal] = useState<string>('50000');
  const [activeTicket, setActiveTicket] = useState<DepositOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusChecking, setStatusChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(900); // 15 minutes default

  const quickNominals = [10000, 25000, 50000, 100000, 200000, 500000];

  useEffect(() => {
    if (isOpen) {
      api.getDepositMethods().then((res) => {
        if (res.status && Array.isArray(res.data)) {
          setMethods(res.data);
        }
      });
    }
  }, [isOpen]);

  // Restore pending active ticket if available in session
  useEffect(() => {
    if (isOpen && !activeTicket) {
      try {
        const saved = localStorage.getItem('ibad_active_deposit');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.id && parsed.status === 'pending') {
            setActiveTicket(parsed);
            api.getDepositStatus(parsed.id).then((res) => {
              if (res.status && res.data) {
                setActiveTicket(res.data);
                if (res.data.status === 'success') {
                  localStorage.removeItem('ibad_active_deposit');
                  api.getMe().then((meRes) => {
                    if (meRes.status && meRes.data) onSuccessDeposit(meRes.data);
                  });
                }
              }
            });
          }
        }
      } catch (e) {}
    }
  }, [isOpen]);

  // Generate QR Code if ticket has qr_string or qr_image
  useEffect(() => {
    if (activeTicket?.qr_image && activeTicket.qr_image.startsWith('data:image/png;base64')) {
      setQrDataUrl(activeTicket.qr_image);
    } else if (activeTicket?.qr_string) {
      QRCode.toDataURL(activeTicket.qr_string, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((e) => console.error('QR Render err', e));
    } else if (activeTicket?.qr_image) {
      setQrDataUrl(activeTicket.qr_image);
    } else {
      setQrDataUrl(null);
    }

    if (activeTicket?.expired_at) {
      const expTime = new Date(activeTicket.expired_at).getTime();
      const secLeft = Math.max(0, Math.floor((expTime - Date.now()) / 1000));
      setCountdown(secLeft);
    }
  }, [activeTicket]);

  // Countdown timer for active ticket
  useEffect(() => {
    if (!activeTicket || activeTicket.status !== 'pending' || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTicket, countdown]);

  // Real-time automatic polling loop for payment detection
  useEffect(() => {
    if (!activeTicket || activeTicket.status !== 'pending' || countdown <= 0) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await api.getDepositStatus(activeTicket.id);
        if (res.status && res.data) {
          if (res.data.status === 'success') {
            setActiveTicket(res.data);
            localStorage.removeItem('ibad_active_deposit');
            const meRes = await api.getMe();
            if (meRes.status && meRes.data) {
              onSuccessDeposit(meRes.data);
            }
          } else if (res.data.status !== activeTicket.status) {
            setActiveTicket(res.data);
            if (res.data.status !== 'pending') {
              localStorage.removeItem('ibad_active_deposit');
            }
          }
        }
      } catch (e) {
        // silent polling catch
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [activeTicket, countdown, onSuccessDeposit]);

  if (!isOpen) return null;

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Wallet className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-slate-900 mb-1">Masuk untuk Mengisi Saldo</h3>
          <p className="text-xs text-slate-500 mb-6 font-medium">
            Silakan masuk atau daftar akun terlebih dahulu untuk melakukan deposit saldo via QRIS.
          </p>
          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              Tutup
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenAuth('login');
              }}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-black shadow-md shadow-indigo-500/20 cursor-pointer"
            >
              Masuk Sekarang
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amount = Number(customNominal) || nominal;

    if (amount < 2000) {
      setError('Nominal deposit minimal adalah Rp 2.000.');
      return;
    }

    setLoading(true);

    try {
      // Exclusively QRIS deposit
      const res = await api.createDeposit({
        nominal: amount,
        type: 'qris',
        method: 'qris',
        metode: 'QRIS',
      });

      if (res.status && res.data) {
        setActiveTicket(res.data);
        localStorage.setItem('ibad_active_deposit', JSON.stringify(res.data));
      } else {
        setError(res.message || 'Gagal membuat tiket deposit QRIS.');
      }
    } catch (err: any) {
      setError('Terjadi kendala saat menghubungkan ke gateway QRIS.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!activeTicket) return;
    setStatusChecking(true);
    try {
      const res = await api.getDepositStatus(activeTicket.id);
      if (res.status && res.data) {
        setActiveTicket(res.data);
        if (res.data.status === 'success') {
          localStorage.removeItem('ibad_active_deposit');
          const meRes = await api.getMe();
          if (meRes.status && meRes.data) {
            onSuccessDeposit(meRes.data);
          }
        } else if (res.data.status !== 'pending') {
          localStorage.removeItem('ibad_active_deposit');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStatusChecking(false);
    }
  };

  const handleCancelTicket = async () => {
    if (!activeTicket) return;
    try {
      await api.cancelDeposit(activeTicket.id);
      localStorage.removeItem('ibad_active_deposit');
      setActiveTicket(null);
    } catch (err) {
      console.error(err);
      localStorage.removeItem('ibad_active_deposit');
      setActiveTicket(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Deposit Saldo (Hanya QRIS)</h3>
              <p className="text-[11px] text-indigo-600 font-bold font-mono">
                Saldo Anda: Rp {Number(user?.balance || 0).toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          <button
            id="btn-close-deposit-modal"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {!activeTicket ? (
            /* CREATE DEPOSIT TICKET VIEW */
            <form onSubmit={handleCreateTicket} className="space-y-5">
              {/* Nominal selector */}
              <div className="space-y-2.5">
                <label className="font-extrabold text-slate-900 block">Pilih Nominal Deposit</label>
                <div className="grid grid-cols-3 gap-2">
                  {quickNominals.map((nom) => (
                    <button
                      key={nom}
                      type="button"
                      onClick={() => {
                        setNominal(nom);
                        setCustomNominal(String(nom));
                      }}
                      className={`py-2.5 px-3 rounded-xl border font-mono font-black transition-all cursor-pointer shadow-xs ${
                        Number(customNominal) === nom
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/20'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      Rp {Number(nom || 0).toLocaleString('id-ID')}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="text-[11px] text-slate-600 font-semibold block mb-1">
                    Atau Masukkan Nominal Kustom (Min Rp 2.000)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400">
                      Rp
                    </span>
                    <input
                      id="input-custom-deposit"
                      type="number"
                      min={2000}
                      step={1000}
                      value={customNominal}
                      onChange={(e) => setCustomNominal(e.target.value)}
                      placeholder="50000"
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-300 focus:border-indigo-500 focus:bg-white rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-black shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Single Payment Method: QRIS Only */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-slate-900 block">Metode Pembayaran</label>
                  <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                    Hanya QRIS
                  </span>
                </div>

                <div className="p-4 rounded-2xl border-2 border-indigo-500 bg-indigo-50/50 relative overflow-hidden shadow-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-slate-900 text-xs">QRIS Realtime Otomatis</span>
                          <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase">
                            Instan
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                          Semua Bank (BCA, BRI, BNI, Mandiri, dll) &amp; E-Wallet (DANA, GoPay, OVO, ShopeePay)
                        </p>
                      </div>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Supported Banks & E-Wallets badge pills */}
                  <div className="mt-3 pt-3 border-t border-indigo-100 flex flex-wrap gap-1.5">
                    {['BCA Mobile', 'BRImo', 'Livin Mandiri', 'BNI Mobile', 'DANA', 'GoPay', 'OVO', 'ShopeePay', 'LinkAja'].map(
                      (item) => (
                        <span
                          key={item}
                          className="px-2 py-0.5 rounded-md bg-white border border-indigo-200/80 text-[10px] font-bold text-slate-700 shadow-2xs"
                        >
                          {item}
                        </span>
                      )
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-[11px]">
                  <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>
                    Deposit sistem kini <strong>khusus menggunakan QRIS</strong>. Saldo terverifikasi otomatis dalam detik setelah scan.
                  </span>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-1">
                <button
                  id="btn-create-deposit-ticket"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white font-black rounded-2xl text-xs shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Menyiapkan QRIS Otomatis...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Buat Pembayaran QRIS (Rp {Number(customNominal || nominal).toLocaleString('id-ID')})</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* ACTIVE DEPOSIT TICKET VIEW (QRIS ONLY) */
            <div className="space-y-4">
              {/* Ticket Status Bar */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block">ID Tiket Deposit</span>
                  <p className="font-mono font-black text-indigo-600 text-xs">{activeTicket.id || activeTicket.reff_id}</p>
                </div>
                <div>
                  {activeTicket.status === 'success' ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Saldo Berhasil Masuk</span>
                    </span>
                  ) : activeTicket.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        <span>Menunggu Pembayaran</span>
                      </span>
                      <span className="font-mono font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 text-xs">
                        {formatCountdown(countdown)}
                      </span>
                    </div>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black">
                      Dibatalkan / Kadaluarsa
                    </span>
                  )}
                </div>
              </div>

              {/* Total Amount to Pay */}
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl text-center space-y-1">
                <span className="text-[11px] text-slate-600 font-bold block">
                  Total Bayar (Sesuai Nominal):
                </span>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    Rp {Number(activeTicket.nominal || activeTicket.get_balance || 0).toLocaleString('id-ID')}
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        String(activeTicket.nominal || activeTicket.get_balance || 0),
                        'nominal'
                      )
                    }
                    className="p-1 text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    title="Salin Nominal"
                  >
                    {copied === 'nominal' ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  Saldo yang akan bertambah: <strong className="text-emerald-600 font-bold">Rp {Number(activeTicket.get_balance || activeTicket.nominal || 0).toLocaleString('id-ID')}</strong>
                </p>
              </div>

              {/* QRIS Code Display */}
              {(qrDataUrl || activeTicket.qr_image) ? (
                <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-3 shadow-xs">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-[11px] font-bold text-indigo-700">
                    <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Scan QRIS dengan Semua M-Banking / E-Wallet</span>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border-2 border-slate-200 shadow-md">
                    <img
                      src={activeTicket.qr_image || qrDataUrl || undefined}
                      alt="QRIS Deposit Resmi"
                      className="w-56 h-56 rounded-xl object-contain"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Copy QR String if available */}
                    {activeTicket.qr_string && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(activeTicket.qr_string || '', 'qr_string')}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copied === 'qr_string' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copied === 'qr_string' ? 'QR String Tersalin' : 'Salin Kode QRIS'}</span>
                      </button>
                    )}

                    {/* Download QR Image */}
                    {(qrDataUrl || activeTicket.qr_image) && (
                      <a
                        href={qrDataUrl || activeTicket.qr_image}
                        download={`QRIS-DEPOSIT-${activeTicket.id || 'ORDER'}.png`}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh Gambar QR</span>
                      </a>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono text-center">
                    Diverifikasi &amp; Diproses Otomatis oleh Sistem Pembayaran QRIS 24 Jam
                  </span>
                </div>
              ) : null}

              {/* Direct Payment URL */}
              {(activeTicket.payment_url || activeTicket.url) && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-[11px]">Ingin bayar via Web Checkout?</p>
                    <p className="text-[10px] text-slate-500">Buka langsung halaman pembayaran QRIS resmi</p>
                  </div>
                  <a
                    href={activeTicket.payment_url || activeTicket.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all shrink-0"
                  >
                    <span>Buka Web</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Contact Admin support for deposit */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0">
                    <Headphones className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 text-[11px] truncate">Kendala Deposit? Hubungi CS</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">WA: 081515723808 • @leviiwashere</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={`https://wa.me/6281515723808?text=${encodeURIComponent(
                      `Halo Admin Ibad Store, saya butuh konfirmasi untuk Tiket Deposit QRIS ID: ${activeTicket.id || activeTicket.reff_id} nominal Rp ${activeTicket.nominal?.toLocaleString('id-ID')}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-2xs transition-colors"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Chat WA</span>
                  </a>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCheckStatus}
                  disabled={statusChecking}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${statusChecking ? 'animate-spin' : ''}`} />
                  <span>Cek Status Pembayaran</span>
                </button>

                <button
                  type="button"
                  onClick={handleCancelTicket}
                  className="py-2.5 px-4 border border-slate-300 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batalkan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
