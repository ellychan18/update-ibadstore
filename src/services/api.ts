import type {
  ApiResponse,
  User,
  ProductItem,
  TransactionRecord,
  DepositOrder,
  DepositMethod,
  PostpaidInquiryResult,
  SecurityAuditLog,
  LeaderboardEntry,
} from '../types.js';

const TOKEN_KEY = 'ibad_auth_token';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = authStorage.getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      return data;
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return {
        status: false,
        message: text || `Permintaan gagal (HTTP ${res.status})`,
        code: res.status,
      };
    }

    return {
      status: true,
      message: 'Berhasil',
      data: (await res.text()) as any,
    };
  } catch (err: any) {
    console.error('API Request Error:', err);
    return {
      status: false,
      message: 'Terjadi kendala koneksi ke server. Silakan muat ulang halaman atau coba lagi.',
      code: 500,
    };
  }
}

export const api = {
  // Auth
  register: (payload: { username: string; name: string; email: string; phone: string; password: string }) =>
    request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { identifier: string; password: string }) =>
    request<{ user: User; token: string; isAdmin?: boolean }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  adminLogin: (payload: { username: string; password: string }) =>
    request<{ user: User; token: string; isAdmin: boolean }>('/api/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () => request<User>('/api/auth/me'),

  logout: () => {
    authStorage.removeToken();
    return Promise.resolve({ status: true, message: 'Logged out' });
  },

  setPin: (pin: string) =>
    request('/api/auth/set-pin', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    }),

  updateProfile: (payload: { name?: string; phone?: string; avatar?: string }) =>
    request<User>('/api/auth/profile', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Products with Smart Client Caching (prevents re-downloading unchanged catalog)
  getProducts: (cachedVersion?: string) => {
    const url = cachedVersion ? `/api/products?v=${encodeURIComponent(cachedVersion)}` : '/api/products';
    return request<ProductItem[]>(url, {
      headers: cachedVersion ? { 'If-None-Match': cachedVersion } : {},
    });
  },
  syncProducts: () => request<{ status: boolean; message: string; count?: number }>('/api/products/sync', { method: 'POST' }),

  // Orders
  createOrder: (payload: {
    code: string;
    target: string;
    zone?: string;
    zone_id?: string;
    category?: string;
    brand?: string;
    payment_method: string;
    pin?: string;
  }) =>
    request<TransactionRecord>('/api/order/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  checkOrder: (query: string) => request<TransactionRecord>(`/api/order/check/${encodeURIComponent(query)}`),

  cancelOrder: (reff_id: string) =>
    request<TransactionRecord>('/api/order/cancel', {
      method: 'POST',
      body: JSON.stringify({ reff_id }),
    }),

  getOrderHistory: () => request<TransactionRecord[]>('/api/order/history'),

  // Pascabayar Bills
  inquireBill: (code: string, customer_no: string) =>
    request<PostpaidInquiryResult>('/api/bill/inquiry', {
      method: 'POST',
      body: JSON.stringify({ code, customer_no }),
    }),

  payBill: (payload: {
    code: string;
    customer_no: string;
    reff_id: string;
    total_tagihan: number;
    payment_method: string;
    pin?: string;
  }) =>
    request<TransactionRecord>('/api/bill/pay', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Deposits
  getDepositMethods: () => request<DepositMethod[]>('/api/deposit/methods'),

  createDeposit: (payload: { nominal: number; type: string; method?: string; metode?: string }) =>
    request<DepositOrder>('/api/deposit/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getDepositStatus: (id: string) => request<DepositOrder>(`/api/deposit/status/${encodeURIComponent(id)}`),

  getDepositHistory: () => request<DepositOrder[]>('/api/deposit/history'),

  cancelDeposit: (id: string) =>
    request('/api/deposit/cancel', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),

  // Leaderboard
  getLeaderboard: (period: string = 'all') => request<LeaderboardEntry[]>(`/api/leaderboard?period=${period}`),

  // Public Security & Audit
  getSecurityStats: () => request<any>('/api/security/stats'),
  getSecurityLogs: () => request<SecurityAuditLog[]>('/api/security/logs'),

  // ================= ADMIN SPECIAL API =================
  getAdminMetrics: () => request<any>('/api/admin/metrics'),
  getAdminTransactions: (status?: string, limit?: number) =>
    request<TransactionRecord[]>(`/api/admin/transactions?status=${status || 'all'}&limit=${limit || 200}`),
  clearAdminTransactions: () =>
    request('/api/admin/transactions/clear', {
      method: 'POST',
    }),
  deleteAdminTransaction: (id: string) =>
    request('/api/admin/transaction/delete', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),
  updateAdminTransactionStatus: (payload: { id: string; status: string; sn?: string }) =>
    request('/api/admin/transaction/update-status', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  adminRecheckTransactionH2H: (id: string) =>
    request('/api/admin/transaction/recheck-h2h', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),
  adminResendTransactionH2H: (id: string) =>
    request('/api/admin/transaction/resend-h2h', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),
  getAdminUsers: () => request<User[]>('/api/admin/users'),
  updateAdminUserBalance: (payload: { userId: string; newBalance: number; reason?: string }) =>
    request('/api/admin/user/balance', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateAdminUserRole: (payload: { userId: string; role: 'user' | 'admin' }) =>
    request('/api/admin/user/role', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  blacklistAdminUser: (payload: { userId: string; isBlacklisted: boolean; reason?: string }) =>
    request('/api/admin/user/blacklist', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteAdminUser: (userId: string) =>
    request('/api/admin/user/delete', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  getAdminDeposits: () => request<DepositOrder[]>('/api/admin/deposits'),
  deleteAdminDeposit: (id: string) =>
    request('/api/admin/deposit/delete', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),
  clearAdminDeposits: () =>
    request('/api/admin/deposits/clear', {
      method: 'POST',
    }),
  actionAdminDeposit: (payload: { id: string; action: 'approve' | 'reject' }) =>
    request('/api/admin/deposit/action', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getAdminGatewayBalance: () => request<any>('/api/admin/gateway-balance'),
  getAdminAtlanticProfile: () => request<any>('/api/admin/atlantic/profile'),
  getAdminBankList: () => request<any>('/api/admin/transfer/banks'),
  adminCheckBankAccount: (payload: { bank_code: string; account_number: string }) =>
    request<any>('/api/admin/transfer/check-account', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  adminCreateTransfer: (payload: {
    ref_id?: string;
    kode_bank: string;
    nomor_akun: string;
    nama_pemilik: string;
    nominal: number;
    email?: string;
    phone?: string;
    note?: string;
  }) =>
    request<any>('/api/admin/transfer/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  adminCheckTransferStatus: (id: string) =>
    request<any>('/api/admin/transfer/status', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),
  getAdminSecurityLogs: () => request<SecurityAuditLog[]>('/api/admin/security/logs'),
  testBtzPay: () => request<any>('/api/admin/btzpay/test'),
  getBtzPayInfo: () => request<any>('/api/admin/btzpay/info'),
  updateBtzPayKey: (apiKey: string) =>
    request<any>('/api/admin/btzpay/update-key', {
      method: 'POST',
      body: JSON.stringify({ apiKey }),
    }),
  getAdminSettings: () => request<Record<string, any>>('/api/admin/settings'),
  updateAdminSettings: (settings: Record<string, any>) =>
    request<any>('/api/admin/settings', {
      method: 'POST',
      body: JSON.stringify({ settings }),
    }),
  testAdminResendEmail: (email: string) =>
    request<any>('/api/admin/email/test', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};
