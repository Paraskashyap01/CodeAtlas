import CachedLCData from '../models/CachedLCData.js';
import User from '../models/user.js';
import { fetchLCFullProfile, isCacheFresh } from '../services/leetcodeService.js';
import { apiError } from '../utils/validation.js';

// Fetches fresh data from the LeetCode API and upserts the cache document.
// Shared by both getLCStats (legacy/dashboard) and getLCProfile (new page)
// so there is only ever one cache write path.
const refreshCache = async (userId, handle, existingCache) => {
  const fresh = await fetchLCFullProfile(handle);

  const update = {
    handle,
    // legacy shape, kept for the existing dashboard stat cards
    stats: {
      submitStats: {
        acSubmissionNum: [
          { difficulty: 'All', count: fresh.solvedBreakdown.all },
          { difficulty: 'Easy', count: fresh.solvedBreakdown.easy },
          { difficulty: 'Medium', count: fresh.solvedBreakdown.medium },
          { difficulty: 'Hard', count: fresh.solvedBreakdown.hard },
        ],
        totalSubmissionNum: [
          { difficulty: 'All', count: fresh.totalBreakdown.all },
          { difficulty: 'Easy', count: fresh.totalBreakdown.easy },
          { difficulty: 'Medium', count: fresh.totalBreakdown.medium },
          { difficulty: 'Hard', count: fresh.totalBreakdown.hard },
        ],
      },
      ranking: {
        rating: fresh.contestRanking?.rating ?? null,
        globalRanking: fresh.contestRanking?.globalRanking ?? fresh.profile.ranking ?? null,
      },
    },
    calendar: fresh.calendar,
    // new, richer fields for the dedicated LeetCode page
    profile: fresh.profile,
    solvedBreakdown: fresh.solvedBreakdown,
    totalBreakdown: fresh.totalBreakdown,
    contestRanking: fresh.contestRanking,
    contestHistory: fresh.contestHistory,
    submissions: fresh.submissions,
    badges: fresh.badges,
    upcomingBadges: fresh.upcomingBadges,
    skills: fresh.skills,
    streak: fresh.streak,
    totalActiveDays: fresh.totalActiveDays,
    daily: fresh.daily,
    fetchedAt: fresh.fetchedAt,
  };

  if (existingCache) {
    Object.assign(existingCache, update);
    await existingCache.save();
    return existingCache;
  }
  return CachedLCData.create({ userId, ...update });
};

const getCacheOrRefresh = async (req) => {
  const user = await User.findById(req.userId);
  if (!user || !user.lcHandle) {
    return { error: 'LeetCode handle not set' };
  }

  let cache = await CachedLCData.findOne({ userId: req.userId });
  if (cache && isCacheFresh(cache.fetchedAt) && cache.handle === user.lcHandle) {
    return { cache };
  }

  cache = await refreshCache(req.userId, user.lcHandle, cache);
  return { cache };
};

// Legacy endpoint - powers the small stat cards on the main Dashboard.
// Response shape is unchanged so nothing there breaks.
export const getLCStats = async (req, res) => {
  try {
    const { cache, error } = await getCacheOrRefresh(req);
    if (error) return apiError(res, 400, error);

    res.json({
      success: true,
      stats: cache.stats,
      calendar: cache.calendar || [],
      handle: cache.handle,
      fetchedAt: cache.fetchedAt,
    });
  } catch (error) {
    console.error(error);
    apiError(res, 500, error.message || 'Unable to fetch LeetCode stats');
  }
};

// New endpoint - powers the dedicated /leetcode page (all tabs).
export const getLCProfile = async (req, res) => {
  try {
    const { cache, error } = await getCacheOrRefresh(req);
    if (error) return apiError(res, 400, error);

    res.json({
      success: true,
      handle: cache.handle,
      profile: cache.profile,
      solvedBreakdown: cache.solvedBreakdown,
      totalBreakdown: cache.totalBreakdown,
      contestRanking: cache.contestRanking,
      contestHistory: cache.contestHistory,
      submissions: cache.submissions,
      badges: cache.badges,
      upcomingBadges: cache.upcomingBadges,
      skills: cache.skills,
      calendar: cache.calendar || [],
      streak: cache.streak,
      totalActiveDays: cache.totalActiveDays,
      daily: cache.daily,
      fetchedAt: cache.fetchedAt,
    });
  } catch (error) {
    console.error(error);
    apiError(res, 500, error.message || 'Unable to fetch LeetCode profile');
  }
};
