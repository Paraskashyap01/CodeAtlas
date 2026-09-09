import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { getProfile } from '../controllers/authController.js';
import { getDashboardStats, updateHandles } from '../controllers/userController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

router.get('/profile', authMiddleware, asyncHandler(getProfile));
router.get('/dashboard', authMiddleware, asyncHandler(getDashboardStats));
router.put('/handles', authMiddleware, asyncHandler(updateHandles));


export default router;
