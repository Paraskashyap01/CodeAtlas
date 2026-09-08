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

  // --- Legacy fields (kept so the existing Dashboard stat cards keep working) ---
  stats: {
    type: Object,
    default: {},
  },
  calendar: {
    type: Array,
    default: [],
    // Format: [{ date: '2025-01-15', count: 3 }, ...]
  },

  // --- New fields for the dedicated LeetCode page ---
  profile: {
    type: Object,
    default: {},
  },
  solvedBreakdown: {
    type: Object,
    default: {},
  },
  totalBreakdown: {
    type: Object,
    default: {},
  },
  contestRanking: {
    type: Object,
    default: null,
  },
  contestHistory: {
    type: Array,
    default: [],
  },
  submissions: {
    type: Array,
    default: [],
  },
  badges: {
    type: Array,
    default: [],
  },
  upcomingBadges: {
    type: Array,
    default: [],
  },
  skills: {
    type: Object,
    default: {},
  },
  streak: {
    type: Number,
    default: 0,
  },
  totalActiveDays: {
    type: Number,
    default: 0,
  },
  daily: {
    type: Object,
    default: null,
  },

  fetchedAt: {
    type: Date,
    default: Date.now,
  },
});

const CachedLCData = mongoose.model('CachedLCData', lcSchema);
export default CachedLCData;
