import React, { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Receipt,
  Download,
  ExternalLink,
  Ban,
  AlertTriangle,
  ArrowLeft,
  XCircle,
} from 'lucide-react';
import QRCode from 'qrcode';
import { api } from '../services/api.js';
import type { TransactionRecord } from '../types.js';

interface QrisOrderModalProps {
  transaction: TransactionRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (updatedTx: TransactionRecord) => void;
  onCancelOrder?: (cancelledTx: TransactionRecord) => void;
}

export const QrisOrderModal: React.FC<QrisOrderModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onPaymentSuccess,
  onCancelOrder,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 mins
  const [currentTx, setCurrentTx] = useState<TransactionRecord | null>(transaction);

  useEffect(() => {
    setCurrentTx(transaction);
    setShowCancelConfirm(false);
    setCancelError(null);

    if (transaction?.payment_status === 'paid' || transaction?.status === 'success') {
      setPaid(true);
      setCancelled(false);
    } else if (transaction?.payment_status === 'cancelled' || (transaction?.status === 'failed' && transaction?.sn?.includes('Dibatalkan'))) {
      setCancelled(true);
      setPaid(false);
    } else {
      setPaid(false);
      setCancelled(false);
    }
  }, [transaction]);

  // Generate QR code data URL from direct qr_image or qr_string
  useEffect(() => {
    if (currentTx?.qr_image && currentTx.qr_image.startsWith('data:image/png;base64')) {
      // Use direct authentic high-res PNG base64 returned by Betabotz Paygate DANA gateway
      setQrDataUrl(currentTx.qr_image);
    } else if (currentTx?.qr_string) {
      QRCode.toDataURL(currentTx.qr_string, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((e) => console.error('[QRIS Modal] Render error:', e));
    } else if (currentTx?.qr_image) {
      setQrDataUrl(currentTx.qr_image);
    } else {
      setQrDataUrl(null);
    }
  }, [currentTx]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || paid || cancelled) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, paid, cancelled]);

  // Auto-poll status every 3.5 seconds
  useEffect(() => {
    if (!isOpen || !currentTx || paid || cancelled || showCancelConfirm) return;

    const poll = async () => {
      try {
        const res = await api.checkOrder(currentTx.reff_id);
        if (res.status && res.data) {
          if (res.data.payment_status === 'paid' || res.data.status === 'success') {
            setPaid(true);
            setCurrentTx(res.data);
            onPaymentSuccess(res.data);
          } else if (res.data.payment_status === 'cancelled') {
            setCancelled(true);
            setCurrentTx(res.data);
          }
        }
      } catch (err) {
        // silent polling
      }
    };

    const pollInterval = setInterval(poll, 3500);
    return () => clearInterval(pollInterval);
  }, [isOpen, currentTx, paid, cancelled, showCancelConfirm, onPaymentSuccess]);

  if (!isOpen || !currentTx) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleManualCheck = async () => {
    setChecking(true);
    setCancelError(null);
    try {
      const res = await api.checkOrder(currentTx.reff_id);
      if (res.status && res.data) {
        setCurrentTx(res.data);
        if (res.data.payment_status === 'paid' || res.data.status === 'success') {
          setPaid(true);
          onPaymentSuccess(res.data);
        } else if (res.data.payment_status === 'cancelled') {
          setCancelled(true);
        }
      }
    } catch (err) {
      console.warn('Manual check error:', err);
    } finally {
      setChecking(false);
    }
  };

  const handleExecuteCancel = async () => {
    if (!currentTx) return;
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await api.cancelOrder(currentTx.reff_id);
      if (res.status) {
        const updated = res.data || {
          ...currentTx,
          status: 'failed',
          payment_status: 'cancelled',
          sn: 'Dibatalkan oleh pelanggan',
        };
        setCurrentTx(updated);
        setCancelled(true);
        setShowCancelConfirm(false);
        onCancelOrder?.(updated);
      } else {
        setCancelError(res.message || 'Gagal membatalkan pembayaran.');
      }
    } catch (err: any) {
      setCancelError(err.message || 'Terjadi kesalahan sistem saat membatalkan pembayaran.');
    } finally {
      setCancelling(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const totalNominal = currentTx.total_payment || currentTx.price;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black tracking-wide uppercase">Pembayaran QRIS Realtime</h3>
              <p className="text-[10px] text-indigo-300 font-mono">Pembayaran QRIS Otomatis 24 Jam</p>
            </div>
          </div>

          <button
            id="btn-close-qris-order"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Tutup Jendela"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {paid ? (
            /* SUCCESS STATE */
            <div className="py-6 text-center space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">Pembayaran QRIS Berhasil!</h4>
                <p className="text-[11px] text-slate-600 mt-1">
                  Dana telah terverifikasi otomatis. Pesanan Anda sedang diproses kilat ke nomor/ID tujuan.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between text-slate-500">
                  <span>Layanan:</span>
                  <span className="font-bold text-slate-900">{currentTx.layanan}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Tujuan:</span>
                  <span className="font-bold text-slate-900">{currentTx.target}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Total Bayar:</span>
                  <span className="font-black text-emerald-600">Rp {Number(totalNominal).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>No. Reff:</span>
                  <span className="font-bold text-indigo-600">{currentTx.reff_id}</span>
                </div>
              </div>

              <button
                id="btn-view-receipt-after-pay"
                onClick={() => {
                  onClose();
                  onPaymentSuccess(currentTx);
                }}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs rounded-xl shadow-md hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Receipt className="w-4 h-4" />
                <span>Lihat Struk Transaksi Resmi</span>
              </button>
            </div>
          ) : cancelled ? (
            /* CANCELLED STATE */
            <div className="py-6 text-center space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-rose-100 border border-rose-300 text-rose-600 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
                <XCircle className="w-9 h-9" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">Pembayaran QRIS Dibatalkan</h4>
                <p className="text-[11px] text-slate-600 mt-1">
                  Invoice pembayaran dan kode QRIS ini telah dinonaktifkan. Anda tidak akan dikenakan tagihan apapun.
                </p>
              </div>

              <div className="p-3.5 bg-rose-50/50 rounded-2xl border border-rose-200 text-left space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between text-slate-500">
                  <span>No. Reff:</span>
                  <span className="font-bold text-slate-900">{currentTx.reff_id}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Layanan:</span>
                  <span className="font-bold text-slate-900">{currentTx.layanan}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Status:</span>
                  <span className="font-black text-rose-600 uppercase">Dibatalkan</span>
                </div>
              </div>

              <button
                id="btn-close-cancelled-modal"
                onClick={onClose}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Tutup &amp; Kembali ke Katalog</span>
              </button>
            </div>
          ) : showCancelConfirm ? (
            /* CANCEL CONFIRMATION DIALOG */
            <div className="py-5 text-center space-y-4 animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-amber-100 border border-amber-300 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-900">Batalkan Pembayaran QRIS?</h4>
                <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                  Kode QRIS dinamis ini akan langsung dinonaktifkan dan tagihan pesanan akan ditutup. Anda yakin ingin membatalkan?
                </p>
              </div>

              {cancelError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-[11px] font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{cancelError}</span>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <button
                  id="btn-confirm-cancel-qris"
                  type="button"
                  onClick={handleExecuteCancel}
                  disabled={cancelling}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {cancelling ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Membatalkan Transaksi...</span>
                    </>
                  ) : (
                    <>
                      <Ban className="w-3.5 h-3.5" />
                      <span>Ya, Batalkan Pembayaran</span>
                    </>
                  )}
                </button>

                <button
                  id="btn-abort-cancel-qris"
                  type="button"
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={cancelling}
                  className="w-full py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  Kembali ke Pembayaran
                </button>
              </div>
            </div>
          ) : (
            /* PAYMENT PENDING QRIS STATE */
            <>
              {/* Order Brief Info */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold">Pesanan:</p>
                  <p className="font-extrabold text-slate-900 truncate max-w-[210px]">{currentTx.layanan}</p>
                  <p className="text-[10px] text-indigo-600 font-mono">Tujuan: {currentTx.target}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 font-semibold">Total Tagihan:</p>
                  <p className="text-sm font-black text-indigo-700 font-mono">
                    Rp {Number(totalNominal).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              {/* Countdown Bar */}
              <div className="flex items-center justify-between px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] font-semibold">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                  <span>Selesaikan Dalam:</span>
                </div>
                <span className="font-black font-mono text-amber-900 bg-white px-2 py-0.5 rounded-lg border border-amber-300">
                  {formattedTime}
                </span>
              </div>

              {/* QRIS Display Container */}
              <div className="flex flex-col items-center justify-center p-4 bg-white border-2 border-indigo-100 rounded-2xl shadow-sm text-center">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-black text-[9px] border border-red-200 tracking-wider">
                    QRIS RESMI
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium font-mono">
                    NMID: {currentTx.qr_string?.match(/ID[0-9]{13,16}/)?.[0] || 'ID1026594717583'}
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-2xl border-2 border-slate-900 shadow-md">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="QRIS Pembayaran Resmi"
                      className="w-56 h-56 object-contain rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-56 h-56 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-lg">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
                      <span className="text-[10px]">Membuat kode QRIS dinamis...</span>
                    </div>
                  )}
                </div>

                <p className="text-[11px] font-extrabold text-slate-800 mt-2">
                  Scan kode QRIS di atas dengan aplikasi apa saja
                </p>
                <p className="text-[10px] text-slate-500">
                  BCA Mobile, Livin Mandiri, BRImo, BNI, DANA, GoPay, OVO, ShopeePay, LinkAja
                </p>
              </div>

              {/* Nominal Copy Box */}
              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-indigo-700 font-bold block">Nominal Tepat (Wajib Sesuai):</span>
                  <span className="text-sm font-black text-indigo-950 font-mono">
                    Rp {Number(totalNominal).toLocaleString('id-ID')}
                  </span>
                </div>
                <button
                  id="btn-copy-qris-nominal"
                  onClick={() => handleCopy(String(totalNominal), 'nominal')}
                  className="px-3 py-1.5 bg-white border border-indigo-300 hover:border-indigo-400 text-indigo-700 rounded-lg font-black text-[10px] flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  {copied === 'nominal' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied === 'nominal' ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>

              {/* Real-time Status Indicator */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="font-medium text-[11px]">Menunggu pembayaran Anda...</span>
                </div>
                <button
                  id="btn-manual-check-qris"
                  onClick={handleManualCheck}
                  disabled={checking}
                  className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} />
                  <span>{checking ? 'Memeriksa...' : 'Cek Status'}</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions (Only when pending and not confirming cancel) */}
        {!paid && !cancelled && !showCancelConfirm && (
          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2.5">
            {/* Cancel Payment Button */}
            <button
              id="btn-cancel-qris-payment"
              type="button"
              onClick={() => setShowCancelConfirm(true)}
              className="px-3.5 py-2.5 border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Batalkan pembayaran QRIS ini"
            >
              <Ban className="w-3.5 h-3.5 text-rose-600" />
              <span>Batalkan</span>
            </button>

            {/* Confirm / Already Paid Button */}
            <button
              id="btn-confirm-already-paid"
              type="button"
              onClick={handleManualCheck}
              disabled={checking}
              className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
              <span>{checking ? 'Memverifikasi...' : 'Saya Sudah Bayar'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
