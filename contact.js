const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../config/supabase');

// Your Supabase project info
const PROJECT_REF = 'kqpbfnximstnobxsnivm';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// POST /api/contact - Handle contact form submission
router.post('/', async (req, res) => {
  try {
    const { fullName, userEmail, infoMsg } = req.body;

    // Validation
    if (!fullName || !infoMsg) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and message are required' 
      });
    }

    // Create message object
    const newMessage = {
      id: uuidv4(),
      full_name: fullName.trim(),
      email: userEmail ? userEmail.trim() : null,
      message: infoMsg.trim(),
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      read: false,
      created_at: new Date().toISOString()
    };

    // Save to YOUR Supabase project
    const { data, error } = await supabase
      .from('messages')
      .insert([newMessage])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log(`✅ Message saved to Supabase: ${PROJECT_REF}`);

    // Prepare email content
    const timestamp = new Date().toLocaleString('en-PK', { 
      timeZone: 'Asia/Karachi',
      hour12: true 
    });

    const emailSubject = `📩 New Portfolio Message from ${fullName}`;
    
    const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #00d4ff 0%, #7b2cbf 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🔔 New Message Received</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Portfolio Contact Form</p>
        </div>
        
        <div style="padding: 30px; background: white;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #333; width: 30%;">👤 Full Name:</td>
              <td style="padding: 12px; border-bottom: 1px solid #eee; color: #555;">${fullName}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;">📧 Email:</td>
              <td style="padding: 12px; border-bottom: 1px solid #eee; color: #555;">${userEmail || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #333; vertical-align: top;">💬 Message:</td>
              <td style="padding: 12px; border-bottom: 1px solid #eee; color: #555; white-space: pre-wrap;">${infoMsg}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold; color: #333;">🕒 Timestamp:</td>
              <td style="padding: 12px; color: #555;">${timestamp}</td>
            </tr>
          </table>
          
          <div style="margin-top: 25px; padding: 15px; background: #e8f4f8; border-radius: 8px; border-left: 4px solid #00d4ff;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              <strong>Supabase Project:</strong> ${PROJECT_REF}<br>
              <strong>Admin Link:</strong> <a href="${req.protocol}://${req.get('host')}/admin/messages" style="color: #00d4ff;">View in Admin Panel</a>
            </p>
          </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
          <p style="margin: 0; color: #999; font-size: 12px;">This is an automated message from Muhammad Aqib's Portfolio</p>
        </div>
      </div>
    `;

    const textVersion = `
📢 NEW MESSAGE FROM PORTFOLIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Full Name: ${fullName}
📧 Email: ${userEmail || 'Not provided'}
💬 Message:
${infoMsg}

🕒 Time: ${timestamp}
🌐 From: ${req.ip}
🗄️  Database: Supabase (${PROJECT_REF})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;

    // Send email
    const transporter = createTransporter();
    
    await transporter.sendMail({
      from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      replyTo: userEmail || process.env.EMAIL_USER,
      subject: emailSubject,
      text: textVersion,
      html: emailHtml
    });

    console.log(`✅ Email sent to ${process.env.EMAIL_USER}`);

    res.status(200).json({
      success: true,
      message: 'Message sent successfully! Aqib will be notified via email.',
      data: {
        id: newMessage.id,
        timestamp: newMessage.created_at,
        database: 'supabase',
        project: PROJECT_REF
      }
    });

  } catch (error) {
    console.error('❌ Contact form error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message. Please try again later.'
    });
  }
});

// GET /api/contact - Get all messages (for admin)
router.get('/', async (req, res) => {
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      count: messages.length,
      project: PROJECT_REF,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

module.exports = router;
