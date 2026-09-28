import { getSystemSettings } from './db.js';

const DEFAULT_RESEND_API_KEY =
  process.env.RESEND_API_KEY || 're_Kjq8o3bz_PTZr727sVbh1x9UHXs35iUd4';
const VERIFIED_SANDBOX_OWNER = 'mail.ibad05@gmail.com';

export interface RegistrationEmailParams {
  to: string;
  name: string;
  username: string;
  phone?: string;
  loginUrl?: string;
}

/**
 * Direct HTTP caller for Resend REST API.
 * Using standard fetch prevents unsolicited SDK console.error logs
 * and allows robust error handling for Resend sandbox constraints.
 */
async function callResendApi(payload: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; data?: any; error?: string; statusCode?: number }> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${payload.apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: payload.from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    });

    const body: any = await res.json().catch(() => ({}));

    if (!res.ok || body.error) {
      const errMsg =
        body.error?.message ||
        body.message ||
        `Resend API error with HTTP status ${res.status}`;
      return { success: false, error: errMsg, statusCode: res.status };
    }

    return { success: true, data: body, statusCode: res.status };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Kendala jaringan saat menghubungi gateway Resend.',
    };
  }
}

/**
 * Send a sleek, professional registration welcome email via Resend
 */
export async function sendRegistrationSuccessEmail(
  params: RegistrationEmailParams
): Promise<{ success: boolean; data?: any; error?: string; skipped?: boolean; isForwarded?: boolean }> {
  try {
    const settings = await getSystemSettings();
    const isEnabled = settings.resendEmailNotificationEnabled !== false;

    if (!isEnabled) {
      return { success: true, skipped: true };
    }

    const apiKey = (settings.resendApiKey || DEFAULT_RESEND_API_KEY || '').trim();
    if (!apiKey) {
      return { success: false, error: 'Resend API Key tidak ditemukan.' };
    }

    const rawFrom = (settings.resendFromEmail || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev').trim();
    const isSandbox = rawFrom.includes('@resend.dev');
    const senderAddress = rawFrom.includes('<') ? rawFrom : `Ibad Store <${rawFrom}>`;

    const recipient = (params.to || '').trim();
    if (!recipient) {
      return { success: false, error: 'Alamat email tujuan kosong.' };
    }

    // Resend sandbox policy check:
    // Testing domain (onboarding@resend.dev) strictly allows sending only to VERIFIED_SANDBOX_OWNER.
    const isDirectAllowed = !isSandbox || recipient.toLowerCase() === VERIFIED_SANDBOX_OWNER.toLowerCase();
    const finalTarget = isDirectAllowed ? recipient : VERIFIED_SANDBOX_OWNER;
    const isForwarded = !isDirectAllowed;

    const dateFormatted = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    });

    const sandboxNoticeHtml = isForwarded
      ? `
        <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 12px; padding: 14px 16px; margin-bottom: 24px;">
          <div style="font-weight: 800; color: #b45309; font-size: 13px; margin-bottom: 4px;">
            ℹ️ Notifikasi Onboarding Member Baru (Sandbox Mode)
          </div>
          <div style="font-size: 12px; color: #78350f; line-height: 1.5;">
            Pengguna baru <strong>${params.name || params.username}</strong> mendaftar dengan email: <code style="background: #fef3c7; padding: 2px 5px; border-radius: 4px; font-weight: bold;">${recipient}</code>.
            Email konfirmasi ini diteruskan ke akun admin terverifikasi karena domain pengirim masih menggunakan domain uji coba <code>${rawFrom}</code>.
            <br/>Untuk mengirim langsung ke email pengguna, daftarkan domain kustom Anda di <a href="https://resend.com/domains" style="color: #4f46e5; font-weight: bold; text-decoration: underline;">resend.com/domains</a>.
          </div>
        </div>
      `
      : '';

    const emailHtml = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Selamat Datang di Ibad Store</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #334155;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #0f172a;
      padding: 36px 12px;
      box-sizing: border-box;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #2563eb 100%);
      padding: 36px 32px 32px;
      text-align: center;
      color: #ffffff;
    }
    .brand-title {
      margin: 0;
      font-size: 26px;
      font-weight: 900;
      letter-spacing: -0.5px;
      text-transform: uppercase;
    }
    .brand-sub {
      margin: 6px 0 0;
      font-size: 13px;
      color: #e0e7ff;
      letter-spacing: 0.5px;
    }
    .badge {
      display: inline-block;
      margin-top: 16px;
      padding: 6px 16px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    .content {
      padding: 32px;
      background-color: #ffffff;
    }
    .greeting {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 12px;
    }
    .intro {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 24px;
    }
    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 18px 22px;
      margin-bottom: 24px;
    }
    .features-grid {
      margin-bottom: 24px;
    }
    .feature-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .feature-icon {
      font-size: 18px;
      margin-right: 12px;
      line-height: 1.2;
    }
    .feature-text {
      font-size: 13px;
      color: #334155;
      line-height: 1.5;
    }
    .btn-container {
      text-align: center;
      margin: 28px 0 20px;
    }
    .btn {
      display: inline-block;
      padding: 13px 30px;
      background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 800;
      font-size: 14px;
      border-radius: 12px;
    }
    .security-notice {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 20px;
      font-size: 12px;
      line-height: 1.5;
      color: #1e40af;
    }
    .footer {
      background-color: #f1f5f9;
      padding: 24px 32px;
      text-align: center;
      font-size: 11px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1 class="brand-title">IBAD STORE</h1>
        <p class="brand-sub">Platform Top Up Game & Layanan PPOB Otomatis 24 Jam</p>
        <div class="badge">✓ Pendaftaran Akun Berhasil</div>
      </div>

      <div class="content">
        ${sandboxNoticeHtml}

        <h2 class="greeting">Halo, ${params.name || params.username}! 🎉</h2>
        <p class="intro">
          Selamat bergabung di <strong>Ibad Store</strong>. Akun Anda telah aktif dan siap digunakan untuk top up game, voucher, token PLN, serta transaksi PPOB otomatis kilat.
        </p>

        <div class="info-card">
          <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 13px;">
            <tr>
              <td style="color: #64748b; font-weight: 600;">Nama Lengkap</td>
              <td style="text-align: right; color: #0f172a; font-weight: 700;">${params.name || '-'}</td>
            </tr>
            <tr>
              <td style="color: #64748b; font-weight: 600;">Username</td>
              <td style="text-align: right; color: #4f46e5; font-weight: 800; font-family: monospace;">@${params.username}</td>
            </tr>
            <tr>
              <td style="color: #64748b; font-weight: 600;">Email Terdaftar</td>
              <td style="text-align: right; color: #0f172a; font-weight: 700;">${recipient}</td>
            </tr>
            ${
              params.phone
                ? `<tr>
              <td style="color: #64748b; font-weight: 600;">Nomor WhatsApp</td>
              <td style="text-align: right; color: #0f172a; font-weight: 700;">${params.phone}</td>
            </tr>`
                : ''
            }
            <tr>
              <td style="color: #64748b; font-weight: 600;">Waktu Bergabung</td>
              <td style="text-align: right; color: #0f172a; font-weight: 600;">${dateFormatted}</td>
            </tr>
            <tr>
              <td style="color: #64748b; font-weight: 600;">Status Akun</td>
              <td style="text-align: right; color: #16a34a; font-weight: 800;">AKTIF & SIAP TRANSAKSI</td>
            </tr>
          </table>
        </div>

        <div class="features-grid">
          <div class="feature-item">
            <span class="feature-icon">⚡</span>
            <div class="feature-text">
              <strong>Proses Hitungan Detik</strong>: Setiap transaksi diproses otomatis 24 jam nonstop.
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">💳</span>
            <div class="feature-text">
              <strong>QRIS Otomatis</strong>: Top up instan lewat QRIS (BCA, Mandiri, BRI, DANA, OVO, GoPay, ShopeePay).
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🔒</span>
            <div class="feature-text">
              <strong>Proteksi PIN 6 Digit</strong>: Tambahkan PIN di menu profil untuk perlindungan saldo Anda.
            </div>
          </div>
        </div>

        <div class="btn-container">
          <a href="${params.loginUrl || 'https://ibadstore.id'}" class="btn">
            Mulai Belanja Sekarang &rarr;
          </a>
        </div>

        <div class="security-notice">
          <strong>Tips Keamanan:</strong> Jangan pernah membagikan password atau PIN transaksi kepada siapapun termasuk pihak yang mengatasnamakan admin Ibad Store.
        </div>
      </div>

      <div class="footer">
        <p><strong>Ibad Store Official</strong> — Layanan Digital & Top Up Terpercaya</p>
        <p>WhatsApp Bantuan Resmi: <strong>081515723808</strong></p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();

    const subject = isForwarded
      ? `[Member Baru] ${params.name || params.username} (@${params.username}) - ${recipient}`
      : 'Selamat Datang di Ibad Store - Pendaftaran Akun Berhasil!';

    const result = await callResendApi({
      apiKey,
      from: senderAddress,
      to: finalTarget,
      subject,
      html: emailHtml,
    });

    return { ...result, isForwarded };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Gagal mengirim email notifikasi.' };
  }
}

