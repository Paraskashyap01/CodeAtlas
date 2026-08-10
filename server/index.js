import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import './config/env.js';
import connectDB from './utils/db.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import cfRoutes from './routes/cf.js';
import lcRoutes from './routes/lc.js';
import notesRoutes from './routes/notes.js';
import goalsRoutes from './routes/goals.js';
import recommendationsRoutes from './routes/recommendations.js';
import profileRoutes from './routes/profile.js';
import friendsRoutes from './routes/friends.js';
import { startReminderJob } from './services/reminderService.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { connectRedis } from './config/redis.js';

dotenv.config();

const app = express();
const requestedPort = Number(process.env.PORT || 5000);

const allowedOrigin = process.env.ALLOWED_ORIGIN;
app.use(cors({
  origin: allowedOrigin ? allowedOrigin.split(',').map((value) => value.trim()) : true,
  credentials: true,
}));
app.use(express.json());

const startServer = async () => {
  await connectDB();
  await connectRedis().catch((error) => {
    console.error('Redis startup failed:', error.message);
  });
  startReminderJob();

  app.use(['/api/cf', '/api/lc'], apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/cf', cfRoutes);
app.use('/api/lc', lcRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/friends', friendsRoutes);

app.get('/api/ping', (req, res) => {
  res.json({ message: 'CP Growth Tracker API is alive' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

  const listenOnPort = (port) => {
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    }).on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.warn(`Port ${port} is busy, trying ${port + 1}...`);
        listenOnPort(port + 1);
        return;
      }

      console.error('Server startup failed:', error.message);
      process.exit(1);
    });
  };

  listenOnPort(requestedPort);
};

startServer();

