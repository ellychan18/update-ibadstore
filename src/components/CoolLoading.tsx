import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Gamepad2, Zap, ShieldCheck, Sparkles, Server } from 'lucide-react';

interface CoolLoadingProps {
  fullScreen?: boolean;
  message?: string;
  totalItems?: number;
}

export const CoolLoading: React.FC<CoolLoadingProps> = ({
  fullScreen = false,
  message = 'Memuat Katalog Layanan Ibad Store...',
  totalItems = 11000,
}) => {
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    'Mengakses Cache Cepat & Database...',
    `Menyiapkan ${totalItems.toLocaleString('id-ID')}+ Layanan Game & PPOB...`,
    'Memeriksa Harga Real-Time Katalog Layanan...',
    'Katalog Siap Digunakan Secara Instan...',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % steps.length);
    }, 1800);
    return () => clearInterval(timer);
  }, [steps.length]);

  const content = (
    <div className="relative flex flex-col items-center justify-center p-6 sm:p-10 max-w-md w-full text-center select-none">
      {/* Ambient Neon Glow Effect */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-purple-500/20 rounded-3xl blur-2xl opacity-75 pointer-events-none animate-pulse" />

      {/* Cybernetic Geometric Ring Animation */}
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 mb-6 flex items-center justify-center">
        {/* Outer Ring Rotating Clockwise */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/40"
        />

        {/* Middle Glowing Ring Rotating Counter-Clockwise */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-2 rounded-full border-2 border-t-indigo-500 border-r-purple-500 border-b-cyan-400 border-l-transparent"
        />

        {/* Inner Pulsing Ring */}
        <motion.div
          animate={{ scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-4 rounded-full bg-gradient-to-br from-indigo-900/60 to-slate-900/80 backdrop-blur-md border border-indigo-400/30 shadow-inner flex items-center justify-center"
        />

        {/* Center Animated Icon (Gamepad & Lightning) */}
        <div className="relative z-10 flex items-center justify-center">
          <motion.div
            animate={{ y: [-2, 2, -2] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="relative"
          >
            <Gamepad2 className="w-10 h-10 sm:w-12 sm:h-12 text-cyan-300 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]" />
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.2, 0.9] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-1 -right-1"
            >
              <Zap className="w-5 h-5 text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
            </motion.div>
          </motion.div>
        </div>

        {/* Orbital Particle */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 pointer-events-none"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] absolute -top-1 left-1/2 -translate-x-1/2" />
        </motion.div>
      </div>

      {/* Title & Brand Badge */}
      <div className="space-y-1.5 z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-600 dark:text-indigo-400 text-[11px] font-black uppercase tracking-wider mb-1">
          <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
          <span>Ibad Store High-Speed Engine</span>
        </div>
        <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
          {message}
        </h3>
      </div>

      {/* Cyber Step Indicator */}
      <div className="mt-3 z-10 min-h-[22px] flex items-center justify-center">
        <motion.p
          key={stepIndex}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className="text-xs font-semibold text-slate-500 flex items-center gap-1.5"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
          {steps[stepIndex]}
        </motion.p>
      </div>

      {/* Shimmering Laser Progress Line */}
      <div className="w-full max-w-xs mt-5 h-1.5 rounded-full bg-slate-200/80 overflow-hidden relative z-10">
        <motion.div
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-1/2 h-full bg-gradient-to-r from-transparent via-indigo-600 to-cyan-400 rounded-full shadow-[0_0_10px_#4f46e5]"
        />
      </div>

      {/* Trust Badges */}
      <div className="mt-5 flex items-center gap-4 text-[11px] font-bold text-slate-400 z-10">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          Garansi 100% Aman
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Server className="w-3.5 h-3.5 text-indigo-500" />
          Smart Cache Aktif
        </span>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md">
        <div className="bg-white/95 border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden p-2">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-12 flex items-center justify-center bg-white/70 backdrop-blur-xs border border-slate-200/80 rounded-3xl shadow-xs">
      {content}
    </div>
  );
};
