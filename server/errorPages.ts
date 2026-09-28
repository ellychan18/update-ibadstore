import crypto from 'node:crypto';

export interface ErrorPageOptions {
  statusCode: number;
  title: string;
  subtitle: string;
  description: string;
  incidentId?: string;
  path?: string;
  ip?: string;
  actionText?: string;
  actionUrl?: string;
}

export function renderErrorHtml(options: ErrorPageOptions): string {
  const {
    statusCode,
    title,
    subtitle,
    description,
    incidentId = `ERR-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    path = '/',
    ip = '127.0.0.1',
    actionText = 'Kembali ke Beranda',
    actionUrl = '/',
  } = options;

  const is403 = statusCode === 403;
  const is404 = statusCode === 404;
  const is500 = statusCode >= 500;

  const badgeColor = is403
    ? 'border-rose-500/30 text-rose-400 bg-rose-500/10'
    : is404
    ? 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10'
    : 'border-amber-500/30 text-amber-400 bg-amber-500/10';

  const glowColor = is403
    ? 'rgba(244, 63, 94, 0.15)'
    : is404
    ? 'rgba(99, 102, 241, 0.18)'
    : 'rgba(245, 158, 11, 0.15)';

  const iconSvg = is403
    ? `<svg class="w-16 h-16 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="9.5" y1="9" x2="14.5" y2="14"/><line x1="14.5" y1="9" x2="9.5" y2="14"/></svg>`
    : is404
    ? `<svg class="w-16 h-16 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`
    : `<svg class="w-16 h-16 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;

  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${statusCode} – ${title} | Ibad Store</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet" />
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background: radial-gradient(circle at 50% 10%, #0f172a 0%, #030712 100%);
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      overflow-x: hidden;
      position: relative;
    }
    .ambient-glow {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 600px;
      height: 600px;
      max-width: 90vw;
      max-height: 90vw;
      background: radial-gradient(circle, ${glowColor} 0%, rgba(3, 7, 18, 0) 70%);
      pointer-events: none;
      z-index: 0;
      filter: blur(40px);
    }
    .card {
      position: relative;
      z-index: 10;
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 28px;
      padding: 2.5rem 2rem;
      max-width: 520px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
    }
    .icon-wrapper {
      width: 88px;
      height: 88px;
      margin: 0 auto 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
    }
    .status-code {
      font-size: 4.5rem;
      font-weight: 900;
      line-height: 1;
      letter-spacing: -0.05em;
      background: linear-gradient(135deg, #ffffff 30%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      border: 1px solid;
      margin-bottom: 1.25rem;
    }
    .badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }
    h1 {
      font-size: 1.35rem;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 0.6rem;
      letter-spacing: -0.02em;
    }
    p {
      font-size: 0.9rem;
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 2rem;
    }
    .btn-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 2rem;
    }
    @media (min-width: 640px) {
      .btn-group {
        flex-direction: row;
      }
    }
    .btn-primary {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
      color: #ffffff;
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 700;
      padding: 0.85rem 1.25rem;
      border-radius: 14px;
      transition: all 0.2s ease;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(79, 70, 229, 0.45);
    }
    .btn-secondary {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #e2e8f0;
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 700;
      padding: 0.85rem 1.25rem;
      border-radius: 14px;
      transition: all 0.2s ease;
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
    }
    .diagnostic {
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 1.25rem;
      text-align: left;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.72rem;
      color: #64748b;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .diagnostic-row {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
    }
    .diagnostic-val {
      color: #94a3b8;
      font-weight: 600;
      word-break: break-all;
    }
    .brand-footer {
      margin-top: 1.5rem;
      font-size: 0.75rem;
      color: #475569;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="ambient-glow"></div>

  <div class="card">
    <div class="icon-wrapper">
      ${iconSvg}
    </div>

    <div class="status-code">${statusCode}</div>

    <div class="badge ${badgeColor}">
      <span class="badge-dot"></span>
      <span>${subtitle}</span>
    </div>

    <h1>${title}</h1>
    <p>${description}</p>

    <div class="btn-group">
      <a href="${actionUrl}" class="btn-primary">
        <svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span>${actionText}</span>
      </a>
      <a href="https://wa.me/6281515723808?text=Halo%20Admin%20Ibad%20Store%2C%20saya%20mengalami%20kendala%20kode%20${statusCode}%20di%20halaman%20${encodeURIComponent(path)}" target="_blank" rel="noreferrer" class="btn-secondary">
        <svg style="width:16px;height:16px;color:#10b981" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        <span>Bantuan CS Admin</span>
      </a>
    </div>

    <div class="diagnostic">
      <div class="diagnostic-row">
        <span>Incident ID:</span>
        <span class="diagnostic-val">${incidentId}</span>
      </div>
      <div class="diagnostic-row">
        <span>Requested Path:</span>
        <span class="diagnostic-val">${path}</span>
      </div>
      <div class="diagnostic-row">
        <span>Timestamp:</span>
        <span class="diagnostic-val">${new Date().toISOString()}</span>
      </div>
      <div class="diagnostic-row">
        <span>Client IP:</span>
        <span class="diagnostic-val">${ip}</span>
      </div>
    </div>
  </div>

  <div class="brand-footer">
    &copy; ${new Date().getFullYear()} Ibad Store Platform &bull; Security Shield &bull; All Rights Reserved.
  </div>
</body>
</html>`;
}

/**
 * Pre-configured 403 Forbidden Page
 */
export function render403Html(path = '/', ip = '127.0.0.1'): string {
  return renderErrorHtml({
    statusCode: 403,
    title: 'Akses Ditolak (Security Protected)',
    subtitle: '403 Forbidden Shield',
    description: 'Permintaan berkas atau direktori sensitif ini dilarang oleh sistem keamanan WAF Ibad Store demi integritas dan kerahasiaan platform.',
    path,
    ip,
    actionText: 'Kembali ke Katalog',
    actionUrl: '/',
  });
}

/**
 * Pre-configured 404 Not Found Page
 */
export function render404Html(path = '/', ip = '127.0.0.1'): string {
  return renderErrorHtml({
    statusCode: 404,
    title: 'Halaman Tidak Ditemukan',
    subtitle: '404 Page Not Found',
    description: 'Halaman atau tautan yang Anda tuju tidak tersedia atau telah dipindahkan. Silakan kembali ke katalog layanan resmi.',
    path,
    ip,
    actionText: 'Kembali ke Beranda',
    actionUrl: '/',
  });
}

/**
 * Pre-configured 500 Server Error Page
 */
export function render500Html(path = '/', ip = '127.0.0.1', message?: string): string {
  return renderErrorHtml({
    statusCode: 500,
    title: 'Kendala Sistem Internal',
    subtitle: '500 Server Error Masked',
    description: message || 'Sistem kami sedang mengalami pemulihan sementara. Seluruh data transaksi tetap aman dan terlindungi.',
    path,
    ip,
    actionText: 'Muat Ulang Halaman',
    actionUrl: '/',
  });
}
