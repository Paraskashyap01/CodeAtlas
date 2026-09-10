import { validationResult } from 'express-validator';
import Note from '../models/Note.js';
import { httpError } from '../utils/errors.js';

export const createNote = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw httpError(400, errors.array().map((e) => e.msg).join(', '));

  const note = await Note.create({ userId: req.userId, ...req.body });
  res.status(201).json({ success: true, note });
};

export const getNotes = async (req, res) => {
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
};
