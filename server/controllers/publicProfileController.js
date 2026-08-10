import CachedLCData from '../models/CachedLCData.js';
import User from '../models/user.js';
import { getCFDataForUser } from '../services/codeforcesService.js';
import { apiError } from '../utils/validation.js';

export const getPublicProfile = async (req, res) => {
  try {
    const username = req.params.username;
    const user = await User.findOne({
      $or: [{ cfHandle: username }, { lcHandle: username }, { email: username }],
    }).select('email cfHandle lcHandle createdAt');

    if (!user) return apiError(res, 404, 'Profile not found');

    const [cfData, lcCache] = await Promise.all([
      user.cfHandle ? getCFDataForUser(user._id, user.cfHandle) : null,
      CachedLCData.findOne({ userId: user._id }),
    ]);

    res.json({
      success: true,
      profile: {
        id: user._id,
        displayName: user.cfHandle || user.lcHandle || user.email,
        cfHandle: user.cfHandle,
        lcHandle: user.lcHandle,
        joinedAt: user.createdAt,
      },
      codeforces: cfData
        ? { handle: cfData.handle, fetchedAt: cfData.fetchedAt, ratingHistory: cfData.ratingHistory, currentRating: cfData.currentRating, solvedCount: cfData.solvedCount, difficultyDistribution: cfData.difficultyDistribution, topicStats: cfData.topicStats, weakTopics: cfData.weakTopics, calendar: cfData.calendar, recentSubmissions: cfData.recentSubmissions }
        : null,
      leetcode: lcCache ? { handle: lcCache.handle, stats: lcCache.stats, fetchedAt: lcCache.fetchedAt } : null,
    });
  } catch (error) {
    console.error(error);
    apiError(res, 500, 'Unable to fetch public profile');
  }
};
