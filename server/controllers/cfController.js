import User from '../models/user.js';
import redisClient from '../config/redis.js';
import { fetchCFData } from '../services/codeforcesService.js';
import { buildCFDerivedStats } from '../utils/cfStats.js';
import { apiError } from '../utils/validation.js';

const CACHE_TTL_SECONDS = 1800;

const getCacheKey = (userId) => `cf:user:${String(userId)}`;

export const getCFStats = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.cfHandle) {
      return apiError(res, 400, 'Codeforces handle not set');
    }

    const cacheKey = getCacheKey(req.userId);

    try {
      const cachedValue = await redisClient.get(cacheKey);
      if (cachedValue) {
        const cachedResponse = JSON.parse(cachedValue);
        return res.json(cachedResponse);
      }
    } catch (error) {
      console.error('Redis cache read failed:', error);
    }

    const cfData = await fetchCFData(user.cfHandle);
    const derived = buildCFDerivedStats(cfData.submissions);

    const response = {
      success: true,
      handle: user.cfHandle,
      ratingHistory: cfData.ratingHistory,
      submissions: cfData.submissions,
      fetchedAt: cfData.fetchedAt,
      ...derived,
    };

    try {
      await redisClient.setEx(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(response));
    } catch (error) {
      console.error('Redis cache write failed:', error);
    }

    return res.json(response);
  } catch (error) {
    console.error(error);
    return apiError(res, 500, 'Unable to fetch Codeforces stats');
  }
};

