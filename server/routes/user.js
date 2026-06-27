import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { getProfile } from '../controllers/authController.js';
import { updateHandles } from '../controllers/userController.js';

const router = express.Router();

router.get('/profile', authMiddleware, getProfile);
router.put('/handles', authMiddleware, updateHandles);

export default router;
