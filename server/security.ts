import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

// Secret keys for cryptographic operations
const SYSTEM_SECRET = process.env.SESSION_SECRET || 'Ibad-Sayang-Elly-Abcdefghijklmnopqrstuvwxyz1234567890';
const ENCRYPTION_KEY = crypto.scryptSync(SYSTEM_SECRET, 'ibad_salt_vector', 32);

// In-memory rate limiting tracker
interface RateLimitRecord {
  count: number;
  firstRequest: number;
  blockedUntil?: number;
}
const rateLimitStore = new Map<string, RateLimitRecord>();

// Security Audit Log storage in-memory + accessible to admin
export interface ThreatLog {
  id: string;
  incidentId: string;
  timestamp: string;
  ip: string;
  endpoint: string;
  threatType: 'SQL_INJECTION' | 'XSS_ATTACK' | 'COMMAND_INJECTION' | 'PATH_TRAVERSAL' | 'PROTOTYPE_POLLUTION' | 'RATE_LIMIT_EXCEEDED' | 'TAMPERING';
  severity: 'HIGH' | 'CRITICAL' | 'MEDIUM';
  actionTaken: 'BLOCKED_AND_MASKED' | 'SANITIZED';
  samplePayload: string;
}

export const securityLogs: ThreatLog[] = [];

/**
 * Hash password with PBKDF2 (100,000 iterations, SHA-512) and salt
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

/**
 * Verify hashed password in constant time to prevent timing attacks
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const checkHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    const bufA = Buffer.from(hash, 'hex');
    const bufB = Buffer.from(checkHash, 'hex');
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Sign JWT-like secure session token with HMAC-SHA256
 */
export function createSecureToken(payload: object, expiresInMs = 7 * 24 * 60 * 60 * 1000): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + expiresInMs })).toString('base64url');
  const signature = crypto.createHmac('sha256', SYSTEM_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

/**
 * Verify HMAC signed token
 */
export function verifySecureToken<T = any>(token: string): T | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', SYSTEM_SECRET).update(`${header}.${body}`).digest('base64url');

    const bufA = Buffer.from(signature);
    const bufB = Buffer.from(expectedSig);
    if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload as T;
  } catch {
    return null;
  }
}

/**
 * AES-256-GCM Authenticated Encryption for sensitive storage
 */
export function encryptData(text: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * AES-256-GCM Decryption
 */
export function decryptData(cipherText: string): string | null {
  try {
    const [ivHex, authTagHex, encrypted] = cipherText.split(':');
    if (!ivHex || !authTagHex || !encrypted) return null;
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return null;
  }
}

/**
 * Comprehensive Injection Detection Patterns - tuned to avoid false positives on legitimate business data
 */
const SQL_PATTERNS = [
  /(\bUNION\s+(ALL\s+)?SELECT\b)/i,
  /(\b(DROP\s+TABLE|ALTER\s+TABLE|TRUNCATE\s+TABLE)\b)/i,
  /(\bINSERT\s+INTO\b.+VALUES\b)/i,
  /(\bSELECT\b.+FROM\b.+WHERE\b)/i,
  /(\bUPDATE\b.+SET\b.+WHERE\b)/i,
  /(\bDELETE\s+FROM\b.+WHERE\b)/i,
  /(--\s*$|;\s*DROP\s+TABLE|;\s*DELETE\s+FROM)/i,
  /('|\b)(OR|AND)\s+['"]?1['"]?\s*=\s*['"]?1/i,
  /\b0x[0-9a-fA-F]{8,}\b/,
];

const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript\s*:\s*(alert|document|window|eval|prompt)/i,
  /on(load|error|click|mouse|hover|change|submit|focus|blur)\s*=\s*["'][^"']+["']/i,
  /<iframe\b|<object\b|<embed\b|<svg\b[^>]*onload\s*=/i,
  /data:text\/html/i,
];

const CMD_INJECTION_PATTERNS = [
  /`[^`]+`/,
  /\$\([a-zA-Z0-9_\-\s]+\)/,
  /\$\{[a-zA-Z0-9_\-\s]+\}/,
  /(?:;|\|\||&&)\s*(?:rm\s+-rf|whoami|cat\s+\/etc\/passwd|bash\s+-i|nc\s+-e|powershell\s+-enc)/i,
];

const PATH_TRAVERSAL_PATTERNS = [
  /\.\.[\/\\]\.\.[\/\\]/,
  /\/etc\/passwd/i,
  /c:\\windows\\system32/i,
  /\x00/,
];

const PROTOTYPE_POLLUTION_KEYS = ['__proto__', 'constructor', 'prototype'];

/**
 * Scan arbitrary value for malicious injection signatures
 */
export function detectInjection(value: unknown, keyName?: string): { isThreat: boolean; type?: ThreatLog['threatType']; pattern?: string } {
  if (value === null || value === undefined) return { isThreat: false };

  // Skip deep payload scanning for base64 image avatars or URLs
  if (keyName && ['avatar', 'img_url', 'image', 'banner', 'qr_string'].includes(keyName)) {
    if (typeof value === 'string') {
      // Basic sanity check: ensure it's either an image data URL or http URL
      if (value.startsWith('data:image/') || value.startsWith('http://') || value.startsWith('https://')) {
        return { isThreat: false };
      }
    }
  }

  if (typeof value === 'string') {
    // If string is a valid base64 image data uri, allow it
    if (value.startsWith('data:image/')) {
      return { isThreat: false };
    }

    // Check SQL Injection
    for (const pat of SQL_PATTERNS) {
      if (pat.test(value)) return { isThreat: true, type: 'SQL_INJECTION', pattern: pat.source };
    }
    // Check XSS
    for (const pat of XSS_PATTERNS) {
      if (pat.test(value)) return { isThreat: true, type: 'XSS_ATTACK', pattern: pat.source };
    }
    // Check Command Injection
    for (const pat of CMD_INJECTION_PATTERNS) {
      if (pat.test(value)) return { isThreat: true, type: 'COMMAND_INJECTION', pattern: pat.source };
    }
    // Check Path Traversal
    for (const pat of PATH_TRAVERSAL_PATTERNS) {
      if (pat.test(value)) return { isThreat: true, type: 'PATH_TRAVERSAL', pattern: pat.source };
    }
  } else if (typeof value === 'object') {
    for (const key of Object.keys(value as object)) {
      if (PROTOTYPE_POLLUTION_KEYS.includes(key)) {
        return { isThreat: true, type: 'PROTOTYPE_POLLUTION', pattern: key };
      }
      const nested = detectInjection((value as any)[key], key);
      if (nested.isThreat) return nested;
    }
  }

  return { isThreat: false };
}

/**
 * Sanitize string against XSS & HTML escaping
 */
export function sanitizeString(str: string): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

/**
 * Mask error middleware to prevent leaking stack traces, database schema, or internal paths
 */
export function maskErrorResponse(res: Response, error: unknown, defaultMessage = 'Permintaan tidak dapat diproses (Security Protected)') {
  const incidentId = `SEC-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  
  // Log real technical error on secure server-side ONLY
  console.error(`[SECURITY INCIDENT ${incidentId}]:`, error);

  // Return clean, masked, generic response to public client with zero leakage
  return res.status(400).json({
    status: false,
    message: defaultMessage,
    incidentId,
    code: 400,
  });
}

