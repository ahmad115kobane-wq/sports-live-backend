import express from 'express';
import http from 'http';
import cors from 'cors';
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

// Import Socket handler
import { setupSocketHandlers } from './socket/socketHandler';

// Import Notification Scheduler
import { startNotificationScheduler } from './services/scheduler.service';

dotenv.config();

const app = express();
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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (team logos, etc.)
app.use('/teams', express.static(path.join(__dirname, '../public/teams')));
app.use('/static', express.static(path.join(__dirname, '../public')));

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
app.use('/api/legal', legalRoutes);

// Serve news images
app.use('/news', express.static(path.join(__dirname, '../public/news')));

// Serve avatar images
app.use('/avatars', express.static(path.join(__dirname, '../public/avatars')));

// Serve store images
app.use('/store', express.static(path.join(__dirname, '../public/store')));

// Serve slider images
app.use('/sliders', express.static(path.join(__dirname, '../public/sliders')));

// Setup Socket handlers
setupSocketHandlers(io);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
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
🚀 Sports Live Server is running!
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
