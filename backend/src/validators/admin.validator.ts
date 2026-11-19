import { z } from 'zod';
import { UserRole } from '../types/index.js';

export const commissionSettingsSchema = z.object({
  commissionPercent: z.coerce
    .number()
    .min(0, 'Commission cannot be negative')
    .max(100, 'Commission cannot exceed 100%')
});

export const userQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  role: z.nativeEnum(UserRole).optional(),
  search: z.string().optional()
});
