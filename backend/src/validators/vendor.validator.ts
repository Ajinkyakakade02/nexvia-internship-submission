import { z } from 'zod';

export const applyVendorSchema = z.object({
  businessName: z.string().min(2, 'Business name is required'),
  businessDescription: z.string().optional(),
  businessEmail: z.string().email('Invalid business email address'),
  businessPhone: z.string().min(8, 'Valid business phone is required'),
  businessAddress: z.string().min(5, 'Business address is required'),
  gstNumber: z.string().optional()
});

export const vendorApprovalSchema = z.object({
  adminNotes: z.string().optional()
});
