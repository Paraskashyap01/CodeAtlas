import CachedCFData from '../models/CachedCFData.js';
import CachedLCData from '../models/CachedLCData.js';
import User from '../models/user.js';
import { buildCFDerivedStats } from '../utils/cfStats.js';
import { apiError } from '../utils/validation.js';

export const getPublicProfile = async (req, res) => {
  try {
    const username = req.params.username;
    const user = await User.findOne({
      $or: [{ cfHandle: username }, { lcHandle: username }, { email: username }],
    }).select('email cfHandle lcHandle createdAt');

    if (!user) return apiError(res, 404, 'Profile not found');

    const [cfCache, lcCache] = await Promise.all([
      CachedCFData.findOne({ userId: user._id }),
      CachedLCData.findOne({ userId: user._id }),
    ]);

    const cfStats = cfCache ? buildCFDerivedStats(cfCache.submissions) : null;

    res.json({
      success: true,
      profile: {
        id: user._id,
        displayName: user.cfHandle || user.lcHandle || user.email,
        cfHandle: user.cfHandle,
        lcHandle: user.lcHandle,
        joinedAt: user.createdAt,
      },
      codeforces: cfCache
        ? { handle: cfCache.handle, fetchedAt: cfCache.fetchedAt, ratingHistory: cfCache.ratingHistory, ...cfStats }
        : null,
      leetcode: lcCache ? { handle: lcCache.handle, stats: lcCache.stats, fetchedAt: lcCache.fetchedAt } : null,
    });
  } catch (error) {
    console.error(error);
    apiError(res, 500, 'Unable to fetch public profile');
  }
};
