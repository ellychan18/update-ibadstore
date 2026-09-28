import React, { useState } from 'react';
import {
  FileText,
  Zap,
  HeartPulse,
  Wifi,
  PhoneCall,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Wallet,
  Receipt,
  ArrowRight,
  QrCode,
  Lock,
} from 'lucide-react';
import { api } from '../services/api.js';
import type { PostpaidInquiryResult, User, TransactionRecord } from '../types.js';

interface BillInquiryProps {
  user: User | null;
  onSuccessPay: (tx: TransactionRecord) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenDeposit: () => void;
}

export const BillInquiry: React.FC<BillInquiryProps> = ({
  user,
  onSuccessPay,
  onOpenAuth,
  onOpenDeposit,
}) => {
  const [selectedService, setSelectedService] = useState<'PPLN' | 'BPJS' | 'PINT1' | 'HP1'>('PPLN');
  const [customerNo, setCustomerNo] = useState('');
  const [inquiryResult, setInquiryResult] = useState<PostpaidInquiryResult | null>(null);
  const [loadingInquiry, setLoadingInquiry] = useState(false);
  const [loadingPay, setLoadingPay] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'saldo' | 'qris'>('saldo');
  const [pin, setPin] = useState('');

  const services = [
    {
      code: 'PPLN',
      name: 'PLN Pascabayar',
      desc: 'Tagihan Listrik Bulanan',
      icon: Zap,
      placeholder: 'Masukkan 12 digit ID Pelanggan PLN',
    },
    {
      code: 'BPJS',
      name: 'BPJS Kesehatan',
      desc: 'Iuran Bulanan BPJS Mandiri',
      icon: HeartPulse,
      placeholder: 'Masukkan 13 digit No. Kartu BPJS / Virtual Account',
    },
    {
      code: 'PINT1',
      name: 'Indihome / Telkom',
      desc: 'Internet Speedy & Telepon',
      icon: Wifi,
      placeholder: 'Masukkan Nomor Pelanggan / No. Telepon Rumah',
    },
    {
      code: 'HP1',
      name: 'Halo Postpaid',
      desc: 'Kartu Halo Pasca Bayar',
      icon: PhoneCall,
      placeholder: 'Masukkan Nomor Kartu Halo (0811/0812...)',
    },
  ];

  const currentService = services.find((s) => s.code === selectedService)!;

  const handleInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInquiryResult(null);

    if (!customerNo.trim()) {
      setError('Masukkan nomor pelanggan yang ingin dicek.');
      return;
    }

    setLoadingInquiry(true);

    try {
      const res = await api.inquireBill(selectedService, customerNo.trim());
      if (res.status && res.data) {
        setInquiryResult(res.data);
      } else {
        setError(res.message || 'Tagihan tidak ditemukan atau telah lunas.');
      }
    } catch (err) {
      setError('Gagal memeriksa data tagihan.');
    } finally {
      setLoadingInquiry(false);
    }
  };

  const handlePayBill = async () => {
    if (!inquiryResult) return;
    setError(null);

    if (paymentMethod === 'saldo') {
      if (!user) {
        onOpenAuth('login');
        return;
      }
      if ((user.balance || 0) < Number(inquiryResult.total_tagihan || 0)) {
        setError(
          `Saldo tidak mencukupi (Saldo: Rp ${Number(user?.balance || 0).toLocaleString('id-ID')}). Total tagihan: Rp ${Number(inquiryResult.total_tagihan || 0).toLocaleString('id-ID')}. Silakan isi saldo deposit.`
        );
        return;
      }
    }

    setLoadingPay(true);

    try {
      const res = await api.payBill({
        code: inquiryResult.code,
        customer_no: inquiryResult.nomor_pelanggan,
        reff_id: inquiryResult.reff_id,
        total_tagihan: inquiryResult.total_tagihan,
        payment_method: paymentMethod,
        pin: pin || undefined,
      });

      if (res.status && res.data) {
        onSuccessPay(res.data);
      } else {
        setError(res.message || 'Gagal memproses pembayaran tagihan.');
      }
    } catch (err) {
      setError('Terjadi kendala keamanan saat memproses pembayaran.');
    } finally {
      setLoadingPay(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header banner */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Cek &amp; Bayar Tagihan Pascabayar (PPOB)
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Inquiry resmi realtime terkoneksi langsung ke Server Pusat PLN, BPJS, dan Telkom
            </p>
          </div>
        </div>
      </div>

      {/* Service Type Switcher */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {services.map((srv) => {
          const Icon = srv.icon;
          const isSelected = selectedService === srv.code;
          return (
            <button
              key={srv.code}
              id={`service-btn-${String(srv?.code || 'service').toLowerCase()}`}
              type="button"
              onClick={() => {
                setSelectedService(srv.code as any);
                setInquiryResult(null);
                setError(null);
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between shadow-sm ${
                isSelected
                  ? 'bg-indigo-50 border-indigo-500 shadow-md shadow-indigo-500/10 scale-[1.02]'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {isSelected && (
                  <span className="text-[10px] text-indigo-700 font-black px-2 py-0.5 rounded-full bg-indigo-100">
                    Dipilih
                  </span>
                )}
              </div>
              <div>
                <p className="font-extrabold text-xs text-slate-900">{srv.name}</p>
                <p className="text-[10px] text-slate-500 truncate font-medium">{srv.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Inquiry Form */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-5">
        <form onSubmit={handleInquiry} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Nomor Pelanggan / ID Tagihan {currentService.name}</span>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Gateway Verified</span>
              </span>
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="input-customer-bill"
                  type="text"
                  placeholder={currentService.placeholder}
                  value={customerNo}
                  onChange={(e) => setCustomerNo(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold shadow-sm"
                />
              </div>

              <button
                id="btn-inquire-bill"
                type="submit"
                disabled={loadingInquiry}
                className="px-6 py-3 bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white font-black rounded-2xl text-xs shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {loadingInquiry ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Memeriksa Tagihan...</span>
                  </>
                ) : (
                  <>
                    <span>Cek Tagihan Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Inquiry Result Panel */}
        {inquiryResult && (
          <div className="mt-6 border-t border-slate-200 pt-6 space-y-5 animate-in fade-in">
            <div className="bg-indigo-50/60 border border-indigo-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-indigo-200/80">
                <span className="text-xs font-black text-indigo-900">Rincian Lembar Tagihan</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold">
                  Tagihan Belum Dibayar
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-slate-500 font-semibold">Nama Pelanggan:</p>
                  <p className="font-extrabold text-slate-900 text-sm">{inquiryResult.nama_pelanggan || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-semibold">ID / No. Pelanggan:</p>
                  <p className="font-mono font-bold text-slate-900">{inquiryResult.nomor_pelanggan || '-'}</p>
                </div>
                {inquiryResult.periode && (
                  <div>
                    <p className="text-slate-500 font-semibold">Periode Tagihan:</p>
                    <p className="font-bold text-slate-800">{inquiryResult.periode}</p>
                  </div>
                )}
                {inquiryResult.tarif_daya && (
                  <div>
                    <p className="text-slate-500 font-semibold">Tarif / Daya:</p>
                    <p className="font-bold text-slate-800">{inquiryResult.tarif_daya}</p>
                  </div>
                )}
              </div>

              {/* Total Calculation */}
              <div className="pt-3 border-t border-indigo-200/80 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-semibold">Total Tagihan &amp; Admin Gateway</p>
                  <p className="text-xl font-black text-slate-900 font-mono">
                    Rp {Number(inquiryResult.total_tagihan || 0).toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="btn-pay-postpaid"
                    onClick={handlePayBill}
                    disabled={loadingPay}
                    className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white font-black rounded-xl text-xs shadow-lg shadow-indigo-500/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    {loadingPay ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Membayar...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Bayar Tagihan Sekarang</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