/**
 * Express Middleware: WAF & Anti-Injection Guard
 */
export function wafMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();

  // Webhook endpoints are signed cryptographically by upstream gateway and should skip standard strict parameter scans
  if (req.path.startsWith('/api/webhook/')) {
    return next();
  }

  // 1. Rate Limiting Check (120 reqs/min per IP, burst protection)
  let record = rateLimitStore.get(ip);
  if (!record) {
    record = { count: 1, firstRequest: now };
    rateLimitStore.set(ip, record);
  } else {
    if (record.blockedUntil && now < record.blockedUntil) {
      return res.status(429).json({
        status: false,
        message: 'Aktivitas mencurigakan terdeteksi. Akses dibatasi sementara demi keamanan sistem.',
        code: 429,
      });
    }

    if (now - record.firstRequest < 60000) {
      record.count += 1;
      if (record.count > 150) {
        record.blockedUntil = now + 120000; // Block for 2 minutes
        const incidentId = `RATELIMIT-${Date.now().toString(36).toUpperCase()}`;
        securityLogs.unshift({
          id: crypto.randomUUID(),
          incidentId,
          timestamp: new Date().toISOString(),
          ip,
          endpoint: req.originalUrl,
          threatType: 'RATE_LIMIT_EXCEEDED',
          severity: 'HIGH',
          actionTaken: 'BLOCKED_AND_MASKED',
          samplePayload: `Requests count: ${record.count} in 60s`,
        });
        return res.status(429).json({
          status: false,
          message: 'Terlalu banyak permintaan. Silakan tunggu beberapa saat.',
          code: 429,
        });
      }
    } else {
      record.count = 1;
      record.firstRequest = now;
      record.blockedUntil = undefined;
    }
  }

  // 2. Inspection of Query, Params, and Body
  const targets = [
    { name: 'query', data: req.query },
    { name: 'params', data: req.params },
    { name: 'body', data: req.body },
  ];

  for (const target of targets) {
    if (target.data) {
      const scan = detectInjection(target.data);
      if (scan.isThreat) {
        const incidentId = `WAF-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
        
        // Record threat in security audit logs
        securityLogs.unshift({
          id: crypto.randomUUID(),
          incidentId,
          timestamp: new Date().toISOString(),
          ip,
          endpoint: req.originalUrl,
          threatType: scan.type || 'SQL_INJECTION',
          severity: 'CRITICAL',
          actionTaken: 'BLOCKED_AND_MASKED',
          samplePayload: JSON.stringify(target.data).slice(0, 150),
        });

        // Limit logs to last 200 events
        if (securityLogs.length > 200) securityLogs.pop();

        // Strictly hide error details from public response
        return res.status(403).json({
          status: false,
          message: 'Akses Ditolak: Parameter mengandung pola karakter yang tidak diizinkan oleh sistem keamanan.',
          incidentId,
          code: 403,
        });
      }
    }
  }

  // Set standard security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
}
