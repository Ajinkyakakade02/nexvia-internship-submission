import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import env from '../config/env.js';
import { UserRole } from '../types/index.js';
import logger from '../utils/logger.js';

const seedAdmin = async () => {
  try {
    if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
      logger.error('ADMIN_EMAIL and ADMIN_PASSWORD must be defined in .env to run admin seed');
      process.exit(1);
    }

    await connectDB();

    const existingAdmin = await User.findOne({ email: env.ADMIN_EMAIL.toLowerCase() });
    if (existingAdmin) {
      logger.info(`Admin user already exists: ${env.ADMIN_EMAIL}`);
      await disconnectDB();
      process.exit(0);
    }

    const admin = new User({
      name: env.ADMIN_NAME || 'Platform Administrator',
      email: env.ADMIN_EMAIL.toLowerCase(),
      passwordHash: env.ADMIN_PASSWORD, // Pre-save hook hashes this
      role: UserRole.ADMIN,
      isActive: true
    });

    await admin.save();
    logger.info(`Admin account created successfully: ${admin.email}`);

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding admin user:', error);
    process.exit(1);
  }
};

seedAdmin();

