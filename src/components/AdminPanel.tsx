import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  Users,
  CreditCard,
  Gamepad2,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Shield,
  Activity,
  Layers,
  Database,
  ArrowUpRight,
  Sliders,
  DollarSign,
  AlertTriangle,
  Lock,
  ChevronLeft,
  ChevronRight,
  FileText,
  UserCheck,
  TrendingUp,
  Server,
  Zap,
  Building2,
  ArrowRightLeft,
  Trash2,
  Copy,
  Ban,
  UserX,
  AlertCircle,
  Eye,
  EyeOff,
  Filter,
  Check,
  Calendar,
  Mail,
  Send,
  ToggleLeft,
  ToggleRight,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api.js';
import type { User, TransactionRecord, DepositOrder, ProductItem, SecurityAuditLog } from '../types.js';
import { AtlanticTransferHub } from './AtlanticTransferHub.js';
import { AdminChartsView } from './AdminChartsView.js';

interface AdminPanelProps {
  adminUser: User;
  onRefreshData?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ adminUser, onRefreshData }) => {
  const [activeTab, setActiveTab] = useState<
    'transfer' | 'metrics' | 'transactions' | 'deposits' | 'users' | 'products' | 'security' | 'btzpay' | 'settings'
  >('metrics');

  // Data States
  const [metrics, setMetrics] = useState<any>(null);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [deposits, setDeposits] = useState<DepositOrder[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [productsList, setProductsList] = useState<ProductItem[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityAuditLog[]>([]);
  const [gatewayInfo, setGatewayInfo] = useState<any>(null);
  const [btzTestResult, setBtzTestResult] = useState<any>(null);
  const [testingBtz, setTestingBtz] = useState(false);
  const [btzApiKey, setBtzApiKeyInput] = useState('');
  const [currentBtzKey, setCurrentBtzKey] = useState('');
  const [savingBtzKey, setSavingBtzKey] = useState(false);
  const [showKeySecret, setShowKeySecret] = useState(false);

  // Email Notification & Resend Settings State
  const [emailNotificationEnabled, setEmailNotificationEnabled] = useState(true);
  const [resendApiKeyInput, setResendApiKeyInput] = useState('re_Kjq8o3bz_PTZr727sVbh1x9UHXs35iUd4');
  const [resendFromEmailInput, setResendFromEmailInput] = useState('onboarding@resend.dev');
  const [savingSettings, setSavingSettings] = useState(false);
  const [testEmailTarget, setTestEmailTarget] = useState('mail.ibad05@gmail.com');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showResendKey, setShowResendKey] = useState(false);

  // Filters & Search
  const [loading, setLoading] = useState(false);
  const [txFilter, setTxFilter] = useState<string>('all');
  const [txSearch, setTxSearch] = useState<string>('');
  const [userSearch, setUserSearch] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'user' | 'admin' | 'blacklisted' | 'active'>('all');
  const [depFilter, setDepFilter] = useState<'all' | 'pending' | 'success' | 'cancel'>('all');
  const [productCategory, setProductCategory] = useState<string>('all');

  // Modals & Action States
  const [selectedUserForBalance, setSelectedUserForBalance] = useState<User | null>(null);
  const [newBalanceInput, setNewBalanceInput] = useState<string>('');
  const [selectedTxForEdit, setSelectedTxForEdit] = useState<TransactionRecord | null>(null);
  const [editTxStatus, setEditTxStatus] = useState<TransactionRecord['status']>('success');
  const [editTxSn, setEditTxSn] = useState<string>('');

  // New Modals: Blacklist & Delete User
  const [userForBlacklist, setUserForBlacklist] = useState<User | null>(null);
  const [blacklistReasonInput, setBlacklistReasonInput] = useState<string>('Aktivitas mencurigakan / Spam');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // New Modals: Delete Transaction & Delete Deposit
  const [txToDelete, setTxToDelete] = useState<TransactionRecord | null>(null);
  const [showClearTxConfirm, setShowClearTxConfirm] = useState(false);
  const [depToDelete, setDepToDelete] = useState<DepositOrder | null>(null);
  const [showClearDepositsConfirm, setShowClearDepositsConfirm] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Tab Horizontal Scroll Ref & Controls
  const adminTabsScrollRef = useRef<HTMLDivElement>(null);
  const [isTabDragging, setIsTabDragging] = useState(false);
  const [tabStartX, setTabStartX] = useState(0);
  const [tabScrollLeft, setTabScrollLeft] = useState(0);

  const scrollAdminTabs = (direction: 'left' | 'right') => {
    if (adminTabsScrollRef.current) {
      const scrollDistance = direction === 'left' ? -320 : 320;
      adminTabsScrollRef.current.scrollBy({ left: scrollDistance, behavior: 'smooth' });
    }
  };

  const handleTabMouseDown = (e: React.MouseEvent) => {
    if (!adminTabsScrollRef.current) return;
    setIsTabDragging(true);
    setTabStartX(e.pageX - adminTabsScrollRef.current.offsetLeft);
    setTabScrollLeft(adminTabsScrollRef.current.scrollLeft);
  };

  const handleTabMouseLeaveOrUp = () => {
    setIsTabDragging(false);
  };

  const handleTabMouseMove = (e: React.MouseEvent) => {
    if (!isTabDragging || !adminTabsScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - adminTabsScrollRef.current.offsetLeft;
    const walk = (x - tabStartX) * 1.5;
    adminTabsScrollRef.current.scrollLeft = tabScrollLeft - walk;
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTestBtz = async () => {
    setTestingBtz(true);
    try {
      const res = await api.testBtzPay();
      const isOk = Boolean(res.status && (res as any).success !== false);
      setBtzTestResult(res);
      showToast(isOk ? 'Koneksi Betabotz Paygate (BTZPay) online & aktif!' : (res.message || 'Respons diterima dari BTZPay'));
    } catch (err: any) {
      setBtzTestResult({ status: false, success: false, message: err.message });
      showToast('Gagal menguji gateway BTZPay.');
    } finally {
      setTestingBtz(false);
    }
  };

  const loadBtzInfo = async () => {
    try {
      const res: any = await api.getBtzPayInfo();
      if (res && res.apiKey) {
        setCurrentBtzKey(res.apiKey);
        setBtzApiKeyInput(res.apiKey);
      }
    } catch {
      // Ignore
    }
  };

  const handleSaveBtzKey = async () => {
    if (!btzApiKey.trim()) {
      showToast('API Key BTZPay tidak boleh kosong.');
      return;
    }
    setSavingBtzKey(true);
    try {
      const res: any = await api.updateBtzPayKey(btzApiKey.trim());
      if (res && (res.success || res.status)) {
        showToast(res.message || 'API Key BTZPay berhasil diperbarui.');
        setCurrentBtzKey(btzApiKey.trim());
        await handleTestBtz();
      } else {
        showToast(res?.message || 'Gagal menyimpan API Key BTZPay.');
      }
    } catch (err: any) {
      showToast('Gagal menyimpan API Key: ' + err.message);
    } finally {
      setSavingBtzKey(false);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await api.getAdminSettings();
      if (res.status && res.data) {
        setEmailNotificationEnabled(res.data.resendEmailNotificationEnabled !== false);
        if (res.data.resendApiKey) {
          setResendApiKeyInput(res.data.resendApiKey);
        }
        if (res.data.resendFromEmail) {
          setResendFromEmailInput(res.data.resendFromEmail);
        }
      }
    } catch {
      // Ignored
    }
  };

  const handleToggleEmailNotification = async (enabled: boolean) => {
    setEmailNotificationEnabled(enabled);
    setSavingSettings(true);
    try {
      const res = await api.updateAdminSettings({
        resendEmailNotificationEnabled: enabled,
      });
      if (res.status) {
        showToast(
          enabled
            ? 'Notifikasi email Resend berhasil diaktifkan!'
            : 'Notifikasi email Resend dinonaktifkan.'
        );
      } else {
        showToast(res.message || 'Gagal mengubah status notifikasi.');
      }
    } catch (err: any) {
      showToast('Gagal mengubah pengaturan: ' + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveResendSettings = async () => {
    if (!resendApiKeyInput.trim()) {
      showToast('API Key Resend tidak boleh kosong.');
      return;
    }
    setSavingSettings(true);
    try {
      const res = await api.updateAdminSettings({
        resendApiKey: resendApiKeyInput.trim(),
        resendFromEmail: resendFromEmailInput.trim() || 'onboarding@resend.dev',
      });
      if (res.status) {
        showToast('Pengaturan kredensial Resend berhasil disimpan di database.');
      } else {
        showToast(res.message || 'Gagal menyimpan pengaturan Resend.');
      }
    } catch (err: any) {
      showToast('Gagal menyimpan: ' + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTestResendEmail = async () => {
    const target = testEmailTarget.trim() || 'mail.ibad05@gmail.com';
    setSendingTestEmail(true);
    setEmailTestResult(null);
    try {
      const res = await api.testAdminResendEmail(target);
      if (res.status) {
        setEmailTestResult({
          success: true,
          message: res.message || `Email uji coba berhasil dikirim ke ${target}!`,
        });
        showToast('Email uji coba berhasil terkirim!');
      } else {
        setEmailTestResult({
          success: false,
          message: res.message || 'Gagal mengirim email uji coba.',
        });
        showToast('Gagal kirim email: ' + (res.message || 'Periksa API Key'));
      }
    } catch (err: any) {
      setEmailTestResult({
        success: false,
        message: 'Kendala: ' + err.message,
      });
      showToast('Kendala pengiriman: ' + err.message);
    } finally {
      setSendingTestEmail(false);
    }
  };

  useEffect(() => {
    loadAllData();
    loadBtzInfo();
    loadSettings();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [mRes, tRes, dRes, uRes, pRes, sRes, gRes] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminTransactions(),
        api.getAdminDeposits(),
        api.getAdminUsers(),
        api.getProducts(),
        api.getAdminSecurityLogs(),
        api.getAdminGatewayBalance(),
      ]);

      if (mRes.status && mRes.data) setMetrics(mRes.data);
      if (tRes.status && Array.isArray(tRes.data)) setTransactions(tRes.data);
      if (dRes.status && Array.isArray(dRes.data)) setDeposits(dRes.data);
      if (uRes.status && Array.isArray(uRes.data)) setUsersList(uRes.data);
      if (pRes.status && Array.isArray(pRes.data)) setProductsList(pRes.data);
      if (sRes.status && Array.isArray(sRes.data)) setSecurityLogs(sRes.data);
      if (gRes.status) setGatewayInfo(gRes);
    } catch (e) {
      console.error('Error loading admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncGateway = async () => {
    setLoading(true);
    try {
      const res = await api.syncProducts();
      if (res.status) {
        showToast(res.message || 'Sinkronisasi layanan Atlantic H2H berhasil.');
        const pRes = await api.getProducts();
        if (pRes.status && Array.isArray(pRes.data)) setProductsList(pRes.data);
      } else {
        showToast('Sinkronisasi selesai: ' + res.message);
      }
    } catch (err: any) {
      showToast('Gagal sinkronisasi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Deposit Actions
  const handleDepositAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const res = await api.actionAdminDeposit({ id, action });
      if (res.status) {
        showToast(res.message || `Deposit berhasil di-${action}`);
        const dRes = await api.getAdminDeposits();
        if (dRes.status && Array.isArray(dRes.data)) setDeposits(dRes.data);
        const mRes = await api.getAdminMetrics();
        if (mRes.status && mRes.data) setMetrics(mRes.data);
      }
    } catch (err: any) {
      showToast('Gagal memproses deposit: ' + err.message);
    }
  };

  const handleDeleteDeposit = async () => {
    if (!depToDelete) return;
    try {
      const res: any = await api.deleteAdminDeposit(depToDelete.id);
      if (res.status) {
        showToast(res.message || `Riwayat deposit #${depToDelete.id} berhasil dihapus.`);
        setDepToDelete(null);
        const dRes = await api.getAdminDeposits();
        if (dRes.status && Array.isArray(dRes.data)) setDeposits(dRes.data);
        const mRes = await api.getAdminMetrics();
        if (mRes.status && mRes.data) setMetrics(mRes.data);
      } else {
        showToast(res.message || 'Gagal menghapus deposit.');
      }
    } catch (err: any) {
      showToast('Error: ' + err.message);
    }
  };

  const handleClearDeposits = async () => {
    try {
      const res: any = await api.clearAdminDeposits();
      if (res.status) {
        showToast('Seluruh riwayat tiket deposit berhasil dibersihkan.');
        setShowClearDepositsConfirm(false);
        setDeposits([]);
        const mRes = await api.getAdminMetrics();
        if (mRes.status && mRes.data) setMetrics(mRes.data);
      } else {
        showToast(res.message || 'Gagal membersihkan deposit.');
      }
    } catch (err: any) {
      showToast('Gagal membersihkan deposit: ' + err.message);
    }
  };

  // User Actions
  const handleSaveUserBalance = async () => {
    if (!selectedUserForBalance || newBalanceInput === '') return;
    try {
      const res = await api.updateAdminUserBalance({
        userId: selectedUserForBalance.id,
        newBalance: Number(newBalanceInput),
      });
      if (res.status) {
        showToast(res.message || 'Saldo berhasil diubah.');
        setSelectedUserForBalance(null);
        setNewBalanceInput('');
        const uRes = await api.getAdminUsers();
        if (uRes.status && Array.isArray(uRes.data)) setUsersList(uRes.data);
      }
    } catch (e: any) {
      showToast('Gagal mengubah saldo: ' + e.message);
    }
  };

  const handleToggleUserRole = async (user: User) => {
    if (user.username === 'ibad18') {
      showToast('Akun ibad18 adalah Master Administrator tunggal dan tidak dapat diubah rolenya.');
      return;
    }
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      const res = await api.updateAdminUserRole({ userId: user.id, role: nextRole });
      if (res.status) {
        showToast(`Role ${user.name} berhasil diubah menjadi ${nextRole.toUpperCase()}`);
        const uRes = await api.getAdminUsers();
        if (uRes.status && Array.isArray(uRes.data)) setUsersList(uRes.data);
      }
    } catch (e: any) {
      showToast('Gagal mengubah role: ' + e.message);
    }
  };

  const handleToggleBlacklist = async (user: User, shouldBlacklist: boolean, reason?: string) => {
    if (user.username === 'ibad18' || user.email === 'ibadgusion@gmail.com') {
      showToast('Master Administrator ibad18 tidak dapat di-blacklist.');
      return;
    }
    try {
      const res: any = await api.blacklistAdminUser({
        userId: user.id,
        isBlacklisted: shouldBlacklist,
        reason: reason || 'Pelanggaran ketentuan layanan',
      });
      if (res.status) {
        showToast(res.message || 'Status blacklist berhasil diperbarui.');
        setUserForBlacklist(null);
        setBlacklistReasonInput('Aktivitas mencurigakan / Spam');
        const uRes = await api.getAdminUsers();
        if (uRes.status && Array.isArray(uRes.data)) setUsersList(uRes.data);
      } else {
        showToast(res.message || 'Gagal mengubah status blacklist.');
      }
    } catch (err: any) {
      showToast('Error: ' + err.message);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    if (userToDelete.username === 'ibad18' || userToDelete.email === 'ibadgusion@gmail.com') {
      showToast('Master Administrator tidak dapat dihapus.');
      return;
    }
    try {
      const res: any = await api.deleteAdminUser(userToDelete.id);
      if (res.status) {
        showToast(res.message || `Pengguna @${userToDelete.username} berhasil dihapus permanen.`);
        setUserToDelete(null);
        const uRes = await api.getAdminUsers();
        if (uRes.status && Array.isArray(uRes.data)) setUsersList(uRes.data);
        const mRes = await api.getAdminMetrics();
        if (mRes.status && mRes.data) setMetrics(mRes.data);
      } else {
        showToast(res.message || 'Gagal menghapus pengguna.');
      }
    } catch (err: any) {
      showToast('Error: ' + err.message);
    }
  };

  // Transaction Actions
  const handleSaveTxStatus = async () => {
    if (!selectedTxForEdit) return;
    try {
      const res = await api.updateAdminTransactionStatus({
        id: selectedTxForEdit.reff_id || selectedTxForEdit.id,
        status: editTxStatus,
        sn: editTxSn || undefined,
      });
      if (res.status) {
        showToast(res.message || 'Status transaksi berhasil diperbarui.');
        setSelectedTxForEdit(null);
        const tRes = await api.getAdminTransactions();
        if (tRes.status && Array.isArray(tRes.data)) setTransactions(tRes.data);
      }
    } catch (e: any) {
      showToast('Gagal update transaksi: ' + e.message);
    }
  };

  const handleRecheckH2H = async (id: string) => {
    try {
      showToast('Sedang mengecek status ke Atlantic H2H Gateway...');
      const res = await api.adminRecheckTransactionH2H(id);
      showToast(res.message || 'Pengecekan Atlantic H2H selesai.');
      const tRes = await api.getAdminTransactions();
      if (tRes.status && Array.isArray(tRes.data)) setTransactions(tRes.data);
      if (selectedTxForEdit) {
        const updated = (tRes.data || []).find((x: any) => x.id === id || x.reff_id === id);
        if (updated) {
          setSelectedTxForEdit(updated);
          setEditTxStatus(updated.status);
          setEditTxSn(updated.sn || '');
        }
      }
    } catch (e: any) {
      showToast('Gagal recheck H2H: ' + e.message);
    }
  };

  const handleResendH2H = async (id: string) => {
    try {
      showToast('Mengirim ulang transaksi ke Atlantic Gateway...');
      const res = await api.adminResendTransactionH2H(id);
      showToast(res.message || 'Pengiriman ulang diproses.');
      const tRes = await api.getAdminTransactions();
      if (tRes.status && Array.isArray(tRes.data)) setTransactions(tRes.data);
      if (selectedTxForEdit) {
        const updated = (tRes.data || []).find((x: any) => x.id === id || x.reff_id === id);
        if (updated) {
          setSelectedTxForEdit(updated);
          setEditTxStatus(updated.status);
          setEditTxSn(updated.sn || '');
        }
      }
    } catch (e: any) {
      showToast('Gagal resend H2H: ' + e.message);
    }
  };

  const handleDeleteTx = async () => {
    if (!txToDelete) return;
    try {
      const id = txToDelete.reff_id || txToDelete.id;
      const res: any = await api.deleteAdminTransaction(id);
      if (res.status) {
        showToast(res.message || `Transaksi #${id} berhasil dihapus dari database.`);
        setTxToDelete(null);
        const tRes = await api.getAdminTransactions();
        if (tRes.status && Array.isArray(tRes.data)) setTransactions(tRes.data);
        const mRes = await api.getAdminMetrics();
        if (mRes.status && mRes.data) setMetrics(mRes.data);
      } else {
        showToast(res.message || 'Gagal menghapus transaksi.');
      }
    } catch (err: any) {
      showToast('Error: ' + err.message);
    }
  };

  const handleClearTransactions = async () => {
    try {
      const res = await api.clearAdminTransactions();
      if (res.status) {
        showToast('Seluruh riwayat monitor transaksi berhasil dibersihkan.');
        setShowClearTxConfirm(false);
        setTransactions([]);
        const mRes = await api.getAdminMetrics();
        if (mRes.status && mRes.data) setMetrics(mRes.data);
      } else {
        showToast(res.message || 'Gagal membersihkan transaksi.');
      }
    } catch (e: any) {
      showToast('Gagal membersihkan transaksi: ' + e.message);
    }
  };

  // Filtered transactions
  const filteredTxs = transactions.filter((tx) => {
    if (!tx) return false;
    const matchStatus = txFilter === 'all' || tx.status === txFilter;
    const q = String(txSearch || '').toLowerCase().trim();
    const id = String(tx.id || '').toLowerCase();
    const reffId = String(tx.reff_id || '').toLowerCase();
    const layanan = String(tx.layanan || '').toLowerCase();
    const target = String(tx.target || '').toLowerCase();
    const custName = String(tx.customer_name || '').toLowerCase();
    const matchSearch =
      !q ||
      id.includes(q) ||
      reffId.includes(q) ||
      layanan.includes(q) ||
      target.includes(q) ||
      custName.includes(q);
    return matchStatus && matchSearch;
  });

  // Filtered users - All registered accounts in database are displayed
  const cleanUsersList = usersList.filter((u) => {
    if (!u) return false;
    return true;
  });

  const filteredUsers = cleanUsersList
    .filter((u) => {
      if (userRoleFilter === 'blacklisted') {
        return u.isBlacklisted || u.status === 'blacklisted';
      }
      if (userRoleFilter === 'active') {
        return !u.isBlacklisted && u.status !== 'blacklisted';
      }
      if (userRoleFilter === 'admin') {
        return u.role === 'admin';
      }
      if (userRoleFilter === 'user') {
        return u.role === 'user';
      }
      return true;
    })
    .filter((u) => {
      const q = String(userSearch || '').toLowerCase().trim();
      if (!q) return true;
      const username = String(u.username || '').toLowerCase();
      const name = String(u.name || '').toLowerCase();
      const email = String(u.email || '').toLowerCase();
      const phone = String(u.phone || '').toLowerCase();
      return username.includes(q) || name.includes(q) || email.includes(q) || phone.includes(q);
    });

  // Filtered deposits
  const filteredDeposits = deposits.filter((d) => {
    if (depFilter === 'all') return true;
    return d.status === depFilter;
  });

  // Filtered products
  const categories = ['all', ...Array.from(new Set(productsList.map((p) => p.category).filter(Boolean)))];
  const filteredProducts = productsList.filter((p) => productCategory === 'all' || p.category === productCategory);

  const blacklistedCount = cleanUsersList.filter((u) => u.isBlacklisted || u.status === 'blacklisted').length;
  const activeUserCount = cleanUsersList.filter((u) => !u.isBlacklisted && u.status !== 'blacklisted').length;
  const adminUserCount = cleanUsersList.filter((u) => u.role === 'admin').length;
  const pendingDepositCount = deposits.filter((d) => d.status === 'pending').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Admin Header Banner - Premium Tech Command Center */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-black tracking-wide uppercase">
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
              <span>COMMAND CENTER &bull; MASTER ADMIN PORTAL</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Pusat Kendali &amp; Audit Ibad Store</span>
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>MongoDB Atlas Realtime</span>
              </span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-indigo-300">
                Logged in as: <strong className="text-white font-bold">{adminUser.name}</strong> (@{adminUser.username})
              </span>
              {blacklistedCount > 0 && (
                <>
                  <span className="text-slate-600">&bull;</span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-[10px] font-black">
                    {blacklistedCount} Akun Blacklist
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              id="admin-btn-refresh-all"
              onClick={loadAllData}
              disabled={loading}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/10 flex items-center gap-2 transition-all cursor-pointer backdrop-blur-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
              <span>Segarkan Data</span>
            </button>

            <button
              id="admin-btn-sync-gateway"
              onClick={handleSyncGateway}
              disabled={loading}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 via-indigo-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-500/25 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Sinkron Atlantic H2H</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omset */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Total Omset Sukses</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            Rp {(metrics?.totalTurnover || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{metrics?.totalSuccessTx || 0} Transaksi Berhasil</span>
          </div>
        </div>

        {/* Total Orders Count */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Semua Pesanan</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {metrics?.totalTransactions || transactions.length}
          </div>
          <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
            <span>Feed realtime database</span>
            <span className="font-bold text-indigo-600 cursor-pointer" onClick={() => setActiveTab('transactions')}>
              Lihat Riwayat &rarr;
            </span>
          </div>
        </div>

        {/* Registered Users */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Total Pengguna</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {cleanUsersList.length} Akun
          </div>
          <div className="text-[11px] font-bold flex items-center justify-between">
            <span className="text-emerald-600">{activeUserCount} Aktif</span>
            {blacklistedCount > 0 ? (
              <span className="text-rose-600 font-black">{blacklistedCount} Diblokir</span>
            ) : (
              <span className="text-slate-400">0 Blacklist</span>
            )}
          </div>
        </div>

        {/* Gateway Atlantic Balance */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Saldo Live Atlantic H2H</span>
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-indigo-600">
            Rp {Number(gatewayInfo?.balance ?? 0).toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-bold text-emerald-700">{gatewayInfo?.statusGateway || 'ONLINE'}</span>
            </div>
            <span>{gatewayInfo?.latencyMs ? `${gatewayInfo.latencyMs} ms` : 'Live API'}</span>
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs - Scrollable & Swipeable (Kanan / Kiri) */}
      <div className="relative group bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/90 shadow-xs">
        {/* Left Scroll Button */}
        <button
          type="button"
          onClick={() => scrollAdminTabs('left')}
          className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white border border-slate-300 text-slate-700 shadow-md hover:bg-slate-50 hover:text-indigo-600 items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95"
          title="Geser menu ke kiri"
          aria-label="Geser tab admin ke kiri"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Tab Buttons Container */}
        <div
          ref={adminTabsScrollRef}
          onMouseDown={handleTabMouseDown}
          onMouseLeave={handleTabMouseLeaveOrUp}
          onMouseUp={handleTabMouseLeaveOrUp}
          onMouseMove={handleTabMouseMove}
          className={`flex items-center gap-2 overflow-x-auto pb-0.5 pt-0.5 scrollbar-none horizontal-scroll-touch select-none scroll-smooth sm:px-2 ${
            isTabDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          <button
            id="admin-tab-metrics"
            onClick={() => setActiveTab('metrics')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'metrics'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            <span>Diagram &amp; Analitik</span>
          </button>

          <button
            id="admin-tab-users"
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'users'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>Manajemen Pengguna</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-800 font-mono font-bold">
              {cleanUsersList.length}
            </span>
            {blacklistedCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-rose-500 text-white font-black">
                {blacklistedCount} Ban
              </span>
            )}
          </button>

          <button
            id="admin-tab-txs"
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'transactions'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Riwayat Transaksi</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-800 font-mono font-bold">
              {transactions.length}
            </span>
          </button>

          <button
            id="admin-tab-deposits"
            onClick={() => setActiveTab('deposits')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'deposits'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
            <span>Riwayat Deposit</span>
            {pendingDepositCount > 0 ? (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-black animate-pulse">
                {pendingDepositCount} Pending
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-800 font-mono font-bold">
                {deposits.length}
              </span>
            )}
          </button>

          <button
            id="admin-tab-transfer"
            onClick={() => setActiveTab('transfer')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'transfer'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-violet-400" />
            <span>Atlantic Transfer &amp; Bank Hub</span>
          </button>

          <button
            id="admin-tab-products"
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'products'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5 text-pink-400" />
            <span>Katalog Layanan ({productsList.length})</span>
          </button>

          <button
            id="admin-tab-btzpay"
            onClick={() => setActiveTab('btzpay')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'btzpay'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-amber-500" />
            <span>Betabotz Paygate (BTZPay)</span>
          </button>

          <button
            id="admin-tab-security"
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'security'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Log Audit &amp; Keamanan</span>
          </button>

          <button
            id="admin-tab-settings"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'settings'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-indigo-400" />
            <span>Notifikasi Email Resend</span>
            <span
              className={`w-2 h-2 rounded-full ${
                emailNotificationEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              }`}
            ></span>
          </button>
        </div>

        {/* Right Scroll Button */}
        <button
          type="button"
          onClick={() => scrollAdminTabs('right')}
          className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white border border-slate-300 text-slate-700 shadow-md hover:bg-slate-50 hover:text-indigo-600 items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95"
          title="Geser menu ke kanan"
          aria-label="Geser tab admin ke kanan"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ================= TAB: METRICS & DIAGRAMS ================= */}
      {activeTab === 'metrics' && (
        <AdminChartsView
          transactions={transactions}
          deposits={deposits}
          totalUsers={cleanUsersList.length}
        />
      )}

      {/* ================= TAB: USERS MANAGEMENT (BLACK LIST & HAPUS PENGGUNA) ================= */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Filters & Search Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="admin-user-search"
                type="text"
                placeholder="Cari Username, Nama, Email, No. WhatsApp..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-medium transition-all"
              />
            </div>

            {/* Role / Blacklist Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setUserRoleFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  userRoleFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua ({cleanUsersList.length})
              </button>
              <button
                onClick={() => setUserRoleFilter('active')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  userRoleFilter === 'active'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Aktif ({activeUserCount})
              </button>
              <button
                onClick={() => setUserRoleFilter('blacklisted')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  userRoleFilter === 'blacklisted'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                Blacklist ({blacklistedCount})
              </button>
              <button
                onClick={() => setUserRoleFilter('admin')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  userRoleFilter === 'admin'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                Admin ({adminUserCount})
              </button>
            </div>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Pengguna</th>
                  <th className="px-4 py-3">Kontak (Email / WA)</th>
                  <th className="px-4 py-3">Saldo Akun</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status Akun</th>
                  <th className="px-4 py-3">Keamanan PIN</th>
                  <th className="px-4 py-3 text-right">Aksi Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      <div className="max-w-sm mx-auto space-y-1">
                        <Users className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-bold text-slate-700">Tidak ada pengguna yang cocok</p>
                        <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau filter status pengguna.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u, idx) => {
                    const isMaster = u.username === 'ibad18';
                    const isSelf = u.id === adminUser.id;
                    const isBlacklisted = Boolean(u.isBlacklisted || u.status === 'blacklisted');

                    return (
                      <tr
                        key={`admin-usr-${u.id || u.username || idx}-${idx}`}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isBlacklisted ? 'bg-rose-50/40' : ''
                        }`}
                      >
                        {/* Profile Info */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                                isMaster
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : isBlacklisted
                                  ? 'bg-rose-100 text-rose-700 border border-rose-300'
                                  : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                              }`}
                            >
                              {u.name?.charAt(0)?.toUpperCase() || u.username?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="space-y-0.5">
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {isMaster && <span className="text-xs" title="Master Admin">👑</span>}
                              </div>
                              <div className="font-mono text-indigo-600 text-[11px] font-bold">
                                @{u.username}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact Info */}
                        <td className="px-4 py-3.5 space-y-1">
                          <div className="flex items-center gap-1 text-slate-800">
                            <span className="truncate max-w-[160px]">{u.email}</span>
                            <button
                              onClick={() => copyToClipboard(u.email, `email-${u.id}`)}
                              className="text-slate-400 hover:text-slate-600 cursor-pointer"
                              title="Salin Email"
                            >
                              {copiedId === `email-${u.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                            <span>{u.phone}</span>
                            <button
                              onClick={() => copyToClipboard(u.phone, `phone-${u.id}`)}
                              className="text-slate-400 hover:text-slate-600 cursor-pointer"
                              title="Salin No. WhatsApp"
                            >
                              {copiedId === `phone-${u.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Balance */}
                        <td className="px-4 py-3.5 font-black text-emerald-600 font-mono">
                          Rp {Number(u?.balance || 0).toLocaleString('id-ID')}
                        </td>

                        {/* Role */}
                        <td className="px-4 py-3.5">
                          {isMaster ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-50 border border-amber-200 text-amber-700">
                              👑 MASTER ADMIN
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                u.role === 'admin'
                                  ? 'bg-indigo-50 border border-indigo-200 text-indigo-700'
                                  : 'bg-slate-100 border border-slate-200 text-slate-700'
                              }`}
                            >
                              {u.role}
                            </span>
                          )}
                        </td>

                        {/* Account Status / Blacklist */}
                        <td className="px-4 py-3.5">
                          {isBlacklisted ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 border border-rose-300 text-rose-800 shadow-xs">
                                <Ban className="w-3 h-3" />
                                <span>BLACKLISTED</span>
                              </span>
                              {u.blacklistReason && (
                                <p className="text-[10px] text-rose-600 italic truncate max-w-[140px]" title={u.blacklistReason}>
                                  {u.blacklistReason}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 border border-emerald-200 text-emerald-700">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>AKTIF</span>
                            </span>
                          )}
                        </td>

                        {/* PIN Security */}
                        <td className="px-4 py-3.5">
                          {u.hasPin ? (
                            <span className="text-emerald-600 flex items-center gap-1 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span>6-Digit Disetel</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">Belum disetel</span>
                          )}
                        </td>

                        {/* Admin Action Buttons */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-1.5">
                          {/* Edit Balance */}
                          <button
                            id={`admin-btn-edit-balance-${u.id}`}
                            onClick={() => {
                              setSelectedUserForBalance(u);
                              setNewBalanceInput(String(u.balance));
                            }}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-bold cursor-pointer transition-all"
                            title="Atur Saldo Pengguna"
                          >
                            Atur Saldo
                          </button>

                          {/* Toggle Role */}
                          {!isMaster && (
                            <button
                              id={`admin-btn-toggle-role-${u.id}`}
                              onClick={() => handleToggleUserRole(u)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 cursor-pointer transition-all"
                              title="Ubah Role Akun"
                            >
                              {u.role === 'admin' ? 'Jadikan User' : 'Jadikan Admin'}
                            </button>
                          )}

                          {/* Blacklist / Unblacklist Button */}
                          {!isMaster && !isSelf && (
                            isBlacklisted ? (
                              <button
                                id={`admin-btn-unblacklist-${u.id}`}
                                onClick={() => handleToggleBlacklist(u, false)}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1"
                                title="Buka Blokir / Blacklist"
                              >
                                <UserCheck className="w-3 h-3 text-emerald-600" />
                                <span>Buka Blacklist</span>
                              </button>
                            ) : (
                              <button
                                id={`admin-btn-blacklist-${u.id}`}
                                onClick={() => {
                                  setUserForBlacklist(u);
                                  setBlacklistReasonInput('Aktivitas mencurigakan / Spam');
                                }}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-lg text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1"
                                title="Blacklist / Blokir Pengguna"
                              >
                                <Ban className="w-3 h-3 text-amber-600" />
                                <span>Blacklist</span>
                              </button>
                            )
                          )}

                          {/* Delete User Button */}
                          {!isMaster && !isSelf && (
                            <button
                              id={`admin-btn-delete-user-${u.id}`}
                              onClick={() => setUserToDelete(u)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1"
                              title="Hapus Akun Pengguna Secara Permanen"
                            >
                              <Trash2 className="w-3 h-3 text-rose-600" />
                              <span>Hapus</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB: TRANSACTIONS (WITH DELETE ROW & CLEAR ALL) ================= */}
      {activeTab === 'transactions' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="admin-tx-search"
                type="text"
                placeholder="Cari Invoice, Reff ID, Nomor HP, Target..."
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-medium transition-all"
              />
            </div>

            {/* Status Filter & Actions */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                {['all', 'pending', 'success', 'failed'].map((st) => (
                  <button
                    key={st}
                    id={`admin-tx-filter-${st}`}
                    onClick={() => setTxFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize cursor-pointer transition-all ${
                      txFilter === st
                        ? 'bg-white text-indigo-700 font-black shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st === 'all' ? 'Semua' : st}
                  </button>
                ))}
              </div>

              {transactions.length > 0 && (
                <button
                  id="admin-btn-clear-txs"
                  onClick={() => setShowClearTxConfirm(true)}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                  title="Hapus seluruh riwayat pesanan"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Kosongkan Riwayat</span>
                </button>
              )}
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Waktu &amp; Invoice</th>
                  <th className="px-4 py-3">Layanan / Produk</th>
                  <th className="px-4 py-3">Target / ID Pelanggan</th>
                  <th className="px-4 py-3">Harga</th>
                  <th className="px-4 py-3">Serial Number (SN)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi Transaksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTxs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <div className="max-w-md mx-auto space-y-2">
                        <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                          <Activity className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="text-sm font-bold text-slate-800">
                          Tidak ada riwayat transaksi yang cocok
                        </div>
                        <p className="text-xs text-slate-500">
                          Data pesanan baru dari pengguna akan muncul di sini secara real-time.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTxs.map((tx, idx) => (
                    <tr key={`admin-tx-${tx.reff_id || tx.id || idx}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 space-y-0.5">
                        <div className="flex items-center gap-1 font-mono text-indigo-600 font-bold">
                          <span>{tx.reff_id}</span>
                          <button
                            onClick={() => copyToClipboard(tx.reff_id, `tx-${tx.reff_id}`)}
                            className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            title="Salin No. Reff"
                          >
                            {copiedId === `tx-${tx.reff_id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{tx?.created_at ? new Date(tx.created_at).toLocaleString('id-ID') : '-'}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 space-y-0.5">
                        <div className="font-bold text-slate-900">{tx.layanan}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-mono">{tx.code}</div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-800 font-semibold">
                        {tx.target}
                      </td>

                      <td className="px-4 py-3.5 font-black text-slate-900 font-mono">
                        Rp {Number(tx?.price || 0).toLocaleString('id-ID')}
                        <div className="text-[10px] text-slate-500 font-normal">
                          {tx.payment_method === 'saldo' ? 'Saldo Akun' : 'QRIS / Direct'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600 max-w-xs truncate" title={tx.sn || ''}>
                        {tx.sn || <span className="text-slate-400">-</span>}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            tx.status === 'success'
                              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                              : tx.status === 'pending'
                              ? 'bg-amber-50 border border-amber-200 text-amber-700'
                              : 'bg-rose-50 border border-rose-200 text-rose-700'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          id={`admin-btn-sync-tx-${tx.reff_id || tx.id}`}
                          onClick={() => handleRecheckH2H(tx.id || tx.reff_id)}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[11px] font-bold border border-amber-200 cursor-pointer transition-all inline-flex items-center gap-1"
                          title="Sinkronkan status dari Gateway Atlantic"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Sync</span>
                        </button>

                        <button
                          id={`admin-btn-resend-tx-${tx.reff_id || tx.id}`}
                          onClick={() => handleResendH2H(tx.id || tx.reff_id)}
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold border border-indigo-200 cursor-pointer transition-all inline-flex items-center gap-1"
                          title="Kirim ulang ke Gateway Atlantic"
                        >
                          <Zap className="w-3 h-3 text-indigo-600" />
                          <span>Gateway</span>
                        </button>

                        <button
                          id={`admin-btn-edit-tx-${tx.reff_id}`}
                          onClick={() => {
                            setSelectedTxForEdit(tx);
                            setEditTxStatus(tx.status);
                            setEditTxSn(tx.sn || '');
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold border border-slate-200 cursor-pointer transition-all"
                        >
                          Ubah
                        </button>

                        {/* Tombol Hapus Riwayat Transaksi */}
                        <button
                          id={`admin-btn-delete-tx-${tx.reff_id || tx.id}`}
                          onClick={() => setTxToDelete(tx)}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold border border-rose-200 cursor-pointer transition-all inline-flex items-center gap-1"
                          title="Hapus riwayat pesanan ini dari database"
                        >
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          <span>Hapus</span>
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

      {/* ================= TAB: DEPOSITS (WITH DELETE ROW & CLEAR ALL) ================= */}
      {activeTab === 'deposits' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Deposit Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {['all', 'pending', 'success', 'cancel'].map((st) => (
                <button
                  key={st}
                  onClick={() => setDepFilter(st as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                    depFilter === st
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'all'
                    ? `Semua (${deposits.length})`
                    : st === 'pending'
                    ? `Pending (${pendingDepositCount})`
                    : st === 'success'
                    ? `Sukses (${deposits.filter((d) => d.status === 'success').length})`
                    : `Batal (${deposits.filter((d) => d.status === 'cancel').length})`}
                </button>
              ))}
            </div>

            {deposits.length > 0 && (
              <button
                id="admin-btn-clear-deposits"
                onClick={() => setShowClearDepositsConfirm(true)}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                title="Hapus seluruh riwayat tiket deposit"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Bersihkan Riwayat Deposit</span>
              </button>
            )}
          </div>

          {/* Deposits Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">ID Tiket &amp; Waktu</th>
                  <th className="px-4 py-3">User ID / Akun</th>
                  <th className="px-4 py-3">Metode Bayar</th>
                  <th className="px-4 py-3">Nominal Transfer</th>
                  <th className="px-4 py-3">Saldo Diterima</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredDeposits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Belum ada riwayat tiket deposit yang tercatat.
                    </td>
                  </tr>
                ) : (
                  filteredDeposits.map((dep, idx) => (
                    <tr key={`admin-dep-${dep.id || dep.reff_id || idx}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 space-y-0.5">
                        <div className="flex items-center gap-1 font-mono text-indigo-600 font-bold">
                          <span>{dep.id}</span>
                          <button
                            onClick={() => copyToClipboard(dep.id, `dep-${dep.id}`)}
                            className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            title="Salin ID Deposit"
                          >
                            {copiedId === `dep-${dep.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {dep?.created_at ? new Date(dep.created_at).toLocaleString('id-ID') : '-'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-700 font-medium">
                        {dep.userId || 'Guest'}
                      </td>

                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        {dep.metode || dep.bank || 'QRIS Dinamis'}
                      </td>

                      <td className="px-4 py-3.5 font-black text-amber-600 font-mono">
                        Rp {Number(dep?.nominal || 0).toLocaleString('id-ID')}
                      </td>

                      <td className="px-4 py-3.5 font-black text-emerald-600 font-mono">
                        Rp {Number(dep?.get_balance || 0).toLocaleString('id-ID')}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            dep.status === 'success'
                              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                              : dep.status === 'pending'
                              ? 'bg-amber-50 border border-amber-200 text-amber-700'
                              : 'bg-rose-50 border border-rose-200 text-rose-700'
                          }`}
                        >
                          {dep.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {dep.status === 'pending' && (
                          <>
                            <button
                              id={`admin-btn-approve-dep-${dep.id}`}
                              onClick={() => handleDepositAction(dep.id, 'approve')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
                            >
                              Setujui
                            </button>
                            <button
                              id={`admin-btn-reject-dep-${dep.id}`}
                              onClick={() => handleDepositAction(dep.id, 'reject')}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Tolak
                            </button>
                          </>
                        )}

                        {/* Tombol Hapus Riwayat Deposit */}
                        <button
                          id={`admin-btn-delete-dep-${dep.id}`}
                          onClick={() => setDepToDelete(dep)}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold border border-rose-200 cursor-pointer transition-all inline-flex items-center gap-1"
                          title="Hapus riwayat deposit ini"
                        >
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          <span>Hapus</span>
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

      {/* ================= TAB: ATLANTIC TRANSFER & BANK HUB ================= */}
      {activeTab === 'transfer' && <AtlanticTransferHub />}

      {/* ================= TAB: PRODUCTS ================= */}
      {activeTab === 'products' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {categories.map((cat, idx) => (
                <button
                  key={`admin-cat-${cat || 'all'}-${idx}`}
                  onClick={() => setProductCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                    productCategory === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'all' ? 'Semua Kategori' : cat}
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Menampilkan <span className="font-bold text-slate-900">{filteredProducts.length}</span> produk aktif
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredProducts.map((p, idx) => (
              <div
                key={`admin-p-${p.code}-${idx}`}
                className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 hover:border-indigo-300 transition-all shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {p.code}
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs mt-1">{p.name}</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {p.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <span className="text-slate-500">Harga Modal H2H:</span>
                  <span className="font-mono font-bold text-slate-700">Rp {p.price.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-indigo-600">Harga Jual Web:</span>
                  <span className="font-mono font-black text-indigo-700">Rp {p.sellPrice.toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB: BETABOTZ PAYGATE (BTZPAY) ================= */}
      {activeTab === 'btzpay' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                  <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                  <span>BETABOTZ PAYGATEWAY (BTZPAY) OFFSHORE API</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">Konfigurasi Gateway QRIS &amp; Otomatisasi Transaksi</h3>
                <p className="text-xs text-slate-500">
                  Integrasi resmi QRIS Dinamis dan Pembayaran Otomatis dari Betabotz Paygate.
                </p>
              </div>

              <button
                id="btn-test-btzpay"
                onClick={handleTestBtz}
                disabled={testingBtz}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white rounded-xl text-xs font-black shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingBtz ? 'animate-spin' : ''}`} />
                <span>{testingBtz ? 'Menguji Gateway...' : 'Uji Koneksi BTZPay'}</span>
              </button>
            </div>

            {/* Test result alert */}
            {btzTestResult && (
              <div
                className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                  btzTestResult.status || btzTestResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {btzTestResult.status || btzTestResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 flex-1">
                  <p className="font-black text-sm">
                    {btzTestResult.status || btzTestResult.success ? 'Gateway Aktif & Terhubung!' : 'Koneksi Gateway Bermasalah'}
                  </p>
                  <p>{btzTestResult.message || JSON.stringify(btzTestResult)}</p>
                </div>
              </div>
            )}

            {/* API Key Form */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>API Key Resmi BTZPay:</span>
                <span className="text-[10px] text-slate-400 font-mono">Tersimpan aman di Environment Server</span>
              </label>

              <div className="relative">
                <input
                  id="admin-input-btz-key"
                  type={showKeySecret ? 'text' : 'password'}
                  value={btzApiKey}
                  onChange={(e) => setBtzApiKeyInput(e.target.value)}
                  placeholder="Masukkan API Key dari Betabotz..."
                  className="w-full bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl pl-4 pr-24 py-2.5 text-xs font-mono text-slate-900 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowKeySecret(!showKeySecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  {showKeySecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{showKeySecret ? 'Sembunyi' : 'Lihat'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-[11px] text-slate-500">
                  Digunakan untuk membuat QRIS Dinamis dan memverifikasi pembayaran pelanggan.
                </p>
                <button
                  id="admin-btn-save-btz-key"
                  onClick={handleSaveBtzKey}
                  disabled={savingBtzKey}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingBtzKey ? 'Menyimpan...' : 'Simpan API Key'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB: SECURITY AUDIT LOGS ================= */}
      {activeTab === 'security' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>Audit Keamanan &amp; Deteksi Ancaman</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Pencatatan real-time upaya intrusi, invalid PIN attempts, rate limit, dan aktivitas mencurigakan.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                {securityLogs.length} Terdeteksi
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Waktu</th>
                    <th className="px-4 py-3">Tipe Event</th>
                    <th className="px-4 py-3">IP Address</th>
                    <th className="px-4 py-3">Deskripsi Ancaman</th>
                    <th className="px-4 py-3">Tingkat Risiko</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {securityLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        Tidak ada ancaman keamanan terdeteksi. Sistem berjalan normal.
                      </td>
                    </tr>
                  ) : (
                    securityLogs.map((log, idx) => (
                      <tr key={`sec-log-${log.id || idx}`} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                          {new Date(log.timestamp).toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-indigo-600">
                          {log.threatType}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-700">{log.ip}</td>
                        <td className="px-4 py-3 text-slate-800">{log.endpoint || log.samplePayload || '-'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              log.severity === 'CRITICAL' || log.severity === 'HIGH'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {log.severity}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB: SETTINGS & RESEND EMAIL ================= */}
      {activeTab === 'settings' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Settings Header */}
          <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    Pengaturan Notifikasi &amp; Email Gateway (Resend)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Kelola integrasi pengiriman email otomatis saat pendaftaran pengguna baru, notifikasi deposit, dan keamanan akun.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-black uppercase flex items-center gap-1.5 ${
                    emailNotificationEnabled
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      emailNotificationEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                    }`}
                  ></span>
                  <span>{emailNotificationEnabled ? 'Status: AKTIF' : 'Status: NONAKTIF'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Main Controls Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CARD 1: Toggle Onboarding Email Feature */}
            <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black tracking-wider text-indigo-600 uppercase bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                      ONBOARDING SYSTEM
                    </span>
                    <h4 className="text-base font-black text-slate-900 pt-1">
                      Email Sambutan Pendaftaran Member Baru
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Ketika fitur ini aktif, setiap kali ada pengguna baru yang mendaftar di Ibad Store, sistem akan secara otomatis mengirimkan email konfirmasi pendaftaran resmi melalui Resend API ke alamat email yang didaftarkan.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Pengirim Email:</span>
                    <span className="font-mono font-bold text-slate-900">onboarding@resend.dev</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Nama Pengirim:</span>
                    <span className="font-bold text-slate-900">Ibad Store Official</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Format Surat:</span>
                    <span className="font-bold text-indigo-600">HTML Modern &amp; Mobile Responsive</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Penyimpanan Status:</span>
                    <span className="font-bold text-emerald-600">MongoDB Atlas Persistent</span>
                  </div>
                </div>
              </div>

              {/* Toggle Action Bar */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-slate-900">
                    {emailNotificationEnabled ? 'Fitur Sedang Aktif' : 'Fitur Sedang Dimatikan'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {emailNotificationEnabled
                      ? 'Email selamat datang akan terkirim otomatis'
                      : 'Tidak ada email terkirim saat registrasi'}
                  </div>
                </div>

                <button
                  id="admin-btn-toggle-email-notif"
                  type="button"
                  disabled={savingSettings}
                  onClick={() => handleToggleEmailNotification(!emailNotificationEnabled)}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-2 ${
                    emailNotificationEnabled
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                  }`}
                >
                  {emailNotificationEnabled ? (
                    <>
                      <ToggleRight className="w-5 h-5 text-emerald-200" />
                      <span>Aktif (Klik utk Matikan)</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-5 h-5 text-slate-500" />
                      <span>Mati (Klik utk Hidupkan)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* CARD 2: Interactive Resend Live Test */}
            <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black tracking-wider text-violet-600 uppercase bg-violet-50 px-2.5 py-1 rounded-full border border-violet-100">
                    LIVE TEST SUITE
                  </span>
                  <h4 className="text-base font-black text-slate-900 pt-1">
                    Uji Coba Pengiriman Email Resend
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Kirim email uji coba instan untuk memverifikasi bahwa koneksi Resend API berjalan lancar dan email sampai ke kotak masuk.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Email Tujuan Uji Coba:</label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="admin-input-test-email"
                        type="email"
                        value={testEmailTarget}
                        onChange={(e) => setTestEmailTarget(e.target.value)}
                        placeholder="mail.ibad05@gmail.com"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Default target: <code className="font-bold text-slate-600">mail.ibad05@gmail.com</code> (Email Resmi Master Admin)
                  </p>
                </div>

                {/* Email Test Feedback Display */}
                {emailTestResult && (
                  <div
                    className={`p-3.5 rounded-2xl border text-xs space-y-1 animate-in fade-in ${
                      emailTestResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      {emailTestResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{emailTestResult.success ? 'Berhasil Mengirim Email' : 'Gagal Mengirim Email'}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">{emailTestResult.message}</p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  id="admin-btn-send-test-email"
                  type="button"
                  disabled={sendingTestEmail || !testEmailTarget.trim()}
                  onClick={handleTestResendEmail}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white text-xs font-black shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Send className={`w-3.5 h-3.5 ${sendingTestEmail ? 'animate-pulse' : ''}`} />
                  <span>{sendingTestEmail ? 'Sedang Mengirim via Resend...' : 'Kirim Email Uji Coba Sekarang'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* CARD 3: Resend Configuration & Secret Key Management */}
          <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-600" />
                  <span>Kredensial &amp; Konfigurasi Domain Pengirim Resend</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Kelola API Key dan alamat email pengirim. Ubah ke domain Anda setelah melakukan verifikasi domain di resend.com.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 self-start sm:self-auto">
                Default: re_Kjq8o3bz_PTZr727sVbh1x9UHXs35iUd4
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Resend API Key:</label>
                <div className="relative">
                  <input
                    id="admin-input-resend-key"
                    type={showResendKey ? 'text' : 'password'}
                    value={resendApiKeyInput}
                    onChange={(e) => setResendApiKeyInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-4 pr-10 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    placeholder="re_..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowResendKey(!showResendKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showResendKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Alamat Email Pengirim (From Address):</label>
                <input
                  id="admin-input-resend-from"
                  type="text"
                  value={resendFromEmailInput}
                  onChange={(e) => setResendFromEmailInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  placeholder="onboarding@resend.dev atau noreply@domain-anda.com"
                />
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-600 leading-relaxed space-y-1">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Panduan Sandbox Mode vs Custom Domain:</span>
              </div>
              <p>
                Jika menggunakan domain bawaan <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">onboarding@resend.dev</code>, sistem secara otomatis meneruskan notifikasi registrasi ke email admin terverifikasi (<code className="font-bold text-indigo-700">mail.ibad05@gmail.com</code>) guna mencegah penolakan kuota sandbox Resend.
              </p>
              <p>
                Setelah Anda menambahkan dan memverifikasi domain Anda di dashboard Resend (<a href="https://resend.com/domains" target="_blank" rel="noreferrer" className="text-indigo-600 font-bold underline">resend.com/domains</a>), ubah alamat pengirim di atas ke domain Anda (misal <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">noreply@ibadstore.id</code>) untuk langsung mengirim ke seluruh email pelanggan.
              </p>
            </div>

            <div className="flex justify-end pt-1">
              <button
                id="admin-btn-save-resend-key"
                type="button"
                disabled={savingSettings}
                onClick={handleSaveResendSettings}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-black shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Simpan Konfigurasi Resend</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT USER BALANCE ================= */}
      {selectedUserForBalance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-600" />
                <span>Atur Saldo Pengguna</span>
              </h3>
              <button
                onClick={() => setSelectedUserForBalance(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <div className="text-slate-500">Nama Pengguna:</div>
              <div className="font-bold text-slate-900 text-sm">
                {selectedUserForBalance.name} (@{selectedUserForBalance.username})
              </div>
              <div className="text-slate-500 font-mono">{selectedUserForBalance.email}</div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Nominal Saldo Baru (Rp):</label>
              <input
                id="admin-input-new-balance"
                type="number"
                value={newBalanceInput}
                onChange={(e) => setNewBalanceInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                placeholder="Contoh: 150000"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedUserForBalance(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                id="admin-btn-save-balance"
                onClick={handleSaveUserBalance}
                className="px-5 py-2 bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 text-white font-black rounded-xl text-xs shadow-lg shadow-indigo-500/20 cursor-pointer"
              >
                Simpan Saldo ke MongoDB
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: BLACKLIST USER ================= */}
      {userForBlacklist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-rose-700 flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-600" />
                <span>Blacklist / Blokir Pengguna</span>
              </h3>
              <button
                onClick={() => setUserForBlacklist(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-1 text-xs">
              <div className="font-bold text-slate-900 text-sm">
                {userForBlacklist.name} (@{userForBlacklist.username})
              </div>
              <div className="text-slate-600 font-mono">{userForBlacklist.email} &bull; {userForBlacklist.phone}</div>
              <p className="text-[11px] text-rose-700 font-semibold pt-1">
                Akun yang di-blacklist tidak akan dapat melakukan login, transaksi, atau deposit.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Pilih / Masukkan Alasan Blacklist:</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Aktivitas mencurigakan / Spam',
                  'Kecurangan Transaksi / Fraud',
                  'Pelanggaran Ketentuan Layanan',
                  'Permintaan Penegak Hukum / Audit',
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setBlacklistReasonInput(reason)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      blacklistReasonInput === reason
                        ? 'bg-rose-600 text-white font-bold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <input
                id="admin-input-blacklist-reason"
                type="text"
                value={blacklistReasonInput}
                onChange={(e) => setBlacklistReasonInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white"
                placeholder="Tulis alasan khusus..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setUserForBlacklist(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                id="admin-btn-confirm-blacklist"
                onClick={() => handleToggleBlacklist(userForBlacklist, true, blacklistReasonInput)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-lg shadow-rose-600/20 cursor-pointer"
              >
                Terapkan Blacklist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE USER CONFIRMATION ================= */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 border border-rose-300 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-slate-900">
                Hapus Akun Pengguna Secara Permanen?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Anda akan menghapus akun <strong className="text-slate-900">@{userToDelete.username}</strong> ({userToDelete.name}). Data akun, saldo, dan akses login akan dihapus secara permanen dari MongoDB Atlas. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-mono space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>User ID:</span>
                <span className="font-bold text-slate-800">{userToDelete.id}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Email:</span>
                <span className="font-bold text-slate-800">{userToDelete.email}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Sisa Saldo:</span>
                <span className="font-bold text-emerald-600">Rp {Number(userToDelete.balance || 0).toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="w-1/2 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                id="admin-btn-confirm-delete-user"
                onClick={handleDeleteUser}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-lg shadow-rose-600/20 cursor-pointer"
              >
                Ya, Hapus Pengguna
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE SINGLE TRANSACTION ================= */}
      {txToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 border border-rose-300 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-slate-900">
                Hapus Riwayat Transaksi?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus data riwayat transaksi ini dari database?
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-mono space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>No. Reff:</span>
                <span className="font-bold text-indigo-600">{txToDelete.reff_id}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Layanan:</span>
                <span className="font-bold text-slate-800">{txToDelete.layanan}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Target:</span>
                <span className="font-bold text-slate-800">{txToDelete.target}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Harga:</span>
                <span className="font-bold text-slate-900">Rp {Number(txToDelete.price || 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Status:</span>
                <span className="font-bold uppercase text-slate-800">{txToDelete.status}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setTxToDelete(null)}
                className="w-1/2 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                id="admin-btn-confirm-delete-tx"
                onClick={handleDeleteTx}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-lg shadow-rose-600/20 cursor-pointer"
              >
                Ya, Hapus Transaksi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CLEAR ALL TRANSACTIONS ================= */}
      {showClearTxConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 border border-rose-300 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-slate-900">
                Kosongkan Seluruh Riwayat Transaksi?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Seluruh data riwayat transaksi pesanan ({transactions.length} pesanan) akan dihapus secara permanen dari MongoDB Atlas. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowClearTxConfirm(false)}
                className="w-1/2 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                id="admin-btn-confirm-clear-all-tx"
                onClick={handleClearTransactions}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-lg shadow-rose-600/20 cursor-pointer"
              >
                Ya, Bersihkan Semua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE SINGLE DEPOSIT ================= */}
      {depToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 border border-rose-300 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-slate-900">
                Hapus Riwayat Tiket Deposit?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus tiket deposit ini dari database?
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-mono space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>ID Deposit:</span>
                <span className="font-bold text-indigo-600">{depToDelete.id}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>User:</span>
                <span className="font-bold text-slate-800">{depToDelete.userId || 'Guest'}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Nominal:</span>
                <span className="font-bold text-amber-600">Rp {Number(depToDelete.nominal || 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Status:</span>
                <span className="font-bold uppercase text-slate-800">{depToDelete.status}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDepToDelete(null)}
                className="w-1/2 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                id="admin-btn-confirm-delete-dep"
                onClick={handleDeleteDeposit}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-lg shadow-rose-600/20 cursor-pointer"
              >
                Ya, Hapus Deposit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CLEAR ALL DEPOSITS ================= */}
      {showClearDepositsConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 border border-rose-300 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-slate-900">
                Kosongkan Seluruh Riwayat Deposit?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Seluruh data riwayat tiket deposit ({deposits.length} tiket) akan dihapus secara permanen dari MongoDB Atlas.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowClearDepositsConfirm(false)}
                className="w-1/2 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                id="admin-btn-confirm-clear-all-dep"
                onClick={handleClearDeposits}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-lg shadow-rose-600/20 cursor-pointer"
              >
                Ya, Bersihkan Semua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT TRANSACTION ================= */}
      {selectedTxForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-600" />
                <span>Ubah Status Transaksi</span>
              </h3>
              <button
                onClick={() => setSelectedTxForEdit(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <div className="font-mono text-indigo-600 font-bold">{selectedTxForEdit.reff_id}</div>
              <div className="font-bold text-slate-900">{selectedTxForEdit.layanan}</div>
              <div className="text-slate-500">Target: {selectedTxForEdit.target}</div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Status Pesanan:</label>
              <select
                id="admin-select-tx-status"
                value={editTxStatus}
                onChange={(e) => setEditTxStatus(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
              >
                <option value="success">SUCCESS (Berhasil)</option>
                <option value="pending">PENDING (Sedang Diproses)</option>
                <option value="failed">FAILED (Gagal)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Serial Number (SN) / Token / Voucher:</label>
              <input
                id="admin-input-tx-sn"
                type="text"
                value={editTxSn}
                onChange={(e) => setEditTxSn(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                placeholder="Contoh: 1234-5678-9012-3456"
              />
            </div>

            {/* Direct H2H Recovery Actions */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
              <p className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                Gateway Atlantic Tools:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleRecheckH2H(selectedTxForEdit.id || selectedTxForEdit.reff_id)}
                  className="px-3 py-2 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync dari Gateway</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleResendH2H(selectedTxForEdit.id || selectedTxForEdit.reff_id)}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>Tembak ke Gateway</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedTxForEdit(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                id="admin-btn-save-tx"
                onClick={handleSaveTxStatus}
                className="px-5 py-2 bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 text-white font-black rounded-xl text-xs shadow-lg shadow-indigo-500/20 cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