/**
 * Send a test email from Admin Panel to verify Resend connectivity
 */
export async function sendTestResendEmail(
  toEmail: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const settings = await getSystemSettings();
    const apiKey = (settings.resendApiKey || DEFAULT_RESEND_API_KEY || '').trim();
    if (!apiKey) {
      return { success: false, error: 'API Key Resend belum dikonfigurasi.' };
    }

    const rawFrom = (settings.resendFromEmail || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev').trim();
    const isSandbox = rawFrom.includes('@resend.dev');
    const senderAddress = rawFrom.includes('<') ? rawFrom : `Ibad Store <${rawFrom}>`;

    const targetEmail = (toEmail || '').trim();
    if (!targetEmail) {
      return { success: false, error: 'Harap masukkan alamat email tujuan.' };
    }

    // In sandbox mode with onboarding@resend.dev, Resend will return 403 validation_error if target is not verified owner
    if (isSandbox && targetEmail.toLowerCase() !== VERIFIED_SANDBOX_OWNER.toLowerCase()) {
      return {
        success: false,
        error: `Domain uji coba '${rawFrom}' dari Resend hanya dapat mengirim ke email akun terverifikasi (${VERIFIED_SANDBOX_OWNER}). Untuk mengirim ke '${targetEmail}', daftarkan domain kustom Anda di resend.com/domains terlebih dahulu.`,
      };
    }

    const res = await callResendApi({
      apiKey,
      from: senderAddress,
      to: targetEmail,
      subject: 'Uji Coba Notifikasi Email - Ibad Store Official',
      html: `
        <div style="font-family: sans-serif; padding: 24px; background: #0f172a; color: #ffffff; border-radius: 16px; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #818cf8; margin-top: 0;">IBAD STORE</h2>
          <h3 style="margin-bottom: 8px;">Uji Coba Notifikasi Resend Berhasil!</h3>
          <p style="color: #cbd5e1; line-height: 1.6; font-size: 14px;">
            Sistem pengiriman email notifikasi Ibad Store via <strong>Resend</strong> berfungsi normal dan siap mengirim notifikasi pendaftaran pengguna baru.
          </p>
          <div style="background: rgba(255,255,255,0.08); padding: 12px 16px; border-radius: 8px; font-size: 12px; color: #94a3b8; font-family: monospace;">
            Pengirim: ${senderAddress}<br/>
            Tujuan: ${targetEmail}<br/>
            Waktu Uji: ${new Date().toISOString()}
          </div>
        </div>
      `,
    });

    return res;
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal mengirim email uji coba.' };
  }
}
