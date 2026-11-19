import prisma from '../config/prisma.js';
import { DiscountType } from '../types/index.js';
import { ApiError } from '../utils/apiError.js';
import { serializePrisma, toDecimal } from '../utils/prismaSerializer.js';

export const validateCoupon = async (code: string, orderTotal: number, userId?: string) => {
  const coupon = await prisma.coupon.findFirst({
    where: { code: code.toUpperCase(), isActive: true }
  });
  if (!coupon) {
    throw ApiError.badRequest('Invalid or inactive coupon code');
  }

  // Check expiration
  if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
    throw ApiError.badRequest('Coupon has expired');
  }

  // Check total usage limit
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw ApiError.badRequest('Coupon usage limit reached');
  }

  const minOrderVal = Number(coupon.minOrderValue);
  // Check minimum order value
  if (minOrderVal && orderTotal < minOrderVal) {
    throw ApiError.badRequest(
      `Minimum order value of ₹${minOrderVal} required for this coupon`
    );
  }

  // Check per-user usage limit if userId provided
  if (userId && coupon.perUserLimit) {
    const userUses = await prisma.couponUsage.count({
      where: { couponId: coupon.id, userId }
    });
    if (userUses >= coupon.perUserLimit) {
      throw ApiError.badRequest('You have already used this coupon the maximum allowed times');
    }
  }

  // Calculate discount
  let discount = 0;
  const discountVal = Number(coupon.discountValue);
  const maxDisc = coupon.maxDiscount ? Number(coupon.maxDiscount) : null;

  if (coupon.discountType === DiscountType.PERCENTAGE) {
    discount = (orderTotal * discountVal) / 100;
    if (maxDisc && discount > maxDisc) {
      discount = maxDisc;
    }
  } else {
    discount = Math.min(discountVal, orderTotal);
  }

  discount = Math.round(discount * 100) / 100;

  return {
    valid: true,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: discountVal,
    discountAmount: discount,
    finalTotal: Math.max(0, orderTotal - discount)
  };
};

export const recordCouponUsage = async (code: string, userId: string, orderId?: string) => {
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() }
  });
  if (!coupon) return;

  await prisma.$transaction([
    prisma.coupon.update({
      where: { id: coupon.id },
      data: { usedCount: { increment: 1 } }
    }),
    ...(orderId
      ? [
        prisma.couponUsage.create({
          data: {
            couponId: coupon.id,
            userId,
            orderId
          }
        })
      ]
      : [])
  ]);
};

export const createCoupon = async (data: {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  expiryDate: Date;
  usageLimit?: number;
  perUserLimit?: number;
  isActive?: boolean;
}) => {
  const formattedCode = data.code.toUpperCase();
  const existing = await prisma.coupon.findUnique({ where: { code: formattedCode } });
  if (existing) {
    throw ApiError.conflict('Coupon code already exists');
  }

  const coupon = await prisma.coupon.create({
    data: {
      code: formattedCode,
      discountType: data.discountType,
      discountValue: toDecimal(data.discountValue),
      minOrderValue: toDecimal(data.minOrderValue || 0),
      maxDiscount: data.maxDiscount ? toDecimal(data.maxDiscount) : null,
      expiryDate: new Date(data.expiryDate),
      usageLimit: data.usageLimit ?? null,
      perUserLimit: data.perUserLimit || 1,
      isActive: data.isActive !== undefined ? data.isActive : true
    }
  });

  return serializePrisma(coupon);
};

export const updateCoupon = async (
  id: string,
  data: Partial<{
    code: string;
    discountType: DiscountType;
    discountValue: number;
    minOrderValue: number;
    maxDiscount: number;
    expiryDate: Date;
    usageLimit: number;
    perUserLimit: number;
    isActive: boolean;
  }>
) => {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) {
    throw ApiError.notFound('Coupon not found');
  }

  if (data.code && data.code.toUpperCase() !== coupon.code) {
    const existing = await prisma.coupon.findFirst({
      where: { id: { not: id }, code: data.code.toUpperCase() }
    });
    if (existing) {
      throw ApiError.conflict('Coupon code already exists');
    }
  }

  const updated = await prisma.coupon.update({
    where: { id },
    data: {
      ...(data.code ? { code: data.code.toUpperCase() } : {}),
      ...(data.discountType ? { discountType: data.discountType } : {}),
      ...(data.discountValue !== undefined ? { discountValue: toDecimal(data.discountValue) } : {}),
      ...(data.minOrderValue !== undefined ? { minOrderValue: toDecimal(data.minOrderValue) } : {}),
      ...(data.maxDiscount !== undefined ? { maxDiscount: toDecimal(data.maxDiscount) } : {}),
      ...(data.expiryDate ? { expiryDate: new Date(data.expiryDate) } : {}),
      ...(data.usageLimit !== undefined ? { usageLimit: data.usageLimit } : {}),
      ...(data.perUserLimit !== undefined ? { perUserLimit: data.perUserLimit } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {})
    }
  });

  return serializePrisma(updated);
};

export const deleteCoupon = async (id: string) => {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) {
    throw ApiError.notFound('Coupon not found');
  }
  await prisma.coupon.delete({ where: { id } });
  return { message: 'Coupon deleted successfully' };
};

export const getCoupons = async (params: { page?: number; limit?: number }) => {
  const { page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  const [coupons, total] = await Promise.all([
    prisma.coupon.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.coupon.count()
  ]);

  return {
    data: serializePrisma(coupons),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};
