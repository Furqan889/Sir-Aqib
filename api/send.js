const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const body = req.body || {};
  const fullName = (body.fullName ?? body.name ?? '').toString().trim();
  const userEmail = (body.userEmail ?? body.email ?? '').toString().trim();
  const infoMsg = (body.infoMsg ?? body.message ?? '').toString().trim();

  if (!fullName || !infoMsg) {
    return res.status(400).json({ success: false, error: 'Missing fullName or infoMsg' });
  }

  try {
    const data = await resend.emails.send({
      // This sender works for testing on Resend without a verified domain.
      // When you verify your own domain in Resend, replace with e.g. "Contact <hello@yourdomain.com>".
      from: 'Contact Form <onboarding@resend.dev>',
      to: ['mustafaaqib892@gmail.com'],
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
    return res.status(500).json({ success: false, error: error?.message || 'Failed to send' });
  }
};

function escapeHtml(input) {
  return String(input)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}