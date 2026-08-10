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

export default redisClient;