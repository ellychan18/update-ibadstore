export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  balance: number;
  role: 'user' | 'admin';
  hasPin: boolean;
  avatar?: string;
  isBlacklisted?: boolean;
  blacklistReason?: string;
  status?: 'active' | 'suspended' | 'blacklisted';
  createdAt: string;
}

export interface ProductItem {
  code: string;
  name: string;
  category: string;
  type: string;
  provider: string;
  price: number;
  sellPrice: number;
  note?: string;
  status: 'available' | 'empty' | 'gangguan' | 'aktif';
  img_url?: string;
  admin?: number;
  komisi?: number;
  isPostpaid?: boolean;
}

export interface PostpaidInquiryResult {
  reff_id: string;
  nomor_pelanggan: string;
  nama_pelanggan: string;
  code: string;
  harga: number;
  biaya_admin: number;
  total_tagihan: number;
  periode?: string;
  tarif_daya?: string;
  detail?: {
    tarif?: string;
    daya?: number;
    lembar_tagihan?: number;
    jumlah_peserta?: string;
    detail?: Array<{
      periode: string;
      nilai_tagihan?: string;
      admin?: number | string;
      denda?: string;
    }>;
  };
}

export interface DepositMethod {
  metode: string;
  type: 'bank' | 'ewallet' | 'va';
  name: string;
  min: number;
  max: number;
  fee: number;
  fee_persen: number;
  status: 'aktif' | 'nonaktif';
  img_url?: string;
  keterangan?: string;
}

export interface DepositOrder {
  id: string;
  reff_id: string;
  userId?: string;
  nominal: number;
  tambahan: number;
  fee: number;
  get_balance: number;
  metode?: string;
  type?: string;
  qr_string?: string;
  qr_image?: string;
  bank?: string;
  tujuan?: string;
  atas_nama?: string;
  nomor_va?: string;
  url?: string;
  payment_url?: string;
  access_key?: string;
  status: 'pending' | 'success' | 'cancel' | 'expired';
  created_at: string;
  expired_at: string;
}

export interface TransactionRecord {
  id: string;
  reff_id: string;
  userId?: string;
  userEmail?: string;
  customer_name?: string;
  layanan: string;
  code: string;
  target: string;
  zone?: string;
  price: number;
  sn?: string | null;
  status: 'pending' | 'success' | 'failed' | 'cancel';
  created_at: string;
  updated_at?: string;
  payment_method: string;
  type?: 'prabayar' | 'pascabayar';
  payment_status?: 'unpaid' | 'paid' | 'expired' | 'failed' | 'cancelled';
  total_payment?: number;
  qr_string?: string;
  qr_image?: string;
  payment_url?: string;
  access_key?: string;
  expired_at?: string;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  ip: string;
  threatType: 'SQL_INJECTION' | 'XSS_ATTACK' | 'COMMAND_INJECTION' | 'PATH_TRAVERSAL' | 'PROTOTYPE_POLLUTION' | 'RATE_LIMIT_EXCEEDED' | 'TAMPERING';
  severity: 'HIGH' | 'CRITICAL' | 'MEDIUM';
  actionTaken: 'BLOCKED_AND_MASKED' | 'SANITIZED';
  incidentId: string;
  endpoint: string;
  samplePayload?: string;
}

export type AppTab =
  | 'catalog'
  | 'postpaid'
  | 'leaderboard'
  | 'tracker'
  | 'dashboard'
  | 'admin'
  | '403'
  | '404'
  | '500';

export interface ApiResponse<T = any> {
  status: boolean;
  message?: string;
  data?: T;
  code?: number;
  incidentId?: string;
  version?: string;
  unchanged?: boolean;
  total?: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  maskedUsername: string;
  totalSpent: number;
  totalOrders: number;
  badge: string;
  avatar: string;
  favoriteService: string;
}

