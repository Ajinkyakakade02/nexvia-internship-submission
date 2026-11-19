import { Router } from 'express';
import * as reviewController from '../controllers/reviewController.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createReviewSchema, updateReviewSchema } from '../validators/review.validator.js';

const router = Router();

router.get('/products/:productId', reviewController.getProductReviews);
router.post('/', authenticate, validateBody(createReviewSchema), reviewController.create);
router.patch('/:id', authenticate, validateBody(updateReviewSchema), reviewController.update);
router.delete('/:id', authenticate, reviewController.deleteReview);

export default router;

