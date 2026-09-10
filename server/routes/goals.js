import express from 'express';
import { body } from 'express-validator';
import { createGoal, getCurrentGoal } from '../controllers/goalsController.js';
import authMiddleware from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

router.get('/', authMiddleware, asyncHandler(getCurrentGoal));
router.post(
  '/',
  authMiddleware,
  [
    body('goalDescription').trim().notEmpty().withMessage('Goal description is required'),
    body('targetCount').isInt({ min: 1 }).withMessage('Target count must be at least 1'),
  ],
  asyncHandler(createGoal)
);

export default router;
