import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as productService from '../services/productService.js';
import * as searchService from '../services/searchService.js';
import { getStorageProvider } from '../services/storageService.js';
import { success } from '../utils/apiResponse.js';

export const searchProducts = asyncHandler(async (req: Request, res: Response) => {
  const { query, category, vendor, minPrice, maxPrice, inStock, status, sort, page, limit } = req.query;

  const result = await searchService.searchProducts({
    query: query as string,
    category: category as string,
    vendor: vendor as string,
    minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
    inStock: inStock === 'true',
    status: status as string,
    sort: sort as string,
    page: page ? parseInt(page as string) : 1,
    limit: limit ? parseInt(limit as string) : 10
  });

  return success(res, result, 'Elasticsearch search results retrieved successfully', StatusCodes.OK);
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.createProduct(req.user!.userId, req.body);
  return success(res, product, 'Product created successfully', StatusCodes.CREATED);
});

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, category, vendor, minPrice, maxPrice, rating, search, sort, inStock } = req.query;

  const result = await productService.getProducts({
    page: page ? parseInt(page as string) : 1,
    limit: limit ? parseInt(limit as string) : 12,
    category: category as string,
    vendor: vendor as string,
    minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
    rating: rating ? parseFloat(rating as string) : undefined,
    search: search as string,
    sort: sort as string,
    inStock: inStock === 'true'
  });

  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Products retrieved successfully',
    data: result.data,
    pagination: result.pagination
  });
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getProductById(req.params.id);
  return success(res, product, 'Product details retrieved', StatusCodes.OK);
});

export const getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getProductBySlug(req.params.slug);
  return success(res, product, 'Product details retrieved', StatusCodes.OK);
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.updateProduct(
    req.user!.userId,
    req.params.id,
    req.body
  );
  return success(res, product, 'Product updated successfully', StatusCodes.OK);
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const result = await productService.deleteProduct(req.user!.userId, req.params.id);
  return success(res, result, result.message, StatusCodes.OK);
});

export const getVendorProducts = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;
  const search = req.query.search as string;

  const result = await productService.getVendorProducts(req.user!.userId, {
    page,
    limit,
    status
  });

  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Vendor products retrieved',
    data: result.data,
    pagination: result.pagination
  });
});

export const generateUploadUrl = asyncHandler(async (req: Request, res: Response) => {
  const { fileName, contentType } = req.body;
  const storage = getStorageProvider();
  const result = await storage.generateUploadUrl(fileName || 'product-image.jpg', contentType || 'image/jpeg');
  return success(res, result, 'Upload URL generated successfully', StatusCodes.OK);
});

