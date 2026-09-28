import type { ProductItem } from '../src/types.js';

/**
 * Calculate customer selling price with Rp 1.000 - Rp 1.500 fixed profit margin over base cost price.
 * Tiered profit:
 * - Micro / nominal kecil (< Rp 25.000): Rp 1.000 profit
 * - Medium / nominal sedang (Rp 25.000 - Rp 100.000): Rp 1.250 profit
 * - Large / nominal besar (> Rp 100.000): Rp 1.500 profit
 * All final selling prices are cleanly rounded to nearest Rp 50.
 */
export function calculateSellPrice(basePrice: number, explicitProfit?: number): number {
  if (!basePrice || basePrice <= 0) return 0;
  
  let profit = explicitProfit;
  if (profit === undefined || profit === null) {
    if (basePrice < 25000) {
      profit = 1000; // Rp 1.000 profit for small denominations
    } else if (basePrice <= 100000) {
      profit = 1250; // Rp 1.250 profit for medium denominations
    } else {
      profit = 1500; // Rp 1.500 profit for large denominations
    }
  }

  // Ensure strictly bounded between Rp 1.000 and Rp 1.500
  if (profit < 1000) profit = 1000;
  if (profit > 1500) profit = 1500;

  const rawTotal = basePrice + profit;
  return Math.ceil(rawTotal / 50) * 50;
}

