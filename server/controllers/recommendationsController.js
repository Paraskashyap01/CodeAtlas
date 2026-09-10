import RecommendationCache from '../models/RecommendationCache.js';
import User from '../models/user.js';
import { getCFDataForAuthenticatedUser } from '../services/codeforcesService.js';
import { generateRecommendations } from '../services/recommendationService.js';
import { httpError } from '../utils/errors.js';

const todayKey = () => new Date().toISOString().slice(0, 10);

export const getRecommendations = async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user?.cfHandle) throw httpError(400, 'Codeforces handle not set');

    const cacheDate = todayKey();
    const existing = await RecommendationCache.findOne({ userId: req.userId, cacheDate });
    // Only OpenAI is implemented; Gemini and Anthropic support not yet added
    const hasAiProvider = Boolean(process.env.OPENAI_API_KEY);

    if (existing && (!hasAiProvider || existing.generatedBy !== 'fallback')) {
      return res.json(existing);
    }

    const cfData = await getCFDataForAuthenticatedUser(req.userId);
    const ai = await generateRecommendations(cfData.weakTopics);
    const saved = await RecommendationCache.create({
      userId: req.userId,
      cacheDate,
      weakTopics: cfData.weakTopics,
      recommendations: ai.recommendations,
      generatedBy: ai.generatedBy,
    });

  res.json({ success: true, ...saved.toObject() });
};
