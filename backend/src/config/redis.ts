import Redis from 'ioredis';
import env from './env.js';

let redisClient: Redis | null = null;
let isRedisAvailable = false;

try {
  redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) {
        return null; // Stop retrying after 3 attempts
      }
      return Math.min(times * 500, 2000);
    },
    lazyConnect: true
  });

  redisClient.on('connect', () => {
    isRedisAvailable = true;
    console.log('[Redis] Connected successfully');
  });

  redisClient.on('error', (err) => {
    isRedisAvailable = false;
    // Log as warning rather than uncaught error
    console.warn('[Redis] Connection warning (running in degraded cache mode):', err.message);
  });

  // Attempt initial connect asynchronously
  redisClient.connect().catch((err) => {
    isRedisAvailable = false;
    console.warn('[Redis] Initial connection failed:', err.message);
  });
} catch (err: any) {
  redisClient = null;
  isRedisAvailable = false;
  console.warn('[Redis] Failed to initialize client:', err.message);
}

export const getRedisClient = (): Redis | null => {
  if (redisClient && isRedisAvailable) {
    return redisClient;
  }
  return null;
};

export const redisHealthCheck = async (): Promise<boolean> => {
  try {
    if (!redisClient) return false;
    const pong = await redisClient.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
};
