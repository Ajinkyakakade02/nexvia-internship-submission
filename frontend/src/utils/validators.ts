import { z } from 'zod';
import { UserRole, ProductStatus, DiscountType } from '@/types';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
    role: z.nativeEnum(UserRole).default(UserRole.CUSTOMER),
    // Vendor specific
    businessName: z.string().optional(),
    businessDescription: z.string().optional(),
    businessEmail: z.string().email('Valid business email is required').optional().or(z.literal('')),
    businessPhone: z.string().optional(),
    businessAddress: z.string().optional(),
    gstNumber: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      if (data.role === UserRole.VENDOR) {
        return !!data.businessName && !!data.businessDescription && !!data.businessEmail;
      }
      return true;
    },
    {
      message: 'Business name, description, and email are required for vendor registration',
      path: ['businessName'],
    }
  );

export const addressSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  addressLine1: z.string().min(5, 'Address line 1 is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().min(6, 'Valid 6-digit pincode is required'),
  isDefault: z.boolean().optional(),
});

export const productSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  price: z.coerce.number().positive('Price must be greater than 0'),
  comparePrice: z.coerce.number().nonnegative().optional(),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  status: z.nativeEnum(ProductStatus).default(ProductStatus.DRAFT),
  images: z.array(z.string()).min(1, 'At least one product image is required'),
});

export const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(5, 'Comment must be at least 5 characters'),
});

export const couponSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').toUpperCase(),
  discountType: z.nativeEnum(DiscountType),
  discountValue: z.coerce.number().positive('Value must be positive'),
  minOrderAmount: z.coerce.number().min(0, 'Min order amount cannot be negative'),
  maxDiscount: z.coerce.number().positive().optional(),
  validFrom: z.string().min(1, 'Start date is required'),
  validUntil: z.string().min(1, 'End date is required'),
  usageLimit: z.coerce.number().int().positive('Usage limit must be at least 1'),
  isActive: z.boolean().default(true),
});
