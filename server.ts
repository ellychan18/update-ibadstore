import 'dotenv/config';
import express from 'express';
import path from 'path';
import crypto from 'node:crypto';
import {
  wafMiddleware,
  maskErrorResponse,
  createSecureToken,
  verifySecureToken,
  verifyPassword,
} from './server/security.js';
import {
  renderErrorHtml,
  render403Html,
  render404Html,
  render500Html,
} from './server/errorPages.js';
import {
  getPriceList,
  createTransaction,
  getTransactionStatus,
  inquireBill,
  payBill,
  getDepositMethods,
  createDeposit,
  cancelDeposit,
  getDepositStatus,
  getAtlanticProfile,
  getBankList,
  checkBankAccount,
  createTransfer,
  getTransferStatus,
} from './server/atlantic.js';
import {
  createBtzPayQris,
  checkBtzPayStatus,
  cancelBtzPayTransaction,
  testBtzPayConnectivity,
  getBtzApiKey,
  setBtzApiKey,
  BTZPAY_BASE_URL,
  BTZPAY_API_KEY,
} from './server/btzpay.js';
import {
  connectMongo,
  isMongoConnected,
  getUserByUsernameOrEmail,
  getUserByUsername,
  getUserByEmail,
  getUserByPhone,
  getUserById,
  createUser,
  sanitizeUser,
  updateUserBalance,
  setUserPin,
  verifyUserPin,
  saveTransaction,
  getTransactionByReffOrId,
  getUserTransactions,
  updateTransactionStatus,
  updateTransactionPayment,
  saveDeposit,
  getDepositById,
  getUserDeposits,
  getPendingUserDeposits,
  updateDepositStatus,
  getProducts,
  getProductsVersion,
  getProductsCount,
  updateProductsList,
  syncProductsFromGateway,
  logSecurityThreat,
  getSecurityLogs,
  getAllUsersAdmin,
  getAllTransactionsAdmin,
  clearAllTransactionsAdmin,
  adminDeleteTransaction,
  adminDeleteDeposit,
  adminClearAllDeposits,
  adminDeleteUser,
  adminToggleBlacklistUser,
  getAllDepositsAdmin,
  adminUpdateUserBalance,
  adminSetUserRole,
  getSystemMetrics,
  saveTransferRecord,
  getTransferRecordByIdOrRef,
  getAllTransferRecords,
  updateUserProfile,
  getTopLeaderboard,
  getSystemSettings,
  updateSystemSettings,
} from './server/db.js';
import {
  sendRegistrationSuccessEmail,
  sendTestResendEmail,
} from './server/email.js';
import type { TransactionRecord, DepositOrder, ProductItem } from './src/types.js';

const app = express();
const SERVER_PORT = parseInt(process.env.SERVER_PORT || '1123', 10);
const PORT = SERVER_PORT;
const BIND_HOST = '0.0.0.0';
const PUBLIC_IP = process.env.PUBLIC_IP || process.env.SERVER_IP || '154.12.118.154';

// Body parsing with safe size limits for profile images and rawBody preservation for webhooks
app.use(
  express.json({
    limit: '10mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply WAF and anti-injection shield on all routes
app.use(wafMiddleware);

// Middleware: Extract Authenticated User from Bearer token
async function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: false,
      message: 'Sesi tidak valid atau telah berakhir. Silakan login kembali.',
      code: 401,
    });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifySecureToken<{ userId: string; role?: string }>(token);
  if (!payload || !payload.userId) {
    return res.status(401).json({
      status: false,
      message: 'Token otentikasi tidak sah atau telah kedaluwarsa.',
      code: 401,
    });
  }

  const user = await getUserById(payload.userId);
  if (!user) {
    return res.status(401).json({
      status: false,
      message: 'Akun pengguna tidak ditemukan di database.',
      code: 401,
    });
  }

  if (user.isBlacklisted || user.status === 'blacklisted') {
    return res.status(403).json({
      status: false,
      message: `Akun Anda telah di-blacklist oleh Administrator. Alasan: ${user.blacklistReason || 'Pelanggaran ketentuan layanan'}. Hubungi CS.`,
      code: 403,
    });
  }

  (req as any).user = user;
  next();
}

// Admin Middleware: Enforce Role === 'admin'
async function adminMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: false,
      message: 'Akses Ditolak: Otorisasi Administrator diperlukan.',
      code: 401,
    });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifySecureToken<{ userId: string; role?: string }>(token);
  if (!payload || !payload.userId) {
    return res.status(401).json({
      status: false,
      message: 'Token otentikasi admin tidak valid.',
      code: 401,
    });
  }

  const user = await getUserById(payload.userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({
      status: false,
      message: 'Akses Dilarang: Hanya akun berwenang Administrator yang dapat mengakses panel ini.',
      code: 403,
    });
  }

  (req as any).user = user;
  next();
}

// Optional Auth (for guest or logged in user)
async function optionalAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = verifySecureToken<{ userId: string }>(token);
    if (payload?.userId) {
      const user = await getUserById(payload.userId);
      if (user) {
        (req as any).user = user;
      }
    }
  }
  next();
}

// ==========================================
// 1. AUTHENTICATION & SECURITY ENDPOINTS
// ==========================================

// Register User
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, name, email, phone, password } = req.body;

    if (!username || !name || !email || !phone || !password) {
      return res.status(400).json({ status: false, message: 'Semua kolom wajib diisi lengkap.' });
    }

    if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
      return res.status(400).json({
        status: false,
        message: 'Username harus berupa 3-24 karakter alfanumerik tanpa spasi atau simbol khusus.',
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ status: false, message: 'Format email tidak valid.' });
    }

    if (!/^[0-9+]{10,16}$/.test(phone)) {
      return res.status(400).json({ status: false, message: 'Format nomor WhatsApp/HP tidak valid.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ status: false, message: 'Password minimal 6 karakter demi keamanan akun.' });
    }

    // Check for existing Username
    const existingUsername = await getUserByUsername(username);
    if (existingUsername) {
      return res.status(400).json({
        status: false,
        field: 'username',
        message: `Username @${username} sudah digunakan oleh akun lain. Silakan pilih username yang berbeda.`,
      });
    }

    // Check for existing Email
    const existingEmail = await getUserByEmail(email);
    if (existingEmail) {
      return res.status(400).json({
        status: false,
        field: 'email',
        message: `Alamat email "${email}" sudah terdaftar di database. Silakan gunakan email lain atau masuk ke akun Anda.`,
      });
    }

    // Check for existing Phone / WhatsApp number
    const existingPhone = await getUserByPhone(phone);
    if (existingPhone) {
      return res.status(400).json({
        status: false,
        field: 'phone',
        message: `Nomor WhatsApp/HP "${phone}" sudah terdaftar pada akun lain. Silakan gunakan nomor lain atau login.`,
      });
    }

    const user = await createUser({ username, name, email, phone, password });
    const token = createSecureToken({ userId: user.id, role: user.role });

    // Send professional onboarding email via Resend in the background (honoring Admin Panel toggle)
    sendRegistrationSuccessEmail({
      to: user.email,
      name: user.name,
      username: user.username,
      phone: user.phone,
      loginUrl: `${req.protocol}://${req.get('host')}/`,
    }).catch((emailErr) => {
      console.warn('[Resend Background Notice]', emailErr?.message || emailErr);
    });

    return res.json({
      status: true,
      message: 'Pendaftaran akun berhasil! Selamat datang di Ibad Store.',
      data: { user, token },
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memproses pendaftaran akun.');
  }
});

// Login User & Admin
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ status: false, message: 'Username/Email dan Password wajib diisi.' });
    }

    const user = await getUserByUsernameOrEmail(identifier);
    if (!user) {
      return res.status(401).json({ status: false, message: 'Kombinasi akun atau password tidak cocok.' });
    }

    const isValid = verifyPassword(password, user.passwordHash, user.passwordSalt);
    if (!isValid) {
      return res.status(401).json({ status: false, message: 'Kombinasi akun atau password tidak cocok.' });
    }

    if (user.isBlacklisted || user.status === 'blacklisted') {
      return res.status(403).json({
        status: false,
        message: `Akun Anda telah di-blacklist oleh Administrator. Alasan: ${user.blacklistReason || 'Pelanggaran ketentuan layanan'}. Hubungi CS.`,
      });
    }

    const token = createSecureToken({ userId: user.id, role: user.role });
    const sanitized = sanitizeUser(user);

    return res.json({
      status: true,
      message: user.role === 'admin' ? 'Login Administrator Berhasil!' : 'Login berhasil. Selamat datang kembali!',
      data: { user: sanitized, token, isAdmin: user.role === 'admin' },
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memproses autentikasi login.');
  }
});

// Special Admin Direct Login Verification
app.post('/api/auth/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ status: false, message: 'Kredensial Admin wajib diisi.' });
    }

    const user = await getUserByUsernameOrEmail(username);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ status: false, message: 'Kredensial Administrator tidak sah atau tidak memiliki hak akses.' });
    }

    const isValid = verifyPassword(password, user.passwordHash, user.passwordSalt);
    if (!isValid) {
      return res.status(403).json({ status: false, message: 'Password Administrator salah.' });
    }

    const token = createSecureToken({ userId: user.id, role: 'admin' });
    return res.json({
      status: true,
      message: 'Autentikasi Master Admin Berhasil. Selamat bertugas!',
      data: { user: sanitizeUser(user), token, isAdmin: true },
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memproses autentikasi Admin.');
  }
});

