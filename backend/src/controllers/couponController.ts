import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as couponService from '../services/couponService.js';
import { success } from '../utils/apiResponse.js';

export const validate = asyncHandler(async (req: Request, res: Response) => {
  const { code, orderTotal } = req.body;
  const result = await couponService.validateCoupon(
    code,
    orderTotal,
    req.user?.userId
  );
  return success(res, result, 'Coupon applied successfully', StatusCodes.OK);
});

export const adminCreate = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await couponService.createCoupon(req.body);
  return success(res, coupon, 'Coupon created successfully', StatusCodes.CREATED);
});

export const adminUpdate = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await couponService.updateCoupon(req.params.id, req.body);
  return success(res, coupon, 'Coupon updated successfully', StatusCodes.OK);
});

export const adminDelete = asyncHandler(async (req: Request, res: Response) => {
  const result = await couponService.deleteCoupon(req.params.id);
  return success(res, result, result.message, StatusCodes.OK);
});

export const adminGetAll = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const result = await couponService.getCoupons({ page, limit });
  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Coupons retrieved successfully',
    data: result.data,
    pagination: result.pagination
  });
});

