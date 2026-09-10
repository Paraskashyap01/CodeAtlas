import { createClient } from 'redis';
import './env.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redisClient = createClient({
  url: REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 5) return false;
      return Math.min(retries * 250, 2000);
    },
  },
});

let redisReady = false;

redisClient.on('error', (err) => {
  if (!redisReady) {
    console.warn('Redis unavailable at startup:', err.message);
    return;
  }
  console.warn('Redis error:', err.message);
});

export const connectRedis = async () => {
  if (redisClient.isOpen) return redisClient;

  try {
    await redisClient.connect();
    redisReady = true;
    console.log('Redis connected');
    return redisClient;
  } catch (error) {
    redisReady = false;
    console.warn('Redis connection failed:', error.message);
    return redisClient;
  }
};

export const getRedisValue = async (key) => {
  if (!redisClient.isReady) return null;
  try {
    return await redisClient.get(key);
  } catch (error) {
    console.warn('Redis cache read skipped:', error.message);
    return null;
  }
};

export const getRedisJson = async (key) => {
  const value = await getRedisValue(key);
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn('Redis cache entry ignored because it is invalid JSON:', error.message);
    return null;
  }
};

export const setRedisValue = async (key, ttlSeconds, value) => {
  if (!redisClient.isReady) return;
  try {
    await redisClient.setEx(key, ttlSeconds, value);
  } catch (error) {
    console.warn('Redis cache write skipped:', error.message);
  }
};

export const deleteRedisValue = async (key) => {
  if (!redisClient.isReady) return;
  try {
    await redisClient.del(key);
  } catch (error) {
    console.warn('Redis cache invalidation skipped:', error.message);
  }
};

export default redisClient;