// Get Current User Profile & Balance (Always sourced from Database)
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;

    // Check recent pending deposits for this user to make sure any successful payments are credited
    try {
      const pendingDeposits = await getPendingUserDeposits(user.id);
      let updatedAny = false;
      for (const dep of pendingDeposits) {
        const isQrisOrBtz =
          dep.metode?.toUpperCase() === 'QRIS' ||
          dep.type?.toLowerCase() === 'qris' ||
          Boolean(dep.access_key || (dep as any).accessKey) ||
          Boolean((dep as any).btz_transaction_id) ||
          dep.id.includes('BTZ') ||
          dep.reff_id.includes('BTZ') ||
          dep.id.startsWith('TRX') ||
          dep.reff_id.startsWith('TRX');

        if (isQrisOrBtz) {
          const btzTrxId = (dep as any).btz_transaction_id || dep.id || dep.reff_id;
          const accessKey = dep.access_key || (dep as any).accessKey || (dep as any).raw?.data?.accessKey;
          const btzStatus = await checkBtzPayStatus(btzTrxId, accessKey);
          if (
            btzStatus &&
            (btzStatus.status === 'sukses' ||
              (btzStatus.raw?.data?.status || '').toLowerCase() === 'sukses' ||
              (btzStatus.raw?.data?.status || '').toLowerCase() === 'success')
          ) {
            await updateDepositStatus(dep.id, 'success');
            updatedAny = true;
            console.log(`[Auto-Sync on Me] Deposit ${dep.id} confirmed paid! Balance updated.`);
          } else if (
            btzStatus &&
            (btzStatus.status === 'expired' || btzStatus.status === 'cancel' || btzStatus.status === 'gagal')
          ) {
            await updateDepositStatus(dep.id, 'cancel');
          }
        }
      }

      if (updatedAny) {
        const fresh = await getUserById(user.id);
        if (fresh) {
          return res.json({ status: true, data: sanitizeUser(fresh) });
        }
      }
    } catch (checkErr) {
      console.warn('[Pending Deposit Sync Notice]', checkErr);
    }

    const freshUser = await getUserById(user.id);
    const sanitized = sanitizeUser(freshUser || user);
    return res.json({ status: true, data: sanitized });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memuat profil pengguna.');
  }
});

// Update User Profile (Name, Phone, and Avatar Photo)
app.post('/api/auth/profile', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { name, phone, avatar } = req.body;

    const updated = await updateUserProfile(user.id, {
      name: typeof name === 'string' ? name : undefined,
      phone: typeof phone === 'string' ? phone : undefined,
      avatar: typeof avatar === 'string' ? avatar : undefined,
    });

    if (!updated) {
      return res.status(404).json({ status: false, message: 'Pengguna tidak ditemukan.' });
    }

    return res.json({
      status: true,
      message: 'Profil dan foto profil berhasil diperbarui!',
      data: updated,
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memperbarui profil pengguna.');
  }
});

app.put('/api/auth/profile', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { name, phone, avatar } = req.body;

    const updated = await updateUserProfile(user.id, {
      name: typeof name === 'string' ? name : undefined,
      phone: typeof phone === 'string' ? phone : undefined,
      avatar: typeof avatar === 'string' ? avatar : undefined,
    });

    if (!updated) {
      return res.status(404).json({ status: false, message: 'Pengguna tidak ditemukan.' });
    }

    return res.json({
      status: true,
      message: 'Profil dan foto profil berhasil diperbarui!',
      data: updated,
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memperbarui profil pengguna.');
  }
});

// Setup Transaction Security PIN
app.post('/api/auth/set-pin', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { pin } = req.body;
    if (!pin || !/^\d{6}$/.test(pin)) {
      return res.status(400).json({ status: false, message: 'PIN Transaksi harus berupa 6 angka rahasia.' });
    }

    await setUserPin(user.id, pin);
    return res.json({ status: true, message: 'PIN Transaksi Keamanan berhasil disimpan di database.' });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memperbarui PIN keamanan.');
  }
});

// ==========================================
// 2. PRODUCT CATALOG ENDPOINTS (PURE ATLANTIC H2H)
// ==========================================

