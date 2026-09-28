import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Wallet,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  KeyRound,
  ShieldCheck,
  Lock,
  Receipt,
  FileText,
  AlertCircle,
  RefreshCw,
  Camera,
  Sparkles,
  Gamepad2,
  Edit3,
} from 'lucide-react';
import { api } from '../services/api.js';
import type { User, TransactionRecord, DepositOrder } from '../types.js';
import { EditProfileModal } from './EditProfileModal.js';

interface UserDashboardProps {
  user: User;
  onOpenDeposit: () => void;
  onViewInvoice: (tx: TransactionRecord) => void;
  onRefreshUser: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  user,
  onOpenDeposit,
  onViewInvoice,
  onRefreshUser,
}) => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'deposits' | 'security'>('transactions');
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [deposits, setDeposits] = useState<DepositOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingDepId, setCheckingDepId] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinMessage, setPinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'transactions') {
        const res = await api.getOrderHistory();
        if (res.status && Array.isArray(res.data)) {
          setTransactions(res.data);
        }
      } else if (activeTab === 'deposits') {
        const res = await api.getDepositHistory();
        if (res.status && Array.isArray(res.data)) {
          setDeposits(res.data);
          onRefreshUser();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckDepositStatus = async (depId: string) => {
    setCheckingDepId(depId);
    try {
      const res = await api.getDepositStatus(depId);
      if (res.status && res.data) {
        const item = res.data;
        setDeposits((prev) => prev.map((d) => (d.id === depId || d.reff_id === depId ? item : d)));
        if (item.status === 'success') {
          onRefreshUser();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingDepId(null);
    }
  };

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinMessage(null);
    if (!/^\d{6}$/.test(pinInput)) {
      setPinMessage({ type: 'error', text: 'PIN harus berupa 6 angka rahasia.' });
      return;
    }

    try {
      const res = await api.setPin(pinInput);
      if (res.status) {
        setPinMessage({ type: 'success', text: 'PIN Transaksi Keamanan berhasil diperbarui!' });
        setPinInput('');
        onRefreshUser();
      } else {
        setPinMessage({ type: 'error', text: res.message || 'Gagal menyimpan PIN.' });
      }
    } catch (err) {
      setPinMessage({ type: 'error', text: 'Terjadi kendala sistem.' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* User Header Profile Card - Bright Gaming Theme */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        {/* Subtle Decorative Gradient Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-100/60 via-cyan-100/40 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          {/* Avatar and Identity */}
          <div className="flex items-center gap-5">
            {/* Interactive Avatar with Camera Overlay */}
            <div
              onClick={() => setEditProfileOpen(true)}
              className="relative group cursor-pointer"
              title="Klik untuk ubah foto profil"
            >
              <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-cyan-500 via-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-all flex items-center justify-center">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover bg-white"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-indigo-700 flex items-center justify-center text-white font-black text-2xl">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Edit Icon Overlay on Hover */}
              <div className="absolute inset-0 rounded-full bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Camera className="w-6 h-6" />
              </div>

              {/* Gamer Badge */}
              <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-indigo-600 text-white shadow-md border-2 border-white">
                <Camera className="w-3 h-3" />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {user.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-[10px] font-black uppercase shadow-sm">
                  {user.role === 'admin' ? 'Super Admin' : 'Member Pro'}
                </span>
              </div>
              <p className="text-xs text-indigo-600 font-mono font-semibold mt-0.5">
                @{user.username} • <span className="text-slate-500 font-normal">{user.email}</span>
              </p>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-2">
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Enkripsi 256-bit Aktif</span>
                </span>
                <span>•</span>
                <span>HP: {user.phone || '-'}</span>
              </div>

              {/* Edit Profile Button Trigger */}
              <button
                id="btn-open-edit-profile-dash"
                onClick={() => setEditProfileOpen(true)}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Ubah Foto Profil &amp; Akun</span>
              </button>
            </div>
          </div>

          {/* Saldo Card & Deposit CTA */}
          <div className="w-full sm:w-auto bg-slate-50 border border-slate-200 p-5 rounded-2xl flex items-center justify-between sm:justify-start gap-5 shadow-sm">
            <div>
              <p className="text-[11px] font-semibold text-slate-500">Saldo Dompet Akun</p>
              <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                Rp {Number(user?.balance || 0).toLocaleString('id-ID')}
              </p>
            </div>

            <button
              id="dashboard-btn-deposit"
              onClick={onOpenDeposit}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white font-extrabold rounded-xl text-xs shadow-md shadow-indigo-500/25 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Isi Saldo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        <button
          id="tab-dash-trx"
          type="button"
          onClick={() => setActiveTab('transactions')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'transactions'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Riwayat Transaksi</span>
        </button>

        <button
          id="tab-dash-dep"
          type="button"
          onClick={() => setActiveTab('deposits')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'deposits'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Riwayat Deposit</span>
        </button>

        <button
          id="tab-dash-sec"
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'security'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Pengaturan PIN &amp; Keamanan</span>
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
        {/* TAB 1: TRANSACTIONS */}
        {activeTab === 'transactions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Daftar Transaksi Terakhir</h3>
                <p className="text-xs text-slate-500">Semua pesanan voucher &amp; topup game yang pernah kamu lakukan</p>
              </div>
              <button
                onClick={loadData}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
                title="Muat ulang"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p>Belum ada riwayat transaksi.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-3 font-bold">Reff ID / Invoice</th>
                      <th className="pb-3 font-bold">Layanan</th>
                      <th className="pb-3 font-bold">Target Akun</th>
                      <th className="pb-3 font-bold">Total Harga</th>
                      <th className="pb-3 font-bold">Status</th>
                      <th className="pb-3 font-bold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((tx) => (
                      <tr key={tx.reff_id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 font-mono text-indigo-600 font-bold">{tx.reff_id}</td>
                        <td className="py-3.5 font-bold text-slate-900">{tx.layanan}</td>
                        <td className="py-3.5 font-mono text-slate-600">{tx.target}</td>
                        <td className="py-3.5 font-mono font-bold text-slate-900">
                          Rp {Number(tx?.price || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3.5">
                          {tx.status === 'success' ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                              Sukses
                            </span>
                          ) : tx.status === 'pending' ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                              Sedang Diproses
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold">
                              Gagal
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => onViewInvoice(tx)}
                            className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Lihat Struk
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DEPOSITS */}
        {activeTab === 'deposits' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Riwayat Pengisian Saldo (Deposit)</h3>
                <p className="text-xs text-slate-500">Histori pengisian saldo akun melalui QRIS Realtime Otomatis</p>
              </div>
              <button
                onClick={loadData}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {deposits.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                <Wallet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p>Belum ada riwayat deposit saldo.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-3 font-bold">ID Tiket</th>
                      <th className="pb-3 font-bold">Metode</th>
                      <th className="pb-3 font-bold">Nominal Transfer</th>
                      <th className="pb-3 font-bold">Saldo Diterima</th>
                      <th className="pb-3 font-bold">Status</th>
                      <th className="pb-3 font-bold">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {deposits.map((dep) => (
                      <tr key={dep.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 font-mono text-indigo-600 font-bold">{dep.reff_id}</td>
                        <td className="py-3.5 font-bold text-slate-900">{dep.metode || 'QRIS Instant'}</td>
                        <td className="py-3.5 font-mono font-semibold text-slate-800">
                          Rp {Number(dep?.nominal || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3.5 font-mono text-emerald-600 font-extrabold">
                          Rp {Number(dep?.get_balance || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3.5">
                          {dep.status === 'success' ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                              Berhasil Masuk
                            </span>
                          ) : dep.status === 'pending' ? (
                            <div className="flex items-center gap-1.5">
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                                Menunggu Transfer
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCheckDepositStatus(dep.id)}
                                disabled={checkingDepId === dep.id}
                                title="Periksa status pembayaran sekarang"
                                className="px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-bold border border-indigo-200 cursor-pointer flex items-center gap-1 transition-colors"
                              >
                                <RefreshCw className={`w-2.5 h-2.5 ${checkingDepId === dep.id ? 'animate-spin' : ''}`} />
                                Cek Status
                              </button>
                            </div>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">
                              Batal
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 text-slate-500 font-mono text-[11px]">
                          {new Date(dep.created_at).toLocaleDateString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SECURITY & PIN SETTINGS */}
        {activeTab === 'security' && (
          <div className="max-w-xl space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900">Keamanan Transaksi &amp; PIN</h3>
              <p className="text-xs text-slate-500">
                Lindungi saldo akun Anda dari transaksi tidak sah dengan mengaktifkan 6 Digit PIN Keamanan.
              </p>
            </div>

            {pinMessage && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                  pinMessage.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {pinMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{pinMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSetPin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {user.hasPin ? 'Ganti 6 Digit PIN Transaksi' : 'Buat 6 Digit PIN Transaksi Baru'}
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="input-user-pin"
                    type="password"
                    maxLength={6}
                    placeholder="Masukkan 6 angka rahasia"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 focus:border-indigo-500 focus:bg-white rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono tracking-widest font-bold"
                  />
                </div>
              </div>

              <button
                id="btn-save-pin"
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-extrabold rounded-xl text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
              >
                {user.hasPin ? 'Perbarui PIN Transaksi' : 'Aktifkan PIN Transaksi'}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-200 space-y-2">
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Status Enkripsi Akun Anda</span>
              </p>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>• Password dilindungi hashing PBKDF2-SHA512 (100.000 iterasi)</li>
                <li>• Session token ditandatangani secara kriptografis HMAC-SHA256</li>
                <li>• Riwayat transaksi terlindungi dengan perlindungan Anti-Injection WAF</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile & Avatar Modal */}
      {editProfileOpen && (
        <EditProfileModal
          user={user}
          isOpen={editProfileOpen}
          onClose={() => setEditProfileOpen(false)}
          onSuccess={(updated) => {
            onRefreshUser();
          }}
        />
      )}
    </div>
  );
};
