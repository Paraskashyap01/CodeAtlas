import express from 'express';
import { body } from 'express-validator';
import { createNote, getNotes } from '../controllers/notesController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, getNotes);
router.post(
  '/',
  authMiddleware,
  [
    body('problemId').trim().notEmpty().withMessage('Problem id is required'),
    body('note').trim().notEmpty().withMessage('Note is required'),
    body('platform').optional().isIn(['codeforces', 'leetcode', 'other']),
    body('revisit').optional().isBoolean(),
  ],
  createNote
);

export default router;