// Get All Products with Smart Caching & Version Diff (prevents re-downloading 11.000+ items repeatedly)
app.get('/api/products', async (req, res) => {
  try {
    const clientVersion = String(req.query.v || req.headers['if-none-match'] || '').trim();
    const currentVersion = getProductsVersion();

    // If client version matches current version, immediately return 304 or unchanged response
    if (clientVersion && clientVersion === currentVersion) {
      res.setHeader('ETag', currentVersion);
      res.setHeader('Cache-Control', 'public, max-age=180, stale-while-revalidate=360');
      return res.json({
        status: true,
        unchanged: true,
        version: currentVersion,
        total: getProductsCount(),
        message: 'Katalog layanan up-to-date (menggunakan cache lokal instan).',
      });
    }

    let products = await getProducts();
    if (!products || products.length === 0) {
      const syncResult = await syncProductsFromGateway(true);
      if (syncResult.status) {
        products = await getProducts();
      }
    }

    res.setHeader('ETag', currentVersion);
    res.setHeader('Cache-Control', 'public, max-age=180, stale-while-revalidate=360');
    return res.json({
      status: true,
      data: products,
      total: products.length,
      version: currentVersion,
      source: 'ATLANTIC_H2H_PURE_API',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal mengambil katalog layanan.');
  }
});

// Force Real-time Re-sync from Atlantic Gateway (Triggered manually by Admin)
app.post('/api/products/sync', async (req, res) => {
  try {
    const syncRes = await syncProductsFromGateway(true);
    return res.json(syncRes);
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal sinkronisasi data dari gateway.');
  }
});

// ==========================================
// 3. TRANSAKSI (CREATE & STATUS CHECK)
// ==========================================

// Create Order (Prabayar & Game Topup)
app.post('/api/order/create', optionalAuth, async (req, res) => {
  try {
    const { code, target, zone, zone_id, category: reqCategory, brand: reqBrand, payment_method, pin } = req.body;
    const authUser = (req as any).user;

    if (!code || !target) {
      return res.status(400).json({ status: false, message: 'Kode produk dan nomor/ID tujuan wajib diisi.' });
    }

    // Strict validation
    if (!/^[a-zA-Z0-9_\-\.\(\)\s]{3,35}$/.test(target)) {
      return res.status(400).json({ status: false, message: 'Format nomor atau ID tujuan tidak valid.' });
    }

    const products = await getProducts();
    const product = products.find((p) => p.code.toUpperCase() === code.toUpperCase());
    if (!product) {
      return res.status(404).json({ status: false, message: 'Layanan produk tidak ditemukan atau sudah nonaktif.' });
    }

    // Format target, zone, category, brand cleanly for Atlantic Gateway vs User Display
    const rawTarget = String(target || '').trim();
    let rawZone = String(zone || zone_id || '').trim();
    let cleanTarget = rawTarget;

    // Detect if user passed target combined like "12345678 (2045)" or "12345678/2045"
    if (!rawZone && (rawTarget.includes('(') || rawTarget.includes('/') || rawTarget.includes('-') || rawTarget.includes(' '))) {
      const match = rawTarget.match(/^([a-zA-Z0-9]+)[\s\(\/\-_]+([a-zA-Z0-9]+)\)?$/);
      if (match) {
        cleanTarget = match[1];
        rawZone = match[2];
      } else {
        cleanTarget = rawTarget.replace(/[^a-zA-Z0-9]/g, '');
      }
    } else {
      cleanTarget = rawTarget.replace(/[^a-zA-Z0-9]/g, '');
    }

    const cleanZone = rawZone ? rawZone.replace(/[^a-zA-Z0-9]/g, '') : '';

    // Derive category and brand slugs
    const prodCategoryLower = (product.category || '').toLowerCase();
    const prodProviderLower = (product.provider || '').toLowerCase();
    const prodNameLower = (product.name || '').toLowerCase();

    let resolvedCategory = reqCategory ? String(reqCategory).trim() : '';
    if (!resolvedCategory) {
      if (prodCategoryLower.includes('game') || prodProviderLower.includes('mobile legends') || prodProviderLower.includes('free fire') || prodProviderLower.includes('genshin')) {
        resolvedCategory = 'games';
      } else if (prodCategoryLower.includes('pulsa') || prodNameLower.includes('pulsa')) {
        resolvedCategory = 'pulsa-reguler';
      } else if (prodCategoryLower.includes('data') || prodCategoryLower.includes('paket') || prodNameLower.includes('kuota')) {
        resolvedCategory = 'paket-data';
      } else if (prodCategoryLower.includes('money') || prodCategoryLower.includes('ewallet') || prodCategoryLower.includes('e-money')) {
        resolvedCategory = 'e-money';
      } else if (prodCategoryLower.includes('pln') || prodNameLower.includes('token pln')) {
        resolvedCategory = 'pln';
      } else {
        resolvedCategory = prodCategoryLower.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'games';
      }
    }

    let resolvedBrand = reqBrand ? String(reqBrand).trim() : '';
    if (!resolvedBrand) {
      if (prodProviderLower.includes('mobile legends') || prodNameLower.includes('mobile legends') || prodNameLower.includes('mlbb')) {
        resolvedBrand = 'mobile-legends';
      } else if (prodProviderLower.includes('free fire') || prodNameLower.includes('free fire')) {
        resolvedBrand = 'free-fire';
      } else if (prodProviderLower.includes('genshin') || prodNameLower.includes('genshin')) {
        resolvedBrand = 'genshin-impact';
      } else if (prodProviderLower.includes('pubg') || prodNameLower.includes('pubg')) {
        resolvedBrand = 'pubg-mobile';
      } else if (prodProviderLower.includes('valorant') || prodNameLower.includes('valorant')) {
        resolvedBrand = 'valorant';
      } else if (prodProviderLower.includes('honkai') || prodNameLower.includes('honkai')) {
        resolvedBrand = 'honkai-star-rail';
      } else if (prodProviderLower.includes('point blank') || prodNameLower.includes('point blank')) {
        resolvedBrand = 'point-blank';
      } else if (prodProviderLower.includes('roblox') || prodNameLower.includes('roblox')) {
        resolvedBrand = 'roblox';
      } else if (prodProviderLower.includes('telkomsel') || prodNameLower.includes('telkomsel')) {
        resolvedBrand = 'telkomsel';
      } else if (prodProviderLower.includes('indosat') || prodNameLower.includes('indosat') || prodProviderLower.includes('isat') || prodProviderLower.includes('im3')) {
        resolvedBrand = 'indosat';
      } else if (prodProviderLower.includes('xl') || prodNameLower.includes('xl')) {
        resolvedBrand = 'xl';
      } else if (prodProviderLower.includes('axis') || prodNameLower.includes('axis')) {
        resolvedBrand = 'axis';
      } else if (prodProviderLower.includes('tri') || prodProviderLower.includes('three') || prodNameLower.includes('tri')) {
        resolvedBrand = 'tri';
      } else if (prodProviderLower.includes('smartfren') || prodNameLower.includes('smartfren')) {
        resolvedBrand = 'smartfren';
      } else if (prodProviderLower.includes('dana') || prodNameLower.includes('dana')) {
        resolvedBrand = 'dana';
      } else if (prodProviderLower.includes('gopay') || prodNameLower.includes('gopay')) {
        resolvedBrand = 'gopay';
      } else if (prodProviderLower.includes('ovo') || prodNameLower.includes('ovo')) {
        resolvedBrand = 'ovo';
      } else if (prodProviderLower.includes('shopee') || prodNameLower.includes('shopeepay')) {
        resolvedBrand = 'shopeepay';
      } else if (prodProviderLower.includes('pln') || prodNameLower.includes('token pln')) {
        resolvedBrand = 'pln';
      } else {
        resolvedBrand = (product.provider || product.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
    }

    const displayTarget = cleanZone
      ? `${cleanTarget} (${cleanZone})`
      : cleanTarget;
    const reffId = `IBAD-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const cost = product.sellPrice || product.price;

    // =========================================================================
    // METODE 1: PEMBAYARAN VIA QRIS (Betabotz Paygate / BTZPay)
    // Pengguna TIDAK perlu saldo akun; sistem membuatkan invoice & QRIS dinamis.
    // =========================================================================
    if (payment_method === 'qris') {
      const qrisFee = Math.round(cost * 0.007); // Fee standar QRIS 0.7%
      const totalPayment = cost + qrisFee;

      console.log(`[Order QRIS] Membuat QRIS BTZPay untuk order ${reffId}, item: ${product.name}, total: Rp ${totalPayment}...`);
      const qrisRes = await createBtzPayQris({
        amount: totalPayment,
        orderId: reffId,
        notes: `Top Up ${product.name} - ${displayTarget}`,
        customerName: authUser?.name || 'Pelanggan Ibad Store',
        customerEmail: authUser?.email,
        customerPhone: authUser?.phone,
        callbackUrl: `${req.protocol}://${req.get('host')}/api/webhook/btzpay`,
        returnUrl: `${req.protocol}://${req.get('host')}/`,
      });

      const qrisTransaction: TransactionRecord = {
        id: reffId,
        reff_id: reffId,
        userId: authUser ? authUser.id : undefined,
        userEmail: authUser ? authUser.email : undefined,
        customer_name: authUser ? authUser.name : undefined,
        layanan: product.name,
        code: product.code,
        target: displayTarget,
        zone: cleanZone || undefined,
        price: cost,
        total_payment: totalPayment,
        sn: null,
        status: 'pending',
        payment_status: 'unpaid',
        payment_method: 'qris',
        qr_string: qrisRes.qrisString,
        qr_image: qrisRes.qrisImage,
        payment_url: qrisRes.paymentUrl,
        access_key: qrisRes.accessKey,
        expired_at: qrisRes.expiredAt || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        type: 'prabayar',
      };

      await saveTransaction(qrisTransaction);

      return res.json({
        status: true,
        message: 'Kode QRIS Betabotz Paygate berhasil dibuat. Silakan scan untuk menyelesaikan pembayaran.',
        data: qrisTransaction,
      });
    }

    // =========================================================================
    // METODE 2: PEMBAYARAN VIA SALDO AKUN IBAD STORE
    // =========================================================================
    if (payment_method === 'saldo') {
      if (!authUser) {
        return res.status(401).json({
          status: false,
          message: 'Silakan login terlebih dahulu untuk membayar dengan Saldo Akun, atau gunakan metode pembayaran QRIS.',
        });
      }

      if (authUser.hasPin && pin) {
        const pinValid = await verifyUserPin(authUser.id, pin);
        if (!pinValid) {
          return res.status(400).json({ status: false, message: 'PIN Transaksi Keamanan salah.' });
        }
      }

      if (authUser.balance < cost) {
        return res.status(400).json({
          status: false,
          message: `Saldo akun tidak mencukupi (Saldo Anda: Rp ${authUser.balance.toLocaleString('id-ID')}, Dibutuhkan: Rp ${cost.toLocaleString('id-ID')}). Silakan gunakan pembayaran via QRIS atau lakukan deposit terlebih dahulu.`,
        });
      }

      // Potong saldo akun pengguna di database
      await updateUserBalance(authUser.id, -cost);
    }

    // Call Atlantic Gateway API with exact parameters format & multi-strategy fallback
    console.log(`[Order Processing] Sending to Atlantic H2H: code=${product.code}, reff_id=${reffId}, target=${cleanTarget}, category=${resolvedCategory}, brand=${resolvedBrand}, zone_id=${cleanZone}`);
    const gatewayRes = await createTransaction({
      code: product.code,
      reff_id: reffId,
      target: cleanTarget,
      category: resolvedCategory,
      brand: resolvedBrand,
      zone_id: cleanZone || undefined,
    });

    console.log('[Order Gateway Response Result]:', gatewayRes);

    // If Atlantic rejected or failed the request
    if (!gatewayRes || gatewayRes.status === false || gatewayRes.status === 'false') {
      // Revert / Refund balance to user immediately if paid with saldo
      if (payment_method === 'saldo' && authUser) {
        await updateUserBalance(authUser.id, cost);
        console.log(`[Order Refund] Refunded Rp ${cost} to user ${authUser.username} due to Atlantic rejection.`);
      }

      // Filter raw messages so internal provider balance errors don't confuse users
      const rawMsg = gatewayRes?.message || '';
      let failMessage = rawMsg;
      if (rawMsg.toLowerCase().includes('saldo') || rawMsg.toLowerCase().includes('balance')) {
        failMessage = 'Layanan ini sedang dalam pemeliharaan provider Atlantic H2H. Saldo Anda aman dan telah dikembalikan otomatis.';
      } else if (!failMessage) {
        failMessage = 'Permintaan pesanan ditolak oleh gateway provider saat ini.';
      }
      
      // Save record as failed with reason
      const failedTransaction: TransactionRecord = {
        id: reffId,
        reff_id: reffId,
        userId: authUser ? authUser.id : undefined,
        userEmail: authUser ? authUser.email : undefined,
        customer_name: authUser ? authUser.name : undefined,
        layanan: product.name,
        code: product.code,
        target: displayTarget,
        price: cost,
        sn: failMessage,
        status: 'failed',
        payment_status: payment_method === 'saldo' ? 'paid' : 'failed',
        created_at: new Date().toISOString(),
        payment_method: payment_method || 'direct',
        type: 'prabayar',
      };
      await saveTransaction(failedTransaction);

      return res.status(400).json({
        status: false,
        message: failMessage,
        data: failedTransaction,
      });
    }

    // Gateway accepted transaction
    let initialStatus: TransactionRecord['status'] = 'pending';
    let txId = reffId;
    let sn: string | null = null;

    if (gatewayRes && gatewayRes.data) {
      txId = gatewayRes.data.id || reffId;
      initialStatus =
        gatewayRes.data.status === 'success'
          ? 'success'
          : gatewayRes.data.status === 'failed'
          ? 'failed'
          : 'pending';
      sn = gatewayRes.data.sn || gatewayRes.data.message || null;
    }

    // Save in MongoDB
    const transaction: TransactionRecord = {
      id: txId,
      reff_id: reffId,
      userId: authUser ? authUser.id : undefined,
      userEmail: authUser ? authUser.email : undefined,
      customer_name: authUser ? authUser.name : undefined,
      layanan: product.name,
      code: product.code,
      target: displayTarget,
      price: cost,
      sn,
      status: initialStatus,
      payment_status: 'paid',
      created_at: new Date().toISOString(),
      payment_method: payment_method || 'saldo',
      type: 'prabayar',
    };

    await saveTransaction(transaction);

    return res.json({
      status: true,
      message: 'Pesanan berhasil dikirim & diproses oleh Atlantic H2H Gateway!',
      data: transaction,
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal membuat pesanan transaksi.');
  }
});

// Check Transaction Status by Invoice / Reff ID / Target (with live Atlantic sync & Mustika QRIS check)
app.get('/api/order/check/:query', async (req, res) => {
  try {
    const { query } = req.params;
    if (!query) return res.status(400).json({ status: false, message: 'Nomor invoice atau ID dibutuhkan.' });

    const localTx = await getTransactionByReffOrId(query);
    if (!localTx) {
      return res.status(404).json({ status: false, message: 'Transaksi tidak ditemukan. Pastikan No. Invoice atau Reff ID benar.' });
    }

    // 1. If this is a QRIS order and still unpaid, check BTZPay gateway
    if (localTx.payment_method === 'qris' && localTx.payment_status === 'unpaid') {
      try {
        let isPaid = false;
        const btzStatus = await checkBtzPayStatus(localTx.reff_id, localTx.access_key);
        if (btzStatus && btzStatus.status === 'sukses') {
          isPaid = true;
        }

        if (isPaid) {
          console.log(`[Order Check] Order ${localTx.reff_id} is PAID via QRIS! Dispatching to Atlantic H2H...`);
          localTx.payment_status = 'paid';
          
          // Send to Atlantic H2H
          try {
            const cleanTarget = (localTx.target || '').split(' ')[0];
            const cleanZone = localTx.zone;
            const gatewayRes = await createTransaction({
              code: localTx.code,
              reff_id: localTx.reff_id,
              target: cleanTarget,
              zone_id: cleanZone || undefined,
            });

            if (gatewayRes && gatewayRes.data) {
              localTx.status = gatewayRes.data.status === 'success' ? 'success' : 'pending';
              localTx.sn = gatewayRes.data.sn || gatewayRes.data.message || 'Diproses otomatis oleh provider';
            } else {
              localTx.status = 'pending';
              localTx.sn = 'Pembayaran QRIS lunas. Pesanan dalam antrian pengisian oleh sistem.';
            }
          } catch (atErr: any) {
            localTx.status = 'pending';
            localTx.sn = 'Pembayaran QRIS lunas. Menunggu pemrosesan otomatis.';
          }

          await saveTransaction(localTx);
          return res.json({
            status: true,
            data: localTx,
            message: 'Pembayaran QRIS telah lunas! Pesanan sedang diproses.',
          });
        }
      } catch (checkErr) {
        console.warn('Could not sync status with BTZPay for order:', checkErr);
      }
    }

    // 2. If already paid, query live Atlantic gateway for real fulfillment update
    if (localTx.status === 'pending' && localTx.payment_status !== 'unpaid') {
      try {
        const queryId = localTx.id || localTx.reff_id;
        const liveStatus = await getTransactionStatus(queryId, localTx.type || 'prabayar');
        console.log(`[Status Query for ${queryId}]:`, liveStatus);
        
        if (liveStatus && liveStatus.status && liveStatus.data) {
          const newStatus =
            liveStatus.data.status === 'success' ? 'success' : liveStatus.data.status === 'failed' ? 'failed' : 'pending';
          await updateTransactionStatus(localTx.reff_id, newStatus, liveStatus.data.sn);
          localTx.status = newStatus;
          if (liveStatus.data.sn) localTx.sn = liveStatus.data.sn;
        }
      } catch (statusErr) {
        console.warn('Could not sync status with Atlantic Gateway:', statusErr);
      }
    }

    return res.json({
      status: true,
      data: localTx,
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memeriksa status pesanan.');
  }
});

// Cancel Order Payment (QRIS / Unpaid Orders)
app.post('/api/order/cancel', optionalAuth, async (req, res) => {
  try {
    const { reff_id, id } = req.body;
    const query = reff_id || id;
    if (!query) {
      return res.status(400).json({ status: false, message: 'Nomor referensi atau Invoice ID wajib diisi.' });
    }

    const tx = await getTransactionByReffOrId(query);
    if (!tx) {
      return res.status(404).json({ status: false, message: 'Pesanan tidak ditemukan.' });
    }

    const authUser = (req as any).user;
    // Security check: if order belongs to a registered user, only the owner or an admin can cancel it
    if (tx.userId && authUser && tx.userId !== authUser.id && authUser.role !== 'admin') {
      return res.status(403).json({ status: false, message: 'Anda tidak memiliki hak untuk membatalkan pesanan ini.' });
    }

    // If order is already paid or success, it cannot be cancelled
    if (tx.payment_status === 'paid' || tx.status === 'success') {
      return res.status(400).json({
        status: false,
        message: 'Pesanan yang sudah dibayar atau diproses tidak dapat dibatalkan.',
      });
    }

    // Already cancelled check
    if (tx.status === 'failed' && (tx.payment_status === 'cancelled' || tx.payment_status === 'failed')) {
      return res.json({
        status: true,
        message: 'Pesanan ini sudah dibatalkan sebelumnya.',
        data: tx,
      });
    }

    // Notify BTZPay gateway to cancel the invoice if it was generated via QRIS
    if (tx.payment_method === 'qris') {
      await cancelBtzPayTransaction(tx.reff_id, 'cancelled_by_user').catch((e) => {
        console.warn(`[BTZPay QRIS Cancel Warning for ${tx.reff_id}]:`, e.message);
      });
    }

    // Update state to cancelled/failed
    tx.status = 'failed';
    tx.payment_status = 'cancelled';
    tx.sn = 'Dibatalkan oleh pelanggan (Invoice QRIS dinonaktifkan)';
    tx.updated_at = new Date().toISOString();

    await saveTransaction(tx);
    console.log(`[Order Cancelled] Order ${tx.reff_id} successfully cancelled by user.`);

    return res.json({
      status: true,
      message: 'Pembayaran QRIS berhasil dibatalkan. Tagihan invoice telah ditutup.',
      data: tx,
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal membatalkan pesanan.');
  }
});

// Top Leaderboard Endpoint
app.get('/api/leaderboard', async (req, res) => {
  try {
    const period = (req.query.period as any) || 'all';
    const leaders = await getTopLeaderboard(period);
    return res.json({
      status: true,
      data: leaders,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memuat data leaderboard.');
  }
});

// User's transactions history
app.get('/api/order/history', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const history = await getUserTransactions(user.id);
    return res.json({ status: true, data: history });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memuat riwayat transaksi.');
  }
});

// ==========================================
// 4. PASCABAYAR BILL (INQUIRY & PAYMENT)
// ==========================================

// Inquire Bill (PLN Pascabayar, BPJS, Internet, dll)
app.post('/api/bill/inquiry', async (req, res) => {
  try {
    const { code, customer_no } = req.body;
    if (!code || !customer_no) {
      return res.status(400).json({ status: false, message: 'Kode produk pascabayar dan nomor pelanggan wajib diisi.' });
    }

    if (!/^[0-9a-zA-Z]{5,28}$/.test(customer_no)) {
      return res.status(400).json({ status: false, message: 'Nomor pelanggan mengandung karakter tidak valid.' });
    }

    const reffId = `INQ-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const gatewayRes = await inquireBill(code, customer_no, reffId);

    if (gatewayRes && gatewayRes.status && gatewayRes.data) {
      return res.json({
        status: true,
        message: 'Tagihan murni berhasil diverifikasi oleh Atlantic H2H.',
        data: gatewayRes.data,
      });
    }

    return res.status(400).json({
      status: false,
      message: gatewayRes?.message || 'Nomor ID Pelanggan tidak ditemukan atau tagihan sudah lunas.',
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memeriksa informasi tagihan pascabayar.');
  }
});

// Pay Postpaid Bill
app.post('/api/bill/pay', optionalAuth, async (req, res) => {
  try {
    const { code, customer_no, reff_id, total_tagihan, payment_method, pin } = req.body;
    const authUser = (req as any).user;

    if (!code || !customer_no) {
      return res.status(400).json({ status: false, message: 'Data pembayaran tagihan belum lengkap.' });
    }

    const billReff = reff_id || `BILL-${Date.now().toString(36).toUpperCase()}`;
    const amount = Number(total_tagihan) || 50000;

    if (payment_method === 'saldo') {
      if (!authUser) {
        return res.status(401).json({ status: false, message: 'Silakan login untuk membayar tagihan dengan Saldo Akun.' });
      }

      if (authUser.hasPin && pin) {
        const pinValid = await verifyUserPin(authUser.id, pin);
        if (!pinValid) return res.status(400).json({ status: false, message: 'PIN Transaksi salah.' });
      }

      if (authUser.balance < amount) {
        return res.status(400).json({
          status: false,
          message: `Saldo akun tidak mencukupi untuk membayar tagihan Rp ${amount.toLocaleString('id-ID')}.`,
        });
      }

      await updateUserBalance(authUser.id, -amount);
    }

    // Call Atlantic Payment Gateway
    const payRes = await payBill(code, customer_no, billReff);
    let payStatus: TransactionRecord['status'] = 'pending';
    let sn: string | null = null;

    if (payRes && payRes.status && payRes.data) {
      payStatus = payRes.data.status === 'success' ? 'success' : payRes.data.status === 'failed' ? 'failed' : 'pending';
      sn = payRes.data.sn || null;
    }

    const tx: TransactionRecord = {
      id: `PASC-${Date.now().toString(36).toUpperCase()}`,
      reff_id: billReff,
      userId: authUser ? authUser.id : undefined,
      userEmail: authUser ? authUser.email : undefined,
      customer_name: authUser ? authUser.name : undefined,
      layanan: `Pembayaran Tagihan ${code}`,
      code,
      target: customer_no,
      price: amount,
      sn,
      status: payStatus,
      created_at: new Date().toISOString(),
      payment_method: payment_method || 'direct',
      type: 'pascabayar',
    };

    await saveTransaction(tx);

    return res.json({
      status: true,
      message: 'Pembayaran tagihan berhasil dikirim ke gateway.',
      data: tx,
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memproses pembayaran tagihan.');
  }
});

// ==========================================
// 5. DEPOSIT BALANCE (BETABOTZ PAYGATE / BTZPAY)
// Website & Docs: https://web.btzpay.my.id/documentation
// ==========================================

// Get Deposit Payment Channels (Exclusively QRIS)
app.get('/api/deposit/methods', async (req, res) => {
  try {
    const depositMethods = [
      {
        metode: 'QRIS',
        type: 'qris',
        name: 'QRIS Realtime Otomatis (Semua Bank & E-Wallet)',
        min: 2000,
        max: 10000000,
        fee: 0,
        fee_persen: 0.7,
        status: 'aktif',
        keterangan: 'QRIS Dinamis Otomatis BTZPay (BCA, BRI, BNI, Mandiri, CIMB, BSI, DANA, GoPay, OVO, ShopeePay, LinkAja)',
      },
    ];

    return res.json({ status: true, data: depositMethods });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memuat metode deposit.');
  }
});

// Create Deposit Ticket (Exclusively QRIS via Betabotz Paygate / BTZPay)
app.post('/api/deposit/create', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { nominal } = req.body;

    const numNominal = Number(nominal);
    if (!numNominal || numNominal < 2000) {
      return res.status(400).json({ status: false, message: 'Nominal deposit minimal adalah Rp 2.000.' });
    }

    const reffId = `TRX-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    // Exclusively QRIS (BTZPay Dynamic QRIS)
    const btzRes = await createBtzPayQris({
      amount: numNominal,
      orderId: reffId,
      notes: `Deposit Saldo Rp ${numNominal.toLocaleString('id-ID')} (${user.username})`,
      customerName: user.name || user.username,
      customerEmail: user.email,
      customerPhone: user.phone,
      callbackUrl: `${req.protocol}://${req.get('host')}/api/webhook/btzpay`,
      returnUrl: `${req.protocol}://${req.get('host')}/`,
    });
    const fee = Math.ceil(numNominal * 0.007); // 0.7% standard QRIS
    const getBal = numNominal;

    const depOrder: DepositOrder = {
      id: btzRes.transactionId || reffId,
      reff_id: reffId,
      userId: user.id,
      nominal: numNominal,
      tambahan: 0,
      fee,
      get_balance: getBal,
      metode: 'QRIS',
      type: 'qris',
      qr_string: btzRes.qrisString,
      qr_image: btzRes.qrisImage,
      payment_url: btzRes.paymentUrl,
      url: btzRes.paymentUrl,
      access_key: btzRes.accessKey,
      status: 'pending',
      created_at: new Date().toISOString(),
      expired_at: btzRes.expiredAt || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
    (depOrder as any).btz_transaction_id = btzRes.transactionId;
    (depOrder as any).raw = btzRes.raw;

    await saveDeposit(depOrder);

    return res.json({
      status: true,
      message: 'Tiket QRIS Betabotz Paygate (BTZPay) berhasil dibuat.',
      data: depOrder,
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal membuat tiket deposit.');
  }
});

// Check Deposit Status (BTZPay + Auto-Credit Balance)
app.get('/api/deposit/status/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const dep = await getDepositById(id);
    if (!dep) {
      return res.status(404).json({ status: false, message: 'Tiket deposit tidak ditemukan.' });
    }

    if (dep.status === 'pending') {
      // 1. Primary Check with Betabotz Paygate (BTZPay) for QRIS deposits
      const isQrisOrBtz =
        dep.metode?.toUpperCase() === 'QRIS' ||
        dep.type?.toLowerCase() === 'qris' ||
        Boolean(dep.access_key || (dep as any).accessKey) ||
        Boolean((dep as any).btz_transaction_id) ||
        dep.id.includes('BTZ') ||
        dep.reff_id.includes('BTZ') ||
        dep.id.startsWith('TRX') ||
        dep.reff_id.startsWith('TRX');

      if (isQrisOrBtz) {
        try {
          const btzTrxId = (dep as any).btz_transaction_id || dep.id || dep.reff_id;
          const accessKey = dep.access_key || (dep as any).accessKey || (dep as any).raw?.data?.accessKey;
          const btzStatus = await checkBtzPayStatus(btzTrxId, accessKey);
          if (
            btzStatus &&
            (btzStatus.status === 'sukses' ||
              (btzStatus.raw?.data?.status || '').toLowerCase() === 'sukses' ||
              (btzStatus.raw?.data?.status || '').toLowerCase() === 'success')
          ) {
            await updateDepositStatus(dep.id, 'success');
            dep.status = 'success';
            console.log(`[BTZPay Auto-Credit] Deposit ${dep.id} paid successfully! Balance credited.`);
          } else if (
            btzStatus &&
            (btzStatus.status === 'expired' || btzStatus.status === 'cancel' || btzStatus.status === 'gagal')
          ) {
            await updateDepositStatus(dep.id, 'cancel');
            dep.status = 'cancel';
          }
        } catch (btzErr) {
          console.warn('[BTZPay Status Check]', btzErr);
        }
      }

      // 2. Fallback check with Atlantic H2H if not yet resolved
      if (dep.status === 'pending') {
        try {
          const liveRes = await getDepositStatus(dep.id);
          if (liveRes && liveRes.status && liveRes.data) {
            if (liveRes.data.status === 'success') {
              await updateDepositStatus(dep.id, 'success');
              dep.status = 'success';
            } else if (liveRes.data.status === 'cancel') {
              await updateDepositStatus(dep.id, 'cancel');
              dep.status = 'cancel';
            }
          }
        } catch (e) {
          // ignore
        }
      }
    }

    return res.json({
      status: true,
      data: dep,
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memeriksa status deposit.');
  }
});

// ==========================================
// 6. BETABOTZ PAYGATE (BTZPAY) INTEGRATION
// Base URL: https://web.btzpay.my.id
// Docs: https://web.btzpay.my.id/documentation
// ==========================================

// BTZPay Webhook Notification (POST /api/webhook/btzpay)
// Receives realtime payment callbacks from https://web.btzpay.my.id
app.post('/api/webhook/btzpay', async (req, res) => {
  try {
    const payload = req.body;
    console.log('[BTZPay Webhook Received]:', JSON.stringify(payload));

    // Support both BTZPay standard formats:
    // Format 1: { "pay_id": "TRX...", "unique_code": "123", "status": "sukses", "raw": { "data": { "transactionId": "TRX...", "orderId": "..." } } }
    // Format 2: Direct transaction update { "transactionId": "TRX...", "orderId": "...", "status": "sukses" }
    const refNo =
      payload?.pay_id ||
      payload?.raw?.data?.orderId ||
      payload?.raw?.data?.transactionId ||
      payload?.data?.orderId ||
      payload?.data?.transactionId ||
      payload?.transactionId ||
      payload?.metadata?.orderId ||
      payload?.order_id ||
      payload?.unique_code;

    const rawStatus = String(
      payload?.status ||
      payload?.raw?.data?.status ||
      payload?.data?.status ||
      ''
    ).toLowerCase();

    const isPaid =
      rawStatus === 'sukses' ||
      rawStatus === 'success' ||
      rawStatus === 'paid';

    const isCancelled =
      rawStatus === 'cancel' ||
      rawStatus === 'cancelled' ||
      rawStatus === 'expired' ||
      rawStatus === 'gagal' ||
      rawStatus === 'failed';

    if (refNo) {
      // 1. Check in deposits
      const dep = await getDepositById(refNo);
      if (dep) {
        if (isPaid && dep.status !== 'success') {
          await updateDepositStatus(dep.id, 'success');
          console.log(`[BTZPay Webhook] Deposit ${dep.id} confirmed paid! Balance credited.`);
        } else if (isCancelled) {
          await updateDepositStatus(dep.id, 'cancel');
        }
      } else {
        // 2. Check in order transactions
        const tx = await getTransactionByReffOrId(refNo);
        if (tx) {
          if (isPaid && tx.payment_status !== 'paid') {
            console.log(`[BTZPay Webhook] Order ${tx.reff_id} confirmed paid via QRIS! Dispatching to Atlantic H2H...`);
            tx.payment_status = 'paid';
            try {
              const cleanTarget = (tx.target || '').split(' ')[0];
              const cleanZone = tx.zone;
              const gatewayRes = await createTransaction({
                code: tx.code,
                reff_id: tx.reff_id,
                target: cleanTarget,
                zone_id: cleanZone || undefined,
              });

              if (gatewayRes && gatewayRes.data) {
                tx.status = gatewayRes.data.status === 'success' ? 'success' : 'pending';
                tx.sn = gatewayRes.data.sn || gatewayRes.data.message || 'Diproses oleh provider';
              } else {
                tx.status = 'pending';
                tx.sn = 'Pembayaran QRIS lunas. Sedang dalam antrian pengisian oleh sistem.';
              }
            } catch (e: any) {
              tx.status = 'pending';
              tx.sn = 'Pembayaran QRIS lunas. Menunggu pemrosesan otomatis.';
            }
            await saveTransaction(tx);
          } else if (isCancelled) {
            tx.payment_status = 'failed';
            tx.status = 'failed';
            await saveTransaction(tx);
          }
        } else {
          console.log(`[BTZPay Webhook] Reference ${refNo} not found in deposits or transactions.`);
        }
      }
    }

    // Must return { "success": true } per BTZPay documentation
    return res.status(200).json({ success: true, message: 'BTZPay webhook processed successfully.' });
  } catch (err: any) {
    console.error('[BTZPay Webhook Error]:', err);
    return res.status(200).json({ success: true, error: err.message });
  }
});

// Admin Diagnostic Endpoint: Test BTZPay Gateway Connection
app.get('/api/admin/btzpay/test', async (req, res) => {
  try {
    const result = await testBtzPayConnectivity();
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Admin Info Endpoint: Get BTZPay Gateway Configuration
app.get('/api/admin/btzpay/info', async (req, res) => {
  try {
    const key = getBtzApiKey();
    return res.json({
      success: true,
      baseUrl: BTZPAY_BASE_URL,
      documentationUrl: `${BTZPAY_BASE_URL}/documentation`,
      apiKeyMasked: key.length > 12 ? `${key.slice(0, 8)}...${key.slice(-8)}` : '***',
      apiKey: key,
      webhookUrl: `${req.protocol}://${req.get('host')}/api/webhook/btzpay`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Admin Endpoint: Update BTZPay Gateway API Key
app.post('/api/admin/btzpay/update-key', adminMiddleware, async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      return res.status(400).json({ success: false, message: 'API Key BTZPay wajib diisi.' });
    }
    const cleanKey = apiKey.trim();
    setBtzApiKey(cleanKey);
    return res.json({
      success: true,
      message: 'API Key BTZPay berhasil diperbarui dan aktif seketika.',
      apiKeyMasked: cleanKey.length > 12 ? `${cleanKey.slice(0, 8)}...${cleanKey.slice(-8)}` : '***',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Atlantic H2H Webhook Notification (POST /api/webhook/atlantic)
// Receives realtime order & deposit status callbacks from https://atlantich2h.com/api
app.post('/api/webhook/atlantic', async (req, res) => {
  try {
    const payload = req.body;
    console.log('[Atlantic Webhook Received]', payload);

    if (!payload || !payload.event) {
      return res.status(400).json({ status: false, message: 'Invalid webhook payload.' });
    }

    const { event, status, data } = payload;

    // 1. Prepaid or Postpaid transaction callback
    if (event === 'transaksi' || event === 'transaksi.pascabayar') {
      const orderId = data?.reff_id || data?.id;
      const orderStatus = String(status || data?.status || '').toLowerCase();
      const sn = data?.sn;

      if (orderId) {
        let mappedStatus: 'pending' | 'success' | 'failed' | 'cancel' = 'pending';
        if (orderStatus === 'success') mappedStatus = 'success';
        else if (orderStatus === 'failed' || orderStatus === 'gagal' || orderStatus === 'error') mappedStatus = 'failed';
        else if (orderStatus === 'cancel' || orderStatus === 'dibatalkan') mappedStatus = 'cancel';

        await updateTransactionStatus(orderId, mappedStatus, sn);
        console.log(`[Atlantic Webhook] Transaction ${orderId} updated to ${mappedStatus} (SN: ${sn || '-'})`);
      }
    }

    // 2. Deposit callback (if Atlantic deposits ever execute)
    if (event === 'deposit') {
      const depId = data?.reff_id || data?.id;
      const depStatus = String(status || data?.status || '').toLowerCase();

      if (depId) {
        const dep = await getDepositById(depId);
        if (dep) {
          if (depStatus === 'success' && dep.status !== 'success') {
            await updateDepositStatus(dep.id, 'success');
            console.log(`[Atlantic Webhook] Deposit ${dep.id} credited successfully!`);
          } else if (depStatus === 'failed' || depStatus === 'cancel' || depStatus === 'expired') {
            await updateDepositStatus(dep.id, 'cancel');
          }
        }
      }
    }

    return res.json({ status: true, message: 'Atlantic webhook received successfully.' });
  } catch (err: any) {
    console.error('[Atlantic Webhook Error]', err);
    return res.status(500).json({ status: false, message: err.message });
  }
});

// User Deposits History (Auto-sync pending deposits with BTZPay)
app.get('/api/deposit/history', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    let list = await getUserDeposits(user.id);

    // Actively check any pending deposits in user's history
    let hasUpdated = false;
    for (const dep of list) {
      if (dep.status === 'pending') {
        const isQrisOrBtz =
          dep.metode?.toUpperCase() === 'QRIS' ||
          dep.type?.toLowerCase() === 'qris' ||
          Boolean(dep.access_key || (dep as any).accessKey) ||
          Boolean((dep as any).btz_transaction_id) ||
          dep.id.includes('BTZ') ||
          dep.reff_id.includes('BTZ') ||
          dep.id.startsWith('TRX') ||
          dep.reff_id.startsWith('TRX');

        if (isQrisOrBtz) {
          try {
            const btzTrxId = (dep as any).btz_transaction_id || dep.id || dep.reff_id;
            const accessKey = dep.access_key || (dep as any).accessKey || (dep as any).raw?.data?.accessKey;
            const btzStatus = await checkBtzPayStatus(btzTrxId, accessKey);
            if (
              btzStatus &&
              (btzStatus.status === 'sukses' ||
                (btzStatus.raw?.data?.status || '').toLowerCase() === 'sukses' ||
                (btzStatus.raw?.data?.status || '').toLowerCase() === 'success')
            ) {
              await updateDepositStatus(dep.id, 'success');
              dep.status = 'success';
              hasUpdated = true;
            } else if (
              btzStatus &&
              (btzStatus.status === 'expired' || btzStatus.status === 'cancel' || btzStatus.status === 'gagal')
            ) {
              await updateDepositStatus(dep.id, 'cancel');
              dep.status = 'cancel';
              hasUpdated = true;
            }
          } catch (e) {}
        }
      }
    }

    if (hasUpdated) {
      list = await getUserDeposits(user.id);
    }

    return res.json({ status: true, data: list });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memuat riwayat deposit.');
  }
});

// Cancel Deposit
app.post('/api/deposit/cancel', authMiddleware, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ status: false, message: 'ID Deposit diperlukan.' });

    const dep = await getDepositById(id);
    if (!dep) return res.status(404).json({ status: false, message: 'Deposit tidak ditemukan.' });

    if (dep.status !== 'pending') {
      return res.status(400).json({ status: false, message: 'Hanya tiket pending yang dapat dibatalkan.' });
    }

    // Cancel on BTZPay if it is a BTZPay QRIS transaction
    if (dep.metode === 'QRIS' || (dep as any).btz_transaction_id || dep.id.startsWith('BTZ') || dep.reff_id.startsWith('BTZ')) {
      const btzId = (dep as any).btz_transaction_id || dep.id;
      await cancelBtzPayTransaction(btzId).catch(() => {});
    }

    await cancelDeposit(id).catch(() => {});
    await updateDepositStatus(id, 'cancel');

    return res.json({ status: true, message: 'Tiket deposit berhasil dibatalkan.' });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal membatalkan tiket deposit.');
  }
});

// ==========================================
// 6. ADMIN SPECIAL ENDPOINTS (MONITORING & CONTROL)
// ==========================================

// Get System Settings (including Resend notification status)
app.get('/api/admin/settings', adminMiddleware, async (req, res) => {
  try {
    const settings = await getSystemSettings();
    return res.json({ status: true, data: settings });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memuat pengaturan sistem.');
  }
});

// Update System Settings (Toggle Resend email, margins, etc.)
app.post('/api/admin/settings', adminMiddleware, async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ status: false, message: 'Data pengaturan tidak valid.' });
    }
    const updated = await updateSystemSettings(settings);
    return res.json({
      status: true,
      message: 'Pengaturan sistem berhasil diperbarui di database.',
      data: updated,
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memperbarui pengaturan sistem.');
  }
});

// Test Resend Email directly from Admin Panel
app.post('/api/admin/email/test', adminMiddleware, async (req, res) => {
  try {
    const { email } = req.body;
    const targetEmail = (email || '').trim() || 'mail.ibad05@gmail.com';
    const result = await sendTestResendEmail(targetEmail);
    if (result.success) {
      return res.json({
        status: true,
        message: `Email uji coba berhasil dikirim ke ${targetEmail} via Resend!`,
        data: result.data,
      });
    } else {
      return res.status(400).json({
        status: false,
        message: result.error || 'Gagal mengirim email uji coba via Resend.',
      });
    }
  } catch (err) {
    return maskErrorResponse(res, err, 'Terjadi kendala saat menguji pengiriman email.');
  }
});

// Get System Overview Metrics
app.get('/api/admin/metrics', adminMiddleware, async (req, res) => {
  try {
    const metrics = await getSystemMetrics();
    return res.json({ status: true, data: metrics });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memuat metrik sistem.');
  }
});

// Get All Transactions for Admin Activity Stream
app.get('/api/admin/transactions', adminMiddleware, async (req, res) => {
  try {
    const { status, limit } = req.query;
    const txs = await getAllTransactionsAdmin({
      status: status as string,
      limit: limit ? Number(limit) : 200,
    });
    return res.json({ status: true, data: txs, total: txs.length });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memuat data transaksi admin.');
  }
});

// Clear/Purge All Transactions (Admin Only)
app.post('/api/admin/transactions/clear', adminMiddleware, async (req, res) => {
  try {
    await clearAllTransactionsAdmin();
    return res.json({ status: true, message: 'Seluruh data riwayat transaksi berhasil dibersihkan.' });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal membersihkan data transaksi.');
  }
});

// Delete Single Transaction by Admin
app.post('/api/admin/transaction/delete', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ status: false, message: 'ID transaksi atau nomor referensi wajib diisi.' });
    }

    await adminDeleteTransaction(id);
    return res.json({ status: true, message: `Transaksi ${id} berhasil dihapus dari riwayat database.` });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal menghapus riwayat transaksi.');
  }
});

// Update Transaction Status by Admin (Manual Intervention / Sync)
app.post('/api/admin/transaction/update-status', adminMiddleware, async (req, res) => {
  try {
    const { id, status, sn } = req.body;
    if (!id || !status) {
      return res.status(400).json({ status: false, message: 'ID transaksi dan status wajib ditentukan.' });
    }

    await updateTransactionStatus(id, status, sn);
    return res.json({ status: true, message: `Status transaksi ${id} berhasil diubah menjadi ${status}.` });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memperbarui status transaksi.');
  }
});

// Admin Recheck Live Status directly from Atlantic H2H
app.post('/api/admin/transaction/recheck-h2h', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ status: false, message: 'ID transaksi wajib diisi.' });

    const tx = await getTransactionByReffOrId(id);
    if (!tx) return res.status(404).json({ status: false, message: 'Transaksi tidak ditemukan di database.' });

    const queryId = tx.id || tx.reff_id;
    const liveStatus = await getTransactionStatus(queryId, tx.type || 'prabayar');

    if (liveStatus && liveStatus.status && liveStatus.data) {
      const newStatus =
        liveStatus.data.status === 'success' ? 'success' : liveStatus.data.status === 'failed' ? 'failed' : 'pending';
      await updateTransactionStatus(tx.reff_id, newStatus, liveStatus.data.sn);
      tx.status = newStatus;
      if (liveStatus.data.sn) tx.sn = liveStatus.data.sn;

      return res.json({
        status: true,
        message: `Status terverifikasi dari Atlantic: ${newStatus.toUpperCase()}`,
        gatewayData: liveStatus.data,
        data: tx,
      });
    }

    return res.json({
      status: false,
      message: liveStatus?.message || 'Gateway Atlantic tidak menemukan transaksi dengan ID ini.',
      rawGateway: liveStatus,
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal mengecek status ke Atlantic H2H.');
  }
});

// Admin Resend / Re-push Order to Atlantic H2H
app.post('/api/admin/transaction/resend-h2h', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ status: false, message: 'ID transaksi wajib diisi.' });

    const tx = await getTransactionByReffOrId(id);
    if (!tx) return res.status(404).json({ status: false, message: 'Transaksi tidak ditemukan.' });

    const rawTarget = tx.target || '';
    const cleanTarget = rawTarget.replace(/[^a-zA-Z0-9]/g, '');

    const gatewayRes = await createTransaction({
      code: tx.code,
      reff_id: tx.reff_id,
      target: cleanTarget,
    });

    if (gatewayRes && gatewayRes.status && gatewayRes.data) {
      const newStatus = gatewayRes.data.status === 'success' ? 'success' : gatewayRes.data.status === 'failed' ? 'failed' : 'pending';
      await updateTransactionStatus(tx.reff_id, newStatus, gatewayRes.data.sn);
      if (gatewayRes.data.id) {
        tx.id = gatewayRes.data.id;
      }
      tx.status = newStatus;
      if (gatewayRes.data.sn) tx.sn = gatewayRes.data.sn;
      await saveTransaction(tx);

      return res.json({
        status: true,
        message: 'Pesanan berhasil dikirim ulang ke gateway Atlantic H2H!',
        data: tx,
        gatewayData: gatewayRes.data,
      });
    }

    return res.status(400).json({
      status: false,
      message: gatewayRes?.message || 'Pengiriman ulang ke Atlantic H2H gagal.',
      rawGateway: gatewayRes,
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal mengirim ulang transaksi.');
  }
});

// Get All Users for Admin
app.get('/api/admin/users', adminMiddleware, async (req, res) => {
  try {
    const users = await getAllUsersAdmin();
    return res.json({ status: true, data: users, total: users.length });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memuat daftar pengguna.');
  }
});

// Update User Balance by Admin
app.post('/api/admin/user/balance', adminMiddleware, async (req, res) => {
  try {
    const { userId, newBalance, reason } = req.body;
    if (!userId || newBalance === undefined) {
      return res.status(400).json({ status: false, message: 'User ID dan nominal saldo baru wajib ditentukan.' });
    }

    const ok = await adminUpdateUserBalance(userId, Number(newBalance));
    if (!ok) return res.status(404).json({ status: false, message: 'Pengguna tidak ditemukan.' });

    return res.json({
      status: true,
      message: `Saldo pengguna berhasil diatur menjadi Rp ${Number(newBalance).toLocaleString('id-ID')}`,
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memperbarui saldo pengguna.');
  }
});

// Update User Role (User/Admin)
app.post('/api/admin/user/role', adminMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.body;
    if (!userId || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ status: false, message: 'Role harus berupa user atau admin.' });
    }

    const ok = await adminSetUserRole(userId, role);
    if (!ok) return res.status(404).json({ status: false, message: 'Pengguna tidak ditemukan.' });

    return res.json({ status: true, message: `Role pengguna berhasil diubah menjadi ${role}.` });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal mengubah role pengguna.');
  }
});

