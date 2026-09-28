import { MongoClient, Db, Collection } from 'mongodb';
import crypto from 'node:crypto';
import { hashPassword, verifyPassword } from './security.js';
import type { User, ProductItem, TransactionRecord, DepositOrder, SecurityAuditLog } from '../src/types.js';
import { getAllPriceLists, getAtlanticProfile } from './atlantic.js';

import { INITIAL_PRODUCTS, calculateSellPrice } from './initialProducts.js';

export { calculateSellPrice };

const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = process.env.MONGODB_DB_NAME || 'ibad_storr';

export interface StoredUser {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  passwordSalt: string;
  pinHash?: string;
  pinSalt?: string;
  balance: number;
  role: 'user' | 'admin';
  avatar?: string;
  isBlacklisted?: boolean;
  blacklistReason?: string;
  status?: 'active' | 'suspended' | 'blacklisted';
  createdAt: string;
  updatedAt?: string;
}

export interface StoredSetting {
  key: string;
  value: any;
}

let client: MongoClient | null = null;
let db: Db | null = null;
let isConnected = false;

// In-memory cache fallback pre-seeded with Master Admin ibad18
const { hash: initialAdminHash, salt: initialAdminSalt } = hashPassword('Nuribad1805');
const initialIbadAdmin: StoredUser = {
  id: 'usr_admin_ibad18',
  username: 'ibad18',
  name: 'Ibad Store Admin',
  email: 'mail.ibad05@gmail.com',
  phone: '081515723808',
  passwordHash: initialAdminHash,
  passwordSalt: initialAdminSalt,
  balance: 0,
  role: 'admin',
  status: 'active',
  createdAt: new Date().toISOString(),
};

let memUsers: StoredUser[] = [initialIbadAdmin];
let memTransactions: TransactionRecord[] = [];
let memDeposits: DepositOrder[] = [];
let memProducts: ProductItem[] = [...INITIAL_PRODUCTS];
let productsVersion = `v_${Date.now()}`;
let lastSyncTimestamp = 0;
let isSyncInProgress = false;

export function getProductsVersion(): string {
  return productsVersion;
}

export function getProductsCount(): number {
  return memProducts.length;
}

let memLogs: SecurityAuditLog[] = [];
let memSettings: Record<string, any> = {
  profitMarginMin: 1000,
  profitMarginMax: 1500,
  profitMarginDefault: 1250,
  minDeposit: 2000,
  maintenanceMode: false,
  resendEmailNotificationEnabled: true,
  resendApiKey: process.env.RESEND_API_KEY || 're_Kjq8o3bz_PTZr727sVbh1x9UHXs35iUd4',
  resendFromEmail: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
  verifiedAdminEmail: 'mail.ibad05@gmail.com',
};

export async function getSystemSettings(): Promise<Record<string, any>> {
  if (db) {
    try {
      const doc = await db.collection('system_settings').findOne({ _id: 'config' as any });
      if (doc && doc.settings) {
        return { ...memSettings, ...doc.settings };
      }
    } catch (e: any) {
      console.warn('[MongoDB getSystemSettings fallback]', e.message);
    }
  }
  return { ...memSettings };
}

export async function updateSystemSettings(newSettings: Record<string, any>): Promise<Record<string, any>> {
  memSettings = { ...memSettings, ...newSettings };
  if (db) {
    try {
      await db.collection('system_settings').updateOne(
        { _id: 'config' as any },
        { $set: { settings: memSettings, updatedAt: new Date().toISOString() } },
        { upsert: true }
      );
    } catch (e: any) {
      console.error('[MongoDB updateSystemSettings Error]', e.message);
    }
  }
  return { ...memSettings };
}

// Live check of Atlantic H2H Gateway balance (used exclusively by Admin Panel)
export async function syncAdminBalanceFromH2H(): Promise<number | null> {
  try {
    const profile = await getAtlanticProfile();
    const rawBalance =
      profile?.data?.balance ??
      profile?.data?.saldo ??
      profile?.balance ??
      profile?.saldo;

    if (rawBalance !== undefined && rawBalance !== null) {
      const h2hBalance = Number(rawBalance);
      if (!isNaN(h2hBalance) && h2hBalance >= 0) {
        return h2hBalance;
      }
    }
  } catch (err: any) {
    console.warn('[Atlantic H2H Balance Sync Notice]', err?.message);
  }
  return null;
}

