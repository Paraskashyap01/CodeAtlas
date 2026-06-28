import mongoose from 'mongoose';

const lcSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  handle: {
    type: String,
    required: true,
  },
  stats: {
    type: Object,
    default: {},
  },
  calendar: {
    type: Array,
    default: [],
    // Format: [{ date: '2025-01-15', count: 3 }, ...]
  },
  fetchedAt: {
    type: Date,
    default: Date.now,
  },
});

const CachedLCData = mongoose.model('CachedLCData', lcSchema);
export default CachedLCData;