// Blacklist or Un-blacklist User by Admin
app.post('/api/admin/user/blacklist', adminMiddleware, async (req, res) => {
  try {
    const { userId, isBlacklisted, reason } = req.body;
    if (!userId) {
      return res.status(400).json({ status: false, message: 'User ID wajib ditentukan.' });
    }

    const admin = (req as any).user;
    if (admin && admin.id === userId) {
      return res.status(400).json({ status: false, message: 'Anda tidak dapat mem-blacklist akun Anda sendiri.' });
    }

    const ok = await adminToggleBlacklistUser(userId, Boolean(isBlacklisted), reason || '');
    if (!ok) return res.status(404).json({ status: false, message: 'Pengguna tidak ditemukan.' });

    return res.json({
      status: true,
      message: isBlacklisted
        ? 'Pengguna berhasil dimasukkan ke daftar BLACKLIST. Akses akun telah diblokir.'
        : 'Status BLACKLIST pengguna berhasil dicabut. Akun telah aktif kembali.',
    });
  } catch (err: any) {
    return maskErrorResponse(res, err, err.message || 'Gagal mengubah status blacklist pengguna.');
  }
});

// Delete User by Admin (Permanent)
app.post('/api/admin/user/delete', adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ status: false, message: 'User ID wajib ditentukan.' });
    }

    const admin = (req as any).user;
    if (admin && admin.id === userId) {
      return res.status(400).json({ status: false, message: 'Anda tidak dapat menghapus akun Anda sendiri.' });
    }

    const ok = await adminDeleteUser(userId);
    if (!ok) return res.status(404).json({ status: false, message: 'Pengguna tidak ditemukan atau sudah dihapus.' });

    return res.json({
      status: true,
      message: 'Akun pengguna berhasil dihapus secara permanen dari MongoDB Atlas.',
    });
  } catch (err: any) {
    return maskErrorResponse(res, err, err.message || 'Gagal menghapus pengguna.');
  }
});

