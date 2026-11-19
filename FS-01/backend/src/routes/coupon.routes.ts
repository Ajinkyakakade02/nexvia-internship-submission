import { Router } from 'express';
import * as couponController from '../controllers/couponController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validateBody } from '../middleware/validate.js';
import { UserRole } from '../types/index.js';
import {
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema
} from '../validators/coupon.validator.js';

const router = Router();

router.post('/validate', authenticate, validateBody(validateCouponSchema), couponController.validate);

// Admin Coupon Management
router.get('/admin', authenticate, authorize(UserRole.ADMIN), couponController.adminGetAll);
router.post('/admin', authenticate, authorize(UserRole.ADMIN), validateBody(createCouponSchema), couponController.adminCreate);
router.patch('/admin/:id', authenticate, authorize(UserRole.ADMIN), validateBody(updateCouponSchema), couponController.adminUpdate);
router.delete('/admin/:id', authenticate, authorize(UserRole.ADMIN), couponController.adminDelete);

export default router;

