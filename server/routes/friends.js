import express from 'express';
import User from '../models/user.js';
import CachedCFData from '../models/CachedCFData.js';
import authMiddleware from '../middleware/auth.js';
import { isValidObjectId, apiError } from '../utils/validation.js';

const router = express.Router();

router.get('/leaderboard', authMiddleware, async (req, res) => {
  try {
    // Pagination: default 20 per page, max 100
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    // Use aggregation to join User with CachedCFData for real CP stats
    const totalResult = await User.aggregate([
      {
        $lookup: {
          from: 'cachedcfdatas',
          localField: '_id',
          foreignField: 'userId',
          as: 'cfData',
        },
      },
      {
        $project: {
          email: 1,
          cfHandle: 1,
          lcHandle: 1,
          friends: 1,
          // Extract CF stats from the joined data
          cfRating: { $arrayElemAt: ['$cfData.currentRating', 0] },
          cfSolvedCount: { $arrayElemAt: ['$cfData.solvedCount', 0] },
        },
      },
      { $sort: { cfHandle: -1, cfRating: -1, cfSolvedCount: -1, email: 1 } },
      { $count: 'total' },
    ]);
    const total = totalResult[0]?.total || 0;

    const leaderboard = await User.aggregate([
      {
        $lookup: {
          from: 'cachedcfdatas',
          localField: '_id',
          foreignField: 'userId',
          as: 'cfData',
        },
      },
      {
        $project: {
          email: 1,
          cfHandle: 1,
          lcHandle: 1,
          friends: 1,
          cfRating: { $arrayElemAt: ['$cfData.currentRating', 0] },
          cfSolvedCount: { $arrayElemAt: ['$cfData.solvedCount', 0] },
        },
      },
      { $sort: { cfHandle: -1, cfRating: -1, cfSolvedCount: -1, email: 1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const leaderboardData = leaderboard.map((user) => ({
      id: user._id,
      displayName: user.cfHandle || user.lcHandle || user.email,
      cfHandle: user.cfHandle || null,
      lcHandle: user.lcHandle || null,
      cfRating: user.cfRating || null,
      cfSolvedCount: user.cfSolvedCount || null,
      friendCount: user.friends?.length || 0,
    }));

    res.json({ success: true, leaderboard: leaderboardData, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error(error);
    apiError(res, 500, 'Unable to load leaderboard');
  }
});

router.post('/add', authMiddleware, async (req, res) => {
  try {
    const targetId = req.body.userId;
    if (!targetId) {
      return apiError(res, 400, 'userId is required');
    }

    // Validate ObjectId format
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
    // Validate that target user has at least one handle set (CF or LC)
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
});

export default router;
