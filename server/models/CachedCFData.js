import mongoose from 'mongoose';

const cfSchema = new mongoose.Schema({
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
  ratingHistory: {
    type: Array,
    default: [],
  },
  submissions: {
    type: Array,
    default: [],
  },
  fetchedAt: {
    type: Date,
    default: Date.now,
  },
});

const CachedCFData = mongoose.model('CachedCFData', cfSchema);
export default CachedCFData;
