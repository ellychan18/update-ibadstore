import React, { useState, useMemo, useRef, useDeferredValue, useEffect } from 'react';
import {
  Gamepad2,
  Zap,
  Smartphone,
  CreditCard,
  Flame,
  Search,
  CheckCircle,
  Tag,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Tv,
  Layers,
  TrendingDown,
  TrendingUp,
  Award,
  SlidersHorizontal,
} from 'lucide-react';
import type { ProductItem } from '../types.js';
import { CoolLoading } from './CoolLoading.js';
import mlbbBanner from '../assets/images/mlbb_banner_slide_1790007781448.jpg';
import ffBanner from '../assets/images/ff_banner_slide_1790007809784.jpg';
import plnBanner from '../assets/images/pln_banner_slide_1790007826770.jpg';
import qrisBanner from '../assets/images/qris_banner_slide_1790007841215.jpg';
import hokBanner from '../assets/images/hok_genshin_slide_1790007857816.jpg';

type SortFilterType = 'all' | 'rekomendasi' | 'termurah' | 'termahal';

interface ProductCatalogProps {
  products: ProductItem[];
  onSelectProduct: (product: ProductItem) => void;
  onRefreshProducts: () => void;
  loading: boolean;
}

// Popular Game / Category Showcase with curated visual artworks
const POPULAR_GAMES_SHOWCASE = [
  {
    name: 'Mobile Legends',
    category: 'Games',
    providerKey: 'Mobile Legends',
    badge: '🔥 TERLARIS',
    image: mlbbBanner,
    color: 'from-blue-600 via-indigo-600 to-cyan-500',
    accentBorder: 'border-blue-200',
    desc: 'Weekly Pass & Diamond Kilat',
  },
  {
    name: 'Free Fire',
    category: 'Games',
    providerKey: 'Free Fire',
    badge: '⚡ FLASH SALE',
    image: ffBanner,
    color: 'from-rose-600 via-orange-600 to-amber-500',
    accentBorder: 'border-rose-200',
    desc: 'Booyah Pass & Diamond Resmi',
  },
  {
    name: 'Honor of Kings',
    category: 'Games',
    providerKey: 'Honor of Kings',
    badge: '👑 POPULER',
    image: hokBanner,
    color: 'from-purple-600 via-indigo-600 to-pink-500',
    accentBorder: 'border-purple-200',
    desc: 'Tokens & Pass Resmi H2H',
  },
  {
    name: 'Token PLN',
    category: 'PLN',
    providerKey: 'PLN',
    badge: '💡 24 JAM NONSTOP',
    image: plnBanner,
    color: 'from-emerald-600 via-teal-600 to-cyan-600',
    accentBorder: 'border-emerald-200',
    desc: 'Token Prabayar Langsung Keluar',
  },
  {
    name: 'Dompet Digital',
    category: 'E-Money',
    providerKey: 'DANA',
    badge: '💳 INSTAN 1 DETIK',
    image: qrisBanner,
    color: 'from-cyan-600 via-blue-600 to-indigo-600',
    accentBorder: 'border-cyan-200',
    desc: 'DANA, GoPay, OVO, ShopeePay',
  },
];

