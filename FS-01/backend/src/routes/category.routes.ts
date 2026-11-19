import { Router } from 'express';
import * as categoryController from '../controllers/categoryController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validateBody } from '../middleware/validate.js';
import { UserRole } from '../types/index.js';
import {
  createCategorySchema,
  updateCategorySchema
} from '../validators/category.validator.js';

const router = Router();

router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);
router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  validateBody(createCategorySchema),
  categoryController.createCategory
);
router.patch(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validateBody(updateCategorySchema),
  categoryController.updateCategory
);
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  categoryController.deleteCategory
);

export default router;

