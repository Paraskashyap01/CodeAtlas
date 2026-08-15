import axios from 'axios';
import redisClient, { connectRedis } from '../config/redis.js';
import User from '../models/user.js';

const LC_API_BASE = process.env.LEETCODE_API_BASE || 'https://leetcode-api-pied.vercel.app';
const CACHE_TTL_SECONDS = 1800;

const client = axios.create({
  baseURL: LC_API_BASE,
  timeout: 10000,
});

const safeGet = async (path, fallback = null) => {
  try {
    const response = await client.get(path);
    return response.data;
  } catch (error) {
    if (fallback !== null) return fallback;
    const message = error.response?.status === 404
      ? 'LeetCode user not found.'
      : error.response?.status === 429
        ? 'LeetCode API rate limited this request. Please try again shortly.'
        : 'LeetCode API is temporarily unavailable.';
    throw new Error(message);
  }
};

export const fetchLCData = async (handle) => {
  const [profile, contests, submissions, badges, skills, calendarRaw, daily] = await Promise.all([
    safeGet(`/user/${encodeURIComponent(handle)}`),
    safeGet(`/user/${encodeURIComponent(handle)}/contests`, { userContestRanking: null, userContestRankingHistory: [] }),
    safeGet(`/user/${encodeURIComponent(handle)}/submissions`, []),
    safeGet(`/user/${encodeURIComponent(handle)}/badges`, { badges: [], upcomingBadges: [] }),
    safeGet(`/user/${encodeURIComponent(handle)}/skills`, { fundamental: [], intermediate: [], advanced: [] }),
    safeGet(`/user/${encodeURIComponent(handle)}/calendar`, null),
    safeGet('/daily', null),
  ]);

  const calendarData = calendarRaw?.submissionCalendar? {
        calendar: Object.entries(calendarRaw.submissionCalendar).map(([timestamp, count]) => ({
          date: new Date(parseInt(timestamp, 10) * 1000).toISOString().split('T')[0],
          count: parseInt(count, 10) || 0,
        })),
        streak: calendarRaw.streak || 0,
        totalActiveDays: calendarRaw.totalActiveDays || 0,
      }
    : { calendar: [], streak: 0, totalActiveDays: 0 };

  const acSubmissionNum = profile?.submitStats?.acSubmissionNum || [];
  const totalSubmissionNum = profile?.submitStats?.totalSubmissionNum || [];
  const findByDifficulty = (arr, difficulty) => arr.find((x) => x.difficulty === difficulty);

  return {
    handle,
    profile: {
      avatar: profile?.profile?.userAvatar ?? null,
      realName: profile?.profile?.realName ?? null,
      ranking: profile?.profile?.ranking ?? null,
      reputation: profile?.profile?.reputation ?? null,
      country: profile?.profile?.countryName ?? null,
      aboutMe: profile?.profile?.aboutMe ?? null,
      contestBadge: profile?.contestBadge ?? null,
    },
    solvedBreakdown: {
      all: findByDifficulty(acSubmissionNum, 'All')?.count ?? 0,
      easy: findByDifficulty(acSubmissionNum, 'Easy')?.count ?? 0,
      medium: findByDifficulty(acSubmissionNum, 'Medium')?.count ?? 0,
      hard: findByDifficulty(acSubmissionNum, 'Hard')?.count ?? 0,
    },
    totalBreakdown: {
      all: findByDifficulty(totalSubmissionNum, 'All')?.count ?? 0,
      easy: findByDifficulty(totalSubmissionNum, 'Easy')?.count ?? 0,
      medium: findByDifficulty(totalSubmissionNum, 'Medium')?.count ?? 0,
      hard: findByDifficulty(totalSubmissionNum, 'Hard')?.count ?? 0,
    },
    contestRanking: contests?.userContestRanking ?? null,
    contestHistory: contests?.userContestRankingHistory ?? [],
    submissions: (submissions ?? []).map((s) => ({
      ...s,
      problemUrl: s.titleSlug ? `https://leetcode.com/problems/${s.titleSlug}/` : null,
    })),
    badges: badges?.badges ?? [],
    upcomingBadges: badges?.upcomingBadges ?? [],
    skills: skills ?? { fundamental: [], intermediate: [], advanced: [] },
    calendar: calendarData.calendar,
    streak: calendarData.streak,
    totalActiveDays: calendarData.totalActiveDays,
    daily: daily ? { ...daily, question: daily.question ? { ...daily.question, problemUrl: daily.link ? `https://leetcode.com${daily.link}` : null } : null } : null,
    fetchedAt: new Date(),
  };
};

const getCacheKey = (userId) => `lc:user:${String(userId)}`;

export const getLCDataForUser = async (userId, handle) => {
  const cacheKey = getCacheKey(userId);

  try {
    await connectRedis();
    const cachedValue = await redisClient.get(cacheKey);
    if (cachedValue) {
      return JSON.parse(cachedValue);
    }
  } catch (error) {
    console.error('Redis cache read failed:', error);
  }

  const lcData = await fetchLCData(handle);
  const response = {
    success: true,
    ...lcData,
  };

  try {
    await connectRedis();
    await redisClient.setEx(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(response));
  } catch (error) {
    console.error('Redis cache write failed:', error);
  }

  return response;
};

export const getLCDataForAuthenticatedUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.lcHandle) {
    const error = new Error('LeetCode handle not set');
    error.statusCode = 400;
    throw error;
  }

  return getLCDataForUser(userId, user.lcHandle);
};
