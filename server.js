require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { testConnection } = require('./config/supabase');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(generalLimiter);

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many messages. Please try again later.' }
});

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret_change_this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 8 * 60 * 60 * 1000
  }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Trust proxy
app.set('trust proxy', 1);

// Routes
app.use('/api/contact', contactLimiter, require('./routes/contact'));
app.use('/', require('./routes/admin'));

// Health check
app.get('/health', async (req, res) => {
  const { data, error } = await require('./config/supabase').supabase.from('messages').select('count');
  res.json({ 
    status: error ? 'ERROR' : 'OK', 
    timestamp: new Date().toISOString(),
    database: 'Supabase',
    project: 'kqpbfnximstnobxsnivm',
    connected: !error
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('Page Not Found');
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

const PORT = process.env.PORT || 3000;

// Start server after testing Supabase connection
const startServer = async () => {
  const connected = await testConnection();
  
  if (!connected) {
    console.error('\n❌ Failed to connect to Supabase. Please check:');
    console.error('   1. Your internet connection');
    console.error('   2. SUPABASE_URL in .env file');
    console.error('   3. SUPABASE_SERVICE_ROLE_KEY in .env file');
    console.error('   4. Supabase project is active\n');
    // Continue anyway for development
  }

  app.listen(PORT, () => {
    console.log(`
  ╔══════════════════════════════════════════════════════════════╗
  ║     AQIB PORTFOLIO - SUPABASE BACKEND                        ║
  ║                                                              ║
  ║  🌐 Public Site:  http://localhost:${PORT}                        ║
  ║  🔐 Admin Login:  http://localhost:${PORT}/login                  ║
  ║  📊 Dashboard:    http://localhost:${PORT}/admin                  ║
  ║  💓 Health Check: http://localhost:${PORT}/health                 ║
  ║                                                              ║
  ║  🗄️  Database:     Supabase (PostgreSQL)                         ║
  ║  📍 Project:      kqpbfnximstnobxsnivm                        ║
  ║  🔗 URL:           https://kqpbfnximstnobxsnivm.supabase.co      ║
  ║                                                              ║
  ╚══════════════════════════════════════════════════════════════╝
    `);
  });
};

startServer();
