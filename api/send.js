import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, email, message } = req.body;

  try {
    const data = await resend.emails.send({
      from: 'Contact Form <contact-us@resend.dev>', // Use your verified domain here
      to: ['rfurqan009email@gmail.com'],
      subject: `New Message from ${name}`,
      html: `<p><strong>Email:</strong> ${email}</p><p>${message}</p>`,
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}