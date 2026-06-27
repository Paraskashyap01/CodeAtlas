import express from 'express';
import User from '../models/user.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.get('/leaderboard', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({}).select('email cfHandle lcHandle friends createdAt').lean();
    const leaderboard = users
      .map((user) => ({
        id: user._id,
        displayName: user.cfHandle || user.lcHandle || user.email,
        cfHandle: user.cfHandle || null,
        lcHandle: user.lcHandle || null,
        friendCount: user.friends?.length || 0,
      }))
      .sort((a, b) => b.friendCount - a.friendCount || a.displayName.localeCompare(b.displayName));

    res.json({ leaderboard });
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
