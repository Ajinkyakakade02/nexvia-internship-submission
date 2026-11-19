import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from server dir first, fallback to root dir
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().default('https://frontend-sooty-two-50.vercel.app'),
  API_BASE_URL: z.string().default('http://localhost:5000'),
  MONGODB_URI: z.string().optional().default(''),

  DATABASE_URL: z
    .string()
    .default(
      'postgresql://neondb_owner:npg_VRmS2DyeXW5P@ep-broad-water-a1ks0ls4-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=30'
    ),
  DIRECT_URL: z
    .string()
    .default(
      'postgresql://neondb_owner:npg_VRmS2DyeXW5P@ep-broad-water-a1ks0ls4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
    ),
  DB_PROVIDER: z.string().default('prisma'),

  JWT_ACCESS_SECRET: z.string().default('dev_jwt_access_secret_key_1234567890_min_32_chars_fs01'),
  JWT_REFRESH_SECRET: z.string().default('dev_jwt_refresh_secret_key_1234567890_min_32_chars_fs01'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  REDIS_URL: z
    .string()
    .default(
      'rediss://default:gQAAAAAAAyuWAAIgcDI3OWRhMzNkOWJlMWI0NTI2YTg2ZDVmMjY5MWQwMzMxNg@absolute-possum-207766.upstash.io:6379'
    ),

  ELASTICSEARCH_URL: z.string().default('http://localhost:9200'),
  ELASTICSEARCH_USERNAME: z.string().optional().default(''),
  ELASTICSEARCH_PASSWORD: z.string().optional().default(''),

  AWS_REGION: z.string().default('ap-south-1'),
  AWS_S3_BUCKET: z.string().optional().default(''),
  AWS_ACCESS_KEY_ID: z.string().optional().default(''),
  AWS_SECRET_ACCESS_KEY: z.string().optional().default(''),
  STORAGE_PROVIDER: z.enum(['s3', 'local']).default('local'),

  RAZORPAY_KEY_ID: z.string().optional().default(''),
  RAZORPAY_KEY_SECRET: z.string().optional().default(''),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default(''),
  PAYMENT_PROVIDER: z.enum(['razorpay', 'simulation']).default('simulation'),

  PLATFORM_NAME: z.string().default('NexMart'),
  PLATFORM_COMMISSION_PERCENT: z.coerce.number().default(10),
  DEFAULT_CURRENCY: z.string().default('INR'),

  ADMIN_EMAIL: z.string().default('admin@nexmart.com'),
  ADMIN_PASSWORD: z.string().default('Admin@12345'),
  ADMIN_NAME: z.string().default('Platform Admin'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(20)
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.format());
  throw new Error('Environment variable validation failed');
}

export const env = parsedEnv.data;
export default env;
