import axios from 'axios';
import redisClient, { connectRedis } from '../config/redis.js';
import User from '../models/user.js';
import { buildCFDerivedStats } from '../utils/cfStats.js';

const CF_BASE = 'https://codeforces.com/api';
const CACHE_TTL_SECONDS = 1800;

export const fetchCFData = async (handle) => {
  const [userInfoResponse, ratingResponse, submissionsResponse] = await Promise.all([
    axios.get(`${CF_BASE}/user.info`, { params: { handles: handle } }),
    axios.get(`${CF_BASE}/user.rating`, { params: { handle } }),
    axios.get(`${CF_BASE}/user.status`, { params: { handle, from: 1, count: 1000 } }),
  ]);

  if (userInfoResponse.data.status !== 'OK') {
    throw new Error('Unable to fetch Codeforces user info');
  }

  return {
    handle,
    userInfo: userInfoResponse.data.result[0] || null,
    ratingHistory: ratingResponse.data.status === 'OK' ? ratingResponse.data.result : [],
    submissions: submissionsResponse.data.status === 'OK' ? submissionsResponse.data.result : [],
    fetchedAt: new Date(),
  };
};

const getCacheKey = (userId) => `cf:user:${String(userId)}`;

export const getCachedCFDataForUser = async (userId) => {
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

  return null;
};

export const getCFDataForUser = async (userId, handle) => {
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

  const cfData = await fetchCFData(handle);
  const derived = buildCFDerivedStats(cfData.submissions);
  const currentRating = cfData.ratingHistory.length > 0 ? cfData.ratingHistory[cfData.ratingHistory.length - 1].newRating : null;

  const response = {
    success: true,
    handle: cfData.handle,
    ratingHistory: cfData.ratingHistory,
    submissions: cfData.submissions,
    fetchedAt: cfData.fetchedAt,
    currentRating,
    solvedCount: derived.solvedCount,
    difficultyDistribution: derived.difficultyDistribution,
    topicStats: derived.topicStats,
    weakTopics: derived.weakTopics,
    calendar: derived.calendar,
    recentSubmissions: derived.recentSubmissions,
  };

  try {
    await connectRedis();
    await redisClient.setEx(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(response));
  } catch (error) {
    console.error('Redis cache write failed:', error);
  }

  return response;
};

export const getCFDataForAuthenticatedUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.cfHandle) {
    const error = new Error('Codeforces handle not set');
    error.statusCode = 400;
    throw error;
  }

  return getCFDataForUser(userId, user.cfHandle);
};



