import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import mlbbBanner from '../assets/images/mlbb_banner_slide_1790007781448.jpg';
import ffBanner from '../assets/images/ff_banner_slide_1790007809784.jpg';
import plnBanner from '../assets/images/pln_banner_slide_1790007826770.jpg';
import qrisBanner from '../assets/images/qris_banner_slide_1790007841215.jpg';
import hokBanner from '../assets/images/hok_genshin_slide_1790007857816.jpg';

interface PromoSlide {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  tagColor: string;
  bgGradient: string;
  accentColor: string;
  imageUrl: string;
  gameBadge: string;
  ctaText: string;
  ctaCategory?: string;
}

const PROMO_SLIDES: PromoSlide[] = [
  {
    id: 'promo-1',
    title: 'Mobile Legends: Bang Bang',
    subtitle: 'Weekly Diamond Pass & Diamond Fast Delivery 24 Jam. Proses 1-3 Detik Otomatis!',
    tag: '⚡ PROMO SPESIAL MLBB',
    tagColor: 'bg-amber-400 text-slate-950 border-amber-300 font-black',
    bgGradient: 'from-blue-950 via-indigo-950 to-slate-950',
    accentColor: 'text-amber-300',
    imageUrl: mlbbBanner,
    gameBadge: 'Mobile Legends',
    ctaText: 'Top Up MLBB Sekarang',
    ctaCategory: 'Mobile Legends',
  },
  {
    id: 'promo-2',
    title: 'Free Fire MAX & Booyah Pass',
    subtitle: 'Diskon Spesial Member Mingguan, Bulanan & Diamond Resmi 100% Langsung Masuk.',
    tag: '🔥 FLASH SALE FF',
    tagColor: 'bg-rose-500 text-white border-rose-400 font-black',
    bgGradient: 'from-orange-950 via-rose-950 to-slate-950',
    accentColor: 'text-orange-300',
    imageUrl: ffBanner,
    gameBadge: 'Free Fire',
    ctaText: 'Beli Diamond FF',
    ctaCategory: 'Free Fire',
  },
  {
    id: 'promo-3',
    title: 'Honor of Kings & Genshin Impact',
    subtitle: 'Top Up Tokens & Genesis Crystals Termurah. Instant Delivery Resmi 24 Jam Nonstop!',
    tag: '👑 BEST SELLER RPG',
    tagColor: 'bg-purple-500 text-white border-purple-400 font-black',
    bgGradient: 'from-purple-950 via-indigo-950 to-slate-950',
    accentColor: 'text-purple-300',
    imageUrl: hokBanner,
    gameBadge: 'HoK & Genshin',
    ctaText: 'Top Up Game RPG',
    ctaCategory: 'Games',
  },
  {
    id: 'promo-4',
    title: 'Token PLN Prabayar & Tagihan',
    subtitle: 'Token PLN 24 Jam Nonstop & Cek Tagihan Listrik Pascabayar dengan biaya admin termurah.',
    tag: '💡 LAYANAN 24 JAM',
    tagColor: 'bg-emerald-400 text-slate-950 border-emerald-300 font-black',
    bgGradient: 'from-emerald-950 via-teal-950 to-slate-950',
    accentColor: 'text-emerald-300',
    imageUrl: plnBanner,
    gameBadge: 'Token PLN',
    ctaText: 'Beli Token Listrik',
    ctaCategory: 'PLN',
  },
  {
    id: 'promo-5',
    title: 'Deposit Instan & Otomatis QRIS',
    subtitle: 'Isi saldo akun kapan saja dengan QRIS All Payment & Virtual Account dengan verifikasi instan.',
    tag: '💳 DEPOSIT OTOMATIS',
    tagColor: 'bg-cyan-400 text-slate-950 border-cyan-300 font-black',
    bgGradient: 'from-violet-950 via-indigo-950 to-slate-950',
    accentColor: 'text-cyan-300',
    imageUrl: qrisBanner,
    gameBadge: 'QRIS & VA',
    ctaText: 'Isi Saldo Akun',
    ctaCategory: 'DEPOSIT',
  },
];

interface PromoBannerSliderProps {
  onSelectCategory?: (category: string) => void;
  onOpenDeposit?: () => void;
}

export const PromoBannerSlider: React.FC<PromoBannerSliderProps> = ({
  onSelectCategory,
  onOpenDeposit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PROMO_SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + PROMO_SLIDES.length) % PROMO_SLIDES.length);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % PROMO_SLIDES.length);
  };

  const current = PROMO_SLIDES[currentIndex];

  const handleCtaClick = () => {
    if (current.ctaCategory === 'DEPOSIT') {
      onOpenDeposit?.();
    } else if (current.ctaCategory) {
      onSelectCategory?.(current.ctaCategory);
    }
  };

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden border border-slate-200 shadow-xl group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Gradient & Pattern */}
      <div className={`relative min-h-[250px] sm:min-h-[290px] bg-gradient-to-r ${current.bgGradient} p-5 sm:p-8 lg:p-10 flex flex-col justify-between transition-all duration-700 text-white overflow-hidden`}>
        {/* Glow Effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        {/* Clear & Visible Artwork Card */}
        <div className="absolute top-0 right-0 h-full w-2/5 sm:w-1/2 lg:w-5/12 pointer-events-none overflow-hidden flex items-center justify-end">
          <div className="relative w-full h-full">
            <img
              src={current.imageUrl}
              alt={current.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
            />
            {/* Smooth Edge Blend */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent"></div>
          </div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-lg lg:max-w-xl space-y-3">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-black border tracking-wide shadow-md ${current.tagColor}`}>
              <Sparkles className="w-3.5 h-3.5" />
              {current.tag}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/15 backdrop-blur-md text-white border border-white/20">
              {current.gameBadge}
            </span>
          </div>

          <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md">
            {current.title}
          </h2>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium drop-shadow-sm max-w-md">
            {current.subtitle}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              id={`promo-cta-${current.id}`}
              onClick={handleCtaClick}
              className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-xl shadow-black/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95 hover:shadow-indigo-500/25"
            >
              <span>{current.ctaText}</span>
              <ArrowRight className="w-4 h-4 text-indigo-600" />
            </button>
          </div>
        </div>

        {/* Bottom Pagination & Navigation Controls */}
        <div className="relative z-10 flex items-center justify-between pt-4 sm:pt-6">
          <div className="flex items-center gap-2">
            {PROMO_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex
                    ? 'w-8 bg-white shadow-sm'
                    : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={prevSlide}
              className="p-2 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer"
              aria-label="Previous Promo"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextSlide}
              className="p-2 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer"
              aria-label="Next Promo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
