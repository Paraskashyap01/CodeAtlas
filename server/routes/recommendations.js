import express from 'express';
import { getRecommendations } from '../controllers/recommendationsController.js';
import authMiddleware from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

router.get('/', authMiddleware, asyncHandler(getRecommendations));

export default router;




