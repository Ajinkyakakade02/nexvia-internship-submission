import { Router } from 'express';
import * as orderController from '../controllers/orderController.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createOrderSchema } from '../validators/order.validator.js';

const router = Router();

router.use(authenticate);

router.post('/', validateBody(createOrderSchema), orderController.createOrder);
router.get('/', orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);
router.get('/:id/tracking', orderController.getOrderTracking);
router.get('/:id/invoice', orderController.downloadInvoice);

export default router;

