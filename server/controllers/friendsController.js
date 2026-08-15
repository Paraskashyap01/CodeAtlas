import User from '../models/user.js';
import { getCFDataForUser } from '../services/codeforcesService.js';
import { getLCDataForUser } from '../services/leetcodeService.js';
import { isValidObjectId, apiError } from '../utils/validation.js';

export const getLeaderboard = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const users = await User.find({})
      .select('email cfHandle lcHandle friends')
      .sort({ cfHandle: -1, email: 1 })
      .skip(skip)
      .limit(limit);
    const total = await User.countDocuments();

    const leaderboardData = await Promise.all(
      users.map(async (user) => {
        const cfData = user.cfHandle ? await getCFDataForUser(user._id, user.cfHandle) : null;
        const lcData = user.lcHandle ? await getLCDataForUser(user._id, user.lcHandle) : null;
        return {
          id: user._id,
          displayName: user.cfHandle || user.lcHandle || user.email,
          cfHandle: user.cfHandle || null,
          lcHandle: user.lcHandle || null,
          cfRating: cfData?.currentRating ?? null,
          cfSolvedCount: cfData?.solvedCount ?? null,
          lcSolvedCount: lcData?.solvedBreakdown?.all ?? null,
          friendCount: user.friends?.length || 0,
        };
      })
    );

    res.json({
      success: true,
      leaderboard: leaderboardData,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error(error);
    apiError(res, 500, 'Unable to load leaderboard');
  }
};

export const addFriend = async (req, res) => {
  try {
    const targetId = req.body.userId;
    if (!targetId) {
      return apiError(res, 400, 'userId is required');
    }

    if (!isValidObjectId(targetId)) {
      return apiError(res, 400, 'Invalid userId format');
    }

    const currentUser = await User.findById(req.userId);
    const targetUser = await User.findById(targetId);

    if (!currentUser || !targetUser) {
      return apiError(res, 404, 'User not found');
    }

    if (currentUser._id.equals(targetUser._id)) {
      return apiError(res, 400, 'You cannot add yourself');
    }

    if (!targetUser.cfHandle && !targetUser.lcHandle) {
      return apiError(res, 400, 'Target user must have a Codeforces or LeetCode handle set');
    }

    if (!currentUser.friends.includes(targetUser._id)) {
      currentUser.friends.push(targetUser._id);
      await currentUser.save();
    }

    res.json({ success: true, friends: currentUser.friends });
  } catch (error) {
    console.error(error);
    apiError(res, 500, 'Unable to add friend');
  }
};
