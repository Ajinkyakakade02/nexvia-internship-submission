import { S3Client } from '@aws-sdk/client-s3';
import env from './env.js';

let s3Client: S3Client | null = null;

if (env.STORAGE_PROVIDER === 's3' && env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
  s3Client = new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY
    }
  });
  console.log('[S3] Initialized AWS S3 client');
} else {
  console.log('[S3] Running with local storage provider');
}

export const getS3Client = (): S3Client | null => {
  return s3Client;
};

export default s3Client;
