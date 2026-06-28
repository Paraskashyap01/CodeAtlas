import CachedCFData from '../models/CachedCFData.js';
import User from '../models/user.js';
import { fetchCFData, isCacheFresh } from '../services/codeforcesService.js';
import { buildCFDerivedStats } from '../utils/cfStats.js';
import { apiError } from '../utils/validation.js';

export const getCFStats = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.cfHandle) {
      return apiError(res, 400, 'Codeforces handle not set');
    }

    let cache = await CachedCFData.findOne({ userId: req.userId });
    if (cache && isCacheFresh(cache.fetchedAt) && cache.handle === user.cfHandle) {
      const derived = buildCFDerivedStats(cache.submissions);
      return res.json({
        handle: cache.handle,
        ratingHistory: cache.ratingHistory,
        submissions: cache.submissions,
        fetchedAt: cache.fetchedAt,
        ...derived,
      });
    }

    const cfData = await fetchCFData(user.cfHandle);
    const update = {
      handle: user.cfHandle,
      ratingHistory: cfData.ratingHistory,
      submissions: cfData.submissions,
      fetchedAt: cfData.fetchedAt,
    };

    if (cache) {
      Object.assign(cache, update);
      await cache.save();
    } else {
      cache = await CachedCFData.create({ userId: req.userId, ...update });
    }

    const derived = buildCFDerivedStats(cache.submissions);

    res.json({
      success: true,
      handle: cache.handle,
      ratingHistory: cache.ratingHistory,
      submissions: cache.submissions,
      fetchedAt: cache.fetchedAt,
      ...derived,
    });
  } catch (error) {
    console.error(error);
    apiError(res, 500, 'Unable to fetch Codeforces stats');
  }
};
