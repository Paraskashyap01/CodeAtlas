import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { getLCStats } from '../controllers/lcController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

router.get('/stats', authMiddleware, asyncHandler(getLCStats));

export default router;
