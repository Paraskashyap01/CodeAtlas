import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { getLeaderboard, addFriend } from '../controllers/friendsController.js';

const router = express.Router();

router.get('/leaderboard', authMiddleware, getLeaderboard);

router.post('/add', authMiddleware, addFriend);

export default router;



