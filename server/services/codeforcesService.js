import axios from 'axios';
import redisClient, { connectRedis } from '../config/redis.js';
import User from '../models/user.js';
import CachedCFData from '../models/CachedCFData.js';
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

const buildCFResponse = (cfData) => {
  const derived = buildCFDerivedStats(cfData.submissions);
  const currentRating = cfData.ratingHistory.length > 0
    ? cfData.ratingHistory[cfData.ratingHistory.length - 1].newRating
    : null;

  return {
    success: true,
    ...cfData,
    currentRating,
    solvedCount: derived.solvedCount,
    difficultyDistribution: derived.difficultyDistribution,
    topicStats: derived.topicStats,
    weakTopics: derived.weakTopics,
    acceptedProblemsByTopic: derived.acceptedProblemsByTopic,
    calendar: derived.calendar,
    recentSubmissions: derived.recentSubmissions,
  };
};

const persistCFData = async (userId, response) => {
  await CachedCFData.findOneAndUpdate(
    { userId },
    { ...response, userId },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

export const getCachedCFDataForUser = async (userId) => {
  const cacheKey = getCacheKey(userId);
  try {
    await connectRedis();
    const cachedValue = await redisClient.get(cacheKey);
    if (cachedValue) {
      const cachedResponse = JSON.parse(cachedValue);
      if (!cachedResponse.acceptedProblemsByTopic) {
        cachedResponse.acceptedProblemsByTopic = buildCFDerivedStats(cachedResponse.submissions).acceptedProblemsByTopic;
        await redisClient.setEx(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(cachedResponse));
      }
      return cachedResponse;
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
      const cachedResponse = JSON.parse(cachedValue);
      if (!cachedResponse.acceptedProblemsByTopic) {
        cachedResponse.acceptedProblemsByTopic = buildCFDerivedStats(cachedResponse.submissions).acceptedProblemsByTopic;
        await redisClient.setEx(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(cachedResponse));
      }
      return cachedResponse;
    }
  } catch (error) {
    console.error('Redis cache read failed:', error);
  }

  const persistedData = await CachedCFData.findOne({ userId, handle }).lean();
  if (persistedData) {
    const { _id, userId: persistedUserId, __v, ...response } = persistedData;
    response.success = true;
    try {
      await connectRedis();
      await redisClient.setEx(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(response));
    } catch (error) {
      console.error('Redis cache write failed:', error);
    }
    return response;
  }

  const response = buildCFResponse(await fetchCFData(handle));

  try {
    await persistCFData(userId, response);
    await connectRedis();
    await redisClient.setEx(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(response));
  } catch (error) {
    console.error('Redis cache write failed:', error);
  }

  return response;
};

export const refreshCFDataForUser = async (userId, handle) => {
  const response = buildCFResponse(await fetchCFData(handle));
  await persistCFData(userId, response);
  try {
    await connectRedis();
    await redisClient.setEx(getCacheKey(userId), CACHE_TTL_SECONDS, JSON.stringify(response));
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



