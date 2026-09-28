import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Wallet,
  QrCode,
  Building2,
  Lock,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Gamepad2,
} from 'lucide-react';
import { api } from '../services/api.js';
import type { ProductItem, User, TransactionRecord } from '../types.js';

interface OrderFormProps {
  product: ProductItem | null;
  allProducts: ProductItem[];
  user: User | null;
  onClose: () => void;
  onSuccessOrder: (transaction: TransactionRecord) => void;
  onOpenDeposit: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  product,
  allProducts,
  user,
  onClose,
  onSuccessOrder,
  onOpenDeposit,
  onOpenAuth,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(product);
  const [targetId, setTargetId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'saldo' | 'qris' | 'bank' | 'va'>('qris');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderDenomSort, setOrderDenomSort] = useState<'all' | 'rekomendasi' | 'termurah' | 'termahal'>('rekomendasi');

  useEffect(() => {
    setSelectedProduct(product);
    if (product) {
      const pCost = product.sellPrice || product.price;
      // Default to saldo only if user is logged in AND has sufficient balance
      if (user && (user.balance || 0) >= pCost) {
        setPaymentMethod('saldo');
      } else {
        setPaymentMethod('qris');
      }
    }
  }, [product, user]);

  if (!selectedProduct) return null;

  // Helper to determine if item is recommended
  const isOrderRecommended = (p: ProductItem): boolean => {
    const name = (p.name || '').toLowerCase();
    if (name.includes('weekly pass') || name.includes('twilight') || name.includes('starlight')) return true;
    if (name.includes('86 diamond') || name.includes('172 diamond') || name.includes('257 diamond') || name.includes('706 diamond')) return true;
    if (name.includes('140 diamond') || name.includes('355 diamond') || name.includes('720 diamond') || name.includes('membership')) return true;
    if (name.includes('token pln 20.000') || name.includes('token pln 50.000') || name.includes('token pln 100.000')) return true;
    if (name.includes('5.000') || name.includes('10.000') || name.includes('25.000') || name.includes('50.000') || name.includes('100.000')) return true;
    if (name.includes('flash') || name.includes('promo') || name.includes('terlaris') || name.includes('hemat')) return true;
    return false;
  };

  // Filter sibling products from same provider
  const siblingProducts = allProducts.filter(
    (p) => p.provider === selectedProduct.provider && !p.isPostpaid
  );

  // Sorted/Filtered sibling products
  let sortedSiblingProducts = [...siblingProducts];
  if (orderDenomSort === 'rekomendasi') {
    const recs = siblingProducts.filter((p) => isOrderRecommended(p));
    if (recs.length > 0) {
      sortedSiblingProducts = recs;
    }
  } else if (orderDenomSort === 'termurah') {
    sortedSiblingProducts.sort((a, b) => (a.sellPrice || a.price) - (b.sellPrice || b.price));
  } else if (orderDenomSort === 'termahal') {
    sortedSiblingProducts.sort((a, b) => (b.sellPrice || b.price) - (a.sellPrice || a.price));
  }

  const price = selectedProduct.sellPrice || selectedProduct.price;
  const prodCategory = String(selectedProduct.category || '').toLowerCase();
  const prodProvider = String(selectedProduct.provider || '').toLowerCase();

  const isGameWithZone =
    prodCategory.includes('game') &&
    (prodProvider.includes('mobile legends') ||
      prodProvider.includes('genshin'));

