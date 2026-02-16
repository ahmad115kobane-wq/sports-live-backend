import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { Server as SocketServer } from 'socket.io';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import teamRoutes from './routes/team.routes';
import playerRoutes from './routes/player.routes';
import matchRoutes from './routes/match.routes';
import eventRoutes from './routes/event.routes';
import operatorRoutes from './routes/operator.routes';
import adminRoutes from './routes/admin.routes';
import competitionRoutes from './routes/competition.routes';
import lineupRoutes from './routes/lineup.routes';
import statsRoutes from './routes/stats.routes';
import notificationRoutes from './routes/notification.routes';
import newsRoutes from './routes/news.routes';
import storeRoutes from './routes/store.routes';
import orderRoutes from './routes/order.routes';
import sliderRoutes from './routes/slider.routes';
import legalRoutes from './routes/legal.routes';
import seedRoutes from './routes/seed.routes';
import videoAdRoutes from './routes/videoad.routes';
import refereeRoutes from './routes/referee.routes';
import supervisorRoutes from './routes/supervisor.routes';

// Import Socket handler
import { setupSocketHandlers } from './socket/socketHandler';

// Import Notification Scheduler
import { startNotificationScheduler } from './services/scheduler.service';

dotenv.config();

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

// Socket.IO setup
const io = new SocketServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Make io accessible to routes
app.set('io', io);

// ── Security Middleware ──
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS — restrict in production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['*'];
app.use(cors({
  origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body size limits (prevent DoS)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Rate Limiting ──
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window
  message: { success: false, message: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { success: false, message: 'Too many requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use('/api/auth', authLimiter);
app.use('/api/', apiLimiter);

// Serve static files (team logos, etc.)
app.use('/teams', express.static(path.join(process.cwd(), 'public/teams')));
app.use('/static', express.static(path.join(process.cwd(), 'public')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/operator', operatorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/competitions', competitionRoutes);
app.use('/api/lineups', lineupRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/sliders', sliderRoutes);
app.use('/api/video-ads', videoAdRoutes);
app.use('/api/referees', refereeRoutes);
app.use('/api/supervisors', supervisorRoutes);
app.use('/api/legal', legalRoutes);
// Seed routes — protected by admin auth in production
if (process.env.NODE_ENV === 'production') {
  const { authenticate, isAdmin } = require('./middleware/auth.middleware');
  app.use('/api/seed', authenticate, isAdmin, seedRoutes);
} else {
  app.use('/api/seed', seedRoutes);
}

// R2 image proxy — streams images from R2 bucket via S3 client (no fetch needed)
app.get('/api/r2/*', async (req, res) => {
  try {
    const key = req.path.replace('/api/r2/', ''); // e.g., "store/abc123.jpg"
    if (!key) {
      return res.status(400).send('Missing key');
    }

    const { s3, R2_BUCKET_NAME, isR2Configured } = require('./services/imgbb.service');
    if (!isR2Configured || !s3) {
      return res.status(503).send('R2 not configured');
    }

    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const response = await s3.send(new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    }));

    res.setHeader('Content-Type', response.ContentType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    // Stream the response body to the client
    const stream = response.Body;
    if (stream && typeof stream.pipe === 'function') {
      stream.pipe(res);
    } else if (stream) {
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      res.send(Buffer.concat(chunks));
    } else {
      res.status(404).send('Not found');
    }
  } catch (error: any) {
    if (error?.name === 'NoSuchKey') {
      return res.status(404).send('Image not found');
    }
    console.error('R2 proxy error:', error);
    res.status(500).send('Proxy error');
  }
});

// All images are served from R2 via /api/r2/* proxy — no local static files needed

// Setup Socket handlers
setupSocketHandlers(io);

// Error handling middleware — hide details in production
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    success: false,
    message: isProd ? 'Internal server error' : (err.message || 'Internal server error'),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

const PORT = parseInt(process.env.PORT || '3000', 10);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 Mini Football Server is running!
📡 HTTP Server: http://localhost:${PORT}
🔌 WebSocket: ws://localhost:${PORT}
📚 API Docs: http://localhost:${PORT}/api

Available endpoints:
  - POST /api/auth/register
  - POST /api/auth/login
  - GET  /api/matches
  - GET  /api/matches/:id
  - GET  /api/teams
  - GET  /api/players
  - POST /api/events (Operator)
  - GET  /api/operator/matches (Operator)
  - POST /api/admin/matches (Admin)
  - GET  /api/notifications (Notifications)
  - POST /api/users/push-token (Push Token)
  `);

  // Start notification scheduler
  startNotificationScheduler();
  console.log('📬 Notification scheduler started');
});

export { io };
