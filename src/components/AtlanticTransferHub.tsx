import React, { useState, useEffect } from 'react';
import {
  Building2,
  Wallet,
  Search,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Send,
  UserCheck,
  ShieldCheck,
  Info,
  DollarSign,
  User as UserIcon,
  Phone,
  Mail,
  FileText,
  Copy,
  ExternalLink,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { api } from '../services/api.js';

interface BankItem {
  id: string;
  bank_code: string;
  bank_name: string;
  type: 'bank' | 'ewallet' | string;
}

interface AtlanticProfileData {
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  balance?: string | number;
  status?: string;
}

interface AccountInquiryData {
  kode_bank?: string;
  nomor_akun?: string;
  nama_pemilik?: string;
  status?: string;
}

interface TransferResultData {
  id?: string;
  reff_id?: string;
  nama?: string;
  nomor_tujuan?: string;
  nominal?: number;
  fee?: number;
  total?: number;
  status?: string;
  bank_code?: string;
  detail?: {
    email?: string;
    phone?: string;
    note?: string;
  };
  created_at?: string;
}

export const AtlanticTransferHub: React.FC = () => {
  const [subTab, setSubTab] = useState<'profile' | 'bank_list' | 'check_account' | 'create_transfer' | 'transfer_status'>('profile');

  // Atlantic Profile State
  const [profileData, setProfileData] = useState<AtlanticProfileData | null>(null);
  const [rawProfileJson, setRawProfileJson] = useState<any>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileLatency, setProfileLatency] = useState<number | null>(null);

  // Bank List State
  const [bankList, setBankList] = useState<BankItem[]>([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [bankTypeFilter, setBankTypeFilter] = useState<'all' | 'bank' | 'ewallet'>('all');

  // Check Account State
  const [checkBankCode, setCheckBankCode] = useState('');
  const [checkAccountNo, setCheckAccountNo] = useState('');
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<AccountInquiryData | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  // Create Transfer State
  const [trfBankCode, setTrfBankCode] = useState('');
  const [trfAccountNo, setTrfAccountNo] = useState('');
  const [trfAccountName, setTrfAccountName] = useState('');
  const [trfNominal, setTrfNominal] = useState('');
  const [trfNote, setTrfNote] = useState('Transfer Dana Ibad Store');
  const [trfEmail, setTrfEmail] = useState('admin@ibadstore.id');
  const [trfPhone, setTrfPhone] = useState('085712345678');
  const [trfRefId, setTrfRefId] = useState('');
  const [trfLoading, setTrfLoading] = useState(false);
  const [trfResult, setTrfResult] = useState<TransferResultData | null>(null);
  const [trfError, setTrfError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Status Transfer State
  const [statusIdInput, setStatusIdInput] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusResult, setStatusResult] = useState<TransferResultData | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [recentLookups, setRecentLookups] = useState<string[]>([]);

  // Toast / Copy
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  useEffect(() => {
    fetchProfile();
    fetchBankList();
  }, []);

  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const res: any = await api.getAdminAtlanticProfile();
      if (res && res.status && res.data) {
        setProfileData(res.data);
        setRawProfileJson(res.raw || res.data);
        if (res.latencyMs !== undefined) setProfileLatency(res.latencyMs);
      }
    } catch (e: any) {
      console.error('Failed to fetch Atlantic profile:', e);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchBankList = async () => {
    setBankLoading(true);
    try {
      const res: any = await api.getAdminBankList();
      if (res && res.status && Array.isArray(res.data)) {
        setBankList(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch bank list:', e);
    } finally {
      setBankLoading(false);
    }
  };

  const handleExecuteCheckAccount = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!checkBankCode.trim() || !checkAccountNo.trim()) {
      setCheckError('Pilih kode bank dan masukkan nomor rekening.');
      return;
    }
    setCheckLoading(true);
    setCheckError(null);
    setCheckResult(null);

    try {
      const res: any = await api.adminCheckBankAccount({
        bank_code: checkBankCode.trim().toLowerCase(),
        account_number: checkAccountNo.trim(),
      });

      if (res && Boolean(res.status) && res.data) {
        setCheckResult(res.data);
      } else {
        setCheckError(res?.message || 'Nomor rekening tidak ditemukan atau respon tidak valid.');
      }
    } catch (err: any) {
      setCheckError(err.message || 'Gagal menghubungi server Atlantic H2H.');
    } finally {
      setCheckLoading(false);
    }
  };

  const handleUseCheckedAccountForTransfer = () => {
    if (!checkResult) return;
    setTrfBankCode(checkResult.kode_bank || checkBankCode);
    setTrfAccountNo(checkResult.nomor_akun || checkAccountNo);
    setTrfAccountName(checkResult.nama_pemilik || '');
    setSubTab('create_transfer');
  };

  const handleSelectBankForInquiry = (bank: BankItem) => {
    setCheckBankCode(bank.bank_code);
    setSubTab('check_account');
  };

  const handleSelectBankForTransfer = (bank: BankItem) => {
    setTrfBankCode(bank.bank_code);
    setSubTab('create_transfer');
  };

  const handleOpenTransferConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setTrfError(null);
    if (!trfBankCode.trim() || !trfAccountNo.trim() || !trfAccountName.trim() || !trfNominal) {
      setTrfError('Harap lengkapi semua kolom wajib transfer.');
      return;
    }
    if (Number(trfNominal) < 10000) {
      setTrfError('Nominal transfer minimal adalah Rp 10.000.');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleExecuteCreateTransfer = async () => {
    setShowConfirmModal(false);
    setTrfLoading(true);
    setTrfError(null);
    setTrfResult(null);

    const ref = trfRefId.trim() || `TRF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    try {
      const res: any = await api.adminCreateTransfer({
        ref_id: ref,
        kode_bank: trfBankCode.trim().toLowerCase(),
        nomor_akun: trfAccountNo.trim(),
        nama_pemilik: trfAccountName.trim(),
        nominal: Number(trfNominal),
        email: trfEmail.trim() || 'admin@ibadstore.id',
        phone: trfPhone.trim() || '085712345678',
        note: trfNote.trim() || 'Transfer Dana Ibad Store',
      });

      if (res && Boolean(res.status) && res.data) {
        setTrfResult(res.data);
        if (res.data.id) {
          setRecentLookups((prev) => [res.data.id!, ...prev.filter((x) => x !== res.data.id)]);
        }
        // Refresh balance
        fetchProfile();
      } else {
        setTrfError(res?.message || 'Gagal memproses transfer dana dari gateway Atlantic H2H.');
      }
    } catch (err: any) {
      setTrfError(err.message || 'Terjadi kesalahan sistem saat memproses transfer.');
    } finally {
      setTrfLoading(false);
    }
  };

  const handleExecuteCheckStatus = async (targetId?: string) => {
    const idToLookup = targetId || statusIdInput.trim();
    if (!idToLookup) {
      setStatusError('Masukkan ID Transfer yang valid.');
      return;
    }
    setStatusLoading(true);
    setStatusError(null);
    setStatusResult(null);

    try {
      const res: any = await api.adminCheckTransferStatus(idToLookup);
      if (res && Boolean(res.status) && res.data) {
        setStatusResult(res.data);
        setRecentLookups((prev) => [idToLookup, ...prev.filter((x) => x !== idToLookup)].slice(0, 10));
      } else {
        setStatusError(res?.message || 'Data transfer dengan ID tersebut tidak ditemukan.');
      }
    } catch (err: any) {
      setStatusError(err.message || 'Gagal mengambil status transfer.');
    } finally {
      setStatusLoading(false);
    }
  };

  // Filter bank list
  const filteredBanks = bankList.filter((b) => {
    if (!b) return false;
    const bType = String(b.type || 'bank').toLowerCase();
    const matchesType = bankTypeFilter === 'all' || bType === bankTypeFilter;
    const q = String(bankSearch || '').toLowerCase().trim();
    const bankCode = String(b.bank_code || (b as any).code || '').toLowerCase();
    const bankName = String(b.bank_name || (b as any).name || '').toLowerCase();
    const matchesSearch = !q || bankCode.includes(q) || bankName.includes(q);
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {copiedText && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{copiedText} disalin ke clipboard!</span>
        </div>
      )}

      {/* Sub Header Navigation - Bright Pill Bar */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 border border-slate-200 rounded-2xl">
        <button
          id="btn-subtab-profile"
          onClick={() => setSubTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
            subTab === 'profile'
              ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 text-white shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span>Get Profile &amp; Saldo H2H</span>
        </button>

        <button
          id="btn-subtab-banklist"
          onClick={() => setSubTab('bank_list')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
            subTab === 'bank_list'
              ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 text-white shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>List Bank ({bankList.length})</span>
        </button>

        <button
          id="btn-subtab-check"
          onClick={() => setSubTab('check_account')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
            subTab === 'check_account'
              ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 text-white shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Cek Rekening / E-Wallet</span>
        </button>

        <button
          id="btn-subtab-transfer"
          onClick={() => setSubTab('create_transfer')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
            subTab === 'create_transfer'
              ? 'bg-emerald-600 text-white shadow-sm font-black'
              : 'text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Create Transfer Dana</span>
        </button>

        <button
          id="btn-subtab-status"
          onClick={() => setSubTab('transfer_status')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
            subTab === 'transfer_status'
              ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 text-white shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Status Transfer</span>
        </button>
      </div>

      {/* ================= 1. GET PROFILE & LIVE BALANCE ================= */}
      {subTab === 'profile' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Live Balance Card */}
            <div className="md:col-span-2 rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-cyan-700 text-white p-6 sm:p-8 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex items-center justify-between gap-4 mb-4 relative z-10">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-black uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Atlantic H2H Profile Gateway</span>
                </div>
                
                <button
                  id="btn-refresh-profile"
                  onClick={fetchProfile}
                  disabled={profileLoading}
                  className="p-2 bg-white/15 hover:bg-white/25 text-white rounded-xl border border-white/20 cursor-pointer transition-all"
                  title="Refresh Profil & Saldo"
                >
                  <RefreshCw className={`w-4 h-4 ${profileLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="space-y-1 mb-6 relative z-10">
                <p className="text-xs text-indigo-100 font-medium">Saldo Utama Atlantic H2H (Live Realtime):</p>
                <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight flex items-baseline gap-2">
                  <span>
                    Rp {Number(profileData?.balance || 0).toLocaleString('id-ID')}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-300/40 text-emerald-200">
                    {profileData?.status === 'active' || profileData?.status === 'aktif' ? 'ACTIVE' : (profileData?.status || 'ONLINE')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/20 relative z-10">
                <div className="bg-black/15 backdrop-blur-md border border-white/15 rounded-2xl p-3">
                  <div className="text-[10px] text-indigo-200 uppercase font-bold">Nama Akun</div>
                  <div className="text-xs font-black text-white truncate">{profileData?.name || 'Nur Ibad'}</div>
                </div>

                <div className="bg-black/15 backdrop-blur-md border border-white/15 rounded-2xl p-3">
                  <div className="text-[10px] text-indigo-200 uppercase font-bold">Username</div>
                  <div className="text-xs font-black text-cyan-200 truncate">@{profileData?.username || 'leviiwashere'}</div>
                </div>

                <div className="bg-black/15 backdrop-blur-md border border-white/15 rounded-2xl p-3">
                  <div className="text-[10px] text-indigo-200 uppercase font-bold">Email Akun</div>
                  <div className="text-xs font-medium text-indigo-100 truncate">{profileData?.email || 'ibad180501@gmail.com'}</div>
                </div>

                <div className="bg-black/15 backdrop-blur-md border border-white/15 rounded-2xl p-3">
                  <div className="text-[10px] text-indigo-200 uppercase font-bold">WhatsApp</div>
                  <div className="text-xs font-medium text-indigo-100 truncate">{profileData?.phone || '6281515723808'}</div>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 font-black text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Akses Transfer Atlantic</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Gunakan saldo gateway Atlantic H2H untuk melakukan transfer langsung ke 100+ bank dan e-wallet di Indonesia.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => setSubTab('check_account')}
                  className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 flex items-center justify-between cursor-pointer transition-all"
                >
                  <span className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Cek Rekening / E-Wallet</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  onClick={() => setSubTab('create_transfer')}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition-all shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Transfer Baru</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-white/80" />
                </button>

                <button
                  onClick={() => setSubTab('bank_list')}
                  className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 flex items-center justify-between cursor-pointer transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Lihat Daftar Bank</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Gateway Endpoint Specification & Live JSON Viewer */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-[10px] font-black">
                  POST
                </span>
                <span className="text-xs font-mono text-slate-800 font-bold">/get_profile</span>
                <span className="text-[11px] text-slate-300">•</span>
                <span className="text-[11px] text-slate-500 font-medium">Content-Type: application/x-www-form-urlencoded</span>
              </div>

              <div className="flex items-center gap-2">
                {profileLatency !== null && (
                  <span className="text-[11px] text-slate-500 font-mono">
                    Latency: <strong className="text-emerald-600 font-bold">{profileLatency} ms</strong>
                  </span>
                )}
                <button
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-indigo-700 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{showRawJson ? 'Sembunyikan Respon JSON' : 'Lihat Respon JSON'}</span>
                </button>
              </div>
            </div>

            {showRawJson && (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 font-mono text-xs text-slate-800 overflow-x-auto relative">
                <button
                  onClick={() => handleCopy(JSON.stringify(rawProfileJson, null, 2), 'JSON Respon Profil')}
                  className="absolute top-3 right-3 px-2 py-1 bg-white border border-slate-200 text-[10px] text-slate-700 rounded shadow-sm cursor-pointer hover:bg-slate-50"
                >
                  {copiedText === 'JSON Respon Profil' ? 'Tersalin!' : 'Copy JSON'}
                </button>
                <pre>{JSON.stringify(rawProfileJson, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= 2. LIST BANK & E-WALLET ================= */}
      {subTab === 'bank_list' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="bank-search-input"
                type="text"
                placeholder="Cari Kode Bank atau Nama Bank / E-Wallet..."
                value={bankSearch}
                onChange={(e) => setBankSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
              />
            </div>

            {/* Filter Type */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBankTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  bankTypeFilter === 'all'
                    ? 'bg-indigo-50 border border-indigo-200 text-indigo-700'
                    : 'bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({bankList.length})
              </button>
              <button
                onClick={() => setBankTypeFilter('bank')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  bankTypeFilter === 'bank'
                    ? 'bg-indigo-50 border border-indigo-200 text-indigo-700'
                    : 'bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                Bank Transfer
              </button>
              <button
                onClick={() => setBankTypeFilter('ewallet')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  bankTypeFilter === 'ewallet'
                    ? 'bg-indigo-50 border border-indigo-200 text-indigo-700'
                    : 'bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                E-Wallet
              </button>

              <button
                onClick={fetchBankList}
                disabled={bankLoading}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 cursor-pointer"
                title="Segarkan List Bank"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${bankLoading ? 'animate-spin text-indigo-600' : ''}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Kode Bank (bank_code)</th>
                  <th className="px-4 py-3">Nama Bank / E-Wallet</th>
                  <th className="px-4 py-3">Tipe</th>
                  <th className="px-4 py-3 text-right">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredBanks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      {bankLoading ? 'Memuat daftar bank dari Atlantic H2H...' : 'Tidak ada bank ditemukan.'}
                    </td>
                  </tr>
                ) : (
                  filteredBanks.map((bank, idx) => (
                    <tr key={`ath-bank-${bank.id || bank.bank_code || idx}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-500">{bank.id}</td>
                      <td className="px-4 py-3 font-mono font-bold text-indigo-600">{bank.bank_code}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{bank.bank_name}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            bank.type === 'bank'
                              ? 'bg-blue-50 border border-blue-200 text-blue-700'
                              : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                          }`}
                        >
                          {bank.type || 'BANK'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleSelectBankForInquiry(bank)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-xs font-bold cursor-pointer transition-all"
                        >
                          Cek Rekening
                        </button>
                        <button
                          onClick={() => handleSelectBankForTransfer(bank)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold cursor-pointer transition-all"
                        >
                          Kirim Transfer
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= 3. CEK REKENING ================= */}
      {subTab === 'check_account' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Cek Rekening */}
          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                <span>Cek Validasi Rekening / E-Wallet</span>
              </h3>
              <p className="text-xs text-slate-500">
                Verifikasi nama pemilik rekening secara valid dan akurat langsung dari gateway Atlantic H2H (POST /transfer/cek_rekening).
              </p>
            </div>

            <form onSubmit={handleExecuteCheckAccount} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Pilih Bank / E-Wallet (Kode Bank):</label>
                <div className="flex gap-2">
                  <select
                    id="check-select-bank"
                    value={checkBankCode}
                    onChange={(e) => setCheckBankCode(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white font-medium"
                  >
                    <option value="">-- Pilih Bank dari Daftar --</option>
                    {bankList.map((b, idx) => (
                      <option key={`ath-opt-chk-${b.bank_code || idx}-${idx}`} value={b.bank_code}>
                        {b.bank_name} ({b.bank_code.toUpperCase()})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Atau ketik kode"
                    value={checkBankCode}
                    onChange={(e) => setCheckBankCode(e.target.value.toLowerCase())}
                    className="w-36 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-indigo-700 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Nomor Rekening / Nomor HP E-Wallet:</label>
                <input
                  id="check-input-account-no"
                  type="text"
                  placeholder="Contoh: 081123456789 atau 1234567890"
                  value={checkAccountNo}
                  onChange={(e) => setCheckAccountNo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white font-medium"
                />
              </div>

              {checkError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{checkError}</span>
                </div>
              )}

              <button
                id="btn-submit-check-account"
                type="submit"
                disabled={checkLoading}
                className="w-full py-3 bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white font-black rounded-xl text-xs shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {checkLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi Rekening ke Gateway...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Cek Rekening Sekarang</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Result Box */}
          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Hasil Pengecekan Rekening:</h4>

              {checkResult ? (
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <span className="text-xs text-slate-500">Status Validasi</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{checkResult.status || 'VALID'}</span>
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="text-slate-500 text-[11px]">Nama Pemilik Rekening:</div>
                      <div className="text-base font-black text-emerald-700 font-mono mt-0.5">
                        {checkResult.nama_pemilik || 'Nama Tidak Ditemukan'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                      <div>
                        <div className="text-slate-500 text-[11px]">Nomor Akun / Rekening:</div>
                        <div className="font-mono text-slate-900 font-bold">{checkResult.nomor_akun || '-'}</div>
                      </div>

                      <div>
                        <div className="text-slate-500 text-[11px]">Kode Bank:</div>
                        <div className="font-mono text-indigo-600 font-bold uppercase">{checkResult.kode_bank || '-'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3">
                    <button
                      id="btn-use-checked-for-transfer"
                      onClick={handleUseCheckedAccountForTransfer}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Lanjutkan Buat Transfer dengan Rekening Ini</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-8 text-center text-slate-500 space-y-2">
                  <UserCheck className="w-8 h-8 mx-auto text-slate-400" />
                  <p className="text-xs">
                    Silakan isi form di samping untuk memeriksa nama pemilik rekening sebelum melakukan transfer.
                  </p>
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Pengecekan rekening melindungi Anda dari salah transfer nomor rekening tujuan.</span>
            </div>
          </div>
        </div>
      )}

      {/* ================= 4. CREATE TRANSFER ================= */}
      {subTab === 'create_transfer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-3xl bg-white border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600" />
                <span>Form Buat Transfer Dana (Create Transfer)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Eksekusi transfer dana dari saldo Atlantic H2H ke bank atau e-wallet tujuan (POST /transfer/create).
              </p>
            </div>

            <form onSubmit={handleOpenTransferConfirm} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Bank / E-Wallet Tujuan (kode_bank):</label>
                  <select
                    id="trf-select-bank"
                    value={trfBankCode}
                    onChange={(e) => setTrfBankCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white font-medium"
                  >
                    <option value="">-- Pilih Bank --</option>
                    {bankList.map((b, idx) => (
                      <option key={`ath-opt-trf-${b.bank_code || idx}-${idx}`} value={b.bank_code}>
                        {b.bank_name} ({b.bank_code.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Nomor Rekening / Akun Tujuan:</label>
                  <input
                    id="trf-input-account-no"
                    type="text"
                    placeholder="Contoh: 0123456789 atau 08123456789"
                    value={trfAccountNo}
                    onChange={(e) => setTrfAccountNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Nama Pemilik Rekening:</label>
                  <input
                    id="trf-input-account-name"
                    type="text"
                    placeholder="Contoh: John Doe"
                    value={trfAccountName}
                    onChange={(e) => setTrfAccountName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Nominal Transfer (Rp):</label>
                  <input
                    id="trf-input-nominal"
                    type="number"
                    min={10000}
                    step={1000}
                    placeholder="Contoh: 1000000"
                    value={trfNominal}
                    onChange={(e) => setTrfNominal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Catatan (Note):</label>
                  <input
                    type="text"
                    placeholder="Catatan transfer"
                    value={trfNote}
                    onChange={(e) => setTrfNote(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Email Notifikasi:</label>
                  <input
                    type="email"
                    placeholder="admin@ibadstore.id"
                    value={trfEmail}
                    onChange={(e) => setTrfEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Nomor HP:</label>
                  <input
                    type="text"
                    placeholder="085712345678"
                    value={trfPhone}
                    onChange={(e) => setTrfPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white font-medium"
                  />
                </div>
              </div>

              {trfError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{trfError}</span>
                </div>
              )}

              <button
                id="btn-open-confirm-transfer"
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Kirim Permintaan Transfer Dana</span>
              </button>
            </form>
          </div>

          {/* Transfer Result / Status Summary */}
          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Respon Transfer Terbaru:</h4>

            {trfResult ? (
              <div className="rounded-2xl bg-slate-50 border border-emerald-200 p-5 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <span className="text-xs text-slate-500">Status Transfer</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-emerald-50 border border-emerald-200 text-emerald-700">
                    {trfResult.status || 'SUCCESS'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-500">ID Transfer:</div>
                    <div className="font-mono font-bold text-indigo-600 flex items-center justify-between">
                      <span>{trfResult.id}</span>
                      <button
                        onClick={() => handleCopy(trfResult.id || '', 'ID Transfer')}
                        className="p-1 hover:text-indigo-900 cursor-pointer"
                        title="Salin ID"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-500">Reff ID:</div>
                    <div className="font-mono text-slate-700">{trfResult.reff_id || '-'}</div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-500">Penerima &amp; Tujuan:</div>
                    <div className="font-bold text-slate-900">{trfResult.nama || '-'}</div>
                    <div className="font-mono text-slate-600">{trfResult.nomor_tujuan || '-'}</div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[10px] text-slate-500">Nominal:</div>
                      <div className="font-mono font-bold text-slate-900">
                        Rp {Number(trfResult.nominal || 0).toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">Total + Fee:</div>
                      <div className="font-mono font-black text-emerald-600">
                        Rp {Number(trfResult.total || trfResult.nominal || 0).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (trfResult.id) {
                      setStatusIdInput(trfResult.id);
                      setSubTab('transfer_status');
                      handleExecuteCheckStatus(trfResult.id);
                    }
                  }}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-indigo-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Cek Status Realtime</span>
                </button>
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 text-center text-slate-500 space-y-2">
                <Send className="w-8 h-8 mx-auto text-slate-400" />
                <p className="text-xs">
                  Belum ada transfer yang dieksekusi di sesi ini. Isi form dan klik kirim untuk memproses.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= 5. STATUS TRANSFER ================= */}
      {subTab === 'transfer_status' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <span>Cek Status Transfer Dana</span>
              </h3>
              <p className="text-xs text-slate-500">
                Lacak status transaksi transfer Atlantic H2H menggunakan ID Transfer (POST /transfer/status).
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Masukkan ID Transfer:</label>
                <input
                  id="status-input-id"
                  type="text"
                  placeholder="Contoh: NnTo8NXXXXXyhjEUhZ atau IDexample123"
                  value={statusIdInput}
                  onChange={(e) => setStatusIdInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              {statusError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{statusError}</span>
                </div>
              )}

              <button
                id="btn-check-transfer-status"
                onClick={() => handleExecuteCheckStatus()}
                disabled={statusLoading}
                className="w-full py-3 bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white font-black rounded-xl text-xs shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {statusLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memeriksa Status Transfer...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Periksa Status Transfer</span>
                  </>
                )}
              </button>
            </div>

            {/* Recent Lookups */}
            {recentLookups.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-slate-200">
                <div className="text-[11px] font-black text-slate-500 uppercase">Riwayat ID Terbaru:</div>
                <div className="flex flex-wrap gap-1.5">
                  {recentLookups.map((id, idx) => (
                    <button
                      key={`ath-recent-${id}-${idx}`}
                      onClick={() => {
                        setStatusIdInput(id);
                        handleExecuteCheckStatus(id);
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-[11px] font-mono text-indigo-700 border border-slate-200 rounded-lg cursor-pointer"
                    >
                      {id}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Status Result Display */}
          <div className="lg:col-span-2 rounded-3xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Rincian Status Transfer:</h4>

            {statusResult ? (
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div>
                    <span className="text-[11px] text-slate-500">Status Transaksi:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                          statusResult.status === 'success' || statusResult.status === 'sukses'
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                            : statusResult.status === 'pending'
                            ? 'bg-amber-50 border border-amber-200 text-amber-700'
                            : 'bg-rose-50 border border-rose-200 text-rose-700'
                        }`}
                      >
                        {statusResult.status}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400">Waktu Proses</span>
                    <div className="text-xs text-slate-600 font-mono">{statusResult.created_at || '-'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1 shadow-sm">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">ID Transfer Gateway</div>
                    <div className="font-mono text-indigo-600 font-bold">{statusResult.id || '-'}</div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1 shadow-sm">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Reff ID Merchant</div>
                    <div className="font-mono text-slate-900 font-bold">{statusResult.reff_id || '-'}</div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1 shadow-sm">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Nama Penerima</div>
                    <div className="font-bold text-slate-900 text-sm">{statusResult.nama || '-'}</div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1 shadow-sm">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Nomor Rekening / HP</div>
                    <div className="font-mono text-slate-700 font-bold">{statusResult.nomor_tujuan || '-'}</div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1 shadow-sm">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Bank Code</div>
                    <div className="font-mono text-indigo-600 font-bold uppercase">{statusResult.bank_code || '-'}</div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1 shadow-sm">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Biaya Admin (Fee)</div>
                    <div className="font-mono text-slate-700 font-bold">Rp {Number(statusResult.fee || 0).toLocaleString('id-ID')}</div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-500">Total Nominal Ditransfer:</div>
                    <div className="text-xl font-black text-emerald-600 font-mono">
                      Rp {Number(statusResult.total || statusResult.nominal || 0).toLocaleString('id-ID')}
                    </div>
                  </div>

                  <button
                    onClick={() => handleExecuteCheckStatus(statusResult.id)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh Status</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-8 text-center text-slate-500 space-y-2">
                <Clock className="w-8 h-8 mx-auto text-slate-400" />
                <p className="text-xs">
                  Masukkan ID Transfer di sebelah kiri untuk melihat status transaksi realtime dari provider.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: CONFIRM TRANSFER ================= */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Konfirmasi Transfer Dana</span>
              </h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Bank Tujuan:</span>
                <span className="font-bold text-indigo-600 uppercase font-mono">{trfBankCode}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Nomor Rekening:</span>
                <span className="font-bold text-slate-900 font-mono">{trfAccountNo}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Nama Penerima:</span>
                <span className="font-bold text-slate-900">{trfAccountName}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm">
                <span className="text-slate-700 font-bold">Nominal Transfer:</span>
                <span className="font-black text-emerald-600 font-mono">
                  Rp {Number(trfNominal || 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Pastikan nomor rekening dan nama penerima telah sesuai. Dana yang berhasil ditransfer tidak dapat ditarik kembali.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                id="btn-confirm-execute-transfer"
                onClick={handleExecuteCreateTransfer}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                Ya, Eksekusi Transfer Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
