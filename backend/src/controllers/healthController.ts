import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prismaHealthCheck } from '../config/prisma.js';
import { redisHealthCheck } from '../config/redis.js';
import { esHealthCheck } from '../config/elasticsearch.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import env from '../config/env.js';

export const getHealth = asyncHandler(async (_req: Request, res: Response) => {
  const pgHealthy = await prismaHealthCheck();
  const redisHealthy = await redisHealthCheck();
  const esHealthy = await esHealthCheck();

  const services = {
    postgresql: {
      status: pgHealthy ? 'connected' : 'disconnected',
      healthy: pgHealthy,
      provider: 'prisma'
    },
    redis: {
      status: redisHealthy ? 'connected' : 'unavailable (fallback to db)',
      healthy: redisHealthy
    },
    elasticsearch: {
      status: esHealthy ? 'connected' : 'unavailable',
      healthy: esHealthy
    },
    storage: {
      provider: env.STORAGE_PROVIDER,
      healthy: true
    },
    payment: {
      provider: env.PAYMENT_PROVIDER,
      testMode: true
    }
  };

  const isOverallHealthy = pgHealthy;

  return res.status(isOverallHealthy ? StatusCodes.OK : StatusCodes.SERVICE_UNAVAILABLE).json({
    status: isOverallHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    activeDatabase: 'postgresql',
    services
  });
});
