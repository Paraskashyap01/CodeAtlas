import axios from 'axios';
import redisClient, { connectRedis } from '../config/redis.js';
import User from '../models/user.js';
import LeetCodeStats from '../models/LeetCodeStats.js';
import { isFresh } from '../utils/cacheFreshness.js';

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

const buildAcceptedProblems = (submissions = []) => {
  const acceptedProblems = [];
  const seenAcceptedProblems = new Set();
  for (const submission of submissions) {
    if (submission.statusDisplay !== 'Accepted') continue;
    const key = submission.frontendId || submission.title;
    if (!key || seenAcceptedProblems.has(key)) continue;
    seenAcceptedProblems.add(key);
    acceptedProblems.push({
      title: submission.title,
      frontendId: submission.frontendId ?? null,
      url: submission.titleSlug ? `https://leetcode.com/problems/${submission.titleSlug}/` : null,
      lang: submission.langName || submission.lang || null,
    });
  }
  return acceptedProblems;
};

const normalizeRecentSubmission = (submission) => ({
  id: submission.id ?? null,
  title: submission.title ?? null,
  langName: submission.langName ?? submission.lang ?? null,
  statusDisplay: submission.statusDisplay ?? null,
  timestamp: submission.timestamp ?? null,
});

export const buildAcceptedByWeek = (submissions = []) => {
  const acceptedByWeek = new Map();
  for (const submission of submissions) {
    if (submission.statusDisplay !== 'Accepted') continue;
    const timestamp = Number(submission.timestamp);
    const problemKey = submission.frontendId || submission.titleSlug || submission.title;
    if (!Number.isFinite(timestamp) || !problemKey) continue;

    const acceptedDate = new Date(timestamp * 1000);
    acceptedDate.setUTCHours(0, 0, 0, 0);
    const day = acceptedDate.getUTCDay();
    acceptedDate.setUTCDate(acceptedDate.getUTCDate() + (day === 0 ? -6 : 1 - day));
    const weekKey = acceptedDate.toISOString().slice(0, 10);
    const weekProblems = acceptedByWeek.get(weekKey) || new Set();
    weekProblems.add(problemKey);
    acceptedByWeek.set(weekKey, weekProblems);
  }

  return Object.fromEntries(
    [...acceptedByWeek.entries()].map(([week, problems]) => [week, problems.size])
  );
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
    acceptedProblems: buildAcceptedProblems(submissions),
    acceptedByWeek: buildAcceptedByWeek(submissions),
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

const persistLCData = async (userId, response) => {
  const recentSubmissions = response.submissions
    .slice(0, 50)
    .map(normalizeRecentSubmission);
  const persistedResponse = {
    ...response,
    submissions: recentSubmissions,
    recentSubmissions,
  };
  await LeetCodeStats.findOneAndUpdate(
    { userId },
    { ...persistedResponse, userId },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

export const clearLCDataForUser = async (userId) => {
  await LeetCodeStats.deleteOne({ userId });
  try {
    await connectRedis();
    await redisClient.del(getCacheKey(userId));
  } catch (error) {
    console.error('Redis cache invalidation failed:', error);
  }
};

export const getLCDataForUser = async (userId, handle) => {
  const cacheKey = getCacheKey(userId);

  try {
    await connectRedis();
    const cachedValue = await redisClient.get(cacheKey);
    if (cachedValue) {
      const cachedResponse = JSON.parse(cachedValue);
      if (isFresh(cachedResponse.fetchedAt)) {
        if (!cachedResponse.acceptedProblems) {
          cachedResponse.acceptedProblems = buildAcceptedProblems(cachedResponse.submissions);
          await redisClient.setEx(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(cachedResponse));
        }
        return cachedResponse;
      }
    }
  } catch (error) {
    console.error('Redis cache read failed:', error);
  }

  const persistedData = await LeetCodeStats.findOne({ userId, handle }).lean();
  if (persistedData) {
    const { _id, userId: persistedUserId, __v, ...response } = persistedData;
    response.success = true;
    response.submissions = response.recentSubmissions || response.submissions || [];
    if (isFresh(response.fetchedAt)) {
      try {
        await connectRedis();
        await redisClient.setEx(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(response));
      } catch (error) {
        console.error('Redis cache write failed:', error);
      }
      return response;
    }

    try {
      return await refreshLCDataForUser(userId, handle);
    } catch (error) {
      console.warn('LeetCode refresh failed; returning stale MongoDB data:', error.message);
      return response;
    }
  }

  const lcData = await fetchLCData(handle);
  const response = {
    success: true,
    ...lcData,
  };

  try {
    await persistLCData(userId, response);
    await connectRedis();
    await redisClient.setEx(cacheKey, CACHE_TTL_SECONDS, JSON.stringify({
      ...response,
      submissions: response.submissions.slice(0, 50),
    }));
  } catch (error) {
    console.error('Redis cache write failed:', error);
  }

  return response;
};

export const refreshLCDataForUser = async (userId, handle) => {
  const response = { success: true, ...(await fetchLCData(handle)) };
  await persistLCData(userId, response);
  try {
    await connectRedis();
    await redisClient.setEx(getCacheKey(userId), CACHE_TTL_SECONDS, JSON.stringify({
      ...response,
      submissions: response.submissions.slice(0, 50),
    }));
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
