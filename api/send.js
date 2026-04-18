const { Resend } = require('resend');

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

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({
      success: false,
      error:
        'Server misconfiguration: RESEND_API_KEY is not set. Add it in Vercel → Project → Settings → Environment Variables, then redeploy.',
    });
  }

  const body = parseJsonBody(req);
  const fullName = (body.fullName ?? body.name ?? '').toString().trim();
  const userEmail = (body.userEmail ?? body.email ?? '').toString().trim();
  const infoMsg = (body.infoMsg ?? body.message ?? '').toString().trim();

  if (!fullName || !infoMsg) {
    return res.status(400).json({ success: false, error: 'Missing fullName or infoMsg' });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const data = await resend.emails.send({
      from: 'Contact Form <onboarding@resend.dev>',
      to: ['rfurqan009@gmail.com'],
      subject: `New message from ${fullName}`,
      replyTo: userEmail || undefined,
      html: `
        <h2>New contact form submission</h2>
        <p><strong>Full Name:</strong> ${escapeHtml(fullName)}</p>
        <p><strong>User Email:</strong> ${escapeHtml(userEmail || '(not provided)')}</p>
        <p><strong>Message:</strong></p>
        <pre style="white-space:pre-wrap;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">${escapeHtml(infoMsg)}</pre>
      `,
    });

    return res.status(200).json({ success: true, data });
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
