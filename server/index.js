import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './utils/db.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import cfRoutes from './routes/cf.js';
import lcRoutes from './routes/lc.js';
import notesRoutes from './routes/notes.js';
import goalsRoutes from './routes/goals.js';
import recommendationsRoutes from './routes/recommendations.js';
import profileRoutes from './routes/profile.js';
import { startReminderJob } from './services/reminderService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());

connectDB();
startReminderJob();

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/cf', cfRoutes);
app.use('/api/lc', lcRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/profile', profileRoutes);

app.get('/api/ping', (req, res) => {
  res.json({ message: 'CP Growth Tracker API is alive' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

