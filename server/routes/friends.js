import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { getLeaderboard, addFriend } from '../controllers/friendsController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

router.get('/leaderboard', authMiddleware, asyncHandler(getLeaderboard));

router.post('/add', authMiddleware, asyncHandler(addFriend));

export default router;



