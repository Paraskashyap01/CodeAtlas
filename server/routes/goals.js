import express from 'express';
import { body } from 'express-validator';
import { createGoal, getCurrentGoal, updateGoalProgress } from '../controllers/goalsController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, getCurrentGoal);
router.post(
  '/',
  authMiddleware,
  [
    body('goalDescription').trim().notEmpty().withMessage('Goal description is required'),
    body('targetCount').isInt({ min: 1 }).withMessage('Target count must be at least 1'),
    body('solvedCount').optional().isInt({ min: 0 }),
  ],
  createGoal
);
router.patch('/:id', authMiddleware, updateGoalProgress);

export default router;
