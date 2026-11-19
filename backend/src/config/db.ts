import mongoose from 'mongoose';
import env from './env.js';

let isConnected = false;

export const connectDB = async (retries = 5, interval = 5000): Promise<void> => {
  if (isConnected) {
    return;
  }

  mongoose.connection.on('connected', () => {
    console.log('[MongoDB] Connected successfully');
    isConnected = true;
  });

  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] Connection error:', err);
    isConnected = false;
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Disconnected');
    isConnected = false;
  });

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(env.MONGODB_URI);
      isConnected = true;
      return;
    } catch (error) {
      console.error(`[MongoDB] Connection attempt ${attempt} failed:`, error);
      if (attempt === retries) {
        throw new Error(`Failed to connect to MongoDB after ${retries} attempts`);
      }
      await new Promise((res) => setTimeout(res, interval));
    }
  }
};

export const disconnectDB = async (): Promise<void> => {
  if (!isConnected && mongoose.connection.readyState === 0) {
    return;
  }
  await mongoose.disconnect();
  isConnected = false;
  console.log('[MongoDB] Disconnected gracefully');
};
