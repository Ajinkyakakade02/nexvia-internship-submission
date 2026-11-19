import { z } from 'zod';
import { OrderStatus } from '../types/index.js';

export const addressSchema = z.object({
  _id: z.string().optional(),
  id: z.string().optional(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().min(8, 'Phone number must be at least 8 digits'),
  street: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().optional(),
  pincode: z.string().optional(),
  country: z.string().default('India'),
  isDefault: z.boolean().optional()
}).refine(
  (data) => (data.street && data.street.trim().length > 0) || (data.addressLine1 && data.addressLine1.trim().length > 0),
  { message: 'Street or addressLine1 is required', path: ['addressLine1'] }
).refine(
  (data) => (data.postalCode && data.postalCode.trim().length > 0) || (data.pincode && data.pincode.trim().length > 0),
  { message: 'Postal code or pincode is required', path: ['pincode'] }
);

export const createOrderSchema = z
  .object({
    shippingAddressId: z.union([z.string(), z.number()]).optional(),
    shippingAddressIndex: z.number().int().nonnegative().optional(),
    shippingAddress: addressSchema.optional(),
    couponCode: z.string().optional()
  })
  .refine(
    (data) =>
      data.shippingAddressId !== undefined ||
      data.shippingAddressIndex !== undefined ||
      data.shippingAddress !== undefined,
    {
      message: 'Either shippingAddressId, shippingAddressIndex, or shippingAddress object must be provided'
    }
  );

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  trackingNumber: z.string().optional(),
  comment: z.string().optional()
});
