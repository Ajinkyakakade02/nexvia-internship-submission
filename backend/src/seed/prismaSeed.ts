import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';
import env from '../config/env.js';
import { UserRole, OnboardingStatus, ProductStatus, DiscountType } from '../types/index.js';
import { toDecimal } from '../utils/prismaSerializer.js';
import logger from '../utils/logger.js';

export async function seedPrisma() {
  logger.info('====================================================');
  logger.info('  Seeding PostgreSQL via Prisma');
  logger.info('====================================================');

  try {
    await prisma.$connect();

    // 1. Seed Admin
    const salt = await bcrypt.genSalt(12);
    const adminPasswordHash = await bcrypt.hash(env.ADMIN_PASSWORD || 'Admin@12345', salt);

    const admin = await prisma.user.upsert({
      where: { email: env.ADMIN_EMAIL.toLowerCase() },
      update: {
        role: UserRole.ADMIN,
        isActive: true
      },
      create: {
        name: env.ADMIN_NAME || 'Platform Administrator',
        email: env.ADMIN_EMAIL.toLowerCase(),
        passwordHash: adminPasswordHash,
        role: UserRole.ADMIN,
        isActive: true
      }
    });
    logger.info(`Admin user ready: ${admin.email}`);

    // 2. Seed Vendor User & Vendor Profile
    const vendorPasswordHash = await bcrypt.hash('Vendor@12345', salt);
    const vendorUser = await prisma.user.upsert({
      where: { email: 'vendor@nexmart.com' },
      update: { role: UserRole.VENDOR },
      create: {
        name: 'Apex Retailers',
        email: 'vendor@nexmart.com',
        passwordHash: vendorPasswordHash,
        role: UserRole.VENDOR,
        phone: '+91 9876543210'
      }
    });

    const vendorProfile = await prisma.vendorProfile.upsert({
      where: { userId: vendorUser.id },
      update: { onboardingStatus: OnboardingStatus.APPROVED },
      create: {
        userId: vendorUser.id,
        businessName: 'Apex Retailers Pvt Ltd',
        businessDescription: 'Premium electronics and lifestyle accessories',
        businessEmail: 'vendor@nexmart.com',
        businessPhone: '+91 9876543210',
        businessAddress: '101 Tech Boulevard, Bangalore, Karnataka - 560001, India',
        gstNumber: '29ABCDE1234F1Z5',
        onboardingStatus: OnboardingStatus.APPROVED,
        approvedAt: new Date()
      }
    });
    logger.info(`Vendor profile ready: ${vendorProfile.businessName}`);

    // 3. Seed Categories
    const electronicsCat = await prisma.category.upsert({
      where: { slug: 'electronics' },
      update: {},
      create: {
        name: 'Electronics & Gadgets',
        slug: 'electronics',
        description: 'Laptops, headphones, accessories and consumer electronics',
        isActive: true
      }
    });

    const fashionCat = await prisma.category.upsert({
      where: { slug: 'fashion' },
      update: {},
      create: {
        name: 'Apparel & Fashion',
        slug: 'fashion',
        description: 'Clothing, footwear, and accessories',
        isActive: true
      }
    });
    logger.info('Categories ready: Electronics, Fashion');

    // 4. Seed Products
    await prisma.product.upsert({
      where: { slug: 'wireless-noise-cancelling-headphones' },
      update: { stock: 45, price: toDecimal(4999.00) },
      create: {
        vendorId: vendorProfile.id,
        categoryId: electronicsCat.id,
        name: 'Wireless Noise-Cancelling Headphones',
        slug: 'wireless-noise-cancelling-headphones',
        description: 'High-fidelity audio with active noise cancellation and 30-hour battery life.',
        price: toDecimal(4999.00),
        comparePrice: toDecimal(7999.00),
        stock: 45,
        status: ProductStatus.ACTIVE,
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'],
        avgRating: 4.8,
        ratingCount: 12,
        searchKeywords: ['headphones', 'wireless', 'audio', 'bluetooth']
      }
    });

    await prisma.product.upsert({
      where: { slug: 'mechanical-rgb-keyboard' },
      update: { stock: 30, price: toDecimal(3499.00) },
      create: {
        vendorId: vendorProfile.id,
        categoryId: electronicsCat.id,
        name: 'Mechanical RGB Gaming Keyboard',
        slug: 'mechanical-rgb-keyboard',
        description: 'Customizable RGB backlighting with tactile mechanical switches.',
        price: toDecimal(3499.00),
        comparePrice: toDecimal(4999.00),
        stock: 30,
        status: ProductStatus.ACTIVE,
        images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800'],
        avgRating: 4.6,
        ratingCount: 8,
        searchKeywords: ['keyboard', 'gaming', 'mechanical', 'rgb']
      }
    });
    logger.info('Products seeded in PostgreSQL');

    // 5. Seed Coupons
    await prisma.coupon.upsert({
      where: { code: 'WELCOME10' },
      update: {},
      create: {
        code: 'WELCOME10',
        discountType: DiscountType.PERCENTAGE,
        discountValue: toDecimal(10.00),
        minOrderValue: toDecimal(500.00),
        maxDiscount: toDecimal(500.00),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        usageLimit: 1000,
        perUserLimit: 1,
        isActive: true
      }
    });

    await prisma.coupon.upsert({
      where: { code: 'FLAT200' },
      update: {},
      create: {
        code: 'FLAT200',
        discountType: DiscountType.FIXED,
        discountValue: toDecimal(200.00),
        minOrderValue: toDecimal(1000.00),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        usageLimit: 500,
        perUserLimit: 1,
        isActive: true
      }
    });
    logger.info('Coupons seeded: WELCOME10, FLAT200');

    logger.info('====================================================');
    logger.info('  Prisma PostgreSQL Database Seeding Complete!');
    logger.info('====================================================');
  } catch (error: any) {
    logger.error('Error seeding PostgreSQL via Prisma:', error);
    throw error;
  }
}

if (process.argv[1]?.endsWith('prismaSeed.ts') || process.argv[1]?.endsWith('prismaSeed.js')) {
  seedPrisma()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default seedPrisma;
