import express from 'express';
import { body } from 'express-validator';
import { register, login, getProfile } from '../controllers/authController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').exists().withMessage('Password is required'),
  ],
  login
);

router.get('/profile', authMiddleware, getProfile);

export default router;
