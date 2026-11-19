import { Router } from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/create-order', authenticate, paymentController.createOrder);
router.post('/verify', authenticate, paymentController.verify);
router.post('/webhook', paymentController.webhook);
router.get('/:id', authenticate, paymentController.getById);

export default router;

