import { Router } from 'express';
import * as vendorController from '../controllers/vendorController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validateBody } from '../middleware/validate.js';
import { UserRole } from '../types/index.js';
import { applyVendorSchema } from '../validators/vendor.validator.js';

const router = Router();

router.post('/apply', authenticate, validateBody(applyVendorSchema), vendorController.apply);
router.get('/profile', authenticate, authorize(UserRole.VENDOR, UserRole.ADMIN), vendorController.getProfile);
router.get('/status', authenticate, vendorController.getStatus);
router.get('/dashboard', authenticate, authorize(UserRole.VENDOR), vendorController.getDashboard);
router.get('/orders', authenticate, authorize(UserRole.VENDOR), vendorController.getOrders);
router.patch('/orders/:id/status', authenticate, authorize(UserRole.VENDOR), vendorController.updateOrderStatus);

export default router;

