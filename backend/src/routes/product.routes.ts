import { Router } from 'express';
import * as productController from '../controllers/productController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { UserRole } from '../types/index.js';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema
} from '../validators/product.validator.js';

const router = Router();

router.get('/', validateQuery(productQuerySchema), productController.getProducts);
router.get('/search', productController.searchProducts);
router.get('/vendor/my-products', authenticate, authorize(UserRole.VENDOR), productController.getVendorProducts);
router.post('/upload-url', authenticate, authorize(UserRole.VENDOR, UserRole.ADMIN), productController.generateUploadUrl);
router.get('/:id', productController.getProductById);
router.get('/slug/:slug', productController.getProductBySlug);
router.post(
  '/',
  authenticate,
  authorize(UserRole.VENDOR),
  validateBody(createProductSchema),
  productController.createProduct
);
router.patch(
  '/:id',
  authenticate,
  authorize(UserRole.VENDOR, UserRole.ADMIN),
  validateBody(updateProductSchema),
  productController.updateProduct
);
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.VENDOR, UserRole.ADMIN),
  productController.deleteProduct
);

export default router;