export const INITIAL_PRODUCTS: ProductItem[] = [
  // --- GAMES: MOBILE LEGENDS ---
  {
    code: 'MLBB5',
    name: 'Mobile Legends 5 Diamonds (Fast)',
    category: 'Games',
    type: 'Diamonds',
    provider: 'Mobile Legends',
    price: 1400,
    sellPrice: calculateSellPrice(1400), // ~1.600 (8.0% margin + round)
    note: 'Format: ID (Zone). Masuk 1-3 detik otomatis 24 Jam.',
    status: 'available',
    img_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop&q=80',
  },
  {
    code: 'MLBB12',
    name: 'Mobile Legends 12 Diamonds (Fast)',
    category: 'Games',
    type: 'Diamonds',
    provider: 'Mobile Legends',
    price: 3300,
    sellPrice: calculateSellPrice(3300), // ~3.600
    note: 'Format: ID (Zone). Masuk 1-3 detik otomatis 24 Jam.',
    status: 'available',
    img_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop&q=80',
  },
  {
    code: 'MLBB50',
    name: 'Mobile Legends 50 Diamonds (Fast)',
    category: 'Games',
    type: 'Diamonds',
    provider: 'Mobile Legends',
    price: 13500,
    sellPrice: calculateSellPrice(13500), // ~14.600
    note: 'Format: ID (Zone). Masuk 1-3 detik otomatis 24 Jam.',
    status: 'available',
    img_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop&q=80',
  },
  {
    code: 'MLBB86',
    name: 'Mobile Legends 86 Diamonds (Fast)',
    category: 'Games',
    type: 'Diamonds',
    provider: 'Mobile Legends',
    price: 21800,
    sellPrice: calculateSellPrice(21800), // ~23.300 (6.5% margin)
    note: 'Format: ID (Zone). Masuk 1-3 detik otomatis 24 Jam.',
    status: 'available',
    img_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop&q=80',
  },
  {
    code: 'MLBB172',
    name: 'Mobile Legends 172 Diamonds (Fast)',
    category: 'Games',
    type: 'Diamonds',
    provider: 'Mobile Legends',
    price: 43200,
    sellPrice: calculateSellPrice(43200), // ~46.100 (6.5% margin)
    note: 'Format: ID (Zone). Masuk 1-3 detik otomatis 24 Jam.',
    status: 'available',
    img_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop&q=80',
  },
  {
    code: 'MLBB257',
    name: 'Mobile Legends 257 Diamonds (Fast)',
    category: 'Games',
    type: 'Diamonds',
    provider: 'Mobile Legends',
    price: 64500,
    sellPrice: calculateSellPrice(64500), // ~68.700 (6.5% margin)
    note: 'Format: ID (Zone). Masuk 1-3 detik otomatis 24 Jam.',
    status: 'available',
    img_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop&q=80',
  },
  {
    code: 'MLBB706',
    name: 'Mobile Legends 706 Diamonds (Fast)',
    category: 'Games',
    type: 'Diamonds',
    provider: 'Mobile Legends',
    price: 174000,
    sellPrice: calculateSellPrice(174000), // ~183.600 (5.5% margin)
    note: 'Format: ID (Zone). Masuk 1-3 detik otomatis 24 Jam.',
    status: 'available',
    img_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop&q=80',
  },
  {
    code: 'MLBB_WP',
    name: 'Weekly Diamond Pass Mobile Legends',
    category: 'Games',
    type: 'Membership',
    provider: 'Mobile Legends',
    price: 27500,
    sellPrice: calculateSellPrice(27500), // ~29.300 (6.5% margin)
    note: 'Klaim harian total 210 Diamonds + 70 COA.',
    status: 'available',
    img_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop&q=80',
  },

  // --- GAMES: FREE FIRE ---
  {
    code: 'FF50',
    name: 'Free Fire 50 Diamonds',
    category: 'Games',
    type: 'Diamonds',
    provider: 'Free Fire',
    price: 6800,
    sellPrice: calculateSellPrice(6800), // ~7.400 (8.0% margin)
    note: 'Masukkan User ID Free Fire.',
    status: 'available',
    img_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&auto=format&fit=crop&q=80',
  },
  {
    code: 'FF70',
    name: 'Free Fire 70 Diamonds',
    category: 'Games',
    type: 'Diamonds',
    provider: 'Free Fire',
    price: 9200,
    sellPrice: calculateSellPrice(9200), // ~10.000 (8.0% margin)
    note: 'Masukkan User ID Free Fire.',
    status: 'available',
    img_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&auto=format&fit=crop&q=80',
  },
  {
    code: 'FF140',
    name: 'Free Fire 140 Diamonds',
    category: 'Games',
    type: 'Diamonds',
    provider: 'Free Fire',
    price: 18400,
    sellPrice: calculateSellPrice(18400), // ~19.900 (8.0% margin)
    note: 'Masukkan User ID Free Fire.',
    status: 'available',
    img_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&auto=format&fit=crop&q=80',
  },
  {
    code: 'FF355',
    name: 'Free Fire 355 Diamonds',
    category: 'Games',
    type: 'Diamonds',
    provider: 'Free Fire',
    price: 45800,
    sellPrice: calculateSellPrice(45800), // ~48.800 (6.5% margin)
    note: 'Masukkan User ID Free Fire.',
    status: 'available',
    img_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&auto=format&fit=crop&q=80',
  },
  {
    code: 'FF720',
    name: 'Free Fire 720 Diamonds',
    category: 'Games',
    type: 'Diamonds',
    provider: 'Free Fire',
    price: 91500,
    sellPrice: calculateSellPrice(91500), // ~97.500 (6.5% margin)
    note: 'Masukkan User ID Free Fire.',
    status: 'available',
    img_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&auto=format&fit=crop&q=80',
  },
  {
    code: 'FF_BOOYAH',
    name: 'Free Fire Booyah Pass Premium',
    category: 'Games',
    type: 'Pass',
    provider: 'Free Fire',
    price: 46000,
    sellPrice: calculateSellPrice(46000), // ~49.000 (6.5% margin)
    note: 'Buka slot hadiah eksklusif musim aktif.',
    status: 'available',
    img_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&auto=format&fit=crop&q=80',
  },

  // --- GAMES: PUBG MOBILE ---
  {
    code: 'PUBG60',
    name: 'PUBG Mobile 60 UC (Global)',
    category: 'Games',
    type: 'Unknown Cash',
    provider: 'PUBG Mobile',
    price: 14200,
    sellPrice: calculateSellPrice(14200), // ~15.400 (8.0% margin)
    note: 'Masukkan ID Karakter PUBG.',
    status: 'available',
  },
  {
    code: 'PUBG325',
    name: 'PUBG Mobile 325 UC (Global)',
    category: 'Games',
    type: 'Unknown Cash',
    provider: 'PUBG Mobile',
    price: 69500,
    sellPrice: calculateSellPrice(69500), // ~74.100 (6.5% margin)
    note: 'Masukkan ID Karakter PUBG.',
    status: 'available',
  },
  {
    code: 'PUBG660',
    name: 'PUBG Mobile 660 UC (Global)',
    category: 'Games',
    type: 'Unknown Cash',
    provider: 'PUBG Mobile',
    price: 139000,
    sellPrice: calculateSellPrice(139000), // ~146.700 (5.5% margin)
    note: 'Masukkan ID Karakter PUBG.',
    status: 'available',
  },

  // --- PLN TOKEN LISTRIK ---
  {
    code: 'PLN20',
    name: 'PLN Token Listrik Rp 20.000',
    category: 'PLN',
    type: 'Prabayar',
    provider: 'PLN',
    price: 20100,
    sellPrice: calculateSellPrice(20100), // ~21.500 (6.5% margin)
    note: 'Masukkan No Meter / ID Pelanggan (11-12 digit). Kode Token muncul di riwayat transaksi.',
    status: 'available',
  },
  {
    code: 'PLN50',
    name: 'PLN Token Listrik Rp 50.000',
    category: 'PLN',
    type: 'Prabayar',
    provider: 'PLN',
    price: 50100,
    sellPrice: calculateSellPrice(50100), // ~53.400 (6.5% margin)
    note: 'Masukkan No Meter / ID Pelanggan. Kode Token langsung terbit.',
    status: 'available',
  },
  {
    code: 'PLN100',
    name: 'PLN Token Listrik Rp 100.000',
    category: 'PLN',
    type: 'Prabayar',
    provider: 'PLN',
    price: 100100,
    sellPrice: calculateSellPrice(100100), // ~105.700 (5.5% margin)
    note: 'Masukkan No Meter / ID Pelanggan.',
    status: 'available',
  },
  {
    code: 'PLN200',
    name: 'PLN Token Listrik Rp 200.000',
    category: 'PLN',
    type: 'Prabayar',
    provider: 'PLN',
    price: 200100,
    sellPrice: calculateSellPrice(200100), // ~211.200 (5.5% margin)
    note: 'Masukkan No Meter / ID Pelanggan.',
    status: 'available',
  },
  {
    code: 'PLN500',
    name: 'PLN Token Listrik Rp 500.000',
    category: 'PLN',
    type: 'Prabayar',
    provider: 'PLN',
    price: 500100,
    sellPrice: calculateSellPrice(500100), // ~527.700 (5.5% margin)
    note: 'Masukkan No Meter / ID Pelanggan.',
    status: 'available',
  },

  // --- PULSA TELKOMSEL ---
  {
    code: 'TS10',
    name: 'Pulsa Telkomsel Rp 10.000',
    category: 'Pulsa',
    type: 'Reguler',
    provider: 'Telkomsel',
    price: 10250,
    sellPrice: calculateSellPrice(10250), // ~11.100 (8.0% margin)
    note: 'Nomor Telkomsel aktif (simPATI / Kartu AS / Loop / By.U).',
    status: 'available',
  },
  {
    code: 'TS25',
    name: 'Pulsa Telkomsel Rp 25.000',
    category: 'Pulsa',
    type: 'Reguler',
    provider: 'Telkomsel',
    price: 25100,
    sellPrice: calculateSellPrice(25100), // ~26.800 (6.5% margin)
    note: 'Nomor Telkomsel aktif.',
    status: 'available',
  },
  {
    code: 'TS50',
    name: 'Pulsa Telkomsel Rp 50.000',
    category: 'Pulsa',
    type: 'Reguler',
    provider: 'Telkomsel',
    price: 49800,
    sellPrice: calculateSellPrice(49800), // ~53.100 (6.5% margin)
    note: 'Nomor Telkomsel aktif.',
    status: 'available',
  },
  {
    code: 'TS100',
    name: 'Pulsa Telkomsel Rp 100.000',
    category: 'Pulsa',
    type: 'Reguler',
    provider: 'Telkomsel',
    price: 98500,
    sellPrice: calculateSellPrice(98500), // ~104.000 (5.5% margin)
    note: 'Nomor Telkomsel aktif.',
    status: 'available',
  },

  // --- PULSA INDOSAT ---
  {
    code: 'IS10',
    name: 'Pulsa Indosat Ooredoo Rp 10.000',
    category: 'Pulsa',
    type: 'Reguler',
    provider: 'Indosat',
    price: 10300,
    sellPrice: calculateSellPrice(10300), // ~11.200 (8.0% margin)
    note: 'Nomor IM3 Ooredoo / Mentari.',
    status: 'available',
  },
  {
    code: 'IS25',
    name: 'Pulsa Indosat Ooredoo Rp 25.000',
    category: 'Pulsa',
    type: 'Reguler',
    provider: 'Indosat',
    price: 25150,
    sellPrice: calculateSellPrice(25150), // ~26.800 (6.5% margin)
    note: 'Nomor IM3 Ooredoo / Mentari.',
    status: 'available',
  },
  {
    code: 'IS50',
    name: 'Pulsa Indosat Ooredoo Rp 50.000',
    category: 'Pulsa',
    type: 'Reguler',
    provider: 'Indosat',
    price: 49850,
    sellPrice: calculateSellPrice(49850), // ~53.100 (6.5% margin)
    note: 'Nomor IM3 Ooredoo / Mentari.',
    status: 'available',
  },

  // --- PULSA XL AXIATA ---
  {
    code: 'XL10',
    name: 'Pulsa XL Axiata Rp 10.000',
    category: 'Pulsa',
    type: 'Reguler',
    provider: 'XL',
    price: 10250,
    sellPrice: calculateSellPrice(10250), // ~11.100 (8.0% margin)
    note: 'Nomor XL Prabayar aktif.',
    status: 'available',
  },
  {
    code: 'XL25',
    name: 'Pulsa XL Axiata Rp 25.000',
    category: 'Pulsa',
    type: 'Reguler',
    provider: 'XL',
    price: 25100,
    sellPrice: calculateSellPrice(25100), // ~26.800 (6.5% margin)
    note: 'Nomor XL Prabayar aktif.',
    status: 'available',
  },
  {
    code: 'XL50',
    name: 'Pulsa XL Axiata Rp 50.000',
    category: 'Pulsa',
    type: 'Reguler',
    provider: 'XL',
    price: 49750,
    sellPrice: calculateSellPrice(49750), // ~53.000 (6.5% margin)
    note: 'Nomor XL Prabayar aktif.',
    status: 'available',
  },

  // --- SALDO E-WALLET: DANA ---
  {
    code: 'DANA10',
    name: 'Saldo DANA Rp 10.000',
    category: 'E-Money',
    type: 'Top Up',
    provider: 'DANA',
    price: 10200,
    sellPrice: calculateSellPrice(10200), // ~11.100 (8.0% margin)
    note: 'Masukkan No HP Akun DANA.',
    status: 'available',
  },
  {
    code: 'DANA20',
    name: 'Saldo DANA Rp 20.000',
    category: 'E-Money',
    type: 'Top Up',
    provider: 'DANA',
    price: 20200,
    sellPrice: calculateSellPrice(20200), // ~21.600 (6.5% margin)
    note: 'Masukkan No HP Akun DANA.',
    status: 'available',
  },
  {
    code: 'DANA50',
    name: 'Saldo DANA Rp 50.000',
    category: 'E-Money',
    type: 'Top Up',
    provider: 'DANA',
    price: 50200,
    sellPrice: calculateSellPrice(50200), // ~53.500 (6.5% margin)
    note: 'Masukkan No HP Akun DANA.',
    status: 'available',
  },
  {
    code: 'DANA100',
    name: 'Saldo DANA Rp 100.000',
    category: 'E-Money',
    type: 'Top Up',
    provider: 'DANA',
    price: 100200,
    sellPrice: calculateSellPrice(100200), // ~105.800 (5.5% margin)
    note: 'Masukkan No HP Akun DANA.',
    status: 'available',
  },

  // --- SALDO E-WALLET: GOPAY ---
  {
    code: 'GOPAY20',
    name: 'Saldo GoPay Customer Rp 20.000',
    category: 'E-Money',
    type: 'Top Up',
    provider: 'GoPay',
    price: 20300,
    sellPrice: calculateSellPrice(20300), // ~21.700 (6.5% margin)
    note: 'Masukkan No HP Gojek / GoPay.',
    status: 'available',
  },
  {
    code: 'GOPAY50',
    name: 'Saldo GoPay Customer Rp 50.000',
    category: 'E-Money',
    type: 'Top Up',
    provider: 'GoPay',
    price: 50300,
    sellPrice: calculateSellPrice(50300), // ~53.600 (6.5% margin)
    note: 'Masukkan No HP Gojek / GoPay.',
    status: 'available',
  },

  // --- SALDO E-WALLET: OVO ---
  {
    code: 'OVO20',
    name: 'Saldo OVO Rp 20.000',
    category: 'E-Money',
    type: 'Top Up',
    provider: 'OVO',
    price: 20350,
    sellPrice: calculateSellPrice(20350), // ~21.700 (6.5% margin)
    note: 'Masukkan No HP Akun OVO.',
    status: 'available',
  },
  {
    code: 'OVO50',
    name: 'Saldo OVO Rp 50.000',
    category: 'E-Money',
    type: 'Top Up',
    provider: 'OVO',
    price: 50350,
    sellPrice: calculateSellPrice(50350), // ~53.700 (6.5% margin)
    note: 'Masukkan No HP Akun OVO.',
    status: 'available',
  },

  // --- SALDO E-WALLET: SHOPEEPAY ---
  {
    code: 'SPAY20',
    name: 'Saldo ShopeePay Rp 20.000',
    category: 'E-Money',
    type: 'Top Up',
    provider: 'ShopeePay',
    price: 20300,
    sellPrice: calculateSellPrice(20300), // ~21.700 (6.5% margin)
    note: 'Masukkan No HP ShopeePay.',
    status: 'available',
  },
  {
    code: 'SPAY50',
    name: 'Saldo ShopeePay Rp 50.000',
    category: 'E-Money',
    type: 'Top Up',
    provider: 'ShopeePay',
    price: 50300,
    sellPrice: calculateSellPrice(50300), // ~53.600 (6.5% margin)
    note: 'Masukkan No HP ShopeePay.',
    status: 'available',
  },
];