// Fallback visual helper for product images
export function getProductThumbnail(item: ProductItem): string {
  if (item.img_url && item.img_url.trim().startsWith('http')) {
    return item.img_url;
  }
  const prov = (item.provider || '').toLowerCase();
  const cat = (item.category || '').toLowerCase();

  if (prov.includes('mobile legend') || prov.includes('mlbb')) {
    return 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop&q=80';
  }
  if (prov.includes('free fire') || prov.includes('ff')) {
    return 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&auto=format&fit=crop&q=80';
  }
  if (prov.includes('pubg')) {
    return 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=200&auto=format&fit=crop&q=80';
  }
  if (prov.includes('genshin')) {
    return 'https://images.unsplash.com/photo-1563089145-599997674d42?w=200&auto=format&fit=crop&q=80';
  }
  if (prov.includes('valorant')) {
    return 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&auto=format&fit=crop&q=80';
  }
  if (prov.includes('honor of kings') || prov.includes('hok')) {
    return 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=200&auto=format&fit=crop&q=80';
  }
  if (prov.includes('roblox')) {
    return 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=200&auto=format&fit=crop&q=80';
  }
  if (prov.includes('steam')) {
    return 'https://images.unsplash.com/photo-1612287233284-6014e7a89279?w=200&auto=format&fit=crop&q=80';
  }
  if (prov.includes('point blank') || prov.includes('garena') || prov.includes('call of duty')) {
    return 'https://images.unsplash.com/photo-1552824722-ddab1374e622?w=200&auto=format&fit=crop&q=80';
  }
  if (prov.includes('pln') || cat.includes('pln')) {
    return 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=200&auto=format&fit=crop&q=80';
  }
  if (prov.includes('telkomsel') || prov.includes('by.u')) {
    return 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=200&auto=format&fit=crop&q=80';
  }
  if (prov.includes('indosat') || prov.includes('im3')) {
    return 'https://images.unsplash.com/photo-1534536281715-e28d76689b4d?w=200&auto=format&fit=crop&q=80';
  }
  if (prov.includes('xl') || prov.includes('axis')) {
    return 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=200&auto=format&fit=crop&q=80';
  }
  if (prov.includes('tri') || prov.includes('smartfren')) {
    return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200&auto=format&fit=crop&q=80';
  }
  if (prov.includes('dana') || prov.includes('gopay') || prov.includes('ovo') || prov.includes('shopee') || prov.includes('linkaja')) {
    return 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=200&auto=format&fit=crop&q=80';
  }
  if (prov.includes('netflix') || prov.includes('spotify') || prov.includes('vidio') || prov.includes('youtube')) {
    return 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=200&auto=format&fit=crop&q=80';
  }

  return 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop&q=80';
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  onSelectProduct,
  onRefreshProducts,
  loading,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [brandSearchInput, setBrandSearchInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortFilter, setSortFilter] = useState<SortFilterType>('all');
  const [visibleProviderLimit, setVisibleProviderLimit] = useState<number>(35);
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set());

  // useDeferredValue keeps typing responsiveness at 60fps even with 11.000+ items
  const deferredSearch = useDeferredValue(searchQuery);
  const deferredBrandSearch = useDeferredValue(brandSearchInput);

  const toggleExpandProvider = (providerName: string) => {
    setExpandedProviders((prev) => {
      const next = new Set(prev);
      if (next.has(providerName)) {
        next.delete(providerName);
      } else {
        next.add(providerName);
      }
      return next;
    });
  };

  useEffect(() => {
    setVisibleProviderLimit(35);
  }, [selectedCategory, selectedBrand, deferredSearch]);

  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const brandScrollRef = useRef<HTMLDivElement>(null);
  const showcaseScrollRef = useRef<HTMLDivElement>(null);

  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const categories = [
    { id: 'All', name: 'Semua Layanan', icon: Flame },
    { id: 'Games', name: 'Game Top Up', icon: Gamepad2 },
    { id: 'Pulsa', name: 'Pulsa & Data', icon: Smartphone },
    { id: 'E-Money', name: 'Dompet Digital', icon: CreditCard },
    { id: 'PLN', name: 'Token PLN', icon: Zap },
    { id: 'Streaming', name: 'Streaming & TV', icon: Tv },
    { id: 'Premium', name: 'Akun Premium & AI', icon: Sparkles },
    { id: 'Voucher', name: 'Voucher Belanja', icon: Tag },
    { id: 'PPOB', name: 'Tagihan Pascabayar', icon: Layers },
    { id: 'International', name: 'Topup Global', icon: Award },
  ];

  // Helper to determine if a product is "Rekomendasi" (popular, best seller, fast moving denominations)
  const isRecommendedProduct = (p: ProductItem): boolean => {
    const name = (p.name || '').toLowerCase();
    const prov = (p.provider || '').toLowerCase();

    // MLBB Weekly Pass & standard bestsellers
    if (name.includes('weekly pass') || name.includes('twilight') || name.includes('starlight')) return true;
    if (name.includes('86 diamond') || name.includes('172 diamond') || name.includes('257 diamond') || name.includes('706 diamond')) return true;
    if (name.includes('140 diamond') || name.includes('355 diamond') || name.includes('720 diamond') || name.includes('membership')) return true; // FF
    if (name.includes('token pln 20.000') || name.includes('token pln 50.000') || name.includes('token pln 100.000')) return true;
    if (name.includes('5.000') || name.includes('10.000') || name.includes('25.000') || name.includes('50.000') || name.includes('100.000')) {
      if (prov.includes('telkomsel') || prov.includes('indosat') || prov.includes('xl') || prov.includes('dana') || prov.includes('gopay')) {
        return true;
      }
    }
    if (name.includes('flash') || name.includes('promo') || name.includes('terlaris') || name.includes('hemat') || name.includes('populer')) return true;
    return false;
  };

  // Filter out postpaid items from the prabayar catalog (unless PPOB category is specifically selected)
  const prabayarProducts = useMemo(() => {
    return products.filter((p) => selectedCategory === 'PPOB' || !p.isPostpaid);
  }, [products, selectedCategory]);

  // Check category match helper ensuring 100% complete coverage across all categories
  const matchesCategory = (item: ProductItem, catId: string): boolean => {
    if (catId === 'All') return true;
    const cat = (item.category || '').toLowerCase().trim();
    const prov = (item.provider || '').toLowerCase().trim();
    const name = (item.name || '').toLowerCase().trim();

    if (catId === 'Games') {
      return (
        cat.includes('game') ||
        ['mobile legends', 'free fire', 'pubg', 'genshin', 'valorant', 'roblox', 'point blank', 'garena', 'steam', 'honor of kings', 'arena of valor', 'call of duty', 'higgs domino', 'ragnarok', 'clash of clan', 'dragon', 'aov', 'codm', 'blood strike', 'farlight', 'fc mobile', 'growtopia', 'eggy', 'delta force', 'ace racer', 'aether gazer', 'bleach', 'destiny', 'identity v', 'afk journey', 'asphalt', 'batan', 'blue protocol', 'game-on', 'unipin', 'razer'].some(
          (g) => prov.includes(g) || name.includes(g) || cat.includes(g)
        )
      );
    }

    if (catId === 'PLN') {
      return cat.includes('pln') || prov.includes('pln') || name.includes('pln') || name.includes('listrik') || name.includes('token');
    }

    if (catId === 'Pulsa') {
      return (
        cat.includes('pulsa') ||
        cat.includes('data') ||
        cat.includes('paket') ||
        cat.includes('sms') ||
        cat.includes('telpon') ||
        cat.includes('masa aktif') ||
        cat.includes('perdana') ||
        cat.includes('esim') ||
        cat.includes('aktivasi') ||
        ['telkomsel', 'indosat', 'xl', 'axis', 'tri', 'three', 'smartfren', 'by.u', 'byu', 'im3', 'paket internet'].some(
          (op) => prov.includes(op) || name.includes(op)
        )
      );
    }

    if (catId === 'E-Money') {
      return (
        cat.includes('money') ||
        cat.includes('emoney') ||
        cat.includes('dompet') ||
        cat.includes('dana') ||
        cat.includes('shopee') ||
        cat.includes('gopay') ||
        cat.includes('ovo') ||
        ['dana', 'gopay', 'go pay', 'ovo', 'shopeepay', 'shopee pay', 'linkaja', 'grab', 'maxim', 'isaku', 'i.saku', 'astrapay', 'kaspro', 'sakuku', 'tapcash', 'brizzi', 'e-toll'].some(
          (w) => prov.includes(w) || name.includes(w)
        )
      );
    }

    if (catId === 'Streaming') {
      return (
        cat.includes('stream') ||
        cat.includes('tv') ||
        cat.includes('vidio') ||
        cat.includes('netflix') ||
        cat.includes('youtube') ||
        ['netflix', 'spotify', 'vidio', 'youtube', 'disney', 'wetv', 'viu', 'iqiyi', 'hbo', 'genflix', 'bstation', 'dramabox', 'vision', 'k-vision', 'nex parabola', 'decoder', 'apple music'].some(
          (s) => prov.includes(s) || name.includes(s)
        )
      );
    }

    if (catId === 'Premium') {
      return (
        cat.includes('premium') ||
        cat.includes('akun') ||
        ['chatgpt', 'gemini', 'perplexity', 'blackbox', 'canva', 'picsart', 'capcut', 'alight motion', 'duolingo', 'duolinggo', 'gdrive', 'gsuite', 'zoom', 'grammarly', 'turnitin', 'office 365', 'adobe', 'vpn'].some(
          (s) => prov.includes(s) || name.includes(s)
        )
      );
    }

    if (catId === 'Voucher') {
      return (
        cat.includes('voucher') ||
        ['alfamart', 'indomaret', 'google play', 'game-on', 'unipin', 'razer', 'tokopedia', 'shopee voucher', 'map', 'carrefour', 'transmart'].some(
          (v) => prov.includes(v) || name.includes(v)
        )
      );
    }

    if (catId === 'PPOB') {
      return (
        cat.includes('pasca') ||
        cat.includes('bpjs') ||
        cat.includes('pdam') ||
        cat.includes('pbb') ||
        cat.includes('gas') ||
        cat.includes('multifinance') ||
        cat.includes('internet') ||
        cat.includes('telkom') ||
        cat.includes('indihome') ||
        cat.includes('hp pascabayar') ||
        item.isPostpaid === true
      );
    }

    if (catId === 'International') {
      return (
        cat.includes('malaysia') ||
        cat.includes('philippines') ||
        cat.includes('singapore') ||
        cat.includes('vietnam') ||
        cat.includes('thailand') ||
        ['celcom', 'digi', 'hotlink', 'maxis', 'umobile', 'ais', 'dtac', 'true move', 'globe', 'smart telecom', 'singtel', 'starhub', 'm1', 'viettel', 'mobifone', 'vinaphone'].some(
          (i) => prov.includes(i) || name.includes(i)
        )
      );
    }

    const targetCat = String(catId || '').toLowerCase().trim();
    return cat.includes(targetCat) || prov.includes(targetCat);
  };

  // Extract available brands for the active category (complete list of 263+ providers)
  const availableBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    for (const item of prabayarProducts) {
      if (matchesCategory(item, selectedCategory)) {
        const pName = (item.provider || item.category || '').trim();
        if (pName) {
          brandsSet.add(pName);
        }
      }
    }
    return Array.from(brandsSet).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
  }, [prabayarProducts, selectedCategory]);

  // Filtered list of brands for instant search
  const filteredBrandsList = useMemo(() => {
    const q = deferredBrandSearch.toLowerCase().trim();
    if (!q) return availableBrands;
    return availableBrands.filter((b) => b.toLowerCase().includes(q));
  }, [availableBrands, deferredBrandSearch]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let result = prabayarProducts.filter((p) => {
      if (!p) return false;
      const matchCat = matchesCategory(p, selectedCategory);

      const pProvider = String(p.provider || '').toLowerCase().trim();
      const sBrand = String(selectedBrand || 'All').toLowerCase().trim();
      const matchBrand =
        selectedBrand === 'All' ||
        pProvider === sBrand;

      const query = String(deferredSearch || '').toLowerCase().trim();
      const pName = String(p.name || '').toLowerCase().trim();
      const pCode = String(p.code || '').toLowerCase().trim();
      const pCategory = String(p.category || '').toLowerCase().trim();

      const matchSearch =
        !query ||
        pName.includes(query) ||
        pCode.includes(query) ||
        pProvider.includes(query) ||
        pCategory.includes(query);

      // Filter for 'rekomendasi'
      const matchRekomendasi = sortFilter !== 'rekomendasi' || isRecommendedProduct(p);

      return matchCat && matchBrand && matchSearch && matchRekomendasi;
    });

    // Apply sorting for 'termurah' and 'termahal'
    if (sortFilter === 'termurah') {
      result = [...result].sort((a, b) => {
        const priceA = a.sellPrice || a.price || 0;
        const priceB = b.sellPrice || b.price || 0;
        return priceA - priceB;
      });
    } else if (sortFilter === 'termahal') {
      result = [...result].sort((a, b) => {
        const priceA = a.sellPrice || a.price || 0;
        const priceB = b.sellPrice || b.price || 0;
        return priceB - priceA;
      });
    }

    return result;
  }, [prabayarProducts, selectedCategory, selectedBrand, deferredSearch, sortFilter]);

  // Group filtered products by provider
  const groupedByProvider = useMemo(() => {
    const map = new Map<string, ProductItem[]>();
    for (const item of filteredProducts) {
      const provName = (item.provider || item.category || 'Lainnya').trim();
      const list = map.get(provName) || [];
      list.push(item);
      map.set(provName, list);
    }
    return map;
  }, [filteredProducts]);

  // Virtualized list of providers for smooth rendering without DOM lockup
  const allProviderEntries = useMemo(() => Array.from(groupedByProvider.entries()), [groupedByProvider]);

  const displayedProviderEntries = useMemo(() => {
    if (deferredSearch.trim() || selectedBrand !== 'All') {
      return allProviderEntries;
    }
    return allProviderEntries.slice(0, visibleProviderLimit);
  }, [allProviderEntries, deferredSearch, selectedBrand, visibleProviderLimit]);

  return (
    <div className="space-y-8">
      {/* Visual Quick Showcase Cards (when on All and no search) - Swipeable & Scrollable */}
      {selectedCategory === 'All' && selectedBrand === 'All' && !searchQuery && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Layanan Populer &amp; Paling Banyak Dipesan</span>
            </h3>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-semibold hidden md:inline mr-2">
                Geser untuk pilihan lainnya
              </span>
              <button
                onClick={() => scrollContainer(showcaseScrollRef, 'left')}
                className="p-1 rounded-full bg-white border border-slate-200 text-slate-700 shadow-xs hover:bg-slate-100 hover:text-indigo-600 cursor-pointer"
                title="Geser layanan ke kiri"
                aria-label="Geser ke kiri"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => scrollContainer(showcaseScrollRef, 'right')}
                className="p-1 rounded-full bg-white border border-slate-200 text-slate-700 shadow-xs hover:bg-slate-100 hover:text-indigo-600 cursor-pointer"
                title="Geser layanan ke kanan"
                aria-label="Geser ke kanan"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div
            ref={showcaseScrollRef}
            className="flex sm:grid sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 overflow-x-auto pb-2 sm:pb-0 scrollbar-none horizontal-scroll-touch"
          >
            {POPULAR_GAMES_SHOWCASE.map((showcase) => (
              <div
                key={showcase.name}
                id={`showcase-card-${String(showcase.name || 'item').toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => {
                  setSelectedCategory(showcase.category);
                  setSelectedBrand('All');
                  setSearchQuery(showcase.providerKey);
                }}
                className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl border ${showcase.accentBorder} bg-gradient-to-br ${showcase.color} p-3.5 sm:p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/20 flex flex-col justify-between min-h-[145px] sm:min-h-[170px] w-[200px] sm:w-auto shrink-0 sm:shrink text-white`}
              >
                {/* Background Image Thumbnail */}
                <div className="absolute inset-0 opacity-25 group-hover:opacity-35 transition-opacity pointer-events-none mix-blend-overlay">
                  <img
                    src={showcase.image}
                    alt={showcase.name}
                    className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-slate-950/40"></div>
                </div>

                {/* Top Badge */}
                <div className="relative z-10">
                  <span className="text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full bg-white/90 text-slate-900 shadow-xs tracking-wider">
                    {showcase.badge}
                  </span>
                </div>

                {/* Info Text */}
                <div className="relative z-10 space-y-1 pt-3 sm:pt-4">
                  <h4 className="font-black text-white text-xs sm:text-sm group-hover:text-amber-200 transition-colors line-clamp-1 drop-shadow-xs">
                    {showcase.name}
                  </h4>
                  <p className="text-[10px] sm:text-xs text-white/90 line-clamp-1 font-medium">
                    {showcase.desc}
                  </p>
                  <div className="text-[10px] sm:text-xs text-white font-bold flex items-center gap-1 pt-1">
                    <span>Lihat Pilihan</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Pills & Search Controls */}
      <div className="space-y-4 pt-1 sm:pt-2">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Main Category Tabs with scroll navigation */}
          <div className="relative flex items-center min-w-0 flex-1">
            {/* Scroll Left Button */}
            <button
              onClick={() => scrollContainer(categoryScrollRef, 'left')}
              className="hidden sm:flex absolute left-0 z-10 p-1.5 rounded-full bg-white/95 border border-slate-200 text-slate-700 shadow-md hover:bg-slate-100 hover:text-indigo-600 cursor-pointer -translate-x-1"
              aria-label="Geser kategori ke kiri"
              title="Geser ke kiri"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Scrollable Container */}
            <div
              ref={categoryScrollRef}
              className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none horizontal-scroll-touch sm:px-6 w-full"
            >
              {categories.map((cat) => {
                const Icon = cat.icon;
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    id={`cat-filter-${String(cat.id || 'cat').toLowerCase()}`}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setSelectedBrand('All');
                      setSearchQuery('');
                    }}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                      active
                        ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25'
                        : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/90 shadow-xs'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Scroll Right Button */}
            <button
              onClick={() => scrollContainer(categoryScrollRef, 'right')}
              className="hidden sm:flex absolute right-0 z-10 p-1.5 rounded-full bg-white/95 border border-slate-200 text-slate-700 shadow-md hover:bg-slate-100 hover:text-indigo-600 cursor-pointer translate-x-1"
              aria-label="Geser kategori ke kanan"
              title="Geser ke kanan"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Search Input & Refresh Button */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative flex-1 sm:w-64 lg:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="catalog-search-input"
                type="text"
                placeholder="Cari game, diamond, pulsa, token..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 focus:border-indigo-500 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-xs font-semibold"
              />
            </div>

            <button
              id="btn-sync-catalog"
              onClick={onRefreshProducts}
              disabled={loading}
              title="Perbarui data harga dan status produk realtime"
              className="p-2.5 bg-white border border-slate-200/90 hover:border-indigo-400 text-slate-700 hover:text-indigo-600 rounded-2xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
              <span className="hidden md:inline text-[11px] font-bold">Sync</span>
            </button>
          </div>
        </div>

        {/* Filter Controls: Rekomendasi, Termurah, Termahal */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none horizontal-scroll-touch max-w-full">
            <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
              <span>Urutkan:</span>
            </span>
            
            <button
              id="filter-sort-all"
              onClick={() => setSortFilter('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                sortFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>Semua</span>
            </button>

            <button
              id="filter-sort-rekomendasi"
              onClick={() => setSortFilter(sortFilter === 'rekomendasi' ? 'all' : 'rekomendasi')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                sortFilter === 'rekomendasi'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-white text-amber-700 hover:text-amber-800 border border-amber-200 hover:bg-amber-50/60'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>⭐ Rekomendasi</span>
            </button>

            <button
              id="filter-sort-termurah"
              onClick={() => setSortFilter(sortFilter === 'termurah' ? 'all' : 'termurah')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                sortFilter === 'termurah'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-white text-emerald-700 hover:text-emerald-800 border border-emerald-200 hover:bg-emerald-50/60'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>💰 Termurah</span>
            </button>

            <button
              id="filter-sort-termahal"
              onClick={() => setSortFilter(sortFilter === 'termahal' ? 'all' : 'termahal')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                sortFilter === 'termahal'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-white text-indigo-700 hover:text-indigo-800 border border-indigo-200 hover:bg-indigo-50/60'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>💎 Termahal</span>
            </button>
          </div>

          <div className="text-[11px] font-bold text-slate-500">
            Menampilkan <span className="text-indigo-600 font-mono font-extrabold">{filteredProducts.length}</span> produk
          </div>
        </div>

        {/* Sub-Brand / Provider Chips with Swipe and Scroll Controls */}
        {availableBrands.length > 1 && (
          <div className="space-y-2 bg-slate-50/90 p-2.5 sm:p-3 rounded-2xl border border-slate-200/80">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Pilih Provider ({availableBrands.length}):</span>
                </span>
                {selectedBrand !== 'All' && (
                  <button
                    onClick={() => setSelectedBrand('All')}
                    className="text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Reset Filter Provider ({selectedBrand})
                  </button>
                )}
              </div>

              {/* Brand Quick Search (useful when 263+ providers are available) */}
              {availableBrands.length > 8 && (
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={`Cari dari ${availableBrands.length} provider...`}
                    value={brandSearchInput}
                    onChange={(e) => setBrandSearchInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200/90 focus:border-indigo-500 rounded-xl text-[11px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-xs"
                  />
                  {brandSearchInput && (
                    <button
                      onClick={() => setBrandSearchInput('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="relative flex items-center">
              {/* Scroll Provider Left */}
              <button
                type="button"
                onClick={() => scrollContainer(brandScrollRef, 'left')}
                className="hidden sm:flex absolute -left-2 z-10 p-1.5 rounded-full bg-white border border-slate-300 text-slate-700 shadow-md hover:bg-slate-100 hover:text-indigo-600 cursor-pointer transition-transform hover:scale-105"
                aria-label="Geser provider ke kiri"
                title="Geser provider ke kiri"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Provider Horizontal Scrollable List - Complete (All 263+ providers accessible) */}
              <div
                ref={brandScrollRef}
                className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none horizontal-scroll-touch sm:px-4 w-full select-none scroll-smooth"
              >
                <button
                  onClick={() => setSelectedBrand('All')}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedBrand === 'All'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Semua ({prabayarProducts.filter((p) => matchesCategory(p, selectedCategory)).length})
                </button>

                {filteredBrandsList.length === 0 ? (
                  <span className="text-[11px] text-slate-500 italic px-2">Provider tidak ditemukan. Coba kata kunci lain.</span>
                ) : (
                  filteredBrandsList.map((brand) => {
                    const count = prabayarProducts.filter(
                      (p) => matchesCategory(p, selectedCategory) && (p.provider || '').trim() === brand
                    ).length;
                    const isSelected = selectedBrand === brand;

                    return (
                      <button
                        key={brand}
                        onClick={() => setSelectedBrand(brand)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                            : 'bg-white text-slate-700 hover:text-indigo-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span>{brand}</span>
                        <span
                          className={`text-[9.5px] px-1.5 py-0.2 rounded-md font-mono ${
                            isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Scroll Provider Right */}
              <button
                type="button"
                onClick={() => scrollContainer(brandScrollRef, 'right')}
                className="hidden sm:flex absolute -right-2 z-10 p-1.5 rounded-full bg-white border border-slate-300 text-slate-700 shadow-md hover:bg-slate-100 hover:text-indigo-600 cursor-pointer transition-transform hover:scale-105"
                aria-label="Geser provider ke kanan"
                title="Geser provider ke kanan"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Grid Grouped by Provider */}
      {loading && products.length === 0 ? (
        <CoolLoading
          message="Menyiapkan 11.000+ Katalog Layanan Ibad Store..."
          totalItems={products.length || 11363}
        />
      ) : groupedByProvider.size === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-8 space-y-3 shadow-sm">
          <Gamepad2 className="w-12 h-12 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-800">Layanan Tidak Ditemukan</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery || selectedBrand !== 'All'
              ? 'Coba kata kunci pencarian lain atau klik "Semua" pada filter provider.'
              : 'Katalog layanan sedang diperbarui dan disiapkan.'}
          </p>
          <button
            onClick={onRefreshProducts}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sinkronkan Layanan Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {displayedProviderEntries.map(([provider, items]) => {
            const isExpanded = expandedProviders.has(provider) || deferredSearch.trim().length > 0 || items.length <= 32;
            const itemsToRender = isExpanded ? items : items.slice(0, 32);

            return (
              <div key={provider} className="space-y-4">
                {/* Provider Header Banner */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center p-1 shadow-xs shrink-0">
                      <img
                        src={getProductThumbnail(items[0])}
                        alt={provider}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-slate-900 tracking-tight">{provider}</h3>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-mono font-bold">
                          {items.length} Layanan
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Proses Instan &amp; Otomatis 24 Jam</span>
                  </div>
                </div>

                {/* Items Card Grid - Flexible & Roomy on HP, Tablet & PC */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4.5">
                  {itemsToRender.map((item) => {
                    const priceToDisplay = item.sellPrice || item.price;
                    const isAvailable = item.status === 'available';
                    const itemImg = getProductThumbnail(item);

                    return (
                      <div
                        key={item.code}
                        id={`product-card-${item.code}`}
                        onClick={() => onSelectProduct(item)}
                        className="group relative bg-white hover:bg-slate-50/90 border border-slate-200/90 hover:border-indigo-400 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4.5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 cursor-pointer flex flex-col justify-between shadow-xs"
                      >
                        <div>
                          {/* Top tag & Code */}
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100/90 text-indigo-700 font-mono">
                                {item.code}
                              </span>
                              {isRecommendedProduct(item) && (
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-amber-500 text-white shadow-xs">
                                  ⭐ Rekomendasi
                                </span>
                              )}
                            </div>
                            {isAvailable ? (
                              <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Tersedia
                              </span>
                            ) : (
                              <span className="text-[10px] text-rose-600 font-extrabold flex items-center gap-1 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                Gangguan
                              </span>
                            )}
                          </div>

                          {/* Visual Thumbnail & Title */}
                          <div className="flex items-start gap-3 mb-2.5">
                            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-100 border border-slate-200/80 overflow-hidden shrink-0 flex items-center justify-center p-1 group-hover:scale-105 group-hover:border-indigo-300 transition-all shadow-xs">
                              <img
                                src={itemImg}
                                alt={item.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-contain rounded-lg sm:rounded-xl"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop&q=80';
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                                {item.name}
                              </h4>
                              <span className="text-[10px] text-slate-400 font-medium line-clamp-1">{item.provider}</span>
                            </div>
                          </div>

                          {/* Note / Subtext */}
                          {item.note && (
                            <p className="text-[10px] sm:text-[11px] text-slate-500 line-clamp-2 mb-2 font-medium bg-slate-50 p-2 rounded-xl border border-slate-100">
                              {item.note}
                            </p>
                          )}
                        </div>

                        {/* Pricing and Action */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-2">
                          <div>
                            <p className="text-[10px] text-slate-400 font-semibold">Harga Member</p>
                            <p className="text-sm sm:text-base font-black text-slate-900 tracking-tight font-mono">
                              Rp {Number(priceToDisplay || 0).toLocaleString('id-ID')}
                            </p>
                          </div>

                          <span className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 group-hover:from-cyan-500 group-hover:to-indigo-500 text-white text-[11px] sm:text-xs font-black transition-all shadow-xs">
                            Pesan
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Show Expand/Collapse button if provider has more than 32 items */}
                {!isExpanded && items.length > 32 && (
                  <div className="pt-2 text-center">
                    <button
                      onClick={() => toggleExpandProvider(provider)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span>Lihat Semua {items.length} Layanan {provider} (+{items.length - 32} lainnya)</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Load More Providers Pagination button */}
          {allProviderEntries.length > displayedProviderEntries.length && (
            <div className="pt-8 pb-4 text-center flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setVisibleProviderLimit((prev) => prev + 12)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-black transition-all shadow-lg shadow-indigo-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Muat Lebih Banyak Provider (+12 Lainnya)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setVisibleProviderLimit(allProviderEntries.length)}
                className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs sm:text-sm font-bold transition-all cursor-pointer"
              >
                Tampilkan Semua ({allProviderEntries.length} Provider)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
