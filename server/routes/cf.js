import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { getCFStats } from '../controllers/cfController.js';

const router = express.Router();

router.get('/stats', authMiddleware, getCFStats);

export default router;
