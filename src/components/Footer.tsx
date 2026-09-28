import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Gamepad2,
  Phone,
  Send,
  Mail,
  ExternalLink,
  Headphones,
} from 'lucide-react';

interface FooterProps {
  onSelectTab?: (tab: 'catalog' | 'postpaid' | 'tracker' | 'dashboard') => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white text-slate-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <span className="text-lg font-black text-slate-900 tracking-tight">IBAD STORE</span>
            </div>
            <p className="text-slate-500 leading-relaxed text-xs">
              Platform top up game terpercaya, voucher resmi, pulsa all operator, paket data, token PLN, serta pembayaran tagihan terlengkap dan tercepat di Indonesia.
            </p>
            <div className="flex items-center gap-1.5 text-emerald-600 text-[11px] font-bold pt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Transaksi Aman &amp; Terverifikasi Resmi</span>
            </div>
          </div>

          {/* Supported Services */}
          <div className="space-y-2.5">
            <p className="text-slate-900 font-extrabold tracking-wide uppercase text-[11px]">Kategori Layanan</p>
            <ul className="space-y-1.5 text-slate-600">
              <li>• Top Up Game (MLBB, FF, HoK, Genshin, PUBG)</li>
              <li>• Pulsa &amp; Paket Data (Telkomsel, Indosat, XL, Tri)</li>
              <li>• Token Listrik PLN Prabayar 24 Jam</li>
              <li>• Saldo E-Wallet (DANA, GoPay, OVO, ShopeePay)</li>
              <li>• Tagihan Pasca (PLN, BPJS, PDAM, Internet)</li>
            </ul>
          </div>

          {/* Payment Channels */}
          <div className="space-y-2.5">
            <p className="text-slate-900 font-extrabold tracking-wide uppercase text-[11px]">Metode Pembayaran</p>
            <p className="text-[11px] text-slate-500">
              Mendukung Pembayaran Otomatis 24/7 melalui:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['QRIS Instant', 'BCA', 'BNI VA', 'BRI BRIVA', 'Mandiri VA', 'DANA', 'GoPay', 'OVO', 'ShopeePay'].map((ch) => (
                <span key={ch} className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[10px] text-slate-700 font-bold">
                  {ch}
                </span>
              ))}
            </div>
            <div className="pt-2 flex items-center gap-1 text-[11px] text-indigo-600 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Auto-Approve Realtime 1-3 Detik</span>
            </div>
          </div>

          {/* Contact Admin & Support */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              <Headphones className="w-4 h-4 text-indigo-600" />
              <p className="text-slate-900 font-extrabold tracking-wide uppercase text-[11px]">Kontak Admin &amp; CS</p>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Hubungi layanan pelanggan kami 24/7 jika ada pertanyaan atau kendala transaksi:
            </p>

            <div className="space-y-2">
              {/* WhatsApp */}
              <a
                href="https://wa.me/6281515723808?text=Halo%20Admin%20Ibad%20Store%2C%20saya%20butuh%20bantuan"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase">WhatsApp Admin</div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">+62 815-1572-3808</div>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
              </a>

              {/* Telegram */}
              <a
                href="https://t.me/leviiwashere"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                    <Send className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase">Telegram Admin</div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-sky-700">@leviiwashere</div>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600" />
              </a>

              {/* Email */}
              <a
                href="mailto:ibadcode.id@gmail.com"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] text-slate-400 font-bold uppercase">Email Resmi</div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 truncate">ibadcode.id@gmail.com</div>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <p>© {new Date().getFullYear()} Ibad Store. Seluruh Hak Cipta Dilindungi.</p>
          <div className="flex items-center gap-4">
            <span>Privasi &amp; Keamanan Terjamin 100%</span>
            <span>•</span>
            <span>Server Resmi &amp; Terverifikasi</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
