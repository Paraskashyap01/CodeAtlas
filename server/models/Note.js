import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    problemId: { type: String, required: true, trim: true },
    platform: { type: String, enum: ['codeforces', 'leetcode', 'other'], default: 'codeforces' },
    note: { type: String, required: true, trim: true },
    revisit: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Note = mongoose.model('Note', noteSchema);
export default Note;
