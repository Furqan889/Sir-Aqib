const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middleware/auth');
const Message = require('../models/Message');

// GET /login - Hidden login page (NO LINKS TO THIS ANYWHERE IN PUBLIC)
router.get('/login', (req, res) => {
  // If already logged in, redirect to dashboard
  if (req.cookies.adminToken) {
    try {
      jwt.verify(req.cookies.adminToken, process.env.JWT_SECRET);
      return res.redirect('/admin/dashboard');
    } catch {
      res.clearCookie('adminToken');
    }
  }
  res.render('login', { error: null, title: 'Admin Login' });
});

// POST /login - Handle login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Check credentials against environment variables
  if (username !== process.env.ADMIN_USERNAME) {
    return res.render('login', { 
      error: 'Invalid credentials', 
      title: 'Admin Login' 
    });
  }

  const isMatch = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
  
  if (!isMatch) {
    return res.render('login', { 
      error: 'Invalid credentials', 
      title: 'Admin Login' 
    });
  }

  // Create JWT token
  const token = jwt.sign(
    { 
      username, 
      role: 'admin',
      loginTime: new Date().toISOString()
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: '8h' }
  );

  // Set HTTP-only cookie
  res.cookie('adminToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000 // 8 hours
  });

  // Also set in session as backup
  req.session.token = token;
  req.session.admin = username;

  res.redirect('/admin/dashboard');
});

// GET /logout - Logout
router.get('/logout', (req, res) => {
  res.clearCookie('adminToken');
  req.session.destroy();
  res.redirect('/login');
});

// GET /admin/dashboard - Admin dashboard (PROTECTED)
router.get('/admin/dashboard', verifyToken, async (req, res) => {
  try {
    const stats = {
      total: await Message.countDocuments(),
      unread: await Message.countDocuments({ read: false }),
      today: await Message.countDocuments({
        createdAt: { 
          $gte: new Date(new Date().setHours(0,0,0,0)) 
        }
      }),
      recent: await Message.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
    };

    res.render('dashboard', { 
      title: 'Dashboard',
      admin: req.admin,
      stats,
      path: req.path
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// GET /admin/messages - View all messages (PROTECTED)
router.get('/admin/messages', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const messages = await Message.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Message.countDocuments();
    const totalPages = Math.ceil(total / limit);

    res.render('messages', {
      title: 'All Messages',
      admin: req.admin,
      messages,
      currentPage: page,
      totalPages,
      total,
      path: req.path
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// POST /admin/messages/:id/read - Mark as read
router.post('/admin/messages/:id/read', verifyToken, async (req, res) => {
  try {
    await Message.findByIdAndUpdate(req.params.id, { read: true });
    res.redirect('/admin/messages');
  } catch (error) {
    res.status(500).send('Error updating message');
  }
});

// POST /admin/messages/:id/delete - Delete message
router.post('/admin/messages/:id/delete', verifyToken, async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.redirect('/admin/messages');
  } catch (error) {
    res.status(500).send('Error deleting message');
  }
});

// API endpoint to get messages as JSON (for AJAX)
router.get('/api/admin/messages', verifyToken, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
