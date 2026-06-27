import { validationResult } from 'express-validator';
import Note from '../models/Note.js';

export const createNote = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const note = await Note.create({ userId: req.userId, ...req.body });
    res.status(201).json({ note });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to create note' });
  }
};

export const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ notes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to fetch notes' });
  }
};
