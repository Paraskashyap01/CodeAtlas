import { validationResult } from 'express-validator';
import Note from '../models/Note.js';
import { apiError } from '../utils/validation.js';

export const createNote = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return apiError(res, 400, errors.array().map((e) => e.msg).join(', '));

  try {
    const note = await Note.create({ userId: req.userId, ...req.body });
    res.status(201).json({ success: true, note });
  } catch (error) {
    console.error(error);
    apiError(res, 500, 'Unable to create note');
  }
};

export const getNotes = async (req, res) => {
  try {
    // Pagination: default 20 per page, max 100
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const total = await Note.countDocuments({ userId: req.userId });
    const notes = await Note.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ success: true, notes, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error(error);
    apiError(res, 500, 'Unable to fetch notes');
  }
};
