import mongoose from 'mongoose';

const recommendationCacheSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  cacheDate: { type: String, required: true },
  weakTopics: { type: Array, default: [] },
  recommendations: { type: Array, default: [] },
  generatedBy: { type: String, default: 'fallback' },
  createdAt: { type: Date, default: Date.now },
});

recommendationCacheSchema.index({ userId: 1, cacheDate: 1 }, { unique: true });

const RecommendationCache = mongoose.model('RecommendationCache', recommendationCacheSchema);
export default RecommendationCache;
