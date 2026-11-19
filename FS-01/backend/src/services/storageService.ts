import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import env from '../config/env.js';
import { getS3Client } from '../config/s3.js';
import { ApiError } from '../utils/apiError.js';

export interface UploadUrlResult {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

export interface IStorageProvider {
  generateUploadUrl(fileName: string, contentType: string): Promise<UploadUrlResult>;
  deleteFile(key: string): Promise<void>;
}

export class S3StorageProvider implements IStorageProvider {
  async generateUploadUrl(fileName: string, contentType: string): Promise<UploadUrlResult> {
    const s3 = getS3Client();
    if (!s3 || !env.AWS_S3_BUCKET) {
      throw ApiError.internal('S3 storage is not properly configured');
    }

    const ext = path.extname(fileName) || '.jpg';
    const key = `uploads/${Date.now()}-${uuidv4()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
      ContentType: contentType
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    const fileUrl = `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;

    return { uploadUrl, fileUrl, key };
  }

  async deleteFile(key: string): Promise<void> {
    const s3 = getS3Client();
    if (!s3 || !env.AWS_S3_BUCKET) return;

    await s3.send(
      new DeleteObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: key
      })
    );
  }
}

export class LocalStorageProvider implements IStorageProvider {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async generateUploadUrl(fileName: string, contentType: string): Promise<UploadUrlResult> {
    const ext = path.extname(fileName) || '.jpg';
    const key = `${Date.now()}-${uuidv4()}${ext}`;
    const uploadUrl = `${env.API_BASE_URL}/api/products/upload-local?key=${key}`;
    const fileUrl = `${env.API_BASE_URL}/uploads/${key}`;

    return { uploadUrl, fileUrl, key };
  }

  async deleteFile(key: string): Promise<void> {
    const filePath = path.join(this.uploadDir, key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

export const getStorageProvider = (): IStorageProvider => {
  if (env.STORAGE_PROVIDER === 's3') {
    return new S3StorageProvider();
  }
  return new LocalStorageProvider();
};

export default getStorageProvider;
