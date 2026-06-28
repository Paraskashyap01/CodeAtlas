import express from 'express';
import User from '../models/user.js';
import CachedCFData from '../models/CachedCFData.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.get('/leaderboard', authMiddleware, async (req, res) => {
  try {
    // Use aggregation to join User with CachedCFData for real CP stats
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
          // Extract CF stats from the joined data
          cfRating: { $arrayElemAt: ['$cfData.currentRating', 0] },
          cfSolvedCount: { $arrayElemAt: ['$cfData.solvedCount', 0] },
        },
      },
      {
        $sort: {
          // Sort by: has CF handle → CF rating (desc) → problems solved (desc) → name
          cfHandle: -1,
          cfRating: -1,
          cfSolvedCount: -1,
          email: 1,
        },
      },
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

    res.json({ leaderboard: leaderboardData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to load leaderboard' });
  }
});

router.post('/add', authMiddleware, async (req, res) => {
  try {
    const targetId = req.body.userId;
    if (!targetId) return res.status(400).json({ message: 'userId is required' });

    const currentUser = await User.findById(req.userId);
    const targetUser = await User.findById(targetId);

    if (!currentUser || !targetUser) return res.status(404).json({ message: 'User not found' });
    if (currentUser._id.equals(targetUser._id)) return res.status(400).json({ message: 'You cannot add yourself' });
    // Validate that target user has at least one handle set (CF or LC)
    if (!targetUser.cfHandle && !targetUser.lcHandle) {
      return res.status(400).json({ message: 'Target user must have a Codeforces or LeetCode handle set' });
    }

    if (!currentUser.friends.includes(targetUser._id)) {
      currentUser.friends.push(targetUser._id);
      await currentUser.save();
    }

    res.json({ friends: currentUser.friends });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to add friend' });
  }
});

export default router;
