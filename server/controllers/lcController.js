import CachedLCData from '../models/CachedLCData.js';
import User from '../models/user.js';
import { fetchLCData, isCacheFresh } from '../services/leetcodeService.js';

export const getLCStats = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.lcHandle) {
      return res.status(400).json({ message: 'LeetCode handle not set' });
    }

    let cache = await CachedLCData.findOne({ userId: req.userId });
    if (cache && isCacheFresh(cache.fetchedAt) && cache.handle === user.lcHandle) {
      return res.json({ stats: cache.stats, handle: cache.handle, fetchedAt: cache.fetchedAt });
    }

    const lcData = await fetchLCData(user.lcHandle);
    const update = { handle: user.lcHandle, stats: lcData.stats, fetchedAt: lcData.fetchedAt };

    if (cache) {
      Object.assign(cache, update);
      await cache.save();
    } else {
      cache = await CachedLCData.create({ userId: req.userId, ...update });
    }

    res.json({ stats: cache.stats, handle: cache.handle, fetchedAt: cache.fetchedAt });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      stats: null,
      handle: user?.lcHandle || null,
      fetchedAt: null,
      error: error.message || 'Unable to fetch LeetCode stats',
    });
  }
};

