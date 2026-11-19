import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { UserRole } from '../types/index.js';
import { commissionSettingsSchema, userQuerySchema } from '../validators/admin.validator.js';

const router = Router();

router.use(authenticate, authorize(UserRole.ADMIN));

router.get('/dashboard', adminController.getDashboard);
router.get('/users', validateQuery(userQuerySchema), adminController.getUsers);
router.get('/vendors', adminController.getVendors);
router.patch('/vendors/:id/approve', adminController.approveVendor);
router.patch('/vendors/:id/reject', adminController.rejectVendor);
router.get('/products', adminController.getProducts);
router.get('/orders', adminController.getOrders);
router.get('/payments', adminController.getPayments);
router.get('/commissions', adminController.getCommissions);
router.get('/analytics', adminController.getAnalytics);
router.patch('/settings/commission', validateBody(commissionSettingsSchema), adminController.updateCommissionSettings);

export default router;

