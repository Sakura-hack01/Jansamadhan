const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default || require('rate-limit-redis');
const redisClient = require('./config/redis');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const security = require('./middleware/security.middleware');
require('dotenv').config();

const app = express();

// ===== TRUST PROXY (for load balancer / Nginx) =====
app.set('trust proxy', 1);

// ===== CORE SECURITY: Helmet (with customizations) =====
app.use(helmet({
  contentSecurityPolicy: false,   // CSP handled by our security middleware
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

// ===== APPLY ALL 11 SECURITY LAYERS =====
security.applyAll(app);

// ===== ADDITIONAL SECURITY: Mongo Sanitize + XSS Clean =====
app.use(mongoSanitize({ replaceWith: '_' }));
app.use(xss());

// ===== LOGGING =====
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ===== RATE LIMITING (Redis-Synced for 1 Lakh+ users) =====
const getRedisStore = () => {
  // Use memory store unless REDIS_URI is explicitly configured for production
  if (!process.env.REDIS_URI || (process.env.NODE_ENV !== 'production' && !process.env.REDIS_URI.includes('rediss'))) {
    return undefined;
  }
  return new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  });
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,                  // 200 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests. Please try again after 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 900
  },
  store: getRedisStore(),
  skip: (req) => req.path === '/api/health', // Don't rate limit health checks
});
app.use('/api/', apiLimiter);

// Auth rate limiter (stricter — prevents brute force, skips session checks)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 35,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many authentication attempts. Try again after 15 minutes.',
    code: 'AUTH_RATE_LIMIT'
  },
  store: getRedisStore(),
  skip: (req) => req.path === '/me' || req.path === '/logout' || req.path === '/refresh-token',
});

// Grievance filing rate limiter (prevent spam)
const grievanceLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 5,                     // Max 5 grievances per hour
  message: {
    message: 'Grievance filing limit reached. Maximum 5 grievances per hour.',
    code: 'GRIEVANCE_RATE_LIMIT'
  },
  store: getRedisStore()
});

// ===== CORS (Strict origin control) =====
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL,
  'https://jansamadhan.gov.in',
  'https://www.jansamadhan.gov.in',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // In dev, allow Postman (no origin) and local network IPs naturally
    if (process.env.NODE_ENV !== 'production') {
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.startsWith('http://192.168.')) {
        return callback(null, true);
      }
    }
    
    // Strict match for production
    if (!origin) return callback(new Error('Origin not allowed'));
    if (allowedOrigins.includes(origin)) return callback(null, true);
    
    console.warn(`⚠️ CORS blocked origin: ${origin}`);
    return callback(new Error('Origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id', 'X-Response-Time-Start'],
  maxAge: 86400, // 24 hours pre-flight cache
}));

// ===== BODY PARSERS (with size limits) =====
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ===== ROUTES =====
app.use('/api/auth', authLimiter, security.bruteForceProtection, require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/complaints', grievanceLimiter, require('./routes/complaint.routes'));
app.use('/api/reports', require('./routes/report.routes'));
app.use('/api/settings', require('./routes/settings.routes'));
app.use('/api/delivery', require('./routes/delivery.routes'));
app.use('/api/departments', require('./routes/department.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/centers', require('./routes/center.routes'));

// ===== HEALTH CHECK (with details) =====
app.get('/api/health', async (req, res) => {
  const healthData = {
    status: 'OK',
    service: 'JanSamadhan API',
    version: '7.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()) + 's',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
    },
    security: {
      helmet: true,
      cors: true,
      rateLimiting: true,
      noSQLInjectionProtection: true,
      xssProtection: true,
      hsts: true,
      csp: true,
      antiPhishing: true,
      bruteForceProtection: true,
      ipProtection: true,
      botProtection: true,
    },
    scale: 'Designed for 1,00,000+ concurrent users',
  };
  try {
    const mongoState = mongoose.connection.readyState;
    healthData.database = mongoState === 1 ? 'Connected' : 'Disconnected';
  } catch { healthData.database = 'Unknown'; }
  res.json(healthData);
});

// ===== 404 HANDLER =====
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    code: 'NOT_FOUND',
    requestId: req.requestId
  });
});

// ===== GLOBAL ERROR HANDLER (never expose stack in production) =====
app.use((err, req, res, next) => {
  // Log full error internally
  console.error(`❌ [${req.requestId}] ${err.message}`);
  if (process.env.NODE_ENV === 'development') console.error(err.stack);

  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'Origin not allowed', code: 'CORS_BLOCKED' });
  }

  // Send clean error to client (no stack traces in production)
  res.status(err.statusCode || 500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    code: 'SERVER_ERROR',
    requestId: req.requestId,
  });
});

// ===== MONGODB CONNECTION (with optimized connection pool) =====
const mongoOptions = {
  maxPoolSize: 50,          // Max connections (for high concurrency)
  minPoolSize: 10,          // Keep minimum connections alive
  socketTimeoutMS: 45000,   // Close sockets after 45 seconds of inactivity
  serverSelectionTimeoutMS: 5000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  w: 'majority',
};

mongoose.connect(process.env.MONGO_URI, mongoOptions)
  .then(() => {
    console.log('✅ MongoDB Connected (Pool: 10-50 connections)');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`\n🚀 JanSamadhan Server running on port ${PORT}`);
      console.log(`🏛️  Government-Grade Security: ACTIVE`);
      console.log(`📊 Designed for: 1,00,000+ concurrent users`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/api/health\n`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// ===== GRACEFUL SHUTDOWN =====
process.on('SIGTERM', async () => {
  console.log('⏹️  SIGTERM received. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('⏹️  SIGINT received. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

// Prevent crash on unhandled errors
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err.message);
  // In production, log to external service, then exit
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason);
});

module.exports = app;
