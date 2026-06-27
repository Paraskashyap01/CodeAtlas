import express from 'express';
import { getRecommendations } from '../controllers/recommendationsController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, getRecommendations);

export default router;




