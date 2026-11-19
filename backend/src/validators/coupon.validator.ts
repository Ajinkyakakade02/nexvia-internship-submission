import { z } from 'zod';
import { DiscountType } from '../types/index.js';

export const createCouponSchema = z.object({
  code: z.string().min(3).toUpperCase(),
  discountType: z.nativeEnum(DiscountType),
  discountValue: z.coerce.number().positive(),
  minOrderValue: z.coerce.number().nonnegative().optional().default(0),
  maxDiscount: z.coerce.number().positive().optional(),
  expiryDate: z.coerce.date(),
  usageLimit: z.coerce.number().int().positive().optional(),
  perUserLimit: z.coerce.number().int().positive().optional().default(1),
  isActive: z.boolean().optional().default(true)
});

export const updateCouponSchema = createCouponSchema.partial();

export const validateCouponSchema = z
  .object({
    code: z.string().min(1, 'Coupon code is required'),
    orderTotal: z.coerce.number().positive('Order total must be greater than 0').optional(),
    orderAmount: z.coerce.number().positive('Order amount must be greater than 0').optional()
  })
  .refine((data) => data.orderTotal !== undefined || data.orderAmount !== undefined, {
    message: 'orderTotal or orderAmount is required',
    path: ['orderTotal']
  })
  .transform((data) => ({
    code: data.code.toUpperCase(),
    orderTotal: (data.orderTotal !== undefined ? data.orderTotal : data.orderAmount)!
  }));
