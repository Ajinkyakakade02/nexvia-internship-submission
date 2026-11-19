import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as reviewService from '../services/reviewService.js';
import { success } from '../utils/apiResponse.js';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const review = await reviewService.createReview(req.user!.userId, req.body);
  return success(res, review, 'Review submitted successfully', StatusCodes.CREATED);
});

export const getProductReviews = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const result = await reviewService.getProductReviews(req.params.productId, { page, limit });
  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Reviews retrieved',
    data: result.data,
    pagination: result.pagination
  });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const review = await reviewService.updateReview(req.user!.userId, req.params.id, req.body);
  return success(res, review, 'Review updated successfully', StatusCodes.OK);
});

export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  const result = await reviewService.deleteReview(
    req.user!.userId,
    req.user!.role,
    req.params.id
  );
  return success(res, result, result.message, StatusCodes.OK);
});

