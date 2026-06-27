import CachedCFData from '../models/CachedCFData.js';
import CachedLCData from '../models/CachedLCData.js';
import User from '../models/user.js';
import { buildCFDerivedStats } from '../utils/cfStats.js';

export const getPublicProfile = async (req, res) => {
  try {
    const username = req.params.username;
    const user = await User.findOne({
      $or: [{ cfHandle: username }, { lcHandle: username }, { email: username }],
    }).select('email cfHandle lcHandle createdAt');

    if (!user) return res.status(404).json({ message: 'Profile not found' });

    const [cfCache, lcCache] = await Promise.all([
      CachedCFData.findOne({ userId: user._id }),
      CachedLCData.findOne({ userId: user._id }),
    ]);

    const cfStats = cfCache ? buildCFDerivedStats(cfCache.submissions) : null;

    res.json({
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
    res.status(500).json({ message: 'Unable to fetch public profile' });
  }
};
