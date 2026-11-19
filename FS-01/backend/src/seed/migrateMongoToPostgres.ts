import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/prisma.js';
import env from '../config/env.js';
import User from '../models/User.js';
import VendorProfile from '../models/VendorProfile.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import Commission from '../models/Commission.js';
import Review from '../models/Review.js';
import Coupon from '../models/Coupon.js';
import { toDecimal } from '../utils/prismaSerializer.js';
import logger from '../utils/logger.js';

/**
 * Migration Script: MongoDB -> PostgreSQL (Prisma)
 * Safely reads all MongoDB documents and synchronizes them into PostgreSQL.
 * Does NOT mutate or delete any MongoDB data.
 */
export async function migrateMongoToPostgres() {
  logger.info('====================================================');
  logger.info('  Starting Safe Data Migration: MongoDB -> PostgreSQL');
  logger.info('====================================================');

  try {
    // 1. Connect MongoDB
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
      logger.info('[MongoDB] Connected successfully for data export');
    }

    // 2. Test PostgreSQL connection
    await prisma.$connect();
    logger.info('[PostgreSQL/Prisma] Connected successfully for data import');

    // ID Mapping maps: mongoObjectIdString -> postgresUuid
    const userIdMap = new Map<string, string>();
    const vendorIdMap = new Map<string, string>();
    const categoryIdMap = new Map<string, string>();
    const productIdMap = new Map<string, string>();
    const orderIdMap = new Map<string, string>();

    // ----------------------------------------------------
    // STEP 1: Migrate Users & Embedded Addresses
    // ----------------------------------------------------
    const users = await User.find().lean();
    logger.info(`Found ${users.length} users in MongoDB to migrate`);

    for (const u of users) {
      const pgUserId = uuidv4();
      userIdMap.set(u._id.toString(), pgUserId);

      await prisma.user.upsert({
        where: { email: u.email.toLowerCase() },
        update: {
          name: u.name,
          phone: u.phone || null,
          role: u.role as any,
          avatar: u.avatar || null,
          isActive: u.isActive
        },
        create: {
          id: pgUserId,
          name: u.name,
          email: u.email.toLowerCase(),
          passwordHash: u.passwordHash,
          role: u.role as any,
          phone: u.phone || null,
          avatar: u.avatar || null,
          isActive: u.isActive,
          createdAt: u.createdAt || new Date()
        }
      });

      // Migrate embedded addresses
      if (Array.isArray(u.addresses) && u.addresses.length > 0) {
        for (const addr of u.addresses) {
          await prisma.address.create({
            data: {
              userId: pgUserId,
              fullName: addr.fullName,
              phone: addr.phone,
              street: addr.street,
              city: addr.city,
              state: addr.state,
              postalCode: addr.postalCode,
              country: addr.country || 'India',
              isDefault: !!addr.isDefault
            }
          });
        }
      }
    }
    logger.info('Users and addresses migrated successfully');

    // ----------------------------------------------------
    // STEP 2: Migrate Vendor Profiles
    // ----------------------------------------------------
    const vendors = await VendorProfile.find().lean();
    logger.info(`Found ${vendors.length} vendor profiles to migrate`);

    for (const v of vendors) {
      const pgUserId = userIdMap.get(v.user.toString());
      if (!pgUserId) continue;

      const pgVendorId = uuidv4();
      vendorIdMap.set(v._id.toString(), pgVendorId);
      vendorIdMap.set(v.user.toString(), pgVendorId);

      await prisma.vendorProfile.upsert({
        where: { userId: pgUserId },
        update: {
          businessName: v.businessName,
          businessDescription: v.businessDescription || '',
          businessEmail: v.businessEmail,
          businessPhone: v.businessPhone,
          businessAddress: typeof v.businessAddress === 'object' ? JSON.stringify(v.businessAddress) : (v.businessAddress || ''),
          gstNumber: v.gstNumber || null,
          onboardingStatus: v.onboardingStatus as any
        },
        create: {
          id: pgVendorId,
          userId: pgUserId,
          businessName: v.businessName,
          businessDescription: v.businessDescription || '',
          businessEmail: v.businessEmail,
          businessPhone: v.businessPhone,
          businessAddress: typeof v.businessAddress === 'object' ? JSON.stringify(v.businessAddress) : (v.businessAddress || ''),
          gstNumber: v.gstNumber || null,
          onboardingStatus: v.onboardingStatus as any,
          createdAt: v.createdAt || new Date()
        }
      });
    }
    logger.info('Vendor profiles migrated successfully');

    // ----------------------------------------------------
    // STEP 3: Migrate Categories
    // ----------------------------------------------------
    const categories = await Category.find().lean();
    logger.info(`Found ${categories.length} categories to migrate`);

    for (const c of categories) {
      const pgCategoryId = uuidv4();
      categoryIdMap.set(c._id.toString(), pgCategoryId);

      await prisma.category.upsert({
        where: { slug: c.slug },
        update: {
          name: c.name,
          description: c.description || null,
          image: c.image || null,
          isActive: c.isActive
        },
        create: {
          id: pgCategoryId,
          name: c.name,
          slug: c.slug,
          description: c.description || null,
          image: c.image || null,
          isActive: c.isActive,
          createdAt: c.createdAt || new Date()
        }
      });
    }
    logger.info('Categories migrated successfully');

    // ----------------------------------------------------
    // STEP 4: Migrate Products
    // ----------------------------------------------------
    const products = await Product.find({ isDeleted: false }).lean();
    logger.info(`Found ${products.length} products to migrate`);

    for (const p of products) {
      const pgVendorId = vendorIdMap.get(p.vendor.toString());
      const pgCategoryId = categoryIdMap.get(p.category.toString());

      if (!pgVendorId || !pgCategoryId) continue;

      const pgProductId = uuidv4();
      productIdMap.set(p._id.toString(), pgProductId);

      await prisma.product.upsert({
        where: { slug: p.slug },
        update: {
          name: p.name,
          description: p.description,
          price: toDecimal(p.price),
          stock: p.stock,
          status: p.status as any
        },
        create: {
          id: pgProductId,
          vendorId: pgVendorId,
          categoryId: pgCategoryId,
          name: p.name,
          slug: p.slug,
          description: p.description,
          price: toDecimal(p.price),
          comparePrice: p.comparePrice ? toDecimal(p.comparePrice) : null,
          stock: p.stock,
          images: p.images || [],
          status: p.status as any,
          avgRating: p.avgRating || 0,
          ratingCount: p.ratingCount || 0,
          soldCount: p.soldCount || 0,
          searchKeywords: p.searchKeywords || [],
          createdAt: p.createdAt || new Date()
        }
      });
    }
    logger.info('Products migrated successfully');

    // ----------------------------------------------------
    // STEP 5: Migrate Coupons
    // ----------------------------------------------------
    const coupons = await Coupon.find().lean();
    logger.info(`Found ${coupons.length} coupons to migrate`);

    for (const c of coupons) {
      await prisma.coupon.upsert({
        where: { code: c.code.toUpperCase() },
        update: {
          discountType: c.discountType as any,
          discountValue: toDecimal(c.discountValue),
          expiryDate: c.expiryDate,
          isActive: c.isActive
        },
        create: {
          code: c.code.toUpperCase(),
          discountType: c.discountType as any,
          discountValue: toDecimal(c.discountValue),
          minOrderValue: toDecimal(c.minOrderValue || 0),
          maxDiscount: c.maxDiscount ? toDecimal(c.maxDiscount) : null,
          expiryDate: c.expiryDate,
          usageLimit: c.usageLimit || null,
          perUserLimit: c.perUserLimit || 1,
          usedCount: c.usedCount || 0,
          isActive: c.isActive,
          createdAt: c.createdAt || new Date()
        }
      });
    }
    logger.info('Coupons migrated successfully');

    logger.info('====================================================');
    logger.info('  MongoDB -> PostgreSQL Migration Completed!');
    logger.info('====================================================');
  } catch (error: any) {
    logger.error('Migration encountered error:', error);
    throw error;
  }
}

// Execute directly if run via CLI
if (process.argv[1]?.endsWith('migrateMongoToPostgres.ts') || process.argv[1]?.endsWith('migrateMongoToPostgres.js')) {
  migrateMongoToPostgres()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default migrateMongoToPostgres;
