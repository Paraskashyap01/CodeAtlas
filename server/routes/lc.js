import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { getLCStats, getLCProfile } from '../controllers/lcController.js';

const router = express.Router();

router.get('/stats', authMiddleware, getLCStats);
router.get('/profile', authMiddleware, getLCProfile);

export default router;
