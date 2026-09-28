import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, EyeOff, Activity, CheckCircle2, ChevronRight } from 'lucide-react';
import { api } from '../services/api.js';

interface SecurityBadgeProps {
  onOpenSecurityCenter?: () => void;
}

export const SecurityBadge: React.FC<SecurityBadgeProps> = ({ onOpenSecurityCenter }) => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.getSecurityStats().then((res) => {
      if (res.status && res.data) {
        setStats(res.data);
      }
    });
  }, []);

  return (
    <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-3 shadow-lg shadow-cyan-950/30 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            WAF ARMORED ACTIVE
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-slate-300">
          <div className="flex items-center gap-1.5" title="Semua data sensitif dienkripsi dengan PBKDF2 & AES-256">
            <Lock className="w-3 h-3 text-cyan-400" />
            <span>Vault Encryption</span>
          </div>

          <div className="flex items-center gap-1.5" title="Error sistem dan database disembunyikan sepenuhnya dari publik">
            <EyeOff className="w-3 h-3 text-violet-400" />
            <span>Error Masking On</span>
          </div>

          <div className="flex items-center gap-1.5" title="Sistem pertahanan anti-injeksi berlapis aktif">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>Anti-Injection Guard</span>
          </div>
        </div>

        {onOpenSecurityCenter && (
          <button
            id="btn-open-security-center"
            onClick={onOpenSecurityCenter}
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium transition-colors cursor-pointer ml-auto"
          >
            <span>Audit & Sandbox</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
