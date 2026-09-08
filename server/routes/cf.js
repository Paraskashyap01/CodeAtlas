import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { getCFStats } from '../controllers/cfController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

router.get('/stats', authMiddleware, asyncHandler(getCFStats));

export default router;
