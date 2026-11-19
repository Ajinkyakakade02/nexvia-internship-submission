import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as categoryService from '../services/categoryService.js';
import { success } from '../utils/apiResponse.js';

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const includeInactive = req.query.includeInactive === 'true';
  const categories = await categoryService.getCategories(includeInactive);
  return success(res, categories, 'Categories retrieved successfully', StatusCodes.OK);
});

export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.getCategoryById(req.params.id);
  return success(res, category, 'Category details retrieved', StatusCodes.OK);
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.createCategory(req.body);
  return success(res, category, 'Category created successfully', StatusCodes.CREATED);
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  return success(res, category, 'Category updated successfully', StatusCodes.OK);
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const result = await categoryService.deleteCategory(req.params.id);
  return success(res, result, result.message, StatusCodes.OK);
});