// Get All Deposits for Admin
app.get('/api/admin/deposits', adminMiddleware, async (req, res) => {
  try {
    const deposits = await getAllDepositsAdmin();
    return res.json({ status: true, data: deposits, total: deposits.length });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memuat daftar deposit.');
  }
});

// Delete Single Deposit History by Admin
app.post('/api/admin/deposit/delete', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ status: false, message: 'ID deposit wajib diisi.' });
    }

    await adminDeleteDeposit(id);
    return res.json({ status: true, message: `Riwayat deposit #${id} berhasil dihapus dari database.` });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal menghapus riwayat deposit.');
  }
});

// Clear All Deposits History by Admin
app.post('/api/admin/deposits/clear', adminMiddleware, async (req, res) => {
  try {
    await adminClearAllDeposits();
    return res.json({ status: true, message: 'Seluruh riwayat tiket deposit berhasil dibersihkan.' });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal membersihkan data riwayat deposit.');
  }
});

// Approve or Reject Deposit by Admin
app.post('/api/admin/deposit/action', adminMiddleware, async (req, res) => {
  try {
    const { id, action } = req.body;
    if (!id || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ status: false, message: 'Aksi harus berupa approve atau reject.' });
    }

    const newStatus = action === 'approve' ? 'success' : 'cancel';
    await updateDepositStatus(id, newStatus);

    return res.json({
      status: true,
      message: `Deposit ${id} berhasil di-${action === 'approve' ? 'setujui dan saldo dikreditkan' : 'tolak'}.`,
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memproses aksi deposit.');
  }
});

