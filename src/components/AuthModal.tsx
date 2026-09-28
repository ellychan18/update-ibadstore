import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  User as UserIcon,
  Mail,
  Phone,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Gamepad2,
  Check,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { api, authStorage } from '../services/api.js';
import type { User } from '../types.js';
import { AntiBotCaptcha } from './AntiBotCaptcha.js';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'register';
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [botVerified, setBotVerified] = useState(false);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [registrationSuccessData, setRegistrationSuccessData] = useState<{
    user: User;
    email: string;
  } | null>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Reset form and state every time modal opens or initialMode switches
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setRegistrationSuccessData(null);
      setError(null);
      setCaptchaError(null);
      setBotVerified(false);
      setShowPassword(false);
      setAgreeTerms(false);
      setPassword('');
      if (initialMode === 'login') {
        setUsername('');
      } else {
        setUsername('');
        setName('');
        setEmail('');
        setPhone('');
      }
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleFinishRegistration = () => {
    if (registrationSuccessData) {
      const loggedUser = registrationSuccessData.user;
      setRegistrationSuccessData(null);
      onSuccess(loggedUser);
      onClose();
    } else {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCaptchaError(null);

    // Anti-bot Human Verification Check
    if (!botVerified) {
      setCaptchaError('Harap centang verifikasi "Saya bukan robot" untuk melanjutkan.');
      return;
    }

    if (mode === 'register' && !agreeTerms) {
      setError('Harap centang persetujuan Syarat & Ketentuan serta Kebijakan Privasi untuk melanjutkan pendaftaran.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.login({ identifier: (username || email).trim(), password });
        if (res.status && res.data) {
          authStorage.setToken(res.data.token);
          setRegistrationSuccessData(null);
          onSuccess(res.data.user);
          onClose();
        } else {
          setError(res.message || 'Gagal login. Periksa username dan password.');
          // Otomatis reset verifikasi bukan robot jika salah memasukkan data login
          setBotVerified(false);
          setCaptchaError('Data login tidak valid. Silakan centang kembali verifikasi keamanan.');
        }
      } else {
        const res = await api.register({
          username: username.trim(),
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
        });
        if (res.status && res.data) {
          authStorage.setToken(res.data.token);
          setRegistrationSuccessData({
            user: res.data.user,
            email: email.trim(),
          });
        } else {
          setError(res.message || 'Gagal mendaftar akun.');
          setBotVerified(false);
          setCaptchaError('Pendaftaran belum berhasil. Silakan centang kembali verifikasi keamanan.');
        }
      }
    } catch (err: any) {
      setError('Terjadi kendala keamanan saat memproses data.');
      setBotVerified(false);
      setCaptchaError('Terjadi kendala. Silakan centang kembali verifikasi keamanan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          id="btn-close-auth"
          onClick={handleFinishRegistration}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {registrationSuccessData ? (
          /* ========================================================
             PROFESSIONAL REGISTRATION SUCCESS CELEBRATION VIEW
             ======================================================== */
          <div className="py-4 text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 bg-emerald-400/30 rounded-3xl blur-xl animate-pulse"></div>
              <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-xl shadow-emerald-500/25">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-black tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>Pendaftaran Berhasil &amp; Akun Aktif</span>
              </span>
              <h3 className="text-xl font-black text-slate-900 tracking-tight pt-1">
                Selamat Datang di Ibad Store!
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Halo <strong>{registrationSuccessData.user.name}</strong>, akun resmi Anda telah sukses terdaftar di database kami.
              </p>
            </div>

            {/* Email Notification Information Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-3">
              <div className="flex items-center gap-2 text-xs text-indigo-700 font-bold">
                <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <span>Notifikasi Email Terkirim</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Surat konfirmasi resmi pendaftaran telah berhasil dikirim ke alamat email{' '}
                <strong className="text-slate-900 font-mono">{registrationSuccessData.email}</strong>.
              </p>
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Username Akun:</span>
                <span className="font-mono font-black text-indigo-600">@{registrationSuccessData.user.username}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Status Akun:</span>
                <span className="font-extrabold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Siap Bertransaksi</span>
                </span>
              </div>
            </div>

            {/* Call to Action */}
            <button
              type="button"
              id="btn-finish-registration"
              onClick={handleFinishRegistration}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-500 hover:to-violet-600 text-white text-xs font-black shadow-lg shadow-indigo-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Mulai Belanja &amp; Top Up Sekarang</span>
            </button>
          </div>
        ) : (
          <>
            {/* Brand Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">IBAD STORE</h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {mode === 'login' ? 'Masuk ke Portal Member Resmi' : 'Daftar Akun Member Baru'}
                </p>
              </div>
            </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
          <button
            type="button"
            id="tab-btn-login"
            onClick={() => {
              setMode('login');
              setRegistrationSuccessData(null);
              setError(null);
              setCaptchaError(null);
              setBotVerified(false);
              setPassword('');
            }}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Masuk Akun
          </button>
          <button
            type="button"
            id="tab-btn-register"
            onClick={() => {
              setMode('register');
              setRegistrationSuccessData(null);
              setError(null);
              setCaptchaError(null);
              setBotVerified(false);
              setPassword('');
            }}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Daftar Member
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nama Lengkap</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="input-auth-name"
                    type="text"
                    required
                    placeholder="Nama Lengkap Anda"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="input-auth-email"
                    type="email"
                    required
                    placeholder="email@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">No. WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="input-auth-phone"
                    type="tel"
                    required
                    placeholder="081234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              {mode === 'login' ? 'Username atau Email' : 'Pilih Username Unik'}
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="input-auth-username"
                type="text"
                required
                placeholder="Username akun"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Kata Sandi (Password)</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="input-auth-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Registration Agreement Checkbox / Ceklis Persetujuan */}
          {mode === 'register' && (
            <div className="pt-2">
              <label
                htmlFor="input-auth-agree-terms"
                className="flex items-start gap-2.5 cursor-pointer select-none group p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 transition-colors"
              >
                <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                  <input
                    id="input-auth-agree-terms"
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => {
                      setAgreeTerms(e.target.checked);
                      if (e.target.checked && error) setError(null);
                    }}
                    className="peer sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded-md border transition-all flex items-center justify-center ${
                      agreeTerms
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                        : 'border-slate-300 bg-white group-hover:border-indigo-400'
                    }`}
                  >
                    {agreeTerms && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
                <div className="text-[11px] text-slate-600 leading-relaxed">
                  Saya telah membaca, memahami, dan menyetujui{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowTermsModal(true);
                    }}
                    className="text-indigo-600 font-bold hover:underline cursor-pointer inline-flex items-center gap-0.5"
                  >
                    Syarat & Ketentuan
                  </button>{' '}
                  serta{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowTermsModal(true);
                    }}
                    className="text-indigo-600 font-bold hover:underline cursor-pointer inline-flex items-center gap-0.5"
                  >
                    Kebijakan Privasi
                  </button>{' '}
                  Ibad Store.
                </div>
              </label>
            </div>
          )}

          {/* Anti-Bot Security Checkbox / Ceklis Saya Bukan Robot */}
          <div className="pt-1">
            <AntiBotCaptcha
              idPrefix={mode === 'login' ? 'login' : 'register'}
              isVerified={botVerified}
              onVerifyChange={(verified) => {
                setBotVerified(verified);
                if (verified) setCaptchaError(null);
              }}
              errorMessage={captchaError}
            />
          </div>

          <div className="pt-2">
            <button
              id="btn-auth-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white font-black rounded-2xl text-xs shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{mode === 'login' ? 'Masuk ke Akun' : 'Daftar Sekarang'}</span>
                </>
              )}
            </button>
          </div>
        </form>
        </>
        )}

        {/* Terms & Privacy Popup Modal */}
        {showTermsModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900">Syarat & Kebijakan Ibad Store</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTermsModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto pr-2 space-y-3 text-xs text-slate-600 leading-relaxed">
                <div>
                  <h5 className="font-bold text-slate-900 mb-1">1. Ketentuan Akun & Keamanan</h5>
                  <p>
                    Setiap pengguna bertanggung jawab penuh atas kerahasiaan username, email, dan kata sandi akun masing-masing. Dilarang membagikan data autentikasi atau PIN transaksi kepada pihak lain.
                  </p>
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 mb-1">2. Transaksi & Pembayaran</h5>
                  <p>
                    Seluruh pesanan top up game, voucher, dan pembayaran PPOB diproses otomatis setelah pembayaran terkonfirmasi via QRIS, Bank Transfer, atau Saldo Akun. Pastikan nomor tujuan/ID game diinput dengan benar.
                  </p>
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 mb-1">3. Perlindungan & Kerahasiaan Data</h5>
                  <p>
                    Ibad Store berkomitmen melindungi data pribadi pengguna dengan standar keamanan enkripsi dan tidak akan menjual atau membagikan data kepada pihak ketiga tanpa persetujuan.
                  </p>
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 mb-1">4. Larangan Penggunaan Ilegal</h5>
                  <p>
                    Dilarang menggunakan platform untuk tindakan penipuan, pencucian uang, penyalahgunaan gateway, atau aktivitas ilegal lainnya yang melanggar hukum di Indonesia.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAgreeTerms(true);
                    setError(null);
                    setShowTermsModal(false);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Saya Setuju</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
