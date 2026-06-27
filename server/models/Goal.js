import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    weekStart: { type: Date, required: true },
    goalDescription: { type: String, required: true, trim: true },
    targetCount: { type: Number, required: true, min: 1 },
    solvedCount: { type: Number, default: 0, min: 0 },
    done: { type: Boolean, default: false },
  },
  { timestamps: true }
);

goalSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

const Goal = mongoose.model('Goal', goalSchema);
export default Goal;
