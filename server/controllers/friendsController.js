import User from '../models/user.js';
import CodeforcesStats from '../models/CodeforcesStats.js';
import LeetCodeStats from '../models/LeetCodeStats.js';
import { isValidObjectId } from '../utils/validation.js';
import { httpError } from '../utils/errors.js';
import { buildLeaderboardData } from '../utils/leaderboard.js';

export const getLeaderboard = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const users = await User.find({})
      .select('email cfHandle lcHandle friends')
      .sort({ cfHandle: -1, email: 1 })
      .skip(skip)
      .limit(limit);
    const total = await User.countDocuments();
    const userIds = users.map((user) => user._id);
    const [cfStats, lcStats] = await Promise.all([
      CodeforcesStats.find({ userId: { $in: userIds } }).select('userId handle currentRating solvedCount').lean(),
      LeetCodeStats.find({ userId: { $in: userIds } }).select('userId handle solvedBreakdown').lean(),
    ]);
    const leaderboardData = buildLeaderboardData(users, cfStats, lcStats);

  res.json({
      success: true,
      leaderboard: leaderboardData,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

export const addFriend = async (req, res) => {
  const targetId = req.body.userId;
  if (!targetId) throw httpError(400, 'userId is required');

  if (!isValidObjectId(targetId)) throw httpError(400, 'Invalid userId format');

    const currentUser = await User.findById(req.userId);
    const targetUser = await User.findById(targetId);

  if (!currentUser || !targetUser) throw httpError(404, 'User not found');

  if (currentUser._id.equals(targetUser._id)) throw httpError(400, 'You cannot add yourself');

  if (!targetUser.cfHandle && !targetUser.lcHandle) {
    throw httpError(400, 'Target user must have a Codeforces or LeetCode handle set');
  }

    if (!currentUser.friends.includes(targetUser._id)) {
      currentUser.friends.push(targetUser._id);
      await currentUser.save();
    }

  res.json({ success: true, friends: currentUser.friends });
};
