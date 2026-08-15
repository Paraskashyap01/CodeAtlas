import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { getLCStats } from '../controllers/lcController.js';

const router = express.Router();

router.get('/stats', authMiddleware, getLCStats);

export default router;
