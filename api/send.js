const nodemailer = require('nodemailer');

function parseJsonBody(req) {
  const raw = req.body;
  if (raw == null) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  if (Buffer.isBuffer(raw)) {
    try {
      return JSON.parse(raw.toString('utf8'));
    } catch {
      return {};
    }
  }
  if (typeof raw === 'object') return raw;
  return {};
}

function getTransport() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;

  if (!user || !pass) {
    return null;
  }

  // Generic SMTP (Gmail: smtp.gmail.com, port 587, secure false)
  if (host && port) {
    const secure =
      process.env.SMTP_SECURE === 'true' || port === 465;
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  }

  // Preset (e.g. SMTP_SERVICE=gmail)
  const service = process.env.SMTP_SERVICE;
  if (service) {
    return nodemailer.createTransport({
      service,
      auth: { user, pass },
    });
  }

  return null;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const transport = getTransport();
  if (!transport) {
    return res.status(500).json({
      success: false,
      error:
        'Server misconfiguration: set SMTP_USER and SMTP_PASS, plus either SMTP_HOST+SMTP_PORT or SMTP_SERVICE (e.g. gmail). Add them in Vercel → Environment Variables, then redeploy.',
    });
  }

  const body = parseJsonBody(req);
  const fullName = (body.fullName ?? body.name ?? '').toString().trim();
  const userEmail = (body.userEmail ?? body.email ?? '').toString().trim();
  const infoMsg = (body.infoMsg ?? body.message ?? '').toString().trim();

  if (!fullName || !infoMsg) {
    return res.status(400).json({ success: false, error: 'Missing fullName or infoMsg' });
  }

  const mailTo = (process.env.MAIL_TO || 'rfurqan009@gmail.com').trim();
  const mailFrom =
    (process.env.MAIL_FROM || `Portfolio contact <${process.env.SMTP_USER}>`).trim();

  try {
    const info = await transport.sendMail({
      from: mailFrom,
      to: mailTo,
      replyTo: userEmail || undefined,
      subject: `New message from ${fullName}`,
      html: `
        <h2>New contact form submission</h2>
        <p><strong>Full Name:</strong> ${escapeHtml(fullName)}</p>
        <p><strong>User Email:</strong> ${escapeHtml(userEmail || '(not provided)')}</p>
        <p><strong>Message:</strong></p>
        <pre style="white-space:pre-wrap;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">${escapeHtml(infoMsg)}</pre>
      `,
    });

    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    const message = error?.message || String(error);
    return res.status(500).json({ success: false, error: message });
  }
};

function escapeHtml(input) {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