export async function connectMongo(): Promise<Db | null> {
  if (db && isConnected) return db;
  if (!MONGODB_URI) {
    console.log('[MongoDB] Running in resilient memory mode (MONGODB_URI not configured).');
    return null;
  }
  try {
    console.log('[MongoDB] Connecting to cluster with resilient pooling...');
    client = new MongoClient(MONGODB_URI, {
      connectTimeoutMS: 3000,
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 15000,
      maxPoolSize: 10,
      minPoolSize: 0,
      maxIdleTimeMS: 60000,
      retryWrites: true,
      retryReads: true,
    });

    client.on('close', () => {
      isConnected = false;
    });
    client.on('error', () => {
      isConnected = false;
    });

    await client.connect();
    db = client.db(DB_NAME);
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to database: ${DB_NAME}`);

    // Drop problematic/legacy unique indexes (e.g., refNo_1) from previous schema versions
    try {
      const collectionsToCheck = ['transactions', 'deposits', 'transfers', 'products'];
      for (const colName of collectionsToCheck) {
        try {
          const colIndexes = await db.collection(colName).indexes();
          for (const idx of colIndexes) {
            if (
              idx.name &&
              (idx.name === 'refNo_1' ||
                (idx.key && 'refNo' in idx.key) ||
                (colName === 'transactions' && idx.unique && idx.name !== '_id_') ||
                (colName === 'deposits' && idx.unique && idx.name !== '_id_'))
            ) {
              console.log(`[MongoDB] Dropping problematic index ${idx.name} on ${colName} collection...`);
              await db.collection(colName).dropIndex(idx.name).catch(() => {});
            }
          }
        } catch (colErr) {
          // ignore if collection doesn't exist yet
        }
      }
    } catch (cleanErr: any) {
      console.warn('[MongoDB Index Cleanup Notice]', cleanErr.message);
    }

    // Create indexes safely
    try {
      await db.collection('users').createIndex({ username: 1 }, { unique: true }).catch(() => {});
      await db.collection('users').createIndex({ email: 1 }, { unique: true }).catch(() => {});
      await db.collection('transactions').createIndex({ reff_id: 1 }).catch(() => {});
      await db.collection('transactions').createIndex({ id: 1 }).catch(() => {});
      await db.collection('transactions').createIndex({ userId: 1 }).catch(() => {});
      await db.collection('transactions').createIndex({ created_at: -1 }).catch(() => {});
      await db.collection('deposits').createIndex({ reff_id: 1 }).catch(() => {});
      await db.collection('deposits').createIndex({ id: 1 }).catch(() => {});
      await db.collection('deposits').createIndex({ userId: 1 }).catch(() => {});
      await db.collection('products').createIndex({ code: 1 }).catch(() => {});
      await db.collection('products').createIndex({ category: 1 }).catch(() => {});
      await db.collection('security_logs').createIndex({ timestamp: -1 }).catch(() => {});
    } catch (idxErr) {
      // index exists, ignore
    }

    // Seed default Admin accounts and purge unwanted records
    await seedDefaultAdmins();

    // Fast Cache Check: Load existing products from MongoDB if available
    try {
      const existingProductCount = await db.collection('products').countDocuments();
      if (existingProductCount > 0) {
        console.log(`[Products Cache] Found ${existingProductCount} services in MongoDB. Loading directly into memory...`);
        const cachedProducts = await db.collection<ProductItem>('products').find({}).toArray();
        if (cachedProducts && cachedProducts.length > 0) {
          memProducts = cachedProducts;
          productsVersion = `v_${existingProductCount}_${cachedProducts.length}`;
          lastSyncTimestamp = Date.now();
          console.log(`[Products Cache] Loaded ${memProducts.length} services from MongoDB instantly without calling Atlantic API.`);
        }
      } else {
        console.log('[Products Cache] MongoDB products collection is empty. Performing initial sync from Atlantic H2H...');
        syncProductsFromGateway(true).catch((e) => console.warn('[Sync Products Notice]', e.message));
      }
    } catch (cacheErr: any) {
      console.warn('[Products Cache Notice]', cacheErr.message);
    }

    return db;
  } catch (err: any) {
    console.warn('[MongoDB Notice] Operating in resilient memory mode:', err.message);
    isConnected = false;
    return null;
  }
}

export function isMongoConnected(): boolean {
  return isConnected;
}

// Seed single Admin account in MongoDB
async function seedDefaultAdmins() {
  if (!db) return;
  try {
    const usersCol = db.collection<StoredUser>('users');

    // Seed/Update ibad18 as the ONLY administrator
    const { hash: ibad18Hash, salt: ibad18Salt } = hashPassword('Nuribad1805');
    const { hash: pinH, salt: pinS } = hashPassword('180500');
    const ibad18Check = await usersCol.findOne({ username: 'ibad18' });

    if (!ibad18Check) {
      const ibad18User: StoredUser = {
        id: 'usr_admin_ibad18',
        username: 'ibad18',
        name: 'Ibad Store Admin',
        email: 'mail.ibad05@gmail.com',
        phone: '081515723808',
        passwordHash: ibad18Hash,
        passwordSalt: ibad18Salt,
        pinHash: pinH,
        pinSalt: pinS,
        balance: 0,
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      await usersCol.insertOne(ibad18User);
      console.log('[MongoDB] Created Administrator account: ibad18');
    } else {
      // Ensure name, email, phone, role and credentials are fully up-to-date
      await usersCol.updateOne(
        { username: 'ibad18' },
        {
          $set: {
            name: 'Ibad Store Admin',
            email: 'mail.ibad05@gmail.com',
            phone: '081515723808',
            role: 'admin',
            passwordHash: ibad18Hash,
            passwordSalt: ibad18Salt,
            status: 'active',
          },
        }
      );
    }
  } catch (e: any) {
    console.error('[MongoDB Seed Error]', e.message);
  }
}

// Provider Image & Logo Resolver for rich visual experience
export function getProviderDefaultImage(provider: string = '', category: string = ''): string {
  const p = (provider || '').toLowerCase().trim();
  const c = (category || '').toLowerCase().trim();

  // Games
  if (p.includes('mobile legend') || p.includes('mlbb')) {
    return 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop&q=80';
  }
  if (p.includes('free fire') || p.includes('ff')) {
    return 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&auto=format&fit=crop&q=80';
  }
  if (p.includes('pubg')) {
    return 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=200&auto=format&fit=crop&q=80';
  }
  if (p.includes('genshin')) {
    return 'https://images.unsplash.com/photo-1563089145-599997674d42?w=200&auto=format&fit=crop&q=80';
  }
  if (p.includes('valorant')) {
    return 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&auto=format&fit=crop&q=80';
  }
  if (p.includes('honor of kings') || p.includes('hok')) {
    return 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=200&auto=format&fit=crop&q=80';
  }
  if (p.includes('roblox')) {
    return 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=200&auto=format&fit=crop&q=80';
  }
  if (p.includes('steam')) {
    return 'https://images.unsplash.com/photo-1612287233284-6014e7a89279?w=200&auto=format&fit=crop&q=80';
  }
  if (p.includes('point blank') || p.includes('garena') || p.includes('call of duty') || p.includes('codm')) {
    return 'https://images.unsplash.com/photo-1552824722-ddab1374e622?w=200&auto=format&fit=crop&q=80';
  }

  // PLN
  if (p.includes('pln') || c.includes('pln') || p.includes('listrik')) {
    return 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=200&auto=format&fit=crop&q=80';
  }

  // Pulsa & Data
  if (p.includes('telkomsel') || p.includes('by.u')) {
    return 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=200&auto=format&fit=crop&q=80';
  }
  if (p.includes('indosat') || p.includes('im3')) {
    return 'https://images.unsplash.com/photo-1534536281715-e28d76689b4d?w=200&auto=format&fit=crop&q=80';
  }
  if (p.includes('xl') || p.includes('axis')) {
    return 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=200&auto=format&fit=crop&q=80';
  }
  if (p.includes('tri') || p.includes('smartfren')) {
    return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200&auto=format&fit=crop&q=80';
  }

  // E-Money
  if (p.includes('dana') || p.includes('gopay') || p.includes('ovo') || p.includes('shopee') || p.includes('linkaja')) {
    return 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=200&auto=format&fit=crop&q=80';
  }

  // Streaming
  if (p.includes('netflix') || p.includes('spotify') || p.includes('vidio') || p.includes('youtube') || p.includes('disney')) {
    return 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=200&auto=format&fit=crop&q=80';
  }

  // Default Game/Service Visual
  if (c.includes('game')) {
    return 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=200&auto=format&fit=crop&q=80';
}

// Pure Sync Products from Atlantic H2H API with Cooldown & Anti-Spam
export async function syncProductsFromGateway(force: boolean = false): Promise<{ count: number; status: boolean; message: string; unchanged?: boolean }> {
  if (isSyncInProgress) {
    return { status: true, count: memProducts.length, unchanged: true, message: 'Sinkronisasi sedang berlangsung di background.' };
  }

  // Prevent spamming Atlantic API if data was synced recently (3 hours cooldown) unless forced
  if (!force && lastSyncTimestamp > 0 && Date.now() - lastSyncTimestamp < 3 * 3600 * 1000 && memProducts.length > 0) {
    return {
      status: true,
      count: memProducts.length,
      unchanged: true,
      message: `Katalog sudah up-to-date (${memProducts.length} layanan). Menggunakan cache lokal.`
    };
  }

  isSyncInProgress = true;
  try {
    const { prabayar, pascabayar } = await getAllPriceLists();
    const allRawItems: any[] = [];

    if (prabayar && prabayar.status && Array.isArray(prabayar.data)) {
      prabayar.data.forEach((item: any) => {
        allRawItems.push({ ...item, isPostpaid: false });
      });
    }

    if (pascabayar && pascabayar.status && Array.isArray(pascabayar.data)) {
      pascabayar.data.forEach((item: any) => {
        allRawItems.push({ ...item, isPostpaid: true });
      });
    }

    if (allRawItems.length > 0) {
      const liveList: ProductItem[] = allRawItems.map((item: any) => {
        const basePrice = Number(item.price || item.harga || item.admin || 0);
        const sellPrice = calculateSellPrice(basePrice);
        const cat = String(item.category || item.kategori || (item.isPostpaid ? 'Pascabayar' : 'Games')).trim();
        const prov = String(item.provider || item.operator || item.brand || item.type || cat).trim();
        const resolvedImg = item.img_url || item.icon || item.image || getProviderDefaultImage(prov, cat);

        return {
          code: String(item.code || '').trim(),
          name: String(item.name || item.layanan || item.code).trim(),
          category: cat,
          type: String(item.type || 'Umum').trim(),
          provider: prov,
          price: basePrice,
          sellPrice,
          note: item.note || item.catatan || '',
          status: item.status === 'available' || item.status === 'aktif' ? 'available' : 'gangguan',
          img_url: resolvedImg,
          admin: item.admin ? Number(item.admin) : undefined,
          komisi: item.komisi ? Number(item.komisi) : undefined,
          isPostpaid: !!item.isPostpaid || cat.toLowerCase().includes('pasca'),
        };
      });

      memProducts = liveList;
      productsVersion = `v_${Date.now()}_${liveList.length}`;
      lastSyncTimestamp = Date.now();

      if (db) {
        try {
          const prodCol = db.collection<ProductItem>('products');
          await prodCol.deleteMany({});
          // Insert in chunks if large
          const chunkSize = 1000;
          for (let i = 0; i < liveList.length; i += chunkSize) {
            await prodCol.insertMany(liveList.slice(i, i + chunkSize));
          }
        } catch (dbErr: any) {
          console.warn('[MongoDB Products Write Notice]', dbErr.message);
        }
      }

      console.log(`[Atlantic H2H] Pure API Synced: ${liveList.length} services loaded directly.`);
      return { status: true, count: liveList.length, message: `Berhasil sinkron ${liveList.length} data layanan murni dari Atlantic H2H API.` };
    }

    // If API returned without data, keep what exists in MongoDB
    if (db) {
      const existing = await db.collection<ProductItem>('products').find({}).toArray();
      if (existing.length > 0) {
        memProducts = existing;
        productsVersion = `v_${existing.length}_cached`;
        lastSyncTimestamp = Date.now();
        return { status: true, count: existing.length, message: `Menggunakan ${existing.length} layanan dari database MongoDB.` };
      }
    }

    return { status: false, count: 0, message: 'Gateway Atlantic API tidak mengembalikan data layanan.' };
  } catch (err: any) {
    console.error('[Sync Error]', err.message);
    return { status: false, count: 0, message: err.message };
  } finally {
    isSyncInProgress = false;
  }
}

// -------------------------------------------------------------
// USER CRUD OPERATIONS (MONGODB)
// -------------------------------------------------------------

export async function getUserByUsername(username: string): Promise<StoredUser | null> {
  const clean = username.toLowerCase().trim();
  if (db) {
    const user = await db.collection<StoredUser>('users').findOne({
      username: { $regex: new RegExp(`^${clean}$`, 'i') },
    });
    if (user) return user;
  }
  return memUsers.find((u) => u.username.toLowerCase() === clean) || null;
}

export async function getUserByEmail(email: string): Promise<StoredUser | null> {
  const clean = email.toLowerCase().trim();
  if (db) {
    const user = await db.collection<StoredUser>('users').findOne({
      email: { $regex: new RegExp(`^${clean}$`, 'i') },
    });
    if (user) return user;
  }
  return memUsers.find((u) => u.email.toLowerCase() === clean) || null;
}

export async function getUserByPhone(phone: string): Promise<StoredUser | null> {
  const raw = phone.trim();
  const digits = raw.replace(/\D/g, '');
  const localDigits = digits.startsWith('62') ? '0' + digits.slice(2) : digits;
  const intlDigits = digits.startsWith('0') ? '62' + digits.slice(1) : digits;

  if (db) {
    const user = await db.collection<StoredUser>('users').findOne({
      $or: [
        { phone: raw },
        { phone: localDigits },
        { phone: intlDigits },
        { phone: `+${intlDigits}` },
      ],
    });
    if (user) return user;
  }

  return (
    memUsers.find((u) => {
      const uDigits = (u.phone || '').replace(/\D/g, '');
      const uLocal = uDigits.startsWith('62') ? '0' + uDigits.slice(2) : uDigits;
      return (
        u.phone === raw ||
        uLocal === localDigits ||
        u.phone === localDigits ||
        u.phone === intlDigits
      );
    }) || null
  );
}

export async function getUserByUsernameOrEmail(identifier: string): Promise<StoredUser | null> {
  const clean = identifier.toLowerCase().trim();
  if (db) {
    const user = await db.collection<StoredUser>('users').findOne({
      $or: [
        { username: { $regex: new RegExp(`^${clean}$`, 'i') } },
        { email: { $regex: new RegExp(`^${clean}$`, 'i') } },
      ],
    });
    if (user) {
      return user;
    }
  }
  return memUsers.find((u) => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean) || null;
}

export async function getUserById(id: string): Promise<StoredUser | null> {
  if (db) {
    const user = await db.collection<StoredUser>('users').findOne({ id });
    if (user) {
      return user;
    }
  }
  return memUsers.find((u) => u.id === id) || null;
}

export function sanitizeUser(u: StoredUser): User {
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    email: u.email,
    phone: u.phone,
    balance: u.balance || 0,
    role: u.role || 'user',
    hasPin: !!u.pinHash,
    avatar: u.avatar || '',
    isBlacklisted: !!u.isBlacklisted,
    blacklistReason: u.blacklistReason || '',
    status: u.isBlacklisted ? 'blacklisted' : (u.status || 'active'),
    createdAt: u.createdAt || new Date().toISOString(),
  };
}

export async function updateUserProfile(
  userId: string,
  updateData: { name?: string; phone?: string; avatar?: string }
): Promise<User | null> {
  const fieldsToUpdate: any = { updatedAt: new Date().toISOString() };
  if (updateData.name !== undefined) fieldsToUpdate.name = updateData.name.trim();
  if (updateData.phone !== undefined) fieldsToUpdate.phone = updateData.phone.trim();
  if (updateData.avatar !== undefined) fieldsToUpdate.avatar = updateData.avatar.trim();

  if (db) {
    const res = await db.collection<StoredUser>('users').findOneAndUpdate(
      { id: userId },
      { $set: fieldsToUpdate },
      { returnDocument: 'after' }
    );
    if (res) return sanitizeUser(res);
  }

  const memU = memUsers.find((u) => u.id === userId);
  if (memU) {
    if (updateData.name !== undefined) memU.name = updateData.name.trim();
    if (updateData.phone !== undefined) memU.phone = updateData.phone.trim();
    if (updateData.avatar !== undefined) memU.avatar = updateData.avatar.trim();
    memU.updatedAt = fieldsToUpdate.updatedAt;
    return sanitizeUser(memU);
  }

  return null;
}

export async function createUser(userData: {
  username: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: 'user' | 'admin';
}): Promise<User> {
  const { hash, salt } = hashPassword(userData.password);
  const newUser: StoredUser = {
    id: `usr_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`,
    username: userData.username.toLowerCase().trim(),
    name: userData.name.trim(),
    email: userData.email.toLowerCase().trim(),
    phone: userData.phone.trim(),
    passwordHash: hash,
    passwordSalt: salt,
    balance: 0,
    role: userData.role || 'user',
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  if (db) {
    await db.collection<StoredUser>('users').insertOne(newUser);
  }
  memUsers.push(newUser);
  return sanitizeUser(newUser);
}

export async function updateUserBalance(userId: string, deltaAmount: number): Promise<boolean> {
  if (db) {
    const res = await db.collection<StoredUser>('users').findOneAndUpdate(
      { id: userId },
      { $inc: { balance: deltaAmount }, $set: { updatedAt: new Date().toISOString() } },
      { returnDocument: 'after' }
    );
    return !!res;
  }
  const memU = memUsers.find((u) => u.id === userId);
  if (memU) {
    memU.balance = (memU.balance || 0) + deltaAmount;
    return true;
  }
  return false;
}

export async function setUserPin(userId: string, pin: string): Promise<boolean> {
  const { hash, salt } = hashPassword(pin);
  if (db) {
    const res = await db.collection<StoredUser>('users').updateOne(
      { id: userId },
      { $set: { pinHash: hash, pinSalt: salt, updatedAt: new Date().toISOString() } }
    );
    return res.modifiedCount > 0;
  }
  const memU = memUsers.find((u) => u.id === userId);
  if (memU) {
    memU.pinHash = hash;
    memU.pinSalt = salt;
    return true;
  }
  return false;
}

export async function verifyUserPin(userId: string, pin: string): Promise<boolean> {
  const user = await getUserById(userId);
  if (!user || !user.pinHash || !user.pinSalt) return false;
  return verifyPassword(pin, user.pinHash, user.pinSalt);
}

// -------------------------------------------------------------
// TRANSACTIONS CRUD OPERATIONS (MONGODB)
// -------------------------------------------------------------

export async function saveTransaction(tx: TransactionRecord): Promise<void> {
  const doc: any = {
    ...tx,
    refNo: tx.reff_id || tx.id || `TX-${Date.now()}`,
  };

  if (db) {
    try {
      await db.collection('transactions').updateOne(
        { $or: [{ id: tx.id }, { reff_id: tx.reff_id }] },
        { $set: doc },
        { upsert: true }
      );
    } catch (err: any) {
      console.error('[MongoDB saveTransaction Error]', err.message);
    }
  }
  const existingIdx = memTransactions.findIndex((t) => t.reff_id === tx.reff_id || t.id === tx.id);
  if (existingIdx >= 0) {
    memTransactions[existingIdx] = tx;
  } else {
    memTransactions.unshift(tx);
    if (memTransactions.length > 500) memTransactions.pop();
  }
}

export async function updateTransactionPayment(
  reffIdOrId: string,
  payment_status: TransactionRecord['payment_status'],
  status?: TransactionRecord['status'],
  sn?: string
): Promise<void> {
  const updatePayload: any = {
    payment_status,
    updated_at: new Date().toISOString(),
  };
  if (status) updatePayload.status = status;
  if (sn) updatePayload.sn = sn;

  if (db) {
    await db.collection<TransactionRecord>('transactions').updateOne(
      { $or: [{ reff_id: reffIdOrId }, { id: reffIdOrId }] },
      { $set: updatePayload }
    );
  }
  const tx = memTransactions.find((t) => t.reff_id === reffIdOrId || t.id === reffIdOrId);
  if (tx) {
    tx.payment_status = payment_status;
    if (status) tx.status = status;
    if (sn) tx.sn = sn;
    tx.updated_at = new Date().toISOString();
  }
}

export async function getTransactionByReffOrId(query: string): Promise<TransactionRecord | null> {
  const clean = query.trim().toUpperCase();
  if (db) {
    const tx = await db.collection<TransactionRecord>('transactions').findOne({
      $or: [
        { id: { $regex: new RegExp(`^${clean}$`, 'i') } },
        { reff_id: { $regex: new RegExp(`^${clean}$`, 'i') } },
        { target: query.trim() },
      ],
    });
    if (tx) return tx;
  }
  return (
    memTransactions.find(
      (t) =>
        t.id.toUpperCase() === clean ||
        t.reff_id.toUpperCase() === clean ||
        t.target === query.trim()
    ) || null
  );
}

export async function getUserTransactions(userId: string): Promise<TransactionRecord[]> {
  if (db) {
    return await db
      .collection<TransactionRecord>('transactions')
      .find({ userId })
      .sort({ created_at: -1 })
      .limit(100)
      .toArray();
  }
  return memTransactions.filter((t) => t.userId === userId);
}

export async function updateTransactionStatus(
  reffIdOrId: string,
  status: TransactionRecord['status'],
  sn?: string
): Promise<void> {
  if (db) {
    const updatePayload: any = { status, updated_at: new Date().toISOString() };
    if (sn) updatePayload.sn = sn;
    await db.collection<TransactionRecord>('transactions').updateOne(
      { $or: [{ reff_id: reffIdOrId }, { id: reffIdOrId }] },
      { $set: updatePayload }
    );
  }
  const tx = memTransactions.find((t) => t.reff_id === reffIdOrId || t.id === reffIdOrId);
  if (tx) {
    tx.status = status;
    if (sn) tx.sn = sn;
    tx.updated_at = new Date().toISOString();
  }
}

// -------------------------------------------------------------
// DEPOSIT CRUD OPERATIONS (MONGODB)
// -------------------------------------------------------------

export async function saveDeposit(dep: DepositOrder): Promise<void> {
  const doc: any = {
    ...dep,
    refNo: dep.reff_id || dep.id || `DEP-${Date.now()}`,
  };

  if (db) {
    try {
      await db.collection<DepositOrder>('deposits').insertOne(doc);
    } catch (err: any) {
      if (err && (err.code === 11000 || String(err.message).includes('E11000') || String(err.message).includes('refNo_1'))) {
        console.warn('[MongoDB] E11000 duplicate index error in saveDeposit. Resolving index & retrying...', err.message);
        try {
          await db.collection('deposits').dropIndex('refNo_1').catch(() => {});
          await db.collection<DepositOrder>('deposits').updateOne(
            { $or: [{ id: dep.id }, { reff_id: dep.reff_id }] },
            { $set: doc },
            { upsert: true }
          );
        } catch (retryErr: any) {
          console.error('[MongoDB saveDeposit Retry Failed]', retryErr.message);
        }
      } else {
        console.error('[MongoDB saveDeposit Error]', err.message);
      }
    }
  }
  memDeposits.unshift(dep);
  if (memDeposits.length > 300) memDeposits.pop();
}

export async function getDepositById(id: string): Promise<DepositOrder | null> {
  if (!id) return null;
  if (db) {
    const dep = await db.collection<DepositOrder>('deposits').findOne({
      $or: [
        { id },
        { reff_id: id },
        { btz_transaction_id: id },
        { 'raw.data.transactionId': id },
        { 'raw.data.orderId': id },
      ],
    });
    if (dep) return dep;
  }
  return (
    memDeposits.find(
      (d) =>
        d.id === id ||
        d.reff_id === id ||
        (d as any).btz_transaction_id === id ||
        (d as any).raw?.data?.transactionId === id ||
        (d as any).raw?.data?.orderId === id
    ) || null
  );
}

export async function getUserDeposits(userId: string): Promise<DepositOrder[]> {
  if (db) {
    return await db
      .collection<DepositOrder>('deposits')
      .find({ userId })
      .sort({ created_at: -1 })
      .limit(50)
      .toArray();
  }
  return memDeposits.filter((d) => d.userId === userId);
}

export async function getPendingUserDeposits(userId: string): Promise<DepositOrder[]> {
  if (db) {
    return await db
      .collection<DepositOrder>('deposits')
      .find({
        userId,
        status: 'pending',
      })
      .sort({ created_at: -1 })
      .limit(10)
      .toArray();
  }
  return memDeposits.filter((d) => d.userId === userId && d.status === 'pending');
}

export async function updateDepositStatus(id: string, status: DepositOrder['status']): Promise<void> {
  if (!id) return;
  if (db) {
    const dep = await db.collection<DepositOrder>('deposits').findOne({
      $or: [
        { id },
        { reff_id: id },
        { btz_transaction_id: id },
        { 'raw.data.transactionId': id },
        { 'raw.data.orderId': id },
      ],
    });
    if (dep) {
      const prevStatus = dep.status;
      await db.collection<DepositOrder>('deposits').updateOne(
        { _id: (dep as any)._id },
        { $set: { status, updatedAt: new Date().toISOString() } }
      );
      if (status === 'success' && prevStatus !== 'success' && dep.userId) {
        await updateUserBalance(dep.userId, dep.get_balance);
        console.log(`[DB Balance Credit] User ${dep.userId} credited Rp ${dep.get_balance} from deposit ${dep.id}`);
      }
    }
  }

  const memDep = memDeposits.find(
    (d) =>
      d.id === id ||
      d.reff_id === id ||
      (d as any).btz_transaction_id === id ||
      (d as any).raw?.data?.transactionId === id ||
      (d as any).raw?.data?.orderId === id
  );
  if (memDep) {
    const prevMemStatus = memDep.status;
    memDep.status = status;
    if (status === 'success' && prevMemStatus !== 'success' && memDep.userId) {
      updateUserBalance(memDep.userId, memDep.get_balance);
    }
  }
}

// -------------------------------------------------------------
// PRODUCTS CATALOG (MONGODB / LIVE)
// -------------------------------------------------------------

export async function getProducts(): Promise<ProductItem[]> {
  // Ultra-fast in-memory retrieval (0ms latency for 11.000+ items)
  if (memProducts && memProducts.length > 0) {
    return memProducts;
  }

  let list: ProductItem[] = [];
  if (db && isConnected) {
    try {
      const dbList = await db.collection<ProductItem>('products').find({}).maxTimeMS(3000).toArray();
      if (dbList && dbList.length > 0) {
        list = dbList;
        memProducts = dbList;
      }
    } catch (e: any) {
      console.warn('[MongoDB getProducts fallback]', e.message);
    }
  }

  if (list.length === 0 && memProducts.length > 0) {
    list = memProducts;
  }

  if (list.length === 0) {
    // If empty, auto-sync immediately from Atlantic API
    await syncProductsFromGateway(true);
    list = memProducts;
  }

  return list;
}

export async function updateProductsList(newProducts: ProductItem[]): Promise<void> {
  memProducts = newProducts;
  if (db && newProducts.length > 0) {
    const col = db.collection<ProductItem>('products');
    await col.deleteMany({});
    await col.insertMany(newProducts);
  }
}

// -------------------------------------------------------------
// SECURITY LOGS (MONGODB)
// -------------------------------------------------------------

export async function logSecurityThreat(log: SecurityAuditLog): Promise<void> {
  memLogs.unshift(log);
  if (memLogs.length > 200) memLogs.pop();
  if (db) {
    try {
      await db.collection('security_logs').insertOne(log);
    } catch (e) {
      // safe fallback
    }
  }
}

export async function getSecurityLogs(limit: number = 50): Promise<SecurityAuditLog[]> {
  if (db) {
    try {
      return await db
        .collection<SecurityAuditLog>('security_logs')
        .find({})
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
    } catch (e) {
      // fallback
    }
  }
  return memLogs.slice(0, limit);
}

// -------------------------------------------------------------
// ADMIN MASTER CONTROLS & ACTIVITY MONITORING
// -------------------------------------------------------------

export async function getAllUsersAdmin(): Promise<User[]> {
  if (db) {
    const users = await db.collection<StoredUser>('users').find({}).sort({ createdAt: -1 }).toArray();
    return users.map((u) => sanitizeUser(u));
  }
  return memUsers.map(sanitizeUser);
}

export async function getAllTransactionsAdmin(filter?: { status?: string; limit?: number }): Promise<TransactionRecord[]> {
  const lim = filter?.limit || 100;
  const q: any = {};
  if (filter?.status && filter.status !== 'all') {
    q.status = filter.status;
  }
  if (db) {
    return await db.collection<TransactionRecord>('transactions').find(q).sort({ created_at: -1 }).limit(lim).toArray();
  }
  return memTransactions.filter((t) => (!filter?.status || filter.status === 'all' ? true : t.status === filter.status)).slice(0, lim);
}

export async function clearAllTransactionsAdmin(): Promise<boolean> {
  if (db) {
    await db.collection('transactions').deleteMany({});
  }
  memTransactions = [];
  return true;
}

export async function adminDeleteTransaction(id: string): Promise<boolean> {
  if (db) {
    await db.collection('transactions').deleteOne({ $or: [{ reff_id: id }, { id: id }] });
  }
  memTransactions = memTransactions.filter((t) => t.reff_id !== id && t.id !== id);
  return true;
}

export async function adminDeleteDeposit(id: string): Promise<boolean> {
  if (db) {
    await db.collection('deposits').deleteOne({ $or: [{ id: id }, { reff_id: id }] });
  }
  memDeposits = memDeposits.filter((d) => d.id !== id && d.reff_id !== id);
  return true;
}

export async function adminClearAllDeposits(): Promise<boolean> {
  if (db) {
    await db.collection('deposits').deleteMany({});
  }
  memDeposits = [];
  return true;
}

export async function adminDeleteUser(userId: string): Promise<boolean> {
  if (db) {
    const user = await db.collection<StoredUser>('users').findOne({ id: userId });
    if (user && (user.username === 'ibad18' || user.email === 'ibadgusion@gmail.com')) {
      throw new Error('Master Administrator (ibad18) tidak dapat dihapus.');
    }
    const res = await db.collection('users').deleteOne({ id: userId });
    memUsers = memUsers.filter((u) => u.id !== userId && u.username !== 'ibad18');
    return res.deletedCount > 0;
  }
  const u = memUsers.find((m) => m.id === userId);
  if (u && (u.username === 'ibad18' || u.email === 'ibadgusion@gmail.com')) {
    throw new Error('Master Administrator (ibad18) tidak dapat dihapus.');
  }
  memUsers = memUsers.filter((m) => m.id !== userId);
  return true;
}

export async function adminToggleBlacklistUser(
  userId: string,
  isBlacklisted: boolean,
  reason: string = ''
): Promise<boolean> {
  if (db) {
    const user = await db.collection<StoredUser>('users').findOne({ id: userId });
    if (user && (user.username === 'ibad18' || user.email === 'ibadgusion@gmail.com')) {
      throw new Error('Master Administrator (ibad18) tidak dapat di-blacklist.');
    }
    const status: 'blacklisted' | 'active' = isBlacklisted ? 'blacklisted' : 'active';
    await db.collection<StoredUser>('users').updateOne(
      { id: userId },
      {
        $set: {
          isBlacklisted,
          blacklistReason: isBlacklisted ? reason : '',
          status,
          updatedAt: new Date().toISOString(),
        },
      }
    );
    const memU = memUsers.find((m) => m.id === userId);
    if (memU) {
      memU.isBlacklisted = isBlacklisted;
      memU.blacklistReason = isBlacklisted ? reason : '';
      memU.status = status;
    }
    return true;
  }
  const u = memUsers.find((m) => m.id === userId);
  if (u) {
    if (u.username === 'ibad18' || u.email === 'ibadgusion@gmail.com') {
      throw new Error('Master Administrator (ibad18) tidak dapat di-blacklist.');
    }
    u.isBlacklisted = isBlacklisted;
    u.blacklistReason = isBlacklisted ? reason : '';
    u.status = isBlacklisted ? 'blacklisted' : 'active';
    return true;
  }
  return false;
}

export async function getAllDepositsAdmin(): Promise<DepositOrder[]> {
  if (db) {
    return await db.collection<DepositOrder>('deposits').find({}).sort({ created_at: -1 }).limit(100).toArray();
  }
  return memDeposits.slice(0, 100);
}

export async function adminUpdateUserBalance(userId: string, newBalance: number): Promise<boolean> {
  if (db) {
    const res = await db.collection<StoredUser>('users').updateOne(
      { id: userId },
      { $set: { balance: newBalance, updatedAt: new Date().toISOString() } }
    );
    return res.modifiedCount > 0;
  }
  const u = memUsers.find((m) => m.id === userId);
  if (u) {
    u.balance = newBalance;
    return true;
  }
  return false;
}

export async function adminSetUserRole(userId: string, role: 'user' | 'admin'): Promise<boolean> {
  if (db) {
    const res = await db.collection<StoredUser>('users').updateOne(
      { id: userId },
      { $set: { role, updatedAt: new Date().toISOString() } }
    );
    return res.modifiedCount > 0;
  }
  const u = memUsers.find((m) => m.id === userId);
  if (u) {
    u.role = role;
    return true;
  }
  return false;
}

export async function getSystemMetrics() {
  let totalUsers = 0;
  let totalTransactions = 0;
  let totalDeposits = 0;
  let totalTurnover = 0;
  let totalSuccessTx = 0;

  if (db) {
    totalUsers = await db.collection('users').countDocuments();
    totalTransactions = await db.collection('transactions').countDocuments();
    totalDeposits = await db.collection('deposits').countDocuments();
    
    const txAgg = await db.collection('transactions').aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$price' }, count: { $sum: 1 } } }
    ]).toArray();

    if (txAgg.length > 0) {
      totalTurnover = txAgg[0].total || 0;
      totalSuccessTx = txAgg[0].count || 0;
    }
  } else {
    totalUsers = memUsers.length;
    totalTransactions = memTransactions.length;
    totalDeposits = memDeposits.length;
    const successList = memTransactions.filter((t) => t.status === 'success');
    totalTurnover = successList.reduce((acc, t) => acc + (t.price || 0), 0);
    totalSuccessTx = successList.length;
  }

  return {
    totalUsers,
    totalTransactions,
    totalDeposits,
    totalTurnover,
    totalSuccessTx,
    dbStatus: isConnected ? 'MONGODB_CONNECTED_HEALTHY' : 'CONNECTING_OR_FALLBACK',
    dbName: DB_NAME,
    cachedProducts: memProducts.length,
    timestamp: new Date().toISOString(),
  };
}

export interface StoredTransfer {
  id: string;
  reff_id: string;
  nama: string;
  nomor_tujuan: string;
  nominal: number;
  fee: number;
  total: number;
  status: 'pending' | 'success' | 'failed' | string;
  bank_code: string;
  detail?: {
    email?: string;
    phone?: string;
    note?: string;
  };
  created_at: string;
}

let memTransfers: StoredTransfer[] = [];

export async function saveTransferRecord(tx: StoredTransfer): Promise<void> {
  if (db) {
    await db.collection<StoredTransfer>('transfers').updateOne(
      { id: tx.id },
      { $set: tx },
      { upsert: true }
    );
  }
  const idx = memTransfers.findIndex((t) => t.id === tx.id || t.reff_id === tx.reff_id);
  if (idx >= 0) {
    memTransfers[idx] = tx;
  } else {
    memTransfers.unshift(tx);
  }
}

export async function getTransferRecordByIdOrRef(query: string): Promise<StoredTransfer | null> {
  if (db) {
    const res = await db.collection<StoredTransfer>('transfers').findOne({
      $or: [{ id: query }, { reff_id: query }, { nomor_tujuan: query }],
    });
    if (res) return res;
  }
  return memTransfers.find((t) => t.id === query || t.reff_id === query || t.nomor_tujuan === query) || null;
}

export async function getAllTransferRecords(): Promise<StoredTransfer[]> {
  if (db) {
    return await db.collection<StoredTransfer>('transfers').find().sort({ created_at: -1 }).toArray();
  }
  return [...memTransfers];
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

export async function getTopLeaderboard(period: 'all' | 'monthly' | 'weekly' = 'all'): Promise<LeaderboardEntry[]> {
  // Aggregate real orders if available
  const userSpendMap = new Map<
    string,
    { userId?: string; name: string; username: string; avatar: string; total: number; count: number; service: string }
  >();

  // Fetch all registered users for quick avatar/profile lookup
  let allUsers: StoredUser[] = [];
  if (db) {
    try {
      allUsers = await db.collection<StoredUser>('users').find({}).toArray();
    } catch {
      allUsers = [...memUsers];
    }
  } else {
    allUsers = [...memUsers];
  }

  const userById = new Map<string, StoredUser>();
  const userByEmail = new Map<string, StoredUser>();
  const userByUsername = new Map<string, StoredUser>();

  for (const u of allUsers) {
    if (u.id) userById.set(u.id, u);
    if (u.email) userByEmail.set(u.email.toLowerCase().trim(), u);
    if (u.username) userByUsername.set(u.username.toLowerCase().trim(), u);
  }

  let txList: TransactionRecord[] = [];
  if (db) {
    try {
      txList = await db.collection<TransactionRecord>('transactions').find({
        status: { $in: ['success', 'pending'] },
      }).toArray();
    } catch {
      txList = memTransactions.filter((t) => t.status === 'success' || t.status === 'pending');
    }
  } else {
    txList = memTransactions.filter((t) => t.status === 'success' || t.status === 'pending');
  }

  for (const tx of txList) {
    const rawEmail = (tx.userEmail || '').toLowerCase().trim();
    const rawName = (tx.customer_name || '').toLowerCase().trim();
    
    // Find matching registered user profile to get exact updated avatar and name
    const matchedUser =
      (tx.userId && userById.get(tx.userId)) ||
      (rawEmail && userByEmail.get(rawEmail)) ||
      (rawName && userByUsername.get(rawName)) ||
      null;

    const key = matchedUser
      ? matchedUser.id
      : tx.userId || tx.customer_name || tx.userEmail || tx.target || 'user_guest';

    const resolvedName = matchedUser?.name || tx.customer_name || 'Pelanggan Setia';
    const resolvedUsername =
      matchedUser?.username ||
      (tx.userEmail ? tx.userEmail.split('@')[0] : tx.customer_name || 'member')
        .toLowerCase()
        .replace(/\s+/g, '_');
    const resolvedAvatar =
      matchedUser?.avatar && matchedUser.avatar.trim() !== ''
        ? matchedUser.avatar
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(resolvedName)}&background=4f46e5&color=fff&bold=true`;

    const current = userSpendMap.get(key) || {
      userId: matchedUser?.id || tx.userId,
      name: resolvedName,
      username: resolvedUsername,
      avatar: resolvedAvatar,
      total: 0,
      count: 0,
      service: tx.layanan || 'Top Up Game',
    };

    current.total += Number(tx.price || 0);
    current.count += 1;
    if (tx.layanan) current.service = tx.layanan;
    if (matchedUser?.avatar && matchedUser.avatar.trim() !== '') {
      current.avatar = matchedUser.avatar;
    }
    if (matchedUser?.name) {
      current.name = matchedUser.name;
    }
    if (matchedUser?.username) {
      current.username = matchedUser.username;
    }

    userSpendMap.set(key, current);
  }

  const sorted = Array.from(userSpendMap.values()).sort((a, b) => b.total - a.total);

  const badges = [
    '👑 SULTAN UTAMA',
    '💎 MYTHIC SPENDER',
    '🔥 LEGEND BUYER',
    '⚡ PRO SPENDER',
    '🎮 TOP GAMER',
    '🌟 VIP MEMBER',
    '✨ FAST BUYER',
    '🏅 LOYAL MEMBER',
    '🎯 ELITE BUYER',
    '🚀 SUPER USER',
  ];

  const maskUser = (u: string) => {
    if (!u || u.length <= 3) return (u || 'user') + '***';
    return u.slice(0, 3) + '***' + u.slice(-1);
  };

  return sorted.slice(0, 10).map((item, idx) => ({
    rank: idx + 1,
    name: item.name,
    maskedUsername: maskUser(item.username),
    totalSpent: item.total,
    totalOrders: item.count,
    badge: badges[idx] || '⭐ MEMBER VIP',
    avatar: item.avatar,
    favoriteService: item.service,
  }));
}

// Auto-boot MongoDB connection
connectMongo().catch((e) => console.error('[Mongo Boot Catch]', e));
