import User from '../models/user.js';
import { getCFDataForUser } from '../services/codeforcesService.js';
import { getLCDataForUser } from '../services/leetcodeService.js';
import { apiError } from '../utils/validation.js';

export const getPublicProfile = async (req, res) => {
  try {
    const username = req.params.username;
    const user = await User.findOne({
      $or: [{ cfHandle: username }, { lcHandle: username }, { email: username }],
    }).select('cfHandle lcHandle createdAt');

    if (!user) return apiError(res, 404, 'Profile not found');

    const [cfData, lcData] = await Promise.all([
      user.cfHandle ? getCFDataForUser(user._id, user.cfHandle) : null,
      user.lcHandle ? getLCDataForUser(user._id, user.lcHandle) : null,
    ]);

    res.json({
      success: true,
      profile: {
        id: user._id,
        displayName: user.cfHandle || user.lcHandle || username,
        cfHandle: user.cfHandle || null,
        lcHandle: user.lcHandle || null,
        joinedAt: user.createdAt,
      },
      codeforces: cfData
        ? {
            handle: cfData.handle,
            currentRating: cfData.currentRating,
            solvedCount: cfData.solvedCount,
            ratingHistory: cfData.ratingHistory,
            calendar: cfData.calendar,
            fetchedAt: cfData.fetchedAt,
          }
        : null,
      leetcode: lcData
        ? {
            handle: lcData.handle,
            solvedBreakdown: lcData.solvedBreakdown,
            totalBreakdown: lcData.totalBreakdown,
            contestRanking: lcData.contestRanking,
            calendar: lcData.calendar,
            streak: lcData.streak,
            totalActiveDays: lcData.totalActiveDays,
            fetchedAt: lcData.fetchedAt,
          }
        : null,
    });
  } catch (error) {
    console.error(error);
    apiError(res, 500, 'Unable to fetch public profile');
  }
};
