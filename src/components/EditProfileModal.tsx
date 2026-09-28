import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  Link as LinkIcon,
  Check,
  User as UserIcon,
  Phone,
  Sparkles,
  Gamepad2,
  Shield,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api.js';
import type { User } from '../types.js';

interface EditProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: User) => void;
}

// Curated Gaming Avatar Presets
export const GAMING_AVATARS = [
  {
    id: 'avatar-cyber-samurai',
    name: 'Cyber Samurai',
    category: 'Cyberpunk',
    url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-gamer-pro',
    name: 'Esports Pro',
    category: 'Pro Gamer',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-cyber-girl',
    name: 'Neon Valkyrie',
    category: 'Heroine',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-ninja-shadow',
    name: 'Shadow Ninja',
    category: 'Assassin',
    url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-mecha-pilot',
    name: 'Mecha Pilot',
    category: 'Sci-Fi',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-streamer-queen',
    name: 'Streamer Star',
    category: 'Streamer',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-dragon-knight',
    name: 'Dragon Knight',
    category: 'Fantasy',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-anime-hero',
    name: 'Arcane Mage',
    category: 'Arcane',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-tactical-soldier',
    name: 'Tactical Recon',
    category: 'Shooter',
    url: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-retro-pixel',
    name: 'Pixel Champion',
    category: 'Retro',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-cyber-legend',
    name: 'Cyber Legend',
    category: 'Mythic',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-apex-hunter',
    name: 'Apex Hunter',
    category: 'Battle Royale',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  },
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [customUrl, setCustomUrl] = useState('');
  const [avatarTab, setAvatarTab] = useState<'presets' | 'upload' | 'url'>('presets');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Harap pilih file gambar (JPG, PNG, GIF, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ukuran file maksimal 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatar(reader.result);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Gagal membaca file gambar.');
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!customUrl.trim()) return;
    setAvatar(customUrl.trim());
    setCustomUrl('');
  };

  const handleRemoveAvatar = () => {
    setAvatar('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await api.updateProfile({
        name: name.trim() || user.name,
        phone: phone.trim() || user.phone,
        avatar,
      });

      if (res.status && res.data) {
        onSuccess(res.data);
        onClose();
      } else {
        setErrorMsg(res.message || 'Gagal menyimpan perubahan profil.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Gaming Theme */}
        <div className="p-6 bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 text-white shadow-inner">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold tracking-tight">Edit Profil &amp; Avatar Gamer</h3>
                <p className="text-xs text-cyan-100 font-medium">
                  Sesuaikan identitas akun dan pilih avatar keren favoritmu
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current Avatar Preview with Gamer Frame */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-gradient-to-br from-slate-50 via-indigo-50/40 to-cyan-50/40 border border-slate-200/80 rounded-2xl">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-cyan-500 via-indigo-500 to-violet-500 shadow-xl shadow-cyan-500/20 flex items-center justify-center">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={name || user.name}
                    className="w-full h-full rounded-full object-cover bg-white"
                    onError={() => setAvatar('')}
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-600 to-indigo-700 flex items-center justify-center text-white text-3xl font-black">
                    {(name || user.name || user.username || 'G').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Gamer Rank / Status Badge */}
              <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-[9px] shadow-md uppercase tracking-wider flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" />
                <span>{user.role === 'admin' ? 'MASTER' : 'PRO'}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-center sm:text-left flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h4 className="font-extrabold text-slate-900 text-base">{name || user.name}</h4>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded-full font-mono">
                  @{user.username}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Pilih avatar game di bawah, upload dari galeri perangkatmu, atau masukkan link foto.
              </p>

              {avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer pt-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Foto Khusus (Gunakan Inisial)</span>
                </button>
              )}
            </div>
          </div>

          {/* Avatar Source Selector Tabs */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Pilih Sumber Foto Profil
            </label>

            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setAvatarTab('presets')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  avatarTab === 'presets'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>Avatar Gamer</span>
              </button>

              <button
                type="button"
                onClick={() => setAvatarTab('upload')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  avatarTab === 'upload'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Galeri</span>
              </button>

              <button
                type="button"
                onClick={() => setAvatarTab('url')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  avatarTab === 'url'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Link URL Gambar</span>
              </button>
            </div>

            {/* Presets Grid */}
            {avatarTab === 'presets' && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 pt-2">
                {GAMING_AVATARS.map((item) => {
                  const isSelected = avatar === item.url;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAvatar(item.url)}
                      className={`group relative rounded-2xl p-1 transition-all cursor-pointer text-left flex flex-col items-center ${
                        isSelected
                          ? 'ring-2 ring-indigo-600 bg-indigo-50 shadow-md scale-105'
                          : 'bg-white border border-slate-200 hover:border-cyan-400 hover:shadow-sm'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden relative">
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-indigo-600/40 flex items-center justify-center text-white">
                            <Check className="w-5 h-5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 mt-1 truncate max-w-full px-1">
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Upload Tab */}
            {avatarTab === 'upload' && (
              <div className="pt-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-cyan-500 rounded-2xl p-8 text-center bg-slate-50 hover:bg-cyan-50/40 transition-colors cursor-pointer space-y-3"
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Klik untuk memilih foto dari galeri
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Mendukung format JPG, PNG, GIF, WebP (Maksimal 5MB)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Custom URL Tab */}
            {avatarTab === 'url' && (
              <div className="pt-2 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://contoh-gambar.com/avatar-kamu.png"
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
                  >
                    Terapkan
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Pastikan link gambar dapat diakses secara publik.
                </p>
              </div>
            )}
          </div>

          {/* Form Personal Information */}
          <div className="space-y-4 pt-2 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Informasi Akun
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Nama Lengkap</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Lengkap / Nickname"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Nomor WhatsApp / HP</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08123456789"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white font-medium"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-500/25 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Menyimpan...' : 'Simpan Profil & Foto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
