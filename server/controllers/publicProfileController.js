import User from '../models/user.js';
import CodeforcesStats from '../models/CodeforcesStats.js';
import LeetCodeStats from '../models/LeetCodeStats.js';
import { httpError } from '../utils/errors.js';

export const getPublicProfile = async (req, res) => {
  const username = req.params.username;
  const user = await User.findOne({
    $or: [{ cfHandle: username }, { lcHandle: username }, { email: username }],
  }).select('cfHandle lcHandle createdAt');

  if (!user) throw httpError(404, 'Profile not found');

  const [cfData, lcData] = await Promise.all([
    user.cfHandle
      ? CodeforcesStats.findOne({ userId: user._id, handle: user.cfHandle })
        .select('handle currentRating solvedCount ratingHistory calendar fetchedAt')
        .lean()
      : null,
    user.lcHandle
      ? LeetCodeStats.findOne({ userId: user._id, handle: user.lcHandle })
        .select('handle solvedBreakdown totalBreakdown contestRanking calendar streak fetchedAt')
        .lean()
      : null,
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
};
