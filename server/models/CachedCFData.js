import mongoose from "mongoose";

const cfSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  handle: String,

  ratingHistory: {
    type: Array,
    default: [],
  },

  submissions: {
    type: Array,
    default: [],
  },

  currentRating: {
    type: Number,
    default: null,
  },

  solvedCount: {
    type: Number,
    default: 0,
  },

  fetchedAt: {
    type: Date,
    default: Date.now,
  },
});

const CachedCFData = mongoose.model('CachedCFData', cfSchema);

export default CachedCFData;