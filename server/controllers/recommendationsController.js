import CachedCFData from '../models/CachedCFData.js';
import RecommendationCache from '../models/RecommendationCache.js';
import User from '../models/user.js';
import { fetchCFData, isCacheFresh } from '../services/codeforcesService.js';
import { generateRecommendations } from '../services/recommendationService.js';
import { buildCFDerivedStats } from '../utils/cfStats.js';

const todayKey = () => new Date().toISOString().slice(0, 10);

export const getRecommendations = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user?.cfHandle) return res.status(400).json({ message: 'Codeforces handle not set' });

    const cacheDate = todayKey();
    const existing = await RecommendationCache.findOne({ userId: req.userId, cacheDate });
    const hasAiProvider = Boolean(
      process.env.GOOGLE_GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY
    );

    if (existing && (!hasAiProvider || existing.generatedBy !== 'fallback')) {
      return res.json(existing);
    }

    let cfCache = await CachedCFData.findOne({ userId: req.userId });
    if (!cfCache || !isCacheFresh(cfCache.fetchedAt) || cfCache.handle !== user.cfHandle) {
      const cfData = await fetchCFData(user.cfHandle);
      cfCache = await CachedCFData.findOneAndUpdate(
        { userId: req.userId },
        {
          userId: req.userId,
          handle: user.cfHandle,
          ratingHistory: cfData.ratingHistory,
          submissions: cfData.submissions,
          fetchedAt: cfData.fetchedAt,
        },
        { new: true, upsert: true }
      );
    }

    const derived = buildCFDerivedStats(cfCache.submissions);
    const ai = await generateRecommendations(derived.weakTopics);
    const saved = await RecommendationCache.create({
      userId: req.userId,
      cacheDate,
      weakTopics: derived.weakTopics,
      recommendations: ai.recommendations,
      generatedBy: ai.generatedBy,
    });

    res.json(saved);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to generate recommendations', error: error.message });
  }
};