  const isPln = prodCategory.includes('pln');
  const isPulsa = prodCategory.includes('pulsa') || prodCategory.includes('e-money');

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!targetId.trim()) {
      setError(
        isPln
          ? 'Masukkan No. Meter / ID Pelanggan PLN.'
          : isPulsa
          ? 'Masukkan Nomor HP tujuan.'
          : 'Masukkan User ID akun game.'
      );
      return;
    }

    if (isGameWithZone && !zoneId.trim()) {
      setError('Masukkan Server / Zone ID akun.');
      return;
    }

    if (paymentMethod === 'saldo') {
      if (!user) {
        onOpenAuth('login');
        return;
      }
      if ((user.balance || 0) < price) {
        setError(`Saldo akun tidak mencukupi (Saldo: Rp ${Number(user?.balance || 0).toLocaleString('id-ID')}). Silakan isi saldo deposit terlebih dahulu.`);
        return;
      }
      if (user.hasPin && !pin) {
        setError('Masukkan 6 digit PIN Transaksi Keamanan Anda.');
        return;
      }
    }

    setLoading(true);

    try {
      const res = await api.createOrder({
        code: selectedProduct.code,
        target: targetId.trim(),
        zone: zoneId.trim() || undefined,
        zone_id: zoneId.trim() || undefined,
        category: selectedProduct.category ? selectedProduct.category.toLowerCase() : undefined,
        brand: selectedProduct.provider ? selectedProduct.provider.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : undefined,
        payment_method: paymentMethod,
        pin: pin || undefined,
      });

      if (res.status && res.data) {
        onSuccessOrder(res.data);
      } else {
        setError(res.message || 'Gagal memproses transaksi.');
      }
    } catch (err: any) {
      setError('Terjadi kendala sistem. Permintaan terproteksi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">Formulir Pemesanan Resmi</h3>
              <p className="text-[11px] text-indigo-600 font-bold font-mono">Layanan: {selectedProduct.provider}</p>
            </div>
          </div>

          <button
            id="btn-close-order-form"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Target Identification */}
          <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">1</span>
                <span>
                  {isPln ? 'Nomor Meter / ID Pelanggan PLN' : isPulsa ? 'Nomor HP Tujuan' : 'Data Akun Game Tujuan'}
                </span>
              </label>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Format Terverifikasi</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className={isGameWithZone ? 'sm:col-span-2' : 'sm:col-span-3'}>
                <input
                  id="order-input-target"
                  type="text"
                  placeholder={
                    isPln
                      ? 'Contoh: 14238910291 (No. Meter/ID PLN)'
                      : isPulsa
                      ? 'Contoh: 081234567890'
                      : isGameWithZone
                      ? 'User ID (Contoh: 12345678)'
                      : 'Masukkan User ID / Nomor Tujuan'
                  }
                  value={targetId}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Auto-parse zone if user pastes format like "12345678 (2045)" or "12345678 2045"
                    if (isGameWithZone) {
                      const match = val.match(/^(\d{4,12})\s*[\(\/\s]\s*(\d{3,6})\s*\)?$/);
                      if (match) {
                        setTargetId(match[1]);
                        setZoneId(match[2]);
                        return;
                      }
                    }
                    setTargetId(val);
                  }}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 focus:border-indigo-500 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold shadow-sm"
                />
              </div>

              {isGameWithZone && (
                <div>
                  <input
                    id="order-input-zone"
                    type="text"
                    placeholder="Zone ID (2045)"
                    value={zoneId}
                    onChange={(e) => setZoneId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 focus:border-indigo-500 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold shadow-sm"
                  />
                </div>
              )}
            </div>

            {selectedProduct.note && (
              <p className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>{selectedProduct.note}</span>
              </p>
            )}
          </div>

          {/* STEP 2: Denomination Picker */}
          <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">2</span>
                <span>Pilih Nominal / Paket</span>
              </label>

              {/* Quick Sort Options */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setOrderDenomSort('rekomendasi')}
                  className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                    orderDenomSort === 'rekomendasi'
                      ? 'bg-amber-500 text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ⭐ Rekomendasi
                </button>
                <button
                  type="button"
                  onClick={() => setOrderDenomSort('termurah')}
                  className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                    orderDenomSort === 'termurah'
                      ? 'bg-emerald-600 text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  💰 Termurah
                </button>
                <button
                  type="button"
                  onClick={() => setOrderDenomSort('termahal')}
                  className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                    orderDenomSort === 'termahal'
                      ? 'bg-indigo-600 text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  💎 Termahal
                </button>
                <button
                  type="button"
                  onClick={() => setOrderDenomSort('all')}
                  className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                    orderDenomSort === 'all'
                      ? 'bg-slate-800 text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {sortedSiblingProducts.map((p) => {
                const isSelected = selectedProduct.code === p.code;
                const pPrice = p.sellPrice || p.price;
                const isRec = isOrderRecommended(p);
                return (
                  <button
                    key={p.code}
                    id={`denom-select-${p.code}`}
                    type="button"
                    onClick={() => setSelectedProduct(p)}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between shadow-sm relative ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-bold ring-1 ring-indigo-500'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="pr-2 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <p className="font-extrabold text-xs truncate text-slate-900">{p.name}</p>
                        {isRec && (
                          <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                            ⭐ Rekomendasi
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-indigo-600 font-mono">{p.code}</p>
                    </div>
                    <span className="text-xs font-black text-slate-900 font-mono shrink-0">
                      Rp {Number(pPrice || 0).toLocaleString('id-ID')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 3: Payment Method Selection */}
          <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">3</span>
                <span>Metode Pembayaran</span>
              </label>
              <span className="text-[10px] font-bold text-slate-500">
                Pilih salah satu metode
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* QRIS Standar (Recommended / Instant) */}
              <button
                type="button"
                id="pay-method-qris"
                onClick={() => setPaymentMethod('qris')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer shadow-sm relative ${
                  paymentMethod === 'qris'
                    ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20 text-slate-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-black text-xs text-slate-900">
                    <QrCode className="w-4 h-4 text-indigo-600" />
                    <span>QRIS</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full font-bold">
                    Otomatis 24 Jam
                  </span>
                </div>
                <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
                  Scan pakai BCA, Livin, BRImo, DANA, GoPay, OVO, ShopeePay
                </p>
                <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">Biaya PG: 0.7%</span>
                  <span className="font-black text-indigo-700 font-mono">
                    Rp {Number(Math.round(price * 1.007)).toLocaleString('id-ID')}
                  </span>
                </div>
              </button>

              {/* Saldo Akun */}
              <button
                type="button"
                id="pay-method-saldo"
                onClick={() => setPaymentMethod('saldo')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer shadow-sm relative ${
                  paymentMethod === 'saldo'
                    ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20 text-slate-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-black text-xs text-slate-900">
                    <Wallet className="w-4 h-4 text-indigo-600" />
                    <span>Saldo</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                    Bebas Biaya 0%
                  </span>
                </div>
                {user ? (
                  <div className="text-[11px] text-slate-600 flex justify-between pt-1 font-medium">
                    <span>Saldo Anda:</span>
                    <span className={`font-black font-mono ${(user?.balance || 0) < price ? 'text-rose-600' : 'text-slate-900'}`}>
                      Rp {Number(user?.balance || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                ) : (
                  <p className="text-[10px] text-amber-700 font-medium">Perlu login akun</p>
                )}
                <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">Potong Saldo:</span>
                  <span className="font-black text-slate-900 font-mono">
                    Rp {Number(price).toLocaleString('id-ID')}
                  </span>
                </div>
              </button>
            </div>

            {/* Warning if user chose Saldo but balance is not enough */}
            {paymentMethod === 'saldo' && user && (user.balance || 0) < price && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Saldo akun Anda <strong>Rp {Number(user.balance || 0).toLocaleString('id-ID')}</strong> (kurang <strong>Rp {Number(price - user.balance).toLocaleString('id-ID')}</strong>).
                  </span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qris')}
                    className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg font-bold text-[10px] hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    Bayar Pakai QRIS
                  </button>
                  <button
                    type="button"
                    onClick={onOpenDeposit}
                    className="px-2.5 py-1 bg-white border border-amber-300 text-amber-900 rounded-lg font-bold text-[10px] hover:bg-amber-100 transition-colors"
                  >
                    Isi Saldo
                  </button>
                </div>
              </div>
            )}

            {/* PIN Verification if using Saldo and PIN is configured */}
            {paymentMethod === 'saldo' && user && user.hasPin && (
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  PIN Transaksi Keamanan (6 Digit)
                </label>
                <div className="relative max-w-xs">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="order-input-pin"
                    type="password"
                    maxLength={6}
                    placeholder="••••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 focus:border-indigo-500 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono tracking-widest font-bold shadow-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Order Summary & Action */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold text-slate-500">
              Total Pembayaran ({paymentMethod === 'qris' ? 'QRIS Otomatis' : 'Saldo Akun'}):
            </p>
            <p className="text-xl font-black text-slate-900 font-mono">
              Rp {Number(paymentMethod === 'qris' ? Math.round(price * 1.007) : price).toLocaleString('id-ID')}
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              id="btn-cancel-order"
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold cursor-pointer"
            >
              Batal
            </button>
            <button
              id="btn-submit-order"
              type="button"
              onClick={handleSubmitOrder}
              disabled={loading}
              className="flex-1 sm:flex-initial px-6 py-2.5 bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white font-black rounded-xl text-xs shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Menyiapkan Pembayaran...</span>
                </>
              ) : paymentMethod === 'qris' ? (
                <>
                  <QrCode className="w-4 h-4" />
                  <span>Bayar via QRIS (Rp {Number(Math.round(price * 1.007)).toLocaleString('id-ID')})</span>
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  <span>Bayar via Saldo Akun (Rp {Number(price).toLocaleString('id-ID')})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