// Atlantic Gateway Balance Endpoint
app.get('/api/admin/gateway-balance', adminMiddleware, async (req, res) => {
  try {
    const t0 = Date.now();
    const profile = await getAtlanticProfile();
    const latency = Date.now() - t0;
    const isSuccess = (profile?.status === true || profile?.status === 'true') && !!profile?.data;
    const data = isSuccess ? profile.data : null;

    return res.json({
      status: isSuccess,
      balance: data?.balance !== undefined ? Number(data.balance) : 0,
      statusGateway: data?.status === 'active' || data?.status === 'aktif' ? 'ACTIVE' : (isSuccess ? 'ONLINE' : 'DEGRADED'),
      latencyMs: latency,
      data: data || undefined,
      message: !isSuccess ? profile?.message || 'Gagal mengambil saldo gateway.' : undefined,
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal mengambil saldo gateway.');
  }
});

// Atlantic Gateway Live Profile & Live Balance (POST /get_profile)
app.get('/api/admin/atlantic/profile', adminMiddleware, async (req, res) => {
  try {
    const t0 = Date.now();
    const profile = await getAtlanticProfile();
    const latency = Date.now() - t0;
    const isSuccess = (profile?.status === true || profile?.status === 'true') && !!profile?.data;
    const data = isSuccess ? profile.data : null;

    return res.json({
      status: isSuccess,
      latencyMs: latency,
      data: data || undefined,
      raw: profile,
      message: !isSuccess ? profile?.message || 'Gagal mengambil profil Atlantic H2H.' : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal mengambil profil Atlantic H2H.');
  }
});

// Atlantic Gateway Bank & E-Wallet List (POST /transfer/bank_list)
const DEFAULT_INDONESIAN_BANKS = [
  { id: '1', bank_code: 'bca', bank_name: 'Bank Central Asia (BCA)', type: 'bank' },
  { id: '2', bank_code: 'mandiri', bank_name: 'Bank Mandiri', type: 'bank' },
  { id: '3', bank_code: 'bni', bank_name: 'Bank Negara Indonesia (BNI)', type: 'bank' },
  { id: '4', bank_code: 'bri', bank_name: 'Bank Rakyat Indonesia (BRI)', type: 'bank' },
  { id: '5', bank_code: 'bsi', bank_name: 'Bank Syariah Indonesia (BSI)', type: 'bank' },
  { id: '6', bank_code: 'cimb', bank_name: 'CIMB Niaga', type: 'bank' },
  { id: '7', bank_code: 'permata', bank_name: 'Bank Permata', type: 'bank' },
  { id: '8', bank_code: 'danamon', bank_name: 'Bank Danamon', type: 'bank' },
  { id: '9', bank_code: 'btn', bank_name: 'Bank BTN', type: 'bank' },
  { id: '10', bank_code: 'seabank', bank_name: 'SeaBank Indonesia', type: 'bank' },
  { id: '11', bank_code: 'jago', bank_name: 'Bank Jago', type: 'bank' },
  { id: '12', bank_code: 'neo', bank_name: 'Bank Neo Commerce (BNC)', type: 'bank' },
  { id: '13', bank_code: 'dana', bank_name: 'DANA E-Wallet', type: 'ewallet' },
  { id: '14', bank_code: 'gopay', bank_name: 'GoPay E-Wallet', type: 'ewallet' },
  { id: '15', bank_code: 'ovo', bank_name: 'OVO E-Wallet', type: 'ewallet' },
  { id: '16', bank_code: 'shopeepay', bank_name: 'ShopeePay E-Wallet', type: 'ewallet' },
  { id: '17', bank_code: 'linkaja', bank_name: 'LinkAja E-Wallet', type: 'ewallet' },
];

app.get('/api/admin/transfer/banks', adminMiddleware, async (req, res) => {
  try {
    const result = await getBankList();
    if (result && (result.status === true || result.status === 'true') && Array.isArray(result.data) && result.data.length > 0) {
      const normalized = result.data.map((item: any, idx: number) => {
        const bankCode = String(item.bank_code || item.code || item.kode_bank || '').toLowerCase();
        const isEwallet = /dana|gopay|ovo|shopeepay|linkaja|kaspro|sakuku|astrapay/i.test(bankCode);
        return {
          id: String(item.id || idx + 1),
          bank_code: bankCode,
          bank_name: String(item.bank_name || item.name || item.bank || bankCode.toUpperCase()),
          type: item.type ? String(item.type).toLowerCase() : isEwallet ? 'ewallet' : 'bank',
        };
      });

      return res.json({
        status: true,
        message: result.message || 'Data bank retrieved successfully',
        data: normalized,
      });
    }

    // Fallback to complete standard Indonesian banks & e-wallets
    return res.json({
      status: true,
      message: 'Daftar bank dan e-wallet resmi Indonesia siap digunakan.',
      data: DEFAULT_INDONESIAN_BANKS,
    });
  } catch (err) {
    return res.json({
      status: true,
      message: 'Daftar bank transfer lokal aktif.',
      data: DEFAULT_INDONESIAN_BANKS,
    });
  }
});

// Atlantic Check Bank / E-Wallet Account (POST /transfer/cek_rekening)
app.post('/api/admin/transfer/check-account', adminMiddleware, async (req, res) => {
  try {
    const { bank_code, account_number } = req.body;
    if (!bank_code || !account_number) {
      return res.status(400).json({
        status: false,
        message: 'Parameter bank_code dan account_number wajib diisi.',
      });
    }

    const result = await checkBankAccount(String(bank_code), String(account_number));
    return res.json(result);
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal melakukan verifikasi nomor rekening.');
  }
});

// Atlantic Create Transfer (POST /transfer/create)
app.post('/api/admin/transfer/create', adminMiddleware, async (req, res) => {
  try {
    const {
      ref_id,
      kode_bank,
      nomor_akun,
      nama_pemilik,
      nominal,
      email,
      phone,
      note,
    } = req.body;

    if (!kode_bank || !nomor_akun || !nama_pemilik || !nominal) {
      return res.status(400).json({
        status: false,
        message: 'Data transfer belum lengkap (kode_bank, nomor_akun, nama_pemilik, nominal wajib diisi).',
      });
    }

    const uniqueRef = ref_id || `TRF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const result = await createTransfer({
      ref_id: uniqueRef,
      kode_bank: String(kode_bank),
      nomor_akun: String(nomor_akun),
      nama_pemilik: String(nama_pemilik),
      nominal: Number(nominal),
      email,
      phone,
      note,
    });

    if (result && result.data) {
      await saveTransferRecord({
        id: result.data.id || uniqueRef,
        reff_id: uniqueRef,
        nama: String(nama_pemilik),
        nomor_tujuan: String(nomor_akun),
        nominal: Number(nominal),
        fee: result.data.fee || 1000,
        total: result.data.total || (Number(nominal) + 1000),
        status: result.data.status || 'success',
        bank_code: String(kode_bank),
        detail: {
          email,
          phone,
          note,
        },
        created_at: result.data.created_at || new Date().toISOString(),
      });
    }

    return res.json(result);
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal mengirim instruksi transfer dana.');
  }
});

// Atlantic Check Transfer Status (POST /transfer/status)
app.post('/api/admin/transfer/status', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({
        status: false,
        message: 'Parameter ID transfer diperlukan.',
      });
    }

    // Try local record first
    const localRecord = await getTransferRecordByIdOrRef(String(id));
    if (localRecord) {
      return res.json({
        status: true,
        message: 'Data status transfer berhasil ditemukan.',
        data: localRecord,
      });
    }

    const result = await getTransferStatus(String(id));
    return res.json(result);
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memeriksa status transfer.');
  }
});

// Live WAF Threat & Security Logs for Admin
app.get('/api/admin/security/logs', adminMiddleware, async (req, res) => {
  try {
    const logs = await getSecurityLogs(100);
    return res.json({ status: true, data: logs });
  } catch (err) {
    return maskErrorResponse(res, err, 'Gagal memuat log keamanan admin.');
  }
});

// ==========================================
// 7. PUBLIC SECURITY DASHBOARD STATS
// ==========================================

app.get('/api/security/stats', async (req, res) => {
  const logs = await getSecurityLogs(10);
  return res.json({
    status: true,
    data: {
      wafStatus: 'ACTIVE_ARMORED',
      antiInjection: 'ACTIVE (Deep AST & Regex Pattern Inspection)',
      errorMasking: 'ENABLED (Zero Information Leakage Policy)',
      encryption: 'PBKDF2-SHA512 (100,000 Iters) + HMAC-SHA256 + AES-256-GCM',
      database: isMongoConnected() ? 'MONGODB_ATLAS_CLUSTER' : 'FAILSAFE_PERSISTENCE',
      totalThreatsBlocked: logs.length,
      lastThreatTime: logs[0]?.timestamp || null,
      serverTime: new Date().toISOString(),
    },
  });
});

app.get('/api/security/logs', async (req, res) => {
  const logs = await getSecurityLogs(30);
  const sanitizedLogs = logs.map((log) => ({
    id: log.id,
    incidentId: log.incidentId,
    timestamp: log.timestamp,
    threatType: log.threatType,
    severity: log.severity,
    actionTaken: log.actionTaken,
    endpoint: log.endpoint,
    maskedIp: log.ip.replace(/\d+$/, 'xxx'),
  }));
  return res.json({ status: true, data: sanitizedLogs });
});

// ==========================================
// SENSITIVE FILE PROTECTION & ERROR PAGES (403, 404, 500)
// ==========================================

// 1. Strict Protection for Sensitive Files & Dotfiles (.env, .git, etc.)
app.use((req, res, next) => {
  const normalizedPath = req.path.toLowerCase();

  // Allow Vite internal client modules and packages
  if (
    normalizedPath.startsWith('/node_modules/') ||
    normalizedPath.startsWith('/@') ||
    normalizedPath.startsWith('/src/') ||
    normalizedPath.startsWith('/public/') ||
    normalizedPath.startsWith('/api/')
  ) {
    return next();
  }

  const isSensitiveFile =
    normalizedPath === '/.env' ||
    normalizedPath.startsWith('/.env') ||
    normalizedPath.includes('.env') ||
    normalizedPath.startsWith('/.git') ||
    normalizedPath.includes('/.git') ||
    normalizedPath === '/package.json' ||
    normalizedPath === '/package-lock.json' ||
    normalizedPath === '/tsconfig.json' ||
    normalizedPath.includes('vite.config') ||
    normalizedPath.startsWith('/server/');

  if (isSensitiveFile) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';

    // Log blocked probe attempt
    const incidentId = `SEC-PROBE-${Date.now().toString(36).toUpperCase()}`;
    logSecurityThreat({
      id: crypto.randomUUID(),
      incidentId,
      timestamp: new Date().toISOString(),
      endpoint: req.originalUrl,
      threatType: 'PATH_TRAVERSAL',
      severity: 'CRITICAL',
      actionTaken: 'BLOCKED_AND_MASKED',
      samplePayload: `Sensitive file probe blocked: ${req.path}`,
      ip,
    });

    res.status(403);
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({
        status: false,
        code: 403,
        message: 'Akses Ditolak: Berkas konfigurasi internal terproteksi oleh WAF Ibad Store.',
      });
    }
    return res.type('html').send(render403Html(req.path, ip));
  }
  next();
});

// Explicit routes to view professional error pages
app.get('/403', (req, res) => {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
  res.status(403).type('html').send(render403Html(req.path, ip));
});

app.get('/404', (req, res) => {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
  res.status(404).type('html').send(render404Html(req.path, ip));
});

app.get('/500', (req, res) => {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
  res.status(500).type('html').send(render500Html(req.path, ip));
});

// 404 Handler for undefined API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({
    status: false,
    code: 404,
    message: `Endpoint API '${req.path}' tidak ditemukan pada sistem Ibad Store.`,
  });
});

// ==========================================
// VITE CLIENT INTEGRATION
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          allowedHosts: true,
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e: any) {
      console.warn('[Vite Integration Warning]', e?.message || e);
    }
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Masking Middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
      return res.status(500).type('html').send(render500Html(req.path, ip, err?.message));
    }
    maskErrorResponse(res, err, 'Kesalahan Internal Sistem Terproteksi (Error Masked).');
  });

  if (!process.env.VERCEL) {
    const serverInstance = app.listen(PORT, BIND_HOST, () => {
      console.log(`[IBAD STORE] Server running securely on environment port:`);
      console.log(`  ➜ Local/Container:  http://${BIND_HOST}:${PORT}`);
      if (PUBLIC_IP) {
        console.log(`  ➜ Public/Internet:  http://${PUBLIC_IP}:${PORT}`);
      }
    });

    serverInstance.on('error', (err: any) => {
      if (err.code === 'EADDRNOTAVAIL' && BIND_HOST !== '0.0.0.0') {
        console.warn(`[IBAD STORE] Warning: Cannot bind directly to ${BIND_HOST}. Falling back to 0.0.0.0...`);
        app.listen(PORT, '0.0.0.0', () => {
          console.log(`[IBAD STORE] Server fallback running on:`);
          console.log(`  ➜ Local/Container:  http://0.0.0.0:${PORT}`);
          if (PUBLIC_IP) {
            console.log(`  ➜ Public/Internet:  http://${PUBLIC_IP}:${PORT}`);
          }
        });
      } else {
        console.error('[IBAD STORE] Server listen error on port ' + PORT + ':', err);
      }
    });

    // If environment port is custom (e.g. 1123), also listen on port 3000
    // so the AI Studio preview window and dev environment proxy work smoothly without interruption
    if (PORT !== 3000) {
      try {
        const previewServer = app.listen(3000, '0.0.0.0', () => {
          console.log(`[IBAD STORE] AI Studio preview bridge active on http://0.0.0.0:3000`);
        });
        previewServer.on('error', (err: any) => {
          if (err.code !== 'EADDRINUSE') {
            console.warn('[IBAD STORE] Preview bridge warning:', err.message);
          }
        });
      } catch (e) {
        // Ignored
      }
    }
  }
}

export { app };
startServer();
